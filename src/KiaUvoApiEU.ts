import { ApiImplType1, checkResponseForErrors } from "./ApiImplType1.js";
import { Token } from "./token.js";
import {
  Vehicle,
  DailyDrivingStats,
  MonthTripInfo,
  DayTripInfo,
  TripInfo,
  DayTripCounts,
} from "./vehicle.js";
import {
  BRAND_GENESIS,
  BRAND_HYUNDAI,
  BRAND_KIA,
  BRANDS,
  CHARGE_PORT_ACTION,
  DISTANCE_UNITS,
  DOMAIN,
  ENGINE_TYPES,
  SEAT_STATUS,
  TEMPERATURE_UNITS,
  VALET_MODE_ACTION,
} from "./const.js";
import {
  AuthenticationError,
  ConsentRequiredError,
} from "./exceptions.js";
import {
  getChildValue,
  getHexTempIntoIndex,
  parseDatetime,
  rsaEncryptPkcs1v15,
} from "./utils.js";

const USER_AGENT_OK_HTTP = "okhttp/3.12.0";
const USER_AGENT_MOZILLA =
  "Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19";
const ACCEPT_HEADER_ALL =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9";

const SUPPORTED_LANGUAGES_LIST = [
  "en", // English
  "de", // German
  "fr", // French
  "it", // Italian
  "es", // Spanish
  "sv", // Swedish
  "nl", // Dutch
  "no", // Norwegian
  "cs", // Czech
  "sk", // Slovak
  "hu", // Hungarian
  "da", // Danish
  "pl", // Polish
  "fi", // Finnish
  "pt", // Portuguese
];

export class KiaUvoApiEU extends ApiImplType1 {
  data_timezone = "Europe/Berlin";
  temperature_range = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

  LANGUAGE: string;
  brand: number;

  BASE_DOMAIN: string = "";
  PORT: number = 0;
  CCSP_SERVICE_ID: string = "";
  CCS_SERVICE_SECRET: string = "";
  APP_ID: string = "";
  CFB: Uint8Array = new Uint8Array();
  BASIC_AUTHORIZATION: string = "";
  LOGIN_FORM_HOST: string = "";
  PUSH_TYPE: string = "";

  BASE_URL: string = "";
  USER_API_URL: string = "";
  SPA_API_URL: string = "";
  SPA_API_URL_V2: string = "";

  CLIENT_ID: string = "";
  GCM_SENDER_ID = 199360397125;

  _oauth_redirect_uri: string = "";
  _cookies: Record<string, string> = {};

  constructor(region: number, brand: number, language: string) {
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
      this.BASIC_AUTHORIZATION =
        "Basic ZmRjODVjMDAtMGEyZi00YzY0LWJjYjQtMmNmYjE1MDA3MzBhOnNlY3JldA==";
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
      this.BASIC_AUTHORIZATION =
        "Basic NmQ0NzdjMzgtM2NhNC00Y2YzLTk1NTctMmExOTI5YTk0NjU0OktVeTQ5WHhQekxwTHVvSzB4aEJDNzdXNlZYaG10UVI5aVFobUlGampvWTRJcHhzVg==";
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
      this.BASIC_AUTHORIZATION =
        "Basic MzAyMGFmYTItMzBmZi00MTJhLWFhNTEtZDI4ZmJlOTAxZTEwOkZLRGRsZWYyZmZkbGVGRXdlRUxGS0VSaUxFUjJGRUQyMXNEZHdkZ1F6NmhGRVNFMw==";
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
      this._oauth_redirect_uri =
        "https://accounts-eu.genesis.com/realms/eugenesisidm/ga-api/redirect2";
    }
  }

  async login(
    username: string,
    password: string,
    pin?: string | null
  ): Promise<Token> {
    const stamp = this._get_stamp();
    const device_id = await this._get_device_id(stamp);
    const cookies = await this._get_cookies();
    await this._set_session_language(cookies);

    const isRefreshToken = /^[A-Z0-9]{48}$/.test(password);

    let access_token: string;
    let refresh_token: string;
    let expires_in: number;

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

    const valid_until = new Date(Date.now() + expires_in * 1000);

    return new Token({
      username,
      password,
      access_token,
      refresh_token,
      device_id,
      valid_until: valid_until.toISOString(),
      pin: pin ?? null,
    });
  }

  async _login_with_password(
    username: string,
    password: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const host = this.LOGIN_FORM_HOST;
    const client_id = this.CCSP_SERVICE_ID;
    const client_secret = this.CCS_SERVICE_SECRET;
    const redirect_uri = this._oauth_redirect_uri;

    const mobile_ua = USER_AGENT_MOZILLA + "_CCS_APP_AOS";

    const auth_url =
      `${host}/auth/api/v2/user/oauth2/authorize` +
      `?response_type=code&client_id=${client_id}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri)}&lang=en&state=ccsp&country=de`;

    await fetch(auth_url, {
      headers: { "User-Agent": mobile_ua },
      redirect: "follow",
    });

    const certResp = await fetch(`${host}/auth/api/v1/accounts/certs`, {
      headers: { "User-Agent": mobile_ua },
    });

    if (certResp.status !== 200) {
      throw new AuthenticationError(
        `API error: failed to fetch RSA certs: HTTP ${certResp.status}. ` +
          "This may indicate a Hyundai API change."
      );
    }

    const certData = (await certResp.json()) as Record<string, any>;
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
        "Content-Type": "application/x-www-form-urlencoded",
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
        _csrf: "",
      }).toString(),
      redirect: "manual",
    });

    if (signinResp.status !== 302) {
      const text = await signinResp.text();
      throw new AuthenticationError(
        `Signin failed: HTTP ${signinResp.status} — ${text.substring(0, 300)}. ` +
          "Check username and password."
      );
    }

    const location = signinResp.headers.get("location") || "";
    const urlObj = new URL(location, host);
    const code = urlObj.searchParams.get("code");

    if (!code) {
      if (location.toLowerCase().includes("error")) {
        const error_description = urlObj.searchParams.get("error_description");
        throw new AuthenticationError(
          `Authentication rejected: ${error_description}. ` +
            "Check username and password."
        );
      }
      if (location.includes("/web/v1/user/authorization")) {
        throw new ConsentRequiredError(
          "Account consent is required. Please log in via a browser " +
            "once to accept the terms, then use the refresh token."
        );
      }
      if (location.includes("authorize")) {
        throw new AuthenticationError(
          "Authentication failed — returned to login page. " +
            "Check username and password."
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
        client_secret,
      }).toString(),
    });

    if (tokenResp.status !== 200) {
      const text = await tokenResp.text();
      throw new AuthenticationError(
        `API error: token exchange failed: HTTP ${tokenResp.status} — ` +
          `${text.substring(0, 200)}. This may indicate a Hyundai API change.`
      );
    }

    const tokens = (await tokenResp.json()) as Record<string, any>;
    const access_token = tokens.token_type + " " + tokens.access_token;
    const refresh_token = tokens.refresh_token;
    const expires_in = parseInt(tokens.expires_in || "86400", 10);

    return { access_token, refresh_token, expires_in };
  }

  async refresh_access_token(token: Token): Promise<Token> {
    if (token.refresh_token) {
      try {
        const stamp = this._get_stamp();
        const result = await this._get_access_token(stamp, token.refresh_token);
        const valid_until = new Date(Date.now() + result.expires_in * 1000);

        return new Token({
          username: token.username,
          password: token.password,
          access_token: result.access_token,
          refresh_token: result.refresh_token || token.refresh_token,
          device_id: token.device_id,
          valid_until: valid_until.toISOString(),
          pin: token.pin,
        });
      } catch (error) {
        console.warn(
          "Refresh token exchange failed, falling back to full login"
        );
      }
    }
    return this.login(token.username || "", token.password || "", token.pin);
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

    if (
      vehicle.engine_type === ENGINE_TYPES.EV ||
      vehicle.engine_type === ENGINE_TYPES.PHEV
    ) {
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

  async force_refresh_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const is_ccs2 = vehicle.ccu_ccs2_protocol_support !== 0;

    if (is_ccs2) {
      await this._force_refresh_vehicle_state_ccs2(token, vehicle);
    } else {
      const state = await this._get_forced_vehicle_state(token, vehicle);
      const location = await this._get_location(token, vehicle);
      state.vehicleLocation = location;
      this._update_vehicle_properties(vehicle, state);
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
      } catch (error) {
        console.error(
          "Failed to parse driving info. Possible reasons: new API format, API outage",
          error
        );
      }
    }
  }

  async _force_refresh_vehicle_state_ccs2(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/ccs2/carstatus/latest";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
    });
    const response = (await resp.json()) as Record<string, any>;

    checkResponseForErrors(response);
    const state = response.resMsg.state.Vehicle;
    this._update_vehicle_properties_ccs2(vehicle, state);
    this._set_cached_location_park(token, vehicle);
  }

  _update_vehicle_properties(vehicle: Vehicle, state: Record<string, any>): void {
    if (getChildValue(state, "vehicleStatus.time")) {
      vehicle.last_updated_at = parseDatetime(
        getChildValue(state, "vehicleStatus.time"),
        this.data_timezone
      );
    } else {
      vehicle.last_updated_at = new Date();
    }

    if (getChildValue(state, "odometer.value")) {
      vehicle.odometer = [
        getChildValue(state, "odometer.value"),
        DISTANCE_UNITS[getChildValue(state, "odometer.unit")]!,
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
          TEMPERATURE_UNITS[getChildValue(state, "vehicleStatus.airTemp.unit")]!,
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

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.batteryPower.batteryStndChrgPower"
      ) !== null
    ) {
      vehicle.ev_charging_power = getChildValue(
        state,
        "vehicleStatus.evStatus.batteryPower.batteryStndChrgPower"
      );
    }

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
      ) !== null
    ) {
      vehicle.total_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[
          getChildValue(
            state,
            "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.totalAvailableRange.unit"
          )
        ]!,
      ];
    }

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
      ) !== null
    ) {
      vehicle.ev_driving_range = [
        Math.round(
          parseFloat(
            getChildValue(
              state,
              "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.value"
            )
          ) * 10
        ) / 10,
        DISTANCE_UNITS[
          getChildValue(
            state,
            "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.evModeRange.unit"
          )
        ]!,
      ];
    }

    vehicle.ev_estimated_current_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.atc.value") || 0,
      "m",
    ] as [number, string];
    vehicle.ev_estimated_fast_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc1.value") || 0,
      "m",
    ] as [number, string];
    vehicle.ev_estimated_portable_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc2.value") || 0,
      "m",
    ] as [number, string];
    vehicle.ev_estimated_station_charge_duration = [
      getChildValue(state, "vehicleStatus.evStatus.remainTime2.etc3.value") || 0,
      "m",
    ] as [number, string];

    const target_soc_list = getChildValue(
      state,
      "vehicleStatus.evStatus.reservChargeInfos.targetSOClist"
    );
    try {
      if (Array.isArray(target_soc_list)) {
        const ac_limits = target_soc_list
          .filter((x: any) => x.plugType === 1)
          .map((x: any) => x.targetSOClevel);
        if (ac_limits.length > 0) {
          vehicle.ev_charge_limits_ac = ac_limits[ac_limits.length - 1];
        }

        const dc_limits = target_soc_list
          .filter((x: any) => x.plugType === 0)
          .map((x: any) => x.targetSOClevel);
        if (dc_limits.length > 0) {
          vehicle.ev_charge_limits_dc = dc_limits[dc_limits.length - 1];
        }
      }
    } catch {
      console.debug(`${DOMAIN} - SOC Levels couldn't be found. May not be an EV.`);
    }

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
      ) !== null
    ) {
      const unit = DISTANCE_UNITS[
        getChildValue(
          state,
          "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.unit"
        )
      ];
      if (unit) {
        vehicle.fuel_driving_range = [
          getChildValue(
            state,
            "vehicleStatus.evStatus.drvDistance.0.rangeByFuel.gasModeRange.value"
          ) || 0,
          unit,
        ];
      }
    } else if (getChildValue(state, "vehicleStatus.dte.value")) {
      const unit = DISTANCE_UNITS[getChildValue(state, "vehicleStatus.dte.unit")];
      if (unit) {
        vehicle.fuel_driving_range = [
          getChildValue(state, "vehicleStatus.dte.value") || 0,
          unit,
        ];
      }
    }

    const unitAC = DISTANCE_UNITS[
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.unit"
      )
    ];
    if (unitAC) {
      vehicle.ev_target_range_charge_AC = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.1.dte.rangeByFuel.totalAvailableRange.value"
        ) || 0,
        unitAC,
      ];
    }

    const unitDC = DISTANCE_UNITS[
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.unit"
      )
    ];
    if (unitDC) {
      vehicle.ev_target_range_charge_DC = [
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.targetSOClist.0.dte.rangeByFuel.totalAvailableRange.value"
        ) || 0,
        unitDC,
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

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.value"
      )
    ) {
      const temp_index = getHexTempIntoIndex(
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.value"
        )
      );

      if (temp_index !== null && temp_index >= 0 && temp_index < this.temperature_range.length) {
        vehicle.ev_first_departure_climate_temperature = [
          this.temperature_range[temp_index],
          TEMPERATURE_UNITS[
            getChildValue(
              state,
              "vehicleStatus.evStatus.reservChargeInfos.reservChargeInfo.reservChargeInfoDetail.reservFatcSet.airTemp.unit"
            )
          ]!,
        ];
      }
    }

    if (
      getChildValue(
        state,
        "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.value"
      )
    ) {
      const temp_index = getHexTempIntoIndex(
        getChildValue(
          state,
          "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.value"
        )
      );

      if (temp_index !== null && temp_index >= 0 && temp_index < this.temperature_range.length) {
        vehicle.ev_second_departure_climate_temperature = [
          this.temperature_range[temp_index],
          TEMPERATURE_UNITS[
            getChildValue(
              state,
              "vehicleStatus.evStatus.reservChargeInfos.reserveChargeInfo2.reservChargeInfoDetail.reservFatcSet.airTemp.unit"
            )
          ]!,
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
        ),
      ] as [number, number, Date];
    }

    vehicle.data = state;
  }

  _update_vehicle_drive_info(vehicle: Vehicle, state: Record<string, any>): void {
    vehicle.total_power_consumed = getChildValue(state, "totalPwrCsp");
    vehicle.total_power_regenerated = getChildValue(state, "regenPwr");
    vehicle.power_consumption_30d = getChildValue(state, "consumption30d");
    vehicle.daily_stats = getChildValue(state, "dailyStats");
  }

  async _set_cached_location_park(
    token: Token,
    vehicle: Vehicle
  ): Promise<void> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location/park";

    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(token),
      });
      const response = (await resp.json()) as Record<string, any>;

      checkResponseForErrors(response);

      const location = response.resMsg;
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
    } catch (error) {
      console.debug(`${DOMAIN} - _get_location failed`);
    }
  }

  async _get_location(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/location";

    try {
      const resp = await fetch(url, {
        headers: this._get_authenticated_headers(
          token,
          vehicle.ccu_ccs2_protocol_support
        ),
      });
      const response = (await resp.json()) as Record<string, any>;

      checkResponseForErrors(response);

      const gps_detail = response.resMsg?.gpsDetail;
      if (gps_detail === undefined) {
        console.warn(
          `${DOMAIN} - gpsDetail not found in location response, ` +
            "vehicle may be offline or returning partial status"
        );
      }
      return gps_detail || null;
    } catch (error) {
      console.error(`${DOMAIN} - _get_location failed:`, error);
      return null;
    }
  }

  async _get_forced_vehicle_state(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/status";
    const resp = await fetch(url, {
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
    });
    const response = (await resp.json()) as Record<string, any>;

    checkResponseForErrors(response);

    const mapped_response: Record<string, any> = {};
    mapped_response.vehicleStatus = response.resMsg;
    return mapped_response;
  }

  async charge_port_action(
    token: Token,
    vehicle: Vehicle,
    action: CHARGE_PORT_ACTION
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/portdoor";

    const payload = { action: action };
    console.debug(`${DOMAIN} - Charge Port Action Request:`, payload);

    const headers = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(`${DOMAIN} - Charge Port Action Response:`, response);
    checkResponseForErrors(response);

    token.device_id = await this._get_device_id(this._get_stamp());
    return response.msgId;
  }

  async _get_trip_info(
    token: Token,
    vehicle: Vehicle,
    date_string: string,
    trip_period_type: number
  ): Promise<Record<string, any>> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/tripinfo";
    let payload: Record<string, any>;

    if (trip_period_type === 0) {
      // month
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
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(`${DOMAIN} - get_trip_info response`, response);
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
    const msg = json_result.resMsg;

    if (msg.monthTripDayCnt > 0) {
      const result: MonthTripInfo = {
        yyyymm: yyyymm_string,
        day_list: [],
        summary: {
          drive_time: msg.tripDrvTime,
          idle_time: msg.tripIdleTime,
          distance: msg.tripDist,
          avg_speed: msg.tripAvgSpeed,
          max_speed: msg.tripMaxSpeed,
        } as TripInfo,
      };

      for (const day of msg.tripDayList) {
        const processed_day: DayTripCounts = {
          yyyymmdd: day.tripDayInMonth,
          trip_count: day.tripCntDay,
        };
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
    const day_trip_list = json_result.resMsg.dayTripList;

    if (day_trip_list && day_trip_list.length > 0) {
      const msg = day_trip_list[0];
      const result: DayTripInfo = {
        yyyymmdd: yyyymmdd_string,
        trip_list: [],
        summary: {
          drive_time: msg.tripDrvTime,
          idle_time: msg.tripIdleTime,
          distance: msg.tripDist,
          avg_speed: msg.tripAvgSpeed,
          max_speed: msg.tripMaxSpeed,
        } as TripInfo,
      };

      for (const trip of msg.tripList) {
        const processed_trip: TripInfo = {
          hhmmss: trip.tripTime,
          drive_time: trip.tripDrvTime,
          idle_time: trip.tripIdleTime,
          distance: trip.tripDist,
          avg_speed: trip.tripAvgSpeed,
          max_speed: trip.tripMaxSpeed,
        };
        result.trip_list.push(processed_trip);
      }

      vehicle.day_trip_info = result;
    }
  }

  async _get_driving_info(
    token: Token,
    vehicle: Vehicle
  ): Promise<Record<string, any> | null> {
    const url = this.SPA_API_URL + "vehicles/" + vehicle.id + "/drvhistory";

    const respAlltime = await fetch(url, {
      method: "POST",
      headers: this._get_authenticated_headers(
        token,
        vehicle.ccu_ccs2_protocol_support
      ),
      body: JSON.stringify({ periodTarget: 1 }),
    });
    const responseAlltime = (await respAlltime.json()) as Record<string, any>;
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
      body: JSON.stringify({ periodTarget: 0 }),
    });
    const response30d = (await resp30d.json()) as Record<string, any>;
    console.debug(`${DOMAIN} - get_driving_info response30d`, response30d);
    checkResponseForErrors(response30d);

    if (getChildValue(responseAlltime, "resMsg.drivingInfo.0")) {
      const drivingInfo = responseAlltime.resMsg.drivingInfo[0];

      drivingInfo.dailyStats = [];
      if (getChildValue(response30d, "resMsg.drivingInfoDetail.0")) {
        for (const day of response30d.resMsg.drivingInfoDetail) {
          const processedDay: DailyDrivingStats = {
            date: new Date(
              day.drivingDate.substring(0, 4) +
                "-" +
                day.drivingDate.substring(4, 6) +
                "-" +
                day.drivingDate.substring(6, 8)
            ),
            total_consumed: getChildValue(day, "totalPwrCsp"),
            engine_consumption: getChildValue(day, "motorPwrCsp"),
            climate_consumption: getChildValue(day, "climatePwrCsp"),
            onboard_electronics_consumption: getChildValue(day, "eDPwrCsp"),
            battery_care_consumption: getChildValue(day, "batteryMgPwrCsp"),
            regenerated_energy: getChildValue(day, "regenPwr"),
            distance: getChildValue(day, "calculativeOdo"),
            distance_unit: vehicle.odometer_unit || "km",
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

  async valet_mode_action(
    token: Token,
    vehicle: Vehicle,
    action: VALET_MODE_ACTION
  ): Promise<string> {
    const url = this.SPA_API_URL_V2 + "vehicles/" + vehicle.id + "/control/valet";

    const payload = { action: action };
    console.debug(`${DOMAIN} - Valet Mode Action Request:`, payload);

    const headers = await this._get_control_headers(token, vehicle);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    console.debug(`${DOMAIN} - Valet Mode Action Response:`, response);
    checkResponseForErrors(response);

    token.device_id = await this._get_device_id(this._get_stamp());
    return response.msgId;
  }

  _get_stamp(): string {
    const timestamp = Math.floor(Date.now() / 1000);
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
  async _get_device_id(stamp: string): Promise<string> {
    const my_hex = Math.floor(Math.random() * Math.pow(10, 80))
      .toString(16)
      .padStart(64, "0");
    const registration_id = my_hex.substring(0, 64);

    const url = this.SPA_API_URL + "notifications/register";
    const payload = {
      pushRegId: registration_id,
      pushType: this.PUSH_TYPE,
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

    console.debug(`${DOMAIN} - Get Device ID request:`, url, headers, payload);

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const response = (await resp.json()) as Record<string, any>;

    checkResponseForErrors(response);
    console.debug(`${DOMAIN} - Get Device ID response:`, response);

    const device_id = response.resMsg.deviceId;
    return device_id;
  }

  async _get_cookies(): Promise<Record<string, string>> {
    const url =
      this.USER_API_URL +
      "oauth2/authorize?response_type=code&state=test&client_id=" +
      this.CLIENT_ID +
      "&redirect_uri=" +
      encodeURIComponent(this.USER_API_URL + "oauth2/redirect") +
      "&lang=" +
      this.LANGUAGE;

    console.debug(`${DOMAIN} - Get cookies request:`, url);

    const resp = await fetch(url);
    const setCookieHeaders = (resp.headers as any).getSetCookie?.() || [];

    const cookies: Record<string, string> = {};
    for (const setCookie of setCookieHeaders) {
      const match = setCookie.match(/^([^=]+)=([^;]*)/);
      if (match) {
        cookies[match[1]] = match[2];
      }
    }

    this._cookies = cookies;
    return cookies;
  }

  async _get_access_token(
    stamp: string,
    authorization_code: string
  ): Promise<{
    token_type: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const brandName = BRANDS[this.brand];

    if (brandName === BRAND_GENESIS) {
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
        encodeURIComponent(authorization_code);

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: data,
      });

      const response_json = (await resp.json()) as Record<string, any>;
      checkResponseForErrors(response_json);

      const token_type = response_json.token_type;
      const access_token = token_type + " " + response_json.access_token;
      const expires_in = response_json.expires_in;

      return {
        token_type,
        access_token,
        refresh_token: authorization_code,
        expires_in,
      };
    }

    const url = this.LOGIN_FORM_HOST + "/auth/api/v2/user/oauth2/token";
    const data = {
      grant_type: "refresh_token",
      refresh_token: authorization_code,
      client_id: this.CCSP_SERVICE_ID,
      client_secret: this.CCS_SERVICE_SECRET,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
      redirect: "manual",
    });

    const response_json = (await resp.json()) as Record<string, any>;
    checkResponseForErrors(response_json);

    const token_type = response_json.token_type;
    const access_token = token_type + " " + response_json.access_token;
    const refresh_token = response_json.refresh_token || authorization_code;
    const expires_in = response_json.expires_in;

    return { token_type, access_token, refresh_token, expires_in };
  }

  async _set_session_language(cookies: Record<string, string>): Promise<void> {
    // No-op for now; cookies are handled by fetch
  }

  private _base64Encode(data: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private _base64Decode(data: string): Uint8Array {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private _generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
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
}
