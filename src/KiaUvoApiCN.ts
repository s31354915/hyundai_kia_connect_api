import { ApiImplType1, checkResponseForErrors } from "./ApiImplType1.js";
import { Token } from "./token.js";
import { Vehicle, DailyDrivingStats, DayTripCounts, MonthTripInfo, DayTripInfo, TripInfo } from "./vehicle.js";
import { ClimateRequestOptions, OTPRequest } from "./ApiImpl.js";
import {
  BRAND_KIA,
  BRAND_HYUNDAI,
  BRANDS,
  CHARGE_PORT_ACTION,
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  LOGIN_TOKEN_LIFETIME_SECONDS,
  ORDER_STATUS,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
} from "./const.js";
import {
  APIError,
  AuthenticationError,
  DuplicateRequestError,
  InvalidAPIResponseError,
  NoDataFound,
  RateLimitingError,
  RequestTimeoutError,
  ServiceTemporaryUnavailable,
  UnsupportedControlError,
} from "./exceptions.js";
import {
  getChildValue,
  getHexTempIntoIndex,
  getIndexIntoHexTemp,
  parseDatetime,
} from "./utils.js";

const USER_AGENT_OK_HTTP = "okhttp/3.12.0";
const USER_AGENT_MOZILLA = "Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19";
const ACCEPT_HEADER_ALL = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9";

function checkResponseForErrorsCN(response: Record<string, any>): void {
  const errorCodeMapping: Record<string, typeof APIError> = {
    "4004": DuplicateRequestError,
    "4005": UnsupportedControlError,
    "4081": RequestTimeoutError,
    "5031": ServiceTemporaryUnavailable,
    "5091": RateLimitingError,
    "5921": NoDataFound,
    "9999": RequestTimeoutError,
  };

  if (!["retCode", "resCode", "resMsg"].some((x) => x in response)) {
    throw new InvalidAPIResponseError();
  }

  if (response["retCode"] === "F") {
    if (response["resCode"] in errorCodeMapping) {
      throw new errorCodeMapping[response["resCode"]](response["resMsg"]);
    } else {
      throw new APIError(`Server returned: '${response["resMsg"]}'`);
    }
  }
}

export class KiaUvoApiCN extends ApiImplType1 {
  // Timezone for China
  data_timezone: string = "Asia/Shanghai";
  temperature_range: number[] = Array.from({ length: 32 }, (_, i) => (i + 14) * 0.5);

  // Brand-specific properties
  BASE_DOMAIN: string = "";
  CCSP_SERVICE_ID: string = "";
  APP_ID: string = "";
  BASIC_AUTHORIZATION: string = "";

  // Derived URLs
  BASE_URL: string = "";
  USER_API_URL: string = "";
  SPA_API_URL: string = "";
  SPA_API_URL_V2: string = "";
  CLIENT_ID: string = "";
  GCM_SENDER_ID: number = 199360397125;

  LANGUAGE: string = "zh";

  constructor(region: number, brand: number, language: string) {
    super();
    const brandName = BRANDS[brand];

    if (brandName === BRAND_KIA) {
      this.BASE_DOMAIN = "prd.cn-ccapi.kia.com";
      this.CCSP_SERVICE_ID = "9d5df92a-06ae-435f-b459-8304f2efcc67";
      this.APP_ID = "eea8762c-adfc-4ee4-8d7a-6e2452ddf342";
      this.BASIC_AUTHORIZATION = "Basic OWQ1ZGY5MmEtMDZhZS00MzVmLWI0NTktODMwNGYyZWZjYzY3OnRzWGRrVWcwOEF2MlpaelhPZ1d6Snl4VVQ2eWVTbk5OUWtYWFBSZEtXRUFOd2wxcA==";
    } else if (brandName === BRAND_HYUNDAI) {
      this.BASE_DOMAIN = "prd.cn-ccapi.hyundai.com";
      this.CCSP_SERVICE_ID = "72b3d019-5bc7-443d-a437-08f307cf06e2";
      this.APP_ID = "ed01581a-380f-48cd-83d4-ed1490c272d0";
      this.BASIC_AUTHORIZATION = "Basic NzJiM2QwMTktNWJjNy00NDNkLWE0MzctMDhmMzA3Y2YwNmUyOnNlY3JldA==";
    }

    this.BASE_URL = this.BASE_DOMAIN;
    this.USER_API_URL = "https://" + this.BASE_URL + "/api/v1/user/";
    this.SPA_API_URL = "https://" + this.BASE_URL + "/api/v1/spa/";
    this.SPA_API_URL_V2 = "https://" + this.BASE_URL + "/api/v2/spa/";
    this.CLIENT_ID = this.CCSP_SERVICE_ID;
  }

  _get_authenticated_headers(token: Token, ccs2Support?: number | null): Record<string, string> {
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

  async _get_control_headers(token: Token, vehicle?: Vehicle): Promise<Record<string, string>> {
    const [controlToken, _] = await this._get_control_token(token);
    return {
      Authorization: controlToken,
      AuthorizationCCSP: controlToken,
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
    pin?: string | null,
  ): Promise<Token | OTPRequest> {
    const deviceId = await this._get_device_id_async();
    const cookies = await this._get_cookies();
    await this._set_session_language(cookies);

    let authorizationCode: string | null = null;
    try {
      authorizationCode = await this._get_authorization_code_with_redirect_url(username, password, cookies);
    } catch (e) {
      // Log but continue
    }

    if (authorizationCode === null) {
      throw new AuthenticationError("Login Failed");
    }

    const [_, accessToken, refreshTokenAuth] = await this._get_access_token(authorizationCode);
    const [__, refreshToken] = await this._get_refresh_token(refreshTokenAuth);
    const validUntil = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000);

    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      device_id: deviceId,
      valid_until: validUntil.toISOString(),
      pin: pin ?? null,
    });
  }

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);

    const result: Vehicle[] = [];
    for (const entry of response["resMsg"]["vehicles"]) {
      let entryEngineType: string | null = null;
      if (entry["type"] === "GN") entryEngineType = ENGINE_TYPES.ICE;
      else if (entry["type"] === "EV") entryEngineType = ENGINE_TYPES.EV;
      else if (entry["type"] === "PHEV") entryEngineType = ENGINE_TYPES.PHEV;
      else if (entry["type"] === "HV") entryEngineType = ENGINE_TYPES.HEV;

      const vehicle = new Vehicle();
      vehicle.id = entry["vehicleId"];
      vehicle.name = entry["nickname"];
      vehicle.model = entry["vehicleName"];
      vehicle.registration_date = entry["regDate"];
      vehicle.VIN = entry["vin"];
      vehicle.timezone = this.data_timezone;
      vehicle.engine_type = entryEngineType;
      result.push(vehicle);
    }
    return result;
  }

  _get_time_from_string(value: string | number | null, timesection: number): string | null {
    if (value == null) return null;

    let v: string | number = value;
    const lastTwo = parseInt(String(v).slice(-2), 10);
    if (lastTwo > 60) {
      v = parseInt(String(v), 10) + 40;
    }

    if (parseInt(String(v), 10) > 1260) {
      return String(v).padStart(4, "0");
    } else {
      // AM/PM format
      let timeStr = String(v).padStart(4, "0");
      if (timesection === 0) {
        timeStr += " AM";
      } else if (timesection === 1) {
        timeStr += " PM";
      }
      // Parse as 12-hour format
      const match = timeStr.match(/^(\d{2})(\d{2})\s(AM|PM)$/);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = match[2];
        if (match[3] === "PM" && hours !== 12) {
          hours += 12;
        } else if (match[3] === "AM" && hours === 12) {
          hours = 0;
        }
        return String(hours).padStart(2, "0") + mins;
      }
    }
    return null;
  }

  async update_vehicle_with_cached_state(token: Token, vehicle: Vehicle): Promise<void> {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      try {
        const driveState = await this._get_driving_info(token, vehicle);
        this._update_vehicle_drive_info(vehicle, driveState);
      } catch (e) {
        // Ignore - vehicle may not support this
      }
    }
  }

  async force_refresh_vehicle_state(token: Token, vehicle: Vehicle): Promise<void> {
    const isCcs2 = vehicle.ccu_ccs2_protocol_support !== 0;
    if (isCcs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const state = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      if (location) {
        state["vehicleLocation"] = location;
      }
      this._update_vehicle_properties(vehicle, state);
    }

    // Only call for driving info on cars we know have a chance of supporting it
    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      try {
        const driveState = await this._get_driving_info(token, vehicle);
        this._update_vehicle_drive_info(vehicle, driveState);
      } catch (e) {
        // Ignore - vehicle may not support this
      }
    }
  }

  async _force_refresh_vehicle_state_ccs2(token: Token, vehicle: Vehicle): Promise<void> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    const state = response["resMsg"];
    this._update_vehicle_properties(vehicle, state);

    const location = await this._get_location(token, vehicle);
    if (location && getChildValue(location, "coord.lat")) {
      vehicle.location = [
        getChildValue(location, "coord.lat"),
        getChildValue(location, "coord.lon"),
        parseDatetime(getChildValue(location, "time"), this.data_timezone),
      ];
    }
  }

  _update_vehicle_properties(vehicle: Vehicle, state: Record<string, any>): void {
    if (getChildValue(state, "status.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "status.time"),
        this.data_timezone,
      );
    } else {
      vehicle.last_updated_at = new Date();
    }

    vehicle.odometer = [
      getChildValue(state, "status.odometer.value"),
      DISTANCE_UNITS[getChildValue(state, "status.odometer.unit")] ?? "km",
    ];

    vehicle.car_battery_percentage = getChildValue(state, "status.battery.batSoc");
    vehicle.engine_is_running = getChildValue(state, "status.engine");

    const tempValue = getChildValue(state, "status.airTemp.value");
    if (tempValue) {
      const tempIndex = getHexTempIntoIndex(tempValue);
      if (tempIndex !== null && tempIndex < this.temperature_range.length) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "status.airTemp.unit")] ?? "°C",
        ];
      }
    }

    vehicle.defrost_is_on = getChildValue(state, "status.defrost");
    const steerWheelHeat = getChildValue(state, "status.steerWheelHeat");
    if (steerWheelHeat === 0 || steerWheelHeat === 2) {
      vehicle.steering_wheel_heater_is_on = false;
    } else if (steerWheelHeat === 1) {
      vehicle.steering_wheel_heater_is_on = true;
    }

    vehicle.back_window_heater_is_on = getChildValue(state, "status.sideBackWindowHeat");
    vehicle.side_mirror_heater_is_on = getChildValue(state, "status.sideMirrorHeat");
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.flSeatHeatState") as any] ?? null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.frSeatHeatState") as any] ?? null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState") as any] ?? null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState") as any] ?? null;
    vehicle.is_locked = getChildValue(state, "status.doorLock");
    vehicle.front_left_door_is_open = getChildValue(state, "status.doorOpen.frontLeft");
    vehicle.front_right_door_is_open = getChildValue(state, "status.doorOpen.frontRight");
    vehicle.back_left_door_is_open = getChildValue(state, "status.doorOpen.backLeft");
    vehicle.back_right_door_is_open = getChildValue(state, "status.doorOpen.backRight");
    vehicle.hood_is_open = getChildValue(state, "status.hoodOpen");
    vehicle.front_left_window_is_open = getChildValue(state, "status.windowOpen.frontLeft");
    vehicle.front_right_window_is_open = getChildValue(state, "status.windowOpen.frontRight");
    vehicle.back_left_window_is_open = getChildValue(state, "status.windowOpen.backLeft");
    vehicle.back_right_window_is_open = getChildValue(state, "status.windowOpen.backRight");
    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(getChildValue(state, "status.tirePressureLamp.tirePressureLampRL"));
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(getChildValue(state, "status.tirePressureLamp.tirePressureLampFL"));
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(getChildValue(state, "status.tirePressureLamp.tirePressureLampFR"));
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(getChildValue(state, "status.tirePressureLamp.tirePressureLampRR"));
    vehicle.tire_pressure_all_warning_is_on = Boolean(getChildValue(state, "status.tirePressureLamp.tirePressureLampAll"));
    vehicle.trunk_is_open = getChildValue(state, "status.trunkOpen");
    vehicle.ev_battery_percentage = getChildValue(state, "status.evStatus.batteryStatus");
    vehicle.ev_battery_is_charging = getChildValue(state, "status.evStatus.batteryCharge");
    vehicle.ev_battery_is_plugged_in = getChildValue(state, "status.evStatus.batteryPlugin");

    const evChargePortDoorIsOpen = getChildValue(state, "status.evStatus.chargePortDoorOpenStatus");
    if (evChargePortDoorIsOpen === 1) {
      vehicle.ev_charge_port_door_is_open = true;
    } else if (evChargePortDoorIsOpen === 2) {
      vehicle.ev_charge_port_door_is_open = false;
    }

    const totalAvailableRangeValue = getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value",
    );
    if (totalAvailableRangeValue !== null) {
      vehicle.total_driving_range = [
        Math.round(parseFloat(String(totalAvailableRangeValue)) * 10) / 10,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit")] ?? "km",
      ];
    }

    const evModeRangeValue = getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value");
    if (evModeRangeValue !== null) {
      vehicle.ev_driving_range = [
        Math.round(parseFloat(String(evModeRangeValue)) * 10) / 10,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit")] ?? "km",
      ];
    }

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.atc.value"),
      "m",
    ] as [any, string];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc1.value"),
      "m",
    ] as [any, string];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc2.value"),
      "m",
    ] as [any, string];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc3.value"),
      "m",
    ] as [any, string];

    const targetSocList = getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist");
    try {
      if (targetSocList && Array.isArray(targetSocList)) {
        const acLimits = targetSocList.filter((x: any) => x["plugType"] === 1);
        const dcLimits = targetSocList.filter((x: any) => x["plugType"] === 0);
        if (acLimits.length > 0) vehicle.ev_charge_limits_ac = acLimits[acLimits.length - 1]["targetSOClevel"];
        if (dcLimits.length > 0) vehicle.ev_charge_limits_dc = dcLimits[dcLimits.length - 1]["targetSOClevel"];
      }
    } catch {
      // Ignore - may not be an EV
    }

    const gasModeRangeValue = getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value");
    if (gasModeRangeValue !== null) {
      vehicle.fuel_driving_range = [
        gasModeRangeValue,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit")] ?? "km",
      ];
    } else if (getChildValue(state, "status.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "status.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "status.dte.unit")] ?? "km",
      ];
    }

    vehicle.ev_target_range_charge_AC = [
      getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"),
      DISTANCE_UNITS[getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit")] ?? "km",
    ];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"),
      DISTANCE_UNITS[getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit")] ?? "km",
    ];

    vehicle.ev_first_departure_enabled = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservChargeSet",
    );
    vehicle.ev_second_departure_enabled = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservChargeSet",
    );
    vehicle.ev_first_departure_days = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.day",
    );
    vehicle.ev_second_departure_days = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.day",
    );

    vehicle.ev_first_departure_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.timeSection"),
    );

    vehicle.ev_second_departure_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.timeSection"),
    );

    vehicle.ev_off_peak_start_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.timeSection"),
    );

    vehicle.ev_off_peak_end_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.timeSection"),
    );

    const offPeakPowerFlag = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag",
    );
    if (offPeakPowerFlag) {
      if (offPeakPowerFlag === 1) {
        vehicle.ev_off_peak_charge_only_enabled = true;
      } else if (offPeakPowerFlag === 2) {
        vehicle.ev_off_peak_charge_only_enabled = false;
      }
    }

    vehicle.washer_fluid_warning_is_on = getChildValue(state, "status.washerFluidStatus");
    vehicle.brake_fluid_warning_is_on = getChildValue(state, "status.breakOilStatus");
    vehicle.fuel_level = getChildValue(state, "status.fuelLevel");
    vehicle.fuel_level_is_low = getChildValue(state, "status.lowFuelLight");
    vehicle.air_control_is_on = getChildValue(state, "status.airCtrlOn");
    vehicle.smart_key_battery_warning_is_on = getChildValue(state, "status.smartKeyBatteryWarning");

    if (getChildValue(state, "vehicleLocation.coord.lat")) {
      vehicle.location = [
        getChildValue(state, "vehicleLocation.coord.lat"),
        getChildValue(state, "vehicleLocation.coord.lon"),
        parseDatetime(getChildValue(state, "vehicleLocation.time"), this.data_timezone),
      ];
    }

    vehicle.data = state;
  }

  _update_vehicle_drive_info(vehicle: Vehicle, state: Record<string, any>): void {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }

  async _get_cached_vehicle_state(token: Token, vehicle: Vehicle): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["resMsg"];
  }

  async _get_location(token: Token, vehicle: Vehicle): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location";
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token),
      });
      const response = (await resp.json()) as Record<string, any>;
      checkResponseForErrorsCN(response);
      return response["resMsg"];
    } catch {
      return null;
    }
  }

  async _get_forced_vehicle_state(token: Token, vehicle: Vehicle): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    const mappedResponse: Record<string, any> = {};
    mappedResponse["vehicleStatus"] = response["resMsg"];
    return mappedResponse;
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION,
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
    const payload = { action: action, deviceId: token.device_id };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async charge_port_action(
    token: Token,
    vehicle: Vehicle,
    action: CHARGE_PORT_ACTION,
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action: action, deviceId: token.device_id };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions,
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/engine";

    // Set defaults
    let setTemp = options.set_temp ?? 21;
    const duration = options.duration ?? 5;
    const defrost = options.defrost ?? false;
    const climate = options.climate ?? true;
    const heating = options.heating ?? 0;

    const hexSetTemp = getIndexIntoHexTemp(this.temperature_range.indexOf(setTemp));

    const payload = {
      action: "start",
      hvacType: 1,
      options: {
        defrost,
        heating1: parseInt(String(heating), 10),
      },
      tempCode: hexSetTemp,
      unit: "C",
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/engine";
    const payload = { action: "stop" };

    const resp = await fetch(url, {
      method: "POST",
      headers: await this._get_control_headers(token, vehicle),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
    const payload = { action: "start", deviceId: token.device_id };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
    const payload = { action: "stop", deviceId: token.device_id };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  async _get_charge_limits(token: Token, vehicle: Vehicle): Promise<Record<string, any> | null> {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;

    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    if (response["resMsg"] !== null) {
      return response["resMsg"];
    }
    return null;
  }

  async _get_trip_info(
    token: Token,
    vehicle: Vehicle,
    dateString: string,
    tripPeriodType: number,
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload: Record<string, any>;
    if (tripPeriodType === 0) {
      payload = { tripPeriodType: 0, setTripMonth: dateString };
    } else {
      payload = { tripPeriodType: 1, setTripDay: dateString };
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response;
  }

  async update_month_trip_info(token: Token, vehicle: Vehicle, yyyymmString: string): Promise<void> {
    vehicle.month_trip_info = null;
    const jsonResult = await this._get_trip_info(token, vehicle, yyyymmString, 0);
    const msg = jsonResult["resMsg"];

    if (msg["monthTripDayCnt"] > 0) {
      const result = new MonthTripInfo();
      result.yyyymm = yyyymmString;
      result.day_list = [];
      result.summary = new TripInfo();
      result.summary.drive_time = msg["tripDrvTime"];
      result.summary.idle_time = msg["tripIdleTime"];
      result.summary.distance = msg["tripDist"];
      result.summary.avg_speed = msg["tripAvgSpeed"];
      result.summary.max_speed = msg["tripMaxSpeed"];

      for (const day of msg["tripDayList"]) {
        const processedDay = new DayTripCounts();
        processedDay.yyyymmdd = day["tripDayInMonth"];
        processedDay.trip_count = day["tripCntDay"];
        result.day_list.push(processedDay);
      }

      vehicle.month_trip_info = result;
    }
  }

  async update_day_trip_info(token: Token, vehicle: Vehicle, yyyymmddString: string): Promise<void> {
    vehicle.day_trip_info = null;
    const jsonResult = await this._get_trip_info(token, vehicle, yyyymmddString, 1);
    const dayTripList = jsonResult["resMsg"]["dayTripList"];

    if (dayTripList.length > 0) {
      const msg = dayTripList[0];
      const result = new DayTripInfo();
      result.yyyymmdd = yyyymmddString;
      result.trip_list = [];
      result.summary = new TripInfo();
      result.summary.drive_time = msg["tripDrvTime"];
      result.summary.idle_time = msg["tripIdleTime"];
      result.summary.distance = msg["tripDist"];
      result.summary.avg_speed = msg["tripAvgSpeed"];
      result.summary.max_speed = msg["tripMaxSpeed"];

      for (const trip of msg["tripList"]) {
        const processedTrip = new TripInfo();
        processedTrip.hhmmss = trip["tripTime"];
        processedTrip.drive_time = trip["tripDrvTime"];
        processedTrip.idle_time = trip["tripIdleTime"];
        processedTrip.distance = trip["tripDist"];
        processedTrip.avg_speed = trip["tripAvgSpeed"];
        processedTrip.max_speed = trip["tripMaxSpeed"];
        result.trip_list.push(processedTrip);
      }

      vehicle.day_trip_info = result;
    }
  }

  async _get_driving_info(token: Token, vehicle: Vehicle): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";

    const respAlltime = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify({ periodTarget: 1 }),
    });
    const responseAlltime = (await respAlltime.json()) as Record<string, any>;
    checkResponseForErrorsCN(responseAlltime);

    const resp30d = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify({ periodTarget: 0 }),
    });
    const response30d = (await resp30d.json()) as Record<string, any>;
    checkResponseForErrorsCN(response30d);

    if (getChildValue(responseAlltime, "resMsg.drivingInfoDetail.0")) {
      const drivingInfo = responseAlltime["resMsg"]["drivingInfoDetail"][0];
      drivingInfo["dailyStats"] = [];

      for (const day of response30d["resMsg"]["drivingInfoDetail"]) {
        const processedDay = new DailyDrivingStats();
        processedDay.date = new Date(day["drivingDate"]);
        processedDay.total_consumed = day["totalPwrCsp"];
        processedDay.engine_consumption = day["motorPwrCsp"];
        processedDay.climate_consumption = day["climatePwrCsp"];
        processedDay.onboard_electronics_consumption = day["eDPwrCsp"];
        processedDay.battery_care_consumption = day["batteryMgPwrCsp"];
        processedDay.regenerated_energy = day["regenPwr"];
        processedDay.distance = day["calculativeOdo"];
        processedDay.distance_unit = vehicle.odometer_unit ?? "km";
        drivingInfo["dailyStats"].push(processedDay);
      }

      for (const drivingInfoItem of response30d["resMsg"]["drivingInfo"]) {
        if (drivingInfoItem["drivingPeriod"] === 0) {
          drivingInfo["consumption30d"] = Math.round(
            drivingInfoItem["totalPwrCsp"] / drivingInfoItem["calculativeOdo"],
          );
          break;
        }
      }

      return drivingInfo;
    } else {
      throw new Error("Driving info didn't return valid data");
    }
  }

  async set_charge_limits(token: Token, vehicle: Vehicle, ac: number, dc: number): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/charge/target";

    const body = {
      targetSOClist: [
        { plugType: 0, targetSOClevel: dc },
        { plugType: 1, targetSOClevel: ac },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(body),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }

  _get_device_id(_stamp?: string): string {
    // Synchronous stub - KiaUvoApiCN uses async version in login()
    throw new Error("Use async _get_device_id_async() instead");
  }

  async _get_device_id_async(): Promise<string> {
    const registrationId = "1";
    const providerDeviceId = "59af09e554a9442ab8589c9500d04d2e";
    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      providerDeviceId,
      pushRegId: registrationId,
      pushType: "GCM",
      uuid: crypto.randomUUID(),
    };

    const headers = {
      "ccsp-service-id": this.CLIENT_ID,
      "ccsp-application-id": this.APP_ID,
      "Content-Type": "application/json;charset=UTF-8",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrorsCN(response);
    return response["resMsg"]["deviceId"];
  }

  async _get_cookies(): Promise<Record<string, string>> {
    const url =
      this.USER_API_URL +
      "oauth2/authorize?response_type=code&state=test&client_id=" +
      this.CLIENT_ID +
      "&redirect_uri=https://" +
      this.BASE_URL +
      ":443/api/v1/user/oauth2/redirect&lang=";

    const resp = await fetch(url);
    const setCookieHeader = resp.headers.get("set-cookie");
    const cookies: Record<string, string> = {};

    if (setCookieHeader) {
      const cookiePairs = setCookieHeader.split(";");
      for (const pair of cookiePairs) {
        const [key, value] = pair.trim().split("=");
        if (key && value) {
          cookies[key] = value;
        }
      }
    }

    return cookies;
  }

  async _set_session_language(cookies: Record<string, string>): Promise<void> {
    const url = this.USER_API_URL;
    const headers = { "Content-type": "application/json" };
    const payload = { lang: "zh" };

    const cookieString = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    await fetch(url, {
      method: "POST",
      headers: { ...headers, Cookie: cookieString },
      body: JSON.stringify(payload),
    });
  }

  async _get_authorization_code_with_redirect_url(
    username: string,
    password: string,
    cookies: Record<string, string>,
  ): Promise<string> {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password };

    const cookieString = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, Cookie: cookieString },
      body: JSON.stringify(data),
    });
    const response = (await resp.json()) as Record<string, any>;
    const redirectUrl = new URL(response["redirectUrl"]);
    const code = redirectUrl.searchParams.get("code");

    if (!code) {
      throw new Error("No authorization code in redirect URL");
    }

    return code;
  }

  async _get_access_token(authorizationCode: string): Promise<[string, string, string]> {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const data =
      "grant_type=authorization_code&redirect_uri=https%3A%2F%2F" +
      this.BASE_DOMAIN +
      "%3A443%2Fapi%2Fv1%2Fuser%2Foauth2%2Fredirect&code=" +
      authorizationCode;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data,
    });
    const response = (await resp.json()) as Record<string, any>;

    const tokenType = response["token_type"];
    const accessToken = tokenType + " " + response["access_token"];
    const refreshTokenAuth = response["refresh_token"];

    return [tokenType, accessToken, refreshTokenAuth];
  }

  async _get_refresh_token(authorizationCode: string): Promise<[string, string]> {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const data =
      "grant_type=refresh_token&redirect_uri=https%3A%2F%2Fwww.getpostman.com%2Foauth2%2Fcallback&refresh_token=" +
      authorizationCode;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data,
    });
    const response = (await resp.json()) as Record<string, any>;

    const tokenType = response["token_type"];
    const refreshToken = tokenType + " " + response["access_token"];

    return [tokenType, refreshToken];
  }

  async _get_control_token(token: Token): Promise<[string, number]> {
    const url = this.USER_API_URL + "pin?token=";
    const headers = {
      Authorization: token.access_token ?? "",
      "Content-type": "application/json",
      Host: this.BASE_URL,
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP,
    };

    const data = { deviceId: token.device_id, pin: token.pin };

    const resp = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    const response = (await resp.json()) as Record<string, any>;

    const controlToken = "Bearer " + response["controlToken"];
    const controlTokenExpireAt = Math.floor(Date.now() / 1000 + response["expiresTime"]);

    return [controlToken, controlTokenExpireAt];
  }

  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    actionId: string,
    synchronous: boolean = false,
    timeout: number = 0,
  ): Promise<ORDER_STATUS> {
    const url = this.SPA_API_URL + "notifications/" + vehicle.id + "/records";

    if (synchronous) {
      if (timeout < 1) {
        throw new APIError("Timeout must be 1 or higher");
      }

      const endTime = Date.now() + timeout * 1000;
      while (endTime > Date.now()) {
        const state = await this.check_action_status(token, vehicle, actionId, false);
        if (state === ORDER_STATUS.PENDING) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          return state;
        }
      }

      return ORDER_STATUS.TIMEOUT;
    } else {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token),
      });
      const response = (await resp.json()) as Record<string, any>;
      checkResponseForErrorsCN(response);

      for (const action of response["resMsg"]) {
        if (action["recordId"] === actionId) {
          if (action["result"] === "success") {
            return ORDER_STATUS.SUCCESS;
          } else if (action["result"] === "fail") {
            return ORDER_STATUS.FAILED;
          } else if (action["result"] === "non-response") {
            return ORDER_STATUS.TIMEOUT;
          } else if (action["result"] === null) {
            return ORDER_STATUS.PENDING;
          }
        }
      }

      throw new APIError(`No action found with ID ${actionId}`);
    }
  }

  _get_stamp(): string {
    // Placeholder - CFB-based stamp generation would go here
    return "";
  }
}
