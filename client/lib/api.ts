const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ride-app-g57x.onrender.com";

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "passenger" | "driver" | "admin";
  }) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: payload,
    }),

  login: (payload: {
    email: string;
    password: string;
  }) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: payload,
    }),

  getMe: (token: string) =>
    apiRequest("/api/auth/me", {
      method: "GET",
      token,
    }),
};

export const rideApi = {
  requestRide: (
    payload: {
      passenger_id: number | string;
      pickup: string;
      destination?: string;
      dropoff?: string;
      ride_type: string;
      payment_method: string;
      note?: string;
    },
    token?: string | null
  ) =>
    apiRequest("/api/rides/request", {
      method: "POST",
      body: payload,
      token,
    }),

  getPassengerRides: (
    passengerId: number | string,
    token?: string | null
  ) =>
    apiRequest(`/api/rides/passenger/${passengerId}`, {
      method: "GET",
      token,
    }),

  getDriverRides: (driverId: number | string, token?: string | null) =>
    apiRequest(`/api/rides/driver/${driverId}`, {
      method: "GET",
      token,
    }),

  getAvailableRides: (token?: string | null) =>
    apiRequest("/api/rides/available/list", {
      method: "GET",
      token,
    }),

  getRideById: (rideId: number | string, token?: string | null) =>
    apiRequest(`/api/rides/${rideId}`, {
      method: "GET",
      token,
    }),

  acceptRide: (
    rideId: number | string,
    payload: { driver_id: number | string },
    token?: string | null
  ) =>
    apiRequest(`/api/rides/${rideId}/accept`, {
      method: "PATCH",
      body: payload,
      token,
    }),

  updateRideStatus: (
    rideId: number | string,
    payload: { status: string },
    token?: string | null
  ) =>
    apiRequest(`/api/rides/${rideId}/status`, {
      method: "PATCH",
      body: payload,
      token,
    }),
};

export const passengerApi = {
  getDashboard: (token?: string | null) =>
    apiRequest("/api/passenger/dashboard", {
      method: "GET",
      token,
    }),

  getWallet: (token?: string | null) =>
    apiRequest("/api/passenger/wallet", {
      method: "GET",
      token,
    }),

  getTransactions: (token?: string | null) =>
    apiRequest("/api/passenger/transactions", {
      method: "GET",
      token,
    }),

  fundWallet: (
    payload: { amount: number },
    token?: string | null
  ) =>
    apiRequest("/api/passenger/wallet/fund", {
      method: "POST",
      body: payload,
      token,
    }),

  getRideById: (id: string | number, token?: string | null) =>
    apiRequest(`/api/rides/${id}`, {
      method: "GET",
      token,
    }),

  getNotifications: (token?: string | null) =>
    apiRequest("/api/passenger/notifications", {
      method: "GET",
      token,
    }),

  getSupportTickets: (token?: string | null) =>
    apiRequest("/api/passenger/support", {
      method: "GET",
      token,
    }),

  createSupportTicket: (
    payload: { subject: string; category: string; message: string },
    token?: string | null
  ) =>
    apiRequest("/api/passenger/support", {
      method: "POST",
      body: payload,
      token,
    }),
};

export const driverApi = {
  getDashboard: (token?: string | null) =>
    apiRequest("/api/driver/dashboard", {
      method: "GET",
      token,
    }),

  getAvailableRides: (token?: string | null) =>
    apiRequest("/api/driver/available-rides", {
      method: "GET",
      token,
    }),

  acceptRide: (rideId: number | string, token?: string | null) =>
    apiRequest(`/api/driver/rides/${rideId}/accept`, {
      method: "POST",
      token,
    }),

  getTrips: (token?: string | null) =>
    apiRequest("/api/driver/trips", {
      method: "GET",
      token,
    }),

  getTripById: (tripId: number | string, token?: string | null) =>
    apiRequest(`/api/driver/trips/${tripId}`, {
      method: "GET",
      token,
    }),

  updateRideStatus: (
    rideId: number | string,
    payload: { status: string },
    token?: string | null
  ) =>
    apiRequest(`/api/driver/rides/${rideId}/status`, {
      method: "PATCH",
      body: payload,
      token,
    }),

  getWallet: (token?: string | null) =>
    apiRequest("/api/driver/wallet", {
      method: "GET",
      token,
    }),

  withdrawWallet: (
    payload: { amount: number },
    token?: string | null
  ) =>
    apiRequest("/api/driver/wallet/withdraw", {
      method: "POST",
      body: payload,
      token,
    }),

  getNotifications: (token?: string | null) =>
    apiRequest("/api/driver/notifications", {
      method: "GET",
      token,
    }),

  getProfile: (token?: string | null) =>
    apiRequest("/api/driver/profile", {
      method: "GET",
      token,
    }),

  updateProfile: (
    payload: {
      vehicle_model: string;
      plate_number: string;
      vehicle_color: string;
      is_online: boolean;
    },
    token?: string | null
  ) =>
    apiRequest("/api/driver/profile", {
      method: "PUT",
      body: payload,
      token,
    }),
};

export const paymentApi = {
  getVirtualAccount: (token?: string | null) =>
    apiRequest("/api/payments/virtual-account", {
      method: "GET",
      token,
    }),
};

export const adminApi = {
  getDashboard: (token?: string | null) =>
    apiRequest("/api/admin/dashboard", {
      method: "GET",
      token,
    }),

  getUsers: (token?: string | null) =>
    apiRequest("/api/admin/users", {
      method: "GET",
      token,
    }),

  getDrivers: (token?: string | null) =>
    apiRequest("/api/admin/drivers", {
      method: "GET",
      token,
    }),

  getRides: (token?: string | null) =>
    apiRequest("/api/admin/rides", {
      method: "GET",
      token,
    }),

  getSupportTickets: (token?: string | null) =>
    apiRequest("/api/admin/support", {
      method: "GET",
      token,
    }),

  updateSupportStatus: (
    ticketId: number | string,
    payload: { status: string },
    token?: string | null
  ) =>
    apiRequest(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      body: payload,
      token,
    }),
};