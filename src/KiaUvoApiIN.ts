import {
  ApiImpl,
  ClimateRequestOptions,
  OTPRequest,
} from "./ApiImpl.js";
import { ApiImplType1, checkResponseForErrors } from "./ApiImplType1.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import { getChildValue, getHexTempIntoIndex, getIndexIntoHexTemp } from "./utils.js";
import {
  DOMAIN,
  DISTANCE_UNITS,
  ENGINE_TYPES,
  BRANDS,
  BRAND_HYUNDAI,
  BRAND_KIA,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
  VALET_MODE_ACTION,
} from "./const.js";
import { AuthenticationError } from "./exceptions.js";
import {
  DailyDrivingStats,
  DayTripInfo,
  DayTripCounts,
  MonthTripInfo,
  TripInfo,
} from "./vehicle.js";

const USER_AGENT_OK_HTTP = "okhttp/3.12.0";

interface OAuthCookies {
  [key: string]: string;
}

export class KiaUvoApiIN extends ApiImplType1 {
  data_timezone = "Asia/Kolkata";
  temperature_range: number[] = Array.from({ length: 32 }, (_, i) => (i + 14) * 0.5);

  brand: number;
  BASE_DOMAIN: string = "";
  PORT: number = 8080;
  CCSP_SERVICE_ID: string = "";
  APP_ID: string = "";
  CFB: Uint8Array = new Uint8Array();
  BASIC_AUTHORIZATION: string = "";
  LOGIN_FORM_HOST: string = "";
  PUSH_TYPE: string = "";
  GCM_SENDER_ID: number = 974204007939;
  BASE_URL: string = "";
  USER_API_URL: string = "";
  SPA_API_URL: string = "";
  SPA_API_URL_V2: string = "";
  CLIENT_ID: string = "";

  constructor(brand: number) {
    super();
    this.brand = brand;

    if (BRANDS[brand] === BRAND_HYUNDAI) {
      this.BASE_DOMAIN = "prd.in-ccapi.hyundai.connected-car.io";
      this.PORT = 8080;
      this.CCSP_SERVICE_ID = "e5b3f6d0-7f83-43c9-aff3-a254db7af368";
      this.APP_ID = "5a27df80-4ca1-4154-8c09-6f4029d91cf7";
      this.CFB = this.base64Decode(
        "RFtoRq/vDXJmRndoZaZQyfOot7OrIqGVFj96iY2WL3yyH5Z/pUvlUhqmCxD2t+D65SQ="
      );
      this.BASIC_AUTHORIZATION =
        "Basic ZTViM2Y2ZDAtN2Y4My00M2M5LWFmZjMtYTI1NGRiN2FmMzY4OjVKRk9DcjZDMjRPZk96bERxWnA3RXdxcmtMMFd3MDRVYXhjRGlFNlVkM3FJNVNFNA==";
      this.LOGIN_FORM_HOST = "prd.in-ccapi.hyundai.connected-car.io";
      this.PUSH_TYPE = "GCM";
    } else if (BRANDS[brand] === BRAND_KIA) {
      this.BASE_DOMAIN = "prd.in-ccapi.kia.connected-car.io";
      this.PORT = 8080;
      this.CCSP_SERVICE_ID = "d0fe4855-7527-4be0-ab6e-a481216c705d";
      this.APP_ID = "00000000-69cd-4660-b75d-277ae15379dd";
      this.CFB = this.base64Decode(
        "pdfn/jCrrEcxH6Jnak/1O/DaD+HjVh0P6z/BHWNoUKQtT0aLcYwer8BxQOoiHXSyMtBV"
      );
      this.BASIC_AUTHORIZATION =
        "Basic ZDBmZTQ4NTUtNzUyNy00YmUwLWFiNmUtYTQ4MTIxNmM3MDVkOlNIb1R0WHB5ZmJZbVAzWGpOQTZCcnRsRGdseXBQV2o5MjBQdEtCSlBmbGVIRVlwVQ==";
      this.LOGIN_FORM_HOST = "prd.in-ccapi.kia.connected-car.io";
      this.PUSH_TYPE = "APNS";
    }

    this.BASE_URL = this.BASE_DOMAIN + ":" + String(this.PORT);
    this.USER_API_URL = "https://" + this.BASE_URL + "/api/v1/user/";
    this.SPA_API_URL = "https://" + this.BASE_URL + "/api/v1/spa/";
    this.SPA_API_URL_V2 = "https://" + this.BASE_URL + "/api/v2/spa/";
    this.CLIENT_ID = this.CCSP_SERVICE_ID;
  }

  private base64Decode(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private base64Encode(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _get_authenticated_headers(
    token: Token,
    ccs2_support: number | null = null
  ): Record<string, string> {
    return {
      Authorization: token.access_token ?? "",
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      "ccsp-device-id": token.device_id ?? "",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP,
    };
  }

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token | OTPRequest> {
    const stamp = this._get_stamp();
    const device_id = await this._get_device_id(stamp);
    const cookies = await this._get_cookies();
    let authorization_code: string | null = null;

    try {
      authorization_code = await this._get_authorization_code_with_redirect_url(
        username,
        password,
        cookies
      );
    } catch {
      console.log(`${DOMAIN} - get_authorization_code_with_redirect_url failed`);
    }

    if (authorization_code === null) {
      throw new AuthenticationError("Login Failed");
    }

    const [_, access_token, authCode] = await this._get_access_token(stamp, authorization_code);
    const [__, refresh_token] = await this._get_refresh_token(stamp, authCode);

    const valid_until = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();

    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until,
      pin,
    });
  }

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Get Vehicles Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    const result: Vehicle[] = [];

    for (const entry of response["resMsg"]["vehicles"]) {
      let entry_engine_type: string | null = null;
      if (entry["type"] === "GN") entry_engine_type = ENGINE_TYPES.ICE;
      else if (entry["type"] === "EV") entry_engine_type = ENGINE_TYPES.EV;
      else if (entry["type"] === "PHEV") entry_engine_type = ENGINE_TYPES.PHEV;
      else if (entry["type"] === "HV") entry_engine_type = ENGINE_TYPES.HEV;
      else if (entry["type"] === "PE") entry_engine_type = ENGINE_TYPES.PHEV;

      const vehicle = new Vehicle();
      vehicle.id = entry["vehicleId"];
      vehicle.name = entry["nickname"];
      vehicle.model = entry["vehicleName"];
      vehicle.registration_date = entry["regDate"];
      vehicle.VIN = entry["vin"];
      vehicle.timezone = this.data_timezone;
      vehicle.engine_type = entry_engine_type;
      vehicle.ccu_ccs2_protocol_support = entry["ccuCCS2ProtocolSupport"];
      result.push(vehicle);
    }
    return result;
  }

  _getTimeFromString(value: string | null, timesection: number): string | null {
    if (value == null) return null;
    let v = value;
    const lastTwo = parseInt(v.slice(-2), 10);
    if (lastTwo > 60) {
      v = String(parseInt(v, 10) + 40);
    }
    if (parseInt(v, 10) > 1260) {
      return v;
    } else {
      if (timesection > 0) {
        const hours = parseInt(v.slice(0, -2), 10) + 12;
        const mins = v.slice(-2);
        return String(hours).padStart(2, "0") + mins;
      }
      return v;
    }
  }

  async update_vehicle_with_cached_state(token: Token, vehicle: Vehicle): Promise<void> {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);

    const maintenance_state = await this._get_maintenance_alert(token, vehicle);
    this._update_vehicle_maintenance_alert(vehicle, maintenance_state);

    const location_state = await this._get_location(token, vehicle);
    if (location_state) {
      this._update_vehicle_location(vehicle, location_state);
    }

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      const charge = await this._get_charge_limits(token, vehicle);
      this._update_vehicle_properties_charge(vehicle, charge);
    }
  }

  private _update_vehicle_maintenance_alert(vehicle: Vehicle, state: Record<string, any>): void {
    if (getChildValue(state, "odometer")) {
      vehicle.odometer = [getChildValue(state, "odometer"), DISTANCE_UNITS[1]!];
    }
  }

  private async _get_maintenance_alert(token: Token, vehicle: Vehicle): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/setting/alert/maintenance";
    console.error(`Getting maintenance alert from ${url}`);
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.error(response);
    checkResponseForErrors(response);
    return response["resMsg"];
  }

  private _update_vehicle_location(vehicle: Vehicle, state: Record<string, any>): void {
    if (getChildValue(state, "coord.lat")) {
      vehicle.location = [
        getChildValue(state, "coord.lat"),
        getChildValue(state, "coord.lon"),
        this.get_last_updated_at(getChildValue(state, "time")),
      ];
    }
  }

  async force_refresh_vehicle_state(token: Token, vehicle: Vehicle): Promise<void> {
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;
    if (is_ccs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const state = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      if (location) {
        state["vehicleLocation"] = location;
      }
      this._update_vehicle_properties(vehicle, state);
    }

    if (
      vehicle.engine_type === ENGINE_TYPES.EV ||
      vehicle.engine_type === ENGINE_TYPES.PHEV
    ) {
      try {
        const charge = await this._get_charge_limits(token, vehicle);
        this._update_vehicle_properties_charge(vehicle, charge);

        const driving_info = await this._get_driving_info(token, vehicle);
        if (driving_info) {
          this._update_vehicle_drive_info(vehicle, driving_info);
        }
      } catch (e) {
        console.log(
          `Failed to parse driving info. Possible reasons: new API format, API outage. Error: ${e}`
        );
      }
    }
  }

  private async _force_refresh_vehicle_state_ccs2(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Force refresh CCS2 vehicle status response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    const state = response["resMsg"];
    this._update_vehicle_properties(vehicle, state);
    const location = await this._get_location(token, vehicle);
    if (location) {
      this._update_vehicle_location(vehicle, location);
    }
  }

  private _update_vehicle_properties(vehicle: Vehicle, state: Record<string, any>): void {
    if (getChildValue(state, "time")) {
      vehicle.last_updated_at = this.get_last_updated_at(getChildValue(state, "time"));
    } else {
      vehicle.last_updated_at = new Date();
    }

    vehicle.engine_is_running = getChildValue(state, "engine");

    if (getChildValue(state, "airTemp.value")) {
      const tempIndex = getHexTempIntoIndex(getChildValue(state, "airTemp.value"));
      if (tempIndex !== null) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "airTemp.unit")] || TEMPERATURE_UNITS[0]!,
        ];
      }
    }

    vehicle.defrost_is_on = getChildValue(state, "defrost");

    const steer_wheel_heat = getChildValue(state, "steerWheelHeat");
    if (steer_wheel_heat === 0 || steer_wheel_heat === 2) {
      vehicle.steering_wheel_heater_is_on = false;
    } else if (steer_wheel_heat === 1) {
      vehicle.steering_wheel_heater_is_on = true;
    }

    vehicle.back_window_heater_is_on = getChildValue(state, "sideBackWindowHeat");
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.astSeatHeatState") as any] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.drvSeatHeatState") as any] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.rlSeatHeatState") as any] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.rrSeatHeatState") as any] || null;

    vehicle.is_locked = getChildValue(state, "doorLock");
    vehicle.front_left_door_is_open = getChildValue(state, "doorOpen.frontLeft");
    vehicle.front_right_door_is_open = getChildValue(state, "doorOpen.frontRight");
    vehicle.back_left_door_is_open = getChildValue(state, "doorOpen.backLeft");
    vehicle.back_right_door_is_open = getChildValue(state, "doorOpen.backRight");
    vehicle.hood_is_open = getChildValue(state, "hoodOpen");
    vehicle.front_left_window_is_open = getChildValue(state, "windowOpen.frontLeft");
    vehicle.front_right_window_is_open = getChildValue(state, "windowOpen.frontRight");
    vehicle.back_left_window_is_open = getChildValue(state, "windowOpen.backLeft");
    vehicle.back_right_window_is_open = getChildValue(state, "windowOpen.backRight");

    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(
      getChildValue(state, "tirePressureLamp.tirePressureLampRL")
    );
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(
      getChildValue(state, "tirePressureLamp.tirePressureLampFL")
    );
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(
      getChildValue(state, "tirePressureLamp.tirePressureLampFR")
    );
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(
      getChildValue(state, "tirePressureLamp.tirePressureLampRR")
    );
    vehicle.tire_pressure_all_warning_is_on = Boolean(
      getChildValue(state, "tirePressureLamp.tirePressureLampAll")
    );

    vehicle.trunk_is_open = getChildValue(state, "trunkOpen");

    if (getChildValue(state, "dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "dte.value"),
        DISTANCE_UNITS[getChildValue(state, "dte.unit")]!,
      ];
    }

    vehicle.washer_fluid_warning_is_on = getChildValue(state, "washerFluidStatus");
    vehicle.accessory_on = Boolean(getChildValue(state, "acc"));
    vehicle.ign3 = Boolean(getChildValue(state, "ign3"));
    vehicle.transmission_condition = String(getChildValue(state, "transCond"));
    vehicle.sleep_mode_check = Boolean(getChildValue(state, "sleepModeCheck"));

    vehicle.headlamp_status = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.headLampStatus")
    );
    vehicle.headlamp_left_low = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.leftLowLamp")
    );
    vehicle.headlamp_right_low = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.rightLowLamp")
    );
    vehicle.headlamp_left_high = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.leftHighLamp")
    );
    vehicle.headlamp_right_high = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.rightHighLamp")
    );
    vehicle.headlamp_left_bifunc = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.leftBifuncLamp")
    );
    vehicle.headlamp_right_bifunc = Boolean(
      getChildValue(state, "lampWireStatus.headLamp.rightBifuncLamp")
    );
    vehicle.stop_lamp_left = Boolean(
      getChildValue(state, "lampWireStatus.stopLamp.leftLamp")
    );
    vehicle.stop_lamp_right = Boolean(
      getChildValue(state, "lampWireStatus.stopLamp.rightLamp")
    );
    vehicle.turn_signal_left_front = Boolean(
      getChildValue(state, "lampWireStatus.turnSignalLamp.leftFrontLamp")
    );
    vehicle.turn_signal_right_front = Boolean(
      getChildValue(state, "lampWireStatus.turnSignalLamp.rightFrontLamp")
    );
    vehicle.turn_signal_left_rear = Boolean(
      getChildValue(state, "lampWireStatus.turnSignalLamp.leftRearLamp")
    );
    vehicle.turn_signal_right_rear = Boolean(
      getChildValue(state, "lampWireStatus.turnSignalLamp.rightRearLamp")
    );

    vehicle.brake_fluid_warning_is_on = getChildValue(state, "breakOilStatus");
    vehicle.fuel_level = getChildValue(state, "fuelLevel");
    vehicle.fuel_level_is_low = getChildValue(state, "lowFuelLight");
    vehicle.air_control_is_on = getChildValue(state, "airCtrlOn");
    vehicle.smart_key_battery_warning_is_on = getChildValue(state, "smartKeyBatteryWarning");

    if (getChildValue(state, "evStatus") != null) {
      vehicle.ev_battery_percentage = getChildValue(state, "evStatus.batteryStatus");
      vehicle.ev_battery_is_charging = getChildValue(state, "evStatus.batteryCharge");
      vehicle.ev_battery_is_plugged_in = getChildValue(state, "evStatus.batteryPlugin");

      vehicle.ev_estimated_current_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.atc.value"),
        "m",
      ];
      vehicle.ev_estimated_fast_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc1.value"),
        "m",
      ];
      vehicle.ev_estimated_portable_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc2.value"),
        "m",
      ];
      vehicle.ev_estimated_station_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc3.value"),
        "m",
      ];

      const evDrivingRange = getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.evModeRange.value");
      if (evDrivingRange != null) {
        vehicle.ev_driving_range = [
          Math.round(parseFloat(String(evDrivingRange)) * 10) / 10,
          DISTANCE_UNITS[getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.evModeRange.unit")]!,
        ];
      }

      const totalRange = getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value");
      if (totalRange != null) {
        vehicle.total_driving_range = [
          Math.round(parseFloat(String(totalRange)) * 10) / 10,
          DISTANCE_UNITS[getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit")]!,
        ];
      }

      vehicle.sunroof_is_open = getChildValue(state, "sunroofOpen");
      vehicle.ev_charge_port_door_is_open = Boolean(
        getChildValue(state, "chargePortDoorOpenStatus")
      );
    }

    vehicle.data = state;
  }

  private _update_vehicle_drive_info(vehicle: Vehicle, state: Record<string, any>): void {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.total_power_regenerated = getChildValue(state, "regenPwr");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }

  private async _get_cached_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    let url = this.SPA_API_URL + "vehicles/" + vehicle.id;
    if (vehicle.ccu_ccs2_protocol_support === 0) {
      url = url + "/status/latest";
    } else {
      url = url + "/ccs2/carstatus/latest";
    }
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - get_cached_vehicle_status response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["resMsg"];
  }

  private async _get_location(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";
    console.error(`Getting location from ${url}`);

    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
      });
      const response = (await resp.json()) as Record<string, any>;
      console.error(`${DOMAIN} - _get_location response: ${JSON.stringify(response)}`);
      checkResponseForErrors(response);
      return response["resMsg"];
    } catch {
      console.warn(`${DOMAIN} - _get_location failed`);
      return null;
    }
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
    const payload = { action: action, deviceId: token.device_id };
    console.log(`${DOMAIN} - Lock Action Request: ${JSON.stringify(payload)}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Lock Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }

  private async _get_forced_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Received forced vehicle data: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return {
      vehicleStatus: response["resMsg"],
    };
  }

  async charge_port_action(
    token: Token,
    vehicle: Vehicle,
    action: string
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action: action, deviceID: token.device_id };
    console.log(`${DOMAIN} - Charge Port Action Request: ${JSON.stringify(payload)}`);

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Charge Port Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/engine";

    if (options.set_temp == null) options.set_temp = 21;
    if (options.duration == null) options.duration = 5;
    if (options.defrost == null) options.defrost = false;
    if (options.climate == null) options.climate = true;
    if (options.heating == null) options.heating = 0;

    const hex_set_temp = getIndexIntoHexTemp(
      this.temperature_range.indexOf(options.set_temp)
    );

    const payload = {
      action: "start",
      hvacType: 1,
      options: {
        defrost: options.defrost,
        heating1: Number(options.heating),
        igniOnDuration: options.duration,
      },
      tempCode: hex_set_temp,
      unit: "C",
    };

    console.log(`${DOMAIN} - Start Climate Action Request: ${JSON.stringify(payload)}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Start Climate Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/engine";
    const payload = {
      action: "stop",
    };
    console.log(`${DOMAIN} - Stop Climate Action Request: ${JSON.stringify(payload)}`);

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Stop Climate Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }

  async start_hazard_lights(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/light";
    const payload = { command: "on" };
    console.log(`${DOMAIN} - Start Hazard Lights Request: ${JSON.stringify(payload)}`);

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Start Hazard Lights Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async start_hazard_lights_and_horn(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/hornlight";
    const payload = { command: "on" };
    console.log(`${DOMAIN} - Start Hazard Lights and Horn Request: ${JSON.stringify(payload)}`);

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Start Hazard Lights and Horn Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  private _update_vehicle_properties_charge(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    try {
      if (Array.isArray(state.get?.("targetSOClist"))) {
        for (const item of state["targetSOClist"]) {
          if (item["plugType"] === 0) {
            vehicle.ev_charge_limits_dc = item["targetSOClevel"];
          } else if (item["plugType"] === 1) {
            vehicle.ev_charge_limits_ac = item["targetSOClevel"];
          }
        }
      }
    } catch {
      console.log(`${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`);
    }
  }

  private async _get_charge_limits(token: Token, vehicle: Vehicle): Promise<Record<string, any>> {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;
    console.log(`${DOMAIN} - Get Charging Limits Request`);

    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Get Charging Limits Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);

    if (response["resMsg"] != null) {
      return response["resMsg"];
    }
    return {};
  }

  private async _get_trip_info(
    token: Token,
    vehicle: Vehicle,
    date_string: string,
    trip_period_type: number
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload: Record<string, any>;

    if (trip_period_type === 0) {
      payload = { tripPeriodType: 0, setTripMonth: date_string };
    } else {
      payload = { tripPeriodType: 1, setTripDay: date_string };
    }

    console.log(`${DOMAIN} - get_trip_info Request ${JSON.stringify(payload)}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - get_trip_info response ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response;
  }

  private async _get_detailed_trip_info(
    token: Token,
    vehicle: Vehicle,
    date_string: string,
    trip: Record<string, any>
  ): Promise<TripInfo | null> {
    if (
      vehicle.engine_type !== ENGINE_TYPES.EV ||
      BRANDS[this.brand] !== BRAND_HYUNDAI
    ) {
      return null;
    }

    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo/detail";
    const payload = {
      tripPeriodType: 1,
      setTripDay: date_string,
      setTripStartTime: trip["tripStartTime"],
      setServiceTID: trip["serviceTID"],
      tripStartTime: trip["tripStartTime"],
      tripEndTime: trip["tripEndTime"],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    const tripinfo = response["resMsg"]["tripInfo"];

    const processedTrip = new TripInfo();
    processedTrip.hhmmss = trip["tripStartTime"].substring(8);
    processedTrip.drive_time = tripinfo["tripDrvTime"];
    processedTrip.idle_time = tripinfo["tripIdleTime"];
    processedTrip.distance = tripinfo["tripDist"];
    processedTrip.avg_speed = tripinfo["tripAvgSpeed"];
    processedTrip.max_speed = tripinfo["tripMaxSpeed"];

    return processedTrip;
  }

  async update_month_trip_info(
    token: Token,
    vehicle: Vehicle,
    yyyymm_string: string
  ): Promise<void> {
    vehicle.month_trip_info = null;
    const json_result = await this._get_trip_info(token, vehicle, yyyymm_string, 0);
    const msg = json_result["resMsg"];

    if (msg.get?.("monthTripDayCnt", 0) > 0 || msg.get?.("tripDayList", []).length > 0) {
      const result = new MonthTripInfo();
      result.yyyymm = yyyymm_string;
      result.day_list = [];

      const tripInfo = new TripInfo();
      tripInfo.drive_time = msg["tripDrvTime"];
      tripInfo.idle_time = msg["tripIdleTime"];
      tripInfo.distance = msg["tripDist"];
      tripInfo.avg_speed = msg["tripAvgSpeed"];
      tripInfo.max_speed = msg["tripMaxSpeed"];
      result.summary = tripInfo;

      for (const day of msg["tripDayList"]) {
        const processedDay = new DayTripCounts();
        processedDay.yyyymmdd = day["tripDayInMonth"];
        processedDay.trip_count = day["tripCntDay"];
        result.day_list.push(processedDay);
      }

      vehicle.month_trip_info = result;
    }
  }

  async update_day_trip_info(
    token: Token,
    vehicle: Vehicle,
    yyyymmdd_string: string
  ): Promise<void> {
    vehicle.day_trip_info = null;
    const json_result = await this._get_trip_info(token, vehicle, yyyymmdd_string, 1);
    const day_trip_list = json_result["resMsg"]["dayTripList"];

    if (day_trip_list.length > 0) {
      const msg = day_trip_list[0];
      const result = new DayTripInfo();
      result.yyyymmdd = yyyymmdd_string;
      result.trip_list = [];

      const tripInfo = new TripInfo();
      tripInfo.drive_time = msg["tripDrvTime"];
      tripInfo.idle_time = msg["tripIdleTime"];
      tripInfo.distance = msg["tripDist"];
      tripInfo.avg_speed = msg["tripAvgSpeed"];
      tripInfo.max_speed = msg["tripMaxSpeed"];
      result.summary = tripInfo;

      for (const trip of msg["tripList"]) {
        let processedTrip: TripInfo | null = null;

        if ("tripTime" in trip) {
          processedTrip = new TripInfo();
          processedTrip.hhmmss = trip["tripTime"];
          processedTrip.drive_time = trip["tripDrvTime"];
          processedTrip.idle_time = trip["tripIdleTime"];
          processedTrip.distance = trip["tripDist"];
          processedTrip.avg_speed = trip["tripAvgSpeed"];
          processedTrip.max_speed = trip["tripMaxSpeed"];
        } else {
          processedTrip = await this._get_detailed_trip_info(
            token,
            vehicle,
            yyyymmdd_string,
            trip
          );
        }

        if (processedTrip) {
          result.trip_list.push(processedTrip);
        }
      }

      vehicle.day_trip_info = result;
    }
  }

  private async _get_driving_info(token: Token, vehicle: Vehicle): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";

    const respAlltime = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ periodTarget: 1 }),
    });
    const responseAlltime = (await respAlltime.json()) as Record<string, any>;
    console.log(`${DOMAIN} - get_driving_info responseAlltime ${JSON.stringify(responseAlltime)}`);
    checkResponseForErrors(responseAlltime);

    const resp30d = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ periodTarget: 0 }),
    });
    const response30d = (await resp30d.json()) as Record<string, any>;
    console.log(`${DOMAIN} - get_driving_info response30d ${JSON.stringify(response30d)}`);
    checkResponseForErrors(response30d);

    if (getChildValue(responseAlltime, "resMsg.drivingInfo.0")) {
      const drivingInfo = responseAlltime["resMsg"]["drivingInfo"][0];
      drivingInfo["dailyStats"] = [];

      if (getChildValue(response30d, "resMsg.drivingInfoDetail.0")) {
        for (const day of response30d["resMsg"]["drivingInfoDetail"]) {
          const processedDay = new DailyDrivingStats();
          processedDay.date = new Date(day["drivingDate"]);
          processedDay.total_consumed = getChildValue(day, "totalPwrCsp");
          processedDay.engine_consumption = getChildValue(day, "motorPwrCsp");
          processedDay.climate_consumption = getChildValue(day, "climatePwrCsp");
          processedDay.onboard_electronics_consumption = getChildValue(day, "eDPwrCsp");
          processedDay.battery_care_consumption = getChildValue(day, "batteryMgPwrCsp");
          processedDay.regenerated_energy = getChildValue(day, "regenPwr");
          processedDay.distance = getChildValue(day, "calculativeOdo");
          processedDay.distance_unit = vehicle.odometer_unit || DISTANCE_UNITS[1] || "km";
          drivingInfo["dailyStats"].push(processedDay);
        }
      }

      for (const drivingInfoItem of response30d["resMsg"]["drivingInfo"]) {
        if (drivingInfoItem["drivingPeriod"] === 0) {
          const odo = Object.entries(drivingInfoItem).find(
            ([k]) => k.toLowerCase() === "calculativeodo"
          )?.[1] || 0;

          if (Number(odo) > 0) {
            drivingInfo["consumption30d"] = Math.round(
              drivingInfoItem["totalPwrCsp"] / drivingInfoItem["calculativeOdo"]
            );
            break;
          }
        }
      }

      return drivingInfo;
    } else {
      console.log(
        `${DOMAIN} - Driving info didn't return valid data. This may be normal if the car doesn't support it.`
      );
      return null;
    }
  }

  async valet_mode_action(
    token: Token,
    vehicle: Vehicle,
    action: VALET_MODE_ACTION
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/valet";
    const payload = { action: action };
    console.log(`${DOMAIN} - Valet Mode Action Request: ${JSON.stringify(payload)}`);

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Valet Mode Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  _get_stamp(): string {
    const now = Math.floor(Date.now() / 1000);
    const raw_data = `${this.APP_ID}:${now}`;
    const raw_bytes = new TextEncoder().encode(raw_data);

    const result = new Uint8Array(raw_bytes.length);
    for (let i = 0; i < raw_bytes.length; i++) {
      result[i] = this.CFB[i % this.CFB.length] ^ raw_bytes[i];
    }

    return this.base64Encode(result);
  }

  _get_device_id(stamp: string): Promise<string> {
    return (async () => {
      const my_hex = Math.floor(Math.random() * 1e16).toString(16).padStart(64, "0");
      const registration_id = my_hex.substring(0, 64);

      const url = this.SPA_API_URL + "notifications/register";
      const payload = {
        pushRegId: registration_id,
        pushType: this.PUSH_TYPE,
        uuid: this.generateUUID(),
      };

      const headers = {
        "ccsp-service-id": this.CCSP_SERVICE_ID,
        "ccsp-application-id": this.APP_ID,
        Stamp: stamp,
        "Content-Type": "application/json;charset=UTF-8",
        Host: this.BASE_URL,
        Connection: "Keep-Alive",
        "Accept-Encoding": "gzip",
        "User-Agent": USER_AGENT_OK_HTTP,
      };

      console.log(`${DOMAIN} - Get Device ID request: ${url} ${JSON.stringify(headers)} ${JSON.stringify(payload)}`);

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const response = (await resp.json()) as Record<string, any>;
      checkResponseForErrors(response);
      console.log(`${DOMAIN} - Get Device ID response: ${JSON.stringify(response)}`);
      return response["resMsg"]["deviceId"];
    })();
  }

  private async _get_cookies(): Promise<OAuthCookies> {
    const url =
      this.USER_API_URL +
      "oauth2/authorize?response_type=code&state=test&client_id=" +
      this.CLIENT_ID +
      "&redirect_uri=" +
      this.USER_API_URL +
      "oauth2/redirect";

    console.log(`${DOMAIN} - Get cookies request: ${url}`);

    const resp = await fetch(url);
    const setCookieHeaders = ((resp.headers as any).getSetCookie?.() as string[]) || [];
    const cookies: OAuthCookies = {};

    for (const cookie of setCookieHeaders) {
      const match = cookie.match(/^([^=]+)=([^;]*)/);
      if (match) {
        cookies[match[1]] = match[2];
      }
    }

    return cookies;
  }

  private async _get_authorization_code_with_redirect_url(
    username: string,
    password: string,
    cookies: OAuthCookies
  ): Promise<string> {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password: password };

    const cookieString = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        Cookie: cookieString,
      },
      body: JSON.stringify(data),
    });
    const response = (await resp.json()) as Record<string, any>;
    console.log(`${DOMAIN} - Sign In Response: ${JSON.stringify(response)}`);

    const parsed_url = new URL(response["redirectUrl"]!);
    const code_param = parsed_url.searchParams.get("code");
    if (!code_param) throw new Error("No authorization code in response");

    return code_param;
  }

  private async _get_access_token(
    stamp: string,
    authorization_code: string
  ): Promise<[string, string, string]> {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const data =
      "grant_type=authorization_code&redirect_uri=https%3A%2F%2F" +
      this.BASE_DOMAIN +
      "%3A8080%2Fapi%2Fv1%2Fuser%2Foauth2%2Fredirect&code=" +
      authorization_code;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data,
    });
    const response = (await resp.json()) as Record<string, any>;

    const token_type = response["token_type"];
    const access_token = token_type + " " + response["access_token"];
    const refresh_token_code = response["refresh_token"];

    return [token_type, access_token, refresh_token_code];
  }

  get_last_updated_at(value: string | null): Date {
    console.log(`${DOMAIN} - last_updated_at - before ${value}`);
    if (value == null) {
      return new Date("2000-01-01T00:00:00Z");
    } else {
      const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (match) {
        const result = new Date(
          Date.UTC(
            parseInt(match[1], 10),
            parseInt(match[2], 10) - 1,
            parseInt(match[3], 10),
            parseInt(match[4], 10),
            parseInt(match[5], 10),
            parseInt(match[6], 10)
          )
        );
        console.log(`${DOMAIN} - last_updated_at - after ${result}`);
        return result;
      }
    }
    return new Date("2000-01-01T00:00:00Z");
  }

  private async _get_refresh_token(
    stamp: string,
    authorization_code: string
  ): Promise<[string, string]> {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const data =
      "grant_type=refresh_token&redirect_uri=https%3A%2F%2Fwww.getpostman.com%2Foauth2%2Fcallback&refresh_token=" +
      authorization_code;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data,
    });
    const response = (await resp.json()) as Record<string, any>;
    const token_type = response["token_type"];
    const refresh_token = token_type + " " + response["access_token"];

    return [token_type, refresh_token];
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
