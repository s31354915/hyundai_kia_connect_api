import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import {
  ApiImpl,
  ClimateRequestOptions,
  OTPRequest,
} from "./ApiImpl.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import {
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  LOGIN_TOKEN_LIFETIME_SECONDS,
  ORDER_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
  OTP_NOTIFY_TYPE,
} from "./const.js";
import { APIError, AuthenticationError } from "./exceptions.js";
import { getChildValue, parseDatetime } from "./utils.js";

/**
 * KiaUvoApiUSA
 *
 * Cloudflare Workers port of Kia USA region API.
 * Handles OTP authentication flow and stateless request handling.
 */
export class KiaUvoApiUSA extends ApiImpl {
  private LANGUAGE: string;
  private BASE_URL: string = "api.owners.kia.com";
  private API_URL: string = "https://api.owners.kia.com/apigw/v1/";
  private device_id: string;

  constructor(region: number, brand: number, language: string) {
    super();
    this.LANGUAGE = language;
    this.temperature_range = Array.from({ length: 22 }, (_, i) => 62 + i);
    this.device_id = uuidv4().toUpperCase();
  }

  /**
   * Generate base API headers for all requests
   */
  private api_headers(): Record<string, string> {
    const offset = new Date().getTimezoneOffset() / 60;
    // Generate clientuuid as hash of device_id (similar to iOS app)
    const client_uuid = uuidv5(this.device_id, "6ba7b810-9dad-11d1-80b4-00c04fd430c8");

    const headers: Record<string, string> = {
      "content-type": "application/json;charset=utf-8",
      accept: "application/json",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "accept-charset": "utf-8",
      apptype: "L",
      appversion: "7.22.0",
      clientid: "SPACL716-APL",
      clientuuid: client_uuid,
      from: "SPA",
      host: this.BASE_URL,
      language: "0",
      offset: String(Math.floor(-offset)),
      ostype: "iOS",
      osversion: "15.8.5",
      phonebrand: "iPhone",
      secretkey: "sydnat-9kykci-Kuhtep-h5nK",
      to: "APIGW",
      tokentype: "A",
      "user-agent": "KIAPrimo_iOS/37 CFNetwork/1335.0.3.4 Darwin/21.6.0",
      deviceid: this.device_id,
    };

    const date = new Date().toUTCString();
    headers.date = date;

    return headers;
  }

  /**
   * Generate authenticated headers (includes sid and vinkey)
   */
  private authed_api_headers(token: Token, vehicle: Vehicle): Record<string, string> {
    const headers = this.api_headers();
    headers.sid = token.access_token || "";
    headers.vinkey = vehicle.key || "";
    return headers;
  }

  /**
   * Handle response errors based on status code
   */
  private async handle_response_error(response: Response): Promise<void> {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.status?.statusCode === 0) {
        return; // Success
      }
      if (
        json.status?.statusCode === 1 &&
        json.status?.errorType === 1 &&
        [1003, 1005].includes(json.status?.errorCode)
      ) {
        throw new AuthenticationError("Session invalid");
      }
      throw new Error(`API error: ${text}`);
    } catch (e) {
      if (e instanceof AuthenticationError) throw e;
      throw new Error(`Invalid API response: ${text}`);
    }
  }

  /**
   * Send OTP to email or phone
   */
  private async _send_otp(
    otp_key: string,
    notify_type: string,
    xid: string,
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "cmm/sendOTP";
    const headers = this.api_headers();
    headers.otpkey = otp_key;
    headers.notifytype = notify_type;
    headers.xid = xid;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    const data = (await response.json()) as Record<string, any>;
    return data;
  }

  /**
   * Verify OTP code and return sid and rmtoken
   */
  private async _verify_otp(
    otp_key: string,
    otp_code: string,
    xid: string,
  ): Promise<[string, string]> {
    const url = this.API_URL + "cmm/verifyOTP";
    const headers = this.api_headers();
    headers.otpkey = otp_key;
    headers.xid = xid;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ otp: otp_code }),
    });

    const json = (await response.json()) as Record<string, any>;
    if (json.status?.statusCode !== 0) {
      throw new Error(
        `OTP verification failed: ${json.status?.errorMessage || "Unknown error"}`,
      );
    }

    const sid = response.headers.get("sid");
    const rmtoken = response.headers.get("rmtoken");

    if (!sid || !rmtoken) {
      throw new Error(
        `No sid or rmtoken in OTP verification response. Headers: ${JSON.stringify(
          Object.fromEntries(response.headers),
        )}`,
      );
    }

    return [sid, rmtoken];
  }

  /**
   * Complete login with sid and rmtoken to get final session id
   */
  private async _complete_login_with_otp(
    username: string,
    password: string,
    sid: string,
    rmtoken: string,
  ): Promise<string> {
    const url = this.API_URL + "prof/authUser";
    const data = {
      deviceKey: this.device_id,
      deviceType: 2,
      userCredential: { userId: username, password },
    };

    const headers = this.api_headers();
    headers.sid = sid;
    headers.rmtoken = rmtoken;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const final_sid = response.headers.get("sid");
    if (!final_sid) {
      const text = await response.text();
      throw new Error(`No final sid returned. Response: ${text}`);
    }

    return final_sid;
  }

  /**
   * Public helper to send OTP to the selected destination
   */
  async send_otp(
    otp_request: OTPRequest,
    notify_type: OTP_NOTIFY_TYPE,
  ): Promise<void> {
    if (!otp_request.otp_key || !otp_request.request_id) {
      throw new Error("Missing otp_key or request_id in OTPRequest");
    }
    await this._send_otp(otp_request.otp_key, notify_type, otp_request.request_id);
  }

  /**
   * Verify OTP and complete the login producing a Token
   */
  async verify_otp_and_complete_login(
    username: string,
    password: string,
    otp_code: string,
    otp_request: OTPRequest,
    pin?: string | null,
  ): Promise<Token> {
    if (!otp_request.otp_key || !otp_request.request_id) {
      throw new Error("Missing otp_key or request_id in OTPRequest");
    }

    const [sid, rmtoken] = await this._verify_otp(
      otp_request.otp_key,
      otp_code,
      otp_request.request_id,
    );

    const final_sid = await this._complete_login_with_otp(username, password, sid, rmtoken);

    const valid_until = new Date(
      Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000,
    );

    return new Token({
      username,
      password,
      access_token: final_sid,
      refresh_token: rmtoken,
      valid_until: valid_until.toISOString(),
      device_id: this.device_id,
      pin: pin || null,
    });
  }

  /**
   * Login into cloud endpoints and return Token or OTPRequest
   */
  async login(
    username: string,
    password: string,
    pin?: string | null,
  ): Promise<Token | OTPRequest> {
    const url = this.API_URL + "prof/authUser";
    const data: Record<string, any> = {
      deviceKey: this.device_id,
      deviceType: 2,
      userCredential: { userId: username, password },
      tncFlag: 1,
    };

    const headers = this.api_headers();

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const response_json = (await response.json()) as Record<string, any>;
    const session_id = response.headers.get("sid");

    if (session_id) {
      const valid_until = new Date(
        Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000,
      );

      return new Token({
        username,
        password,
        access_token: session_id,
        refresh_token: null,
        valid_until: valid_until.toISOString(),
        device_id: this.device_id,
        pin: pin || null,
      });
    }

    if (response_json.payload?.otpKey) {
      const payload = response_json.payload;
      return new OTPRequest({
        otp_key: payload.otpKey,
        request_id: response.headers.get("xid") || "",
        email: payload.email || null,
        sms: payload.phone || null,
        has_email: Boolean(payload.hasEmail),
        has_sms: Boolean(payload.hasPhone),
      });
    }

    throw new Error(
      `No session id returned in login. Response: ${JSON.stringify(response_json)}`,
    );
  }

  /**
   * Refresh the token using the refresh token
   */
  async refresh_access_token(token: Token): Promise<Token | OTPRequest> {
    return this.login(token.username || "", token.password || "");
  }

  /**
   * Return all Vehicle instances for a given Token
   */
  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.API_URL + "ownr/gvl";
    const headers = this.api_headers();
    headers.sid = token.access_token || "";

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const json = (await response.json()) as Record<string, any>;

    if (!json.payload) {
      throw new APIError("Missing payload in response");
    }

    const result: Vehicle[] = [];
    for (const entry of json.payload.vehicleSummary || []) {
      const vehicle = new Vehicle();
      vehicle.id = entry.vehicleIdentifier;
      vehicle.name = entry.nickName;
      vehicle.model = entry.modelName;
      vehicle.key = entry.vehicleKey;
      vehicle.engine_type = this._engine_type_from_fuel_type(entry.fuelType);
      vehicle.timezone = this.data_timezone;
      result.push(vehicle);
    }

    return result;
  }

  /**
   * Infer engine type from fuel type
   */
  private _engine_type_from_fuel_type(fuel_type: number | null): string | null {
    // Only fuelType=4 (EV) is confirmed against a live Kia USA account
    // (2020 Niro EV). Mappings for ICE/PHEV/HEV are unknown, so leave
    // engine_type as None for those and let _update_vehicle_properties
    // refine it from the cached state's evStatus presence.
    if (fuel_type === 4) {
      return ENGINE_TYPES.EV;
    }
    return null;
  }

  /**
   * Refresh the vehicle data provided in get_vehicles.
   * Required for Kia USA as key is session specific
   */
  async refresh_vehicles(
    token: Token,
    vehicles: Vehicle[] | Record<string, Vehicle>,
  ): Promise<void> {
    const url = this.API_URL + "ownr/gvl";
    const headers = this.api_headers();
    headers.sid = token.access_token || "";

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const json = (await response.json()) as Record<string, any>;

    if (!json.payload) {
      throw new APIError("Missing payload in response");
    }

    if (Array.isArray(vehicles)) {
      // vehicles is an array
      const vehicle = vehicles[0];
      for (const entry of json.payload.vehicleSummary || []) {
        if (vehicle && vehicle.id === entry.vehicleIdentifier) {
          vehicle.name = entry.nickName;
          vehicle.model = entry.modelName;
          vehicle.key = entry.vehicleKey;
        }
      }
    } else {
      // vehicles is a dict/map
      for (const entry of json.payload.vehicleSummary || []) {
        const vid = entry.vehicleIdentifier;
        if (vid === null || vid === undefined) continue;

        const vobj = vehicles[vid];
        if (vobj) {
          vobj.name = entry.nickName;
          vobj.model = entry.modelName;
          vobj.key = entry.vehicleKey;
        } else {
          const newVehicle = new Vehicle();
          newVehicle.id = vid;
          newVehicle.name = entry.nickName;
          newVehicle.model = entry.modelName;
          newVehicle.key = entry.vehicleKey;
          newVehicle.timezone = this.data_timezone;
          vehicles[vid] = newVehicle;
        }
      }
    }
  }

  /**
   * Update vehicle with cached state
   */
  async update_vehicle_with_cached_state(token: Token, vehicle: Vehicle): Promise<void> {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);

    // Only EV/PHEV vehicles have charge targets; skip the /evc/gts call
    // for ICE vehicles
    if (
      vehicle.engine_type === ENGINE_TYPES.EV ||
      vehicle.engine_type === ENGINE_TYPES.PHEV
    ) {
      await this._get_charge_targets(token, vehicle);
    }
  }

  /**
   * Force refresh vehicle state
   */
  async force_refresh_vehicle_state(token: Token, vehicle: Vehicle): Promise<void> {
    const state = await this._get_forced_vehicle_state(token, vehicle);
    // Temp call a cached state since we are removing this from parent logic
    await this.update_vehicle_with_cached_state(token, vehicle);
    // The cmm/gvi (cached) endpoint does not return targetSOC for some
    // vehicles (e.g. 2020 Kia Niro EV), but the rems/rvs (force refresh)
    // response does include it. Parse charge limits from the force refresh
    // response after the cached update so they aren't lost.
    this._update_charge_limits_from_force_refresh(vehicle, state);
  }

  /**
   * Get cached vehicle data and update Vehicle instance with it
   */
  private _update_vehicle_properties(vehicle: Vehicle, state: Record<string, any>): void {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.syncDate.utc",
      ),
      this.data_timezone,
    );

    const odom_val = getChildValue(state, "vehicleConfig.vehicleDetail.vehicle.mileage");
    if (odom_val !== null) {
      vehicle.odometer = [odom_val, DISTANCE_UNITS[3]!];
    }

    const next_svc_val = getChildValue(state, "service.imatServiceOdometer");
    if (next_svc_val !== null) {
      vehicle.next_service_distance = [next_svc_val, DISTANCE_UNITS[3]!];
    }

    const last_svc_val = getChildValue(state, "service.msopServiceOdometer");
    if (last_svc_val !== null) {
      vehicle.last_service_distance = [last_svc_val, DISTANCE_UNITS[3]!];
    }

    vehicle.car_battery_percentage = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.stateOfCharge",
    );

    vehicle.engine_is_running = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.engine",
    );

    let air_temp = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airTemp.value",
    );

    if (air_temp === "LOW") {
      air_temp = this.temperature_range?.[0];
    } else if (air_temp === "HIGH") {
      air_temp = this.temperature_range?.[this.temperature_range.length - 1];
    }

    if (air_temp != null) {
      vehicle.air_temperature = [air_temp, TEMPERATURE_UNITS[1]!];
    }

    vehicle.defrost_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.defrost",
    );

    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.washerFluidStatus",
    );

    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.breakOilStatus",
    );

    vehicle.smart_key_battery_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.smartKeyBatteryWarning",
    );

    vehicle.tire_pressure_all_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.tirePressure.all",
    );

    vehicle.steering_wheel_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.steeringWheel",
    );

    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.rearWindow",
    );

    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.sideMirror",
    );

    vehicle.front_left_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.flSeatHeatState",
    );

    vehicle.front_right_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.frSeatHeatState",
    );

    vehicle.rear_left_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.rlSeatHeatState",
    );

    vehicle.rear_right_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.rrSeatHeatState",
    );

    vehicle.is_locked = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorLock",
    );

    vehicle.front_left_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontLeft",
    );

    vehicle.front_right_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontRight",
    );

    vehicle.back_left_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backLeft",
    );

    vehicle.back_right_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backRight",
    );

    vehicle.hood_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.hood",
    );

    vehicle.sunroof_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.sunroofOpen",
    );

    vehicle.trunk_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.trunk",
    );

    vehicle.front_left_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.frontLeft",
    );

    vehicle.front_right_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.frontRight",
    );

    vehicle.back_left_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.backLeft",
    );

    vehicle.back_right_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.backRight",
    );

    if (vehicle.front_left_window_is_open == null) {
      vehicle.front_left_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowFL",
      );
    }

    if (vehicle.front_right_window_is_open == null) {
      vehicle.front_right_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowFR",
      );
    }

    if (vehicle.back_left_window_is_open == null) {
      vehicle.back_left_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowRL",
      );
    }

    if (vehicle.back_right_window_is_open == null) {
      vehicle.back_right_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowRR",
      );
    }

    vehicle.ev_battery_percentage = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryStatus",
    );

    vehicle.ev_battery_is_charging = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryCharge",
    );

    vehicle.ev_battery_is_plugged_in = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryPlugin",
    );

    vehicle.ev_charging_power = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.realTimePower",
    );

    const chargeDict = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.targetSOC",
    );

    if (chargeDict != null && Array.isArray(chargeDict)) {
      try {
        const ac_values = chargeDict
          .filter((x: Record<string, any>) => x.plugType === 1)
          .map((x: Record<string, any>) => x.targetSOClevel);

        const dc_values = chargeDict
          .filter((x: Record<string, any>) => x.plugType === 0)
          .map((x: Record<string, any>) => x.targetSOClevel);

        if (
          ac_values.length > 0 &&
          typeof ac_values[ac_values.length - 1] === "number" &&
          !Array.isArray(ac_values[ac_values.length - 1])
        ) {
          vehicle.ev_charge_limits_ac = Math.floor(ac_values[ac_values.length - 1]);
        }

        if (
          dc_values.length > 0 &&
          typeof dc_values[dc_values.length - 1] === "number" &&
          !Array.isArray(dc_values[dc_values.length - 1])
        ) {
          vehicle.ev_charge_limits_dc = Math.floor(dc_values[dc_values.length - 1]);
        }
      } catch (e) {
        // Failed to parse targetSOC
      }
    }

    const ev_range_val = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value",
    );
    const ev_range_unit = DISTANCE_UNITS[
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit",
      )
    ];
    if (ev_range_val !== null && ev_range_unit !== null) {
      vehicle.ev_driving_range = [ev_range_val, ev_range_unit];
    }

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.timeInterval.value",
      ),
      "m",
    ];

    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc1.value",
      ),
      "m",
    ];

    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc2.value",
      ),
      "m",
    ];

    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc3.value",
      ),
      "m",
    ];

    vehicle.ev_battery_precondition_enabled = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryPrecondition",
    );

    const total_range_val = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value",
    );
    const total_range_unit = DISTANCE_UNITS[
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit",
      )
    ];
    if (total_range_val !== null && total_range_unit !== null) {
      vehicle.total_driving_range = [total_range_val, total_range_unit];
    }

    const gasModeRangeValue = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value",
    );

    if (gasModeRangeValue != null) {
      const gas_range_unit = DISTANCE_UNITS[
        getChildValue(
          state,
          "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit",
        )
      ];
      if (gas_range_unit !== null) {
        vehicle.fuel_driving_range = [gasModeRangeValue, gas_range_unit];
      }
    } else {
      const dist_val = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.distanceToEmpty.value",
      );
      const dist_unit = DISTANCE_UNITS[
        getChildValue(
          state,
          "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.distanceToEmpty.unit",
        )
      ];
      if (dist_val !== null && dist_unit !== null) {
        vehicle.fuel_driving_range = [dist_val, dist_unit];
      }
    }

    vehicle.fuel_level_is_low = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.lowFuelLight",
    );

    vehicle.fuel_level = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.fuelLevel",
    );

    vehicle.air_control_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airCtrl",
    );

    const lat = getChildValue(state, "lastVehicleInfo.location.coord.lat");
    if (lat != null) {
      const lon = getChildValue(state, "lastVehicleInfo.location.coord.lon");
      const utc = getChildValue(state, "lastVehicleInfo.location.syncDate.utc");
      vehicle.location = [
        lat,
        lon,
        parseDatetime(utc, this.data_timezone),
      ];
    }

    const next_svc_maintenance_val = getChildValue(state, "vehicleConfig.maintenance.nextServiceMile");
    if (next_svc_maintenance_val !== null) {
      vehicle.next_service_distance = [next_svc_maintenance_val, DISTANCE_UNITS[3]!];
    }

    vehicle.dtc_count = getChildValue(
      state,
      "lastVehicleInfo.activeDTC.dtcActiveCount",
    );

    vehicle.dtc_descriptions = getChildValue(
      state,
      "lastVehicleInfo.activeDTC.dtcCategory",
    );

    if (vehicle.engine_type == null) {
      // fuelType in ownr/gvl only reliably maps 4 -> EV; for anything
      // else we infer from the cached state. Presence of an evStatus
      // block means a high-voltage battery (EV or PHEV); absence
      // means ICE. PHEVs additionally report a gasModeRange block,
      // which pure EVs never do.
      const ev_status = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus",
      );

      if (ev_status != null) {
        const gas_mode_range = getChildValue(
          state,
          "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value",
        );

        if (gas_mode_range != null) {
          vehicle.engine_type = ENGINE_TYPES.PHEV;
        } else {
          vehicle.engine_type = ENGINE_TYPES.EV;
        }
      } else {
        vehicle.engine_type = ENGINE_TYPES.ICE;
      }
    }

    vehicle.data = state;
  }

  /**
   * Get cached vehicle state
   */
  private async _get_cached_vehicle_state(
    token: Token,
    vehicle: Vehicle,
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "cmm/gvi";
    const body = {
      vehicleConfigReq: {
        airTempRange: "0",
        maintenance: "1",
        seatHeatCoolOption: "0",
        vehicle: "1",
        vehicleFeature: "0",
      },
      vehicleInfoReq: {
        drivingActivty: "0",
        dtc: "1",
        enrollment: "1",
        functionalCards: "0",
        location: "1",
        vehicleStatus: "1",
        weather: "0",
      },
      vinKey: [vehicle.key],
    };

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const response_json = (await response.json()) as Record<string, any>;
    await this.handle_response_error(response);

    return response_json.payload.vehicleInfoList[0];
  }

  /**
   * Get forced vehicle state
   */
  private async _get_forced_vehicle_state(
    token: Token,
    vehicle: Vehicle,
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "rems/rvs";
    const body = {
      requestType: 0,
      // value of 1 would return cached results instead of forcing update
    };

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const response_json = (await response.json()) as Record<string, any>;
    return response_json;
  }

  /**
   * Parse targetSOC from the rems/rvs (force refresh) response.
   */
  private _update_charge_limits_from_force_refresh(
    vehicle: Vehicle,
    state: Record<string, any>,
  ): void {
    const charge_dict = getChildValue(
      state,
      "payload.vehicleStatusRpt.vehicleStatus.evStatus.targetSOC",
    );

    if (charge_dict == null || !Array.isArray(charge_dict)) {
      return;
    }

    try {
      const ac_values = charge_dict
        .filter((x: Record<string, any>) => x.plugType === 1)
        .map((x: Record<string, any>) => x.targetSOClevel);

      const dc_values = charge_dict
        .filter((x: Record<string, any>) => x.plugType === 0)
        .map((x: Record<string, any>) => x.targetSOClevel);

      const new_ac = ac_values.length > 0 ? ac_values[ac_values.length - 1] : null;
      const new_dc = dc_values.length > 0 ? dc_values[dc_values.length - 1] : null;

      if (
        typeof new_ac === "number" &&
        !Array.isArray(new_ac)
      ) {
        vehicle.ev_charge_limits_ac = Math.floor(new_ac);
      } else if (
        new_ac != null &&
        vehicle.ev_charge_limits_ac != null
      ) {
        // Keep cached value
      } else if (new_ac != null) {
        // new_ac is invalid and no cached value to preserve
      }

      if (
        typeof new_dc === "number" &&
        !Array.isArray(new_dc)
      ) {
        vehicle.ev_charge_limits_dc = Math.floor(new_dc);
      } else if (
        new_dc != null &&
        vehicle.ev_charge_limits_dc != null
      ) {
        // Keep cached value
      } else if (new_dc != null) {
        // new_dc is invalid and no cached value to preserve
      }
    } catch (err) {
      // Failed to parse targetSOC
    }
  }

  /**
   * Read current charge targets via the dedicated /evc/gts endpoint.
   */
  private async _get_charge_targets(token: Token, vehicle: Vehicle): Promise<void> {
    const url = this.API_URL + "evc/gts";

    try {
      const headers = this.authed_api_headers(token, vehicle);
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      const response_json = (await response.json()) as Record<string, any>;

      if (response_json.status?.statusCode !== 0) {
        return;
      }

      const target_soc_list = response_json.payload?.targetSOClist;
      if (!target_soc_list || !Array.isArray(target_soc_list)) {
        return;
      }

      for (const entry of target_soc_list) {
        const plug_type = entry.plugType;
        const level = entry.targetSOClevel;

        if (typeof level !== "number" || Array.isArray(level)) {
          continue;
        }

        const level_int = Math.floor(level);
        if (level_int <= 0) {
          // Skip zero/negative values - typically returned on fresh
          // sessions before server-side cache populates
          continue;
        }

        if (plug_type === 1) {
          vehicle.ev_charge_limits_ac = level_int;
        } else if (plug_type === 0) {
          vehicle.ev_charge_limits_dc = level_int;
        }
      }
    } catch (err) {
      // Failed to get charge targets
    }
  }

  /**
   * Check action status
   */
  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    action_id: string,
    synchronous: boolean = false,
    timeout: number = 0,
  ): Promise<ORDER_STATUS> {
    const url = this.API_URL + "cmm/gts";
    const body = { xid: action_id };

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const response_json = (await response.json()) as Record<string, any>;
    await this.handle_response_error(response);

    const last_action_completed = Object.values(response_json.payload || {}).every(
      (v) => v === 0,
    );

    return last_action_completed ? ORDER_STATUS.SUCCESS : ORDER_STATUS.PENDING;
  }

  /**
   * Lock or unlock vehicle
   */
  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION,
  ): Promise<string> {
    let url: string;

    if (action === VEHICLE_LOCK_ACTION.LOCK) {
      url = this.API_URL + "rems/door/lock";
    } else {
      url = this.API_URL + "rems/door/unlock";
    }

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }

  /**
   * Map seat level to seat settings
   */
  private _seat_settings(level: number | null): Record<string, any> {
    // See const.SEAT_STATUS for the list and descriptions of levels.
    // The values were determined empirically
    if (level === 8) {
      // High heat
      return {
        heatVentType: 1,
        heatVentLevel: 4,
        heatVentStep: 1,
      };
    } else if (level === 7) {
      // Medium heat
      return {
        heatVentType: 1,
        heatVentLevel: 3,
        heatVentStep: 2,
      };
    } else if (level === 6) {
      // Low heat
      return {
        heatVentType: 1,
        heatVentLevel: 2,
        heatVentStep: 3,
      };
    } else if (level === 5) {
      // High cool
      return {
        heatVentType: 2,
        heatVentLevel: 4,
        heatVentStep: 1,
      };
    } else if (level === 4) {
      // Medium cool
      return {
        heatVentType: 2,
        heatVentLevel: 3,
        heatVentStep: 2,
      };
    } else if (level === 3) {
      // Low cool
      return {
        heatVentType: 2,
        heatVentLevel: 2,
        heatVentStep: 3,
      };
    } else if (level === 1) {
      // Generically on, let's assume high heat
      return {
        heatVentType: 1,
        heatVentLevel: 4,
        heatVentStep: 1,
      };
    } else {
      // Off
      return {
        heatVentType: 0,
        heatVentLevel: 1,
        heatVentStep: 0,
      };
    }
  }

  /**
   * Start climate control
   */
  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions,
  ): Promise<string> {
    const url = this.API_URL + "rems/start";

    if (options.set_temp == null) {
      options.set_temp = 70;
    }

    let set_temp: string | number = options.set_temp;

    if (set_temp < 62) {
      set_temp = "LOW";
    } else if (set_temp > 82) {
      set_temp = "HIGH";
    }

    if (options.climate == null) {
      options.climate = true;
    }

    if (options.heating == null) {
      options.heating = 0;
    }

    if (options.defrost == null) {
      options.defrost = false;
    }

    if (options.duration == null) {
      options.duration = 5;
    }

    if (options.steering_wheel == null) {
      options.steering_wheel = 0;
    }

    const body = {
      remoteClimate: {
        airTemp: {
          unit: 1,
          value: String(set_temp),
        },
        airCtrl: options.climate,
        defrost: options.defrost,
        heatingAccessory: {
          rearWindow: [1, 2, 4].includes(options.heating) ? 1 : 0,
          sideMirror: [1, 4].includes(options.heating) ? 1 : 0,
          steeringWheel: [1, 2].includes(options.steering_wheel) ? 1 : 0,
          steeringWheelStep: options.steering_wheel,
        },
        ignitionOnDuration: {
          unit: 4,
          value: options.duration,
        },
      },
    };

    // Kia seems to now be checking if you can set the heated/vented seats at
    // the car level only add to body if the option is not none for any of
    // the seats
    if (
      options.front_left_seat != null ||
      options.front_right_seat != null ||
      options.rear_left_seat != null ||
      options.rear_right_seat != null
    ) {
      (body.remoteClimate as Record<string, any>).heatVentSeat = {
        driverSeat: this._seat_settings(options.front_left_seat),
        passengerSeat: this._seat_settings(options.front_right_seat),
        rearLeftSeat: this._seat_settings(options.rear_left_seat),
        rearRightSeat: this._seat_settings(options.rear_right_seat),
      };
    }

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }

  /**
   * Stop climate control
   */
  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "rems/stop";

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }

  /**
   * Start charging
   */
  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "evc/charge";
    const body = { chargeRatio: 100 };

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }

  /**
   * Stop charging
   */
  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "evc/cancel";

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }

  /**
   * Set charge limits (AC and DC)
   */
  async set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number,
  ): Promise<string> {
    const url = this.API_URL + "evc/sts";
    const body = {
      targetSOClist: [
        {
          plugType: 0,
          targetSOClevel: Math.floor(dc),
        },
        {
          plugType: 1,
          targetSOClevel: Math.floor(ac),
        },
      ],
    };

    const headers = this.authed_api_headers(token, vehicle);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    await this.handle_response_error(response);

    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }

    return xid;
  }
}
