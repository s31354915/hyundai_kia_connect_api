import { Token } from "./token.js";
import { Vehicle, DailyDrivingStats } from "./vehicle.js";
import {
  ApiImpl,
  ClimateRequestOptions,
  OTPRequest,
} from "./ApiImpl.js";
import {
  BRAND_KIA,
  BRAND_HYUNDAI,
  BRAND_GENESIS,
  BRANDS,
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  ORDER_STATUS,
  OTP_NOTIFY_TYPE,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VEHICLE_LOCK_ACTION,
} from "./const.js";
import { APIError, AuthenticationError } from "./exceptions.js";
import {
  getChildValue,
  getHexTempIntoIndex,
  getIndexIntoHexTemp,
  parseDatetime,
} from "./utils.js";

// Canadian timezones
const CA_TIMEZONES = [
  "America/St_Johns",
  "America/Halifax",
  "America/Toronto",
  "America/Winnipeg",
  "America/Edmonton",
  "America/Vancouver",
];

// Helper function for retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  delay: number = 2000,
  backoff: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
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

export class KiaUvoApiCA extends ApiImpl {
  LANGUAGE: string;
  brand: number;
  BASE_URL: string;
  API_URL: string;
  API_HEADERS: Record<string, string>;

  private old_vehicle_status: Record<string, any> = {};

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

  constructor(region: number, brand: number, language: string) {
    super();
    this.LANGUAGE = language;
    this.brand = brand;

    // Set base URL based on brand
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
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
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
      "client_secret": "CLISCR01AHSPA",
    };
  }

  /**
   * Generate a deterministic device ID based on username and password hash.
   * Uses SHA-256 hash of username+password and takes first 16 chars.
   */
  private async _getDeviceId(username: string, password: string): Promise<string> {
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
  private _checkResponseForErrors(response: Record<string, any>): void {
    const errorCodeMapping: Record<string, typeof APIError> = {
      "7404": AuthenticationError,
      "7402": AuthenticationError,
      "7403": AuthenticationError,
      "7602": AuthenticationError,
    };

    if (response["responseHeader"]?.["responseCode"] === 1) {
      // Don't raise error for 7110 - it's handled in login method
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

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token | OTPRequest> {
    const url = this.API_URL + "v2/login";
    const data = { loginId: username, password };
    const headers = { ...this.API_HEADERS };
    delete headers["accessToken"];

    // Use deterministic device ID based on username/password hash
    const deviceId = await this._getDeviceId(username, password);
    headers["Deviceid"] = deviceId;

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const responseJson = (await response.json()) as Record<string, any>;

    // Check if OTP is required (error code 7110)
    if (
      responseJson["responseHeader"]?.["responseCode"] === 1 &&
      responseJson["error"]?.["errorCode"] === "7110"
    ) {
      // Call mfa/selverifmeth to get userInfoUuid and available methods
      const selverifmethUrl = this.API_URL + "mfa/selverifmeth";
      const selverifmethHeaders = { ...this.API_HEADERS };
      delete selverifmethHeaders["accessToken"];
      selverifmethHeaders["Deviceid"] = deviceId;

      const selverifmethData = {
        mfaApiCode: "0107",
        userAccount: username,
      };

      const selverifmethResponse = await fetchWithRetry(
        selverifmethUrl,
        {
          method: "POST",
          headers: selverifmethHeaders,
          body: JSON.stringify(selverifmethData),
        }
      );

      const selverifmethJson = (await selverifmethResponse.json()) as Record<string, any>;

      if (selverifmethJson["responseHeader"]?.["responseCode"] !== 0) {
        const errorDesc =
          selverifmethJson["error"]?.["errorDesc"] || "Unknown error";
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
        sms: phone,
      });
    }

    // Check for other errors
    this._checkResponseForErrors(responseJson);

    // Normal login successful
    const responseData = responseJson["result"]?.["token"];
    const tokenExpireIn = parseInt(responseData["expireIn"]) - 60;
    const accessToken = responseData["accessToken"];
    const refreshToken = responseData["refreshToken"];

    const validUntil = new Date(
      new Date().getTime() + tokenExpireIn * 1000
    );

    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || null,
    });
  }

  async send_otp(
    otp_request: OTPRequest,
    notify_type: OTP_NOTIFY_TYPE
  ): Promise<void> {
    const url = this.API_URL + "mfa/sendotp";
    const headers = { ...this.API_HEADERS };
    const deviceId = await this._getDeviceId("", "");
    headers["Deviceid"] = deviceId;

    let data: Record<string, string>;
    if (notify_type === OTP_NOTIFY_TYPE.EMAIL) {
      data = {
        otpMethod: "E",
        mfaApiCode: "0107",
        userAccount: otp_request.email || "",
        userPhone: "",
        userInfoUuid: otp_request.request_id || "",
      };
    } else if (notify_type === OTP_NOTIFY_TYPE.SMS) {
      data = {
        otpMethod: "S",
        mfaApiCode: "0107",
        userAccount: otp_request.email || "",
        userPhone: otp_request.sms || "",
        userInfoUuid: otp_request.request_id || "",
      };
    } else {
      throw new Error("Invalid notify type");
    }

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const responseJson = (await response.json()) as Record<string, any>;

    if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc =
        responseJson["error"]?.["errorDesc"] || "Unknown error";
      throw new APIError(`Failed to send OTP: ${errorDesc}`);
    }

    const otpKey = responseJson["result"]?.["otpKey"];
    otp_request.otp_key = otpKey;
  }

  async verify_otp_and_complete_login(
    username: string,
    password: string,
    otp_code: string,
    otp_request: OTPRequest,
    pin?: string | null
  ): Promise<Token> {
    const url = this.API_URL + "mfa/validateotp";
    const headers = { ...this.API_HEADERS };
    const deviceId = await this._getDeviceId(username, password);
    headers["Deviceid"] = deviceId;

    const data = {
      otpNo: otp_code,
      userAccount: username,
      otpKey: otp_request.otp_key,
      mfaApiCode: "0107",
    };

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const responseJson = (await response.json()) as Record<string, any>;

    if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc =
        responseJson["error"]?.["errorDesc"] || "Invalid OTP code";
      throw new AuthenticationError(`OTP verification failed: ${errorDesc}`);
    }

    if (!responseJson["result"]?.["verifiedOtp"]) {
      throw new AuthenticationError("OTP verification failed");
    }

    const otpValidationKey = responseJson["result"]?.["otpValidationKey"];

    // Call mfa/genmfatkn to get the access token and refresh token
    const genmfatknUrl = this.API_URL + "mfa/genmfatkn";
    const genmfatknHeaders = { ...this.API_HEADERS };
    genmfatknHeaders["Deviceid"] = deviceId;

    const genmfatknData = {
      userAccount: username,
      otpEmail: otp_request.email,
      mfaApiCode: "0107",
      otpValidationKey,
      mfaYn: "Y",
    };

    const genmfatknResponse = await fetchWithRetry(genmfatknUrl, {
      method: "POST",
      headers: genmfatknHeaders,
      body: JSON.stringify(genmfatknData),
    });

    const genmfatknJson = (await genmfatknResponse.json()) as Record<string, any>;

    if (genmfatknJson["responseHeader"]?.["responseCode"] !== 0) {
      const errorDesc =
        genmfatknJson["error"]?.["errorDesc"] || "Token generation failed";
      throw new AuthenticationError(`Failed to generate token: ${errorDesc}`);
    }

    const tokenData = genmfatknJson["result"]?.["token"];
    const tokenExpireIn = parseInt(tokenData["expireIn"]) - 60;
    const accessToken = tokenData["accessToken"];
    const refreshToken = tokenData["refreshToken"];

    const validUntil = new Date(
      new Date().getTime() + tokenExpireIn * 1000
    );

    return new Token({
      username,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
      valid_until: validUntil.toISOString(),
      pin: pin || null,
    });
  }

  test_token(token: Token): boolean {
    // Base implementation just returns true
    // Actual async validation happens in get_vehicles
    return true;
  }

  async get_vehicles(token: Token): Promise<Vehicle[]> {
    const url = this.API_URL + "vhcllst";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });
    const responseJson = (await response.json()) as Record<string, any>;

    this._checkResponseForErrors(responseJson);

    const result: Vehicle[] = [];
    const vehicles = responseJson["result"]?.["vehicles"] || [];

    for (const entry of vehicles) {
      let entryEngineType: ENGINE_TYPES | null = null;
      if (entry["fuelKindCode"] === "G") {
        entryEngineType = ENGINE_TYPES.ICE;
      } else if (entry["fuelKindCode"] === "E") {
        entryEngineType = ENGINE_TYPES.EV;
      } else if (entry["fuelKindCode"] === "P") {
        entryEngineType = ENGINE_TYPES.PHEV;
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

  async update_vehicle_with_cached_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state = await this._getCachedVehicleState(token, vehicle);
    this._updateVehiclePropertiesBase(vehicle, state);

    const service = await this._getNextService(token, vehicle);

    // Get location if the car has moved since last call
    if (vehicle.odometer) {
      if (
        vehicle.odometer <
        getChildValue(service, "currentOdometer")
      ) {
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

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      const charge = await this._getChargeLimits(token, vehicle);
      this._updateVehiclePropertiesCharge(vehicle, charge);
      await this._updateVehiclePropertiesTripDetails(token, vehicle);
    }
  }

  async force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const state = await this._getForcedVehicleState(token, vehicle);

    const lastUpdatedAt = parseDatetime(
      getChildValue(state, "status.lastStatusDate"),
      "UTC"
    );
    const refDate = new Date();
    const rawDeltaSeconds = (refDate.getTime() - lastUpdatedAt.getTime()) / 1000;

    if (Math.abs(rawDeltaSeconds) < 20 * 60) {
      // Timestamp appears to be UTC, skip timezone detection
    } else {
      // Try to detect timezone from the timestamp
      const tz = this._detectTimezoneForDate(lastUpdatedAt, refDate);
      if (tz) {
        vehicle.timezone = tz;
      }
    }

    this._updateVehiclePropertiesBase(vehicle, state);

    const service = await this._getNextService(token, vehicle);

    if (vehicle.odometer) {
      if (
        vehicle.odometer <
        getChildValue(service, "currentOdometer")
      ) {
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

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      const charge = await this._getChargeLimits(token, vehicle);
      this._updateVehiclePropertiesCharge(vehicle, charge);
      await this._updateVehiclePropertiesTripDetails(token, vehicle);
    }
  }

  /**
   * Detect Canadian timezone from a timestamp
   */
  private _detectTimezoneForDate(
    lastUpdatedAt: Date,
    refDate: Date
  ): string | null {
    // Simplified timezone detection - return first matching timezone
    // In a real implementation, this would try to match based on actual timezone rules
    return CA_TIMEZONES[0]; // Default to Newfoundland
  }

  private _updateVehiclePropertiesBase(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    vehicle.last_updated_at = parseDatetime(
      getChildValue(state, "status.lastStatusDate"),
      this.data_timezone
    );

    // Handle temperature conversion
    const airTempValue = getChildValue(state, "status.airTemp.value");
    if (
      airTempValue !== null &&
      airTempValue !== "OFF" &&
      typeof airTempValue === "string" &&
      airTempValue.endsWith("H")
    ) {
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
      DISTANCE_UNITS[
        getChildValue(
          state,
          "status.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
        )
      ] || "km"
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

    // Tire pressure warnings
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

    // Air temperature
    vehicle.air_temperature = [
      getChildValue(state, "status.airTemp.value"),
      TEMPERATURE_UNITS[0]!
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

    // Seat status
    vehicle.front_left_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.flSeatHeatState")
    ] || null;
    vehicle.front_right_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.frSeatHeatState")
    ] || null;
    vehicle.rear_left_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.rlSeatHeatState")
    ] || null;
    vehicle.rear_right_seat_status = SEAT_STATUS[
      getChildValue(state, "status.seatHeaterVentState.rrSeatHeatState")
    ] || null;

    // Additional status fields
    vehicle.accessory_on = getChildValue(state, "status.acc");
    vehicle.ign3 = getChildValue(state, "status.ign3");
    vehicle.remote_ignition = getChildValue(state, "status.remoteIgnition");
    vehicle.transmission_condition = getChildValue(
      state,
      "status.transCond"
    );
    vehicle.sleep_mode_check = getChildValue(state, "status.sleepModeCheck");

    // Lamp wire status
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

    // Stop lamps
    vehicle.stop_lamp_left = getChildValue(
      state,
      "status.lampWireStatus.stopLamp.leftLamp"
    );
    vehicle.stop_lamp_right = getChildValue(
      state,
      "status.lampWireStatus.stopLamp.rightLamp"
    );

    // Turn signals
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

    // Door and window status
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

    // EV-specific properties
    if (vehicle.engine_type !== ENGINE_TYPES.ICE) {
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
        DISTANCE_UNITS[
          getChildValue(
            state,
            "status.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
          )
        ] || "km"
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

    // Fuel properties
    const gasModeRange = getChildValue(
      state,
      "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
    );
    const gasModeUnit = DISTANCE_UNITS[
      getChildValue(
        state,
        "status.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
      )
    ] || "km";

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

  private _updateVehiclePropertiesService(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
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

  private _updateVehiclePropertiesLocation(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
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

  private async _updateVehiclePropertiesTripDetails(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const url = this.API_URL + "alerts/maintenance/evTripDetails";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    try {
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        return;
      }

      const responseJson = (await response.json()) as Record<string, any>;
      this._checkResponseForErrors(responseJson);

      if (
        responseJson["result"] &&
        responseJson["result"]["tripdetails"]
      ) {
        const tripStats: DailyDrivingStats[] = [];
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
      // Silently handle errors in trip details
    }
  }

  private async _getCachedVehicleState(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "lstvhclsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });
    const responseJson = (await response.json()) as Record<string, any>;

    this._checkResponseForErrors(responseJson);

    const status = responseJson["result"]?.["status"];
    return { status };
  }

  private async _getForcedVehicleState(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "rltmvhclsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });
    const responseJson = (await response.json()) as Record<string, any>;

    this._checkResponseForErrors(responseJson);

    const status = responseJson["result"]?.["status"];
    return { status };
  }

  private async _getNextService(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "nxtsvc";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });
    const responseJson = (await response.json()) as Record<string, any>;

    this._checkResponseForErrors(responseJson);

    return responseJson["result"]?.["maintenanceInfo"] || {};
  }

  async get_location(token: Token, vehicle: Vehicle): Promise<Record<string, any> | null> {
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
        body: JSON.stringify({ pin: token.pin }),
      });

      const responseJson = (await response.json()) as Record<string, any>;

      if (responseJson["responseHeader"]?.["responseCode"] !== 0) {
        throw new APIError("No Location Located");
      }

      return responseJson["result"] || null;
    } catch (error) {
      return null;
    }
  }

  private async _getPinToken(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "vrfypin";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin }),
    });

    const responseJson = (await response.json()) as Record<string, any>;
    return responseJson["result"]?.["pAuth"] || "";
  }

  async lock_action(
    token: Token,
    vehicle: Vehicle,
    action: VEHICLE_LOCK_ACTION
  ): Promise<string> {
    let url: string;
    if (action === VEHICLE_LOCK_ACTION.LOCK) {
      url = this.API_URL + "drlck";
    } else if (action === VEHICLE_LOCK_ACTION.UNLOCK) {
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
      body: JSON.stringify({ pin: token.pin }),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }

  async start_climate(
    token: Token,
    vehicle: Vehicle,
    options: ClimateRequestOptions
  ): Promise<string> {
    let url: string;
    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      url = this.API_URL + "evc/rfon";
    } else {
      url = this.API_URL + "rmtstrt";
    }

    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);

    // Apply defaults
    const climate = options.climate ?? true;
    const setTemp = options.set_temp ?? 21;
    const duration = options.duration ?? 5;
    const heating = options.heating ?? 0;
    const defrost = options.defrost ?? false;
    const frontLeftSeat = options.front_left_seat ?? 0;
    const frontRightSeat = options.front_right_seat ?? 0;
    const rearLeftSeat = options.rear_left_seat ?? 0;
    const rearRightSeat = options.rear_right_seat ?? 0;

    let hexSetTemp: string | null;
    if (vehicle.year && vehicle.year >= this.temperature_range_model_year) {
      const index = this.temperature_range_c_new.indexOf(setTemp);
      hexSetTemp = getIndexIntoHexTemp(index) || "10H";
    } else {
      const index = this.temperature_range_c_old.indexOf(setTemp);
      hexSetTemp = getIndexIntoHexTemp(index) || "10H";
    }

    let payload: Record<string, any>;

    if (vehicle.engine_type === ENGINE_TYPES.EV) {
      const climateSettings = {
        airCtrl: climate ? 1 : 0,
        defrost,
        heating1: heating,
        airTemp: {
          value: hexSetTemp,
          unit: 0,
          hvacTempType: 1,
        },
      };

      payload = {
        pin: token.pin,
      };

      if (BRANDS[this.brand] === BRAND_KIA) {
        if (vehicle.name === "EV9") {
          payload["remoteControl"] = climateSettings;
          payload["remoteControl"]["igniOnDuration"] = duration;
          payload["remoteControl"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat,
          };
        } else {
          payload["hvacInfo"] = climateSettings;
          payload["hvacInfo"]["igniOnDuration"] = duration;
          payload["hvacInfo"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat,
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
            rrSeatOptCmd: rearRightSeat,
          };
        } else {
          payload["hvacInfo"] = climateSettings;
          payload["hvacInfo"]["igniOnDuration"] = duration;
          payload["hvacInfo"]["seatHeaterVentCMD"] = {
            drvSeatOptCmd: frontLeftSeat,
            astSeatOptCmd: frontRightSeat,
            rlSeatOptCmd: rearLeftSeat,
            rrSeatOptCmd: rearRightSeat,
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
            rrSeatOptCmd: rearRightSeat,
          },
        },
        pin: token.pin,
      };
    }

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }

  async stop_climate(token: Token, vehicle: Vehicle): Promise<string> {
    let url: string;
    if (vehicle.engine_type === ENGINE_TYPES.EV) {
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
      body: JSON.stringify({ pin: token.pin }),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }

  async check_action_status(
    token: Token,
    vehicle: Vehicle,
    action_id: string,
    synchronous: boolean = false,
    timeout: number = 0
  ): Promise<ORDER_STATUS> {
    if (timeout < 0) {
      return ORDER_STATUS.TIMEOUT;
    }

    const startTime = new Date();

    const url = this.API_URL + "rmtsts";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["transactionId"] = action_id;
    headers["pAuth"] = await this._getPinToken(token, vehicle);

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });

    const responseJson = (await response.json()) as Record<string, any>;

    const lastActionCompleted =
      responseJson["result"]?.["transaction"]?.["apiStatusCode"] !== "null";

    if (responseJson["responseHeader"]?.["responseCode"] === 1) {
      return ORDER_STATUS.FAILED;
    } else if (
      responseJson["result"]?.["transaction"]?.["apiResult"] === "C"
    ) {
      return ORDER_STATUS.SUCCESS;
    } else if (
      responseJson["result"]?.["transaction"]?.["apiResult"] === "P"
    ) {
      if (!synchronous) {
        return ORDER_STATUS.PENDING;
      } else {
        const timeDelta = new Date().getTime() - startTime.getTime();
        const timeLeft = timeout - Math.floor(timeDelta / 1000) - 10;
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return this.check_action_status(
          token,
          vehicle,
          action_id,
          synchronous,
          timeLeft
        );
      }
    }

    return ORDER_STATUS.FAILED;
  }

  async start_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "evc/rcstrt";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin }),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }

  async stop_charge(token: Token, vehicle: Vehicle): Promise<string> {
    const url = this.API_URL + "evc/rcstp";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";
    headers["pAuth"] = await this._getPinToken(token, vehicle);

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ pin: token.pin }),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }

  private _updateVehiclePropertiesCharge(
    vehicle: Vehicle,
    state: Record<string, any>
  ): void {
    try {
      const acLevels = state
        .filter((x: Record<string, any>) => x["plugType"] === 1)
        .map((x: Record<string, any>) => x["level"]);
      if (acLevels.length > 0 && acLevels[acLevels.length - 1] <= 100) {
        vehicle.ev_charge_limits_ac = acLevels[acLevels.length - 1];
      }

      const dcLevels = state
        .filter((x: Record<string, any>) => x["plugType"] === 0)
        .map((x: Record<string, any>) => x["level"]);
      if (dcLevels.length > 0 && dcLevels[dcLevels.length - 1] <= 100) {
        vehicle.ev_charge_limits_dc = dcLevels[dcLevels.length - 1];
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  private async _getChargeLimits(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.API_URL + "evc/selsoc";
    const headers = { ...this.API_HEADERS };
    headers["accessToken"] = token.access_token || "";
    headers["vehicleId"] = vehicle.id || "";

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
    });

    const responseJson = (await response.json()) as Record<string, any>;
    this._checkResponseForErrors(responseJson);

    return responseJson["result"] || {};
  }

  async set_charge_limits(
    token: Token,
    vehicle: Vehicle,
    ac: number,
    dc: number
  ): Promise<string> {
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
          level: dc,
        },
        {
          plugType: 1,
          level: ac,
        },
      ],
      pin: token.pin,
    };

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const transactionId = response.headers.get("transactionId") || "";
    return transactionId;
  }
}
