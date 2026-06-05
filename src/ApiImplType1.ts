import {
  ApiImpl,
  ClimateRequestOptions,
  WindowRequestOptions,
  ScheduleChargingClimateRequestOptions,
  POIInfo,
  DepartureOptions,
} from "./ApiImpl.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import { getChildValue, parseDatetime, getIndexIntoHexTemp } from "./utils.js";
import {
  DOMAIN,
  DISTANCE_UNITS,
  ENGINE_TYPES,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
  ORDER_STATUS,
} from "./const.js";
import {
  APIError,
  AuthenticationError,
  DuplicateRequestError,
  RequestTimeoutError,
  ServiceTemporaryUnavailable,
  NoDataFound,
  InvalidAPIResponseError,
  RateLimitingError,
  DeviceIDError,
  UnsupportedControlError,
} from "./exceptions.js";

const USER_AGENT_OK_HTTP = "okhttp/3.12.0";

export function checkResponseForErrors(response: Record<string, any>): void {
  const errorCodeMapping: Record<string, typeof APIError> = {
    "7501": AuthenticationError,
    "4002": DeviceIDError,
    "4004": DuplicateRequestError,
    "4005": UnsupportedControlError,
    "4081": RequestTimeoutError,
    "5031": ServiceTemporaryUnavailable,
    "5091": RateLimitingError,
    "5921": NoDataFound,
    "9999": RequestTimeoutError,
  };

  const errorMessageToExceptionMapping: Record<string, typeof AuthenticationError> = {
    "Key not authorized: Token is expired": AuthenticationError,
    "Key not authorized: token has expired": AuthenticationError,
  };

  if (
    !["retCode", "resCode", "resMsg", "error", "access_token"].some(
      (k) => k in response,
    )
  ) {
    throw new InvalidAPIResponseError();
  }

  if ("retCode" in response && response["retCode"] === "F") {
    if (response["resCode"] in errorCodeMapping) {
      throw new errorCodeMapping[response["resCode"]](response["resMsg"]);
    }
    throw new APIError(
      `Server returned:  '${response["resCode"]}' '${response["resMsg"]}'`,
    );
  } else if ("error" in response) {
    const errorReason = response["error"];
    if (errorReason in errorMessageToExceptionMapping) {
      throw new errorMessageToExceptionMapping[errorReason](errorReason);
    } else {
      throw new APIError(`Unknown error in API response: ${errorReason}`);
    }
  } else if ("retCode" in response && "retMsg" in response) {
    if (response["retMsg"] === "Received unexpected statusCode") {
      throw new AuthenticationError(response["retMsg"]);
    }
  }
}

export abstract class ApiImplType1 extends ApiImpl {
  supports_window_control: boolean = true;

  // These must be set by subclasses
  abstract SPA_API_URL: string;
  abstract SPA_API_URL_V2: string;
  abstract USER_API_URL: string;
  abstract BASE_URL: string;
  abstract CCSP_SERVICE_ID: string;
  abstract APP_ID: string;
  LANGUAGE: string = "en";

  abstract _get_stamp(): string;
  abstract _get_device_id(stamp: string): string | Promise<string>;

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    const result: Vehicle[] = [];
    for (const entry of response["resMsg"]["vehicles"]) {
      let entryEngineType: string | null = null;
      if (entry["type"] === "GN") entryEngineType = ENGINE_TYPES.ICE;
      else if (entry["type"] === "EV") entryEngineType = ENGINE_TYPES.EV;
      else if (entry["type"] === "PHEV") entryEngineType = ENGINE_TYPES.PHEV;
      else if (entry["type"] === "HV") entryEngineType = ENGINE_TYPES.HEV;
      else if (entry["type"] === "PE") entryEngineType = ENGINE_TYPES.PHEV;
      const vehicle = new Vehicle();
      vehicle.id = entry["vehicleId"];
      vehicle.name = entry["nickname"];
      vehicle.model = entry["vehicleName"];
      vehicle.registration_date = entry["regDate"];
      vehicle.VIN = entry["vin"];
      vehicle.timezone = this.data_timezone;
      vehicle.engine_type = entryEngineType;
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
      // 24h format - already valid
      return v;
    } else {
      // 12h format - apply time section
      if (timesection > 0) {
        const hours = parseInt(v.slice(0, -2), 10) + 12;
        const mins = v.slice(-2);
        return String(hours).padStart(2, "0") + mins;
      }
      return v;
    }
  }

  _get_authenticated_headers(
    token: Token,
    ccs2_support: number | null = null,
  ): Record<string, string> {
    return {
      Authorization: token.access_token ?? "",
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      Stamp: this._get_stamp(),
      "ccsp-device-id": token.device_id ?? "",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      Ccuccs2protocolsupport: String(ccs2_support ?? 0),
      "User-Agent": USER_AGENT_OK_HTTP,
    };
  }

  async _get_control_headers(
    token: Token,
    vehicle: Vehicle,
  ): Promise<Record<string, string>> {
    const [controlToken, _] = await this._get_control_token(token);
    const authenticatedHeaders = this._get_authenticated_headers(
      token,
      vehicle.ccu_ccs2_protocol_support,
    );
    return {
      ...authenticatedHeaders,
      Authorization: controlToken,
      AuthorizationCCSP: controlToken,
    };
  }

  _update_vehicle_properties_ccs2(vehicle: Vehicle, state: Record<string, any>): void {
    const offset = getChildValue(state, "Offset");
    if (offset != null) {
      const offsetNum = parseFloat(String(offset));
      const hours = Math.trunc(offsetNum);
      const minutes = Math.trunc((offsetNum - hours) * 60);
      const sign = offsetNum >= 0 ? "+" : "-";
      const absH = Math.abs(hours);
      const absM = Math.abs(minutes);
      vehicle.timezone = `Etc/GMT${offsetNum >= 0 ? "-" : "+"}${absH}${absM > 0 ? ":" + String(absM).padStart(2, "0") : ""}`;
    }

    const dateVal = getChildValue(state, "Date");
    if (dateVal != null) {
      vehicle.last_updated_at = parseDatetime(String(dateVal), vehicle.timezone);
    } else {
      vehicle.last_updated_at = new Date();
    }

    vehicle.odometer = [
      getChildValue(state, "Drivetrain.Odometer"),
      DISTANCE_UNITS[1],
    ] as [number, string];

    vehicle.car_battery_percentage = getChildValue(
      state,
      "Electronics.Battery.Level",
    );
    vehicle.engine_is_running = getChildValue(state, "DrivingReady");

    const airTemp = getChildValue(
      state,
      "Cabin.HVAC.Row1.Driver.Temperature.Value",
    );
    if (airTemp != null && airTemp !== "OFF") {
      vehicle.air_temperature = [parseFloat(String(airTemp)), TEMPERATURE_UNITS[1]!];
    }

    const outsideTemp = getChildValue(state, "Cabin.HVAC.OutsideTemperature.Value");
    const outsideTempUnit = getChildValue(state, "Cabin.HVAC.OutsideTemperature.Unit");
    if (outsideTemp != null && outsideTempUnit != null) {
      vehicle.outside_temperature = [
        parseFloat(String(outsideTemp)),
        TEMPERATURE_UNITS[outsideTempUnit] ?? TEMPERATURE_UNITS[0]!,
      ];
    }

    const defrostIsOn = getChildValue(state, "Body.Windshield.Front.Defog.State");
    if (defrostIsOn === 0 || defrostIsOn === 2) vehicle.defrost_is_on = false;
    else if (defrostIsOn === 1) vehicle.defrost_is_on = true;

    const steerWheelHeat = getChildValue(state, "Cabin.SteeringWheel.Heat.State");
    if (steerWheelHeat === 0 || steerWheelHeat === 2) vehicle.steering_wheel_heater_is_on = false;
    else if (steerWheelHeat === 1) vehicle.steering_wheel_heater_is_on = true;

    const defrostRearIsOn = getChildValue(state, "Body.Windshield.Rear.Defog.State");
    if (defrostRearIsOn === 0 || defrostRearIsOn === 2) vehicle.back_window_heater_is_on = false;
    else if (defrostRearIsOn === 1) vehicle.back_window_heater_is_on = true;

    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row1.Driver.Climate.State") as any] ?? null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row1.Passenger.Climate.State") as any] ?? null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row2.Left.Climate.State") as any] ?? null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row2.Right.Climate.State") as any] ?? null;

    vehicle.headlamp_status = getChildValue(state, "Body.Lights.Front.HeadLamp.SystemWarning");
    vehicle.headlamp_left_low = getChildValue(state, "Body.Lights.Front.Left.Low.Warning");
    vehicle.headlamp_right_low = getChildValue(state, "Body.Lights.Front.Right.Low.Warning");
    vehicle.headlamp_left_high = getChildValue(state, "Body.Lights.Front.Left.High.Warning");
    vehicle.headlamp_right_high = getChildValue(state, "Body.Lights.Front.Right.High.Warning");
    vehicle.stop_lamp_left = getChildValue(state, "Body.Lights.Rear.Left.StopLamp.Warning");
    vehicle.stop_lamp_right = getChildValue(state, "Body.Lights.Rear.Right.StopLamp.Warning");
    vehicle.turn_signal_left_front = getChildValue(state, "Body.Lights.Front.Left.TurnSignal.Warning");
    vehicle.turn_signal_right_front = getChildValue(state, "Body.Lights.Front.Right.TurnSignal.Warning");
    vehicle.turn_signal_left_rear = getChildValue(state, "Body.Lights.Rear.Left.TurnSignal.Warning");
    vehicle.turn_signal_right_rear = getChildValue(state, "Body.Lights.Rear.Right.TurnSignal.Warning");

    vehicle.front_left_door_is_open = getChildValue(state, "Cabin.Door.Row1.Driver.Open");
    vehicle.front_right_door_is_open = getChildValue(state, "Cabin.Door.Row1.Passenger.Open");
    vehicle.back_left_door_is_open = getChildValue(state, "Cabin.Door.Row2.Left.Open");
    vehicle.back_right_door_is_open = getChildValue(state, "Cabin.Door.Row2.Right.Open");

    const flLock = getChildValue(state, "Cabin.Door.Row1.Driver.Lock");
    vehicle.front_left_door_is_locked = flLock != null ? !Boolean(flLock) : null;
    const frLock = getChildValue(state, "Cabin.Door.Row1.Passenger.Lock");
    vehicle.front_right_door_is_locked = frLock != null ? !Boolean(frLock) : null;
    const blLock = getChildValue(state, "Cabin.Door.Row2.Left.Lock");
    vehicle.back_left_door_is_locked = blLock != null ? !Boolean(blLock) : null;
    const brLock = getChildValue(state, "Cabin.Door.Row2.Right.Lock");
    vehicle.back_right_door_is_locked = brLock != null ? !Boolean(brLock) : null;

    vehicle.is_locked = Boolean(
      vehicle.front_left_door_is_locked &&
      vehicle.front_right_door_is_locked &&
      vehicle.back_left_door_is_locked &&
      vehicle.back_right_door_is_locked,
    );

    vehicle.hood_is_open = getChildValue(state, "Body.Hood.Open");
    vehicle.front_left_window_is_open = getChildValue(state, "Cabin.Window.Row1.Driver.Open");
    vehicle.front_right_window_is_open = getChildValue(state, "Cabin.Window.Row1.Passenger.Open");
    vehicle.back_left_window_is_open = getChildValue(state, "Cabin.Window.Row2.Left.Open");
    vehicle.back_right_window_is_open = getChildValue(state, "Cabin.Window.Row2.Right.Open");

    const sunroofOpen = getChildValue(state, "Body.Sunroof.Glass.Open");
    vehicle.sunroof_is_open = sunroofOpen != null ? Boolean(sunroofOpen) : null;

    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(getChildValue(state, "Chassis.Axle.Row2.Left.Tire.PressureLow"));
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(getChildValue(state, "Chassis.Axle.Row1.Left.Tire.PressureLow"));
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(getChildValue(state, "Chassis.Axle.Row1.Right.Tire.PressureLow"));
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(getChildValue(state, "Chassis.Axle.Row2.Right.Tire.PressureLow"));
    vehicle.tire_pressure_all_warning_is_on = Boolean(getChildValue(state, "Chassis.Axle.Tire.PressureLow"));
    vehicle.trunk_is_open = getChildValue(state, "Body.Trunk.Open");

    vehicle.ev_battery_percentage = getChildValue(state, "Green.BatteryManagement.BatteryRemain.Ratio");
    vehicle.ev_battery_pack_voltage = getChildValue(state, "Green.BatteryManagement.BatteryPackVoltage");
    vehicle.ev_battery_chiller_rpm = getChildValue(state, "Green.BatteryManagement.ChillerRPM");

    const batteryHeatingState = getChildValue(state, "Green.BatteryManagement.HeatingState");
    if (batteryHeatingState != null) vehicle.ev_battery_heating_state = Boolean(batteryHeatingState);

    vehicle.ev_battery_water_temperature = [
      getChildValue(state, "Green.BatteryManagement.Temperature.CoolingWaterInlet"),
      TEMPERATURE_UNITS[0]!,
    ] as [number, string];

    vehicle.ev_battery_temperature_min = [
      getChildValue(state, "Green.BatteryManagement.Temperature.Min.Raw"),
      TEMPERATURE_UNITS[0]!,
    ] as [number, string];

    vehicle.ev_battery_temperature_max = [
      getChildValue(state, "Green.BatteryManagement.Temperature.Max.Raw"),
      TEMPERATURE_UNITS[0]!,
    ] as [number, string];

    const batteryWinterMode = getChildValue(state, "Green.BatteryManagement.WinterModeOperation");
    if (batteryWinterMode != null) vehicle.ev_battery_winter_mode = Boolean(batteryWinterMode);

    const realTimePower = getChildValue(state, "Green.Electric.SmartGrid.RealTimePower");
    if (realTimePower != null) vehicle.ev_charging_power = realTimePower;

    vehicle.ev_battery_remain = getChildValue(state, "Green.BatteryManagement.BatteryRemain.Value");
    vehicle.ev_battery_capacity = getChildValue(state, "Green.BatteryManagement.BatteryCapacity.Value");
    vehicle.ev_battery_soh_percentage = getChildValue(state, "Green.BatteryManagement.SoH.Ratio");
    vehicle.ev_battery_is_plugged_in = getChildValue(state, "Green.ChargingInformation.ConnectorFastening.State");

    const chargingDoorState = getChildValue(state, "Green.ChargingDoor.State");
    if (chargingDoorState === 0 || chargingDoorState === 2) vehicle.ev_charge_port_door_is_open = false;
    else if (chargingDoorState === 1) vehicle.ev_charge_port_door_is_open = true;

    const dteUnit = getChildValue(state, "Drivetrain.FuelSystem.DTE.Unit");
    vehicle.total_driving_range = [
      parseFloat(String(getChildValue(state, "Drivetrain.FuelSystem.DTE.Total"))),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1],
    ] as [number, string];

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      vehicle.ev_driving_range = [
        vehicle.total_driving_range!,
        vehicle.total_driving_range_unit!,
      ] as [number, string];
    }

    vehicle.washer_fluid_warning_is_on = getChildValue(state, "Body.Windshield.Front.WasherFluid.LevelLow");

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.Charging.RemainTime"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.Quick"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.ICCB"),
      "m",
    ] as [number, string];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.Standard"),
      "m",
    ] as [number, string];

    vehicle.ev_charge_limits_ac = getChildValue(state, "Green.ChargingInformation.TargetSoC.Standard");
    vehicle.ev_charge_limits_dc = getChildValue(state, "Green.ChargingInformation.TargetSoC.Quick");
    vehicle.ev_charging_current = getChildValue(state, "Green.ChargingInformation.ElectricCurrentLevel.State");
    vehicle.ev_v2l_discharge_limit = getChildValue(state, "Green.Electric.SmartGrid.VehicleToLoad.DischargeLimitation.SoC");

    vehicle.ev_target_range_charge_AC = [
      getChildValue(state, "Green.ChargingInformation.DTE.TargetSoC.Standard"),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1],
    ] as [number, string];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(state, "Green.ChargingInformation.DTE.TargetSoC.Quick"),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1],
    ] as [number, string];

    vehicle.ev_first_departure_enabled = Boolean(getChildValue(state, "Green.Reservation.Departure.Schedule1.Enable"));
    vehicle.ev_second_departure_enabled = Boolean(getChildValue(state, "Green.Reservation.Departure.Schedule2.Enable"));

    vehicle.ev_power_consumption_battery_cooling = getChildValue(state, "Green.PowerConsumption.Moment.BatteryCooling");
    vehicle.ev_power_consumption_battery_heater = getChildValue(state, "Green.PowerConsumption.Moment.BatteryHeater");
    vehicle.ev_power_consumption_air_conditioning = getChildValue(state, "Green.PowerConsumption.Moment.ClimateAirConditioning");

    vehicle.washer_fluid_warning_is_on = getChildValue(state, "Body.Windshield.Front.WasherFluid.LevelLow");
    vehicle.brake_fluid_warning_is_on = getChildValue(state, "Chassis.Brake.Fluid.Warning");
    vehicle.fuel_level = getChildValue(state, "Drivetrain.FuelSystem.FuelLevel");
    vehicle.fuel_level_is_low = getChildValue(state, "Drivetrain.FuelSystem.LowFuelWarning");
    vehicle.air_control_is_on = getChildValue(state, "Cabin.HVAC.Row1.Driver.Blower.SpeedLevel");
    vehicle.smart_key_battery_warning_is_on = Boolean(getChildValue(state, "Electronics.FOB.LowBattery"));

    if (vehicle.ev_estimated_current_charge_duration != null) {
      if (vehicle.ev_estimated_current_charge_duration === 0) {
        vehicle.ev_battery_is_charging = false;
      } else if (vehicle.ev_estimated_current_charge_duration > 0) {
        vehicle.ev_battery_is_charging = true;
      }
    }

    if (getChildValue(state, "Location.GeoCoord.Latitude")) {
      let locationLastUpdatedAt = new Date("2000-01-01T00:00:00Z");
      const timestamp = getChildValue(state, "Location.TimeStamp");
      if (timestamp != null) {
        locationLastUpdatedAt = new Date(
          Date.UTC(
            parseInt(String(getChildValue(timestamp, "Year")), 10),
            parseInt(String(getChildValue(timestamp, "Mon")), 10) - 1,
            parseInt(String(getChildValue(timestamp, "Day")), 10),
            parseInt(String(getChildValue(timestamp, "Hour")), 10),
            parseInt(String(getChildValue(timestamp, "Min")), 10),
            parseInt(String(getChildValue(timestamp, "Sec")), 10),
          ),
        );
      }
      vehicle.location = [
        getChildValue(state, "Location.GeoCoord.Latitude"),
        getChildValue(state, "Location.GeoCoord.Longitude"),
        locationLastUpdatedAt,
      ];
    }

    vehicle.data = state;
  }

  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    let url: string;
    let payload: Record<string, any>;
    let headers: Record<string, string>;

    if (!vehicle.ccu_ccs2_protocol_support) {
      url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
      payload = { action: "start", deviceId: token.device_id };
      headers = this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support);
    } else {
      url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/charge";
      payload = { command: "start" };
      headers = await this._get_control_headers(token, vehicle);
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    let url: string;
    let payload: Record<string, any>;
    let headers: Record<string, string>;

    if (!vehicle.ccu_ccs2_protocol_support) {
      url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
      payload = { action: "stop", deviceId: token.device_id };
      headers = this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support);
    } else {
      url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/charge";
      payload = { command: "stop" };
      headers = await this._get_control_headers(token, vehicle);
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async set_charging_current(token: Token, vehicle: Vehicle, level: number): Promise<string> {
    if (!vehicle.ccu_ccs2_protocol_support) {
      throw new UnsupportedControlError("set_charging_current requires CCS2 protocol support");
    }
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/charge/chargingcurrent";
    const body = { chargingCurrent: level };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number,
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/charge/target";
    const body = {
      targetSOClist: [
        { plugType: 0, targetSOClevel: dc },
        { plugType: 1, targetSOClevel: ac },
      ],
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async set_vehicle_to_load_discharge_limit(
    token: Token,
    vehicle: Vehicle,
    limit: number,
  ): Promise<string> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/charge/dischargelimit";
    const body = { dischargingLimit: limit };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION,
  ): Promise<string> {
    let url: string;
    let payload: Record<string, any>;
    let headers: Record<string, string>;

    if (!vehicle.ccu_ccs2_protocol_support) {
      url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
      payload = { action: action, deviceId: token.device_id };
      headers = this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support);
    } else {
      url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/door";
      payload = { command: action };
      headers = await this._get_control_headers(token, vehicle);
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    action_id: string,
    synchronous: boolean = false,
    timeout: number = 0,
  ): Promise<ORDER_STATUS> {
    const url = this.SPA_API_URL + "notifications/" + vehicle.id + "/records";

    // In stateless Workers, synchronous polling is not possible.
    // If synchronous=true, just return PENDING immediately.
    if (synchronous) {
      if (timeout < 1) {
        throw new APIError("Timeout must be 1 or higher");
      }
      // Cannot poll in stateless Workers; return PENDING
      return ORDER_STATUS.PENDING;
    }

    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);

    for (const action of response["resMsg"]) {
      if (action["recordId"] === action_id) {
        if (action["result"] === "success") return ORDER_STATUS.SUCCESS;
        else if (action["result"] === "fail") return ORDER_STATUS.FAILED;
        else if (action["result"] === "non-response") return ORDER_STATUS.TIMEOUT;
        else if (action["result"] == null) return ORDER_STATUS.PENDING;
      }
    }
    return ORDER_STATUS.UNKNOWN;
  }

  async schedule_charging_and_climate(
    token: Token,
    vehicle: Vehicle,
    options: ScheduleChargingClimateRequestOptions,
  ): Promise<string> {
    let url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id;
    url += "/ccs2";
    url += "/reservation/chargehvac";

    const setDefaultDepartureOptions = (dep: DepartureOptions): void => {
      if (dep.enabled == null) dep.enabled = false;
      if (dep.days == null) dep.days = [0];
      if (dep.time == null) dep.time = "0000";
    };

    if (options.first_departure == null) options.first_departure = new DepartureOptions();
    if (options.second_departure == null) options.second_departure = new DepartureOptions();

    setDefaultDepartureOptions(options.first_departure);
    setDefaultDepartureOptions(options.second_departure);
    const departures = [options.first_departure, options.second_departure];

    if (options.charging_enabled == null) options.charging_enabled = false;
    if (options.off_peak_start_time == null) options.off_peak_start_time = "0000";
    if (options.off_peak_end_time == null) options.off_peak_end_time = options.off_peak_start_time;
    if (options.off_peak_charge_only_enabled == null) options.off_peak_charge_only_enabled = false;
    if (options.climate_enabled == null) options.climate_enabled = false;
    if (options.temperature == null) options.temperature = 21.0;
    if (options.temperature_unit == null) options.temperature_unit = 0;
    if (options.defrost == null) options.defrost = false;

    let temperature: number = options.temperature;
    if (options.temperature_unit === 0) {
      temperature = Math.round(temperature * 2.0) / 2.0;
      if (temperature > 27.0) temperature = 27.0;
      else if (temperature < 17.0) temperature = 17.0;
    }

    const payload: Record<string, any> = {};
    for (let i = 0; i < 2; i++) {
      const dep = departures[i]!;
      const timeSection = parseInt(dep.time!.slice(0, 2), 10) >= 12 ? 1 : 0;
      payload[`reservChargeInfo${i + 1}`] = {
        reservChargeSet: dep.enabled,
        reservInfo: {
          day: dep.days,
          time: {
            time: dep.time,
            timeSection: timeSection,
          },
        },
        reservFatcSet: {
          airCtrl: options.climate_enabled ? 1 : 0,
          airTemp: {
            value: `${temperature.toFixed(1)}`,
            hvacTempType: 1,
            unit: options.temperature_unit,
          },
          heating1: 0,
          defrost: options.defrost,
        },
      };
    }

    payload["offPeakPowerInfo"] = {
      offPeakPowerTime1: {
        endtime: {
          timeSection: parseInt(options.off_peak_end_time!.slice(0, 2), 10) >= 12 ? 1 : 0,
          time: options.off_peak_end_time,
        },
        starttime: {
          timeSection: parseInt(options.off_peak_start_time!.slice(0, 2), 10) >= 12 ? 1 : 0,
          time: options.off_peak_start_time,
        },
      },
      offPeakPowerFlag: options.off_peak_charge_only_enabled ? 2 : 1,
    };
    payload["reservFlag"] = options.charging_enabled ? 1 : 0;

    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions,
  ): Promise<string> {
    // Defaults
    if (options.set_temp == null) options.set_temp = 21;
    if (options.duration == null) options.duration = 5;
    if (options.defrost == null) options.defrost = false;
    if (options.climate == null) options.climate = true;
    if (options.heating == null) options.heating = 0;

    let responseJson: any;

    if (!vehicle.ccu_ccs2_protocol_support) {
      const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/temperature";
      const hexSetTemp = getIndexIntoHexTemp(
        this.temperature_range!.indexOf(options.set_temp!),
      );
      const payload = {
        action: "start",
        hvacType: 0,
        options: {
          defrost: options.defrost,
          heating1: Number(options.heating),
          igniOnDuration: options.duration,
        },
        tempCode: hexSetTemp,
        unit: "C",
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      responseJson = await resp.json();
    } else {
      const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/temperature";
      const payload = {
        command: "start",
        ignitionDuration: options.duration,
        strgWhlHeating: options.steering_wheel,
        hvacTempType: 1,
        hvacTemp: options.set_temp,
        sideRearMirrorHeating: 1,
        drvSeatLoc: "R",
        seatClimateInfo: {
          drvSeatClimateState: options.front_left_seat,
          psgSeatClimateState: options.front_right_seat,
          rrSeatClimateState: options.rear_right_seat,
          rlSeatClimateState: options.rear_left_seat,
        },
        tempUnit: "C",
        windshieldFrontDefogState: options.defrost,
      };
      const controlHeaders = await this._get_control_headers(token, vehicle);
      const resp = await fetch(url, {
        method: "POST",
        headers: { ...controlHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      responseJson = await resp.json();
    }

    checkResponseForErrors(responseJson);
    token.device_id = await this._get_device_id(this._get_stamp());
    return responseJson["msgId"];
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    let responseJson: any;

    if (!vehicle.ccu_ccs2_protocol_support) {
      const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/temperature";
      const payload = {
        action: "stop",
        hvacType: 0,
        options: { defrost: true, heating1: 1 },
        tempCode: "10H",
        unit: "C",
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      responseJson = await resp.json();
    } else {
      const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/temperature";
      const payload = { command: "stop" };
      const controlHeaders = await this._get_control_headers(token, vehicle);
      const resp = await fetch(url, {
        method: "POST",
        headers: { ...controlHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      responseJson = await resp.json();
    }

    checkResponseForErrors(responseJson);
    token.device_id = await this._get_device_id(this._get_stamp());
    return responseJson["msgId"];
  }

  async start_hazard_lights(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/light";
    const payload = { command: "on" };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async start_hazard_lights_and_horn(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/hornlight";
    const payload = { command: "on" };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async set_windows_state(
    token: Token,
    vehicle: Vehicle,
    options: WindowRequestOptions,
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/windowcurtain";
    const payload = {
      backLeft: options.back_left,
      backRight: options.back_right,
      frontLeft: options.front_left,
      frontRight: options.front_right,
    };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async set_navigation(
    token: Token,
    vehicle: Vehicle,
    poi_list: POIInfo[],
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/location/routes";
    const payload = {
      deviceID: token.device_id,
      poiInfoList: poi_list.map((poi) => poi.toDict()),
    };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }

  async _get_control_token(token: Token): Promise<[string, number]> {
    const url = this.USER_API_URL + "pin?token=";
    const headers: Record<string, string> = {
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
    if (response["controlToken"] == null) {
      throw new APIError("PIN verification failed, ensure PIN is entered correctly.");
    }
    const controlToken = "Bearer " + response["controlToken"];
    const controlTokenExpireAt = Math.floor(Date.now() / 1000 + response["expiresTime"]);
    return [controlToken, controlTokenExpireAt];
  }

  async _set_session_language(cookies: Record<string, string>): Promise<void> {
    const url = this.USER_API_URL + "language";
    const headers: Record<string, string> = {
      "Content-type": "application/json",
      Cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    };
    const payload = { lang: this.LANGUAGE };
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }
}
