import { ApiImpl, ClimateRequestOptions, WindowRequestOptions, OTPRequest, ScheduleChargingClimateRequestOptions, POIInfo } from "./ApiImpl.js";
import { Token } from "./token.js";
import { Vehicle } from "./vehicle.js";
import { KvTokenStore } from "./KvTokenStore.js";
import {
  REGIONS,
  VEHICLE_LOCK_ACTION,
  CHARGE_PORT_ACTION,
  VALET_MODE_ACTION,
  OTP_NOTIFY_TYPE,
  BRAND_KIA,
  BRAND_HYUNDAI,
  BRAND_GENESIS,
  BRANDS,
  LOGIN_TOKEN_LIFETIME_SECONDS,
} from "./const.js";
import { KiaUvoApiEU } from "./KiaUvoApiEU.js";
import { KiaUvoApiUSA } from "./KiaUvoApiUSA.js";
import { HyundaiBlueLinkApiUSA } from "./HyundaiBlueLinkApiUSA.js";
import { KiaUvoApiCA } from "./KiaUvoApiCA.js";
import { KiaUvoApiAU } from "./KiaUvoApiAU.js";
import { KiaUvoApiCN } from "./KiaUvoApiCN.js";
import { KiaUvoApiIN } from "./KiaUvoApiIN.js";
import { HyundaiBlueLinkApiBR } from "./HyundaiBlueLinkApiBR.js";

const REGION_ID: Record<string, number> = {
  [REGIONS[1]]: 1,
  [REGIONS[2]]: 2,
  [REGIONS[3]]: 3,
  [REGIONS[4]]: 4,
  [REGIONS[5]]: 5,
  [REGIONS[6]]: 6,
  [REGIONS[7]]: 7,
  [REGIONS[8]]: 8,
};

const BRAND_ID: Record<string, number> = {
  [BRAND_KIA]: 1,
  [BRAND_HYUNDAI]: 2,
  [BRAND_GENESIS]: 3,
};

export function createApi(region: string, brand: string, language: string = "en"): ApiImpl {
  const regionId = REGION_ID[region];
  const brandId = BRAND_ID[brand];
  if (regionId == null) throw new Error(`Unsupported region: ${region}`);
  if (brandId == null) throw new Error(`Unsupported brand: ${brand}`);

  switch (region) {
    case REGIONS[1]: // Europe
      return new KiaUvoApiEU(regionId, brandId, language);
    case REGIONS[3]: // USA
      if (brand === BRAND_KIA) return new KiaUvoApiUSA(regionId, brandId, language);
      return new HyundaiBlueLinkApiUSA(regionId, brandId, language);
    case REGIONS[2]: // Canada
      return new KiaUvoApiCA(regionId, brandId, language);
    case REGIONS[5]: // Australia
    case REGIONS[7]: // NZ
      return new KiaUvoApiAU(regionId, brandId, language);
    case REGIONS[4]: // China
      return new KiaUvoApiCN(regionId, brandId, language);
    case REGIONS[6]: // India
      return new KiaUvoApiIN(brandId);
    case REGIONS[8]: // Brazil
      return new HyundaiBlueLinkApiBR(regionId, brandId, language);
    default:
      throw new Error(`Unsupported region: ${region}`);
  }
}

export class VehicleManager {
  api: ApiImpl;
  tokenStore: KvTokenStore;
  region: string;
  brand: string;
  username: string;
  password: string;
  pin: string | null;

  constructor(
    tokenStore: KvTokenStore,
    region: string,
    brand: string,
    username: string,
    password: string,
    pin: string | null = null,
  ) {
    this.tokenStore = tokenStore;
    this.region = region;
    this.brand = brand;
    this.username = username;
    this.password = password;
    this.pin = pin;
    this.api = createApi(region, brand);
  }

  async _get_token(): Promise<Token> {
    const cached = await this.tokenStore.get(this.username, this.region);
    if (cached && cached.valid_until && new Date(cached.valid_until) > new Date()) {
      return cached;
    }

    // Try refresh first
    if (cached?.refresh_token) {
      try {
        const result = await this.api.refresh_access_token(cached);
        if (result instanceof Token) {
          result.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000);
          result.username = this.username;
          result.password = this.password;
          result.pin = this.pin;
          await this.tokenStore.put(this.username, this.region, result);
          return result;
        }
      } catch {
        // Refresh failed, fall through to full login
      }
    }

    // Full login
    const result = await this.api.login(this.username, this.password, this.pin);
    if (result instanceof OTPRequest) {
      throw new Error("OTP required - use login_with_otp flow");
    }
    const token = result;
    token.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000);
    token.username = this.username;
    token.password = this.password;
    token.pin = this.pin;
    await this.tokenStore.put(this.username, this.region, token);
    return token;
  }

  async login(): Promise<Token | OTPRequest> {
    const result = await this.api.login(this.username, this.password, this.pin);
    if (result instanceof Token) {
      result.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000);
      result.username = this.username;
      result.password = this.password;
      result.pin = this.pin;
      await this.tokenStore.put(this.username, this.region, result);
    } else {
      // OTP required - save state for later
      await this.tokenStore.putOtpState(this.username, this.region, {
        request_id: result.request_id,
        otp_key: result.otp_key,
        has_email: result.has_email,
        has_sms: result.has_sms,
        email: result.email,
        sms: result.sms,
      });
    }
    return result;
  }

  async send_otp(notify_type: OTP_NOTIFY_TYPE): Promise<void> {
    const otpState = await this.tokenStore.getOtpState(this.username, this.region);
    if (!otpState) throw new Error("No OTP state found - call login first");
    const otpRequest = new OTPRequest(otpState);
    await this.api.send_otp(otpRequest, notify_type);
  }

  async verify_otp_and_complete_login(otp_code: string): Promise<Token> {
    const otpState = await this.tokenStore.getOtpState(this.username, this.region);
    if (!otpState) throw new Error("No OTP state found - call login first");
    const otpRequest = new OTPRequest(otpState);
    const token = await this.api.verify_otp_and_complete_login(
      this.username,
      this.password,
      otp_code,
      otpRequest,
      this.pin,
    );
    token.valid_until = new Date(Date.now() + LOGIN_TOKEN_LIFETIME_SECONDS * 1000);
    token.username = this.username;
    token.password = this.password;
    token.pin = this.pin;
    await this.tokenStore.put(this.username, this.region, token);
    await this.tokenStore.deleteOtpState(this.username, this.region);
    return token;
  }

  async get_vehicles(): Promise<Vehicle[]> {
    const token = await this._get_token();
    return this.api.get_vehicles(token);
  }

  async update_vehicle_with_cached_state(vehicle: Vehicle): Promise<void> {
    const token = await this._get_token();
    await this.api.update_vehicle_with_cached_state(token, vehicle);
  }

  async force_refresh_vehicle_state(vehicle: Vehicle): Promise<void> {
    const token = await this._get_token();
    await this.api.force_refresh_vehicle_state(token, vehicle);
  }

  async lock_action(vehicle: Vehicle, action: VEHICLE_LOCK_ACTION): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.lock_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async start_climate(vehicle: Vehicle, options: ClimateRequestOptions): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.start_climate(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async stop_climate(vehicle: Vehicle): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.stop_climate(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async start_charge(vehicle: Vehicle): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.start_charge(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async stop_charge(vehicle: Vehicle): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.stop_charge(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async set_charge_limits(vehicle: Vehicle, ac: number, dc: number): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.set_charge_limits(token, vehicle, ac, dc);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async set_charging_current(vehicle: Vehicle, level: number): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.set_charging_current(token, vehicle, level);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async set_windows_state(vehicle: Vehicle, options: WindowRequestOptions): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.set_windows_state(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async charge_port_action(vehicle: Vehicle, action: CHARGE_PORT_ACTION): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.charge_port_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async update_month_trip_info(vehicle: Vehicle, yyyymm_string: string): Promise<void> {
    const token = await this._get_token();
    await this.api.update_month_trip_info(token, vehicle, yyyymm_string);
  }

  async update_day_trip_info(vehicle: Vehicle, yyyymmdd_string: string): Promise<void> {
    const token = await this._get_token();
    await this.api.update_day_trip_info(token, vehicle, yyyymmdd_string);
  }

  async schedule_charging_and_climate(
    vehicle: Vehicle,
    options: ScheduleChargingClimateRequestOptions,
  ): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.schedule_charging_and_climate(token, vehicle, options);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async start_hazard_lights(vehicle: Vehicle): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.start_hazard_lights(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async start_hazard_lights_and_horn(vehicle: Vehicle): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.start_hazard_lights_and_horn(token, vehicle);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async valet_mode_action(vehicle: Vehicle, action: VALET_MODE_ACTION): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.valet_mode_action(token, vehicle, action);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async set_vehicle_to_load_discharge_limit(vehicle: Vehicle, limit: number): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.set_vehicle_to_load_discharge_limit(token, vehicle, limit);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async set_navigation(vehicle: Vehicle, poi_list: POIInfo[]): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.set_navigation(token, vehicle, poi_list);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async check_action_status(vehicle: Vehicle, action_id: string): Promise<string> {
    const token = await this._get_token();
    const result = await this.api.check_action_status(token, vehicle, action_id);
    await this.tokenStore.put(this.username, this.region, token);
    return result;
  }

  async update_geocoded_location(
    vehicle: Vehicle,
    use_email: boolean = false,
    provider: number = 1,
    api_key: string | null = null,
  ): Promise<void> {
    const token = await this._get_token();
    await this.api.update_geocoded_location(token, vehicle, use_email, provider, api_key);
  }
}
