var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-m2RfQZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-m2RfQZ/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/const.ts
var DOMAIN = "hyundai_kia_connect_api";
var BRAND_KIA = "Kia";
var BRAND_HYUNDAI = "Hyundai";
var BRAND_GENESIS = "Genesis";
var BRANDS = { 1: BRAND_KIA, 2: BRAND_HYUNDAI, 3: BRAND_GENESIS };
var GOOGLE = "google";
var OPENSTREETMAP = "openstreetmap";
var GEO_LOCATION_PROVIDERS = { 1: OPENSTREETMAP, 2: GOOGLE };
var REGION_EUROPE = "Europe";
var REGION_CANADA = "Canada";
var REGION_USA = "USA";
var REGION_CHINA = "China";
var REGION_AUSTRALIA = "Australia";
var REGION_NZ = "New Zealand";
var REGION_INDIA = "India";
var REGION_BRAZIL = "Brazil";
var REGIONS = {
  1: REGION_EUROPE,
  2: REGION_CANADA,
  3: REGION_USA,
  4: REGION_CHINA,
  5: REGION_AUSTRALIA,
  6: REGION_INDIA,
  7: REGION_NZ,
  8: REGION_BRAZIL
};
var LOGIN_TOKEN_LIFETIME_SECONDS = 23 * 60 * 60;
var LENGTH_KILOMETERS = "km";
var LENGTH_MILES = "mi";
var DISTANCE_UNITS = {
  0: null,
  1: LENGTH_KILOMETERS,
  2: LENGTH_MILES,
  3: LENGTH_MILES
};
var TEMPERATURE_C = "\xB0C";
var TEMPERATURE_F = "\xB0F";
var TEMPERATURE_UNITS = {
  0: TEMPERATURE_C,
  1: TEMPERATURE_F
};
var SEAT_STATUS = {
  0: "Off",
  1: "On",
  2: "Off",
  3: "Low Cool",
  4: "Medium Cool",
  5: "High Cool",
  6: "Low Heat",
  7: "Medium Heat",
  8: "High Heat"
};

// src/utils.ts
function getChildValue(data, key) {
  let value = data;
  for (const x of key.split(".")) {
    try {
      value = value[x];
    } catch {
      try {
        value = value[parseInt(x, 10)];
      } catch {
        return null;
      }
    }
    if (value == null)
      return null;
  }
  return value;
}
__name(getChildValue, "getChildValue");
function getFloat(value) {
  if (value == null)
    return null;
  if (typeof value === "number")
    return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
__name(getFloat, "getFloat");
function getHexTempIntoIndex(value) {
  if (value != null) {
    const stripped = value.replace("H", "");
    return parseInt(stripped, 16);
  }
  return null;
}
__name(getHexTempIntoIndex, "getHexTempIntoIndex");
function getIndexIntoHexTemp(value) {
  if (value != null) {
    const hex = value.toString(16);
    return hex.toUpperCase().padStart(3, "0") + "H";
  }
  return null;
}
__name(getIndexIntoHexTemp, "getIndexIntoHexTemp");
function parseDatetime(value, timezone) {
  if (!value)
    return /* @__PURE__ */ new Date("2000-01-01T00:00:00Z");
  const gmtMatch = value.match(/^[A-Z][a-z]{2},\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT$/);
  if (gmtMatch) {
    const d = new Date(value);
    if (!isNaN(d.getTime()))
      return d;
  }
  const cleaned = value.replace(/[-T:Z]/g, "");
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (m) {
    const d = new Date(
      Date.UTC(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10),
        parseInt(m[6], 10)
      )
    );
    return d;
  }
  throw new Error(`Unable to parse datetime value: ${value}`);
}
__name(parseDatetime, "parseDatetime");
function parseDateBr(dateString, tz) {
  if (!dateString)
    return null;
  if (dateString.length >= 14) {
    const m = dateString.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (m) {
      return new Date(
        Date.UTC(
          parseInt(m[1], 10),
          parseInt(m[2], 10) - 1,
          parseInt(m[3], 10),
          parseInt(m[4], 10),
          parseInt(m[5], 10),
          parseInt(m[6], 10)
        )
      );
    }
  }
  if (dateString.length >= 8) {
    const m = dateString.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) {
      return new Date(
        Date.UTC(
          parseInt(m[1], 10),
          parseInt(m[2], 10) - 1,
          parseInt(m[3], 10)
        )
      );
    }
  }
  return null;
}
__name(parseDateBr, "parseDateBr");
async function rsaEncryptPkcs1v15(jwkN, jwkE, plaintext) {
  function base64UrlToBigInt(b64url) {
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0)
      b64 += "=";
    const binary = atob(b64);
    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex.length > 0 ? BigInt("0x" + hex) : 0n;
  }
  __name(base64UrlToBigInt, "base64UrlToBigInt");
  const n = base64UrlToBigInt(jwkN);
  const e = base64UrlToBigInt(jwkE);
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwkN, e: jwkE, alg: "RSA-OAEP" },
    // we'll use raw RSA below
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const keyLen = Math.ceil(n.toString(16).length / 2);
  const msgLen = plaintext.length;
  if (msgLen > keyLen - 11) {
    throw new Error("Message too long for RSA key");
  }
  const padded = new Uint8Array(keyLen);
  padded[0] = 0;
  padded[1] = 2;
  for (let i = 2; i < keyLen - msgLen - 1; i++) {
    let rand = 0;
    while (rand === 0) {
      const buf = new Uint8Array(1);
      crypto.getRandomValues(buf);
      rand = buf[0];
    }
    padded[i] = rand;
  }
  padded[keyLen - msgLen - 1] = 0;
  padded.set(plaintext, keyLen - msgLen);
  const m = bufferToBigInt(padded);
  const c = bigIntModPow(m, e, n);
  return bigIntToHex(c);
}
__name(rsaEncryptPkcs1v15, "rsaEncryptPkcs1v15");
function bufferToBigInt(buf) {
  let hex = "";
  for (const b of buf)
    hex += b.toString(16).padStart(2, "0");
  return hex.length > 0 ? BigInt("0x" + hex) : 0n;
}
__name(bufferToBigInt, "bufferToBigInt");
function bigIntToHex(n) {
  return n.toString(16);
}
__name(bigIntToHex, "bigIntToHex");
function bigIntModPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = result * base % mod;
    }
    exp = exp / 2n;
    base = base * base % mod;
  }
  return result;
}
__name(bigIntModPow, "bigIntModPow");

// src/ApiImpl.ts
var ClimateRequestOptions = class {
  set_temp = null;
  duration = null;
  defrost = null;
  climate = null;
  heating = null;
  front_left_seat = null;
  front_right_seat = null;
  rear_left_seat = null;
  rear_right_seat = null;
  steering_wheel = null;
};
__name(ClimateRequestOptions, "ClimateRequestOptions");
var WindowRequestOptions = class {
  back_left = null;
  back_right = null;
  front_left = null;
  front_right = null;
};
__name(WindowRequestOptions, "WindowRequestOptions");
var OTPRequest = class {
  request_id;
  otp_key;
  has_email;
  has_sms;
  email;
  sms;
  constructor(data = {}) {
    this.request_id = data.request_id ?? null;
    this.otp_key = data.otp_key ?? null;
    this.has_email = data.has_email ?? null;
    this.has_sms = data.has_sms ?? null;
    this.email = data.email ?? null;
    this.sms = data.sms ?? null;
  }
};
__name(OTPRequest, "OTPRequest");
var DepartureOptions = class {
  enabled = null;
  days = null;
  time = null;
  // "HHMM" format
};
__name(DepartureOptions, "DepartureOptions");
var ApiImpl = class {
  data_timezone = "UTC";
  temperature_range = null;
  previous_latitude = null;
  previous_longitude = null;
  supports_window_control = false;
  async send_otp(_otp_request, _notify_type) {
    throw new Error("send_otp is not implemented for this region");
  }
  async verify_otp_and_complete_login(_username, _password, _otp_code, _otp_request, _pin) {
    throw new Error("verify_otp_and_complete_login is not implemented for this region");
  }
  async refresh_vehicles(_token, _vehicles) {
    return;
  }
  test_token(_token) {
    return true;
  }
  async check_action_status(_token, _vehicle, _action_id, _synchronous = false, _timeout = 0) {
    return "PENDING" /* PENDING */;
  }
  async update_geocoded_location(token, vehicle, use_email, provider = 1, API_KEY = null) {
    if (vehicle.location_latitude && vehicle.location_longitude) {
      if (vehicle.geocode && vehicle.location_latitude === this.previous_latitude && vehicle.location_longitude === this.previous_longitude) {
        return;
      } else if (GEO_LOCATION_PROVIDERS[provider] === OPENSTREETMAP) {
        let email_parameter = "";
        if (use_email) {
          email_parameter = "&email=" + token.username;
        }
        const url = "https://nominatim.openstreetmap.org/reverse?lat=" + String(vehicle.location_latitude) + "&lon=" + String(vehicle.location_longitude) + "&format=json&addressdetails=1&zoom=18" + email_parameter;
        const headers = { "user-agent": "curl/7.81.0" };
        try {
          const resp = await fetch(url, { headers });
          const data = await resp.json();
          vehicle.geocode = [
            getChildValue(data, "display_name"),
            getChildValue(data, "address")
          ];
          this.previous_latitude = vehicle.location_latitude;
          this.previous_longitude = vehicle.location_longitude;
        } catch {
          vehicle.geocode = null;
        }
      } else if (GEO_LOCATION_PROVIDERS[provider] === GOOGLE) {
        if (!API_KEY) {
          vehicle.geocode = null;
        } else {
          try {
            const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + String(vehicle.location_latitude) + "," + String(vehicle.location_longitude) + "&key=" + API_KEY;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.results && data.results.length > 0) {
              vehicle.geocode = [
                data.results[0].formatted_address,
                data.results[0].address_components
              ];
              this.previous_latitude = vehicle.location_latitude;
              this.previous_longitude = vehicle.location_longitude;
            }
          } catch {
            vehicle.geocode = null;
          }
        }
      }
    }
  }
  async set_charging_current(_token, _vehicle, _level) {
    throw new Error("set_charging_current is not implemented for this region");
  }
  async set_windows_state(_token, _vehicle, _options) {
    throw new Error("set_windows_state is not implemented for this region");
  }
  async charge_port_action(_token, _vehicle, _action) {
    throw new Error("charge_port_action is not implemented for this region");
  }
  async update_month_trip_info(_token, _vehicle, _yyyymm_string) {
    throw new Error("update_month_trip_info is not implemented for this region");
  }
  async update_day_trip_info(_token, _vehicle, _yyyymmdd_string) {
    throw new Error("update_day_trip_info is not implemented for this region");
  }
  async schedule_charging_and_climate(_token, _vehicle, _options) {
    throw new Error("schedule_charging_and_climate is not implemented for this region");
  }
  async start_hazard_lights(_token, _vehicle) {
    throw new Error("start_hazard_lights is not implemented for this region");
  }
  async start_hazard_lights_and_horn(_token, _vehicle) {
    throw new Error("start_hazard_lights_and_horn is not implemented for this region");
  }
  async valet_mode_action(_token, _vehicle, _action) {
    throw new Error("valet_mode_action is not implemented for this region");
  }
  async set_vehicle_to_load_discharge_limit(_token, _vehicle, _limit) {
    throw new Error("set_vehicle_to_load_discharge_limit is not implemented for this region");
  }
  async set_navigation(_token, _vehicle, _poi_list) {
    throw new Error("set_navigation is not implemented for this region");
  }
  async refresh_access_token(token) {
    return this.login(token.username ?? "", token.password ?? "", token.pin);
  }
};
__name(ApiImpl, "ApiImpl");

// src/token.ts
var Token = class {
  username;
  password;
  access_token;
  refresh_token;
  device_id;
  valid_until;
  stamp;
  pin;
  control_token;
  control_token_expires_at;
  constructor(data = {}) {
    this.username = data.username ?? null;
    this.password = data.password ?? null;
    this.access_token = data.access_token ?? null;
    this.refresh_token = data.refresh_token ?? null;
    this.device_id = data.device_id ?? null;
    this.stamp = data.stamp ?? null;
    this.pin = data.pin ?? null;
    this.control_token = data.control_token ?? null;
    const validUntil = data.valid_until;
    if (typeof validUntil === "string") {
      this.valid_until = new Date(validUntil);
    } else {
      this.valid_until = /* @__PURE__ */ new Date(0);
    }
    const ctrlExpires = data.control_token_expires_at;
    if (typeof ctrlExpires === "string") {
      this.control_token_expires_at = new Date(ctrlExpires);
    } else {
      this.control_token_expires_at = null;
    }
  }
  toDict() {
    return {
      username: this.username,
      password: this.password,
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      device_id: this.device_id,
      valid_until: this.valid_until.toISOString(),
      stamp: this.stamp,
      pin: this.pin,
      control_token: this.control_token,
      control_token_expires_at: this.control_token_expires_at?.toISOString() ?? null
    };
  }
  static fromDict(data) {
    return new Token(data);
  }
};
__name(Token, "Token");

// src/vehicle.ts
var TripInfo = class {
  hhmmss = null;
  drive_time = null;
  idle_time = null;
  distance = null;
  avg_speed = null;
  max_speed = null;
};
__name(TripInfo, "TripInfo");
var DayTripCounts = class {
  yyyymmdd = null;
  trip_count = null;
};
__name(DayTripCounts, "DayTripCounts");
var MonthTripInfo = class {
  yyyymm = null;
  summary = null;
  day_list = [];
};
__name(MonthTripInfo, "MonthTripInfo");
var DayTripInfo = class {
  yyyymmdd = null;
  summary = null;
  trip_list = [];
};
__name(DayTripInfo, "DayTripInfo");
var DailyDrivingStats = class {
  date = null;
  total_consumed = null;
  engine_consumption = null;
  climate_consumption = null;
  onboard_electronics_consumption = null;
  battery_care_consumption = null;
  regenerated_energy = null;
  distance = null;
  distance_unit = DISTANCE_UNITS[1] ?? "km";
};
__name(DailyDrivingStats, "DailyDrivingStats");
var Vehicle = class {
  id = null;
  name = null;
  model = null;
  registration_date = null;
  year = null;
  VIN = null;
  key = null;
  ccu_ccs2_protocol_support = null;
  generation = null;
  enabled = true;
  // General
  _total_driving_range = null;
  _total_driving_range_value = null;
  _total_driving_range_unit = null;
  _odometer = null;
  _odometer_value = null;
  _odometer_unit = null;
  _geocode_address = null;
  _geocode_name = null;
  car_battery_percentage = null;
  engine_is_running = null;
  _last_updated_at = null;
  timezone = "UTC";
  dtc_count = null;
  dtc_descriptions = null;
  smart_key_battery_warning_is_on = null;
  washer_fluid_warning_is_on = null;
  brake_fluid_warning_is_on = null;
  _outside_temperature = null;
  _outside_temperature_value = null;
  _outside_temperature_unit = null;
  // Climate
  _air_temperature = null;
  _air_temperature_value = null;
  _air_temperature_unit = null;
  air_control_is_on = null;
  defrost_is_on = null;
  steering_wheel_heater_is_on = null;
  back_window_heater_is_on = null;
  side_mirror_heater_is_on = null;
  front_left_seat_status = null;
  front_right_seat_status = null;
  rear_left_seat_status = null;
  rear_right_seat_status = null;
  // Kia USA specific seat heater fields
  front_left_seat_heater_is_on = null;
  front_right_seat_heater_is_on = null;
  rear_left_seat_heater_is_on = null;
  rear_right_seat_heater_is_on = null;
  // Door Status
  is_locked = null;
  front_left_door_is_locked = null;
  front_right_door_is_locked = null;
  back_left_door_is_locked = null;
  back_right_door_is_locked = null;
  front_left_door_is_open = null;
  front_right_door_is_open = null;
  back_left_door_is_open = null;
  back_right_door_is_open = null;
  trunk_is_open = null;
  hood_is_open = null;
  // Window Status
  front_left_window_is_open = null;
  front_right_window_is_open = null;
  back_left_window_is_open = null;
  back_right_window_is_open = null;
  sunroof_is_open = null;
  supports_window_control = null;
  // Tire Pressure
  tire_pressure_all_warning_is_on = null;
  tire_pressure_rear_left_warning_is_on = null;
  tire_pressure_front_left_warning_is_on = null;
  tire_pressure_front_right_warning_is_on = null;
  tire_pressure_rear_right_warning_is_on = null;
  // Service Data
  _next_service_distance = null;
  _next_service_distance_value = null;
  _next_service_distance_unit = null;
  _last_service_distance = null;
  _last_service_distance_value = null;
  _last_service_distance_unit = null;
  // Location
  _location_latitude = null;
  _location_longitude = null;
  _location_last_set_time = null;
  // EV fields
  ev_charge_port_door_is_open = null;
  ev_charging_power = null;
  ev_charge_limits_dc = null;
  ev_charge_limits_ac = null;
  ev_charging_current = null;
  ev_v2l_discharge_limit = null;
  ev_v2l_status = null;
  ev_v2x_status = null;
  total_power_consumed = null;
  total_power_regenerated = null;
  power_consumption_30d = null;
  _daily_stats = null;
  // Other statuses from KiaCA logs
  accessory_on = null;
  ign3 = null;
  remote_ignition = null;
  transmission_condition = null;
  sleep_mode_check = null;
  // Lamp status fields
  headlamp_status = null;
  headlamp_left_low = null;
  headlamp_right_low = null;
  headlamp_left_high = null;
  headlamp_right_high = null;
  headlamp_left_bifunc = null;
  headlamp_right_bifunc = null;
  stop_lamp_left = null;
  stop_lamp_right = null;
  turn_signal_left_front = null;
  turn_signal_right_front = null;
  turn_signal_left_rear = null;
  turn_signal_right_rear = null;
  ev_battery_percentage = null;
  ev_battery_pack_voltage = null;
  ev_battery_chiller_rpm = null;
  ev_battery_heating_state = null;
  _ev_battery_water_temperature = null;
  _ev_battery_water_temperature_value = null;
  _ev_battery_water_temperature_unit = null;
  _ev_battery_temperature_min = null;
  _ev_battery_temperature_min_value = null;
  _ev_battery_temperature_min_unit = null;
  _ev_battery_temperature_max = null;
  _ev_battery_temperature_max_value = null;
  _ev_battery_temperature_max_unit = null;
  ev_battery_winter_mode = null;
  ev_battery_soh_percentage = null;
  ev_battery_remain = null;
  ev_battery_capacity = null;
  ev_battery_is_charging = null;
  ev_battery_is_plugged_in = null;
  _ev_driving_range = null;
  _ev_driving_range_value = null;
  _ev_driving_range_unit = null;
  _ev_estimated_current_charge_duration = null;
  _ev_estimated_current_charge_duration_value = null;
  _ev_estimated_current_charge_duration_unit = null;
  _ev_estimated_fast_charge_duration = null;
  _ev_estimated_fast_charge_duration_value = null;
  _ev_estimated_fast_charge_duration_unit = null;
  _ev_estimated_portable_charge_duration = null;
  _ev_estimated_portable_charge_duration_value = null;
  _ev_estimated_portable_charge_duration_unit = null;
  ev_battery_precondition_enabled = null;
  _ev_estimated_station_charge_duration = null;
  _ev_estimated_station_charge_duration_value = null;
  _ev_estimated_station_charge_duration_unit = null;
  _ev_target_range_charge_AC = null;
  _ev_target_range_charge_AC_value = null;
  _ev_target_range_charge_AC_unit = null;
  _ev_target_range_charge_DC = null;
  _ev_target_range_charge_DC_value = null;
  _ev_target_range_charge_DC_unit = null;
  ev_power_consumption_battery_cooling = null;
  ev_power_consumption_battery_heater = null;
  ev_power_consumption_air_conditioning = null;
  ev_first_departure_enabled = null;
  ev_second_departure_enabled = null;
  ev_first_departure_days = null;
  ev_second_departure_days = null;
  ev_first_departure_time = null;
  // stored as "HHMM" string
  ev_second_departure_time = null;
  ev_first_departure_climate_enabled = null;
  ev_second_departure_climate_enabled = null;
  _ev_first_departure_climate_temperature = null;
  _ev_first_departure_climate_temperature_value = null;
  _ev_first_departure_climate_temperature_unit = null;
  _ev_second_departure_climate_temperature = null;
  _ev_second_departure_climate_temperature_value = null;
  _ev_second_departure_climate_temperature_unit = null;
  ev_first_departure_climate_defrost = null;
  ev_second_departure_climate_defrost = null;
  ev_off_peak_start_time = null;
  ev_off_peak_end_time = null;
  ev_off_peak_charge_only_enabled = null;
  ev_schedule_charge_enabled = null;
  // IC fields
  _fuel_driving_range = null;
  _fuel_driving_range_value = null;
  _fuel_driving_range_unit = null;
  fuel_level = null;
  fuel_level_is_low = null;
  engine_type = null;
  data = null;
  _month_trip_info = null;
  _day_trip_info = null;
  // --- Computed properties (getters/setters) ---
  get daily_stats() {
    return this._daily_stats;
  }
  set daily_stats(value) {
    if (value && value.length > 0) {
      value.sort((a, b) => {
        const da = a.date?.getTime() ?? 0;
        const db = b.date?.getTime() ?? 0;
        return db - da;
      });
    }
    this._daily_stats = value;
  }
  get month_trip_info() {
    return this._month_trip_info;
  }
  set month_trip_info(value) {
    if (value?.day_list && value.day_list.length > 0) {
      value.day_list.sort((a, b) => (a.yyyymmdd ?? "").localeCompare(b.yyyymmdd ?? ""));
    }
    this._month_trip_info = value;
  }
  get day_trip_info() {
    return this._day_trip_info;
  }
  set day_trip_info(value) {
    if (value?.trip_list && value.trip_list.length > 0) {
      value.trip_list.sort((a, b) => (b.hhmmss ?? "").localeCompare(a.hhmmss ?? ""));
    }
    this._day_trip_info = value;
  }
  get geocode() {
    return this._geocode_name ? [this._geocode_name, this._geocode_address] : null;
  }
  set geocode(value) {
    if (value) {
      this._geocode_name = value[0];
      this._geocode_address = value[1];
    } else {
      this._geocode_name = null;
      this._geocode_address = null;
    }
  }
  get total_driving_range() {
    return this._total_driving_range;
  }
  get total_driving_range_unit() {
    return this._total_driving_range_unit;
  }
  set total_driving_range(value) {
    if (value) {
      this._total_driving_range_value = value[0];
      this._total_driving_range_unit = value[1];
      this._total_driving_range = value[0];
    }
  }
  get next_service_distance() {
    return this._next_service_distance;
  }
  set next_service_distance(value) {
    if (value) {
      this._next_service_distance_value = value[0];
      this._next_service_distance_unit = value[1];
      this._next_service_distance = value[0];
    }
  }
  get last_service_distance() {
    return this._last_service_distance;
  }
  set last_service_distance(value) {
    if (value) {
      this._last_service_distance_value = value[0];
      this._last_service_distance_unit = value[1];
      this._last_service_distance = value[0];
    }
  }
  get last_updated_at() {
    return this._last_updated_at;
  }
  set last_updated_at(value) {
    if (!value) {
      this._last_updated_at = value;
      return;
    }
    const newest = value;
    const previous = this._last_updated_at;
    if (newest && previous) {
      if (newest < previous) {
        const offset = newest.getTimezoneOffset();
        const corrected = new Date(newest.getTime() - offset * 6e4);
        if (corrected >= previous) {
          this._last_updated_at = corrected;
          return;
        }
        this._last_updated_at = previous;
        return;
      }
    }
    this._last_updated_at = newest;
  }
  get location_latitude() {
    return this._location_latitude;
  }
  get location_longitude() {
    return this._location_longitude;
  }
  get location() {
    return this._location_longitude != null && this._location_latitude != null ? [this._location_longitude, this._location_latitude] : null;
  }
  get location_last_updated_at() {
    return this._location_last_set_time;
  }
  set location(value) {
    if (value) {
      this._location_latitude = value[0];
      this._location_longitude = value[1];
      this._location_last_set_time = value[2];
    }
  }
  get odometer() {
    return this._odometer;
  }
  get odometer_unit() {
    return this._odometer_unit;
  }
  set odometer(value) {
    if (value) {
      const floatVal = typeof value[0] === "number" ? value[0] : parseFloat(String(value[0]));
      this._odometer_value = isNaN(floatVal) ? null : floatVal;
      this._odometer_unit = value[1];
      this._odometer = this._odometer_value;
    }
  }
  get outside_temperature() {
    return this._outside_temperature;
  }
  set outside_temperature(value) {
    if (value) {
      this._outside_temperature_value = value[0];
      this._outside_temperature_unit = value[1];
      this._outside_temperature = value[0];
    }
  }
  get air_temperature() {
    return this._air_temperature;
  }
  set air_temperature(value) {
    if (value) {
      this._air_temperature_value = value[0] === "OFF" ? null : typeof value[0] === "number" ? value[0] : null;
      this._air_temperature_unit = value[1];
      this._air_temperature = value[0] === "OFF" ? null : (typeof value[0] === "number" ? value[0] : parseFloat(String(value[0]))) || null;
    }
  }
  get ev_battery_water_temperature() {
    return this._ev_battery_water_temperature;
  }
  get ev_battery_water_temperature_unit() {
    return this._ev_battery_water_temperature_unit;
  }
  set ev_battery_water_temperature(value) {
    if (value) {
      this._ev_battery_water_temperature_value = value[0];
      this._ev_battery_water_temperature_unit = value[1];
      this._ev_battery_water_temperature = value[0];
    }
  }
  get ev_battery_temperature_min() {
    return this._ev_battery_temperature_min;
  }
  get ev_battery_temperature_min_unit() {
    return this._ev_battery_temperature_min_unit;
  }
  set ev_battery_temperature_min(value) {
    if (value) {
      this._ev_battery_temperature_min_value = value[0];
      this._ev_battery_temperature_min_unit = value[1];
      this._ev_battery_temperature_min = value[0];
    }
  }
  get ev_battery_temperature_max() {
    return this._ev_battery_temperature_max;
  }
  get ev_battery_temperature_max_unit() {
    return this._ev_battery_temperature_max_unit;
  }
  set ev_battery_temperature_max(value) {
    if (value) {
      this._ev_battery_temperature_max_value = value[0];
      this._ev_battery_temperature_max_unit = value[1];
      this._ev_battery_temperature_max = value[0];
    }
  }
  get ev_driving_range() {
    return this._ev_driving_range;
  }
  get ev_driving_range_unit() {
    return this._ev_driving_range_unit;
  }
  set ev_driving_range(value) {
    if (value) {
      this._ev_driving_range_value = value[0];
      this._ev_driving_range_unit = value[1];
      this._ev_driving_range = value[0];
    }
  }
  get ev_estimated_current_charge_duration() {
    return this._ev_estimated_current_charge_duration;
  }
  set ev_estimated_current_charge_duration(value) {
    if (value) {
      this._ev_estimated_current_charge_duration_value = value[0];
      this._ev_estimated_current_charge_duration_unit = value[1];
      this._ev_estimated_current_charge_duration = value[0];
    }
  }
  get ev_estimated_fast_charge_duration() {
    return this._ev_estimated_fast_charge_duration;
  }
  set ev_estimated_fast_charge_duration(value) {
    if (value) {
      this._ev_estimated_fast_charge_duration_value = value[0];
      this._ev_estimated_fast_charge_duration_unit = value[1];
      this._ev_estimated_fast_charge_duration = value[0];
    }
  }
  get ev_estimated_portable_charge_duration() {
    return this._ev_estimated_portable_charge_duration;
  }
  set ev_estimated_portable_charge_duration(value) {
    if (value) {
      this._ev_estimated_portable_charge_duration_value = value[0];
      this._ev_estimated_portable_charge_duration_unit = value[1];
      this._ev_estimated_portable_charge_duration = value[0];
    }
  }
  get ev_estimated_station_charge_duration() {
    return this._ev_estimated_station_charge_duration;
  }
  set ev_estimated_station_charge_duration(value) {
    if (value) {
      this._ev_estimated_station_charge_duration_value = value[0];
      this._ev_estimated_station_charge_duration_unit = value[1];
      this._ev_estimated_station_charge_duration = value[0];
    }
  }
  get ev_target_range_charge_AC() {
    return this._ev_target_range_charge_AC;
  }
  get ev_target_range_charge_AC_unit() {
    return this._ev_target_range_charge_AC_unit;
  }
  set ev_target_range_charge_AC(value) {
    if (value) {
      this._ev_target_range_charge_AC_value = value[0];
      this._ev_target_range_charge_AC_unit = value[1];
      this._ev_target_range_charge_AC = value[0];
    }
  }
  get ev_target_range_charge_DC() {
    return this._ev_target_range_charge_DC;
  }
  get ev_target_range_charge_DC_unit() {
    return this._ev_target_range_charge_DC_unit;
  }
  set ev_target_range_charge_DC(value) {
    if (value) {
      this._ev_target_range_charge_DC_value = value[0];
      this._ev_target_range_charge_DC_unit = value[1];
      this._ev_target_range_charge_DC = value[0];
    }
  }
  get ev_first_departure_climate_temperature() {
    return this._ev_first_departure_climate_temperature;
  }
  get ev_first_departure_climate_temperature_unit() {
    return this._ev_first_departure_climate_temperature_unit;
  }
  set ev_first_departure_climate_temperature(value) {
    if (value) {
      this._ev_first_departure_climate_temperature_value = value[0];
      this._ev_first_departure_climate_temperature_unit = value[1];
      this._ev_first_departure_climate_temperature = value[0];
    }
  }
  get ev_second_departure_climate_temperature() {
    return this._ev_second_departure_climate_temperature;
  }
  get ev_second_departure_climate_temperature_unit() {
    return this._ev_second_departure_climate_temperature_unit;
  }
  set ev_second_departure_climate_temperature(value) {
    if (value) {
      this._ev_second_departure_climate_temperature_value = value[0];
      this._ev_second_departure_climate_temperature_unit = value[1];
      this._ev_second_departure_climate_temperature = value[0];
    }
  }
  get fuel_driving_range() {
    return this._fuel_driving_range;
  }
  set fuel_driving_range(value) {
    if (value) {
      this._fuel_driving_range_value = value[0];
      this._fuel_driving_range_unit = value[1];
      this._fuel_driving_range = value[0];
    }
  }
};
__name(Vehicle, "Vehicle");

// src/exceptions.ts
var HyundaiKiaException = class extends Error {
  constructor(message) {
    super(message);
    this.name = "HyundaiKiaException";
  }
};
__name(HyundaiKiaException, "HyundaiKiaException");
var AuthenticationError = class extends HyundaiKiaException {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
};
__name(AuthenticationError, "AuthenticationError");
var APIError = class extends HyundaiKiaException {
  constructor(message) {
    super(message);
    this.name = "APIError";
  }
};
__name(APIError, "APIError");
var DeviceIDError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "DeviceIDError";
  }
};
__name(DeviceIDError, "DeviceIDError");
var RateLimitingError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "RateLimitingError";
  }
};
__name(RateLimitingError, "RateLimitingError");
var NoDataFound = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "NoDataFound";
  }
};
__name(NoDataFound, "NoDataFound");
var ServiceTemporaryUnavailable = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "ServiceTemporaryUnavailable";
  }
};
__name(ServiceTemporaryUnavailable, "ServiceTemporaryUnavailable");
var DuplicateRequestError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "DuplicateRequestError";
  }
};
__name(DuplicateRequestError, "DuplicateRequestError");
var UnsupportedControlError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "UnsupportedControlError";
  }
};
__name(UnsupportedControlError, "UnsupportedControlError");
var RequestTimeoutError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "RequestTimeoutError";
  }
};
__name(RequestTimeoutError, "RequestTimeoutError");
var InvalidAPIResponseError = class extends APIError {
  constructor(message) {
    super(message);
    this.name = "InvalidAPIResponseError";
  }
};
__name(InvalidAPIResponseError, "InvalidAPIResponseError");
var ConsentRequiredError = class extends AuthenticationError {
  constructor(message) {
    super(message);
    this.name = "ConsentRequiredError";
  }
};
__name(ConsentRequiredError, "ConsentRequiredError");

// src/ApiImplType1.ts
var USER_AGENT_OK_HTTP = "okhttp/3.12.0";
function checkResponseForErrors(response) {
  const errorCodeMapping = {
    "7501": AuthenticationError,
    "4002": DeviceIDError,
    "4004": DuplicateRequestError,
    "4005": UnsupportedControlError,
    "4081": RequestTimeoutError,
    "5031": ServiceTemporaryUnavailable,
    "5091": RateLimitingError,
    "5921": NoDataFound,
    "9999": RequestTimeoutError
  };
  const errorMessageToExceptionMapping = {
    "Key not authorized: Token is expired": AuthenticationError,
    "Key not authorized: token has expired": AuthenticationError
  };
  if (!["retCode", "resCode", "resMsg", "error", "access_token"].some(
    (k) => k in response
  )) {
    throw new InvalidAPIResponseError();
  }
  if ("retCode" in response && response["retCode"] === "F") {
    if (response["resCode"] in errorCodeMapping) {
      throw new errorCodeMapping[response["resCode"]](response["resMsg"]);
    }
    throw new APIError(
      `Server returned:  '${response["resCode"]}' '${response["resMsg"]}'`
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
__name(checkResponseForErrors, "checkResponseForErrors");
var ApiImplType1 = class extends ApiImpl {
  supports_window_control = true;
  LANGUAGE = "en";
  async get_vehicles(token) {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    const result = [];
    for (const entry of response["resMsg"]["vehicles"]) {
      let entryEngineType = null;
      if (entry["type"] === "GN")
        entryEngineType = "ICE" /* ICE */;
      else if (entry["type"] === "EV")
        entryEngineType = "EV" /* EV */;
      else if (entry["type"] === "PHEV")
        entryEngineType = "PHEV" /* PHEV */;
      else if (entry["type"] === "HV")
        entryEngineType = "HEV" /* HEV */;
      else if (entry["type"] === "PE")
        entryEngineType = "PHEV" /* PHEV */;
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
  _getTimeFromString(value, timesection) {
    if (value == null)
      return null;
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
  _get_authenticated_headers(token, ccs2_support = null) {
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
      "User-Agent": USER_AGENT_OK_HTTP
    };
  }
  async _get_control_headers(token, vehicle) {
    const [controlToken, _] = await this._get_control_token(token);
    const authenticatedHeaders = this._get_authenticated_headers(
      token,
      vehicle.ccu_ccs2_protocol_support
    );
    return {
      ...authenticatedHeaders,
      Authorization: controlToken,
      AuthorizationCCSP: controlToken
    };
  }
  _update_vehicle_properties_ccs2(vehicle, state) {
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
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    vehicle.odometer = [
      getChildValue(state, "Drivetrain.Odometer"),
      DISTANCE_UNITS[1]
    ];
    vehicle.car_battery_percentage = getChildValue(
      state,
      "Electronics.Battery.Level"
    );
    vehicle.engine_is_running = getChildValue(state, "DrivingReady");
    const airTemp = getChildValue(
      state,
      "Cabin.HVAC.Row1.Driver.Temperature.Value"
    );
    if (airTemp != null && airTemp !== "OFF") {
      vehicle.air_temperature = [parseFloat(String(airTemp)), TEMPERATURE_UNITS[1]];
    }
    const outsideTemp = getChildValue(state, "Cabin.HVAC.OutsideTemperature.Value");
    const outsideTempUnit = getChildValue(state, "Cabin.HVAC.OutsideTemperature.Unit");
    if (outsideTemp != null && outsideTempUnit != null) {
      vehicle.outside_temperature = [
        parseFloat(String(outsideTemp)),
        TEMPERATURE_UNITS[outsideTempUnit] ?? TEMPERATURE_UNITS[0]
      ];
    }
    const defrostIsOn = getChildValue(state, "Body.Windshield.Front.Defog.State");
    if (defrostIsOn === 0 || defrostIsOn === 2)
      vehicle.defrost_is_on = false;
    else if (defrostIsOn === 1)
      vehicle.defrost_is_on = true;
    const steerWheelHeat = getChildValue(state, "Cabin.SteeringWheel.Heat.State");
    if (steerWheelHeat === 0 || steerWheelHeat === 2)
      vehicle.steering_wheel_heater_is_on = false;
    else if (steerWheelHeat === 1)
      vehicle.steering_wheel_heater_is_on = true;
    const defrostRearIsOn = getChildValue(state, "Body.Windshield.Rear.Defog.State");
    if (defrostRearIsOn === 0 || defrostRearIsOn === 2)
      vehicle.back_window_heater_is_on = false;
    else if (defrostRearIsOn === 1)
      vehicle.back_window_heater_is_on = true;
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row1.Driver.Climate.State")] ?? null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row1.Passenger.Climate.State")] ?? null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row2.Left.Climate.State")] ?? null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "Cabin.Seat.Row2.Right.Climate.State")] ?? null;
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
      vehicle.front_left_door_is_locked && vehicle.front_right_door_is_locked && vehicle.back_left_door_is_locked && vehicle.back_right_door_is_locked
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
    if (batteryHeatingState != null)
      vehicle.ev_battery_heating_state = Boolean(batteryHeatingState);
    vehicle.ev_battery_water_temperature = [
      getChildValue(state, "Green.BatteryManagement.Temperature.CoolingWaterInlet"),
      TEMPERATURE_UNITS[0]
    ];
    vehicle.ev_battery_temperature_min = [
      getChildValue(state, "Green.BatteryManagement.Temperature.Min.Raw"),
      TEMPERATURE_UNITS[0]
    ];
    vehicle.ev_battery_temperature_max = [
      getChildValue(state, "Green.BatteryManagement.Temperature.Max.Raw"),
      TEMPERATURE_UNITS[0]
    ];
    const batteryWinterMode = getChildValue(state, "Green.BatteryManagement.WinterModeOperation");
    if (batteryWinterMode != null)
      vehicle.ev_battery_winter_mode = Boolean(batteryWinterMode);
    const realTimePower = getChildValue(state, "Green.Electric.SmartGrid.RealTimePower");
    if (realTimePower != null)
      vehicle.ev_charging_power = realTimePower;
    vehicle.ev_battery_remain = getChildValue(state, "Green.BatteryManagement.BatteryRemain.Value");
    vehicle.ev_battery_capacity = getChildValue(state, "Green.BatteryManagement.BatteryCapacity.Value");
    vehicle.ev_battery_soh_percentage = getChildValue(state, "Green.BatteryManagement.SoH.Ratio");
    vehicle.ev_battery_is_plugged_in = getChildValue(state, "Green.ChargingInformation.ConnectorFastening.State");
    const chargingDoorState = getChildValue(state, "Green.ChargingDoor.State");
    if (chargingDoorState === 0 || chargingDoorState === 2)
      vehicle.ev_charge_port_door_is_open = false;
    else if (chargingDoorState === 1)
      vehicle.ev_charge_port_door_is_open = true;
    const dteUnit = getChildValue(state, "Drivetrain.FuelSystem.DTE.Unit");
    vehicle.total_driving_range = [
      parseFloat(String(getChildValue(state, "Drivetrain.FuelSystem.DTE.Total"))),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1]
    ];
    if (vehicle.engine_type === "EV" /* EV */) {
      vehicle.ev_driving_range = [
        vehicle.total_driving_range,
        vehicle.total_driving_range_unit
      ];
    }
    vehicle.washer_fluid_warning_is_on = getChildValue(state, "Body.Windshield.Front.WasherFluid.LevelLow");
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.Charging.RemainTime"),
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.Quick"),
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.ICCB"),
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "Green.ChargingInformation.EstimatedTime.Standard"),
      "m"
    ];
    vehicle.ev_charge_limits_ac = getChildValue(state, "Green.ChargingInformation.TargetSoC.Standard");
    vehicle.ev_charge_limits_dc = getChildValue(state, "Green.ChargingInformation.TargetSoC.Quick");
    vehicle.ev_charging_current = getChildValue(state, "Green.ChargingInformation.ElectricCurrentLevel.State");
    vehicle.ev_v2l_discharge_limit = getChildValue(state, "Green.Electric.SmartGrid.VehicleToLoad.DischargeLimitation.SoC");
    vehicle.ev_target_range_charge_AC = [
      getChildValue(state, "Green.ChargingInformation.DTE.TargetSoC.Standard"),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1]
    ];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(state, "Green.ChargingInformation.DTE.TargetSoC.Quick"),
      DISTANCE_UNITS[dteUnit] ?? DISTANCE_UNITS[1]
    ];
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
      let locationLastUpdatedAt = /* @__PURE__ */ new Date("2000-01-01T00:00:00Z");
      const timestamp = getChildValue(state, "Location.TimeStamp");
      if (timestamp != null) {
        locationLastUpdatedAt = new Date(
          Date.UTC(
            parseInt(String(getChildValue(timestamp, "Year")), 10),
            parseInt(String(getChildValue(timestamp, "Mon")), 10) - 1,
            parseInt(String(getChildValue(timestamp, "Day")), 10),
            parseInt(String(getChildValue(timestamp, "Hour")), 10),
            parseInt(String(getChildValue(timestamp, "Min")), 10),
            parseInt(String(getChildValue(timestamp, "Sec")), 10)
          )
        );
      }
      vehicle.location = [
        getChildValue(state, "Location.GeoCoord.Latitude"),
        getChildValue(state, "Location.GeoCoord.Longitude"),
        locationLastUpdatedAt
      ];
    }
    vehicle.data = state;
  }
  async start_charge(token, vehicle) {
    let url;
    let payload;
    let headers;
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
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async stop_charge(token, vehicle) {
    let url;
    let payload;
    let headers;
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
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async set_charging_current(token, vehicle, level) {
    if (!vehicle.ccu_ccs2_protocol_support) {
      throw new UnsupportedControlError("set_charging_current requires CCS2 protocol support");
    }
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/charge/chargingcurrent";
    const body = { chargingCurrent: level };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async set_charge_limits(token, vehicle, ac, dc) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/charge/target";
    const body = {
      targetSOClist: [
        { plugType: 0, targetSOClevel: dc },
        { plugType: 1, targetSOClevel: ac }
      ]
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async set_vehicle_to_load_discharge_limit(token, vehicle, limit) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/charge/dischargelimit";
    const body = { dischargingLimit: limit };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async lock_action(token, vehicle, action) {
    let url;
    let payload;
    let headers;
    if (!vehicle.ccu_ccs2_protocol_support) {
      url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
      payload = { action, deviceId: token.device_id };
      headers = this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support);
    } else {
      url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/door";
      payload = { command: action };
      headers = await this._get_control_headers(token, vehicle);
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async check_action_status(token, vehicle, action_id, synchronous = false, timeout = 0) {
    const url = this.SPA_API_URL + "notifications/" + vehicle.id + "/records";
    if (synchronous) {
      if (timeout < 1) {
        throw new APIError("Timeout must be 1 or higher");
      }
      return "PENDING" /* PENDING */;
    }
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    for (const action of response["resMsg"]) {
      if (action["recordId"] === action_id) {
        if (action["result"] === "success")
          return "SUCCESS" /* SUCCESS */;
        else if (action["result"] === "fail")
          return "FAILED" /* FAILED */;
        else if (action["result"] === "non-response")
          return "TIMEOUT" /* TIMEOUT */;
        else if (action["result"] == null)
          return "PENDING" /* PENDING */;
      }
    }
    return "UNKNOWN" /* UNKNOWN */;
  }
  async schedule_charging_and_climate(token, vehicle, options) {
    let url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id;
    url += "/ccs2";
    url += "/reservation/chargehvac";
    const setDefaultDepartureOptions = /* @__PURE__ */ __name((dep) => {
      if (dep.enabled == null)
        dep.enabled = false;
      if (dep.days == null)
        dep.days = [0];
      if (dep.time == null)
        dep.time = "0000";
    }, "setDefaultDepartureOptions");
    if (options.first_departure == null)
      options.first_departure = new DepartureOptions();
    if (options.second_departure == null)
      options.second_departure = new DepartureOptions();
    setDefaultDepartureOptions(options.first_departure);
    setDefaultDepartureOptions(options.second_departure);
    const departures = [options.first_departure, options.second_departure];
    if (options.charging_enabled == null)
      options.charging_enabled = false;
    if (options.off_peak_start_time == null)
      options.off_peak_start_time = "0000";
    if (options.off_peak_end_time == null)
      options.off_peak_end_time = options.off_peak_start_time;
    if (options.off_peak_charge_only_enabled == null)
      options.off_peak_charge_only_enabled = false;
    if (options.climate_enabled == null)
      options.climate_enabled = false;
    if (options.temperature == null)
      options.temperature = 21;
    if (options.temperature_unit == null)
      options.temperature_unit = 0;
    if (options.defrost == null)
      options.defrost = false;
    let temperature = options.temperature;
    if (options.temperature_unit === 0) {
      temperature = Math.round(temperature * 2) / 2;
      if (temperature > 27)
        temperature = 27;
      else if (temperature < 17)
        temperature = 17;
    }
    const payload = {};
    for (let i = 0; i < 2; i++) {
      const dep = departures[i];
      const timeSection = parseInt(dep.time.slice(0, 2), 10) >= 12 ? 1 : 0;
      payload[`reservChargeInfo${i + 1}`] = {
        reservChargeSet: dep.enabled,
        reservInfo: {
          day: dep.days,
          time: {
            time: dep.time,
            timeSection
          }
        },
        reservFatcSet: {
          airCtrl: options.climate_enabled ? 1 : 0,
          airTemp: {
            value: `${temperature.toFixed(1)}`,
            hvacTempType: 1,
            unit: options.temperature_unit
          },
          heating1: 0,
          defrost: options.defrost
        }
      };
    }
    payload["offPeakPowerInfo"] = {
      offPeakPowerTime1: {
        endtime: {
          timeSection: parseInt(options.off_peak_end_time.slice(0, 2), 10) >= 12 ? 1 : 0,
          time: options.off_peak_end_time
        },
        starttime: {
          timeSection: parseInt(options.off_peak_start_time.slice(0, 2), 10) >= 12 ? 1 : 0,
          time: options.off_peak_start_time
        }
      },
      offPeakPowerFlag: options.off_peak_charge_only_enabled ? 2 : 1
    };
    payload["reservFlag"] = options.charging_enabled ? 1 : 0;
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async start_climate(token, vehicle, options) {
    if (options.set_temp == null)
      options.set_temp = 21;
    if (options.duration == null)
      options.duration = 5;
    if (options.defrost == null)
      options.defrost = false;
    if (options.climate == null)
      options.climate = true;
    if (options.heating == null)
      options.heating = 0;
    let responseJson;
    if (!vehicle.ccu_ccs2_protocol_support) {
      const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/temperature";
      const hexSetTemp = getIndexIntoHexTemp(
        this.temperature_range.indexOf(options.set_temp)
      );
      const payload = {
        action: "start",
        hvacType: 0,
        options: {
          defrost: options.defrost,
          heating1: Number(options.heating),
          igniOnDuration: options.duration
        },
        tempCode: hexSetTemp,
        unit: "C"
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
          rlSeatClimateState: options.rear_left_seat
        },
        tempUnit: "C",
        windshieldFrontDefogState: options.defrost
      };
      const controlHeaders = await this._get_control_headers(token, vehicle);
      const resp = await fetch(url, {
        method: "POST",
        headers: { ...controlHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      responseJson = await resp.json();
    }
    checkResponseForErrors(responseJson);
    token.device_id = await this._get_device_id(this._get_stamp());
    return responseJson["msgId"];
  }
  async stop_climate(token, vehicle) {
    let responseJson;
    if (!vehicle.ccu_ccs2_protocol_support) {
      const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/temperature";
      const payload = {
        action: "stop",
        hvacType: 0,
        options: { defrost: true, heating1: 1 },
        tempCode: "10H",
        unit: "C"
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      responseJson = await resp.json();
    } else {
      const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/temperature";
      const payload = { command: "stop" };
      const controlHeaders = await this._get_control_headers(token, vehicle);
      const resp = await fetch(url, {
        method: "POST",
        headers: { ...controlHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      responseJson = await resp.json();
    }
    checkResponseForErrors(responseJson);
    token.device_id = await this._get_device_id(this._get_stamp());
    return responseJson["msgId"];
  }
  async start_hazard_lights(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/light";
    const payload = { command: "on" };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async start_hazard_lights_and_horn(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/hornlight";
    const payload = { command: "on" };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async set_windows_state(token, vehicle, options) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/windowcurtain";
    const payload = {
      backLeft: options.back_left,
      backRight: options.back_right,
      frontLeft: options.front_left,
      frontRight: options.front_right
    };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async set_navigation(token, vehicle, poi_list) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/location/routes";
    const payload = {
      deviceID: token.device_id,
      poiInfoList: poi_list.map((poi) => poi.toDict())
    };
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...controlHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async _get_control_token(token) {
    const url = this.USER_API_URL + "pin?token=";
    const headers = {
      Authorization: token.access_token ?? "",
      "Content-type": "application/json",
      Host: this.BASE_URL,
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP
    };
    const data = { deviceId: token.device_id, pin: token.pin };
    const resp = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    });
    const response = await resp.json();
    if (response["controlToken"] == null) {
      throw new APIError("PIN verification failed, ensure PIN is entered correctly.");
    }
    const controlToken = "Bearer " + response["controlToken"];
    const controlTokenExpireAt = Math.floor(Date.now() / 1e3 + response["expiresTime"]);
    return [controlToken, controlTokenExpireAt];
  }
  async _set_session_language(cookies) {
    const url = this.USER_API_URL + "language";
    const headers = {
      "Content-type": "application/json",
      Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ")
    };
    const payload = { lang: this.LANGUAGE };
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  }
};
__name(ApiImplType1, "ApiImplType1");

// src/KiaUvoApiEU.ts
var USER_AGENT_OK_HTTP2 = "okhttp/3.12.0";
var USER_AGENT_MOZILLA = "Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19";
var SUPPORTED_LANGUAGES_LIST = [
  "en",
  // English
  "de",
  // German
  "fr",
  // French
  "it",
  // Italian
  "es",
  // Spanish
  "sv",
  // Swedish
  "nl",
  // Dutch
  "no",
  // Norwegian
  "cs",
  // Czech
  "sk",
  // Slovak
  "hu",
  // Hungarian
  "da",
  // Danish
  "pl",
  // Polish
  "fi",
  // Finnish
  "pt"
  // Portuguese
];
var KiaUvoApiEU = class extends ApiImplType1 {
  data_timezone = "Europe/Berlin";
  temperature_range = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  LANGUAGE;
  brand;
  BASE_DOMAIN = "";
  PORT = 0;
  CCSP_SERVICE_ID = "";
  CCS_SERVICE_SECRET = "";
  APP_ID = "";
  CFB = new Uint8Array();
  BASIC_AUTHORIZATION = "";
  LOGIN_FORM_HOST = "";
  PUSH_TYPE = "";
  BASE_URL = "";
  USER_API_URL = "";
  SPA_API_URL = "";
  SPA_API_URL_V2 = "";
  CLIENT_ID = "";
  GCM_SENDER_ID = 199360397125;
  _oauth_redirect_uri = "";
  _cookies = {};
  constructor(region, brand, language) {
    super();
    let normalizedLanguage = language.toLowerCase();
    if (normalizedLanguage.length > 2) {
      normalizedLanguage = normalizedLanguage.substring(0, 2);
    }
    if (!SUPPORTED_LANGUAGES_LIST.includes(normalizedLanguage)) {
      console.warn(
        `Unsupported language: ${language}, fallback to en`
      );
      normalizedLanguage = "en";
    }
    this.LANGUAGE = normalizedLanguage;
    this.brand = brand;
    const brandName = BRANDS[brand];
    if (brandName === BRAND_KIA) {
      this.BASE_DOMAIN = "prd.eu-ccapi.kia.com";
      this.PORT = 8080;
      this.CCSP_SERVICE_ID = "fdc85c00-0a2f-4c64-bcb4-2cfb1500730a";
      this.CCS_SERVICE_SECRET = "secret";
      this.APP_ID = "a2b8469b-30a3-4361-8e13-6fceea8fbe74";
      this.CFB = this._base64Decode(
        "wLTVxwidmH8CfJYBWSnHD6E0huk0ozdiuygB4hLkM5XCgzAL1Dk5sE36d/bx5PFMbZs="
      );
      this.BASIC_AUTHORIZATION = "Basic ZmRjODVjMDAtMGEyZi00YzY0LWJjYjQtMmNmYjE1MDA3MzBhOnNlY3JldA==";
      this.LOGIN_FORM_HOST = "https://idpconnect-eu.kia.com";
      this.PUSH_TYPE = "APNS";
    } else if (brandName === BRAND_HYUNDAI) {
      this.BASE_DOMAIN = "prd.eu-ccapi.hyundai.com";
      this.PORT = 8080;
      this.CCSP_SERVICE_ID = "6d477c38-3ca4-4cf3-9557-2a1929a94654";
      this.CCS_SERVICE_SECRET = "KUy49XxPzLpLuoK0xhBC77W6VXhmtQR9iQhmIFjjoY4IpxsV";
      this.APP_ID = "014d2225-8495-4735-812d-2616334fd15d";
      this.CFB = this._base64Decode(
        "RFtoRq/vDXJmRndoZaZQyfOot7OrIqGVFj96iY2WL3yyH5Z/pUvlUhqmCxD2t+D65SQ="
      );
      this.BASIC_AUTHORIZATION = "Basic NmQ0NzdjMzgtM2NhNC00Y2YzLTk1NTctMmExOTI5YTk0NjU0OktVeTQ5WHhQekxwTHVvSzB4aEJDNzdXNlZYaG10UVI5aVFobUlGampvWTRJcHhzVg==";
      this.LOGIN_FORM_HOST = "https://idpconnect-eu.hyundai.com";
      this.PUSH_TYPE = "GCM";
    } else if (brandName === BRAND_GENESIS) {
      this.BASE_DOMAIN = "prd-eu-ccapi.genesis.com";
      this.PORT = 443;
      this.CCSP_SERVICE_ID = "3020afa2-30ff-412a-aa51-d28fbe901e10";
      this.CCS_SERVICE_SECRET = "FKDdlef2ffdleFEweELFKERiLER2FED21sDdwdgQz6hFESE3";
      this.APP_ID = "f11f2b86-e0e7-4851-90df-5600b01d8b70";
      this.CFB = this._base64Decode(
        "RFtoRq/vDXJmRndoZaZQyYo3/qFLtVReW8P7utRPcc0ZxOzOELm9mexvviBk/qqIp4A="
      );
      this.BASIC_AUTHORIZATION = "Basic MzAyMGFmYTItMzBmZi00MTJhLWFhNTEtZDI4ZmJlOTAxZTEwOkZLRGRsZWYyZmZkbGVGRXdlRUxGS0VSaUxFUjJGRUQyMXNEZHdkZ1F6NmhGRVNFMw==";
      this.LOGIN_FORM_HOST = "https://idpconnect-eu.genesis.com";
      this.PUSH_TYPE = "GCM";
    }
    this.BASE_URL = this.BASE_DOMAIN + ":" + String(this.PORT);
    this.USER_API_URL = "https://" + this.BASE_URL + "/api/v1/user/";
    this.SPA_API_URL = "https://" + this.BASE_URL + "/api/v1/spa/";
    this.SPA_API_URL_V2 = "https://" + this.BASE_URL + "/api/v2/spa/";
    this.CLIENT_ID = this.CCSP_SERVICE_ID;
    if (brandName === BRAND_KIA) {
      this._oauth_redirect_uri = this.USER_API_URL + "oauth2/redirect";
    } else if (brandName === BRAND_HYUNDAI) {
      this._oauth_redirect_uri = this.USER_API_URL + "oauth2/token";
    } else if (brandName === BRAND_GENESIS) {
      this._oauth_redirect_uri = "https://accounts-eu.genesis.com/realms/eugenesisidm/ga-api/redirect2";
    }
  }
  async login(username, password, pin) {
    const stamp = this._get_stamp();
    const device_id = await this._get_device_id(stamp);
    const cookies = await this._get_cookies();
    await this._set_session_language(cookies);
    const isRefreshToken = /^[A-Z0-9]{48}$/.test(password);
    let access_token;
    let refresh_token;
    let expires_in;
    if (isRefreshToken) {
      const result = await this._get_access_token(stamp, password);
      access_token = result.access_token;
      refresh_token = result.refresh_token;
      expires_in = result.expires_in;
    } else {
      const result = await this._login_with_password(username, password);
      access_token = result.access_token;
      refresh_token = result.refresh_token;
      expires_in = result.expires_in;
    }
    const valid_until = new Date(Date.now() + expires_in * 1e3);
    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until: valid_until.toISOString(),
      pin: pin ?? null
    });
  }
  async _login_with_password(username, password) {
    const host = this.LOGIN_FORM_HOST;
    const client_id = this.CCSP_SERVICE_ID;
    const client_secret = this.CCS_SERVICE_SECRET;
    const redirect_uri = this._oauth_redirect_uri;
    const mobile_ua = USER_AGENT_MOZILLA + "_CCS_APP_AOS";
    const auth_url = `${host}/auth/api/v2/user/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&lang=en&state=ccsp&country=de`;
    await fetch(auth_url, {
      headers: { "User-Agent": mobile_ua },
      redirect: "follow"
    });
    const certResp = await fetch(`${host}/auth/api/v1/accounts/certs`, {
      headers: { "User-Agent": mobile_ua }
    });
    if (certResp.status !== 200) {
      throw new AuthenticationError(
        `API error: failed to fetch RSA certs: HTTP ${certResp.status}. This may indicate a Hyundai API change.`
      );
    }
    const certData = await certResp.json();
    const jwk = certData.retValue || {};
    const kid = jwk.kid || "";
    if (!jwk.n || !jwk.e) {
      throw new AuthenticationError("Missing RSA key components (n or e)");
    }
    const encryptedPw = await rsaEncryptPkcs1v15(
      jwk.n,
      jwk.e,
      new TextEncoder().encode(password)
    );
    const signinResp = await fetch(`${host}/auth/account/signin`, {
      method: "POST",
      headers: {
        "User-Agent": mobile_ua,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id,
        encryptedPassword: "true",
        password: encryptedPw,
        redirect_uri,
        scope: "",
        nonce: "",
        state: "ccsp",
        username,
        connector_session_key: "",
        kid,
        _csrf: ""
      }).toString(),
      redirect: "manual"
    });
    if (signinResp.status !== 302) {
      const text = await signinResp.text();
      throw new AuthenticationError(
        `Signin failed: HTTP ${signinResp.status} \u2014 ${text.substring(0, 300)}. Check username and password.`
      );
    }
    const location = signinResp.headers.get("location") || "";
    const urlObj = new URL(location, host);
    const code = urlObj.searchParams.get("code");
    if (!code) {
      if (location.toLowerCase().includes("error")) {
        const error_description = urlObj.searchParams.get("error_description");
        throw new AuthenticationError(
          `Authentication rejected: ${error_description}. Check username and password.`
        );
      }
      if (location.includes("/web/v1/user/authorization")) {
        throw new ConsentRequiredError(
          "Account consent is required. Please log in via a browser once to accept the terms, then use the refresh token."
        );
      }
      if (location.includes("authorize")) {
        throw new AuthenticationError(
          "Authentication failed \u2014 returned to login page. Check username and password."
        );
      }
      throw new AuthenticationError(
        `API error: unexpected redirect after signin: ${location.substring(0, 250)}`
      );
    }
    const tokenResp = await fetch(`${host}/auth/api/v2/user/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id,
        client_secret
      }).toString()
    });
    if (tokenResp.status !== 200) {
      const text = await tokenResp.text();
      throw new AuthenticationError(
        `API error: token exchange failed: HTTP ${tokenResp.status} \u2014 ${text.substring(0, 200)}. This may indicate a Hyundai API change.`
      );
    }
    const tokens = await tokenResp.json();
    const access_token = tokens.token_type + " " + tokens.access_token;
    const refresh_token = tokens.refresh_token;
    const expires_in = parseInt(tokens.expires_in || "86400", 10);
    return { access_token, refresh_token, expires_in };
  }
  async refresh_access_token(token) {
    if (token.refresh_token) {
      try {
        const stamp = this._get_stamp();
        const result = await this._get_access_token(stamp, token.refresh_token);
        const valid_until = new Date(Date.now() + result.expires_in * 1e3);
        return new Token({
          username: token.username,
          password: token.password,
          access_token: result.access_token,
          refresh_token: result.refresh_token || token.refresh_token,
          device_id: token.device_id,
          valid_until: valid_until.toISOString(),
          pin: token.pin
        });
      } catch (error) {
        console.warn(
          "Refresh token exchange failed, falling back to full login"
        );
      }
    }
    return this.login(token.username || "", token.password || "", token.pin);
  }
  async update_vehicle_with_cached_state(token, vehicle) {
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
      )
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    if (vehicle.ccu_ccs2_protocol_support === 0) {
      this._update_vehicle_properties(
        vehicle,
        response.resMsg.vehicleStatusInfo
      );
    } else {
      const state = response.resMsg.state.Vehicle;
      this._update_vehicle_properties_ccs2(vehicle, state);
    }
    this._set_cached_location_park(token, vehicle);
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
      try {
        const state = await this._get_driving_info(token, vehicle);
        if (state) {
          this._update_vehicle_drive_info(vehicle, state);
        }
      } catch (error) {
        console.error(
          "Failed to parse driving info. Possible reasons: incompatible vehicle (ICE), new API format, API outage",
          error
        );
      }
    }
  }
  async force_refresh_vehicle_state(token, vehicle) {
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;
    if (is_ccs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const state = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      state.vehicleLocation = location;
      this._update_vehicle_properties(vehicle, state);
    }
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
      try {
        const state = await this._get_driving_info(token, vehicle);
        if (state) {
          this._update_vehicle_drive_info(vehicle, state);
        }
      } catch (error) {
        console.error(
          "Failed to parse driving info. Possible reasons: new API format, API outage",
          error
        );
      }
    }
  }
  async _force_refresh_vehicle_state_ccs2(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      )
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    const state = response.resMsg.state.Vehicle;
    this._update_vehicle_properties_ccs2(vehicle, state);
    this._set_cached_location_park(token, vehicle);
  }
  _update_vehicle_properties(vehicle, state) {
    if (getChildValue(state, "vehicleStatus.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "vehicleStatus.time"),
        this.data_timezone
      );
    } else {
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    if (getChildValue(state, "odometer.value")) {
      vehicle.odometer = [
        getChildValue(state, "odometer.value"),
        DISTANCE_UNITS[getChildValue(state, "odometer.unit")]
      ];
    }
    vehicle.car_battery_percentage = getChildValue(
      state,
      "vehicleStatus.battery.batSoc"
    );
    vehicle.engine_is_running = getChildValue(state, "vehicleStatus.engine");
    if (getChildValue(state, "vehicleStatus.airTemp.value")) {
      const tempIndex = getHexTempIntoIndex(
        getChildValue(state, "vehicleStatus.airTemp.value")
      );
      if (tempIndex !== null && tempIndex >= 0 && tempIndex < this.temperature_range.length) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "vehicleStatus.airTemp.unit")]
        ];
      }
    }
    vehicle.defrost_is_on = getChildValue(state, "vehicleStatus.defrost");
    const steer_wheel_heat = getChildValue(state, "vehicleStatus.steerWheelHeat");
    if (steer_wheel_heat === 0 || steer_wheel_heat === 2) {
      vehicle.steering_wheel_heater_is_on = false;
    } else if (steer_wheel_heat === 1) {
      vehicle.steering_wheel_heater_is_on = true;
    }
    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "vehicleStatus.sideBackWindowHeat"
    );
    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "vehicleStatus.sideMirrorHeat"
    );
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.flSeatHeatState")] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.frSeatHeatState")] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.rlSeatHeatState")] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.rrSeatHeatState")] || null;
    vehicle.headlamp_status = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.headLampStatus"
    );
    vehicle.headlamp_left_low = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.leftLowLamp"
    );
    vehicle.headlamp_right_low = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.rightLowLamp"
    );
    vehicle.headlamp_left_high = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.leftHighLamp"
    );
    vehicle.headlamp_right_high = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.rightHighLamp"
    );
    vehicle.headlamp_left_bifunc = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.leftBifuncLamp"
    );
    vehicle.headlamp_right_bifunc = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.headLamp.rightBifuncLamp"
    );
    vehicle.stop_lamp_left = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.stopLamp.leftLamp"
    );
    vehicle.stop_lamp_right = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.stopLamp.rightLamp"
    );
    vehicle.turn_signal_left_front = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.turnSignalLamp.leftFrontLamp"
    );
    vehicle.turn_signal_right_front = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.turnSignalLamp.rightFrontLamp"
    );
    vehicle.turn_signal_left_rear = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.turnSignalLamp.leftRearLamp"
    );
    vehicle.turn_signal_right_rear = getChildValue(
      state,
      "vehicleStatus.lampWireStatus.turnSignalLamp.rightRearLamp"
    );
    vehicle.is_locked = getChildValue(state, "vehicleStatus.doorLock");
    vehicle.front_left_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.frontLeft"
    );
    vehicle.front_right_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.frontRight"
    );
    vehicle.back_left_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.backLeft"
    );
    vehicle.back_right_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.backRight"
    );
    vehicle.hood_is_open = getChildValue(state, "vehicleStatus.hoodOpen");
    vehicle.front_left_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.frontLeft"
    );
    vehicle.front_right_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.frontRight"
    );
    vehicle.back_left_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.backLeft"
    );
    vehicle.back_right_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.backRight"
    );
    vehicle.tire_pressure_rear_left_warning_is_on = Boolean(
      getChildValue(state, "vehicleStatus.tirePressureLamp.tirePressureLampRL")
    );
    vehicle.tire_pressure_front_left_warning_is_on = Boolean(
      getChildValue(state, "vehicleStatus.tirePressureLamp.tirePressureLampFL")
    );
    vehicle.tire_pressure_front_right_warning_is_on = Boolean(
      getChildValue(state, "vehicleStatus.tirePressureLamp.tirePressureLampFR")
    );
    vehicle.tire_pressure_rear_right_warning_is_on = Boolean(
      getChildValue(state, "vehicleStatus.tirePressureLamp.tirePressureLampRR")
    );
    vehicle.tire_pressure_all_warning_is_on = Boolean(
      getChildValue(state, "vehicleStatus.tirePressureLamp.tirePressureLampAll")
    );
    vehicle.trunk_is_open = getChildValue(state, "vehicleStatus.trunkOpen");
    vehicle.ev_battery_percentage = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryStatus"
    );
    vehicle.ev_battery_is_charging = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryCharge"
    );
    vehicle.ev_battery_is_plugged_in = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryPlugin"
    );
    const ev_charge_port_door_is_open = getChildValue(
      state,
      "vehicleStatus.evStatus.chargePortDoorOpenStatus"
    );
    if (ev_charge_port_door_is_open === 1) {
      vehicle.ev_charge_port_door_is_open = true;
    } else if (ev_charge_port_door_is_open === 2) {
      vehicle.ev_charge_port_door_is_open = false;
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.batteryPower.batteryStndChrgPower"
    ) !== null) {
      vehicle.ev_charging_power = getChildValue(
        state,
        "vehicleStatus.evStatus.batteryPower.batteryStndChrgPower"
      );
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
    ) !== null) {
      vehicle.total_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
        )]
      ];
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
    ) !== null) {
      vehicle.ev_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
        )]
      ];
    }
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.atc.value") || 0,
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc1.value") || 0,
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc2.value") || 0,
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc3.value") || 0,
      "m"
    ];
    const target_soc_list = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.targetSOClist"
    );
    try {
      if (Array.isArray(target_soc_list)) {
        const ac_limits = target_soc_list.filter((x) => x.plugType === 1).map((x) => x.targetSOClevel);
        if (ac_limits.length > 0) {
          vehicle.ev_charge_limits_ac = ac_limits[ac_limits.length - 1];
        }
        const dc_limits = target_soc_list.filter((x) => x.plugType === 0).map((x) => x.targetSOClevel);
        if (dc_limits.length > 0) {
          vehicle.ev_charge_limits_dc = dc_limits[dc_limits.length - 1];
        }
      }
    } catch {
      console.debug(`${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`);
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    ) !== null) {
      const unit = DISTANCE_UNITS[getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
      )];
      if (unit) {
        vehicle.fuel_driving_range = [
          getChildValue(
            state,
            "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
          ) || 0,
          unit
        ];
      }
    } else if (getChildValue(state, "vehicleStatus.dte.value")) {
      const unit = DISTANCE_UNITS[getChildValue(state, "vehicleStatus.dte.unit")];
      if (unit) {
        vehicle.fuel_driving_range = [
          getChildValue(state, "vehicleStatus.dte.value") || 0,
          unit
        ];
      }
    }
    const unitAC = DISTANCE_UNITS[getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit"
    )];
    if (unitAC) {
      vehicle.ev_target_range_charge_AC = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"
        ) || 0,
        unitAC
      ];
    }
    const unitDC = DISTANCE_UNITS[getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit"
    )];
    if (unitDC) {
      vehicle.ev_target_range_charge_DC = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"
        ) || 0,
        unitDC
      ];
    }
    vehicle.ev_first_departure_enabled = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservChargeSet"
    );
    vehicle.ev_second_departure_enabled = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservChargeSet"
    );
    vehicle.ev_first_departure_days = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.day"
    );
    vehicle.ev_second_departure_days = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.day"
    );
    vehicle.ev_first_departure_time = this._getTimeFromString(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.time"
      ),
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.timeSection"
      )
    );
    vehicle.ev_second_departure_time = this._getTimeFromString(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.time"
      ),
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.timeSection"
      )
    );
    vehicle.ev_first_departure_climate_enabled = Boolean(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airCtrl"
      )
    );
    vehicle.ev_second_departure_climate_enabled = Boolean(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airCtrl"
      )
    );
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.value"
    )) {
      const temp_index = getHexTempIntoIndex(
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.value"
        )
      );
      if (temp_index !== null && temp_index >= 0 && temp_index < this.temperature_range.length) {
        vehicle.ev_first_departure_climate_temperature = [
          this.temperature_range[temp_index],
          TEMPERATURE_UNITS[getChildValue(
            state,
            "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.unit"
          )]
        ];
      }
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.value"
    )) {
      const temp_index = getHexTempIntoIndex(
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.value"
        )
      );
      if (temp_index !== null && temp_index >= 0 && temp_index < this.temperature_range.length) {
        vehicle.ev_second_departure_climate_temperature = [
          this.temperature_range[temp_index],
          TEMPERATURE_UNITS[getChildValue(
            state,
            "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.unit"
          )]
        ];
      }
    }
    vehicle.ev_first_departure_climate_defrost = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.defrost"
    );
    vehicle.ev_second_departure_climate_defrost = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.defrost"
    );
    vehicle.ev_off_peak_start_time = this._getTimeFromString(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.time"
      ),
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.timeSection"
      )
    );
    vehicle.ev_off_peak_end_time = this._getTimeFromString(
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.time"
      ),
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.timeSection"
      )
    );
    const offPeakFlag = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
    );
    if (offPeakFlag) {
      if (offPeakFlag === 1) {
        vehicle.ev_off_peak_charge_only_enabled = true;
      } else if (offPeakFlag === 2) {
        vehicle.ev_off_peak_charge_only_enabled = false;
      }
    }
    const reservFlag = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.reservFlag"
    );
    if (reservFlag === 1) {
      vehicle.ev_schedule_charge_enabled = true;
    } else if (reservFlag === 0) {
      vehicle.ev_schedule_charge_enabled = false;
    }
    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "vehicleStatus.washerFluidStatus"
    );
    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "vehicleStatus.breakOilStatus"
    );
    vehicle.fuel_level = getChildValue(state, "vehicleStatus.fuelLevel");
    vehicle.fuel_level_is_low = getChildValue(state, "vehicleStatus.lowFuelLight");
    vehicle.air_control_is_on = getChildValue(state, "vehicleStatus.airCtrlOn");
    vehicle.smart_key_battery_warning_is_on = getChildValue(
      state,
      "vehicleStatus.smartKeyBatteryWarning"
    );
    if (getChildValue(state, "vehicleLocation.coord.lat")) {
      vehicle.location = [
        getChildValue(state, "vehicleLocation.coord.lat"),
        getChildValue(state, "vehicleLocation.coord.lon"),
        parseDatetime(
          getChildValue(state, "vehicleLocation.time"),
          this.data_timezone
        )
      ];
    }
    vehicle.data = state;
  }
  _update_vehicle_drive_info(vehicle, state) {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.total_power_regenerated = getChildValue(state, "regenPwr");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }
  async _set_cached_location_park(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token)
      });
      const response = await resp.json();
      checkResponseForErrors(response);
      const location = response.resMsg;
      if (location && getChildValue(location, "coord.lat")) {
        vehicle.location = [
          getChildValue(location, "coord.lat"),
          getChildValue(location, "coord.lon"),
          parseDatetime(
            getChildValue(location, "time"),
            this.data_timezone
          )
        ];
      }
    } catch (error) {
      console.debug(`${DOMAIN} - _get_location failed`);
    }
  }
  async _get_location(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location";
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(
          token,
          vehicle.ccu_ccs2_protocol_support
        )
      });
      const response = await resp.json();
      checkResponseForErrors(response);
      const gps_detail = response.resMsg?.gpsDetail;
      if (gps_detail === void 0) {
        console.warn(
          `${DOMAIN} - gpsDetail not found in location response, vehicle may be offline or returning partial status`
        );
      }
      return gps_detail || null;
    } catch (error) {
      console.error(`${DOMAIN} - _get_location failed:`, error);
      return null;
    }
  }
  async _get_forced_vehicle_state(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      )
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    const mapped_response = {};
    mapped_response.vehicleStatus = response.resMsg;
    return mapped_response;
  }
  async charge_port_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action };
    console.debug(`${DOMAIN} - Charge Port Action Request:`, payload);
    const headers = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.debug(`${DOMAIN} - Charge Port Action Response:`, response);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response.msgId;
  }
  async _get_trip_info(token, vehicle, date_string, trip_period_type) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload;
    if (trip_period_type === 0) {
      payload = { tripPeriodType: 0, setTripMonth: date_string };
    } else {
      payload = { tripPeriodType: 1, setTripDay: date_string };
    }
    console.debug(`${DOMAIN} - get_trip_info Request`, payload);
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.debug(`${DOMAIN} - get_trip_info response`, response);
    checkResponseForErrors(response);
    return response;
  }
  async update_month_trip_info(token, vehicle, yyyymm_string) {
    vehicle.month_trip_info = null;
    const json_result = await this._get_trip_info(
      token,
      vehicle,
      yyyymm_string,
      0
    );
    const msg = json_result.resMsg;
    if (msg.monthTripDayCnt > 0) {
      const result = {
        yyyymm: yyyymm_string,
        day_list: [],
        summary: {
          drive_time: msg.tripDrvTime,
          idle_time: msg.tripIdleTime,
          distance: msg.tripDist,
          avg_speed: msg.tripAvgSpeed,
          max_speed: msg.tripMaxSpeed
        }
      };
      for (const day of msg.tripDayList) {
        const processed_day = {
          yyyymmdd: day.tripDayInMonth,
          trip_count: day.tripCntDay
        };
        result.day_list.push(processed_day);
      }
      vehicle.month_trip_info = result;
    }
  }
  async update_day_trip_info(token, vehicle, yyyymmdd_string) {
    vehicle.day_trip_info = null;
    const json_result = await this._get_trip_info(
      token,
      vehicle,
      yyyymmdd_string,
      1
    );
    const day_trip_list = json_result.resMsg.dayTripList;
    if (day_trip_list && day_trip_list.length > 0) {
      const msg = day_trip_list[0];
      const result = {
        yyyymmdd: yyyymmdd_string,
        trip_list: [],
        summary: {
          drive_time: msg.tripDrvTime,
          idle_time: msg.tripIdleTime,
          distance: msg.tripDist,
          avg_speed: msg.tripAvgSpeed,
          max_speed: msg.tripMaxSpeed
        }
      };
      for (const trip of msg.tripList) {
        const processed_trip = {
          hhmmss: trip.tripTime,
          drive_time: trip.tripDrvTime,
          idle_time: trip.tripIdleTime,
          distance: trip.tripDist,
          avg_speed: trip.tripAvgSpeed,
          max_speed: trip.tripMaxSpeed
        };
        result.trip_list.push(processed_trip);
      }
      vehicle.day_trip_info = result;
    }
  }
  async _get_driving_info(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";
    const respAlltime = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
      body: JSON.stringify({ periodTarget: 1 })
    });
    const responseAlltime = await respAlltime.json();
    console.debug(
      `${DOMAIN} - get_driving_info responseAlltime`,
      responseAlltime
    );
    checkResponseForErrors(responseAlltime);
    const resp30d = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
      body: JSON.stringify({ periodTarget: 0 })
    });
    const response30d = await resp30d.json();
    console.debug(`${DOMAIN} - get_driving_info response30d`, response30d);
    checkResponseForErrors(response30d);
    if (getChildValue(responseAlltime, "resMsg.drivingInfo.0")) {
      const drivingInfo = responseAlltime.resMsg.drivingInfo[0];
      drivingInfo.dailyStats = [];
      if (getChildValue(response30d, "resMsg.drivingInfoDetail.0")) {
        for (const day of response30d.resMsg.drivingInfoDetail) {
          const processedDay = {
            date: /* @__PURE__ */ new Date(
              day.drivingDate.substring(0, 4) + "-" + day.drivingDate.substring(4, 6) + "-" + day.drivingDate.substring(6, 8)
            ),
            total_consumed: getChildValue(day, "totalPwrCsp"),
            engine_consumption: getChildValue(day, "motorPwrCsp"),
            climate_consumption: getChildValue(day, "climatePwrCsp"),
            onboard_electronics_consumption: getChildValue(day, "eDPwrCsp"),
            battery_care_consumption: getChildValue(day, "batteryMgPwrCsp"),
            regenerated_energy: getChildValue(day, "regenPwr"),
            distance: getChildValue(day, "calculativeOdo"),
            distance_unit: vehicle.odometer_unit || "km"
          };
          drivingInfo.dailyStats.push(processedDay);
        }
      }
      for (const drivingInfoItem of response30d.resMsg.drivingInfo) {
        if (drivingInfoItem.drivingPeriod === 0) {
          const calculativeOdo = Object.entries(drivingInfoItem).find(
            ([k]) => k.toLowerCase() === "calculativeodo"
          )?.[1];
          if (calculativeOdo && Number(calculativeOdo) > 0) {
            drivingInfo.consumption30d = Math.round(
              drivingInfoItem.totalPwrCsp / drivingInfoItem.calculativeOdo
            );
            break;
          }
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
  async valet_mode_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/valet";
    const payload = { action };
    console.debug(`${DOMAIN} - Valet Mode Action Request:`, payload);
    const headers = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.debug(`${DOMAIN} - Valet Mode Action Response:`, response);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response.msgId;
  }
  _get_stamp() {
    const timestamp = Math.floor(Date.now() / 1e3);
    const raw_data = `${this.APP_ID}:${timestamp}`;
    const raw_bytes = new TextEncoder().encode(raw_data);
    const result = new Uint8Array(Math.max(this.CFB.length, raw_bytes.length));
    for (let i = 0; i < result.length; i++) {
      const cfb_byte = i < this.CFB.length ? this.CFB[i] : 0;
      const raw_byte = i < raw_bytes.length ? raw_bytes[i] : 0;
      result[i] = cfb_byte ^ raw_byte;
    }
    return this._base64Encode(result);
  }
  // ApiImplType1 should declare: abstract async _get_device_id(stamp: string): Promise<string>;
  async _get_device_id(stamp) {
    const my_hex = Math.floor(Math.random() * Math.pow(10, 80)).toString(16).padStart(64, "0");
    const registration_id = my_hex.substring(0, 64);
    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      pushRegId: registration_id,
      pushType: this.PUSH_TYPE,
      uuid: this._generateUUID()
    };
    const headers = {
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      Stamp: stamp,
      "Content-Type": "application/json;charset=UTF-8",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP2
    };
    console.debug(`${DOMAIN} - Get Device ID request:`, url, headers, payload);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    console.debug(`${DOMAIN} - Get Device ID response:`, response);
    const device_id = response.resMsg.deviceId;
    return device_id;
  }
  async _get_cookies() {
    const url = this.USER_API_URL + "oauth2/authorize?response_type=code&state=test&client_id=" + this.CLIENT_ID + "&redirect_uri=" + encodeURIComponent(this.USER_API_URL + "oauth2/redirect") + "&lang=" + this.LANGUAGE;
    console.debug(`${DOMAIN} - Get cookies request:`, url);
    const resp = await fetch(url);
    const setCookieHeaders = resp.headers.getSetCookie?.() || [];
    const cookies = {};
    for (const setCookie of setCookieHeaders) {
      const match = setCookie.match(/^([^=]+)=([^;]*)/);
      if (match) {
        cookies[match[1]] = match[2];
      }
    }
    this._cookies = cookies;
    return cookies;
  }
  async _get_access_token(stamp, authorization_code) {
    const brandName = BRANDS[this.brand];
    if (brandName === BRAND_GENESIS) {
      const url2 = this.USER_API_URL + "oauth2/token";
      const headers = {
        Authorization: this.BASIC_AUTHORIZATION,
        Stamp: stamp,
        "Content-type": "application/x-www-form-urlencoded",
        Host: this.BASE_URL,
        Connection: "close",
        "Accept-Encoding": "gzip, deflate",
        "User-Agent": USER_AGENT_OK_HTTP2
      };
      const data2 = "grant_type=refresh_token&redirect_uri=https%3A%2F%2Fwww.getpostman.com%2Foauth2%2Fcallback&refresh_token=" + encodeURIComponent(authorization_code);
      const resp2 = await fetch(url2, {
        method: "POST",
        headers,
        body: data2
      });
      const response_json2 = await resp2.json();
      checkResponseForErrors(response_json2);
      const token_type2 = response_json2.token_type;
      const access_token2 = token_type2 + " " + response_json2.access_token;
      const expires_in2 = response_json2.expires_in;
      return {
        token_type: token_type2,
        access_token: access_token2,
        refresh_token: authorization_code,
        expires_in: expires_in2
      };
    }
    const url = this.LOGIN_FORM_HOST + "/auth/api/v2/user/oauth2/token";
    const data = {
      grant_type: "refresh_token",
      refresh_token: authorization_code,
      client_id: this.CCSP_SERVICE_ID,
      client_secret: this.CCS_SERVICE_SECRET
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
      redirect: "manual"
    });
    const response_json = await resp.json();
    checkResponseForErrors(response_json);
    const token_type = response_json.token_type;
    const access_token = token_type + " " + response_json.access_token;
    const refresh_token = response_json.refresh_token || authorization_code;
    const expires_in = response_json.expires_in;
    return { token_type, access_token, refresh_token, expires_in };
  }
  async _set_session_language(cookies) {
  }
  _base64Encode(data) {
    let binary = "";
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }
  _base64Decode(data) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  _generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  async start_charge(token, vehicle) {
    let url;
    let payload;
    let headers;
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
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async stop_charge(token, vehicle) {
    let url;
    let payload;
    let headers;
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
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
};
__name(KiaUvoApiEU, "KiaUvoApiEU");

// node_modules/uuid/dist/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// node_modules/uuid/dist/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
__name(validate, "validate");
var validate_default = validate;

// node_modules/uuid/dist/parse.js
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  return Uint8Array.of((v = parseInt(uuid.slice(0, 8), 16)) >>> 24, v >>> 16 & 255, v >>> 8 & 255, v & 255, (v = parseInt(uuid.slice(9, 13), 16)) >>> 8, v & 255, (v = parseInt(uuid.slice(14, 18), 16)) >>> 8, v & 255, (v = parseInt(uuid.slice(19, 23), 16)) >>> 8, v & 255, (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255, v / 4294967296 & 255, v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255);
}
__name(parse, "parse");
var parse_default = parse;

// node_modules/uuid/dist/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
__name(unsafeStringify, "unsafeStringify");

// node_modules/uuid/dist/rng.js
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}
__name(rng, "rng");

// node_modules/uuid/dist/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
__name(stringToBytes, "stringToBytes");
var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function v35(version, hash, value, namespace, buf, offset) {
  const valueBytes = typeof value === "string" ? stringToBytes(value) : value;
  const namespaceBytes = typeof namespace === "string" ? parse_default(namespace) : namespace;
  if (typeof namespace === "string") {
    namespace = parse_default(namespace);
  }
  if (namespace?.length !== 16) {
    throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
  }
  let bytes = new Uint8Array(16 + valueBytes.length);
  bytes.set(namespaceBytes);
  bytes.set(valueBytes, namespaceBytes.length);
  bytes = hash(bytes);
  bytes[6] = bytes[6] & 15 | version;
  bytes[8] = bytes[8] & 63 | 128;
  if (buf) {
    offset ??= 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = bytes[i];
    }
    return buf;
  }
  return unsafeStringify(bytes);
}
__name(v35, "v35");

// node_modules/uuid/dist/v4.js
function v4(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return _v4(options, buf, offset);
}
__name(v4, "v4");
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
__name(_v4, "_v4");
var v4_default = v4;

// node_modules/uuid/dist/sha1.js
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;
    case 1:
      return x ^ y ^ z;
    case 2:
      return x & y ^ x & z ^ y & z;
    case 3:
      return x ^ y ^ z;
  }
}
__name(f, "f");
function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}
__name(ROTL, "ROTL");
function sha1(bytes) {
  const K = [1518500249, 1859775393, 2400959708, 3395469782];
  const H = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
  const newBytes = new Uint8Array(bytes.length + 1);
  newBytes.set(bytes);
  newBytes[bytes.length] = 128;
  bytes = newBytes;
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);
  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);
    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }
    M[i] = arr;
  }
  M[N - 1][14] = (bytes.length - 1) * 8 / 2 ** 32;
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);
    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }
    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }
  return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}
__name(sha1, "sha1");
var sha1_default = sha1;

// node_modules/uuid/dist/v5.js
function v5(value, namespace, buf, offset) {
  return v35(80, sha1_default, value, namespace, buf, offset);
}
__name(v5, "v5");
v5.DNS = DNS;
v5.URL = URL2;
var v5_default = v5;

// src/KiaUvoApiUSA.ts
var KiaUvoApiUSA = class extends ApiImpl {
  LANGUAGE;
  BASE_URL = "api.owners.kia.com";
  API_URL = "https://api.owners.kia.com/apigw/v1/";
  device_id;
  constructor(region, brand, language) {
    super();
    this.LANGUAGE = language;
    this.temperature_range = Array.from({ length: 22 }, (_, i) => 62 + i);
    this.device_id = v4_default().toUpperCase();
  }
  /**
   * Generate base API headers for all requests
   */
  api_headers() {
    const offset = (/* @__PURE__ */ new Date()).getTimezoneOffset() / 60;
    const client_uuid = v5_default(this.device_id, "6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    const headers = {
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
      deviceid: this.device_id
    };
    const date = (/* @__PURE__ */ new Date()).toUTCString();
    headers.date = date;
    return headers;
  }
  /**
   * Generate authenticated headers (includes sid and vinkey)
   */
  authed_api_headers(token, vehicle) {
    const headers = this.api_headers();
    headers.sid = token.access_token || "";
    headers.vinkey = vehicle.key || "";
    return headers;
  }
  /**
   * Handle response errors based on status code
   */
  async handle_response_error(response) {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.status?.statusCode === 0) {
        return;
      }
      if (json.status?.statusCode === 1 && json.status?.errorType === 1 && [1003, 1005].includes(json.status?.errorCode)) {
        throw new AuthenticationError("Session invalid");
      }
      throw new Error(`API error: ${text}`);
    } catch (e) {
      if (e instanceof AuthenticationError)
        throw e;
      throw new Error(`Invalid API response: ${text}`);
    }
  }
  /**
   * Send OTP to email or phone
   */
  async _send_otp(otp_key, notify_type, xid) {
    const url = this.API_URL + "cmm/sendOTP";
    const headers = this.api_headers();
    headers.otpkey = otp_key;
    headers.notifytype = notify_type;
    headers.xid = xid;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });
    const data = await response.json();
    return data;
  }
  /**
   * Verify OTP code and return sid and rmtoken
   */
  async _verify_otp(otp_key, otp_code, xid) {
    const url = this.API_URL + "cmm/verifyOTP";
    const headers = this.api_headers();
    headers.otpkey = otp_key;
    headers.xid = xid;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ otp: otp_code })
    });
    const json = await response.json();
    if (json.status?.statusCode !== 0) {
      throw new Error(
        `OTP verification failed: ${json.status?.errorMessage || "Unknown error"}`
      );
    }
    const sid = response.headers.get("sid");
    const rmtoken = response.headers.get("rmtoken");
    if (!sid || !rmtoken) {
      throw new Error(
        `No sid or rmtoken in OTP verification response. Headers: ${JSON.stringify(
          Object.fromEntries(response.headers)
        )}`
      );
    }
    return [sid, rmtoken];
  }
  /**
   * Complete login with sid and rmtoken to get final session id
   */
  async _complete_login_with_otp(username, password, sid, rmtoken) {
    const url = this.API_URL + "prof/authUser";
    const data = {
      deviceKey: this.device_id,
      deviceType: 2,
      userCredential: { userId: username, password }
    };
    const headers = this.api_headers();
    headers.sid = sid;
    headers.rmtoken = rmtoken;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
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
  async send_otp(otp_request, notify_type) {
    if (!otp_request.otp_key || !otp_request.request_id) {
      throw new Error("Missing otp_key or request_id in OTPRequest");
    }
    await this._send_otp(otp_request.otp_key, notify_type, otp_request.request_id);
  }
  /**
   * Verify OTP and complete the login producing a Token
   */
  async verify_otp_and_complete_login(username, password, otp_code, otp_request, pin) {
    if (!otp_request.otp_key || !otp_request.request_id) {
      throw new Error("Missing otp_key or request_id in OTPRequest");
    }
    const [sid, rmtoken] = await this._verify_otp(
      otp_request.otp_key,
      otp_code,
      otp_request.request_id
    );
    const final_sid = await this._complete_login_with_otp(username, password, sid, rmtoken);
    const valid_until = new Date(
      Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3
    );
    return new Token({
      username,
      password,
      access_token: final_sid,
      refresh_token: rmtoken,
      valid_until: valid_until.toISOString(),
      device_id: this.device_id,
      pin: pin || null
    });
  }
  /**
   * Login into cloud endpoints and return Token or OTPRequest
   */
  async login(username, password, pin) {
    const url = this.API_URL + "prof/authUser";
    const data = {
      deviceKey: this.device_id,
      deviceType: 2,
      userCredential: { userId: username, password },
      tncFlag: 1
    };
    const headers = this.api_headers();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const response_json = await response.json();
    const session_id = response.headers.get("sid");
    if (session_id) {
      const valid_until = new Date(
        Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3
      );
      return new Token({
        username,
        password,
        access_token: session_id,
        refresh_token: null,
        valid_until: valid_until.toISOString(),
        device_id: this.device_id,
        pin: pin || null
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
        has_sms: Boolean(payload.hasPhone)
      });
    }
    throw new Error(
      `No session id returned in login. Response: ${JSON.stringify(response_json)}`
    );
  }
  /**
   * Refresh the token using the refresh token
   */
  async refresh_access_token(token) {
    return this.login(token.username || "", token.password || "");
  }
  /**
   * Return all Vehicle instances for a given Token
   */
  async get_vehicles(token) {
    const url = this.API_URL + "ownr/gvl";
    const headers = this.api_headers();
    headers.sid = token.access_token || "";
    const response = await fetch(url, {
      method: "GET",
      headers
    });
    const json = await response.json();
    if (!json.payload) {
      throw new APIError("Missing payload in response");
    }
    const result = [];
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
  _engine_type_from_fuel_type(fuel_type) {
    if (fuel_type === 4) {
      return "EV" /* EV */;
    }
    return null;
  }
  /**
   * Refresh the vehicle data provided in get_vehicles.
   * Required for Kia USA as key is session specific
   */
  async refresh_vehicles(token, vehicles) {
    const url = this.API_URL + "ownr/gvl";
    const headers = this.api_headers();
    headers.sid = token.access_token || "";
    const response = await fetch(url, {
      method: "GET",
      headers
    });
    const json = await response.json();
    if (!json.payload) {
      throw new APIError("Missing payload in response");
    }
    if (Array.isArray(vehicles)) {
      const vehicle = vehicles[0];
      for (const entry of json.payload.vehicleSummary || []) {
        if (vehicle && vehicle.id === entry.vehicleIdentifier) {
          vehicle.name = entry.nickName;
          vehicle.model = entry.modelName;
          vehicle.key = entry.vehicleKey;
        }
      }
    } else {
      for (const entry of json.payload.vehicleSummary || []) {
        const vid = entry.vehicleIdentifier;
        if (vid === null || vid === void 0)
          continue;
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
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
      await this._get_charge_targets(token, vehicle);
    }
  }
  /**
   * Force refresh vehicle state
   */
  async force_refresh_vehicle_state(token, vehicle) {
    const state = await this._get_forced_vehicle_state(token, vehicle);
    await this.update_vehicle_with_cached_state(token, vehicle);
    this._update_charge_limits_from_force_refresh(vehicle, state);
  }
  /**
   * Get cached vehicle data and update Vehicle instance with it
   */
  _update_vehicle_properties(vehicle, state) {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.syncDate.utc"
      ),
      this.data_timezone
    );
    const odom_val = getChildValue(state, "vehicleConfig.vehicleDetail.vehicle.mileage");
    if (odom_val !== null) {
      vehicle.odometer = [odom_val, DISTANCE_UNITS[3]];
    }
    const next_svc_val = getChildValue(state, "service.imatServiceOdometer");
    if (next_svc_val !== null) {
      vehicle.next_service_distance = [next_svc_val, DISTANCE_UNITS[3]];
    }
    const last_svc_val = getChildValue(state, "service.msopServiceOdometer");
    if (last_svc_val !== null) {
      vehicle.last_service_distance = [last_svc_val, DISTANCE_UNITS[3]];
    }
    vehicle.car_battery_percentage = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.batteryStatus.stateOfCharge"
    );
    vehicle.engine_is_running = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.engine"
    );
    let air_temp = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airTemp.value"
    );
    if (air_temp === "LOW") {
      air_temp = this.temperature_range?.[0];
    } else if (air_temp === "HIGH") {
      air_temp = this.temperature_range?.[this.temperature_range.length - 1];
    }
    if (air_temp != null) {
      vehicle.air_temperature = [air_temp, TEMPERATURE_UNITS[1]];
    }
    vehicle.defrost_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.defrost"
    );
    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.washerFluidStatus"
    );
    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.breakOilStatus"
    );
    vehicle.smart_key_battery_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.smartKeyBatteryWarning"
    );
    vehicle.tire_pressure_all_warning_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.tirePressure.all"
    );
    vehicle.steering_wheel_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.steeringWheel"
    );
    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.rearWindow"
    );
    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.heatingAccessory.sideMirror"
    );
    vehicle.front_left_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.flSeatHeatState"
    );
    vehicle.front_right_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.frSeatHeatState"
    );
    vehicle.rear_left_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.rlSeatHeatState"
    );
    vehicle.rear_right_seat_heater_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.seatHeaterVentState.rrSeatHeatState"
    );
    vehicle.is_locked = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorLock"
    );
    vehicle.front_left_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontLeft"
    );
    vehicle.front_right_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.frontRight"
    );
    vehicle.back_left_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backLeft"
    );
    vehicle.back_right_door_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.backRight"
    );
    vehicle.hood_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.hood"
    );
    vehicle.sunroof_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.sunroofOpen"
    );
    vehicle.trunk_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.doorStatus.trunk"
    );
    vehicle.front_left_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.frontLeft"
    );
    vehicle.front_right_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.frontRight"
    );
    vehicle.back_left_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.backLeft"
    );
    vehicle.back_right_window_is_open = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.windowOpen.backRight"
    );
    if (vehicle.front_left_window_is_open == null) {
      vehicle.front_left_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowFL"
      );
    }
    if (vehicle.front_right_window_is_open == null) {
      vehicle.front_right_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowFR"
      );
    }
    if (vehicle.back_left_window_is_open == null) {
      vehicle.back_left_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowRL"
      );
    }
    if (vehicle.back_right_window_is_open == null) {
      vehicle.back_right_window_is_open = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.windowStatus.windowRR"
      );
    }
    vehicle.ev_battery_percentage = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryStatus"
    );
    vehicle.ev_battery_is_charging = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryCharge"
    );
    vehicle.ev_battery_is_plugged_in = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryPlugin"
    );
    vehicle.ev_charging_power = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.realTimePower"
    );
    const chargeDict = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.targetSOC"
    );
    if (chargeDict != null && Array.isArray(chargeDict)) {
      try {
        const ac_values = chargeDict.filter((x) => x.plugType === 1).map((x) => x.targetSOClevel);
        const dc_values = chargeDict.filter((x) => x.plugType === 0).map((x) => x.targetSOClevel);
        if (ac_values.length > 0 && typeof ac_values[ac_values.length - 1] === "number" && !Array.isArray(ac_values[ac_values.length - 1])) {
          vehicle.ev_charge_limits_ac = Math.floor(ac_values[ac_values.length - 1]);
        }
        if (dc_values.length > 0 && typeof dc_values[dc_values.length - 1] === "number" && !Array.isArray(dc_values[dc_values.length - 1])) {
          vehicle.ev_charge_limits_dc = Math.floor(dc_values[dc_values.length - 1]);
        }
      } catch (e) {
      }
    }
    const ev_range_val = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
    );
    const ev_range_unit = DISTANCE_UNITS[getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
    )];
    if (ev_range_val !== null && ev_range_unit !== null) {
      vehicle.ev_driving_range = [ev_range_val, ev_range_unit];
    }
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.timeInterval.value"
      ),
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc1.value"
      ),
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc2.value"
      ),
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.remainChargeTime.0.etc3.value"
      ),
      "m"
    ];
    vehicle.ev_battery_precondition_enabled = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.batteryPrecondition"
    );
    const total_range_val = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
    );
    const total_range_unit = DISTANCE_UNITS[getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
    )];
    if (total_range_val !== null && total_range_unit !== null) {
      vehicle.total_driving_range = [total_range_val, total_range_unit];
    }
    const gasModeRangeValue = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    );
    if (gasModeRangeValue != null) {
      const gas_range_unit = DISTANCE_UNITS[getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
      )];
      if (gas_range_unit !== null) {
        vehicle.fuel_driving_range = [gasModeRangeValue, gas_range_unit];
      }
    } else {
      const dist_val = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.distanceToEmpty.value"
      );
      const dist_unit = DISTANCE_UNITS[getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.distanceToEmpty.unit"
      )];
      if (dist_val !== null && dist_unit !== null) {
        vehicle.fuel_driving_range = [dist_val, dist_unit];
      }
    }
    vehicle.fuel_level_is_low = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.lowFuelLight"
    );
    vehicle.fuel_level = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.fuelLevel"
    );
    vehicle.air_control_is_on = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.climate.airCtrl"
    );
    const lat = getChildValue(state, "lastVehicleInfo.location.coord.lat");
    if (lat != null) {
      const lon = getChildValue(state, "lastVehicleInfo.location.coord.lon");
      const utc = getChildValue(state, "lastVehicleInfo.location.syncDate.utc");
      vehicle.location = [
        lat,
        lon,
        parseDatetime(utc, this.data_timezone)
      ];
    }
    const next_svc_maintenance_val = getChildValue(state, "vehicleConfig.maintenance.nextServiceMile");
    if (next_svc_maintenance_val !== null) {
      vehicle.next_service_distance = [next_svc_maintenance_val, DISTANCE_UNITS[3]];
    }
    vehicle.dtc_count = getChildValue(
      state,
      "lastVehicleInfo.activeDTC.dtcActiveCount"
    );
    vehicle.dtc_descriptions = getChildValue(
      state,
      "lastVehicleInfo.activeDTC.dtcCategory"
    );
    if (vehicle.engine_type == null) {
      const ev_status = getChildValue(
        state,
        "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus"
      );
      if (ev_status != null) {
        const gas_mode_range = getChildValue(
          state,
          "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
        );
        if (gas_mode_range != null) {
          vehicle.engine_type = "PHEV" /* PHEV */;
        } else {
          vehicle.engine_type = "EV" /* EV */;
        }
      } else {
        vehicle.engine_type = "ICE" /* ICE */;
      }
    }
    vehicle.data = state;
  }
  /**
   * Get cached vehicle state
   */
  async _get_cached_vehicle_state(token, vehicle) {
    const url = this.API_URL + "cmm/gvi";
    const body = {
      vehicleConfigReq: {
        airTempRange: "0",
        maintenance: "1",
        seatHeatCoolOption: "0",
        vehicle: "1",
        vehicleFeature: "0"
      },
      vehicleInfoReq: {
        drivingActivty: "0",
        dtc: "1",
        enrollment: "1",
        functionalCards: "0",
        location: "1",
        vehicleStatus: "1",
        weather: "0"
      },
      vinKey: [vehicle.key]
    };
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const response_json = await response.json();
    await this.handle_response_error(response);
    return response_json.payload.vehicleInfoList[0];
  }
  /**
   * Get forced vehicle state
   */
  async _get_forced_vehicle_state(token, vehicle) {
    const url = this.API_URL + "rems/rvs";
    const body = {
      requestType: 0
      // value of 1 would return cached results instead of forcing update
    };
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const response_json = await response.json();
    return response_json;
  }
  /**
   * Parse targetSOC from the rems/rvs (force refresh) response.
   */
  _update_charge_limits_from_force_refresh(vehicle, state) {
    const charge_dict = getChildValue(
      state,
      "payload.vehicleStatusRpt.vehicleStatus.evStatus.targetSOC"
    );
    if (charge_dict == null || !Array.isArray(charge_dict)) {
      return;
    }
    try {
      const ac_values = charge_dict.filter((x) => x.plugType === 1).map((x) => x.targetSOClevel);
      const dc_values = charge_dict.filter((x) => x.plugType === 0).map((x) => x.targetSOClevel);
      const new_ac = ac_values.length > 0 ? ac_values[ac_values.length - 1] : null;
      const new_dc = dc_values.length > 0 ? dc_values[dc_values.length - 1] : null;
      if (typeof new_ac === "number" && !Array.isArray(new_ac)) {
        vehicle.ev_charge_limits_ac = Math.floor(new_ac);
      } else if (new_ac != null && vehicle.ev_charge_limits_ac != null) {
      } else if (new_ac != null) {
      }
      if (typeof new_dc === "number" && !Array.isArray(new_dc)) {
        vehicle.ev_charge_limits_dc = Math.floor(new_dc);
      } else if (new_dc != null && vehicle.ev_charge_limits_dc != null) {
      } else if (new_dc != null) {
      }
    } catch (err) {
    }
  }
  /**
   * Read current charge targets via the dedicated /evc/gts endpoint.
   */
  async _get_charge_targets(token, vehicle) {
    const url = this.API_URL + "evc/gts";
    try {
      const headers = this.authed_api_headers(token, vehicle);
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      const response_json = await response.json();
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
          continue;
        }
        if (plug_type === 1) {
          vehicle.ev_charge_limits_ac = level_int;
        } else if (plug_type === 0) {
          vehicle.ev_charge_limits_dc = level_int;
        }
      }
    } catch (err) {
    }
  }
  /**
   * Check action status
   */
  async check_action_status(token, vehicle, action_id, synchronous = false, timeout = 0) {
    const url = this.API_URL + "cmm/gts";
    const body = { xid: action_id };
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const response_json = await response.json();
    await this.handle_response_error(response);
    const last_action_completed = Object.values(response_json.payload || {}).every(
      (v) => v === 0
    );
    return last_action_completed ? "SUCCESS" /* SUCCESS */ : "PENDING" /* PENDING */;
  }
  /**
   * Lock or unlock vehicle
   */
  async lock_action(token, vehicle, action) {
    let url;
    if (action === "close" /* LOCK */) {
      url = this.API_URL + "rems/door/lock";
    } else {
      url = this.API_URL + "rems/door/unlock";
    }
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "GET",
      headers
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
  _seat_settings(level) {
    if (level === 8) {
      return {
        heatVentType: 1,
        heatVentLevel: 4,
        heatVentStep: 1
      };
    } else if (level === 7) {
      return {
        heatVentType: 1,
        heatVentLevel: 3,
        heatVentStep: 2
      };
    } else if (level === 6) {
      return {
        heatVentType: 1,
        heatVentLevel: 2,
        heatVentStep: 3
      };
    } else if (level === 5) {
      return {
        heatVentType: 2,
        heatVentLevel: 4,
        heatVentStep: 1
      };
    } else if (level === 4) {
      return {
        heatVentType: 2,
        heatVentLevel: 3,
        heatVentStep: 2
      };
    } else if (level === 3) {
      return {
        heatVentType: 2,
        heatVentLevel: 2,
        heatVentStep: 3
      };
    } else if (level === 1) {
      return {
        heatVentType: 1,
        heatVentLevel: 4,
        heatVentStep: 1
      };
    } else {
      return {
        heatVentType: 0,
        heatVentLevel: 1,
        heatVentStep: 0
      };
    }
  }
  /**
   * Start climate control
   */
  async start_climate(token, vehicle, options) {
    const url = this.API_URL + "rems/start";
    if (options.set_temp == null) {
      options.set_temp = 70;
    }
    let set_temp = options.set_temp;
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
          value: String(set_temp)
        },
        airCtrl: options.climate,
        defrost: options.defrost,
        heatingAccessory: {
          rearWindow: [1, 2, 4].includes(options.heating) ? 1 : 0,
          sideMirror: [1, 4].includes(options.heating) ? 1 : 0,
          steeringWheel: [1, 2].includes(options.steering_wheel) ? 1 : 0,
          steeringWheelStep: options.steering_wheel
        },
        ignitionOnDuration: {
          unit: 4,
          value: options.duration
        }
      }
    };
    if (options.front_left_seat != null || options.front_right_seat != null || options.rear_left_seat != null || options.rear_right_seat != null) {
      body.remoteClimate.heatVentSeat = {
        driverSeat: this._seat_settings(options.front_left_seat),
        passengerSeat: this._seat_settings(options.front_right_seat),
        rearLeftSeat: this._seat_settings(options.rear_left_seat),
        rearRightSeat: this._seat_settings(options.rear_right_seat)
      };
    }
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
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
  async stop_climate(token, vehicle) {
    const url = this.API_URL + "rems/stop";
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "GET",
      headers
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
  async start_charge(token, vehicle) {
    const url = this.API_URL + "evc/charge";
    const body = { chargeRatio: 100 };
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
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
  async stop_charge(token, vehicle) {
    const url = this.API_URL + "evc/cancel";
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "GET",
      headers
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
  async set_charge_limits(token, vehicle, ac, dc) {
    const url = this.API_URL + "evc/sts";
    const body = {
      targetSOClist: [
        {
          plugType: 0,
          targetSOClevel: Math.floor(dc)
        },
        {
          plugType: 1,
          targetSOClevel: Math.floor(ac)
        }
      ]
    };
    const headers = this.authed_api_headers(token, vehicle);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    await this.handle_response_error(response);
    const xid = response.headers.get("Xid");
    if (!xid) {
      throw new Error("No Xid in response headers");
    }
    return xid;
  }
};
__name(KiaUvoApiUSA, "KiaUvoApiUSA");

// src/HyundaiBlueLinkApiUSA.ts
var LOGGER = console;
function checkResponseForErrors2(response) {
  const errorCodeMapping = {
    "502": AuthenticationError
  };
  if ("errorCode" in response) {
    if (response.errorCode in errorCodeMapping) {
      const ErrorClass = errorCodeMapping[response.errorCode];
      throw new ErrorClass(response.errorMessage);
    } else {
      throw new APIError(
        `API Error ${response.errorCode}: ${response.errorMessage}`
      );
    }
  }
}
__name(checkResponseForErrors2, "checkResponseForErrors");
async function safeParse(response, actionName) {
  if (response.status !== 200) {
    const text2 = await response.text();
    throw new APIError(
      `${actionName} failed with HTTP ${response.status}: '${text2.substring(0, 200)}'`
    );
  }
  const text = await response.text();
  if (!text.trim()) {
    LOGGER.debug(
      `${DOMAIN} - Empty response body for ${actionName} (HTTP 200). Command succeeded.`
    );
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new APIError(`Failed to parse JSON for ${actionName}`);
  }
}
__name(safeParse, "safeParse");
var HyundaiBlueLinkApiUSA = class extends ApiImpl {
  LANGUAGE;
  BASE_URL = "api.telematics.hyundaiusa.com";
  LOGIN_API;
  API_URL;
  API_HEADERS;
  constructor(region, brand, language) {
    super();
    this.LANGUAGE = language;
    this.LOGIN_API = "https://" + this.BASE_URL + "/v2/ac/";
    this.API_URL = "https://" + this.BASE_URL + "/ac/v2/";
    this.temperature_range = Array.from({ length: 20 }, (_, i) => 62 + i);
    const now = /* @__PURE__ */ new Date();
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const offset = utcDate.getTime() - now.getTime();
    const utcOffsetHours = -Math.round(offset / (1e3 * 60 * 60));
    const origin = "https://" + this.BASE_URL;
    const referer = origin + "/login";
    this.API_HEADERS = {
      "content-type": "application/json;charset=UTF-8",
      "accept": "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
      "host": this.BASE_URL,
      "origin": origin,
      "referer": referer,
      "from": "SPA",
      "to": "ISS",
      "language": "0",
      "offset": String(utcOffsetHours),
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "refresh": "false",
      "encryptFlag": "false",
      "brandIndicator": "H",
      "client_id": "m66129Bb-em93-SPAHYN-bZ91-am4540zp19920",
      "clientSecret": "v558o935-6nne-423i-baa8"
    };
    LOGGER.debug(`${DOMAIN} - initial API headers: ${JSON.stringify(this.API_HEADERS)}`);
  }
  getAuthenticatedHeaders(token) {
    const headers = { ...this.API_HEADERS };
    headers.username = token.username || "";
    headers.accessToken = token.access_token || "";
    headers.blueLinkServicePin = token.pin || "";
    return headers;
  }
  getVehicleHeaders(token, vehicle) {
    const headers = this.getAuthenticatedHeaders(token);
    headers.registrationId = vehicle.id || "";
    headers.gen = String(vehicle.generation);
    headers.vin = vehicle.VIN || "";
    return headers;
  }
  async login(username, password, pin) {
    const url = this.LOGIN_API + "oauth/token";
    const data = { username, password };
    const response = await fetch(url, {
      method: "POST",
      headers: this.API_HEADERS,
      body: JSON.stringify(data)
    });
    const jsonResponse2 = await safeParse(response, "login");
    if (!jsonResponse2) {
      throw new APIError("Login failed: empty response");
    }
    checkResponseForErrors2(jsonResponse2);
    if (!jsonResponse2.access_token) {
      throw new APIError(
        `Error Code: ${jsonResponse2.errorCode || ""} - Login failed: ${jsonResponse2.errorMessage || ""}`
      );
    }
    const accessToken = jsonResponse2.access_token;
    const refreshToken = jsonResponse2.refresh_token;
    const expiresIn = parseFloat(jsonResponse2.expires_in);
    const validUntil = new Date(Date.now() + expiresIn * 1e3);
    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || void 0
    });
  }
  async getVehicleDetails(token, vehicle) {
    const url = this.API_URL + "enrollment/details/" + token.username;
    const headers = this.getAuthenticatedHeaders(token);
    const response = await fetch(url, { headers });
    const jsonResponse2 = await safeParse(response, "getVehicleDetails");
    if (!jsonResponse2) {
      throw new APIError("Failed to get vehicle details");
    }
    LOGGER.debug(`${DOMAIN} - Get Vehicles Response ${JSON.stringify(jsonResponse2)}`);
    checkResponseForErrors2(jsonResponse2);
    for (const entry of jsonResponse2.enrolledVehicleDetails || []) {
      const details = entry.vehicleDetails;
      if (details.regid === vehicle.id) {
        return details;
      }
    }
    throw new APIError("Vehicle not found in details");
  }
  async getVehicleStatus(token, vehicle, refresh) {
    const url = this.API_URL + "rcs/rvs/vehicleStatus";
    const headers = this.getVehicleHeaders(token, vehicle);
    if (refresh) {
      headers.REFRESH = "true";
    }
    const response = await fetch(url, { headers });
    const jsonResponse2 = await safeParse(response, "getVehicleStatus");
    if (!jsonResponse2) {
      throw new APIError("Failed to get vehicle status");
    }
    checkResponseForErrors2(jsonResponse2);
    LOGGER.debug(`${DOMAIN} - get_vehicle_status response ${JSON.stringify(jsonResponse2)}`);
    const status = { ...jsonResponse2.vehicleStatus };
    status.dateTime = status.dateTime.replace(/-/g, "").replace("T", "").replace(/:/g, "").replace("Z", "");
    return status;
  }
  async getEvTripDetails(token, vehicle) {
    if (vehicle.engine_type !== "EV" /* EV */) {
      return {};
    }
    const url = this.API_URL + "ts/alerts/maintenance/evTripDetails";
    const headers = this.getVehicleHeaders(token, vehicle);
    headers.userId = headers.username;
    const response = await fetch(url, { headers });
    const jsonResponse2 = await safeParse(response, "getEvTripDetails");
    if (!jsonResponse2) {
      return {};
    }
    checkResponseForErrors2(jsonResponse2);
    LOGGER.debug(
      `${DOMAIN} - get_ev_trip_details response ${JSON.stringify(jsonResponse2)}`
    );
    return jsonResponse2;
  }
  async getVehicleLocation(token, vehicle) {
    const url = this.API_URL + "rcs/rfc/findMyCar";
    const headers = this.getVehicleHeaders(token, vehicle);
    try {
      const response = await fetch(url, { headers });
      const jsonResponse2 = await safeParse(response, "getVehicleLocation");
      if (!jsonResponse2) {
        return null;
      }
      checkResponseForErrors2(jsonResponse2);
      LOGGER.debug(
        `${DOMAIN} - Get Vehicle Location ${JSON.stringify(jsonResponse2)}`
      );
      if (jsonResponse2.coord) {
        return jsonResponse2;
      } else {
        if (jsonResponse2.errorCode == 502 && jsonResponse2.errorSubCode === "HT_534") {
          LOGGER.warn(
            `${DOMAIN} - get vehicle location rate limit exceeded.`
          );
        } else {
          LOGGER.warn(
            `${DOMAIN} - Unable to get vehicle location: ${JSON.stringify(jsonResponse2)}`
          );
        }
      }
    } catch (e) {
      LOGGER.warn(`${DOMAIN} - Get vehicle location failed: ${e}`);
    }
    LOGGER.debug(`${DOMAIN} - Get Vehicle Location result is None`);
    return null;
  }
  updateVehicleProperties(vehicle, state) {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(state, "vehicleStatus.dateTime"),
      this.data_timezone
    );
    vehicle.total_driving_range = [
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
      )] || "mi"
    ];
    if (getChildValue(state, "vehicleStatus.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "vehicleStatus.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "vehicleStatus.dte.unit")] || "mi"
      ];
    }
    vehicle.odometer = [
      getChildValue(state, "vehicleDetails.odometer"),
      DISTANCE_UNITS[3] || "mi"
    ];
    vehicle.car_battery_percentage = getChildValue(
      state,
      "vehicleStatus.battery.batSoc"
    );
    vehicle.engine_is_running = getChildValue(state, "vehicleStatus.engine");
    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "vehicleStatus.washerFluidStatus"
    );
    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "vehicleStatus.breakOilStatus"
    );
    vehicle.smart_key_battery_warning_is_on = getChildValue(
      state,
      "vehicleStatus.smartKeyBatteryWarning"
    );
    let airTemp = getChildValue(state, "vehicleStatus.airTemp.value");
    if (airTemp === "LO") {
      airTemp = this.temperature_range?.[0];
    }
    if (airTemp === "HI") {
      airTemp = this.temperature_range?.[this.temperature_range.length - 1];
    }
    if (airTemp) {
      vehicle.air_temperature = [airTemp, TEMPERATURE_UNITS[1] || "\xB0F"];
    }
    vehicle.defrost_is_on = getChildValue(state, "vehicleStatus.defrost");
    vehicle.steering_wheel_heater_is_on = getChildValue(
      state,
      "vehicleStatus.steerWheelHeat"
    );
    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "vehicleStatus.sideBackWindowHeat"
    );
    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "vehicleStatus.sideMirrorHeat"
    );
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.flSeatHeatState")] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.frSeatHeatState")] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.rlSeatHeatState")] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "vehicleStatus.seatHeaterVentState.rrSeatHeatState")] || null;
    vehicle.tire_pressure_rear_left_warning_is_on = !!getChildValue(
      state,
      "vehicleStatus.tirePressureLamp.tirePressureWarningLampRearLeft"
    );
    vehicle.tire_pressure_front_left_warning_is_on = !!getChildValue(
      state,
      "vehicleStatus.tirePressureLamp.tirePressureWarningLampFrontLeft"
    );
    vehicle.tire_pressure_front_right_warning_is_on = !!getChildValue(
      state,
      "vehicleStatus.tirePressureLamp.tirePressureWarningLampFrontRight"
    );
    vehicle.tire_pressure_rear_right_warning_is_on = !!getChildValue(
      state,
      "vehicleStatus.tirePressureLamp.tirePressureWarningLampRearRight"
    );
    vehicle.tire_pressure_all_warning_is_on = !!getChildValue(
      state,
      "vehicleStatus.tirePressureLamp.tirePressureWarningLampAll"
    );
    vehicle.front_left_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.frontLeft"
    );
    vehicle.front_right_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.frontRight"
    );
    vehicle.back_left_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.backLeft"
    );
    vehicle.back_right_window_is_open = getChildValue(
      state,
      "vehicleStatus.windowOpen.backRight"
    );
    vehicle.is_locked = getChildValue(state, "vehicleStatus.doorLock");
    vehicle.front_left_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.frontLeft"
    );
    vehicle.front_right_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.frontRight"
    );
    vehicle.back_left_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.backLeft"
    );
    vehicle.back_right_door_is_open = getChildValue(
      state,
      "vehicleStatus.doorOpen.backRight"
    );
    vehicle.hood_is_open = getChildValue(state, "vehicleStatus.hoodOpen");
    vehicle.trunk_is_open = getChildValue(state, "vehicleStatus.trunkOpen");
    vehicle.ev_battery_percentage = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryStatus"
    );
    vehicle.ev_battery_is_charging = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryCharge"
    );
    vehicle.ev_battery_is_plugged_in = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryPlugin"
    );
    vehicle.ev_charging_power = getChildValue(
      state,
      "vehicleStatus.evStatus.batteryStndChrgPower"
    );
    const ChargeDict = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.targetSOClist"
    );
    try {
      if (Array.isArray(ChargeDict)) {
        const acLimits = ChargeDict.filter((x) => x.plugType === 1);
        const dcLimits = ChargeDict.filter((x) => x.plugType === 0);
        if (acLimits.length > 0) {
          vehicle.ev_charge_limits_ac = acLimits[acLimits.length - 1].targetSOClevel;
        }
        if (dcLimits.length > 0) {
          vehicle.ev_charge_limits_dc = dcLimits[dcLimits.length - 1].targetSOClevel;
        }
      }
    } catch {
      LOGGER.debug(
        `${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`
      );
    }
    vehicle.ev_driving_range = [
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
      ),
      DISTANCE_UNITS[getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
      )] || "mi"
    ];
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.atc.value"),
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc1.value"),
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc2.value"),
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc3.value"),
      "m"
    ];
    const v2xStatus = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.v2xStatus"
    );
    if (v2xStatus != null) {
      vehicle.ev_v2x_status = !!v2xStatus;
    }
    const v2lStatus = getChildValue(
      state,
      "lastVehicleInfo.vehicleStatusRpt.vehicleStatus.evStatus.v2lStatus"
    );
    if (v2lStatus != null) {
      vehicle.ev_v2l_status = !!v2lStatus;
    }
    if (getChildValue(
      state,
      "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    )) {
      vehicle.fuel_driving_range = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
        ),
        DISTANCE_UNITS[getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
        )] || "mi"
      ];
    }
    vehicle.fuel_level_is_low = getChildValue(state, "vehicleStatus.lowFuelLight");
    vehicle.fuel_level = getChildValue(state, "vehicleStatus.fuelLevel");
    if (getChildValue(state, "vehicleStatus.vehicleLocation.coord.lat")) {
      vehicle.location = [
        getChildValue(state, "vehicleStatus.vehicleLocation.coord.lat"),
        getChildValue(state, "vehicleStatus.vehicleLocation.coord.lon"),
        parseDatetime(
          getChildValue(state, "vehicleStatus.vehicleLocation.time"),
          this.data_timezone
        )
      ];
    }
    vehicle.air_control_is_on = getChildValue(state, "vehicleStatus.airCtrlOn");
    const tripStats = [];
    const tripDetails = getChildValue(state, "evTripDetails.tripdetails") || [];
    let previousOdometer = null;
    for (let i = tripDetails.length - 1; i >= 0; i--) {
      const trip = tripDetails[i];
      const odometer = getChildValue(trip, "odometer.value");
      if (previousOdometer && odometer) {
        const deltaOdometer = odometer - previousOdometer;
        if (deltaOdometer >= 0) {
          trip.distance = deltaOdometer;
        }
      }
      previousOdometer = odometer;
    }
    if (previousOdometer && vehicle.odometer && previousOdometer > vehicle.odometer) {
      LOGGER.debug(
        `Overruling odometer: ${previousOdometer.toFixed(1)} old: ${vehicle.odometer.toFixed(1)}`
      );
      vehicle.odometer = [previousOdometer, DISTANCE_UNITS[3] || "mi"];
    }
    for (const trip of tripDetails) {
      const processedTrip = new DailyDrivingStats();
      processedTrip.date = new Date(trip.startdate);
      processedTrip.total_consumed = getChildValue(trip, "totalused");
      processedTrip.engine_consumption = getChildValue(trip, "drivetrain");
      processedTrip.climate_consumption = getChildValue(trip, "climate");
      processedTrip.onboard_electronics_consumption = getChildValue(
        trip,
        "accessories"
      );
      processedTrip.battery_care_consumption = getChildValue(
        trip,
        "batterycare"
      );
      processedTrip.regenerated_energy = getChildValue(trip, "regen");
      processedTrip.distance = getChildValue(trip, "distance");
      processedTrip.distance_unit = vehicle.odometer_unit || "mi";
      tripStats.push(processedTrip);
    }
    vehicle.daily_stats = tripStats;
    const trips = [];
    for (const trip of tripDetails) {
      const yyyymmddHhmmss = trip.startdate;
      const driveTime = parseInt(getChildValue(trip.mileagetime, "value") || "0", 10);
      const idleTime = parseInt(getChildValue(trip.duration, "value") || "0", 10) - driveTime;
      const processedTrip = new TripInfo();
      processedTrip.hhmmss = yyyymmddHhmmss;
      processedTrip.drive_time = Math.floor(driveTime / 60);
      processedTrip.idle_time = Math.floor(idleTime / 60);
      processedTrip.distance = parseFloat(trip.distance);
      processedTrip.avg_speed = getChildValue(trip.avgspeed, "value");
      processedTrip.max_speed = parseInt(
        getChildValue(trip.maxspeed, "value") || "0",
        10
      );
      trips.push(processedTrip);
    }
    LOGGER.debug(`_update_vehicle_properties filled_trips: ${JSON.stringify(trips)}`);
    if (trips.length > 0) {
      state.filled_trips = trips;
    }
    vehicle.data = state;
  }
  async updateMonthTripInfo(token, vehicle, yyyymmString) {
    LOGGER.debug(`update_month_trip_info: ${yyyymmString}`);
    vehicle.month_trip_info = null;
    if (!vehicle.data || !vehicle.data.filled_trips) {
      LOGGER.debug(
        `filled_trips is empty: ${vehicle.data}`
      );
      return;
    }
    const trips = vehicle.data.filled_trips;
    let monthTripInfo = null;
    let monthTripInfoCount = 0;
    for (const trip of trips) {
      const dateStr = trip.hhmmss;
      const yyyymm = dateStr.substring(0, 4) + dateStr.substring(5, 7);
      if (yyyymm === yyyymmString) {
        if (monthTripInfoCount === 0) {
          monthTripInfo = new MonthTripInfo();
          monthTripInfo.yyyymm = yyyymmString;
          monthTripInfo.summary = new TripInfo();
          monthTripInfo.summary.drive_time = trip.drive_time;
          monthTripInfo.summary.idle_time = trip.idle_time;
          monthTripInfo.summary.distance = trip.distance;
          monthTripInfo.summary.avg_speed = trip.avg_speed;
          monthTripInfo.summary.max_speed = trip.max_speed;
          monthTripInfo.day_list = [];
          monthTripInfoCount = 1;
        } else {
          monthTripInfoCount += 1;
          const summary = monthTripInfo.summary;
          if (summary) {
            summary.drive_time = (summary.drive_time || 0) + (trip.drive_time || 0);
            summary.idle_time = (summary.idle_time || 0) + (trip.idle_time || 0);
            summary.distance = (summary.distance || 0) + (trip.distance || 0);
            summary.avg_speed = (summary.avg_speed || 0) + (trip.avg_speed || 0);
            summary.max_speed = Math.max(summary.max_speed || 0, trip.max_speed || 0);
          }
        }
        if (monthTripInfo?.summary) {
          monthTripInfo.summary.avg_speed = (monthTripInfo.summary.avg_speed || 0) / monthTripInfoCount;
          monthTripInfo.summary.avg_speed = Math.round(
            monthTripInfo.summary.avg_speed * 10
          ) / 10;
        }
        const yyyymmdd = yyyymm + dateStr.substring(8, 10);
        let dayTripFound = false;
        if (monthTripInfo?.day_list) {
          for (const day of monthTripInfo.day_list) {
            if (day.yyyymmdd === yyyymmdd) {
              day.trip_count = (day.trip_count || 0) + 1;
              dayTripFound = true;
              break;
            }
          }
        }
        if (!dayTripFound && monthTripInfo) {
          const dayCounts = new DayTripCounts();
          dayCounts.yyyymmdd = yyyymmdd;
          dayCounts.trip_count = 1;
          monthTripInfo.day_list.push(dayCounts);
        }
      }
    }
    vehicle.month_trip_info = monthTripInfo;
  }
  async updateDayTripInfo(token, vehicle, yyyymmddString) {
    LOGGER.debug(`update_day_trip_info: ${yyyymmddString}`);
    vehicle.day_trip_info = null;
    if (!vehicle.data || !vehicle.data.filled_trips) {
      LOGGER.debug(`filled_trips is empty: ${vehicle.data}`);
      return;
    }
    const trips = vehicle.data.filled_trips;
    LOGGER.debug(`filled_trips: ${JSON.stringify(trips)}`);
    let dayTripInfo = null;
    let dayTripInfoCount = 0;
    for (const trip of trips) {
      const dateStr = trip.hhmmss;
      const yyyymmdd = dateStr.substring(0, 4) + dateStr.substring(5, 7) + dateStr.substring(8, 10);
      LOGGER.debug(`update_day_trip_info: ${yyyymmdd} trip: ${JSON.stringify(trip)}`);
      if (yyyymmdd === yyyymmddString) {
        if (dayTripInfoCount === 0) {
          dayTripInfo = new DayTripInfo();
          dayTripInfo.yyyymmdd = yyyymmddString;
          dayTripInfo.summary = new TripInfo();
          dayTripInfo.summary.drive_time = trip.drive_time;
          dayTripInfo.summary.idle_time = trip.idle_time;
          dayTripInfo.summary.distance = trip.distance;
          dayTripInfo.summary.avg_speed = trip.avg_speed;
          dayTripInfo.summary.max_speed = trip.max_speed;
          dayTripInfo.trip_list = [];
          dayTripInfoCount = 1;
        } else {
          dayTripInfoCount += 1;
          const summary = dayTripInfo.summary;
          if (summary) {
            summary.drive_time = (summary.drive_time || 0) + (trip.drive_time || 0);
            summary.idle_time = (summary.idle_time || 0) + (trip.idle_time || 0);
            summary.distance = (summary.distance || 0) + (trip.distance || 0);
            summary.avg_speed = (summary.avg_speed || 0) + (trip.avg_speed || 0);
            summary.max_speed = Math.max(summary.max_speed || 0, trip.max_speed || 0);
          }
        }
        if (dayTripInfo?.summary) {
          dayTripInfo.summary.avg_speed = (dayTripInfo.summary.avg_speed || 0) / dayTripInfoCount;
          dayTripInfo.summary.avg_speed = Math.round(
            dayTripInfo.summary.avg_speed * 10
          ) / 10;
        }
        const hhmmss = dateStr.substring(11, 13) + dateStr.substring(14, 16) + dateStr.substring(17, 19);
        const tripInfo = new TripInfo();
        tripInfo.hhmmss = hhmmss;
        tripInfo.drive_time = trip.drive_time;
        tripInfo.idle_time = trip.idle_time;
        tripInfo.distance = trip.distance;
        tripInfo.avg_speed = trip.avg_speed;
        tripInfo.max_speed = trip.max_speed;
        if (dayTripInfo) {
          dayTripInfo.trip_list.push(tripInfo);
        }
        LOGGER.debug(
          `update_day_trip_info: trip_list result: ${JSON.stringify(dayTripInfo?.trip_list)}`
        );
      }
    }
    vehicle.day_trip_info = dayTripInfo;
  }
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = {};
    state.vehicleDetails = await this.getVehicleDetails(token, vehicle);
    state.vehicleStatus = await this.getVehicleStatus(token, vehicle, false);
    state.evTripDetails = await this.getEvTripDetails(token, vehicle);
    if (state.vehicleStatus) {
      let vehicleLocationResult = null;
      if (vehicle.odometer) {
        const detailsOdometer = getFloat(
          getChildValue(state.vehicleDetails, "odometer")
        );
        if (detailsOdometer && vehicle.odometer < detailsOdometer) {
          vehicleLocationResult = await this.getVehicleLocation(token, vehicle);
        } else {
          LOGGER.debug(
            `${DOMAIN} - update_vehicle_with_cached_state keep Location fallback`
          );
        }
      } else {
        vehicleLocationResult = await this.getVehicleLocation(token, vehicle);
      }
      if (vehicleLocationResult) {
        state.vehicleStatus.vehicleLocation = vehicleLocationResult;
      } else {
        LOGGER.debug(
          `${DOMAIN} - update_vehicle_with_cached_state Location fallback`
        );
      }
    }
    this.updateVehicleProperties(vehicle, state);
  }
  async force_refresh_vehicle_state(token, vehicle) {
    const state = {};
    state.vehicleDetails = await this.getVehicleDetails(token, vehicle);
    state.vehicleStatus = await this.getVehicleStatus(token, vehicle, true);
    state.evTripDetails = await this.getEvTripDetails(token, vehicle);
    if (state.vehicleStatus) {
      const vehicleLocationResult = await this.getVehicleLocation(token, vehicle);
      if (vehicleLocationResult) {
        state.vehicleStatus.vehicleLocation = vehicleLocationResult;
      } else {
        const cachedLocation = state.vehicleStatus.vehicleLocation;
        LOGGER.debug(
          `${DOMAIN} - force_refresh_vehicle_state Location fallback ${JSON.stringify(cachedLocation)}`
        );
      }
    }
    this.updateVehicleProperties(vehicle, state);
  }
  async get_vehicles(token) {
    const url = this.API_URL + "enrollment/details/" + token.username;
    const headers = this.getAuthenticatedHeaders(token);
    const response = await fetch(url, { headers });
    const jsonResponse2 = await safeParse(response, "get_vehicles");
    if (!jsonResponse2) {
      throw new APIError("Failed to get vehicles");
    }
    LOGGER.debug(
      `${DOMAIN} - Get Vehicles Response ${JSON.stringify(jsonResponse2)}`
    );
    checkResponseForErrors2(jsonResponse2);
    if (!jsonResponse2.enrolledVehicleDetails) {
      throw new AuthenticationError("Missing enrolledVehicleDetails in response");
    }
    const result = [];
    for (const entry of jsonResponse2.enrolledVehicleDetails) {
      const entryData = entry.vehicleDetails;
      let entryEngineType = null;
      if (entryData.evStatus === "N") {
        entryEngineType = "ICE" /* ICE */;
      } else if (entryData.evStatus === "E") {
        entryEngineType = "EV" /* EV */;
      }
      const vehicle = new Vehicle();
      vehicle.id = entryData.regid;
      vehicle.name = entryData.nickName;
      vehicle.VIN = entryData.vin;
      vehicle.engine_type = entryEngineType;
      vehicle.model = entryData.modelCode;
      vehicle.registration_date = entryData.enrollmentDate;
      vehicle.timezone = this.data_timezone;
      vehicle.enabled = entryData.enrollmentStatus !== "CANCELLED";
      vehicle.generation = parseInt(entryData.vehicleGeneration || "2", 10);
      result.push(vehicle);
    }
    return result;
  }
  getTransactionId(response) {
    const headers = response.headers;
    for (const key of ["tmsTid", "transactionId", "Xid"]) {
      const value = headers.get(key);
      if (value) {
        return value;
      }
    }
    LOGGER.warn(
      `${DOMAIN} - No transaction ID found in response headers: ${JSON.stringify(Array.from(headers.entries()))}`
    );
    return null;
  }
  async check_action_status(token, vehicle, actionId, synchronous = false, timeout = 120) {
    const url = this.API_URL + "rmt/getRunningStatus";
    const headers = this.getVehicleHeaders(token, vehicle);
    headers.tid = actionId;
    headers.login_id = token.username || "";
    headers.service_type = "REMOTE_POLL";
    const maxAttempts = synchronous ? Math.max(1, Math.floor(timeout / 2)) : 1;
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(url, {
        method: "POST",
        headers
      });
      const jsonResponse2 = await safeParse(response, "check_action_status");
      if (!jsonResponse2) {
        if (!synchronous) {
          return "UNKNOWN" /* UNKNOWN */;
        }
        await new Promise((r) => setTimeout(r, 2e3));
        continue;
      }
      const status = jsonResponse2.status || "";
      if (status === "SUCCESS") {
        return "SUCCESS" /* SUCCESS */;
      } else if (status === "ERROR") {
        return "FAILED" /* FAILED */;
      }
      if (synchronous) {
        await new Promise((r) => setTimeout(r, 2e3));
      }
    }
    if (synchronous) {
      return "TIMEOUT" /* TIMEOUT */;
    }
    return "PENDING" /* PENDING */;
  }
  async lock_action(token, vehicle, action) {
    LOGGER.debug(`${DOMAIN} - Action for lock is: ${action}`);
    let url;
    if (action === "close" /* LOCK */) {
      url = this.API_URL + "rcs/rdo/off";
      LOGGER.debug(`${DOMAIN} - Calling Lock`);
    } else if (action === "open" /* UNLOCK */) {
      url = this.API_URL + "rcs/rdo/on";
      LOGGER.debug(`${DOMAIN} - Calling unlock`);
    } else {
      throw new APIError(`Invalid action value: ${action}`);
    }
    const headers = this.getVehicleHeaders(token, vehicle);
    headers["APPCLOUD-VIN"] = vehicle.VIN || "";
    const data = { userName: token.username, vin: vehicle.VIN };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const jsonResponse2 = await safeParse(response, "lock_action");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Received lock_action response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Received lock_action response: ${text}`);
    return this.getTransactionId(response) || "";
  }
  async start_climate(token, vehicle, options) {
    LOGGER.debug(`${DOMAIN} - Start engine..`);
    let url;
    if (vehicle.engine_type === "EV" /* EV */) {
      url = this.API_URL + "evc/fatc/start";
    } else {
      url = this.API_URL + "rcs/rsc/start";
    }
    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(`${DOMAIN} - Start engine headers: ${JSON.stringify(headers)}`);
    if (options.climate === null)
      options.climate = true;
    if (options.set_temp === null)
      options.set_temp = 70;
    if (options.duration === null)
      options.duration = 5;
    if (options.heating === null)
      options.heating = 0;
    if (options.defrost === null)
      options.defrost = false;
    if (options.front_left_seat === null)
      options.front_left_seat = 0;
    if (options.front_right_seat === null)
      options.front_right_seat = 0;
    if (options.rear_left_seat === null)
      options.rear_left_seat = 0;
    if (options.rear_right_seat === null)
      options.rear_right_seat = 0;
    let data;
    if (vehicle.engine_type === "EV" /* EV */) {
      data = {
        airCtrl: options.climate ? 1 : 0,
        airTemp: { value: String(options.set_temp), unit: 1 },
        defrost: options.defrost,
        heating1: options.heating ? 1 : 0
      };
      if (vehicle.generation === 3) {
        data.igniOnDuration = options.duration;
        data.seatHeaterVentInfo = {
          drvSeatHeatState: options.front_left_seat,
          astSeatHeatState: options.front_right_seat,
          rlSeatHeatState: options.rear_left_seat,
          rrSeatHeatState: options.rear_right_seat
        };
      }
    } else {
      data = {
        Ims: 0,
        airCtrl: options.climate ? 1 : 0,
        airTemp: { unit: 1, value: options.set_temp },
        defrost: options.defrost,
        heating1: options.heating ? 1 : 0,
        igniOnDuration: options.duration,
        seatHeaterVentInfo: {
          drvSeatHeatState: options.front_left_seat,
          astSeatHeatState: options.front_right_seat,
          rlSeatHeatState: options.rear_left_seat,
          rrSeatHeatState: options.rear_right_seat
        },
        username: token.username,
        vin: vehicle.id
      };
    }
    LOGGER.debug(`${DOMAIN} - Start engine data: ${JSON.stringify(data)}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const jsonResponse2 = await safeParse(response, "start_climate");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Start engine response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Start engine response: ${text}`);
    return this.getTransactionId(response) || "";
  }
  async stop_climate(token, vehicle) {
    LOGGER.debug(`${DOMAIN} - Stop engine..`);
    let url;
    if (vehicle.engine_type === "EV" /* EV */) {
      url = this.API_URL + "evc/fatc/stop";
    } else {
      url = this.API_URL + "rcs/rsc/stop";
    }
    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(`${DOMAIN} - Stop engine headers: ${JSON.stringify(headers)}`);
    const response = await fetch(url, {
      method: "POST",
      headers
    });
    const jsonResponse2 = await safeParse(response, "stop_climate");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Stop engine response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Stop engine response: ${text}`);
    return this.getTransactionId(response) || "";
  }
  async start_charge(token, vehicle) {
    if (vehicle.engine_type !== "EV" /* EV */) {
      return "";
    }
    LOGGER.debug(`${DOMAIN} - Start charging..`);
    const url = this.API_URL + "evc/charge/start";
    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(
      `${DOMAIN} - Start charging headers: ${JSON.stringify(headers)}`
    );
    const response = await fetch(url, {
      method: "POST",
      headers
    });
    const jsonResponse2 = await safeParse(response, "start_charge");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Start charge response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Start charge response: ${text}`);
    return this.getTransactionId(response) || "";
  }
  async stop_charge(token, vehicle) {
    if (vehicle.engine_type !== "EV" /* EV */) {
      return "";
    }
    LOGGER.debug(`${DOMAIN} - Stop charging..`);
    const url = this.API_URL + "evc/charge/stop";
    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(
      `${DOMAIN} - Stop charging headers: ${JSON.stringify(headers)}`
    );
    const response = await fetch(url, {
      method: "POST",
      headers
    });
    const jsonResponse2 = await safeParse(response, "stop_charge");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Stop charge response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Stop charge response: ${text}`);
    return this.getTransactionId(response) || "";
  }
  async set_charge_limits(token, vehicle, ac, dc) {
    if (vehicle.engine_type !== "EV" /* EV */) {
      return "";
    }
    LOGGER.debug(`${DOMAIN} - Setting charge limits..`);
    const url = this.API_URL + "evc/charge/targetsoc/set";
    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(
      `${DOMAIN} - Setting charge limits: ${JSON.stringify(headers)}`
    );
    const data = {
      targetSOClist: [
        {
          plugType: 0,
          targetSOClevel: Math.floor(dc)
        },
        {
          plugType: 1,
          targetSOClevel: Math.floor(ac)
        }
      ]
    };
    LOGGER.debug(`${DOMAIN} - Setting charge limits body: ${JSON.stringify(data)}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const jsonResponse2 = await safeParse(response, "set_charge_limits");
    if (jsonResponse2) {
      checkResponseForErrors2(jsonResponse2);
    }
    LOGGER.debug(
      `${DOMAIN} - Setting charge limits response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Setting charge limits: ${text}`);
    return this.getTransactionId(response) || "";
  }
};
__name(HyundaiBlueLinkApiUSA, "HyundaiBlueLinkApiUSA");

// src/KiaUvoApiCA.ts
var CA_TIMEZONES = [
  "America/St_Johns",
  "America/Halifax",
  "America/Toronto",
  "America/Winnipeg",
  "America/Edmonton",
  "America/Vancouver"
];
async function fetchWithRetry(url, options, maxRetries = 3, delay = 2e3, backoff = 2) {
  let lastError = null;
  let currentDelay = delay;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error("Fetch failed after retries");
}
__name(fetchWithRetry, "fetchWithRetry");
var KiaUvoApiCA = class extends ApiImpl {
  LANGUAGE;
  brand;
  BASE_URL;
  API_URL;
  API_HEADERS;
  old_vehicle_status = {};
  // Temperature ranges for model year split
  temperature_range_c_old = Array.from(
    { length: 32 },
    (_, i) => (i + 32) * 0.5
  );
  temperature_range_c_new = Array.from(
    { length: 36 },
    (_, i) => (i + 28) * 0.5
  );
  temperature_range_model_year = 2020;
  constructor(region, brand, language) {
    super();
    this.LANGUAGE = language;
    this.brand = brand;
    if (BRANDS[brand] === BRAND_KIA) {
      this.BASE_URL = "kiaconnect.ca";
    } else if (BRANDS[brand] === BRAND_HYUNDAI) {
      this.BASE_URL = "mybluelink.ca";
    } else if (BRANDS[brand] === BRAND_GENESIS) {
      this.BASE_URL = "genesisconnect.ca";
    } else {
      this.BASE_URL = "kiaconnect.ca";
    }
    this.API_URL = `https://${this.BASE_URL}/tods/api/`;
    this.API_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-CA,en-US;q=0.8,en;q=0.5,fr;q=0.3",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json;charset=UTF-8",
      "from": "CWP",
      "offset": "-5",
      "language": "0",
      "Origin": `https://${this.BASE_URL}`,
      "Connection": "keep-alive",
      "Referer": `https://${this.BASE_URL}/login`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Priority": "u=0",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "client_id": "HATAHSPACA0232141ED9722C67715A0B",
      "client_secret": "CLISCR01AHSPA"
    };
  }
  /**
   * Generate a deterministic device ID based on username and password hash.
   * Uses SHA-256 hash of username+password and takes first 16 chars.
   */
  async _getDeviceId(username, password) {
    const combined = `${username}${password}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex.substring(0, 16);
  }
  /**
   * Check API response for errors and throw appropriate exceptions.
   */
  _checkResponseForErrors(response) {
    const errorCodeMapping = {
      "7404": AuthenticationError,
      "7402": AuthenticationError,
      "7403": AuthenticationError,
      "7602": AuthenticationError
    };
    if (response["responseHeader"]?.["responseCode"] === 1) {
      if (response["error"]?.["errorCode"] === "7110") {
        return;
      }
      const errorCode = response["error"]?.["errorCode"];
      const errorDesc = response["error"]?.["errorDesc"] || "Unknown error";
      if (errorCode in errorCodeMapping) {
        throw new errorCodeMapping[errorCode](errorDesc);
      } else {
        throw new APIError(`Server returned: '${errorDesc}'`);
      }
    }
  }
  async login(username, password, pin) {
    const url = this.API_URL + "v2/login";
    const data = { loginId: username, password };
    const headers = { ...this.API_HEADERS };
    delete headers["accessToken"];
    const deviceId = await this._getDeviceId(username, password);
    headers["Deviceid"] = deviceId;
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const responseJson = await response.json();
    if (responseJson["responseHeader"]?.["responseCode"] === 1 && responseJson["error"]?.["errorCode"] === "7110") {
      const selverifmethUrl = this.API_URL + "mfa/selverifmeth";
      const selverifmethHeaders = { ...this.API_HEADERS };
      delete selverifmethHeaders["accessToken"];
      selverifmethHeaders["Deviceid"] = deviceId;
      const selverifmethData = {
        mfaApiCode: "0107",
        userAccount: username
      };
      const selverifmethResponse = await fetchWithRetry(
        selverifmethUrl,
        {
          method: "POST",
          headers: selverifmethHeaders,
          body: JSON.stringify(selverifmethData)
        }
      );
      const selverifmethJson = await selverifmethResponse.json();
      if (selverifmethJson["responseHeader"]?.["responseCode"] !== 0) {
        const errorDesc = selverifmethJson["error"]?.["errorDesc"] || "Unknown error";
        throw new APIError(`Failed to get verification methods: ${errorDesc}`);
      }
      const result = selverifmethJson["result"] || {};
      const userInfoUuid = result["userInfoUuid"];
      const emailList = result["emailList"] || [];
      const phone = result["userPhone"];
      return new OTPRequest({
        request_id: userInfoUuid,
        otp_key: null,
        has_email: true,
        has_sms: !!phone,
        email: emailList[0] || username,
        sms: phone
      });
    }
    this._checkResponseForErrors(responseJson);
    const responseData = responseJson["result"]?.["token"];
    const tokenExpireIn = parseInt(responseData["expireIn"]) - 60;
    const accessToken = responseData["accessToken"];
    const refreshToken = responseData["refreshToken"];
    const validUntil = new Date(
      (/* @__PURE__ */ new Date()).getTime() + tokenExpireIn * 1e3
    );
    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || null
    });
  }
  async send_otp(otp_request, notify_type) {
    const url = this.API_URL + "mfa/sendotp";
    const headers = { ...this.API_HEADERS };
    const deviceId = await this._getDeviceId("", "");
    headers["Deviceid"] = deviceId;
    let data;
    if (notify_type === "EMAIL" /* EMAIL */) {
      data = {
        otpMethod: "E",
        mfaApiCode: "0107",
        userAccount: otp_request.email || "",
        userPhone: "",
        userInfoUuid: otp_request.request_id || ""
      };
    } else if (notify_type === "SMS" /* SMS */) {
      data = {
        otpMethod: "S",
        mfaApiCode: "0107",
        userAccount: otp_request.email || "",
        userPhone: otp_request.sms || "",
        userInfoUuid: otp_request.request_id || ""
      };
    } else {
      throw new Error("Invalid notify type");
    }
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const responseJson = await response.json();
    if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc = responseJson["error"]?.["errorDesc"] || "Unknown error";
      throw new APIError(`Failed to send OTP: ${errorDesc}`);
    }
    const otpKey = responseJson["result"]?.["otpKey"];
    otp_request.otp_key = otpKey;
  }
  async verify_otp_and_complete_login(username, password, otp_code, otp_request, pin) {
    const url = this.API_URL + "mfa/validateotp";
    const headers = { ...this.API_HEADERS };
    const deviceId = await this._getDeviceId(username, password);
    headers["Deviceid"] = deviceId;
    const data = {
      otpNo: otp_code,
      userAccount: username,
      otpKey: otp_request.otp_key,
      mfaApiCode: "0107"
    };
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    const responseJson = await response.json();
    if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc = responseJson["error"]?.["errorDesc"] || "Invalid OTP code";
      throw new AuthenticationError(`OTP verification failed: ${errorDesc}`);
    }
    if (!responseJson["result"]?.["verifiedOtp"]) {
      throw new AuthenticationError("OTP verification failed");
    }
    const otpValidationKey = responseJson["result"]?.["otpValidationKey"];
    const genmfatknUrl = this.API_URL + "mfa/genmfatkn";
    const genmfatknHeaders = { ...this.API_HEADERS };
    genmfatknHeaders["Deviceid"] = deviceId;
    const genmfatknData = {
      userAccount: username,
      otpEmail: otp_request.email,
      mfaApiCode: "0107",
      otpValidationKey,
      mfaYn: "Y"
    };
    const genmfatknResponse = await fetchWithRetry(genmfatknUrl, {
      method: "POST",
      headers: genmfatknHeaders,
      body: JSON.stringify(genmfatknData)
    });
    const genmfatknJson = await genmfatknResponse.json();
    if (genmfatknJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc = genmfatknJson["error"]?.["errorDesc"] || "Token generation failed";
      throw new AuthenticationError(`Failed to generate token: ${errorDesc}`);
    }
    const tokenData = genmfatknJson["result"]?.["token"];
    const tokenExpireIn = parseInt(tokenData["expireIn"]) - 60;
    const accessToken = tokenData["accessToken"];
    const refreshToken = tokenData["refreshToken"];
    const validUntil = new Date(
      (/* @__PURE__ */ new Date()).getTime() + tokenExpireIn * 1e3
    );
    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || null
    });
  }
  test_token(token) {
    return true;
  }
  async get_vehicles(token) {
    const url = this.API_URL + "vhcllst";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    this._checkResponseForErrors(responseJson);
    const result = [];
    const vehicles = responseJson["result"]?.["vehicles"] || [];
    for (const entry of vehicles) {
      let entryEngineType = null;
      if (entry["fuelKindCode"] === "G") {
        entryEngineType = "ICE" /* ICE */;
      } else if (entry["fuelKindCode"] === "E") {
        entryEngineType = "EV" /* EV */;
      } else if (entry["fuelKindCode"] === "P") {
        entryEngineType = "PHEV" /* PHEV */;
      }
      const vehicle = new Vehicle();
      vehicle.id = entry["vehicleId"];
      vehicle.name = entry["nickName"];
      vehicle.model = entry["modelName"];
      vehicle.year = parseInt(entry["modelYear"] || "1900");
      vehicle.VIN = entry["vin"];
      vehicle.engine_type = entryEngineType;
      vehicle.timezone = this.data_timezone;
      vehicle.dtc_count = entry["dtcCount"];
      result.push(vehicle);
    }
    return result;
  }
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = await this._getCachedVehicleState(token, vehicle);
    this._updateVehiclePropertiesBase(vehicle, state);
    const service = await this._getNextService(token, vehicle);
    if (vehicle.odometer) {
      if (vehicle.odometer < getChildValue(service, "currentOdometer")) {
        const location = await this.get_location(token, vehicle);
        if (location) {
          this._updateVehiclePropertiesLocation(vehicle, location);
        }
      }
    } else {
      const location = await this.get_location(token, vehicle);
      if (location) {
        this._updateVehiclePropertiesLocation(vehicle, location);
      }
    }
    this._updateVehiclePropertiesService(vehicle, service);
    if (vehicle.engine_type === "EV" /* EV */) {
      const charge = await this._getChargeLimits(token, vehicle);
      this._updateVehiclePropertiesCharge(vehicle, charge);
      await this._updateVehiclePropertiesTripDetails(token, vehicle);
    }
  }
  async force_refresh_vehicle_state(token, vehicle) {
    const state = await this._getForcedVehicleState(token, vehicle);
    const lastUpdatedAt = parseDatetime(
      getChildValue(state, "status.lastStatusDate"),
      "UTC"
    );
    const refDate = /* @__PURE__ */ new Date();
    const rawDeltaSeconds = (refDate.getTime() - lastUpdatedAt.getTime()) / 1e3;
    if (Math.abs(rawDeltaSeconds) < 20 * 60) {
    } else {
      const tz = this._detectTimezoneForDate(lastUpdatedAt, refDate);
      if (tz) {
        vehicle.timezone = tz;
      }
    }
    this._updateVehiclePropertiesBase(vehicle, state);
    const service = await this._getNextService(token, vehicle);
    if (vehicle.odometer) {
      if (vehicle.odometer < getChildValue(service, "currentOdometer")) {
        const location = await this.get_location(token, vehicle);
        if (location) {
          this._updateVehiclePropertiesLocation(vehicle, location);
        }
      }
    } else {
      const location = await this.get_location(token, vehicle);
      if (location) {
        this._updateVehiclePropertiesLocation(vehicle, location);
      }
    }
    this._updateVehiclePropertiesService(vehicle, service);
    if (vehicle.engine_type === "EV" /* EV */) {
      const charge = await this._getChargeLimits(token, vehicle);
      this._updateVehiclePropertiesCharge(vehicle, charge);
      await this._updateVehiclePropertiesTripDetails(token, vehicle);
    }
  }
  /**
   * Detect Canadian timezone from a timestamp
   */
  _detectTimezoneForDate(lastUpdatedAt, refDate) {
    return CA_TIMEZONES[0];
  }
  _updateVehiclePropertiesBase(vehicle, state) {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(state, "status.lastStatusDate"),
      this.data_timezone
    );
    const airTempValue = getChildValue(state, "status.airTemp.value");
    if (airTempValue !== null && airTempValue !== "OFF" && typeof airTempValue === "string" && airTempValue.endsWith("H")) {
      const tempIndex = getHexTempIntoIndex(airTempValue);
      if (tempIndex !== null && getChildValue(state, "status.airTemp.unit") === 0) {
        if (vehicle.year && vehicle.year >= this.temperature_range_model_year) {
          state["status"]["airTemp"]["value"] = this.temperature_range_c_new[tempIndex];
        } else {
          state["status"]["airTemp"]["value"] = this.temperature_range_c_old[tempIndex];
        }
      }
    }
    vehicle.total_driving_range = [
      getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
      )] || "km"
    ];
    vehicle.car_battery_percentage = getChildValue(state, "status.battery.batSoc");
    vehicle.engine_is_running = getChildValue(state, "status.engine");
    vehicle.washer_fluid_warning_is_on = getChildValue(
      state,
      "status.washerFluidStatus"
    );
    vehicle.brake_fluid_warning_is_on = getChildValue(
      state,
      "status.breakOilStatus"
    );
    vehicle.tire_pressure_rear_left_warning_is_on = !!getChildValue(
      state,
      "status.tirePressureLamp.tirePressureLampRL"
    );
    vehicle.tire_pressure_front_left_warning_is_on = !!getChildValue(
      state,
      "status.tirePressureLamp.tirePressureLampFL"
    );
    vehicle.tire_pressure_front_right_warning_is_on = !!getChildValue(
      state,
      "status.tirePressureLamp.tirePressureLampFR"
    );
    vehicle.tire_pressure_rear_right_warning_is_on = !!getChildValue(
      state,
      "status.tirePressureLamp.tirePressureLampRR"
    );
    vehicle.tire_pressure_all_warning_is_on = !!getChildValue(
      state,
      "status.tirePressureLamp.tirePressureLampAll"
    );
    vehicle.air_temperature = [
      getChildValue(state, "status.airTemp.value"),
      TEMPERATURE_UNITS[0]
    ];
    vehicle.defrost_is_on = getChildValue(state, "status.defrost");
    vehicle.steering_wheel_heater_is_on = getChildValue(
      state,
      "status.steerWheelHeat"
    );
    vehicle.back_window_heater_is_on = getChildValue(
      state,
      "status.sideBackWindowHeat"
    );
    vehicle.side_mirror_heater_is_on = getChildValue(
      state,
      "status.sideMirrorHeat"
    );
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.flSeatHeatState")] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.frSeatHeatState")] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState")] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState")] || null;
    vehicle.accessory_on = getChildValue(state, "status.acc");
    vehicle.ign3 = getChildValue(state, "status.ign3");
    vehicle.remote_ignition = getChildValue(state, "status.remoteIgnition");
    vehicle.transmission_condition = getChildValue(
      state,
      "status.transCond"
    );
    vehicle.sleep_mode_check = getChildValue(state, "status.sleepModeCheck");
    vehicle.headlamp_status = getChildValue(
      state,
      "status.lampWireStatus.headLamp.headLampStatus"
    );
    vehicle.headlamp_left_low = getChildValue(
      state,
      "status.lampWireStatus.headLamp.leftLowLamp"
    );
    vehicle.headlamp_right_low = getChildValue(
      state,
      "status.lampWireStatus.headLamp.rightLowLamp"
    );
    vehicle.headlamp_left_high = getChildValue(
      state,
      "status.lampWireStatus.headLamp.leftHighLamp"
    );
    vehicle.headlamp_right_high = getChildValue(
      state,
      "status.lampWireStatus.headLamp.rightHighLamp"
    );
    vehicle.headlamp_left_bifunc = getChildValue(
      state,
      "status.lampWireStatus.headLamp.leftBifuncLamp"
    );
    vehicle.headlamp_right_bifunc = getChildValue(
      state,
      "status.lampWireStatus.headLamp.rightBifuncLamp"
    );
    vehicle.stop_lamp_left = getChildValue(
      state,
      "status.lampWireStatus.stopLamp.leftLamp"
    );
    vehicle.stop_lamp_right = getChildValue(
      state,
      "status.lampWireStatus.stopLamp.rightLamp"
    );
    vehicle.turn_signal_left_front = getChildValue(
      state,
      "status.lampWireStatus.turnSignalLamp.leftFrontLamp"
    );
    vehicle.turn_signal_right_front = getChildValue(
      state,
      "status.lampWireStatus.turnSignalLamp.rightFrontLamp"
    );
    vehicle.turn_signal_left_rear = getChildValue(
      state,
      "status.lampWireStatus.turnSignalLamp.leftRearLamp"
    );
    vehicle.turn_signal_right_rear = getChildValue(
      state,
      "status.lampWireStatus.turnSignalLamp.rightRearLamp"
    );
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
    vehicle.sunroof_is_open = getChildValue(state, "status.sunroofOpen");
    vehicle.trunk_is_open = getChildValue(state, "status.trunkOpen");
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
    if (vehicle.engine_type !== "ICE" /* ICE */) {
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
      vehicle.ev_driving_range = [
        getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
        ),
        DISTANCE_UNITS[getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
        )] || "km"
      ];
      vehicle.ev_estimated_current_charge_duration = [
        getChildValue(state, "status.evStatus.remainTime2.atc.value"),
        "m"
      ];
      vehicle.ev_estimated_fast_charge_duration = [
        getChildValue(state, "status.evStatus.remainTime2.etc1.value"),
        "m"
      ];
      vehicle.ev_estimated_portable_charge_duration = [
        getChildValue(state, "status.evStatus.remainTime2.etc2.value"),
        "m"
      ];
      vehicle.ev_estimated_station_charge_duration = [
        getChildValue(state, "status.evStatus.remainTime2.etc3.value"),
        "m"
      ];
      vehicle.ev_battery_precondition_enabled = getChildValue(
        state,
        "status.evStatus.batteryPreconditiong"
      );
    }
    const gasModeRange = getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    );
    const gasModeUnit = DISTANCE_UNITS[getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
    )] || "km";
    if (gasModeRange) {
      vehicle.fuel_driving_range = [gasModeRange, gasModeUnit];
    } else {
      vehicle.fuel_driving_range = [
        getChildValue(state, "status.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "status.dte.unit")] || "km"
      ];
    }
    vehicle.fuel_level_is_low = getChildValue(state, "status.lowFuelLight");
    vehicle.fuel_level = getChildValue(state, "status.fuelLevel");
    vehicle.air_control_is_on = getChildValue(state, "status.airCtrlOn");
    if (!vehicle.data) {
      vehicle.data = {};
    }
    vehicle.data["status"] = state["status"];
  }
  _updateVehiclePropertiesService(vehicle, state) {
    vehicle.odometer = [
      getChildValue(state, "currentOdometer"),
      DISTANCE_UNITS[getChildValue(state, "currentOdometerUnit")] || "km"
    ];
    vehicle.next_service_distance = [
      getChildValue(state, "imatServiceOdometer"),
      DISTANCE_UNITS[getChildValue(state, "imatServiceOdometerUnit")] || "km"
    ];
    vehicle.last_service_distance = [
      getChildValue(state, "msopServiceOdometer"),
      DISTANCE_UNITS[getChildValue(state, "msopServiceOdometerUnit")] || "km"
    ];
    if (!vehicle.data) {
      vehicle.data = {};
    }
    vehicle.data["service"] = state;
  }
  _updateVehiclePropertiesLocation(vehicle, state) {
    const lat = getChildValue(state, "coord.lat");
    const lon = getChildValue(state, "coord.lon");
    if (lat && lon) {
      vehicle.location = [
        lat,
        lon,
        parseDatetime(getChildValue(state, "time"), this.data_timezone)
      ];
    }
    if (!vehicle.data) {
      vehicle.data = {};
    }
    vehicle.data["vehicleLocation"] = state;
  }
  async _updateVehiclePropertiesTripDetails(token, vehicle) {
    const url = this.API_URL + "alerts/maintenance/evTripDetails";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    try {
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers
      });
      if (!response.ok) {
        return;
      }
      const responseJson = await response.json();
      this._checkResponseForErrors(responseJson);
      if (responseJson["result"] && responseJson["result"]["tripdetails"]) {
        const tripStats = [];
        for (const trip of responseJson["result"]["tripdetails"]) {
          const processedTrip = new DailyDrivingStats();
          processedTrip.date = new Date(trip["startdate"]);
          processedTrip.total_consumed = getChildValue(trip, "totalused");
          processedTrip.engine_consumption = getChildValue(trip, "drivetrain");
          processedTrip.climate_consumption = getChildValue(trip, "climate");
          processedTrip.onboard_electronics_consumption = getChildValue(
            trip,
            "accessories"
          );
          processedTrip.battery_care_consumption = getChildValue(
            trip,
            "batterycare"
          );
          processedTrip.regenerated_energy = getChildValue(trip, "regen");
          processedTrip.distance = getChildValue(trip, "distance");
          processedTrip.distance_unit = vehicle.odometer_unit || "km";
          tripStats.push(processedTrip);
        }
        vehicle.daily_stats = tripStats;
      }
    } catch (error) {
    }
  }
  async _getCachedVehicleState(token, vehicle) {
    const url = this.API_URL + "lstvhclsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    this._checkResponseForErrors(responseJson);
    const status = responseJson["result"]?.["status"];
    return { status };
  }
  async _getForcedVehicleState(token, vehicle) {
    const url = this.API_URL + "rltmvhclsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    this._checkResponseForErrors(responseJson);
    const status = responseJson["result"]?.["status"];
    return { status };
  }
  async _getNextService(token, vehicle) {
    const url = this.API_URL + "nxtsvc";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    this._checkResponseForErrors(responseJson);
    return responseJson["result"]?.["maintenanceInfo"] || {};
  }
  async get_location(token, vehicle) {
    const url = this.API_URL + "fndmcr";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["from"] = "SPA";
    headers["Referer"] = `https://${this.BASE_URL}/remote/`;
    try {
      const pAuth = await this._getPinToken(token, vehicle);
      headers["pAuth"] = pAuth;
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ pin: token.pin })
      });
      const responseJson = await response.json();
      if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
        throw new APIError("No Location Located");
      }
      return responseJson["result"] || null;
    } catch (error) {
      return null;
    }
  }
  async _getPinToken(token, vehicle) {
    const url = this.API_URL + "vrfypin";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin })
    });
    const responseJson = await response.json();
    return responseJson["result"]?.["pAuth"] || "";
  }
  async lock_action(token, vehicle, action) {
    let url;
    if (action === "close" /* LOCK */) {
      url = this.API_URL + "drlck";
    } else if (action === "open" /* UNLOCK */) {
      url = this.API_URL + "drulck";
    } else {
      throw new Error("Invalid lock action");
    }
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin })
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
  async start_climate(token, vehicle, options) {
    let url;
    if (vehicle.engine_type === "EV" /* EV */) {
      url = this.API_URL + "evc/rfon";
    } else {
      url = this.API_URL + "rmtstrt";
    }
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const climate = options.climate ?? true;
    const setTemp = options.set_temp ?? 21;
    const duration = options.duration ?? 5;
    const heating = options.heating ?? 0;
    const defrost = options.defrost ?? false;
    const frontLeftSeat = options.front_left_seat ?? 0;
    const frontRightSeat = options.front_right_seat ?? 0;
    const rearLeftSeat = options.rear_left_seat ?? 0;
    const rearRightSeat = options.rear_right_seat ?? 0;
    let hexSetTemp;
    if (vehicle.year && vehicle.year >= this.temperature_range_model_year) {
      const index = this.temperature_range_c_new.indexOf(setTemp);
      hexSetTemp = getIndexIntoHexTemp(index) || "10H";
    } else {
      const index = this.temperature_range_c_old.indexOf(setTemp);
      hexSetTemp = getIndexIntoHexTemp(index) || "10H";
    }
    let payload;
    if (vehicle.engine_type === "EV" /* EV */) {
      const climateSettings = {
        airCtrl: climate ? 1 : 0,
        defrost,
        heating1: heating,
        airTemp: {
          value: hexSetTemp,
          unit: 0,
          hvacTempType: 1
        }
      };
      payload = {
        pin: token.pin
      };
      if (BRANDS[this.brand] === BRAND_KIA) {
        if (vehicle.name === "EV9") {
          payload["remoteControl"] = climateSettings;
          payload["remoteControl"]["igniOnDuration"] = duration;
          payload["remoteControl"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat
          };
        } else {
          payload["hvacInfo"] = climateSettings;
          payload["hvacInfo"]["igniOnDuration"] = duration;
          payload["hvacInfo"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat
          };
        }
      } else {
        if (vehicle.model === "IONIQ 9") {
          payload["remoteControl"] = climateSettings;
          payload["remoteControl"]["igniOnDuration"] = duration;
          payload["remoteControl"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat
          };
        } else {
          payload["hvacInfo"] = climateSettings;
          payload["hvacInfo"]["igniOnDuration"] = duration;
          payload["hvacInfo"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat
          };
        }
      }
    } else {
      payload = {
        setting: {
          airCtrl: climate ? 1 : 0,
          defrost,
          heating1: heating,
          igniOnDuration: duration,
          ims: 0,
          airTemp: { value: hexSetTemp, unit: 0, hvacTempType: 0 },
          seatHeaterVentCMD: {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat
          }
        },
        pin: token.pin
      };
    }
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
  async stop_climate(token, vehicle) {
    let url;
    if (vehicle.engine_type === "EV" /* EV */) {
      url = this.API_URL + "evc/rfoff";
    } else {
      url = this.API_URL + "rmtstp";
    }
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin })
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
  async check_action_status(token, vehicle, action_id, synchronous = false, timeout = 0) {
    if (timeout < 0) {
      return "TIMEOUT" /* TIMEOUT */;
    }
    const startTime = /* @__PURE__ */ new Date();
    const url = this.API_URL + "rmtsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["transactionId"] = action_id;
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    const lastActionCompleted = responseJson["result"]?.["transaction"]?.["apiStatusCode"] !== "null";
    if (responseJson["responseHeader"]?.["responseCode"] === 1) {
      return "FAILED" /* FAILED */;
    } else if (responseJson["result"]?.["transaction"]?.["apiResult"] === "C") {
      return "SUCCESS" /* SUCCESS */;
    } else if (responseJson["result"]?.["transaction"]?.["apiResult"] === "P") {
      if (!synchronous) {
        return "PENDING" /* PENDING */;
      } else {
        const timeDelta = (/* @__PURE__ */ new Date()).getTime() - startTime.getTime();
        const timeLeft = timeout - Math.floor(timeDelta / 1e3) - 10;
        await new Promise((resolve) => setTimeout(resolve, 1e4));
        return this.check_action_status(
          token,
          vehicle,
          action_id,
          synchronous,
          timeLeft
        );
      }
    }
    return "FAILED" /* FAILED */;
  }
  async start_charge(token, vehicle) {
    const url = this.API_URL + "evc/rcstrt";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin })
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
  async stop_charge(token, vehicle) {
    const url = this.API_URL + "evc/rcstp";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin })
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
  _updateVehiclePropertiesCharge(vehicle, state) {
    try {
      const acLevels = state.filter((x) => x["plugType"] === 1).map((x) => x["level"]);
      if (acLevels.length > 0 && acLevels[acLevels.length - 1] <= 100) {
        vehicle.ev_charge_limits_ac = acLevels[acLevels.length - 1];
      }
      const dcLevels = state.filter((x) => x["plugType"] === 0).map((x) => x["level"]);
      if (dcLevels.length > 0 && dcLevels[dcLevels.length - 1] <= 100) {
        vehicle.ev_charge_limits_dc = dcLevels[dcLevels.length - 1];
      }
    } catch (error) {
    }
  }
  async _getChargeLimits(token, vehicle) {
    const url = this.API_URL + "evc/selsoc";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers
    });
    const responseJson = await response.json();
    this._checkResponseForErrors(responseJson);
    return responseJson["result"] || {};
  }
  async set_charge_limits(token, vehicle, ac, dc) {
    const url = this.API_URL + "evc/setsoc";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);
    headers["from"] = "SPA";
    headers["offset"] = "-8";
    headers["priority"] = "u=1, i";
    headers["Referer"] = "https://kiaconnect.ca/remote/";
    const payload = {
      tsoc: [
        {
          plugType: 0,
          level: dc
        },
        {
          plugType: 1,
          level: ac
        }
      ],
      pin: token.pin
    };
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
};
__name(KiaUvoApiCA, "KiaUvoApiCA");

// src/KiaUvoApiAU.ts
var USER_AGENT_OK_HTTP3 = "okhttp/3.12.0";
function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buf;
}
__name(stringToArrayBuffer, "stringToArrayBuffer");
function arrayBufferToBase64(buf) {
  const view = new Uint8Array(buf);
  let result = "";
  for (let i = 0; i < view.length; i++) {
    result += String.fromCharCode(view[i]);
  }
  return btoa(result);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
function base64ToArrayBuffer(str) {
  const binary = atob(str);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buf;
}
__name(base64ToArrayBuffer, "base64ToArrayBuffer");
var KiaUvoApiAU = class extends ApiImplType1 {
  data_timezone = "Australia/Sydney";
  temperature_range = Array.from({ length: 20 }, (_, i) => (i + 17) * 0.5);
  BASE_URL = "";
  CCSP_SERVICE_ID = "";
  APP_ID = "";
  BASIC_AUTHORIZATION = "";
  USER_API_URL = "";
  SPA_API_URL = "";
  SPA_API_URL_V2 = "";
  cfb = new Uint8Array();
  brand = 0;
  constructor(region, brand, language) {
    super();
    this.brand = brand;
    if (BRANDS[brand] === BRAND_KIA && REGIONS[region] === REGION_AUSTRALIA) {
      this.BASE_URL = "au-apigw.ccs.kia.com.au:8082";
      this.CCSP_SERVICE_ID = "8acb778a-b918-4a8d-8624-73a0beb64289";
      this.APP_ID = "4ad4dcde-be23-48a8-bc1c-91b94f5c06f8";
      this.BASIC_AUTHORIZATION = "Basic OGFjYjc3OGEtYjkxOC00YThkLTg2MjQtNzNhMGJlYjY0Mjg5OjdTY01NbTZmRVlYZGlFUEN4YVBhUW1nZVlkbFVyZndvaDRBZlhHT3pZSVMyQ3U5VA==";
      this.cfb = new Uint8Array(
        base64ToArrayBuffer(
          "SGGCDRvrzmRa2WTNFQPUaNfSFdtPklZ48xUuVckigYasxmeOQqVgCAC++YNrI1vVabI="
        )
      );
    } else if (BRANDS[brand] === BRAND_HYUNDAI) {
      this.BASE_URL = "au-apigw.ccs.hyundai.com.au:8080";
      this.CCSP_SERVICE_ID = "855c72df-dfd7-4230-ab03-67cbf902bb1c";
      this.APP_ID = "f9ccfdac-a48d-4c57-bd32-9116963c24ed";
      this.BASIC_AUTHORIZATION = "Basic ODU1YzcyZGYtZGZkNy00MjMwLWFiMDMtNjdjYmY5MDJiYjFjOmU2ZmJ3SE0zMllOYmhRbDBwdmlhUHAzcmY0dDNTNms5MWVjZUEzTUpMZGJkVGhDTw==";
      this.cfb = new Uint8Array(
        base64ToArrayBuffer(
          "nGDHng3k4Cg9gWV+C+A6Yk/ecDopUNTkGmDpr2qVKAQXx9bvY2/YLoHPfObliK32mZQ="
        )
      );
    } else if (BRANDS[brand] === BRAND_KIA && REGIONS[region] === REGION_NZ) {
      this.BASE_URL = "au-apigw.ccs.kia.com.au:8082";
      this.CCSP_SERVICE_ID = "4ab606a7-cea4-48a0-a216-ed9c14a4a38c";
      this.APP_ID = "97745337-cac6-4a5b-afc3-e65ace81c994";
      this.BASIC_AUTHORIZATION = "Basic NGFiNjA2YTctY2VhNC00OGEwLWEyMTYtZWQ5YzE0YTRhMzhjOjBoYUZxWFRrS2t0Tktmekt4aFowYWt1MzFpNzRnMHlRRm01b2QybXo0TGRJNW1MWQ==";
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
  async login(username, password, pin) {
    const stamp = this._get_stamp();
    const device_id = await this._get_device_id(stamp);
    const cookies = await this._get_cookies();
    let authorization_code = null;
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
    const valid_until = new Date(Date.now() + 23 * 60 * 60 * 1e3);
    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until: valid_until.toISOString(),
      pin
    });
  }
  async update_vehicle_with_cached_state(token, vehicle) {
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
      )
    });
    const response = await resp.json();
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
          )
        ];
      }
    } else {
      const location = await this._get_location(token, vehicle);
      this._update_vehicle_properties(vehicle, {
        status: response["resMsg"],
        vehicleLocation: location
      });
    }
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
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
  async force_refresh_vehicle_state(token, vehicle) {
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;
    if (is_ccs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const status = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      this._update_vehicle_properties(vehicle, {
        status,
        vehicleLocation: location
      });
    }
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
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
  async _force_refresh_vehicle_state_ccs2(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      )
    });
    const response = await resp.json();
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
        )
      ];
    }
  }
  _update_vehicle_properties(vehicle, state) {
    if (getChildValue(state, "status.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "status.time"),
        this.data_timezone
      );
    } else {
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    if (getChildValue(state, "status.odometer.value")) {
      vehicle.odometer = [
        getChildValue(state, "status.odometer.value"),
        DISTANCE_UNITS[getChildValue(state, "status.odometer.unit")]
      ];
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
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "status.airTemp.unit")]
        ];
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
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.flSeatHeatState") ?? "null"];
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.frSeatHeatState") ?? "null"];
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState") ?? "null"];
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState") ?? "null"];
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
    if (getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
    ) !== null) {
      vehicle.total_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
        )]
      ];
    }
    if (getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
    ) !== null) {
      vehicle.ev_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
        )]
      ];
    }
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.atc.value"),
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc1.value"),
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc2.value"),
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc3.value"),
      "m"
    ];
    const target_soc_list = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.targetSOClist"
    );
    try {
      if (target_soc_list && Array.isArray(target_soc_list)) {
        const ac_socs = target_soc_list.filter((x) => x["plugType"] === 1);
        if (ac_socs.length > 0) {
          vehicle.ev_charge_limits_ac = ac_socs[ac_socs.length - 1]["targetSOClevel"];
        }
        const dc_socs = target_soc_list.filter((x) => x["plugType"] === 0);
        if (dc_socs.length > 0) {
          vehicle.ev_charge_limits_dc = dc_socs[dc_socs.length - 1]["targetSOClevel"];
        }
      }
    } catch {
      console.debug(`${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`);
    }
    if (getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    ) !== null) {
      vehicle.fuel_driving_range = [
        getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
        ),
        DISTANCE_UNITS[getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
        )]
      ];
    } else if (getChildValue(state, "status.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "status.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "status.dte.unit")]
      ];
    }
    vehicle.ev_target_range_charge_AC = [
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit"
      )]
    ];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[getChildValue(
        state,
        "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit"
      )]
    ];
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
    if (getChildValue(
      state,
      "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
    )) {
      if (getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
      ) === 1) {
        vehicle.ev_off_peak_charge_only_enabled = true;
      } else if (getChildValue(
        state,
        "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
      ) === 2) {
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
        )
      ];
    }
    vehicle.data = state;
  }
  _update_vehicle_drive_info(vehicle, state) {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }
  async _get_location(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token)
      });
      const response = await resp.json();
      console.debug(`${DOMAIN} - _get_location response: ${JSON.stringify(response)}`);
      checkResponseForErrors(response);
      return response["resMsg"];
    } catch {
      console.debug(`${DOMAIN} - _get_location failed`);
      return null;
    }
  }
  async _get_forced_vehicle_state(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    console.debug(
      `${DOMAIN} - Received forced vehicle data: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);
    return response["resMsg"];
  }
  async charge_port_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action, deviceId: token.device_id };
    console.debug(
      `${DOMAIN} - Charge Port Action Request: ${JSON.stringify(payload)}`
    );
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.debug(
      `${DOMAIN} - Charge Port Action Response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);
    return response["msgId"];
  }
  async _get_charge_limits(token, vehicle) {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;
    console.debug(`${DOMAIN} - Get Charging Limits Request`);
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    console.debug(
      `${DOMAIN} - Get Charging Limits Response: ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);
    if (response["resMsg"] !== null) {
      return response["resMsg"];
    }
    return null;
  }
  async _get_trip_info(token, vehicle, date_string, trip_period_type) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload;
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.debug(
      `${DOMAIN} - get_trip_info response ${JSON.stringify(response)}`
    );
    checkResponseForErrors(response);
    return response;
  }
  async update_month_trip_info(token, vehicle, yyyymm_string) {
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
  async update_day_trip_info(token, vehicle, yyyymmdd_string) {
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
  async _get_driving_info(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";
    const respAlltime = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ periodTarget: 1 })
    });
    const responseAlltime = await respAlltime.json();
    console.debug(
      `${DOMAIN} - get_driving_info responseAlltime ${JSON.stringify(responseAlltime)}`
    );
    checkResponseForErrors(responseAlltime);
    const resp30d = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ periodTarget: 0 })
    });
    const response30d = await resp30d.json();
    console.debug(
      `${DOMAIN} - get_driving_info response30d ${JSON.stringify(response30d)}`
    );
    checkResponseForErrors(response30d);
    if (getChildValue(responseAlltime, "resMsg.drivingInfoDetail.0")) {
      const drivingInfo = responseAlltime["resMsg"]["drivingInfoDetail"][0];
      drivingInfo["dailyStats"] = [];
      for (const day of response30d["resMsg"]["drivingInfoDetail"]) {
        const processedDay = new DailyDrivingStats();
        processedDay.date = /* @__PURE__ */ new Date(
          day["drivingDate"].substring(0, 4) + "-" + day["drivingDate"].substring(4, 6) + "-" + day["drivingDate"].substring(6, 8)
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
  _get_stamp() {
    const timestamp = Math.floor(Date.now() / 1e3);
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
  async _get_device_id(stamp) {
    const my_hex = Math.floor(Math.random() * Math.pow(10, 16)).toString(16).padStart(64, "0");
    const registration_id = my_hex.substring(0, 64);
    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      pushRegId: registration_id,
      pushType: "GCM",
      uuid: this._generateUUID()
    };
    const headers = {
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      Stamp: stamp,
      "Content-Type": "application/json;charset=UTF-8",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP3
    };
    console.debug(
      `${DOMAIN} - Get Device ID request: ${JSON.stringify(headers)} ${JSON.stringify(payload)}`
    );
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrors(response);
    console.debug(
      `${DOMAIN} - Get Device ID response: ${JSON.stringify(response)}`
    );
    const device_id = response["resMsg"]["deviceId"];
    return device_id;
  }
  async _get_cookies() {
    const url = this.USER_API_URL + "oauth2/authorize?response_type=code&client_id=" + this.CCSP_SERVICE_ID + "&redirect_uri=https://" + this.BASE_URL + "/api/v1/user/oauth2/redirect&lang=en";
    console.debug(`${DOMAIN} - Get cookies request: ${url}`);
    const resp = await fetch(url);
    const text = await resp.text();
    const cookies = {};
    const setCookieHeaders = resp.headers.getSetCookie?.() || [];
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
  async _get_authorization_code_with_redirect_url(username, password, cookies) {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password };
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        Cookie: cookieString
      },
      body: JSON.stringify(data)
    });
    const response = await resp.json();
    const redirectUrl = response["redirectUrl"];
    const url_obj = new URL(redirectUrl);
    const code = url_obj.searchParams.get("code");
    if (!code) {
      throw new Error("No authorization code in response");
    }
    return code;
  }
  async _get_access_token(authorization_code, stamp) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP3
    };
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: "https://" + this.BASE_URL + "/api/v1/user/oauth2/redirect",
      code: authorization_code
    });
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data.toString()
    });
    const response = await resp.json();
    const token_type = response["token_type"];
    const access_token = token_type + " " + response["access_token"];
    const refresh_token = response["refresh_token"];
    return [token_type, access_token, refresh_token];
  }
  async _get_refresh_token(refresh_token_code, stamp) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP3
    };
    const data = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token_code
    });
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data.toString()
    });
    const response = await resp.json();
    const token_type = response["token_type"];
    const refresh_token = token_type + " " + response["access_token"];
    return [token_type, refresh_token];
  }
  _generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
};
__name(KiaUvoApiAU, "KiaUvoApiAU");

// src/KiaUvoApiCN.ts
var USER_AGENT_OK_HTTP4 = "okhttp/3.12.0";
function checkResponseForErrorsCN(response) {
  const errorCodeMapping = {
    "4004": DuplicateRequestError,
    "4005": UnsupportedControlError,
    "4081": RequestTimeoutError,
    "5031": ServiceTemporaryUnavailable,
    "5091": RateLimitingError,
    "5921": NoDataFound,
    "9999": RequestTimeoutError
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
__name(checkResponseForErrorsCN, "checkResponseForErrorsCN");
var KiaUvoApiCN = class extends ApiImplType1 {
  // Timezone for China
  data_timezone = "Asia/Shanghai";
  temperature_range = Array.from({ length: 32 }, (_, i) => (i + 14) * 0.5);
  // Brand-specific properties
  BASE_DOMAIN = "";
  CCSP_SERVICE_ID = "";
  APP_ID = "";
  BASIC_AUTHORIZATION = "";
  // Derived URLs
  BASE_URL = "";
  USER_API_URL = "";
  SPA_API_URL = "";
  SPA_API_URL_V2 = "";
  CLIENT_ID = "";
  GCM_SENDER_ID = 199360397125;
  LANGUAGE = "zh";
  constructor(region, brand, language) {
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
  _get_authenticated_headers(token, ccs2Support) {
    return {
      Authorization: token.access_token ?? "",
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      "ccsp-device-id": token.device_id ?? "",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP4
    };
  }
  async _get_control_headers(token, vehicle) {
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
      "User-Agent": USER_AGENT_OK_HTTP4
    };
  }
  async login(username, password, pin) {
    const deviceId = await this._get_device_id_async();
    const cookies = await this._get_cookies();
    await this._set_session_language(cookies);
    let authorizationCode = null;
    try {
      authorizationCode = await this._get_authorization_code_with_redirect_url(username, password, cookies);
    } catch (e) {
    }
    if (authorizationCode === null) {
      throw new AuthenticationError("Login Failed");
    }
    const [_, accessToken, refreshTokenAuth] = await this._get_access_token(authorizationCode);
    const [__, refreshToken] = await this._get_refresh_token(refreshTokenAuth);
    const validUntil = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3);
    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      device_id: deviceId,
      valid_until: validUntil.toISOString(),
      pin: pin ?? null
    });
  }
  async get_vehicles(token) {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    const result = [];
    for (const entry of response["resMsg"]["vehicles"]) {
      let entryEngineType = null;
      if (entry["type"] === "GN")
        entryEngineType = "ICE" /* ICE */;
      else if (entry["type"] === "EV")
        entryEngineType = "EV" /* EV */;
      else if (entry["type"] === "PHEV")
        entryEngineType = "PHEV" /* PHEV */;
      else if (entry["type"] === "HV")
        entryEngineType = "HEV" /* HEV */;
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
  _get_time_from_string(value, timesection) {
    if (value == null)
      return null;
    let v = value;
    const lastTwo = parseInt(String(v).slice(-2), 10);
    if (lastTwo > 60) {
      v = parseInt(String(v), 10) + 40;
    }
    if (parseInt(String(v), 10) > 1260) {
      return String(v).padStart(4, "0");
    } else {
      let timeStr = String(v).padStart(4, "0");
      if (timesection === 0) {
        timeStr += " AM";
      } else if (timesection === 1) {
        timeStr += " PM";
      }
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
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);
    if (vehicle.engine_type === "EV" /* EV */) {
      try {
        const driveState = await this._get_driving_info(token, vehicle);
        this._update_vehicle_drive_info(vehicle, driveState);
      } catch (e) {
      }
    }
  }
  async force_refresh_vehicle_state(token, vehicle) {
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
    if (vehicle.engine_type === "EV" /* EV */) {
      try {
        const driveState = await this._get_driving_info(token, vehicle);
        this._update_vehicle_drive_info(vehicle, driveState);
      } catch (e) {
      }
    }
  }
  async _force_refresh_vehicle_state_ccs2(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    const state = response["resMsg"];
    this._update_vehicle_properties(vehicle, state);
    const location = await this._get_location(token, vehicle);
    if (location && getChildValue(location, "coord.lat")) {
      vehicle.location = [
        getChildValue(location, "coord.lat"),
        getChildValue(location, "coord.lon"),
        parseDatetime(getChildValue(location, "time"), this.data_timezone)
      ];
    }
  }
  _update_vehicle_properties(vehicle, state) {
    if (getChildValue(state, "status.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "status.time"),
        this.data_timezone
      );
    } else {
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    vehicle.odometer = [
      getChildValue(state, "status.odometer.value"),
      DISTANCE_UNITS[getChildValue(state, "status.odometer.unit")] ?? "km"
    ];
    vehicle.car_battery_percentage = getChildValue(state, "status.battery.batSoc");
    vehicle.engine_is_running = getChildValue(state, "status.engine");
    const tempValue = getChildValue(state, "status.airTemp.value");
    if (tempValue) {
      const tempIndex = getHexTempIntoIndex(tempValue);
      if (tempIndex !== null && tempIndex < this.temperature_range.length) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "status.airTemp.unit")] ?? "\xB0C"
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
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.flSeatHeatState")] ?? null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.frSeatHeatState")] ?? null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState")] ?? null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState")] ?? null;
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
      "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
    );
    if (totalAvailableRangeValue !== null) {
      vehicle.total_driving_range = [
        Math.round(parseFloat(String(totalAvailableRangeValue)) * 10) / 10,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit")] ?? "km"
      ];
    }
    const evModeRangeValue = getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.value");
    if (evModeRangeValue !== null) {
      vehicle.ev_driving_range = [
        Math.round(parseFloat(String(evModeRangeValue)) * 10) / 10,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit")] ?? "km"
      ];
    }
    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.atc.value"),
      "m"
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc1.value"),
      "m"
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc2.value"),
      "m"
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "status.evStatus.remainTime2.etc3.value"),
      "m"
    ];
    const targetSocList = getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist");
    try {
      if (targetSocList && Array.isArray(targetSocList)) {
        const acLimits = targetSocList.filter((x) => x["plugType"] === 1);
        const dcLimits = targetSocList.filter((x) => x["plugType"] === 0);
        if (acLimits.length > 0)
          vehicle.ev_charge_limits_ac = acLimits[acLimits.length - 1]["targetSOClevel"];
        if (dcLimits.length > 0)
          vehicle.ev_charge_limits_dc = dcLimits[dcLimits.length - 1]["targetSOClevel"];
      }
    } catch {
    }
    const gasModeRangeValue = getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value");
    if (gasModeRangeValue !== null) {
      vehicle.fuel_driving_range = [
        gasModeRangeValue,
        DISTANCE_UNITS[getChildValue(state, "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit")] ?? "km"
      ];
    } else if (getChildValue(state, "status.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "status.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "status.dte.unit")] ?? "km"
      ];
    }
    vehicle.ev_target_range_charge_AC = [
      getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"),
      DISTANCE_UNITS[getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit")] ?? "km"
    ];
    vehicle.ev_target_range_charge_DC = [
      getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"),
      DISTANCE_UNITS[getChildValue(state, "status.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit")] ?? "km"
    ];
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
    vehicle.ev_first_departure_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservInfo.time.timeSection")
    );
    vehicle.ev_second_departure_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservInfo.time.timeSection")
    );
    vehicle.ev_off_peak_start_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.starttime.timeSection")
    );
    vehicle.ev_off_peak_end_time = this._get_time_from_string(
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.time"),
      getChildValue(state, "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerTime1.endtime.timeSection")
    );
    const offPeakPowerFlag = getChildValue(
      state,
      "status.evStatus.reservChargeInfos.offpeakPowerInfo.offPeakPowerFlag"
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
        parseDatetime(getChildValue(state, "vehicleLocation.time"), this.data_timezone)
      ];
    }
    vehicle.data = state;
  }
  _update_vehicle_drive_info(vehicle, state) {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }
  async _get_cached_vehicle_state(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["resMsg"];
  }
  async _get_location(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location";
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token)
      });
      const response = await resp.json();
      checkResponseForErrorsCN(response);
      return response["resMsg"];
    } catch {
      return null;
    }
  }
  async _get_forced_vehicle_state(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    const mappedResponse = {};
    mappedResponse["vehicleStatus"] = response["resMsg"];
    return mappedResponse;
  }
  async lock_action(token, vehicle, action) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
    const payload = { action, deviceId: token.device_id };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async charge_port_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action, deviceId: token.device_id };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async start_climate(token, vehicle, options) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/engine";
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
        heating1: parseInt(String(heating), 10)
      },
      tempCode: hexSetTemp,
      unit: "C"
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async stop_climate(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/engine";
    const payload = { action: "stop" };
    const resp = await fetch(url, {
      method: "POST",
      headers: await this._get_control_headers(token, vehicle),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async start_charge(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
    const payload = { action: "start", deviceId: token.device_id };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async stop_charge(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/charge";
    const payload = { action: "stop", deviceId: token.device_id };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  async _get_charge_limits(token, vehicle) {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    if (response["resMsg"] !== null) {
      return response["resMsg"];
    }
    return null;
  }
  async _get_trip_info(token, vehicle, dateString, tripPeriodType) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload;
    if (tripPeriodType === 0) {
      payload = { tripPeriodType: 0, setTripMonth: dateString };
    } else {
      payload = { tripPeriodType: 1, setTripDay: dateString };
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response;
  }
  async update_month_trip_info(token, vehicle, yyyymmString) {
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
  async update_day_trip_info(token, vehicle, yyyymmddString) {
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
  async _get_driving_info(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";
    const respAlltime = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify({ periodTarget: 1 })
    });
    const responseAlltime = await respAlltime.json();
    checkResponseForErrorsCN(responseAlltime);
    const resp30d = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify({ periodTarget: 0 })
    });
    const response30d = await resp30d.json();
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
            drivingInfoItem["totalPwrCsp"] / drivingInfoItem["calculativeOdo"]
          );
          break;
        }
      }
      return drivingInfo;
    } else {
      throw new Error("Driving info didn't return valid data");
    }
  }
  async set_charge_limits(token, vehicle, ac, dc) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/charge/target";
    const body = {
      targetSOClist: [
        { plugType: 0, targetSOClevel: dc },
        { plugType: 1, targetSOClevel: ac }
      ]
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(token),
      body: JSON.stringify(body)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["msgId"];
  }
  _get_device_id(_stamp) {
    throw new Error("Use async _get_device_id_async() instead");
  }
  async _get_device_id_async() {
    const registrationId = "1";
    const providerDeviceId = "59af09e554a9442ab8589c9500d04d2e";
    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      providerDeviceId,
      pushRegId: registrationId,
      pushType: "GCM",
      uuid: crypto.randomUUID()
    };
    const headers = {
      "ccsp-service-id": this.CLIENT_ID,
      "ccsp-application-id": this.APP_ID,
      "Content-Type": "application/json;charset=UTF-8",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP4
    };
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    checkResponseForErrorsCN(response);
    return response["resMsg"]["deviceId"];
  }
  async _get_cookies() {
    const url = this.USER_API_URL + "oauth2/authorize?response_type=code&state=test&client_id=" + this.CLIENT_ID + "&redirect_uri=https://" + this.BASE_URL + ":443/api/v1/user/oauth2/redirect&lang=";
    const resp = await fetch(url);
    const setCookieHeader = resp.headers.get("set-cookie");
    const cookies = {};
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
  async _set_session_language(cookies) {
    const url = this.USER_API_URL;
    const headers = { "Content-type": "application/json" };
    const payload = { lang: "zh" };
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    await fetch(url, {
      method: "POST",
      headers: { ...headers, Cookie: cookieString },
      body: JSON.stringify(payload)
    });
  }
  async _get_authorization_code_with_redirect_url(username, password, cookies) {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password };
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, Cookie: cookieString },
      body: JSON.stringify(data)
    });
    const response = await resp.json();
    const redirectUrl = new URL(response["redirectUrl"]);
    const code = redirectUrl.searchParams.get("code");
    if (!code) {
      throw new Error("No authorization code in redirect URL");
    }
    return code;
  }
  async _get_access_token(authorizationCode) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP4
    };
    const data = "grant_type=authorization_code&redirect_uri=https%3A%2F%2F" + this.BASE_DOMAIN + "%3A443%2Fapi%2Fv1%2Fuser%2Foauth2%2Fredirect&code=" + authorizationCode;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data
    });
    const response = await resp.json();
    const tokenType = response["token_type"];
    const accessToken = tokenType + " " + response["access_token"];
    const refreshTokenAuth = response["refresh_token"];
    return [tokenType, accessToken, refreshTokenAuth];
  }
  async _get_refresh_token(authorizationCode) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP4
    };
    const data = "grant_type=refresh_token&redirect_uri=https%3A%2F%2Fwww.getpostman.com%2Foauth2%2Fcallback&refresh_token=" + authorizationCode;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data
    });
    const response = await resp.json();
    const tokenType = response["token_type"];
    const refreshToken = tokenType + " " + response["access_token"];
    return [tokenType, refreshToken];
  }
  async _get_control_token(token) {
    const url = this.USER_API_URL + "pin?token=";
    const headers = {
      Authorization: token.access_token ?? "",
      "Content-type": "application/json",
      Host: this.BASE_URL,
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP4
    };
    const data = { deviceId: token.device_id, pin: token.pin };
    const resp = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    });
    const response = await resp.json();
    const controlToken = "Bearer " + response["controlToken"];
    const controlTokenExpireAt = Math.floor(Date.now() / 1e3 + response["expiresTime"]);
    return [controlToken, controlTokenExpireAt];
  }
  async check_action_status(token, vehicle, actionId, synchronous = false, timeout = 0) {
    const url = this.SPA_API_URL + "notifications/" + vehicle.id + "/records";
    if (synchronous) {
      if (timeout < 1) {
        throw new APIError("Timeout must be 1 or higher");
      }
      const endTime = Date.now() + timeout * 1e3;
      while (endTime > Date.now()) {
        const state = await this.check_action_status(token, vehicle, actionId, false);
        if (state === "PENDING" /* PENDING */) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
        } else {
          return state;
        }
      }
      return "TIMEOUT" /* TIMEOUT */;
    } else {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token)
      });
      const response = await resp.json();
      checkResponseForErrorsCN(response);
      for (const action of response["resMsg"]) {
        if (action["recordId"] === actionId) {
          if (action["result"] === "success") {
            return "SUCCESS" /* SUCCESS */;
          } else if (action["result"] === "fail") {
            return "FAILED" /* FAILED */;
          } else if (action["result"] === "non-response") {
            return "TIMEOUT" /* TIMEOUT */;
          } else if (action["result"] === null) {
            return "PENDING" /* PENDING */;
          }
        }
      }
      throw new APIError(`No action found with ID ${actionId}`);
    }
  }
  _get_stamp() {
    return "";
  }
};
__name(KiaUvoApiCN, "KiaUvoApiCN");

// src/KiaUvoApiIN.ts
var USER_AGENT_OK_HTTP5 = "okhttp/3.12.0";
var KiaUvoApiIN = class extends ApiImplType1 {
  data_timezone = "Asia/Kolkata";
  temperature_range = Array.from({ length: 32 }, (_, i) => (i + 14) * 0.5);
  brand;
  BASE_DOMAIN = "";
  PORT = 8080;
  CCSP_SERVICE_ID = "";
  APP_ID = "";
  CFB = new Uint8Array();
  BASIC_AUTHORIZATION = "";
  LOGIN_FORM_HOST = "";
  PUSH_TYPE = "";
  GCM_SENDER_ID = 974204007939;
  BASE_URL = "";
  USER_API_URL = "";
  SPA_API_URL = "";
  SPA_API_URL_V2 = "";
  CLIENT_ID = "";
  constructor(brand) {
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
      this.BASIC_AUTHORIZATION = "Basic ZTViM2Y2ZDAtN2Y4My00M2M5LWFmZjMtYTI1NGRiN2FmMzY4OjVKRk9DcjZDMjRPZk96bERxWnA3RXdxcmtMMFd3MDRVYXhjRGlFNlVkM3FJNVNFNA==";
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
      this.BASIC_AUTHORIZATION = "Basic ZDBmZTQ4NTUtNzUyNy00YmUwLWFiNmUtYTQ4MTIxNmM3MDVkOlNIb1R0WHB5ZmJZbVAzWGpOQTZCcnRsRGdseXBQV2o5MjBQdEtCSlBmbGVIRVlwVQ==";
      this.LOGIN_FORM_HOST = "prd.in-ccapi.kia.connected-car.io";
      this.PUSH_TYPE = "APNS";
    }
    this.BASE_URL = this.BASE_DOMAIN + ":" + String(this.PORT);
    this.USER_API_URL = "https://" + this.BASE_URL + "/api/v1/user/";
    this.SPA_API_URL = "https://" + this.BASE_URL + "/api/v1/spa/";
    this.SPA_API_URL_V2 = "https://" + this.BASE_URL + "/api/v2/spa/";
    this.CLIENT_ID = this.CCSP_SERVICE_ID;
  }
  base64Decode(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  base64Encode(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  _get_authenticated_headers(token, ccs2_support = null) {
    return {
      Authorization: token.access_token ?? "",
      "ccsp-service-id": this.CCSP_SERVICE_ID,
      "ccsp-application-id": this.APP_ID,
      "ccsp-device-id": token.device_id ?? "",
      Host: this.BASE_URL,
      Connection: "Keep-Alive",
      "Accept-Encoding": "gzip",
      "User-Agent": USER_AGENT_OK_HTTP5
    };
  }
  async login(username, password, pin) {
    const stamp = this._get_stamp();
    const device_id = await this._get_device_id(stamp);
    const cookies = await this._get_cookies();
    let authorization_code = null;
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
    const valid_until = new Date(Date.now() + 23 * 60 * 60 * 1e3).toISOString();
    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until,
      pin
    });
  }
  async get_vehicles(token) {
    const url = this.SPA_API_URL + "vehicles";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Get Vehicles Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    const result = [];
    for (const entry of response["resMsg"]["vehicles"]) {
      let entry_engine_type = null;
      if (entry["type"] === "GN")
        entry_engine_type = "ICE" /* ICE */;
      else if (entry["type"] === "EV")
        entry_engine_type = "EV" /* EV */;
      else if (entry["type"] === "PHEV")
        entry_engine_type = "PHEV" /* PHEV */;
      else if (entry["type"] === "HV")
        entry_engine_type = "HEV" /* HEV */;
      else if (entry["type"] === "PE")
        entry_engine_type = "PHEV" /* PHEV */;
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
  _getTimeFromString(value, timesection) {
    if (value == null)
      return null;
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
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = await this._get_cached_vehicle_state(token, vehicle);
    this._update_vehicle_properties(vehicle, state);
    const maintenance_state = await this._get_maintenance_alert(token, vehicle);
    this._update_vehicle_maintenance_alert(vehicle, maintenance_state);
    const location_state = await this._get_location(token, vehicle);
    if (location_state) {
      this._update_vehicle_location(vehicle, location_state);
    }
    if (vehicle.engine_type === "EV" /* EV */) {
      const charge = await this._get_charge_limits(token, vehicle);
      this._update_vehicle_properties_charge(vehicle, charge);
    }
  }
  _update_vehicle_maintenance_alert(vehicle, state) {
    if (getChildValue(state, "odometer")) {
      vehicle.odometer = [getChildValue(state, "odometer"), DISTANCE_UNITS[1]];
    }
  }
  async _get_maintenance_alert(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/setting/alert/maintenance";
    console.error(`Getting maintenance alert from ${url}`);
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token)
    });
    const response = await resp.json();
    console.error(response);
    checkResponseForErrors(response);
    return response["resMsg"];
  }
  _update_vehicle_location(vehicle, state) {
    if (getChildValue(state, "coord.lat")) {
      vehicle.location = [
        getChildValue(state, "coord.lat"),
        getChildValue(state, "coord.lon"),
        this.get_last_updated_at(getChildValue(state, "time"))
      ];
    }
  }
  async force_refresh_vehicle_state(token, vehicle) {
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
    if (vehicle.engine_type === "EV" /* EV */ || vehicle.engine_type === "PHEV" /* PHEV */) {
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
  async _force_refresh_vehicle_state_ccs2(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Force refresh CCS2 vehicle status response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    const state = response["resMsg"];
    this._update_vehicle_properties(vehicle, state);
    const location = await this._get_location(token, vehicle);
    if (location) {
      this._update_vehicle_location(vehicle, location);
    }
  }
  _update_vehicle_properties(vehicle, state) {
    if (getChildValue(state, "time")) {
      vehicle.last_updated_at = this.get_last_updated_at(getChildValue(state, "time"));
    } else {
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    vehicle.engine_is_running = getChildValue(state, "engine");
    if (getChildValue(state, "airTemp.value")) {
      const tempIndex = getHexTempIntoIndex(getChildValue(state, "airTemp.value"));
      if (tempIndex !== null) {
        vehicle.air_temperature = [
          this.temperature_range[tempIndex],
          TEMPERATURE_UNITS[getChildValue(state, "airTemp.unit")] || TEMPERATURE_UNITS[0]
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
    vehicle.front_left_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.astSeatHeatState")] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.drvSeatHeatState")] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.rlSeatHeatState")] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[getChildValue(state, "seatHeaterVentState.rrSeatHeatState")] || null;
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
        DISTANCE_UNITS[getChildValue(state, "dte.unit")]
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
        "m"
      ];
      vehicle.ev_estimated_fast_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc1.value"),
        "m"
      ];
      vehicle.ev_estimated_portable_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc2.value"),
        "m"
      ];
      vehicle.ev_estimated_station_charge_duration = [
        getChildValue(state, "evStatus.remainTime2.etc3.value"),
        "m"
      ];
      const evDrivingRange = getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.evModeRange.value");
      if (evDrivingRange != null) {
        vehicle.ev_driving_range = [
          Math.round(parseFloat(String(evDrivingRange)) * 10) / 10,
          DISTANCE_UNITS[getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.evModeRange.unit")]
        ];
      }
      const totalRange = getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value");
      if (totalRange != null) {
        vehicle.total_driving_range = [
          Math.round(parseFloat(String(totalRange)) * 10) / 10,
          DISTANCE_UNITS[getChildValue(state, "evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit")]
        ];
      }
      vehicle.sunroof_is_open = getChildValue(state, "sunroofOpen");
      vehicle.ev_charge_port_door_is_open = Boolean(
        getChildValue(state, "chargePortDoorOpenStatus")
      );
    }
    vehicle.data = state;
  }
  _update_vehicle_drive_info(vehicle, state) {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.total_power_regenerated = getChildValue(state, "regenPwr");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }
  async _get_cached_vehicle_state(token, vehicle) {
    let url = this.SPA_API_URL + "vehicles/" + vehicle.id;
    if (vehicle.ccu_ccs2_protocol_support === 0) {
      url = url + "/status/latest";
    } else {
      url = url + "/ccs2/carstatus/latest";
    }
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - get_cached_vehicle_status response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["resMsg"];
  }
  async _get_location(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";
    console.error(`Getting location from ${url}`);
    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
      });
      const response = await resp.json();
      console.error(`${DOMAIN} - _get_location response: ${JSON.stringify(response)}`);
      checkResponseForErrors(response);
      return response["resMsg"];
    } catch {
      console.warn(`${DOMAIN} - _get_location failed`);
      return null;
    }
  }
  async lock_action(token, vehicle, action) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/door";
    const payload = { action, deviceId: token.device_id };
    console.log(`${DOMAIN} - Lock Action Request: ${JSON.stringify(payload)}`);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Lock Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }
  async _get_forced_vehicle_state(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Received forced vehicle data: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return {
      vehicleStatus: response["resMsg"]
    };
  }
  async charge_port_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";
    const payload = { action, deviceID: token.device_id };
    console.log(`${DOMAIN} - Charge Port Action Request: ${JSON.stringify(payload)}`);
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Charge Port Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async start_climate(token, vehicle, options) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/control/engine";
    if (options.set_temp == null)
      options.set_temp = 21;
    if (options.duration == null)
      options.duration = 5;
    if (options.defrost == null)
      options.defrost = false;
    if (options.climate == null)
      options.climate = true;
    if (options.heating == null)
      options.heating = 0;
    const hex_set_temp = getIndexIntoHexTemp(
      this.temperature_range.indexOf(options.set_temp)
    );
    const payload = {
      action: "start",
      hvacType: 1,
      options: {
        defrost: options.defrost,
        heating1: Number(options.heating),
        igniOnDuration: options.duration
      },
      tempCode: hex_set_temp,
      unit: "C"
    };
    console.log(`${DOMAIN} - Start Climate Action Request: ${JSON.stringify(payload)}`);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Start Climate Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }
  async stop_climate(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/engine";
    const payload = {
      action: "stop"
    };
    console.log(`${DOMAIN} - Stop Climate Action Request: ${JSON.stringify(payload)}`);
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Stop Climate Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response["msgId"];
  }
  async start_hazard_lights(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/light";
    const payload = { command: "on" };
    console.log(`${DOMAIN} - Start Hazard Lights Request: ${JSON.stringify(payload)}`);
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Start Hazard Lights Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  async start_hazard_lights_and_horn(token, vehicle) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/ccs2/control/hornlight";
    const payload = { command: "on" };
    console.log(`${DOMAIN} - Start Hazard Lights and Horn Request: ${JSON.stringify(payload)}`);
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Start Hazard Lights and Horn Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  _update_vehicle_properties_charge(vehicle, state) {
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
  async _get_charge_limits(token, vehicle) {
    const url = `${this.SPA_API_URL}vehicles/${vehicle.id}/charge/target`;
    console.log(`${DOMAIN} - Get Charging Limits Request`);
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Get Charging Limits Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    if (response["resMsg"] != null) {
      return response["resMsg"];
    }
    return {};
  }
  async _get_trip_info(token, vehicle, date_string, trip_period_type) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload;
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - get_trip_info response ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    return response;
  }
  async _get_detailed_trip_info(token, vehicle, date_string, trip) {
    if (vehicle.engine_type !== "EV" /* EV */ || BRANDS[this.brand] !== BRAND_HYUNDAI) {
      return null;
    }
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo/detail";
    const payload = {
      tripPeriodType: 1,
      setTripDay: date_string,
      setTripStartTime: trip["tripStartTime"],
      setServiceTID: trip["serviceTID"],
      tripStartTime: trip["tripStartTime"],
      tripEndTime: trip["tripEndTime"]
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
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
  async update_month_trip_info(token, vehicle, yyyymm_string) {
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
  async update_day_trip_info(token, vehicle, yyyymmdd_string) {
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
        let processedTrip = null;
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
  async _get_driving_info(token, vehicle) {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";
    const respAlltime = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ periodTarget: 1 })
    });
    const responseAlltime = await respAlltime.json();
    console.log(`${DOMAIN} - get_driving_info responseAlltime ${JSON.stringify(responseAlltime)}`);
    checkResponseForErrors(responseAlltime);
    const resp30d = await fetch(url, {
      method: "POST",
      headers: {
        ...this._get_authenticated_headers(token, vehicle.ccu_ccs2_protocol_support),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ periodTarget: 0 })
    });
    const response30d = await resp30d.json();
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
  async valet_mode_action(token, vehicle, action) {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/valet";
    const payload = { action };
    console.log(`${DOMAIN} - Valet Mode Action Request: ${JSON.stringify(payload)}`);
    const controlHeaders = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...controlHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Valet Mode Action Response: ${JSON.stringify(response)}`);
    checkResponseForErrors(response);
    token.device_id = await this._get_device_id(this._get_stamp());
    return response["msgId"];
  }
  _get_stamp() {
    const now = Math.floor(Date.now() / 1e3);
    const raw_data = `${this.APP_ID}:${now}`;
    const raw_bytes = new TextEncoder().encode(raw_data);
    const result = new Uint8Array(raw_bytes.length);
    for (let i = 0; i < raw_bytes.length; i++) {
      result[i] = this.CFB[i % this.CFB.length] ^ raw_bytes[i];
    }
    return this.base64Encode(result);
  }
  _get_device_id(stamp) {
    return (async () => {
      const my_hex = Math.floor(Math.random() * 1e16).toString(16).padStart(64, "0");
      const registration_id = my_hex.substring(0, 64);
      const url = this.SPA_API_URL + "notifications/register";
      const payload = {
        pushRegId: registration_id,
        pushType: this.PUSH_TYPE,
        uuid: this.generateUUID()
      };
      const headers = {
        "ccsp-service-id": this.CCSP_SERVICE_ID,
        "ccsp-application-id": this.APP_ID,
        Stamp: stamp,
        "Content-Type": "application/json;charset=UTF-8",
        Host: this.BASE_URL,
        Connection: "Keep-Alive",
        "Accept-Encoding": "gzip",
        "User-Agent": USER_AGENT_OK_HTTP5
      };
      console.log(`${DOMAIN} - Get Device ID request: ${url} ${JSON.stringify(headers)} ${JSON.stringify(payload)}`);
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const response = await resp.json();
      checkResponseForErrors(response);
      console.log(`${DOMAIN} - Get Device ID response: ${JSON.stringify(response)}`);
      return response["resMsg"]["deviceId"];
    })();
  }
  async _get_cookies() {
    const url = this.USER_API_URL + "oauth2/authorize?response_type=code&state=test&client_id=" + this.CLIENT_ID + "&redirect_uri=" + this.USER_API_URL + "oauth2/redirect";
    console.log(`${DOMAIN} - Get cookies request: ${url}`);
    const resp = await fetch(url);
    const setCookieHeaders = resp.headers.getSetCookie?.() || [];
    const cookies = {};
    for (const cookie of setCookieHeaders) {
      const match = cookie.match(/^([^=]+)=([^;]*)/);
      if (match) {
        cookies[match[1]] = match[2];
      }
    }
    return cookies;
  }
  async _get_authorization_code_with_redirect_url(username, password, cookies) {
    const url = this.USER_API_URL + "signin";
    const headers = { "Content-type": "application/json" };
    const data = { email: username, password };
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        Cookie: cookieString
      },
      body: JSON.stringify(data)
    });
    const response = await resp.json();
    console.log(`${DOMAIN} - Sign In Response: ${JSON.stringify(response)}`);
    const parsed_url = new URL(response["redirectUrl"]);
    const code_param = parsed_url.searchParams.get("code");
    if (!code_param)
      throw new Error("No authorization code in response");
    return code_param;
  }
  async _get_access_token(stamp, authorization_code) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP5
    };
    const data = "grant_type=authorization_code&redirect_uri=https%3A%2F%2F" + this.BASE_DOMAIN + "%3A8080%2Fapi%2Fv1%2Fuser%2Foauth2%2Fredirect&code=" + authorization_code;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data
    });
    const response = await resp.json();
    const token_type = response["token_type"];
    const access_token = token_type + " " + response["access_token"];
    const refresh_token_code = response["refresh_token"];
    return [token_type, access_token, refresh_token_code];
  }
  get_last_updated_at(value) {
    console.log(`${DOMAIN} - last_updated_at - before ${value}`);
    if (value == null) {
      return /* @__PURE__ */ new Date("2000-01-01T00:00:00Z");
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
    return /* @__PURE__ */ new Date("2000-01-01T00:00:00Z");
  }
  async _get_refresh_token(stamp, authorization_code) {
    const url = this.USER_API_URL + "oauth2/token";
    const headers = {
      Authorization: this.BASIC_AUTHORIZATION,
      Stamp: stamp,
      "Content-type": "application/x-www-form-urlencoded",
      Host: this.BASE_URL,
      Connection: "close",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": USER_AGENT_OK_HTTP5
    };
    const data = "grant_type=refresh_token&redirect_uri=https%3A%2F%2Fwww.getpostman.com%2Foauth2%2Fcallback&refresh_token=" + authorization_code;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: data
    });
    const response = await resp.json();
    const token_type = response["token_type"];
    const refresh_token = token_type + " " + response["access_token"];
    return [token_type, refresh_token];
  }
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
};
__name(KiaUvoApiIN, "KiaUvoApiIN");

// src/HyundaiBlueLinkApiBR.ts
var HyundaiBlueLinkApiBR = class extends ApiImpl {
  supports_window_control = true;
  data_timezone = "America/Sao_Paulo";
  temperature_range = Array.from({ length: 20 }, (_, i) => 62 + i);
  // 62-81°C
  base_url = "br-ccapi.hyundai.com.br";
  api_url = "https://br-ccapi.hyundai.com.br/api/v1/";
  api_v2_url = "https://br-ccapi.hyundai.com.br/api/v2/";
  ccsp_device_id = "c6e5815b-3057-4e5e-95d5-e3d5d1d2093e";
  ccsp_service_id = "03f7df9b-7626-4853-b7bd-ad1e8d722bd5";
  ccsp_application_id = "513a491a-0d7c-4d6a-ac03-a2df127d73b0";
  basic_authorization_header = "Basic MDNmN2RmOWItNzYyNi00ODUzLWI3YmQtYWQxZThkNzIyYmQ1OnlRejJiYzZDbjhPb3ZWT1I3UkRXd3hUcVZ3V0czeUtCWUZEZzBIc09Yc3l4eVBsSA==";
  api_headers;
  constructor(region, brand, language = "pt-BR") {
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
      "User-Agent": "BR_BlueLink/1.0.14 (com.hyundai.bluelink.br; build:10132; iOS 18.4.0) Alamofire/5.9.1",
      Host: this.base_url,
      offset: "-3",
      ccuCCS2ProtocolSupport: "0"
    };
  }
  _build_api_url(path) {
    return new URL(path.replace(/^\//, ""), this.api_url).toString();
  }
  _build_api_v2_url(path) {
    return new URL(path.replace(/^\//, ""), this.api_v2_url).toString();
  }
  _get_authenticated_headers(token) {
    const headers = { ...this.api_headers };
    const device_id = token.device_id || this.ccsp_device_id;
    headers["ccsp-device-id"] = device_id;
    headers["ccsp-application-id"] = this.ccsp_application_id;
    headers["Authorization"] = `Bearer ${token.access_token}`;
    return headers;
  }
  async _get_cookies() {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.ccsp_service_id,
      redirect_uri: this._build_api_url("/user/oauth2/redirect")
    });
    const url = `${this._build_api_url("/user/oauth2/authorize")}?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET"
    });
    if (!response.ok) {
      throw new APIError(`Failed to get cookies: ${response.statusText}`);
    }
    const cookies = {};
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
  async _get_authorization_code(cookies, username, password) {
    const url = this._build_api_url("/user/signin");
    const data = { email: username, password };
    const cookieHeader = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join("; ");
    const headers = {
      Referer: "https://br-ccapi.hyundai.com.br/web/v1/user/signin",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
      Connection: "keep-alive",
      "Content-Type": "text/plain;charset=UTF-8",
      Host: this.api_headers["Host"],
      "Accept-Language": "pt-BR,en-US;q=0.9,en;q=0.8",
      Origin: "https://br-ccapi.hyundai.com.br",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148_CCS_APP_iOS"
    };
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new APIError(`Failed to sign in: ${response.statusText}`);
    }
    const response_data = await response.json();
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
  async _get_auth_response(authorization_code) {
    const url = this._build_api_url("/user/oauth2/token");
    const body = new URLSearchParams({
      client_id: this.ccsp_service_id,
      grant_type: "authorization_code",
      code: authorization_code,
      redirect_uri: this._build_api_url("/user/oauth2/redirect")
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "User-Agent": this.api_headers["User-Agent"],
      Authorization: this.basic_authorization_header
    };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body.toString()
    });
    if (!response.ok) {
      throw new APIError(`Failed to get auth token: ${response.statusText}`);
    }
    return response.json();
  }
  async login(username, password, pin) {
    const cookies = await this._get_cookies();
    const authorization_code = await this._get_authorization_code(
      cookies,
      username,
      password
    );
    const auth_response = await this._get_auth_response(authorization_code);
    const expires_in_seconds = auth_response.expires_in;
    const expires_at = new Date(
      Date.now() + expires_in_seconds * 1e3
    );
    return new Token({
      access_token: auth_response.access_token,
      refresh_token: auth_response.refresh_token,
      valid_until: expires_at.toISOString(),
      username,
      password,
      device_id: this.ccsp_device_id,
      pin: pin || null
    });
  }
  async get_vehicles(token) {
    const url = this._build_api_url("/spa/vehicles");
    const headers = this._get_authenticated_headers(token);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(`Failed to get vehicles: ${response.statusText}`);
    }
    const response_data = await response.json();
    if (!response_data.resMsg || !response_data.resMsg.vehicles) {
      throw new APIError("Missing resMsg or vehicles in response");
    }
    const result = [];
    for (const entry of response_data.resMsg.vehicles) {
      const vehicle_type = entry.type;
      let entry_engine_type;
      if (vehicle_type === "GN") {
        entry_engine_type = "ICE" /* ICE */;
      } else if (vehicle_type === "EV") {
        entry_engine_type = "EV" /* EV */;
      } else if (vehicle_type === "PHEV" || vehicle_type === "PE") {
        entry_engine_type = "PHEV" /* PHEV */;
      } else if (vehicle_type === "HV") {
        entry_engine_type = "HEV" /* HEV */;
      } else {
        entry_engine_type = "ICE" /* ICE */;
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
  async _get_vehicle_state(token, vehicle, force_refresh = false) {
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
    const data = await response.json();
    return data.resMsg;
  }
  async _get_vehicle_location(token, vehicle) {
    const url = this._build_api_url(
      `/spa/vehicles/${vehicle.id}/location/park`
    );
    const headers = this._get_authenticated_headers(token);
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.resMsg;
    } catch {
      return null;
    }
  }
  _update_vehicle_properties(vehicle, state) {
    if (state.time) {
      vehicle.last_updated_at = parseDateBr(state.time, this.data_timezone);
    } else {
      vehicle.last_updated_at = /* @__PURE__ */ new Date();
    }
    vehicle.engine_is_running = state.engine || false;
    vehicle.air_control_is_on = state.airCtrlOn || false;
    if (state.battery) {
      vehicle.car_battery_percentage = state.battery.batSoc;
    }
    if (state.airTemp) {
      const temp_value = state.airTemp.value;
      const temp_unit = state.airTemp.unit;
      if (temp_value && temp_value !== "00H") {
        try {
          if (!String(temp_value).includes("H")) {
            vehicle.air_temperature = [temp_value, temp_unit];
          }
        } catch {
        }
      }
    }
    vehicle.fuel_level = state.fuelLevel;
    vehicle.fuel_level_is_low = state.lowFuelLight || false;
    if (state.dte) {
      const unit = DISTANCE_UNITS[state.dte.unit];
      vehicle.total_driving_range = [state.dte.value, unit];
    }
    const door_state = state.doorOpen || {};
    vehicle.is_locked = state.doorLock !== false;
    vehicle.front_left_door_is_open = Boolean(door_state.frontLeft);
    vehicle.front_right_door_is_open = Boolean(door_state.frontRight);
    vehicle.back_left_door_is_open = Boolean(door_state.backLeft);
    vehicle.back_right_door_is_open = Boolean(door_state.backRight);
    vehicle.hood_is_open = state.hoodOpen || false;
    vehicle.trunk_is_open = state.trunkOpen || false;
    const window_state = state.windowOpen || {};
    vehicle.front_left_window_is_open = Boolean(window_state.frontLeft);
    vehicle.front_right_window_is_open = Boolean(window_state.frontRight);
    vehicle.back_left_window_is_open = Boolean(window_state.backLeft);
    vehicle.back_right_window_is_open = Boolean(window_state.backRight);
    vehicle.defrost_is_on = state.defrost || false;
    const steer_heat = state.steerWheelHeat || 0;
    vehicle.steering_wheel_heater_is_on = steer_heat === 1;
    const side_heat = state.sideBackWindowHeat || 0;
    vehicle.back_window_heater_is_on = side_heat === 1;
    const seat_state = state.seatHeaterVentState || {};
    vehicle.front_left_seat_status = SEAT_STATUS[seat_state.drvSeatHeatState] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[seat_state.astSeatHeatState] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[seat_state.rlSeatHeatState] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[seat_state.rrSeatHeatState] || null;
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
    vehicle.washer_fluid_warning_is_on = state.washerFluidStatus || false;
    vehicle.brake_fluid_warning_is_on = state.breakOilStatus || false;
    vehicle.smart_key_battery_warning_is_on = state.smartKeyBatteryWarning || false;
    vehicle.data = state;
  }
  _update_vehicle_location(vehicle, location_data) {
    if (!location_data) {
      return;
    }
    const coord = location_data.coord || {};
    const lat = coord.lat;
    const lon = coord.lng || coord.lon;
    const time_str = location_data.time;
    if (lat && lon) {
      const location_time = time_str ? parseDateBr(time_str, this.data_timezone) : null;
      vehicle.location = [lat, lon, location_time];
    }
  }
  async update_vehicle_with_cached_state(token, vehicle) {
    const state = await this._get_vehicle_state(token, vehicle, false);
    const location_data = await this._get_vehicle_location(token, vehicle);
    this._update_vehicle_properties(vehicle, state);
    this._update_vehicle_location(vehicle, location_data);
  }
  async force_refresh_vehicle_state(token, vehicle) {
    const state = await this._get_vehicle_state(token, vehicle, true);
    const location_data = await this._get_vehicle_location(token, vehicle);
    this._update_vehicle_properties(vehicle, state);
    this._update_vehicle_location(vehicle, location_data);
  }
  async _ensure_control_token(token) {
    const control_token = token.control_token;
    const expires_at = token.control_token_expires_at;
    if (control_token && expires_at && expires_at.getTime() - 5e3 > Date.now()) {
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
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new APIError(
        `Failed to get control token: ${response.statusText}`
      );
    }
    const data = await response.json();
    if (!data.controlToken) {
      throw new APIError("Failed to obtain control token.");
    }
    const new_control_token = `Bearer ${data.controlToken}`;
    const expires_in = data.expiresTime || 0;
    const new_expires_at = new Date(
      Date.now() + (expires_in || 600) * 1e3
    );
    token.control_token = new_control_token;
    token.control_token_expires_at = new_expires_at;
    return new_control_token;
  }
  async lock_action(token, vehicle, action) {
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
    const payload = { deviceId: device_id, action };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new APIError(`Lock action failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.retCode !== "S") {
      throw new APIError(
        `Lock action failed: ${data.resCode} ${data.resMsg}`
      );
    }
    return data.msgId;
  }
  async check_action_status(token, vehicle, action_id, synchronous = false, timeout = 0) {
    if (synchronous) {
      if (timeout < 1) {
        throw new APIError(
          "Timeout must be 1 or higher for synchronous checks."
        );
      }
      const end_time = Date.now() + timeout * 1e3;
      while (Date.now() < end_time) {
        const state = await this.check_action_status(
          token,
          vehicle,
          action_id,
          false
        );
        if (state === "PENDING" /* PENDING */) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          continue;
        }
        return state;
      }
      return "TIMEOUT" /* TIMEOUT */;
    }
    const url = this._build_api_url(`/spa/notifications/${vehicle.id}/records`);
    const headers = this._get_authenticated_headers(token);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(
        `Failed to check action status: ${response.statusText}`
      );
    }
    const data = await response.json();
    const records = data.resMsg || [];
    for (const record of records) {
      if (record.recordId !== action_id) {
        continue;
      }
      const result = (record.result || "").toLowerCase();
      if (result === "success") {
        return "SUCCESS" /* SUCCESS */;
      }
      if (result === "fail") {
        return "FAILED" /* FAILED */;
      }
      if (result === "non-response") {
        return "TIMEOUT" /* TIMEOUT */;
      }
      if (result === "" || result === "pending" || result === null) {
        return "PENDING" /* PENDING */;
      }
    }
    return "UNKNOWN" /* UNKNOWN */;
  }
  async set_windows_state(token, vehicle, options) {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;
    const url = this._build_api_v2_url(`spa/vehicles/${vehicle.id}/control/window`);
    let action = "open";
    if (options.front_left === 0 /* CLOSED */ || options.front_right === 0 /* CLOSED */ || options.back_left === 0 /* CLOSED */ || options.back_right === 0 /* CLOSED */) {
      action = "close";
    }
    const headers = this._get_authenticated_headers(token);
    headers["Authorization"] = control_token;
    headers["ccsp-device-id"] = device_id;
    headers["ccuCCS2ProtocolSupport"] = String(
      vehicle.ccu_ccs2_protocol_support || 0
    );
    const payload = { action, deviceId: device_id };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new APIError(`Window action failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.retCode !== "S") {
      throw new APIError(
        `Window action failed: ${data.resCode} ${data.resMsg}`
      );
    }
    return data.msgId;
  }
  async start_hazard_lights(token, vehicle) {
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
      headers
    });
    if (!response.ok) {
      throw new APIError(`Hazard lights failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.retCode !== "S") {
      throw new APIError(
        `Hazard lights failed: ${data.resCode} ${data.resMsg}`
      );
    }
    return data.msgId;
  }
  async get_notification_history(token, vehicle) {
    const url = this._build_api_url(`/spa/notifications/${vehicle.id}/history`);
    const headers = this._get_authenticated_headers(token);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new APIError(
        `Failed to get notification history: ${response.statusText}`
      );
    }
    const data = await response.json();
    return data.resMsg || [];
  }
  async start_climate(token, vehicle, options) {
    const control_token = await this._ensure_control_token(token);
    const device_id = token.device_id || this.ccsp_device_id;
    const url = this._build_api_v2_url(
      `spa/vehicles/${vehicle.id}/control/engine`
    );
    const set_temp = options.set_temp !== null ? options.set_temp : 21;
    const duration = options.duration !== null ? options.duration : 10;
    const defrost = options.defrost !== null ? options.defrost : false;
    const climate = options.climate !== null ? options.climate : true;
    const heating = options.heating !== null ? options.heating : 0;
    const front_left_seat = options.front_left_seat !== null ? options.front_left_seat : 0;
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
        defrost,
        igniOnDuration: duration
      },
      hvacType: 1,
      deviceId: device_id,
      tempCode: temp_code,
      unit: "C"
    };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new APIError(`Start climate failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.retCode !== "S") {
      throw new APIError(
        `Start climate failed: ${data.resCode} ${data.resMsg}`
      );
    }
    return data.msgId;
  }
  async stop_climate(token, vehicle) {
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
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new APIError(`Stop climate failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.retCode !== "S") {
      throw new APIError(
        `Stop climate failed: ${data.resCode} ${data.resMsg}`
      );
    }
    return data.msgId;
  }
  async update_month_trip_info(token, vehicle, yyyymm_string) {
    const url = this._build_api_url(`/spa/vehicles/${vehicle.id}/tripinfo`);
    const data = { tripPeriodType: 0, setTripMonth: yyyymm_string };
    const headers = this._get_authenticated_headers(token);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        return;
      }
      const trip_response = await response.json();
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
    }
  }
  async update_day_trip_info(token, vehicle, yyyymmdd_string) {
    const url = this._build_api_url(`/spa/vehicles/${vehicle.id}/tripinfo`);
    const data = { tripPeriodType: 1, setTripDay: yyyymmdd_string };
    const headers = this._get_authenticated_headers(token);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        return;
      }
      const trip_response = await response.json();
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
    }
  }
  // Methods not implemented for Brazil region
  async start_charge(token, vehicle) {
    throw new Error("start_charge is not implemented for Brazil region");
  }
  async stop_charge(token, vehicle) {
    throw new Error("stop_charge is not implemented for Brazil region");
  }
  async set_charge_limits(token, vehicle, ac, dc) {
    throw new Error("set_charge_limits is not implemented for Brazil region");
  }
};
__name(HyundaiBlueLinkApiBR, "HyundaiBlueLinkApiBR");

// src/VehicleManager.ts
var REGION_ID = {
  [REGIONS[1]]: 1,
  [REGIONS[2]]: 2,
  [REGIONS[3]]: 3,
  [REGIONS[4]]: 4,
  [REGIONS[5]]: 5,
  [REGIONS[6]]: 6,
  [REGIONS[7]]: 7,
  [REGIONS[8]]: 8
};
var BRAND_ID = {
  [BRAND_KIA]: 1,
  [BRAND_HYUNDAI]: 2,
  [BRAND_GENESIS]: 3
};
function createApi(region, brand, language = "en") {
  const regionId = REGION_ID[region];
  const brandId = BRAND_ID[brand];
  if (regionId == null)
    throw new Error(`Unsupported region: ${region}`);
  if (brandId == null)
    throw new Error(`Unsupported brand: ${brand}`);
  switch (region) {
    case REGIONS[1]:
      return new KiaUvoApiEU(regionId, brandId, language);
    case REGIONS[3]:
      if (brand === BRAND_KIA)
        return new KiaUvoApiUSA(regionId, brandId, language);
      return new HyundaiBlueLinkApiUSA(regionId, brandId, language);
    case REGIONS[2]:
      return new KiaUvoApiCA(regionId, brandId, language);
    case REGIONS[5]:
    case REGIONS[7]:
      return new KiaUvoApiAU(regionId, brandId, language);
    case REGIONS[4]:
      return new KiaUvoApiCN(regionId, brandId, language);
    case REGIONS[6]:
      return new KiaUvoApiIN(brandId);
    case REGIONS[8]:
      return new HyundaiBlueLinkApiBR(regionId, brandId, language);
    default:
      throw new Error(`Unsupported region: ${region}`);
  }
}
__name(createApi, "createApi");
var VehicleManager = class {
  api;
  tokenStore;
  region;
  brand;
  username;
  password;
  pin;
  constructor(tokenStore, region, brand, username, password, pin = null) {
    this.tokenStore = tokenStore;
    this.region = region;
    this.brand = brand;
    this.username = username;
    this.password = password;
    this.pin = pin;
    this.api = createApi(region, brand);
  }
  async _get_token() {
    const cached = await this.tokenStore.get(this.username, this.region);
    if (cached && cached.valid_until && new Date(cached.valid_until) > /* @__PURE__ */ new Date()) {
      return cached;
    }
    if (cached?.refresh_token) {
      try {
        const result2 = await this.api.refresh_access_token(cached);
        if (result2 instanceof Token) {
          result2.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3);
          result2.username = this.username;
          result2.password = this.password;
          result2.pin = this.pin;
          await this.tokenStore.put(this.username, this.region, result2);
          return result2;
        }
      } catch {
      }
    }
    const result = await this.api.login(this.username, this.password, this.pin);
    if (result instanceof OTPRequest) {
      throw new Error("OTP required - use login_with_otp flow");
    }
    const token = result;
    token.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3);
    token.username = this.username;
    token.password = this.password;
    token.pin = this.pin;
    await this.tokenStore.put(this.username, this.region, token);
    return token;
  }
  async login() {
    const result = await this.api.login(this.username, this.password, this.pin);
    if (result instanceof Token) {
      result.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3);
      result.username = this.username;
      result.password = this.password;
      result.pin = this.pin;
      await this.tokenStore.put(this.username, this.region, result);
    } else {
      await this.tokenStore.putOtpState(this.username, this.region, {
        request_id: result.request_id,
        otp_key: result.otp_key,
        has_email: result.has_email,
        has_sms: result.has_sms,
        email: result.email,
        sms: result.sms
      });
    }
    return result;
  }
  async send_otp(notify_type) {
    const otpState = await this.tokenStore.getOtpState(this.username, this.region);
    if (!otpState)
      throw new Error("No OTP state found - call login first");
    const otpRequest = new OTPRequest(otpState);
    await this.api.send_otp(otpRequest, notify_type);
  }
  async verify_otp_and_complete_login(otp_code) {
    const otpState = await this.tokenStore.getOtpState(this.username, this.region);
    if (!otpState)
      throw new Error("No OTP state found - call login first");
    const otpRequest = new OTPRequest(otpState);
    const token = await this.api.verify_otp_and_complete_login(
      this.username,
      this.password,
      otp_code,
      otpRequest,
      this.pin
    );
    token.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1e3);
    token.username = this.username;
    token.password = this.password;
    token.pin = this.pin;
    await this.tokenStore.put(this.username, this.region, token);
    await this.tokenStore.deleteOtpState(this.username, this.region);
    return token;
  }
  async get_vehicles() {
    const token = await this._get_token();
    return this.api.get_vehicles(token);
  }
  async update_vehicle_with_cached_state(vehicle) {
    const token = await this._get_token();
    await this.api.update_vehicle_with_cached_state(token, vehicle);
  }
  async force_refresh_vehicle_state(vehicle) {
    const token = await this._get_token();
    await this.api.force_refresh_vehicle_state(token, vehicle);
  }
  async lock_action(vehicle, action) {
    const token = await this._get_token();
    const result = await this.api.lock_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async start_climate(vehicle, options) {
    const token = await this._get_token();
    const result = await this.api.start_climate(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async stop_climate(vehicle) {
    const token = await this._get_token();
    const result = await this.api.stop_climate(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async start_charge(vehicle) {
    const token = await this._get_token();
    const result = await this.api.start_charge(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async stop_charge(vehicle) {
    const token = await this._get_token();
    const result = await this.api.stop_charge(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async set_charge_limits(vehicle, ac, dc) {
    const token = await this._get_token();
    const result = await this.api.set_charge_limits(token, vehicle, ac, dc);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async set_charging_current(vehicle, level) {
    const token = await this._get_token();
    const result = await this.api.set_charging_current(token, vehicle, level);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async set_windows_state(vehicle, options) {
    const token = await this._get_token();
    const result = await this.api.set_windows_state(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async charge_port_action(vehicle, action) {
    const token = await this._get_token();
    const result = await this.api.charge_port_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async update_month_trip_info(vehicle, yyyymm_string) {
    const token = await this._get_token();
    await this.api.update_month_trip_info(token, vehicle, yyyymm_string);
  }
  async update_day_trip_info(vehicle, yyyymmdd_string) {
    const token = await this._get_token();
    await this.api.update_day_trip_info(token, vehicle, yyyymmdd_string);
  }
  async schedule_charging_and_climate(vehicle, options) {
    const token = await this._get_token();
    const result = await this.api.schedule_charging_and_climate(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async start_hazard_lights(vehicle) {
    const token = await this._get_token();
    const result = await this.api.start_hazard_lights(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async start_hazard_lights_and_horn(vehicle) {
    const token = await this._get_token();
    const result = await this.api.start_hazard_lights_and_horn(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async valet_mode_action(vehicle, action) {
    const token = await this._get_token();
    const result = await this.api.valet_mode_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async set_vehicle_to_load_discharge_limit(vehicle, limit) {
    const token = await this._get_token();
    const result = await this.api.set_vehicle_to_load_discharge_limit(token, vehicle, limit);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async set_navigation(vehicle, poi_list) {
    const token = await this._get_token();
    const result = await this.api.set_navigation(token, vehicle, poi_list);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async check_action_status(vehicle, action_id) {
    const token = await this._get_token();
    const result = await this.api.check_action_status(token, vehicle, action_id);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }
  async update_geocoded_location(vehicle, use_email = false, provider = 1, api_key = null) {
    const token = await this._get_token();
    await this.api.update_geocoded_location(token, vehicle, use_email, provider, api_key);
  }
};
__name(VehicleManager, "VehicleManager");

// src/KvTokenStore.ts
var KvTokenStore = class {
  kv;
  constructor(kv) {
    this.kv = kv;
  }
  key(username, region) {
    return `token:${region}:${username}`;
  }
  async get(username, region) {
    const raw = await this.kv.get(this.key(username, region));
    if (!raw)
      return null;
    try {
      const data = JSON.parse(raw);
      return Token.fromDict(data);
    } catch {
      return null;
    }
  }
  async put(username, region, token) {
    await this.kv.put(this.key(username, region), JSON.stringify(token.toDict()));
  }
  async delete(username, region) {
    await this.kv.delete(this.key(username, region));
  }
  async getOtpState(username, region) {
    const raw = await this.kv.get(`otp:${region}:${username}`);
    if (!raw)
      return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  async putOtpState(username, region, state) {
    await this.kv.put(`otp:${region}:${username}`, JSON.stringify(state), { expirationTtl: 600 });
  }
  async deleteOtpState(username, region) {
    await this.kv.delete(`otp:${region}:${username}`);
  }
};
__name(KvTokenStore, "KvTokenStore");

// src/index.ts
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
function getManager(env, params) {
  const username = params.get("username");
  const password = params.get("password");
  const pin = params.get("pin");
  const region = params.get("region");
  const brand = params.get("brand");
  if (!username || !password || !region || !brand) {
    throw new Error("Missing required parameters: username, password, region, brand");
  }
  return new VehicleManager(
    new KvTokenStore(env.TOKEN_KV),
    region,
    brand,
    username,
    password,
    pin
  );
}
__name(getManager, "getManager");
function vehicleToJson(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    model: vehicle.model,
    registration_date: vehicle.registration_date,
    year: vehicle.year,
    VIN: vehicle.VIN,
    engine_type: vehicle.engine_type,
    ccu_ccs2_protocol_support: vehicle.ccu_ccs2_protocol_support,
    total_driving_range: vehicle.total_driving_range,
    total_driving_range_unit: vehicle.total_driving_range_unit,
    odometer: vehicle.odometer,
    odometer_unit: vehicle.odometer_unit,
    car_battery_percentage: vehicle.car_battery_percentage,
    engine_is_running: vehicle.engine_is_running,
    last_updated_at: vehicle.last_updated_at?.toISOString(),
    timezone: vehicle.timezone,
    outside_temperature: vehicle.outside_temperature,
    air_temperature: vehicle.air_temperature,
    air_control_is_on: vehicle.air_control_is_on,
    defrost_is_on: vehicle.defrost_is_on,
    steering_wheel_heater_is_on: vehicle.steering_wheel_heater_is_on,
    back_window_heater_is_on: vehicle.back_window_heater_is_on,
    is_locked: vehicle.is_locked,
    front_left_door_is_open: vehicle.front_left_door_is_open,
    front_right_door_is_open: vehicle.front_right_door_is_open,
    back_left_door_is_open: vehicle.back_left_door_is_open,
    back_right_door_is_open: vehicle.back_right_door_is_open,
    trunk_is_open: vehicle.trunk_is_open,
    hood_is_open: vehicle.hood_is_open,
    front_left_window_is_open: vehicle.front_left_window_is_open,
    front_right_window_is_open: vehicle.front_right_window_is_open,
    back_left_window_is_open: vehicle.back_left_window_is_open,
    back_right_window_is_open: vehicle.back_right_window_is_open,
    ev_battery_percentage: vehicle.ev_battery_percentage,
    ev_battery_is_charging: vehicle.ev_battery_is_charging,
    ev_battery_is_plugged_in: vehicle.ev_battery_is_plugged_in,
    ev_charge_port_door_is_open: vehicle.ev_charge_port_door_is_open,
    ev_driving_range: vehicle.ev_driving_range,
    ev_driving_range_unit: vehicle.ev_driving_range_unit,
    ev_charge_limits_dc: vehicle.ev_charge_limits_dc,
    ev_charge_limits_ac: vehicle.ev_charge_limits_ac,
    fuel_level: vehicle.fuel_level,
    fuel_driving_range: vehicle.fuel_driving_range,
    location: vehicle.location,
    location_last_updated_at: vehicle.location_last_updated_at?.toISOString(),
    smart_key_battery_warning_is_on: vehicle.smart_key_battery_warning_is_on,
    washer_fluid_warning_is_on: vehicle.washer_fluid_warning_is_on,
    brake_fluid_warning_is_on: vehicle.brake_fluid_warning_is_on,
    tire_pressure_all_warning_is_on: vehicle.tire_pressure_all_warning_is_on,
    dtc_count: vehicle.dtc_count,
    data: vehicle.data
  };
}
__name(vehicleToJson, "vehicleToJson");
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  try {
    if (path === "/") {
      return jsonResponse({
        service: "hyundai-kia-connect-api",
        version: "1.0.0",
        regions: REGIONS,
        brands: BRANDS
      });
    }
    if (path === "/regions") {
      return jsonResponse({ regions: REGIONS, brands: BRANDS });
    }
    if (path === "/login" && request.method === "POST") {
      const body2 = await request.json();
      const manager2 = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body2.region,
        body2.brand,
        body2.username,
        body2.password,
        body2.pin
      );
      const result = await manager2.login();
      if (result instanceof OTPRequest) {
        return jsonResponse({
          status: "otp_required",
          request_id: result.request_id,
          has_email: result.has_email,
          has_sms: result.has_sms
        });
      }
      return jsonResponse({ status: "success", valid_until: result.valid_until.toISOString() });
    }
    if (path === "/otp/send" && request.method === "POST") {
      const body2 = await request.json();
      const manager2 = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body2.region,
        body2.brand,
        body2.username,
        body2.password,
        body2.pin
      );
      const notifyType = body2.notify_type === "SMS" ? "SMS" /* SMS */ : "EMAIL" /* EMAIL */;
      await manager2.send_otp(notifyType);
      return jsonResponse({ status: "otp_sent" });
    }
    if (path === "/otp/verify" && request.method === "POST") {
      const body2 = await request.json();
      const manager2 = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body2.region,
        body2.brand,
        body2.username,
        body2.password,
        body2.pin
      );
      const token = await manager2.verify_otp_and_complete_login(body2.otp_code);
      return jsonResponse({ status: "success", valid_until: token.valid_until.toISOString() });
    }
    const params = url.searchParams;
    let body = null;
    if (request.method === "POST" || request.method === "PUT") {
      try {
        body = await request.json();
      } catch {
      }
    }
    const manager = getManager(env, params);
    if (path === "/vehicles" && request.method === "GET") {
      const vehicles = await manager.get_vehicles();
      return jsonResponse({ vehicles: vehicles.map(vehicleToJson) });
    }
    if (path === "/vehicles/state" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      await manager.update_vehicle_with_cached_state(vehicle);
      return jsonResponse(vehicleToJson(vehicle));
    }
    if (path === "/vehicles/refresh" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      await manager.force_refresh_vehicle_state(vehicle);
      await manager.update_vehicle_with_cached_state(vehicle);
      return jsonResponse(vehicleToJson(vehicle));
    }
    if (path === "/vehicles/lock" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      const action = body?.action;
      if (!vehicleId || !action)
        return errorResponse("Missing vehicle_id or action");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const lockAction = action === "unlock" ? "open" /* UNLOCK */ : "close" /* LOCK */;
      const actionId = await manager.lock_action(vehicle, lockAction);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/climate/start" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const options = new ClimateRequestOptions();
      if (body?.set_temp != null)
        options.set_temp = body.set_temp;
      if (body?.duration != null)
        options.duration = body.duration;
      if (body?.defrost != null)
        options.defrost = body.defrost;
      if (body?.climate != null)
        options.climate = body.climate;
      if (body?.heating != null)
        options.heating = body.heating;
      if (body?.front_left_seat != null)
        options.front_left_seat = body.front_left_seat;
      if (body?.front_right_seat != null)
        options.front_right_seat = body.front_right_seat;
      if (body?.rear_left_seat != null)
        options.rear_left_seat = body.rear_left_seat;
      if (body?.rear_right_seat != null)
        options.rear_right_seat = body.rear_right_seat;
      if (body?.steering_wheel != null)
        options.steering_wheel = body.steering_wheel;
      const actionId = await manager.start_climate(vehicle, options);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/climate/stop" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const actionId = await manager.stop_climate(vehicle);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/charge/start" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const actionId = await manager.start_charge(vehicle);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/charge/stop" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const actionId = await manager.stop_charge(vehicle);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/charge/limits" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId || body?.ac == null || body?.dc == null) {
        return errorResponse("Missing vehicle_id, ac, or dc");
      }
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const actionId = await manager.set_charge_limits(vehicle, body.ac, body.dc);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/windows" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const options = new WindowRequestOptions();
      if (body?.back_left != null)
        options.back_left = body.back_left;
      if (body?.back_right != null)
        options.back_right = body.back_right;
      if (body?.front_left != null)
        options.front_left = body.front_left;
      if (body?.front_right != null)
        options.front_right = body.front_right;
      const actionId = await manager.set_windows_state(vehicle, options);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/charge-port" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      const action = body?.action;
      if (!vehicleId || !action)
        return errorResponse("Missing vehicle_id or action");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const portAction = action === "open" ? "open" /* OPEN */ : "close" /* CLOSE */;
      const actionId = await manager.charge_port_action(vehicle, portAction);
      return jsonResponse({ action_id: actionId });
    }
    if (path === "/vehicles/action-status" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      const actionId = params.get("action_id");
      if (!vehicleId || !actionId)
        return errorResponse("Missing vehicle_id or action_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      const status = await manager.check_action_status(vehicle, actionId);
      return jsonResponse({ status });
    }
    if (path === "/vehicles/geocode" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      if (!vehicleId)
        return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle)
        return errorResponse("Vehicle not found", 404);
      await manager.update_vehicle_with_cached_state(vehicle);
      await manager.update_geocoded_location(vehicle, true);
      return jsonResponse({ geocode: vehicle.geocode });
    }
    return errorResponse("Not found", 404);
  } catch (err) {
    const message = err?.message ?? String(err);
    const status = message.includes("not implemented") ? 501 : 500;
    return errorResponse(message, status);
  }
}
__name(handleRequest, "handleRequest");
var src_default = {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-m2RfQZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-m2RfQZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
