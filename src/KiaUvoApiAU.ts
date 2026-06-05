import { ApiImplType1, checkResponseForErrors } from "./ApiImplType1.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import {
  getChildValue,
  parseDatetime,
  getIndexIntoHexTemp,
} from "./utils.js";
import {
  DOMAIN,
  BRAND_KIA,
  BRAND_HYUNDAI,
  BRANDS,
  REGIONS,
  REGION_AUSTRALIA,
  REGION_NZ,
  DISTANCE_UNITS,
  ENGINE_TYPES,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  CHARGE_PORT_ACTION,
} from "./const.js";
import {
  AuthenticationError,
} from "./exceptions.js";
import {
  DailyDrivingStats,
  DayTripCounts,
  DayTripInfo,
  MonthTripInfo,
  TripInfo,
} from "./vehicle.js";

const USER_AGENT_OK_HTTP = "okhttp/3.12.0";
const USER_AGENT_MOZILLA =
  "Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19";

function stringToArrayBuffer(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buf;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const view = new Uint8Array(buf);
  let result = "";
  for (let i = 0; i < view.length; i++) {
    result += String.fromCharCode(view[i]);
  }
  return btoa(result);
}

function base64ToArrayBuffer(str: string): ArrayBuffer {
  const binary = atob(str);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buf;
}

export class KiaUvoApiAU extends ApiImplType1 {
  data_timezone = "Australia/Sydney";
  temperature_range = Array.from({ length: 20 }, (_, i) => (i + 17) * 0.5);

  BASE_URL: string = "";
  CCSP_SERVICE_ID: string = "";
  APP_ID: string = "";
  BASIC_AUTHORIZATION: string = "";
  USER_API_URL: string = "";
  SPA_API_URL: string = "";
  SPA_API_URL_V2: string = "";
  cfb: Uint8Array = new Uint8Array();
  brand: number = 0;

  constructor(region: number, brand: number, language: string) {
    super();
    this.brand = brand;

    if (BRANDS[brand] === BRAND_KIA && REGIONS[region] === REGION_AUSTRALIA) {
      this.BASE_URL = "au-apigw.ccs.kia.com.au:8082";
      this.CCSP_SERVICE_ID = "8acb778a-b918-4a8d-8624-73a0beb64289";
      this.APP_ID = "4ad4dcde-be23-48a8-bc1c-91b94f5c06f8";
      this.BASIC_AUTHORIZATION =
        "Basic OGFjYjc3OGEtYjkxOC00YThkLTg2MjQtNzNhMGJlYjY0Mjg5OjdTY01NbTZmRVlYZGlFUEN4YVBhUW1nZVlkbFVyZndvaDRBZlhHT3pZSVMyQ3U5VA==";
      this.cfb = new Uint8Array(
        base64ToArrayBuffer(
          "SGGCDRvrzmRa2WTNFQPUaNfSFdtPklZ48xUuVckigYasxmeOQqVgCAC++YNrI1vVabI="
        )
      );
    } else if (BRANDS[brand] === BRAND_HYUNDAI) {
      this.BASE_URL = "au-apigw.ccs.hyundai.com.au:8080";
      this.CCSP_SERVICE_ID = "855c72df-dfd7-4230-ab03-67cbf902bb1c";
      this.APP_ID = "f9ccfdac-a48d-4c57-bd32-9116963c24ed";
      this.BASIC_AUTHORIZATION =
        "Basic ODU1YzcyZGYtZGZkNy00MjMwLWFiMDMtNjdjYmY5MDJiYjFjOmU2ZmJ3SE0zMllOYmhRbDBwdmlhUHAzcmY0dDNTNms5MWVjZUEzTUpMZGJkVGhDTw==";
      this.cfb = new Uint8Array(
        base64ToArrayBuffer(
          "nGDHng3k4Cg9gWV+C+A6Yk/ecDopUNTkGmDpr2qVKAQXx9bvY2/YLoHPfObliK32mZQ="
        )
      );
    } else if (BRANDS[brand] === BRAND_KIA && REGIONS[region] === REGION_NZ) {
      this.BASE_URL = "au-apigw.ccs.kia.com.au:8082";
      this.CCSP_SERVICE_ID = "4ab606a7-cea4-48a0-a216-ed9c14a4a38c";
      this.APP_ID = "97745337-cac6-4a5b-afc3-e65ace81c994";
      this.BASIC_AUTHORIZATION =
        "Basic NGFiNjA2YTctY2VhNC00OGEwLWEyMTYtZWQ5YzE0YTRhMzhjOjBoYUZxWFRrS2t0Tktmekt4aFowYWt1MzFpNzRnMHlRRm01b2QybXo0TGRJNW1MWQ==";
      this.cfb = new Uint8Array(
        base64ToArrayBuffer(
          "SGGCDRvrzmRa2WTNFQPUaC1OsnAhQgPgcQETEfbY8abEjR/ICXK0p+Rayw5tHCGyiUA="
        )
      );
    }

    this.USER_API_URL = "https://" + this.BASE_URL + "/api/v1/user/";
    this.SPA_API_URL = "https://" + this.BASE_URL + "/api/v1/spa/";
    this.SPA_API_URL_V2 = "https://" + this.BASE_URL + "/api/v2/spa/";
  }

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token> {
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
    } catch (e) {
      console.debug(
        `${DOMAIN} - get_authorization_code_with_redirect_url failed`
      );
    }

    if (authorization_code === null) {
      throw new AuthenticationError("Login Failed");
    }

    const [_, access_token, auth_code] = await this._get_access_token(
      authorization_code,
      stamp
    );
    const [token_type, refresh_token] = await this._get_refresh_token(
      auth_code,
      stamp
    );
    const valid_until = new Date(Date.now() + 23 * 60 * 60 * 1000);

    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until: valid_until.toISOString(),
      pin,
    });
  }

  async update_vehicle_with_cached_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    let url = this.SPA_API_URL + "vehicles/" + vehicle.id;
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;

    if (is_ccs2) {
      url += "/ccs2/carstatus/latest";
    } else {
      url += "/status/latest";
    }

    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - get_cached_vehicle_status response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    if (is_ccs2) {
      const state = response["resMsg"]["state"]["Vehicle"];
      this._update_vehicle_properties_ccs2(vehicle, state);
      const location = await this._get_location(token, vehicle);
      if (location && getChildValue(location, "coord.lat")) {
        vehicle.location = [
          getChildValue(location, "coord.lat"),
          getChildValue(location, "coord.lon"),
          parseDatetime(
            getChildValue(location, "time"),
            this.data_timezone
          ),
        ] as [number, number, Date];
      }
    } else {
      const location = await this._get_location(token, vehicle);
      this._update_vehicle_properties(vehicle, {
        status: response["resMsg"],
        vehicleLocation: location,
      });
    }

    if (
      vehicle.engine_type === ENGINE_TYPES.EV ||
      vehicle.engine_type === ENGINE_TYPES.PHEV
    ) {
      try {
        const state = await this._get_driving_info(token, vehicle);
        if (state) {
          this._update_vehicle_drive_info(vehicle, state);
        }
      } catch (e) {
        console.debug(
          `Failed to parse driving info. Possible reasons:
            - incompatible vehicle (ICE)
            - new API format
            - API outage`,
          e
        );
      }
    }
  }

  async force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;

    if (is_ccs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const status = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      this._update_vehicle_properties(vehicle, {
        status,
        vehicleLocation: location,
      });
    }

    if (
      vehicle.engine_type === ENGINE_TYPES.EV ||
      vehicle.engine_type === ENGINE_TYPES.PHEV
    ) {
      try {
        const state = await this._get_driving_info(token, vehicle);
        if (state) {
          this._update_vehicle_drive_info(vehicle, state);
        }
      } catch (e) {
        console.debug(
          `Failed to parse driving info. Possible reasons:
            - incompatible vehicle (ICE)
            - new API format
            - API outage`,
          e
        );
      }
    }
  }

  private async _force_refresh_vehicle_state_ccs2(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const url =
      this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - Force refresh CCS2 vehicle status response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    const state = response["resMsg"]["state"]["Vehicle"];
    this._update_vehicle_properties_ccs2(vehicle, state);

    const location = await this._get_location(token, vehicle);
    if (location && getChildValue(location, "coord.lat")) {
      vehicle.location = [
        getChildValue(location, "coord.lat"),
        getChildValue(location, "coord.lon"),
        parseDatetime(
          getChildValue(location, "time"),
          this.data_timezone
        ),
      ] as [number, number, Date];
    }
  }

  private _update_vehicle_properties(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    if (getChildValue(state, "status.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "status.time"),
        this.data_timezone
      );
    } else {
      vehicle.last_updated_at = new Date();
    }

    if (getChildValue(state, "status.odometer.value")) {
      vehicle.odometer = [
        getChildValue(state, "status.odometer.value"),
        DISTANCE_UNITS[getChildValue(state, "status.odometer.unit")]!,
      ] as [number, string];
    }

    vehicle.car_battery_percentage = getChildValue(
      state,
      "status.battery.batSoc"
    );
    vehicle.engine_is_running = getChildValue(state, "status.engine");

    if (getChildValue(state, "status.airTemp.value")) {
      const tempIndex = getIndexIntoHexTemp(
        getChildValue(state, "status.airTemp.value")
      );
      if (tempIndex !== null && this.temperature_range) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex as any],
          TEMPERATURE_UNITS[getChildValue(state, "status.airTemp.unit")]!,
        ] as [number, string];
      }
    }

    vehicle.defrost_is_on = getChildValue(state, "status.defrost");

    const steer_wheel_heat = getChildValue(state, "status.steerWheelHeat");
    if (steer_wheel_heat === 0 || steer_wheel_heat === 2) {
      vehicle.steering_wheel_heater_is_on = false;
    } else if (steer_wheel_heat === 1) {
      vehicle.steering_wheel_heater_is_on = true;
    }

    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "status.sideBackWindowHeat"
    );
    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "status.sideMirrorHeat"
    );

    vehicle.front_left_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.flSeatHeatState") ?? "null"
    ] as string | null;
    vehicle.front_right_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.frSeatHeatState") ?? "null"
    ] as string | null;
    vehicle.rear_left_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState") ?? "null"
    ] as string | null;
    vehicle.rear_right_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState") ?? "null"
    ] as string | null;

    vehicle.is_locked = getChildValue(state, "status.doorLock");
    vehicle.front_left_door_is_open = getChildValue(
      state,
      "status.doorOpen.frontLeft"
    );
    vehicle.front_right_door_is_open = getChildValue(
      state,
      "status.doorOpen.frontRight"
    );
    vehicle.back_left_door_is_open = getChildValue(
      state,
      "status.doorOpen.backLeft"
    );
    vehicle.back_right_door_is_open = getChildValue(
      state,
      "status.doorOpen.backRight"
    );

    vehicle.hood_is_open = getChildValue(state, "status.hoodOpen");
    vehicle.front_left_window_is_open = getChildValue(
      state,
      "status.windowOpen.frontLeft"
    );
    vehicle.front_right_window_is_open = getChildValue(
      state,
      "status.windowOpen.frontRight"
    );
    vehicle.back_left_window_is_open = getChildValue(
      state,
      "status.windowOpen.backLeft"
    );
    vehicle.back_right_window_is_open = getChildValue(
      state,
      "status.windowOpen.backRight"
    );

    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(
      getChildValue(state, "status.tirePressureLamp.tirePressureLampRL")
    );
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(
      getChildValue(state, "status.tirePressureLamp.tirePressureLampFL")
    );
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(
      getChildValue(state, "status.tirePressureLamp.tirePressureLampFR")
    );
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(
      getChildValue(state, "status.tirePressureLamp.tirePressureLampRR")
    );
    vehicle.tire_pressure_all_warning_is_on = Boolean(
      getChildValue(state, "status.tirePressureLamp.tirePressureLampAll")
    );

    vehicle.trunk_is_open = getChildValue(state, "status.trunkOpen");
    vehicle.ev_battery_percentage = getChildValue(
      state,
      "status.evStatus.batteryStatus"
    );
    vehicle.ev_battery_is_charging = getChildValue(
      state,
      "status.evStatus.batteryCharge"
    );
    vehicle.ev_battery_is_plugged_in = getChildValue(
      state,
      "status.evStatus.batteryPlugin"
    );

    const ev_charge_port_door_is_open = getChildValue(
      state,
      "status.evStatus.chargePortDoorOpenStatus"
    );
    if (ev_charge_port_door_is_open === 1) {
      vehicle.ev_charge_port_door_is_open = true;
    } else if (ev_charge_port_door_is_open === 2) {
      vehicle.ev_charge_port_door_is_open = false;
    }

    if (
      getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
      ) !== null
    ) {
      vehicle.total_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[
          getChildValue(
            state,
            "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
          )
        ]!,
      ] as [number, string];
    }

    if (
      getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
      ) !== null
    ) {
      vehicle.ev_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[
          getChildValue(
            state,
            "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
          )
        ]!,
      ] as [number, string];
    }

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.atc.value"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc1.value"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc2.value"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc3.value"),
      "m",
    ] as [number, string];

    const target_soc_list = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.targetSOClist"
    );
    try {
      if (target_soc_list && Array.isArray(target_soc_list)) {
        const ac_socs = target_soc_list.filter((x: any) => x["plugType"] === 1);
        if (ac_socs.length > 0) {
          vehicle.ev_charge_limits_ac = ac_socs[ac_socs.length - 1][
            "targetSOClevel"
          ];
        }
        const dc_socs = target_soc_list.filter((x: any) => x["plugType"] === 0);
        if (dc_socs.length > 0) {
          vehicle.ev_charge_limits_dc = dc_socs[dc_socs.length - 1][
            "targetSOClevel"
          ];
        }
      }
    } catch {
      console.debug(`${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`);
    }

    if (
      getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
      ) !== null
    ) {
      vehicle.fuel_driving_range = [
        getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
        ),
        DISTANCE_UNITS[
          getChildValue(
            state,
            "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
          )
        ]!,
      ] as [number, string];
    } else if (getChildValue(state, "status.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "status.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "status.dte.unit")]!,
      ] as [number, string];
    }

    vehicle.ev_target_range_charge_AC = [
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[
        getChildValue(
          state,
          "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit"
        )
      ]!,
    ] as [number, string];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[
        getChildValue(
          state,
          "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit"
        )
      ]!,
    ] as [number, string];

    vehicle.ev_first_departure_enabled = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservChargeSet"
    );
    vehicle.ev_second_departure_enabled = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservChargeSet"
    );
    vehicle.ev_first_departure_days = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.day"
    );
    vehicle.ev_second_departure_days = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.day"
    );

    vehicle.ev_first_departure_time = this._getTimeFromString(
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.time"
      ),
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.timeSection"
      )
    );

    vehicle.ev_second_departure_time = this._getTimeFromString(
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.time"
      ),
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.timeSection"
      )
    );

    vehicle.ev_off_peak_start_time = this._getTimeFromString(
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.time"
      ),
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.timeSection"
      )
    );

    vehicle.ev_off_peak_end_time = this._getTimeFromString(
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.time"
      ),
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.timeSection"
      )
    );

    if (
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
      )
    ) {
      if (
        getChildValue(
          state,
          "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
        ) === 1
      ) {
        vehicle.ev_off_peak_charge_only_enabled = true;
      } else if (
        getChildValue(
          state,
          "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
        ) === 2
      ) {
        vehicle.ev_off_peak_charge_only_enabled = false;
      }
    }

    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "status.washerFluidStatus"
    );
    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "status.breakOilStatus"
    );
    vehicle.fuel_level = getChildValue(state, "status.fuelLevel");
    vehicle.fuel_level_is_low = getChildValue(state, "status.lowFuelLight");
    vehicle.air_control_is_on = getChildValue(state, "status.airCtrlOn");
    vehicle.smart_key_battery_warning_is_on = getChildValue(
      state,
      "status.smartKeyBatteryWarning"
    );

    if (getChildValue(state, "vehicleLocation.coord.lat")) {
      vehicle.location = [
        getChildValue(state, "vehicleLocation.coord.lat"),
        getChildValue(state, "vehicleLocation.coord.lon"),
        parseDatetime(
          getChildValue(state, "vehicleLocation.time"),
          this.data_timezone
        ),
      ] as [number, number, Date];
    }

    vehicle.data = state;
  }

  private _update_vehicle_drive_info(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }

  private async _get_location(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";

    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token),
      });
      const response = (await resp.json()) as Record<string, any>;

      console.debug(`${DOMAIN} - _get_location response: ${JSON.stringify(response)}`);
      checkResponseForErrors(response);
      return response["resMsg"];
    } catch {
      console.debug(`${DOMAIN} - _get_location failed`);
      return null;
    }
  }

  private async _get_forced_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - Received forced vehicle data: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    return response["resMsg"];
  }

  async charge_port_action(
    token: Token,
    vehicle: Vehicle,
    action: CHARGE_PORT_ACTION
  ): Promise<string> {
    const url =
      this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";

    const payload = { action: action, deviceId: token.device_id };
    console.debug(
      `${DOMAIN} - Charge Port Action Request: ${JSON.stringify(payload)}`
    );

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - Charge Port Action Response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    return response["msgId"];
  }

  private async _get_charge_limits(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;

    console.debug(`${DOMAIN} - Get Charging Limits Request`);
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - Get Charging Limits Response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    if (response["resMsg"] !== null) {
      return response["resMsg"];
    }
    return null;
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

    console.debug(`${DOMAIN} - get_trip_info Request ${JSON.stringify(payload)}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - get_trip_info response ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);

    return response;
  }

  async update_month_trip_info(
    token: Token,
    vehicle: Vehicle,
    yyyymm_string: string
  ): Promise<void> {
    vehicle.month_trip_info = null;

    const json_result = await this._get_trip_info(
      token,
      vehicle,
      yyyymm_string,
      0
    );

    const msg = json_result["resMsg"];
    if (msg["monthTripDayCnt"] > 0) {
      const result = new MonthTripInfo();
      result.yyyymm = yyyymm_string;
      result.day_list = [];
      result.summary = new TripInfo();
      result.summary.drive_time = msg["tripDrvTime"];
      result.summary.idle_time = msg["tripIdleTime"];
      result.summary.distance = msg["tripDist"];
      result.summary.avg_speed = msg["tripAvgSpeed"];
      result.summary.max_speed = msg["tripMaxSpeed"];

      for (const day of msg["tripDayList"]) {
        const processed_day = new DayTripCounts();
        processed_day.yyyymmdd = day["tripDayInMonth"];
        processed_day.trip_count = day["tripCntDay"];
        result.day_list.push(processed_day);
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

    const json_result = await this._get_trip_info(
      token,
      vehicle,
      yyyymmdd_string,
      1
    );

    const day_trip_list = json_result["resMsg"]["dayTripList"];
    if (day_trip_list && day_trip_list.length > 0) {
      const msg = day_trip_list[0];
      const result = new DayTripInfo();
      result.yyyymmdd = yyyymmdd_string;
      result.trip_list = [];
      result.summary = new TripInfo();
      result.summary.drive_time = msg["tripDrvTime"];
      result.summary.idle_time = msg["tripIdleTime"];
      result.summary.distance = msg["tripDist"];
      result.summary.avg_speed = msg["tripAvgSpeed"];
      result.summary.max_speed = msg["tripMaxSpeed"];

      for (const trip of msg["tripList"]) {
        const processed_trip = new TripInfo();
        processed_trip.hhmmss = trip["tripTime"];
        processed_trip.drive_time = trip["tripDrvTime"];
        processed_trip.idle_time = trip["tripIdleTime"];
        processed_trip.distance = trip["tripDist"];
        processed_trip.avg_speed = trip["tripAvgSpeed"];
        processed_trip.max_speed = trip["tripMaxSpeed"];
        result.trip_list.push(processed_trip);
      }

      vehicle.day_trip_info = result;
    }
  }

  private async _get_driving_info(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";

    const respAlltime = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ periodTarget: 1 }),
    });
    const responseAlltime = (await respAlltime.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - get_driving_info responseAlltime ${JSON.stringify(responseAlltime)}`
    );
    checkResponseForErrors(responseAlltime);

    const resp30d = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ periodTarget: 0 }),
    });
    const response30d = (await resp30d.json()) as Record<string, any>;

    console.debug(
      `${DOMAIN} - get_driving_info response30d ${JSON.stringify(response30d)}`
    );
    checkResponseForErrors(response30d);

    if (getChildValue(responseAlltime, "resMsg.drivingInfoDetail.0")) {
      const drivingInfo = responseAlltime["resMsg"]["drivingInfoDetail"][0];

      drivingInfo["dailyStats"] = [];
      for (const day of response30d["resMsg"]["drivingInfoDetail"]) {
        const processedDay = new DailyDrivingStats();
        processedDay.date = new Date(
          day["drivingDate"].substring(0, 4) +
            "-" +
            day["drivingDate"].substring(4, 6) +
            "-" +
            day["drivingDate"].substring(6, 8)
        );
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

      for (const drivingInfoItem of response30d["resMsg"]["drivingInfo"] ?? []) {
        if (drivingInfoItem["drivingPeriod"] === 0) {
          drivingInfo["consumption30d"] = Math.round(
            drivingInfoItem["totalPwrCsp"] / drivingInfoItem["calculativeOdo"]
          );
          break;
        }
      }

      return drivingInfo;
    } else {
      console.debug(
        `${DOMAIN} - Driving info didn't return valid data. This may be normal if the car doesn't support it.`
      );
      return null;
    }
  }

  _get_stamp(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const raw_data = `${this.APP_ID}:${timestamp}`;
    const raw_bytes = stringToArrayBuffer(raw_data);
    const raw_view = new Uint8Array(raw_bytes);

    const result = new Uint8Array(raw_view.length);
    for (let i = 0; i < raw_view.length; i++) {
      result[i] = this.cfb[i % this.cfb.length] ^ raw_view[i];
    }

    return arrayBufferToBase64(result.buffer);
  }

  // Note: This method signature differs from ApiImplType1 (which declares it as synchronous).
  // The implementation must be async to support fetch operations.
  // ApiImplType1 should declare: abstract async _get_device_id(stamp: string): Promise<string>;
  async _get_device_id(stamp: string): Promise<string> {
    const my_hex = Math.floor(Math.random() * Math.pow(10, 16))
      .toString(16)
      .padStart(64, "0");
    const registration_id = my_hex.substring(0, 64);

    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      pushRegId: registration_id,
      pushType: "GCM",
      uuid: this._generateUUID(),
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

    console.debug(
      `${DOMAIN} - Get Device ID request: ${JSON.stringify(headers)} ${JSON.stringify(payload)}`
    );

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    checkResponseForErrors(response);

    console.debug(
      `${DOMAIN} - Get Device ID response: ${JSON.stringify(response)}`
    );

    const device_id = response["resMsg"]["deviceId"];
    return device_id;
  }

  private async _get_cookies(): Promise<Record<string, string>> {
    const url =
      this.USER_API_URL +
      "oauth2/authorize?response_type=code&client_id=" +
      this.CCSP_SERVICE_ID +
      "&redirect_uri=" +
      "https://" +
      this.BASE_URL +
      "/api/v1/user/oauth2/redirect&lang=en";

    console.debug(`${DOMAIN} - Get cookies request: ${url}`);

    const resp = await fetch(url);
    const text = await resp.text();

    const cookies: Record<string, string> = {};
    const setCookieHeaders = (resp.headers as any).getSetCookie?.() || [];
    for (const setCookie of setCookieHeaders) {
      const parts = setCookie.split(";");
      if (parts.length > 0) {
        const cookiePair = parts[0].split("=");
        if (cookiePair.length === 2) {
          cookies[cookiePair[0].trim()] = cookiePair[1].trim();
        }
      }
    }

    return cookies;
  }

  private async _get_authorization_code_with_redirect_url(
    username: string,
    password: string,
    cookies: Record<string, string>
  ): Promise<string> {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password };

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

    const redirectUrl = response["redirectUrl"];
    const url_obj = new URL(redirectUrl);
    const code = url_obj.searchParams.get("code");

    if (!code) {
      throw new Error("No authorization code in response");
    }

    return code;
  }

  private async _get_access_token(
    authorization_code: string,
    stamp: string
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

    const data = new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri:
        "https://" +
        this.BASE_URL +
        "/api/v1/user/oauth2/redirect",
      code: authorization_code,
    });

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data.toString(),
    });
    const response = (await resp.json()) as Record<string, any>;

    const token_type = response["token_type"];
    const access_token = token_type + " " + response["access_token"];
    const refresh_token = response["refresh_token"];

    return [token_type, access_token, refresh_token];
  }

  private async _get_refresh_token(
    refresh_token_code: string,
    stamp: string
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

    const data = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token_code,
    });

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data.toString(),
    });
    const response = (await resp.json()) as Record<string, any>;

    const token_type = response["token_type"];
    const refresh_token = token_type + " " + response["access_token"];

    return [token_type, refresh_token];
  }

  private _generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
