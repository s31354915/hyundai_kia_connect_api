import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import {
  DailyDrivingStats,
  DayTripCounts,
  DayTripInfo,
  MonthTripInfo,
  TripInfo,
} from "./vehicle.js";
import {
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  ORDER_STATUS,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
} from "./const.js";
import {
  ApiImpl,
  ClimateRequestOptions,
} from "./ApiImpl.js";
import { APIError, AuthenticationError } from "./exceptions.js";
import { getChildValue, getFloat, parseDatetime } from "./utils.js";

const LOGGER = console;

function checkResponseForErrors(response: Record<string, any>): void {
  const errorCodeMapping: Record<string, typeof APIError> = {
    "502": AuthenticationError,
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

async function safeParse(
  response: Response,
  actionName: string
): Promise<Record<string, any> | null> {
  if (response.status !== 200) {
    const text = await response.text();
    throw new APIError(
      `${actionName} failed with HTTP ${response.status}: '${text.substring(0, 200)}'`
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

export class HyundaiBlueLinkApiUSA extends ApiImpl {
  LANGUAGE: string;
  BASE_URL: string = "api.telematics.hyundaiusa.com";
  LOGIN_API: string;
  API_URL: string;
  API_HEADERS: Record<string, string>;

  constructor(region: number, brand: number, language: string) {
    super();
    this.LANGUAGE = language;
    this.LOGIN_API = "https://" + this.BASE_URL + "/v2/ac/";
    this.API_URL = "https://" + this.BASE_URL + "/ac/v2/";
    this.temperature_range = Array.from({ length: 20 }, (_, i) => 62 + i);

    const now = new Date();
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const offset = utcDate.getTime() - now.getTime();
    const utcOffsetHours = -Math.round(offset / (1000 * 60 * 60));

    const origin = "https://" + this.BASE_URL;
    const referer = origin + "/login";

    this.API_HEADERS = {
      "content-type": "application/json;charset=UTF-8",
      "accept": "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
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
      "clientSecret": "v558o935-6nne-423i-baa8",
    };

    LOGGER.debug(`${DOMAIN} - initial API headers: ${JSON.stringify(this.API_HEADERS)}`);
  }

  private getAuthenticatedHeaders(token: Token): Record<string, string> {
    const headers = { ...this.API_HEADERS };
    headers.username = token.username || "";
    headers.accessToken = token.access_token || "";
    headers.blueLinkServicePin = token.pin || "";
    return headers;
  }

  private getVehicleHeaders(
    token: Token,
    vehicle: Vehicle
  ): Record<string, string> {
    const headers = this.getAuthenticatedHeaders(token);
    headers.registrationId = vehicle.id || "";
    headers.gen = String(vehicle.generation);
    headers.vin = vehicle.VIN || "";
    return headers;
  }

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token> {
    const url = this.LOGIN_API + "oauth/token";
    const data = { username, password };

    const response = await fetch(url, {
      method: "POST",
      headers: this.API_HEADERS,
      body: JSON.stringify(data),
    });

    const jsonResponse = await safeParse(response, "login");
    if (!jsonResponse) {
      throw new APIError("Login failed: empty response");
    }

    checkResponseForErrors(jsonResponse);

    if (!jsonResponse.access_token) {
      throw new APIError(
        `Error Code: ${jsonResponse.errorCode || ""} - Login failed: ${jsonResponse.errorMessage || ""}`
      );
    }

    const accessToken = jsonResponse.access_token;
    const refreshToken = jsonResponse.refresh_token;
    const expiresIn = parseFloat(jsonResponse.expires_in);

    const validUntil = new Date(Date.now() + expiresIn * 1000);

    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || undefined,
    });
  }

  private async getVehicleDetails(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "enrollment/details/" + token.username;
    const headers = this.getAuthenticatedHeaders(token);

    const response = await fetch(url, { headers });
    const jsonResponse = await safeParse(response, "getVehicleDetails");
    if (!jsonResponse) {
      throw new APIError("Failed to get vehicle details");
    }

    LOGGER.debug(`${DOMAIN} - Get Vehicles Response ${JSON.stringify(jsonResponse)}`);
    checkResponseForErrors(jsonResponse);

    for (const entry of jsonResponse.enrolledVehicleDetails || []) {
      const details = entry.vehicleDetails;
      if (details.regid === vehicle.id) {
        return details;
      }
    }

    throw new APIError("Vehicle not found in details");
  }

  private async getVehicleStatus(
    token: Token,
    vehicle: Vehicle,
    refresh: boolean
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "rcs/rvs/vehicleStatus";
    const headers = this.getVehicleHeaders(token, vehicle);
    if (refresh) {
      headers.REFRESH = "true";
    }

    const response = await fetch(url, { headers });
    const jsonResponse = await safeParse(response, "getVehicleStatus");
    if (!jsonResponse) {
      throw new APIError("Failed to get vehicle status");
    }

    checkResponseForErrors(jsonResponse);
    LOGGER.debug(`${DOMAIN} - get_vehicle_status response ${JSON.stringify(jsonResponse)}`);

    const status = { ...jsonResponse.vehicleStatus };
    status.dateTime = status.dateTime
      .replace(/-/g, "")
      .replace("T", "")
      .replace(/:/g, "")
      .replace("Z", "");

    return status;
  }

  private async getEvTripDetails(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    if (vehicle.engine_type !== ENGINE_TYPES.EV) {
      return {};
    }

    const url = this.API_URL + "ts/alerts/maintenance/evTripDetails";
    const headers = this.getVehicleHeaders(token, vehicle);
    headers.userId = headers.username;

    const response = await fetch(url, { headers });
    const jsonResponse = await safeParse(response, "getEvTripDetails");
    if (!jsonResponse) {
      return {};
    }

    checkResponseForErrors(jsonResponse);
    LOGGER.debug(
      `${DOMAIN} - get_ev_trip_details response ${JSON.stringify(jsonResponse)}`
    );

    return jsonResponse;
  }

  private async getVehicleLocation(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.API_URL + "rcs/rfc/findMyCar";
    const headers = this.getVehicleHeaders(token, vehicle);

    try {
      const response = await fetch(url, { headers });
      const jsonResponse = await safeParse(response, "getVehicleLocation");
      if (!jsonResponse) {
        return null;
      }

      checkResponseForErrors(jsonResponse);
      LOGGER.debug(
        `${DOMAIN} - Get Vehicle Location ${JSON.stringify(jsonResponse)}`
      );

      if (jsonResponse.coord) {
        return jsonResponse;
      } else {
        if (
          jsonResponse.errorCode == 502 &&
          jsonResponse.errorSubCode === "HT_534"
        ) {
          LOGGER.warn(
            `${DOMAIN} - get vehicle location rate limit exceeded.`
          );
        } else {
          LOGGER.warn(
            `${DOMAIN} - Unable to get vehicle location: ${JSON.stringify(jsonResponse)}`
          );
        }
      }
    } catch (e) {
      LOGGER.warn(`${DOMAIN} - Get vehicle location failed: ${e}`);
    }

    LOGGER.debug(`${DOMAIN} - Get Vehicle Location result is None`);
    return null;
  }

  private updateVehicleProperties(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(state, "vehicleStatus.dateTime"),
      this.data_timezone
    );

    vehicle.total_driving_range = [
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
      ),
      DISTANCE_UNITS[
        getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
        )
      ] || "mi",
    ];

    if (getChildValue(state, "vehicleStatus.dte.value")) {
      vehicle.fuel_driving_range = [
        getChildValue(state, "vehicleStatus.dte.value"),
        DISTANCE_UNITS[getChildValue(state, "vehicleStatus.dte.unit")] ||
          "mi",
      ];
    }

    vehicle.odometer = [
      getChildValue(state, "vehicleDetails.odometer"),
      DISTANCE_UNITS[3] || "mi",
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
      vehicle.air_temperature = [airTemp, TEMPERATURE_UNITS[1] || "°F"];
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

    vehicle.front_left_seat_status = SEAT_STATUS[
      getChildValue(state, "vehicleStatus.seatHeaterVentState.flSeatHeatState")
    ] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[
      getChildValue(state, "vehicleStatus.seatHeaterVentState.frSeatHeatState")
    ] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[
      getChildValue(state, "vehicleStatus.seatHeaterVentState.rlSeatHeatState")
    ] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[
      getChildValue(state, "vehicleStatus.seatHeaterVentState.rrSeatHeatState")
    ] || null;

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
        const acLimits = ChargeDict.filter((x: any) => x.plugType === 1);
        const dcLimits = ChargeDict.filter((x: any) => x.plugType === 0);
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
      DISTANCE_UNITS[
        getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
        )
      ] || "mi",
    ];

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.atc.value"),
      "m",
    ];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc1.value"),
      "m",
    ];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc2.value"),
      "m",
    ];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc3.value"),
      "m",
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

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
      )
    ) {
      vehicle.fuel_driving_range = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
        ),
        DISTANCE_UNITS[
          getChildValue(
            state,
            "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
          )
        ] || "mi",
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
        ),
      ];
    }

    vehicle.air_control_is_on = getChildValue(state, "vehicleStatus.airCtrlOn");

    const tripStats: DailyDrivingStats[] = [];
    const tripDetails = getChildValue(state, "evTripDetails.tripdetails") || [];

    let previousOdometer: number | null = null;
    for (let i = tripDetails.length - 1; i >= 0; i--) {
      const trip = tripDetails[i];
      const odometer = getChildValue(trip, "odometer.value");
      if (previousOdometer && odometer) {
        const deltaOdometer = odometer - previousOdometer;
        if (deltaOdometer >= 0.0) {
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

    const trips: TripInfo[] = [];
    for (const trip of tripDetails) {
      const yyyymmddHhmmss = trip.startdate;
      const driveTime = parseInt(getChildValue(trip.mileagetime, "value") || "0", 10);
      const idleTime =
        parseInt(getChildValue(trip.duration, "value") || "0", 10) - driveTime;

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

  async updateMonthTripInfo(
    token: Token,
    vehicle: Vehicle,
    yyyymmString: string
  ): Promise<void> {
    LOGGER.debug(`update_month_trip_info: ${yyyymmString}`);
    vehicle.month_trip_info = null;

    if (!vehicle.data || !vehicle.data.filled_trips) {
      LOGGER.debug(
        `filled_trips is empty: ${vehicle.data}`
      );
      return;
    }

    const trips = vehicle.data.filled_trips;

    let monthTripInfo: MonthTripInfo | null = null;
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
          const summary = monthTripInfo!.summary;
          if (summary) {
            summary.drive_time = (summary.drive_time || 0) + (trip.drive_time || 0);
            summary.idle_time = (summary.idle_time || 0) + (trip.idle_time || 0);
            summary.distance = (summary.distance || 0) + (trip.distance || 0);
            summary.avg_speed = (summary.avg_speed || 0) + (trip.avg_speed || 0);
            summary.max_speed = Math.max(summary.max_speed || 0, trip.max_speed || 0);
          }
        }

        if (monthTripInfo?.summary) {
          monthTripInfo.summary.avg_speed = ((monthTripInfo.summary.avg_speed || 0) / monthTripInfoCount);
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

  async updateDayTripInfo(
    token: Token,
    vehicle: Vehicle,
    yyyymmddString: string
  ): Promise<void> {
    LOGGER.debug(`update_day_trip_info: ${yyyymmddString}`);
    vehicle.day_trip_info = null;

    if (!vehicle.data || !vehicle.data.filled_trips) {
      LOGGER.debug(`filled_trips is empty: ${vehicle.data}`);
      return;
    }

    const trips = vehicle.data.filled_trips;
    LOGGER.debug(`filled_trips: ${JSON.stringify(trips)}`);

    let dayTripInfo: DayTripInfo | null = null;
    let dayTripInfoCount = 0;

    for (const trip of trips) {
      const dateStr = trip.hhmmss;
      const yyyymmdd =
        dateStr.substring(0, 4) +
        dateStr.substring(5, 7) +
        dateStr.substring(8, 10);

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
          const summary = dayTripInfo!.summary;
          if (summary) {
            summary.drive_time = (summary.drive_time || 0) + (trip.drive_time || 0);
            summary.idle_time = (summary.idle_time || 0) + (trip.idle_time || 0);
            summary.distance = (summary.distance || 0) + (trip.distance || 0);
            summary.avg_speed = (summary.avg_speed || 0) + (trip.avg_speed || 0);
            summary.max_speed = Math.max(summary.max_speed || 0, trip.max_speed || 0);
          }
        }

        if (dayTripInfo?.summary) {
          dayTripInfo.summary.avg_speed = ((dayTripInfo.summary.avg_speed || 0) / dayTripInfoCount);
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

  async update_vehicle_with_cached_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state: Record<string, any> = {};
    state.vehicleDetails = await this.getVehicleDetails(token, vehicle);
    state.vehicleStatus = await this.getVehicleStatus(token, vehicle, false);
    state.evTripDetails = await this.getEvTripDetails(token, vehicle);

    if (state.vehicleStatus) {
      let vehicleLocationResult = null;

      if (vehicle.odometer) {
        const detailsOdometer = getFloat(
          getChildValue(state.vehicleDetails, "odometer")
        );
        if (
          detailsOdometer &&
          vehicle.odometer < detailsOdometer
        ) {
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

  async force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state: Record<string, any> = {};
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

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.API_URL + "enrollment/details/" + token.username;
    const headers = this.getAuthenticatedHeaders(token);

    const response = await fetch(url, { headers });
    const jsonResponse = await safeParse(response, "get_vehicles");
    if (!jsonResponse) {
      throw new APIError("Failed to get vehicles");
    }

    LOGGER.debug(
      `${DOMAIN} - Get Vehicles Response ${JSON.stringify(jsonResponse)}`
    );
    checkResponseForErrors(jsonResponse);

    if (!jsonResponse.enrolledVehicleDetails) {
      throw new AuthenticationError("Missing enrolledVehicleDetails in response");
    }

    const result: Vehicle[] = [];

    for (const entry of jsonResponse.enrolledVehicleDetails) {
      const entryData = entry.vehicleDetails;
      let entryEngineType: string | null = null;

      if (entryData.evStatus === "N") {
        entryEngineType = ENGINE_TYPES.ICE;
      } else if (entryData.evStatus === "E") {
        entryEngineType = ENGINE_TYPES.EV;
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

  private getTransactionId(response: Response): string | null {
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

  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    actionId: string,
    synchronous: boolean = false,
    timeout: number = 120
  ): Promise<ORDER_STATUS> {
    const url = this.API_URL + "rmt/getRunningStatus";
    const headers = this.getVehicleHeaders(token, vehicle);
    headers.tid = actionId;
    headers.login_id = token.username || "";
    headers.service_type = "REMOTE_POLL";

    const maxAttempts = synchronous ? Math.max(1, Math.floor(timeout / 2)) : 1;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(url, {
        method: "POST",
        headers,
      });

      const jsonResponse = await safeParse(response, "check_action_status");
      if (!jsonResponse) {
        if (!synchronous) {
          return ORDER_STATUS.UNKNOWN;
        }
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      const status = jsonResponse.status || "";
      if (status === "SUCCESS") {
        return ORDER_STATUS.SUCCESS;
      } else if (status === "ERROR") {
        return ORDER_STATUS.FAILED;
      }

      if (synchronous) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (synchronous) {
      return ORDER_STATUS.TIMEOUT;
    }
    return ORDER_STATUS.PENDING;
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION
  ): Promise<string> {
    LOGGER.debug(`${DOMAIN} - Action for lock is: ${action}`);

    let url: string;
    if (action === VEHICLE_LOCK_ACTION.LOCK) {
      url = this.API_URL + "rcs/rdo/off";
      LOGGER.debug(`${DOMAIN} - Calling Lock`);
    } else if (action === VEHICLE_LOCK_ACTION.UNLOCK) {
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
      body: JSON.stringify(data),
    });

    const jsonResponse = await safeParse(response, "lock_action");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Received lock_action response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Received lock_action response: ${text}`);

    return this.getTransactionId(response) || "";
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions
  ): Promise<string> {
    LOGGER.debug(`${DOMAIN} - Start engine..`);

    let url: string;
    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      url = this.API_URL + "evc/fatc/start";
    } else {
      url = this.API_URL + "rcs/rsc/start";
    }

    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(`${DOMAIN} - Start engine headers: ${JSON.stringify(headers)}`);

    if (options.climate === null) options.climate = true;
    if (options.set_temp === null) options.set_temp = 70;
    if (options.duration === null) options.duration = 5;
    if (options.heating === null) options.heating = 0;
    if (options.defrost === null) options.defrost = false;
    if (options.front_left_seat === null) options.front_left_seat = 0;
    if (options.front_right_seat === null) options.front_right_seat = 0;
    if (options.rear_left_seat === null) options.rear_left_seat = 0;
    if (options.rear_right_seat === null) options.rear_right_seat = 0;

    let data: Record<string, any>;

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      data = {
        airCtrl: options.climate ? 1 : 0,
        airTemp: { value: String(options.set_temp), unit: 1 },
        defrost: options.defrost,
        heating1: options.heating ? 1 : 0,
      };

      if (vehicle.generation === 3) {
        data.igniOnDuration = options.duration;
        data.seatHeaterVentInfo = {
          drvSeatHeatState: options.front_left_seat,
          astSeatHeatState: options.front_right_seat,
          rlSeatHeatState: options.rear_left_seat,
          rrSeatHeatState: options.rear_right_seat,
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
          rrSeatHeatState: options.rear_right_seat,
        },
        username: token.username,
        vin: vehicle.id,
      };
    }

    LOGGER.debug(`${DOMAIN} - Start engine data: ${JSON.stringify(data)}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const jsonResponse = await safeParse(response, "start_climate");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Start engine response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Start engine response: ${text}`);

    return this.getTransactionId(response) || "";
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    LOGGER.debug(`${DOMAIN} - Stop engine..`);

    let url: string;
    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      url = this.API_URL + "evc/fatc/stop";
    } else {
      url = this.API_URL + "rcs/rsc/stop";
    }

    const headers = this.getVehicleHeaders(token, vehicle);
    LOGGER.debug(`${DOMAIN} - Stop engine headers: ${JSON.stringify(headers)}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    const jsonResponse = await safeParse(response, "stop_climate");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Stop engine response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Stop engine response: ${text}`);

    return this.getTransactionId(response) || "";
  }

  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    if (vehicle.engine_type !== ENGINE_TYPES.EV) {
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
      headers,
    });

    const jsonResponse = await safeParse(response, "start_charge");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Start charge response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Start charge response: ${text}`);

    return this.getTransactionId(response) || "";
  }

  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    if (vehicle.engine_type !== ENGINE_TYPES.EV) {
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
      headers,
    });

    const jsonResponse = await safeParse(response, "stop_charge");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Stop charge response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Stop charge response: ${text}`);

    return this.getTransactionId(response) || "";
  }

  async set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number
  ): Promise<string> {
    if (vehicle.engine_type !== ENGINE_TYPES.EV) {
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
          targetSOClevel: Math.floor(dc),
        },
        {
          plugType: 1,
          targetSOClevel: Math.floor(ac),
        },
      ],
    };

    LOGGER.debug(`${DOMAIN} - Setting charge limits body: ${JSON.stringify(data)}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const jsonResponse = await safeParse(response, "set_charge_limits");
    if (jsonResponse) {
      checkResponseForErrors(jsonResponse);
    }

    LOGGER.debug(
      `${DOMAIN} - Setting charge limits response status code: ${response.status}`
    );
    const text = await response.text();
    LOGGER.debug(`${DOMAIN} - Setting charge limits: ${text}`);

    return this.getTransactionId(response) || "";
  }
}
