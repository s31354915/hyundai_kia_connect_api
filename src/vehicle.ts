import { DISTANCE_UNITS } from "./const.js";

export class TripInfo {
  hhmmss: string | null = null;
  drive_time: number | null = null;
  idle_time: number | null = null;
  distance: number | null = null;
  avg_speed: number | null = null;
  max_speed: number | null = null;
}

export class DayTripCounts {
  yyyymmdd: string | null = null;
  trip_count: number | null = null;
}

export class MonthTripInfo {
  yyyymm: string | null = null;
  summary: TripInfo | null = null;
  day_list: DayTripCounts[] = [];
}

export class DayTripInfo {
  yyyymmdd: string | null = null;
  summary: TripInfo | null = null;
  trip_list: TripInfo[] = [];
}

export class DailyDrivingStats {
  date: Date | null = null;
  total_consumed: number | null = null;
  engine_consumption: number | null = null;
  climate_consumption: number | null = null;
  onboard_electronics_consumption: number | null = null;
  battery_care_consumption: number | null = null;
  regenerated_energy: number | null = null;
  distance: number | null = null;
  distance_unit: string = DISTANCE_UNITS[1] ?? "km";
}

export class Vehicle {
  id: string | null = null;
  name: string | null = null;
  model: string | null = null;
  registration_date: string | null = null;
  year: number | null = null;
  VIN: string | null = null;
  key: string | null = null;
  ccu_ccs2_protocol_support: number | null = null;
  generation: number | null = null;
  enabled: boolean = true;

  // General
  private _total_driving_range: number | null = null;
  private _total_driving_range_value: number | null = null;
  private _total_driving_range_unit: string | null = null;

  private _odometer: number | null = null;
  private _odometer_value: number | null = null;
  private _odometer_unit: string | null = null;

  private _geocode_address: string | null = null;
  private _geocode_name: string | null = null;

  car_battery_percentage: number | null = null;
  engine_is_running: boolean | null = null;

  private _last_updated_at: Date | null = null;
  timezone: string | null = "UTC";

  dtc_count: number | null = null;
  dtc_descriptions: Record<string, any> | null = null;

  smart_key_battery_warning_is_on: boolean | null = null;
  washer_fluid_warning_is_on: boolean | null = null;
  brake_fluid_warning_is_on: boolean | null = null;

  private _outside_temperature: number | null = null;
  private _outside_temperature_value: number | null = null;
  private _outside_temperature_unit: string | null = null;

  // Climate
  private _air_temperature: number | null = null;
  private _air_temperature_value: number | null = null;
  private _air_temperature_unit: string | null = null;

  air_control_is_on: boolean | null = null;
  defrost_is_on: boolean | null = null;
  steering_wheel_heater_is_on: boolean | null = null;
  back_window_heater_is_on: boolean | null = null;
  side_mirror_heater_is_on: boolean | null = null;
  front_left_seat_status: string | null = null;
  front_right_seat_status: string | null = null;
  rear_left_seat_status: string | null = null;
  rear_right_seat_status: string | null = null;

  // Kia USA specific seat heater fields
  front_left_seat_heater_is_on: boolean | null = null;
  front_right_seat_heater_is_on: boolean | null = null;
  rear_left_seat_heater_is_on: boolean | null = null;
  rear_right_seat_heater_is_on: boolean | null = null;

  // Door Status
  is_locked: boolean | null = null;
  front_left_door_is_locked: boolean | null = null;
  front_right_door_is_locked: boolean | null = null;
  back_left_door_is_locked: boolean | null = null;
  back_right_door_is_locked: boolean | null = null;
  front_left_door_is_open: boolean | null = null;
  front_right_door_is_open: boolean | null = null;
  back_left_door_is_open: boolean | null = null;
  back_right_door_is_open: boolean | null = null;
  trunk_is_open: boolean | null = null;
  hood_is_open: boolean | null = null;

  // Window Status
  front_left_window_is_open: boolean | null = null;
  front_right_window_is_open: boolean | null = null;
  back_left_window_is_open: boolean | null = null;
  back_right_window_is_open: boolean | null = null;
  sunroof_is_open: boolean | null = null;
  supports_window_control: boolean | null = null;

  // Tire Pressure
  tire_pressure_all_warning_is_on: boolean | null = null;
  tire_pressure_rear_left_warning_is_on: boolean | null = null;
  tire_pressure_front_left_warning_is_on: boolean | null = null;
  tire_pressure_front_right_warning_is_on: boolean | null = null;
  tire_pressure_rear_right_warning_is_on: boolean | null = null;

  // Service Data
  private _next_service_distance: number | null = null;
  private _next_service_distance_value: number | null = null;
  private _next_service_distance_unit: string | null = null;
  private _last_service_distance: number | null = null;
  private _last_service_distance_value: number | null = null;
  private _last_service_distance_unit: string | null = null;

  // Location
  private _location_latitude: number | null = null;
  private _location_longitude: number | null = null;
  private _location_last_set_time: Date | null = null;

  // EV fields
  ev_charge_port_door_is_open: boolean | null = null;
  ev_charging_power: number | null = null;

  ev_charge_limits_dc: number | null = null;
  ev_charge_limits_ac: number | null = null;
  ev_charging_current: number | null = null;
  ev_v2l_discharge_limit: number | null = null;

  ev_v2l_status: boolean | null = null;
  ev_v2x_status: boolean | null = null;

  total_power_consumed: number | null = null;
  total_power_regenerated: number | null = null;
  power_consumption_30d: number | null = null;

  private _daily_stats: DailyDrivingStats[] | null = null;

  // Other statuses from KiaCA logs
  accessory_on: boolean | null = null;
  ign3: boolean | null = null;
  remote_ignition: boolean | null = null;
  transmission_condition: string | null = null;
  sleep_mode_check: boolean | null = null;

  // Lamp status fields
  headlamp_status: string | boolean | null = null;
  headlamp_left_low: boolean | null = null;
  headlamp_right_low: boolean | null = null;
  headlamp_left_high: boolean | null = null;
  headlamp_right_high: boolean | null = null;
  headlamp_left_bifunc: boolean | null = null;
  headlamp_right_bifunc: boolean | null = null;
  stop_lamp_left: boolean | null = null;
  stop_lamp_right: boolean | null = null;
  turn_signal_left_front: boolean | null = null;
  turn_signal_right_front: boolean | null = null;
  turn_signal_left_rear: boolean | null = null;
  turn_signal_right_rear: boolean | null = null;

  ev_battery_percentage: number | null = null;
  ev_battery_pack_voltage: number | null = null;
  ev_battery_chiller_rpm: number | null = null;
  ev_battery_heating_state: boolean | null = null;
  private _ev_battery_water_temperature: number | null = null;
  private _ev_battery_water_temperature_value: number | null = null;
  private _ev_battery_water_temperature_unit: string | null = null;

  private _ev_battery_temperature_min: number | null = null;
  private _ev_battery_temperature_min_value: number | null = null;
  private _ev_battery_temperature_min_unit: string | null = null;

  private _ev_battery_temperature_max: number | null = null;
  private _ev_battery_temperature_max_value: number | null = null;
  private _ev_battery_temperature_max_unit: string | null = null;
  ev_battery_winter_mode: boolean | null = null;
  ev_battery_soh_percentage: number | null = null;
  ev_battery_remain: number | null = null;
  ev_battery_capacity: number | null = null;
  ev_battery_is_charging: boolean | null = null;
  ev_battery_is_plugged_in: boolean | null = null;

  private _ev_driving_range: number | null = null;
  private _ev_driving_range_value: number | null = null;
  private _ev_driving_range_unit: string | null = null;

  private _ev_estimated_current_charge_duration: number | null = null;
  private _ev_estimated_current_charge_duration_value: number | null = null;
  private _ev_estimated_current_charge_duration_unit: string | null = null;

  private _ev_estimated_fast_charge_duration: number | null = null;
  private _ev_estimated_fast_charge_duration_value: number | null = null;
  private _ev_estimated_fast_charge_duration_unit: string | null = null;

  private _ev_estimated_portable_charge_duration: number | null = null;
  private _ev_estimated_portable_charge_duration_value: number | null = null;
  private _ev_estimated_portable_charge_duration_unit: string | null = null;

  ev_battery_precondition_enabled: boolean | null = null;

  private _ev_estimated_station_charge_duration: number | null = null;
  private _ev_estimated_station_charge_duration_value: number | null = null;
  private _ev_estimated_station_charge_duration_unit: string | null = null;

  private _ev_target_range_charge_AC: number | null = null;
  private _ev_target_range_charge_AC_value: number | null = null;
  private _ev_target_range_charge_AC_unit: string | null = null;

  private _ev_target_range_charge_DC: number | null = null;
  private _ev_target_range_charge_DC_value: number | null = null;
  private _ev_target_range_charge_DC_unit: string | null = null;

  ev_power_consumption_battery_cooling: number | null = null;
  ev_power_consumption_battery_heater: number | null = null;
  ev_power_consumption_air_conditioning: number | null = null;

  ev_first_departure_enabled: boolean | null = null;
  ev_second_departure_enabled: boolean | null = null;

  ev_first_departure_days: number[] | null = null;
  ev_second_departure_days: number[] | null = null;

  ev_first_departure_time: string | null = null; // stored as "HHMM" string
  ev_second_departure_time: string | null = null;

  ev_first_departure_climate_enabled: boolean | null = null;
  ev_second_departure_climate_enabled: boolean | null = null;

  private _ev_first_departure_climate_temperature: number | null = null;
  private _ev_first_departure_climate_temperature_value: number | null = null;
  private _ev_first_departure_climate_temperature_unit: string | null = null;

  private _ev_second_departure_climate_temperature: number | null = null;
  private _ev_second_departure_climate_temperature_value: number | null = null;
  private _ev_second_departure_climate_temperature_unit: string | null = null;

  ev_first_departure_climate_defrost: boolean | null = null;
  ev_second_departure_climate_defrost: boolean | null = null;

  ev_off_peak_start_time: string | null = null;
  ev_off_peak_end_time: string | null = null;
  ev_off_peak_charge_only_enabled: boolean | null = null;

  ev_schedule_charge_enabled: boolean | null = null;

  // IC fields
  private _fuel_driving_range: number | null = null;
  private _fuel_driving_range_value: number | null = null;
  private _fuel_driving_range_unit: string | null = null;
  fuel_level: number | null = null;
  fuel_level_is_low: boolean | null = null;

  engine_type: string | null = null;

  data: Record<string, any> | null = null;

  private _month_trip_info: MonthTripInfo | null = null;
  private _day_trip_info: DayTripInfo | null = null;

  // --- Computed properties (getters/setters) ---

  get daily_stats(): DailyDrivingStats[] | null {
    return this._daily_stats;
  }

  set daily_stats(value: DailyDrivingStats[] | null) {
    if (value && value.length > 0) {
      value.sort((a, b) => {
        const da = a.date?.getTime() ?? 0;
        const db = b.date?.getTime() ?? 0;
        return db - da; // descending
      });
    }
    this._daily_stats = value;
  }

  get month_trip_info(): MonthTripInfo | null {
    return this._month_trip_info;
  }

  set month_trip_info(value: MonthTripInfo | null) {
    if (value?.day_list && value.day_list.length > 0) {
      value.day_list.sort((a, b) => (a.yyyymmdd ?? "").localeCompare(b.yyyymmdd ?? ""));
    }
    this._month_trip_info = value;
  }

  get day_trip_info(): DayTripInfo | null {
    return this._day_trip_info;
  }

  set day_trip_info(value: DayTripInfo | null) {
    if (value?.trip_list && value.trip_list.length > 0) {
      value.trip_list.sort((a, b) => (b.hhmmss ?? "").localeCompare(a.hhmmss ?? ""));
    }
    this._day_trip_info = value;
  }

  get geocode(): [string | null, string | null] | null {
    return this._geocode_name ? [this._geocode_name, this._geocode_address] : null;
  }

  set geocode(value: [string, string] | null) {
    if (value) {
      this._geocode_name = value[0];
      this._geocode_address = value[1];
    } else {
      this._geocode_name = null;
      this._geocode_address = null;
    }
  }

  get total_driving_range(): number | null { return this._total_driving_range; }
  get total_driving_range_unit(): string | null { return this._total_driving_range_unit; }

  set total_driving_range(value: [number, string] | null) {
    if (value) {
      this._total_driving_range_value = value[0];
      this._total_driving_range_unit = value[1];
      this._total_driving_range = value[0];
    }
  }

  get next_service_distance(): number | null { return this._next_service_distance; }
  set next_service_distance(value: [number, string] | null) {
    if (value) {
      this._next_service_distance_value = value[0];
      this._next_service_distance_unit = value[1];
      this._next_service_distance = value[0];
    }
  }

  get last_service_distance(): number | null { return this._last_service_distance; }
  set last_service_distance(value: [number, string] | null) {
    if (value) {
      this._last_service_distance_value = value[0];
      this._last_service_distance_unit = value[1];
      this._last_service_distance = value[0];
    }
  }

  get last_updated_at(): Date | null { return this._last_updated_at; }
  set last_updated_at(value: Date | null) {
    if (!value) { this._last_updated_at = value; return; }
    const newest = value;
    const previous = this._last_updated_at;
    if (newest && previous) {
      if (newest < previous) {
        const offset = newest.getTimezoneOffset();
        // Try correction: the UTC offset may be missing
        const corrected = new Date(newest.getTime() - offset * 60000);
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

  get location_latitude(): number | null { return this._location_latitude; }
  get location_longitude(): number | null { return this._location_longitude; }
  get location(): [number | null, number | null] | null {
    return this._location_longitude != null && this._location_latitude != null
      ? [this._location_longitude, this._location_latitude]
      : null;
  }

  get location_last_updated_at(): Date | null { return this._location_last_set_time; }

  set location(value: [number, number, Date | null] | null) {
    if (value) {
      this._location_latitude = value[0];
      this._location_longitude = value[1];
      this._location_last_set_time = value[2];
    }
  }

  get odometer(): number | null { return this._odometer; }
  get odometer_unit(): string | null { return this._odometer_unit; }

  set odometer(value: [number | string, string] | null) {
    if (value) {
      const floatVal = typeof value[0] === "number" ? value[0] : parseFloat(String(value[0]));
      this._odometer_value = isNaN(floatVal) ? null : floatVal;
      this._odometer_unit = value[1];
      this._odometer = this._odometer_value;
    }
  }

  get outside_temperature(): number | null { return this._outside_temperature; }
  set outside_temperature(value: [number, string] | null) {
    if (value) {
      this._outside_temperature_value = value[0];
      this._outside_temperature_unit = value[1];
      this._outside_temperature = value[0];
    }
  }

  get air_temperature(): number | null { return this._air_temperature; }
  set air_temperature(value: [number | string, string] | null) {
    if (value) {
      this._air_temperature_value = value[0] === "OFF" ? null : (typeof value[0] === "number" ? value[0] : null);
      this._air_temperature_unit = value[1];
      this._air_temperature = value[0] === "OFF" ? null : (typeof value[0] === "number" ? value[0] : parseFloat(String(value[0]))) || null;
    }
  }

  get ev_battery_water_temperature(): number | null { return this._ev_battery_water_temperature; }
  get ev_battery_water_temperature_unit(): string | null { return this._ev_battery_water_temperature_unit; }
  set ev_battery_water_temperature(value: [number, string] | null) {
    if (value) { this._ev_battery_water_temperature_value = value[0]; this._ev_battery_water_temperature_unit = value[1]; this._ev_battery_water_temperature = value[0]; }
  }

  get ev_battery_temperature_min(): number | null { return this._ev_battery_temperature_min; }
  get ev_battery_temperature_min_unit(): string | null { return this._ev_battery_temperature_min_unit; }
  set ev_battery_temperature_min(value: [number, string] | null) {
    if (value) { this._ev_battery_temperature_min_value = value[0]; this._ev_battery_temperature_min_unit = value[1]; this._ev_battery_temperature_min = value[0]; }
  }

  get ev_battery_temperature_max(): number | null { return this._ev_battery_temperature_max; }
  get ev_battery_temperature_max_unit(): string | null { return this._ev_battery_temperature_max_unit; }
  set ev_battery_temperature_max(value: [number, string] | null) {
    if (value) { this._ev_battery_temperature_max_value = value[0]; this._ev_battery_temperature_max_unit = value[1]; this._ev_battery_temperature_max = value[0]; }
  }

  get ev_driving_range(): number | null { return this._ev_driving_range; }
  get ev_driving_range_unit(): string | null { return this._ev_driving_range_unit; }
  set ev_driving_range(value: [number, string] | null) {
    if (value) { this._ev_driving_range_value = value[0]; this._ev_driving_range_unit = value[1]; this._ev_driving_range = value[0]; }
  }

  get ev_estimated_current_charge_duration(): number | null { return this._ev_estimated_current_charge_duration; }
  set ev_estimated_current_charge_duration(value: [number, string] | null) {
    if (value) { this._ev_estimated_current_charge_duration_value = value[0]; this._ev_estimated_current_charge_duration_unit = value[1]; this._ev_estimated_current_charge_duration = value[0]; }
  }

  get ev_estimated_fast_charge_duration(): number | null { return this._ev_estimated_fast_charge_duration; }
  set ev_estimated_fast_charge_duration(value: [number, string] | null) {
    if (value) { this._ev_estimated_fast_charge_duration_value = value[0]; this._ev_estimated_fast_charge_duration_unit = value[1]; this._ev_estimated_fast_charge_duration = value[0]; }
  }

  get ev_estimated_portable_charge_duration(): number | null { return this._ev_estimated_portable_charge_duration; }
  set ev_estimated_portable_charge_duration(value: [number, string] | null) {
    if (value) { this._ev_estimated_portable_charge_duration_value = value[0]; this._ev_estimated_portable_charge_duration_unit = value[1]; this._ev_estimated_portable_charge_duration = value[0]; }
  }

  get ev_estimated_station_charge_duration(): number | null { return this._ev_estimated_station_charge_duration; }
  set ev_estimated_station_charge_duration(value: [number, string] | null) {
    if (value) { this._ev_estimated_station_charge_duration_value = value[0]; this._ev_estimated_station_charge_duration_unit = value[1]; this._ev_estimated_station_charge_duration = value[0]; }
  }

  get ev_target_range_charge_AC(): number | null { return this._ev_target_range_charge_AC; }
  get ev_target_range_charge_AC_unit(): string | null { return this._ev_target_range_charge_AC_unit; }
  set ev_target_range_charge_AC(value: [number, string] | null) {
    if (value) { this._ev_target_range_charge_AC_value = value[0]; this._ev_target_range_charge_AC_unit = value[1]; this._ev_target_range_charge_AC = value[0]; }
  }

  get ev_target_range_charge_DC(): number | null { return this._ev_target_range_charge_DC; }
  get ev_target_range_charge_DC_unit(): string | null { return this._ev_target_range_charge_DC_unit; }
  set ev_target_range_charge_DC(value: [number, string] | null) {
    if (value) { this._ev_target_range_charge_DC_value = value[0]; this._ev_target_range_charge_DC_unit = value[1]; this._ev_target_range_charge_DC = value[0]; }
  }

  get ev_first_departure_climate_temperature(): number | null { return this._ev_first_departure_climate_temperature; }
  get ev_first_departure_climate_temperature_unit(): string | null { return this._ev_first_departure_climate_temperature_unit; }
  set ev_first_departure_climate_temperature(value: [number, string] | null) {
    if (value) { this._ev_first_departure_climate_temperature_value = value[0]; this._ev_first_departure_climate_temperature_unit = value[1]; this._ev_first_departure_climate_temperature = value[0]; }
  }

  get ev_second_departure_climate_temperature(): number | null { return this._ev_second_departure_climate_temperature; }
  get ev_second_departure_climate_temperature_unit(): string | null { return this._ev_second_departure_climate_temperature_unit; }
  set ev_second_departure_climate_temperature(value: [number, string] | null) {
    if (value) { this._ev_second_departure_climate_temperature_value = value[0]; this._ev_second_departure_climate_temperature_unit = value[1]; this._ev_second_departure_climate_temperature = value[0]; }
  }

  get fuel_driving_range(): number | null { return this._fuel_driving_range; }
  set fuel_driving_range(value: [number, string] | null) {
    if (value) { this._fuel_driving_range_value = value[0]; this._fuel_driving_range_unit = value[1]; this._fuel_driving_range = value[0]; }
  }
}
