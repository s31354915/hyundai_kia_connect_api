import { ApiImpl, ClimateRequestOptions, WindowRequestOptions, OTPRequest } from "./ApiImpl.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import {
  BRAND_HYUNDAI,
  BRANDS,
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  ORDER_STATUS,
  SEAT_STATUS,
  VEHICLE_LOCK_ACTION,
  WINDOW_STATE,
} from "./const.js";
import { APIError } from "./exceptions.js";
import { getIndexIntoHexTemp, parseDateBr } from "./utils.js";
import {
  DayTripCounts,
  DayTripInfo,
  MonthTripInfo,
  TripInfo,
} from "./vehicle.js";

/**
 * Brazilian Hyundai BlueLink API implementation for Cloudflare Workers
 * Extends ApiImpl with Brazil-specific OAuth2 and stateless design
 */
export class HyundaiBlueLinkApiBR extends ApiImpl {
  supports_window_control: boolean = true;
  data_timezone: string = "America/Sao_Paulo";
  temperature_range: number[] = Array.from({ length: 20 }, (_, i) => 62 + i); // 62-81°C

  private base_url: string = "br-ccapi.hyundai.com.br";
  private api_url: string = "https://br-ccapi.hyundai.com.br/api/v1/";
  private api_v2_url: string = "https://br-ccapi.hyundai.com.br/api/v2/";
  private ccsp_device_id: string = "c6e5815b-3057-4e5e-95d5-e3d5d1d2093e";
  private ccsp_service_id: string = "03f7df9b-7626-4853-b7bd-ad1e8d722bd5";
  private ccsp_application_id: string = "513a491a-0d7c-4d6a-ac03-a2df127d73b0";
  private basic_authorization_header: string =
    "Basic MDNmN2RmOWItNzYyNi00ODUzLWI3YmQtYWQxZThkNzIyYmQ1On" +
    "lRejJiYzZDbjhPb3ZWT1I3UkRXd3hUcVZ3V0czeUtCWUZEZzBIc09Yc3l4eVBsSA==";

  private api_headers: Record<string, string>;

  constructor(region: number, brand: number, language: string = "pt-BR") {
    super();
    if (BRANDS[brand] !== BRAND_HYUNDAI) {
      throw new APIError(
        `Unknown brand ${BRANDS[brand]} for region Brazil. Only Hyundai is supported.`
      );
    }

    this.api_headers = {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "br;q=1.0, gzip;q=0.9, deflate;q=0.8",
      "Accept-Language": "pt-BR;q=1.0, en-US;q=0.9",
      "User-Agent":
        "BR_BlueLink/1.0.14 (com.hyundai.bluelink.br; build:10132; iOS 18.4.0) Alamofire/5.9.1",
      Host: this.base_url,
      offset: "-3",
      ccuCCS2ProtocolSupport: "0",
    };
  }

  private _build_api_url(path: string): string {
    return new URL(path.replace(/^\//, ""), this.api_url).toString();
  }

  private _build_api_v2_url(path: string): string {
    return new URL(path.replace(/^\//, ""), this.api_v2_url).toString();
  }

  private _get_authenticated_headers(token: Token): Record<string, string> {
    const headers = { ...this.api_headers };
    const device_id = token.device_id || this.ccsp_device_id;
    headers["ccsp-device-id"] = device_id;
    headers["ccsp-application-id"] = this.ccsp_application_id;
    headers["Authorization"] = `Bearer ${token.access_token}`;
    return headers;
  }

  private async _get_cookies(): Promise<Record<string, string>> {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.ccsp_service_id,
      redirect_uri: this._build_api_url("/user/oauth2/redirect"),
    });

    const url = `${this._build_api_url("/user/oauth2/authorize")}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new APIError(`Failed to get cookies: ${response.statusText}`);
    }

    // Extract cookies from Set-Cookie headers
    const cookies: Record<string, string> = {};
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookiePairs = setCookieHeader.split(";");
      for (const pair of cookiePairs) {
        const [name, value] = pair.split("=").map((s) => s.trim());
        if (name && value) {
          cookies[name] = value;
        }
      }
    }

    return cookies;
  }

  private async _get_authorization_code(
    cookies: Record<string, string>,
    username: string,
    password: string
  ): Promise<string> {
    const url = this._build_api_url("/user/signin");
    const data = { email: username, password: password };

    const cookieHeader = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    const headers: Record<string, string> = {
      Referer: "https://br-ccapi.hyundai.com.br/web/v1/user/signin",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
      Connection: "keep-alive",
      "Content-Type": "text/plain;charset=UTF-8",
      Host: this.api_headers["Host"],
      "Accept-Language": "pt-BR,en-US;q=0.9,en;q=0.8",
      Origin: "https://br-ccapi.hyundai.com.br",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148_CCS_APP_iOS",
    };

    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new APIError(`Failed to sign in: ${response.statusText}`);
    }

    const response_data = await response.json() as Record<string, any>;

    const redirectUrl = response_data.redirectUrl;
    if (!redirectUrl) {
      throw new APIError("No redirect URL in signin response");
    }

    const parsed_url = new URL(redirectUrl);
    const authorization_code = parsed_url.searchParams.get("code");
    if (!authorization_code) {
      throw new APIError("No authorization code in redirect URL");
    }

    return authorization_code;
  }

  private async _get_auth_response(
    authorization_code: string
  ): Promise<Record<string, any>> {
    const url = this._build_api_url("/user/oauth2/token");
    const body = new URLSearchParams({
      client_id: this.ccsp_service_id,
      grant_type: "authorization_code",
      code: authorization_code,
      redirect_uri: this._build_api_url("/user/oauth2/redirect"),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "User-Agent": this.api_headers["User-Agent"],
      Authorization: this.basic_authorization_header,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body.toString(),
    });

    if (!response.ok) {
      throw new APIError(`Failed to get auth token: ${response.statusText}`);
    }

    return response.json() as Promise<Record<string, any>>;
  }

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token | OTPRequest> {
    const cookies = await this._get_cookies();
    const authorization_code = await this._get_authorization_code(
      cookies,
      username,
      password
    );
    const auth_response = await this._get_auth_response(authorization_code);

    const expires_in_seconds = auth_response.expires_in;
    const expires_at = new Date(
      Date.now() + expires_in_seconds * 1000
    );

    return new Token({
      access_token: auth_response.access_token,
      refresh_token: auth_response.refresh_token,
      valid_until: expires_at.toISOString(),
      username: username,
      password: password,
      device_id: this.ccsp_device_id,
      pin: pin || null,
    });
  }

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this._build_api_url("/spa/vehicles");
    const headers = this._get_authenticated_headers(token);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(`Failed to get vehicles: ${response.statusText}`);
    }

    const response_data = await response.json() as Record<string, any>;

    if (
      !response_data.resMsg ||
      !response_data.resMsg.vehicles
    ) {
      throw new APIError("Missing resMsg or vehicles in response");
    }

    const result: Vehicle[] = [];
    for (const entry of response_data.resMsg.vehicles) {
      const vehicle_type = entry.type;
      let entry_engine_type: string;

      if (vehicle_type === "GN") {
        entry_engine_type = ENGINE_TYPES.ICE;
      } else if (vehicle_type === "EV") {
        entry_engine_type = ENGINE_TYPES.EV;
      } else if (vehicle_type === "PHEV" || vehicle_type === "PE") {
        entry_engine_type = ENGINE_TYPES.PHEV;
      } else if (vehicle_type === "HV") {
        entry_engine_type = ENGINE_TYPES.HEV;
      } else {
        entry_engine_type = ENGINE_TYPES.ICE;
      }

      const vehicle = new Vehicle();
      vehicle.id = entry.vehicleId;
      vehicle.name = entry.nickname;
      vehicle.model = entry.vehicleName;
      vehicle.registration_date = entry.regDate;
      vehicle.VIN = entry.vin;
      vehicle.timezone = this.data_timezone;
      vehicle.ccu_ccs2_protocol_support = entry.ccuCCS2ProtocolSupport || 0;

      result.push(vehicle);
    }

    return result;
  }

  private async _get_vehicle_state(
    token: Token,
    vehicle: Vehicle,
    force_refresh: boolean = false
  ): Promise<Record<string, any>> {
    let url = this._build_api_url(`/spa/vehicles/${vehicle.id}`);

    if (!vehicle.ccu_ccs2_protocol_support) {
      url = url + "/status/latest";
    } else {
      url = url + "/ccs2/carstatus/latest";
    }

    const headers = this._get_authenticated_headers(token);
    if (force_refresh) {
      headers["REFRESH"] = "true";
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(
        `Failed to get vehicle state: ${response.statusText}`
      );
    }

    const data = await response.json() as Record<string, any>;
    return data.resMsg;
  }

  private async _get_vehicle_location(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this._build_api_url(
      `/spa/vehicles/${vehicle.id}/location/park`
    );
    const headers = this._get_authenticated_headers(token);

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as Record<string, any>;
      return data.resMsg;
    } catch {
      return null;
    }
  }

  private _update_vehicle_properties(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    // Parse timestamp
    if (state.time) {
      vehicle.last_updated_at = parseDateBr(state.time, this.data_timezone);
    } else {
      vehicle.last_updated_at = new Date();
    }

    // Basic vehicle status
    vehicle.engine_is_running = state.engine || false;
    vehicle.air_control_is_on = state.airCtrlOn || false;

    // Battery (12V car battery)
    if (state.battery) {
      vehicle.car_battery_percentage = state.battery.batSoc;
    }

    // Temperature
    if (state.airTemp) {
      const temp_value = state.airTemp.value;
      const temp_unit = state.airTemp.unit;
      if (temp_value && temp_value !== "00H") {
        try {
          if (!String(temp_value).includes("H")) {
            vehicle.air_temperature = [temp_value, temp_unit];
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Fuel information
    vehicle.fuel_level = state.fuelLevel;
    vehicle.fuel_level_is_low = state.lowFuelLight || false;

    // Driving range (DTE)
    if (state.dte) {
      const unit = DISTANCE_UNITS[state.dte.unit]!;
      vehicle.total_driving_range = [state.dte.value, unit];
    }

    // Doors
    const door_state = state.doorOpen || {};
    vehicle.is_locked = state.doorLock !== false;
    vehicle.front_left_door_is_open = Boolean(door_state.frontLeft);
    vehicle.front_right_door_is_open = Boolean(door_state.frontRight);
    vehicle.back_left_door_is_open = Boolean(door_state.backLeft);
    vehicle.back_right_door_is_open = Boolean(door_state.backRight);
    vehicle.hood_is_open = state.hoodOpen || false;
    vehicle.trunk_is_open = state.trunkOpen || false;

    // Windows
    const window_state = state.windowOpen || {};
    vehicle.front_left_window_is_open = Boolean(window_state.frontLeft);
    vehicle.front_right_window_is_open = Boolean(window_state.frontRight);
    vehicle.back_left_window_is_open = Boolean(window_state.backLeft);
    vehicle.back_right_window_is_open = Boolean(window_state.backRight);

    // Climate control
    vehicle.defrost_is_on = state.defrost || false;

    // Steering wheel heat
    const steer_heat = state.steerWheelHeat || 0;
    vehicle.steering_wheel_heater_is_on = steer_heat === 1;

    // Side/back window heat
    const side_heat = state.sideBackWindowHeat || 0;
    vehicle.back_window_heater_is_on = side_heat === 1;

    // Seat heater/ventilation status
    const seat_state = state.seatHeaterVentState || {};
    vehicle.front_left_seat_status = SEAT_STATUS[
      seat_state.drvSeatHeatState
    ] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[
      seat_state.astSeatHeatState
    ] || null;
    vehicle.rear_left_seat_status =
      SEAT_STATUS[seat_state.rlSeatHeatState] || null;
    vehicle.rear_right_seat_status =
      SEAT_STATUS[seat_state.rrSeatHeatState] || null;

    // Tire pressure warnings
    const tire_lamp = state.tirePressureLamp || {};
    vehicle.tire_pressure_all_warning_is_on = Boolean(
      tire_lamp.tirePressureLampAll
    );

    const tire_all = Boolean(tire_lamp.tirePressureLampAll);
    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(
      tire_lamp.tirePressureWarningLampRearLeft || tire_all
    );
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(
      tire_lamp.tirePressureWarningLampFrontLeft || tire_all
    );
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(
      tire_lamp.tirePressureWarningLampFrontRight || tire_all
    );
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(
      tire_lamp.tirePressureWarningLampRearRight || tire_all
    );

    // Warnings and alerts
    vehicle.washer_fluid_warning_is_on = state.washerFluidStatus || false;
    vehicle.brake_fluid_warning_is_on = state.breakOilStatus || false;
    vehicle.smart_key_battery_warning_is_on =
      state.smartKeyBatteryWarning || false;

    // Store raw data
    vehicle.data = state;
  }

  private _update_vehicle_location(
    vehicle: Vehicle,
    location_data: Record<string, any> | null
  ): void {
    if (!location_data) {
      return;
    }

    const coord = location_data.coord || {};
    const lat = coord.lat;
    const lon = coord.lng || coord.lon;
    const time_str = location_data.time;

    if (lat && lon) {
      const location_time = time_str
        ? parseDateBr(time_str, this.data_timezone)
        : null;
      vehicle.location = [lat, lon, location_time];
    }
  }

  async update_vehicle_with_cached_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state = await this._get_vehicle_state(token, vehicle, false);
    const location_data = await this._get_vehicle_location(token, vehicle);

    this._update_vehicle_properties(vehicle, state);
    this._update_vehicle_location(vehicle, location_data);
  }

  async force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state = await this._get_vehicle_state(token, vehicle, true);
    const location_data = await this._get_vehicle_location(token, vehicle);

    this._update_vehicle_properties(vehicle, state);
    this._update_vehicle_location(vehicle, location_data);
  }

  private async _ensure_control_token(token: Token): Promise<string> {
    const control_token = token.control_token;
    const expires_at = token.control_token_expires_at;

    if (
      control_token &&
      expires_at &&
      expires_at.getTime() - 5000 > Date.now()
    ) {
      return control_token;
    }

    if (!token.pin) {
      throw new APIError("PIN is required for remote commands.");
    }

    const device_id = token.device_id || this.ccsp_device_id;
    token.device_id = device_id;

    const url = this._build_api_url("/user/pin");
    const headers = this._get_authenticated_headers(token);
    const payload = { pin: token.pin, deviceId: device_id };

    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new APIError(
        `Failed to get control token: ${response.statusText}`
      );
    }

    const data = await response.json() as Record<string, any>;

    if (!data.controlToken) {
      throw new APIError("Failed to obtain control token.");
    }

    const new_control_token = `Bearer ${data.controlToken}`;
    const expires_in = data.expiresTime || 0;
    const new_expires_at = new Date(
      Date.now() + (expires_in || 600) * 1000
    );

    token.control_token = new_control_token;
    token.control_token_expires_at = new_expires_at;

    return new_control_token;
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION
  ): Promise<string> {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;

    const url = this._build_api_v2_url(
      `spa/vehicles/${vehicle.id}/control/door`
    );
    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );

    const payload = { deviceId: device_id, action: action };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new APIError(`Lock action failed: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;

    if (data.retCode !== "S") {
      throw new APIError(
        `Lock action failed: ${data.resCode} ${data.resMsg}`
      );
    }

    return data.msgId;
  }

  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    action_id: string,
    synchronous: boolean = false,
    timeout: number = 0
  ): Promise<ORDER_STATUS> {
    if (synchronous) {
      if (timeout < 1) {
        throw new APIError(
          "Timeout must be 1 or higher for synchronous checks."
        );
      }

      const end_time = Date.now() + timeout * 1000;
      while (Date.now() < end_time) {
        const state = await this.check_action_status(
          token,
          vehicle,
          action_id,
          false
        );
        if (state === ORDER_STATUS.PENDING) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        return state;
      }

      return ORDER_STATUS.TIMEOUT;
    }

    const url = this._build_api_url(`/spa/notifications/${vehicle.id}/records`);
    const headers = this._get_authenticated_headers(token);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(
        `Failed to check action status: ${response.statusText}`
      );
    }

    const data = await response.json() as Record<string, any>;
    const records = data.resMsg || [];

    for (const record of records) {
      if (record.recordId !== action_id) {
        continue;
      }

      const result = (record.result || "").toLowerCase();
      if (result === "success") {
        return ORDER_STATUS.SUCCESS;
      }
      if (result === "fail") {
        return ORDER_STATUS.FAILED;
      }
      if (result === "non-response") {
        return ORDER_STATUS.TIMEOUT;
      }
      if (result === "" || result === "pending" || result === null) {
        return ORDER_STATUS.PENDING;
      }
    }

    return ORDER_STATUS.UNKNOWN;
  }

  async set_windows_state(
    token: Token,
    vehicle: Vehicle,
    options: WindowRequestOptions
  ): Promise<string> {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;

    const url = this._build_api_v2_url(`spa/vehicles/${vehicle.id}/control/window`);

    // Brazilian API controls all windows together
    let action = "open";
    if (
      options.front_left === WINDOW_STATE.CLOSED ||
      options.front_right === WINDOW_STATE.CLOSED ||
      options.back_left === WINDOW_STATE.CLOSED ||
      options.back_right === WINDOW_STATE.CLOSED
    ) {
      action = "close";
    }

    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );

    const payload = { action: action, deviceId: device_id };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new APIError(`Window action failed: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;

    if (data.retCode !== "S") {
      throw new APIError(
        `Window action failed: ${data.resCode} ${data.resMsg}`
      );
    }

    return data.msgId;
  }

  async start_hazard_lights(token: Token, vehicle: Vehicle): Promise<string> {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;

    const url = this._build_api_v2_url(`spa/vehicles/${vehicle.id}/control/light`);
    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    if (!response.ok) {
      throw new APIError(`Hazard lights failed: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;

    if (data.retCode !== "S") {
      throw new APIError(
        `Hazard lights failed: ${data.resCode} ${data.resMsg}`
      );
    }

    return data.msgId;
  }

  async get_notification_history(
    token: Token,
    vehicle: Vehicle
  ): Promise<any[]> {
    const url = this._build_api_url(`/spa/notifications/${vehicle.id}/history`);
    const headers = this._get_authenticated_headers(token);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(
        `Failed to get notification history: ${response.statusText}`
      );
    }

    const data = await response.json() as Record<string, any>;
    return data.resMsg || [];
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions
  ): Promise<string> {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;

    const url = this._build_api_v2_url(
      `spa/vehicles/${vehicle.id}/control/engine`
    );

    // Set defaults
    const set_temp = options.set_temp !== null ? options.set_temp : 21;
    const duration = options.duration !== null ? options.duration : 10;
    const defrost = options.defrost !== null ? options.defrost : false;
    const climate = options.climate !== null ? options.climate : true;
    const heating = options.heating !== null ? options.heating : 0;
    const front_left_seat =
      options.front_left_seat !== null ? options.front_left_seat : 0;

    // Convert temperature to hex code
    const temp_celsius = Math.floor(set_temp);
    const temp_code = getIndexIntoHexTemp(temp_celsius);

    const seat_heat_cmd = front_left_seat || 0;

    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );

    const payload = {
      action: "start",
      options: {
        airCtrl: climate ? 1 : 0,
        heating1: heating,
        seatHeaterVentCMD: { drvSeatOptCmd: seat_heat_cmd },
        defrost: defrost,
        igniOnDuration: duration,
      },
      hvacType: 1,
      deviceId: device_id,
      tempCode: temp_code,
      unit: "C",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new APIError(`Start climate failed: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;

    if (data.retCode !== "S") {
      throw new APIError(
        `Start climate failed: ${data.resCode} ${data.resMsg}`
      );
    }

    return data.msgId;
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;

    const url = this._build_api_v2_url(
      `spa/vehicles/${vehicle.id}/control/engine`
    );

    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );

    const payload = { action: "stop", deviceId: device_id };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new APIError(`Stop climate failed: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, any>;

    if (data.retCode !== "S") {
      throw new APIError(
        `Stop climate failed: ${data.resCode} ${data.resMsg}`
      );
    }

    return data.msgId;
  }

  async update_month_trip_info(
    token: Token,
    vehicle: Vehicle,
    yyyymm_string: string
  ): Promise<void> {
    const url = this._build_api_url(`/spa/vehicles/${vehicle.id}/tripinfo`);
    const data = { tripPeriodType: 0, setTripMonth: yyyymm_string };

    const headers = this._get_authenticated_headers(token);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return;
      }

      const trip_response = await response.json() as Record<string, any>;
      const trip_data = trip_response.resMsg;

      if ((trip_data.monthTripDayCnt || 0) > 0) {
        const result = new MonthTripInfo();
        result.yyyymm = yyyymm_string;
        result.day_list = [];
        result.summary = new TripInfo();
        result.summary.drive_time = trip_data.tripDrvTime;
        result.summary.idle_time = trip_data.tripIdleTime;
        result.summary.distance = trip_data.tripDist;
        result.summary.avg_speed = trip_data.tripAvgSpeed;
        result.summary.max_speed = trip_data.tripMaxSpeed;

        for (const day of trip_data.tripDayList || []) {
          const processed_day = new DayTripCounts();
          processed_day.yyyymmdd = day.tripDayInMonth;
          processed_day.trip_count = day.tripCntDay;
          result.day_list.push(processed_day);
        }

        vehicle.month_trip_info = result;
      }
    } catch {
      // Silently fail
    }
  }

  async update_day_trip_info(
    token: Token,
    vehicle: Vehicle,
    yyyymmdd_string: string
  ): Promise<void> {
    const url = this._build_api_url(`/spa/vehicles/${vehicle.id}/tripinfo`);
    const data = { tripPeriodType: 1, setTripDay: yyyymmdd_string };

    const headers = this._get_authenticated_headers(token);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return;
      }

      const trip_response = await response.json() as Record<string, any>;
      const trip_data = trip_response.resMsg;
      const day_trip_list = trip_data.dayTripList || [];

      if (day_trip_list.length > 0) {
        const msg = day_trip_list[0];
        const result = new DayTripInfo();
        result.yyyymmdd = yyyymmdd_string;
        result.trip_list = [];
        result.summary = new TripInfo();
        result.summary.drive_time = msg.tripDrvTime;
        result.summary.idle_time = msg.tripIdleTime;
        result.summary.distance = msg.tripDist;
        result.summary.avg_speed = msg.tripAvgSpeed;
        result.summary.max_speed = msg.tripMaxSpeed;

        for (const trip of msg.tripList || []) {
          const processed_trip = new TripInfo();
          processed_trip.hhmmss = trip.tripTime;
          processed_trip.drive_time = trip.tripDrvTime;
          processed_trip.idle_time = trip.tripIdleTime;
          processed_trip.distance = trip.tripDist;
          processed_trip.avg_speed = trip.tripAvgSpeed;
          processed_trip.max_speed = trip.tripMaxSpeed;
          result.trip_list.push(processed_trip);
        }

        vehicle.day_trip_info = result;
      }
    } catch {
      // Silently fail
    }
  }

  // Methods not implemented for Brazil region
  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    throw new Error("start_charge is not implemented for Brazil region");
  }

  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    throw new Error("stop_charge is not implemented for Brazil region");
  }

  async set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number
  ): Promise<string> {
    throw new Error("set_charge_limits is not implemented for Brazil region");
  }
}
