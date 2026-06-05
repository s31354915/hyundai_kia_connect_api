import { VehicleManager, createApi } from "./VehicleManager.js";
import { KvTokenStore } from "./KvTokenStore.js";
import { ClimateRequestOptions, WindowRequestOptions, OTPRequest, ScheduleChargingClimateRequestOptions, POIInfo, POICoord } from "./ApiImpl.js";
import { Vehicle } from "./vehicle.js";
import {
  REGIONS,
  BRANDS,
  VEHICLE_LOCK_ACTION,
  CHARGE_PORT_ACTION,
  VALET_MODE_ACTION,
  OTP_NOTIFY_TYPE,
  WINDOW_STATE,
} from "./const.js";

interface Env {
  TOKEN_KV: KVNamespace;
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

function getManager(env: Env, params: URLSearchParams): VehicleManager {
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
    pin,
  );
}

function vehicleToJson(vehicle: Vehicle): Record<string, any> {
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
    data: vehicle.data,
  };
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Health check
    if (path === "/") {
      return jsonResponse({
        service: "hyundai-kia-connect-api",
        version: "1.0.0",
        regions: REGIONS,
        brands: BRANDS,
      });
    }

    // Regions/brands info
    if (path === "/regions") {
      return jsonResponse({ regions: REGIONS, brands: BRANDS });
    }

    // Login
    if (path === "/login" && request.method === "POST") {
      const body = (await request.json()) as any;
      const manager = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body.region,
        body.brand,
        body.username,
        body.password,
        body.pin,
      );
      const result = await manager.login();
      if (result instanceof OTPRequest) {
        return jsonResponse({
          status: "otp_required",
          request_id: result.request_id,
          has_email: result.has_email,
          has_sms: result.has_sms,
        });
      }
      return jsonResponse({ status: "success", valid_until: result.valid_until.toISOString() });
    }

    // Send OTP
    if (path === "/otp/send" && request.method === "POST") {
      const body = (await request.json()) as any;
      const manager = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body.region,
        body.brand,
        body.username,
        body.password,
        body.pin,
      );
      const notifyType = body.notify_type === "SMS" ? OTP_NOTIFY_TYPE.SMS : OTP_NOTIFY_TYPE.EMAIL;
      await manager.send_otp(notifyType);
      return jsonResponse({ status: "otp_sent" });
    }

    // Verify OTP
    if (path === "/otp/verify" && request.method === "POST") {
      const body = (await request.json()) as any;
      const manager = new VehicleManager(
        new KvTokenStore(env.TOKEN_KV),
        body.region,
        body.brand,
        body.username,
        body.password,
        body.pin,
      );
      const token = await manager.verify_otp_and_complete_login(body.otp_code);
      return jsonResponse({ status: "success", valid_until: token.valid_until.toISOString() });
    }

    // All endpoints below require auth params in query or body
    const params = url.searchParams;
    let body: any = null;
    if (request.method === "POST" || request.method === "PUT") {
      try {
        body = await request.json();
      } catch {
        // No body
      }
    }

    const manager = getManager(env, params);

    // Get vehicles
    if (path === "/vehicles" && request.method === "GET") {
      const vehicles = await manager.get_vehicles();
      return jsonResponse({ vehicles: vehicles.map(vehicleToJson) });
    }

    // Update vehicle cached state
    if (path === "/vehicles/state" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      await manager.update_vehicle_with_cached_state(vehicle);
      return jsonResponse(vehicleToJson(vehicle));
    }

    // Force refresh vehicle state
    if (path === "/vehicles/refresh" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      await manager.force_refresh_vehicle_state(vehicle);
      await manager.update_vehicle_with_cached_state(vehicle);
      return jsonResponse(vehicleToJson(vehicle));
    }

    // Lock/Unlock
    if (path === "/vehicles/lock" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      const action = body?.action;
      if (!vehicleId || !action) return errorResponse("Missing vehicle_id or action");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const lockAction = action === "unlock" ? VEHICLE_LOCK_ACTION.UNLOCK : VEHICLE_LOCK_ACTION.LOCK;
      const actionId = await manager.lock_action(vehicle, lockAction);
      return jsonResponse({ action_id: actionId });
    }

    // Start climate
    if (path === "/vehicles/climate/start" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const options = new ClimateRequestOptions();
      if (body?.set_temp != null) options.set_temp = body.set_temp;
      if (body?.duration != null) options.duration = body.duration;
      if (body?.defrost != null) options.defrost = body.defrost;
      if (body?.climate != null) options.climate = body.climate;
      if (body?.heating != null) options.heating = body.heating;
      if (body?.front_left_seat != null) options.front_left_seat = body.front_left_seat;
      if (body?.front_right_seat != null) options.front_right_seat = body.front_right_seat;
      if (body?.rear_left_seat != null) options.rear_left_seat = body.rear_left_seat;
      if (body?.rear_right_seat != null) options.rear_right_seat = body.rear_right_seat;
      if (body?.steering_wheel != null) options.steering_wheel = body.steering_wheel;
      const actionId = await manager.start_climate(vehicle, options);
      return jsonResponse({ action_id: actionId });
    }

    // Stop climate
    if (path === "/vehicles/climate/stop" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const actionId = await manager.stop_climate(vehicle);
      return jsonResponse({ action_id: actionId });
    }

    // Start charge
    if (path === "/vehicles/charge/start" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const actionId = await manager.start_charge(vehicle);
      return jsonResponse({ action_id: actionId });
    }

    // Stop charge
    if (path === "/vehicles/charge/stop" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const actionId = await manager.stop_charge(vehicle);
      return jsonResponse({ action_id: actionId });
    }

    // Set charge limits
    if (path === "/vehicles/charge/limits" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId || body?.ac == null || body?.dc == null) {
        return errorResponse("Missing vehicle_id, ac, or dc");
      }
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const actionId = await manager.set_charge_limits(vehicle, body.ac, body.dc);
      return jsonResponse({ action_id: actionId });
    }

    // Set windows state
    if (path === "/vehicles/windows" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const options = new WindowRequestOptions();
      if (body?.back_left != null) options.back_left = body.back_left;
      if (body?.back_right != null) options.back_right = body.back_right;
      if (body?.front_left != null) options.front_left = body.front_left;
      if (body?.front_right != null) options.front_right = body.front_right;
      const actionId = await manager.set_windows_state(vehicle, options);
      return jsonResponse({ action_id: actionId });
    }

    // Charge port action
    if (path === "/vehicles/charge-port" && request.method === "POST") {
      const vehicleId = params.get("vehicle_id") ?? body?.vehicle_id;
      const action = body?.action;
      if (!vehicleId || !action) return errorResponse("Missing vehicle_id or action");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const portAction = action === "open" ? CHARGE_PORT_ACTION.OPEN : CHARGE_PORT_ACTION.CLOSE;
      const actionId = await manager.charge_port_action(vehicle, portAction);
      return jsonResponse({ action_id: actionId });
    }

    // Check action status
    if (path === "/vehicles/action-status" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      const actionId = params.get("action_id");
      if (!vehicleId || !actionId) return errorResponse("Missing vehicle_id or action_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      const status = await manager.check_action_status(vehicle, actionId);
      return jsonResponse({ status });
    }

    // Geocode location
    if (path === "/vehicles/geocode" && request.method === "GET") {
      const vehicleId = params.get("vehicle_id");
      if (!vehicleId) return errorResponse("Missing vehicle_id");
      const vehicles = await manager.get_vehicles();
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return errorResponse("Vehicle not found", 404);
      await manager.update_vehicle_with_cached_state(vehicle);
      await manager.update_geocoded_location(vehicle, true);
      return jsonResponse({ geocode: vehicle.geocode });
    }

    return errorResponse("Not found", 404);
  } catch (err: any) {
    const message = err?.message ?? String(err);
    const status = message.includes("not implemented") ? 501 : 500;
    return errorResponse(message, status);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
