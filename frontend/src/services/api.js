export const BASE_URL = "http://localhost:5000";

export const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/api/auth/login`,
  REGISTER: `${BASE_URL}/api/auth/register`,
  ME: `${BASE_URL}/api/auth/me`,
  CUSTOMERS: `${BASE_URL}/api/auth/customers`,

  // Bookings
  BOOKINGS: `${BASE_URL}/api/bookings`,
  MY_BOOKINGS: `${BASE_URL}/api/bookings/my`,
  DRIVER_BOOKINGS: `${BASE_URL}/api/bookings/driver/mine`,

  // Vehicles
  VEHICLES: `${BASE_URL}/api/vehicles`,

  // Drivers
  DRIVERS: `${BASE_URL}/api/drivers`,
};

export default BASE_URL;
