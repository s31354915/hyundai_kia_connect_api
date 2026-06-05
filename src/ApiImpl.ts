import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import {
  WINDOW_STATE,
  CHARGE_PORT_ACTION,
  ORDER_STATUS,
  VEHICLE_LOCK_ACTION,
  VALET_MODE_ACTION,
  OTP_NOTIFY_TYPE,
  DOMAIN,
  OPENSTREETMAP,
  GOOGLE,
  GEO_LOCATION_PROVIDERS,
} from "./const.js";
import { getChildValue } from "./utils.js";

export class ClimateRequestOptions {
  set_temp: number | null = null;
  duration: number | null = null;
  defrost: boolean | null = null;
  climate: boolean | null = null;
  heating: number | null = null;
  front_left_seat: number | null = null;
  front_right_seat: number | null = null;
  rear_left_seat: number | null = null;
  rear_right_seat: number | null = null;
  steering_wheel: number | null = null;
}

export class WindowRequestOptions {
  back_left: WINDOW_STATE | null = null;
  back_right: WINDOW_STATE | null = null;
  front_left: WINDOW_STATE | null = null;
  front_right: WINDOW_STATE | null = null;
}

export class OTPRequest {
  request_id: string | null;
  otp_key: string | null;
  has_email: boolean | null;
  has_sms: boolean | null;
  email: string | null;
  sms: string | null;

  constructor(data: {
    request_id?: string | null;
    otp_key?: string | null;
    has_email?: boolean | null;
    has_sms?: boolean | null;
    email?: string | null;
    sms?: string | null;
  } = {}) {
    this.request_id = data.request_id ?? null;
    this.otp_key = data.otp_key ?? null;
    this.has_email = data.has_email ?? null;
    this.has_sms = data.has_sms ?? null;
    this.email = data.email ?? null;
    this.sms = data.sms ?? null;
  }
}

export class DepartureOptions {
  enabled: boolean | null = null;
  days: number[] | null = null;
  time: string | null = null; // "HHMM" format
}

export class ScheduleChargingClimateRequestOptions {
  first_departure: DepartureOptions | null = null;
  second_departure: DepartureOptions | null = null;
  charging_enabled: boolean | null = null;
  off_peak_start_time: string | null = null; // "HHMM" format
  off_peak_end_time: string | null = null;
  off_peak_charge_only_enabled: boolean | null = null;
  climate_enabled: boolean | null = null;
  temperature: number | null = null;
  temperature_unit: number | null = null;
  defrost: boolean | null = null;
}

export class POICoord {
  lat: number | null = null;
  lon: number | null = null;
  alt: number = 0;
  type: number = 0;
}

export class POIInfo {
  phone: string = "";
  waypoint_id: number = 1;
  lang: number = 1;
  src: string = "HERE";
  coord: POICoord | null = null;
  addr: string = "";
  zip: string = "";
  place_id: string = "";
  name: string = "";

  toDict(): Record<string, any> {
    return {
      phone: this.phone,
      waypointID: this.waypoint_id,
      lang: this.lang,
      src: this.src,
      coord: this.coord
        ? {
            lat: this.coord.lat,
            alt: this.coord.alt,
            lon: this.coord.lon,
            type: this.coord.type,
          }
        : null,
      addr: this.addr,
      zip: this.zip,
      placeid: this.place_id,
      name: this.name,
    };
  }
}

export abstract class ApiImpl {
  data_timezone: string = "UTC";
  temperature_range: number[] | null = null;
  previous_latitude: number | null = null;
  previous_longitude: number | null = null;
  supports_window_control: boolean = false;

  abstract login(
    username: string,
    password: string,
    pin?: string | null,
  ): Promise<Token | OTPRequest>;

  async send_otp(
    _otp_request: OTPRequest,
    _notify_type: OTP_NOTIFY_TYPE,
  ): Promise<void> {
    throw new Error("send_otp is not implemented for this region");
  }

  async verify_otp_and_complete_login(
    _username: string,
    _password: string,
    _otp_code: string,
    _otp_request: OTPRequest,
    _pin?: string | null,
  ): Promise<Token> {
    throw new Error("verify_otp_and_complete_login is not implemented for this region");
  }

  abstract get_vehicles(token: Token): Promise<Vehicle[]>;

  async refresh_vehicles(_token: Token, _vehicles: Vehicle[]): Promise<void> {
    return;
  }

  abstract update_vehicle_with_cached_state(
    token: Token,
    vehicle: Vehicle,
  ): Promise<void>;

  test_token(_token: Token): boolean {
    return true;
  }

  async check_action_status(
    _token: Token,
    _vehicle: Vehicle,
    _action_id: string,
    _synchronous: boolean = false,
    _timeout: number = 0,
  ): Promise<ORDER_STATUS> {
    return ORDER_STATUS.PENDING;
  }

  abstract force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle,
  ): Promise<void>;

  async update_geocoded_location(
    token: Token,
    vehicle: Vehicle,
    use_email: boolean,
    provider: number = 1,
    API_KEY: string | null = null,
  ): Promise<void> {
    if (vehicle.location_latitude && vehicle.location_longitude) {
      if (
        vehicle.geocode &&
        vehicle.location_latitude === this.previous_latitude &&
        vehicle.location_longitude === this.previous_longitude
      ) {
        return;
      } else if (GEO_LOCATION_PROVIDERS[provider] === OPENSTREETMAP) {
        let email_parameter = "";
        if (use_email) {
          email_parameter = "&email=" + token.username;
        }
        const url =
          "https://nominatim.openstreetmap.org/reverse?lat=" +
          String(vehicle.location_latitude) +
          "&lon=" +
          String(vehicle.location_longitude) +
          "&format=json&addressdetails=1&zoom=18" +
          email_parameter;
        const headers = { "user-agent": "curl/7.81.0" };
        try {
          const resp = await fetch(url, { headers });
          const data = await resp.json();
          vehicle.geocode = [
            getChildValue(data, "display_name"),
            getChildValue(data, "address"),
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
            const url =
              "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
              String(vehicle.location_latitude) +
              "," +
              String(vehicle.location_longitude) +
              "&key=" +
              API_KEY;
            const resp = await fetch(url);
            const data = (await resp.json()) as any;
            if (data.results && data.results.length > 0) {
              vehicle.geocode = [
                data.results[0].formatted_address,
                data.results[0].address_components,
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

  abstract lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION,
  ): Promise<string>;

  abstract start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions,
  ): Promise<string>;

  abstract stop_climate(token: Token, vehicle: Vehicle): Promise<string>;

  abstract start_charge(token: Token, vehicle: Vehicle): Promise<string>;

  abstract stop_charge(token: Token, vehicle: Vehicle): Promise<string>;

  abstract set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number,
  ): Promise<string>;

  async set_charging_current(
    _token: Token,
    _vehicle: Vehicle,
    _level: number,
  ): Promise<string> {
    throw new Error("set_charging_current is not implemented for this region");
  }

  async set_windows_state(
    _token: Token,
    _vehicle: Vehicle,
    _options: WindowRequestOptions,
  ): Promise<string> {
    throw new Error("set_windows_state is not implemented for this region");
  }

  async charge_port_action(
    _token: Token,
    _vehicle: Vehicle,
    _action: CHARGE_PORT_ACTION,
  ): Promise<string> {
    throw new Error("charge_port_action is not implemented for this region");
  }

  async update_month_trip_info(
    _token: Token,
    _vehicle: Vehicle,
    _yyyymm_string: string,
  ): Promise<void> {
    throw new Error("update_month_trip_info is not implemented for this region");
  }

  async update_day_trip_info(
    _token: Token,
    _vehicle: Vehicle,
    _yyyymmdd_string: string,
  ): Promise<void> {
    throw new Error("update_day_trip_info is not implemented for this region");
  }

  async schedule_charging_and_climate(
    _token: Token,
    _vehicle: Vehicle,
    _options: ScheduleChargingClimateRequestOptions,
  ): Promise<string> {
    throw new Error("schedule_charging_and_climate is not implemented for this region");
  }

  async start_hazard_lights(_token: Token, _vehicle: Vehicle): Promise<string> {
    throw new Error("start_hazard_lights is not implemented for this region");
  }

  async start_hazard_lights_and_horn(
    _token: Token,
    _vehicle: Vehicle,
  ): Promise<string> {
    throw new Error("start_hazard_lights_and_horn is not implemented for this region");
  }

  async valet_mode_action(
    _token: Token,
    _vehicle: Vehicle,
    _action: VALET_MODE_ACTION,
  ): Promise<string> {
    throw new Error("valet_mode_action is not implemented for this region");
  }

  async set_vehicle_to_load_discharge_limit(
    _token: Token,
    _vehicle: Vehicle,
    _limit: number,
  ): Promise<string> {
    throw new Error("set_vehicle_to_load_discharge_limit is not implemented for this region");
  }

  async set_navigation(
    _token: Token,
    _vehicle: Vehicle,
    _poi_list: POIInfo[],
  ): Promise<string> {
    throw new Error("set_navigation is not implemented for this region");
  }

  async refresh_access_token(token: Token): Promise<Token | OTPRequest> {
    return this.login(token.username ?? "", token.password ?? "", token.pin);
  }
}
