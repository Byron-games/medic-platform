import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT + user-context headers to every request.
// In production the gateway injects X-User-* from the JWT.
// In local dev (no gateway) we inject them here directly from
// the Zustand store so downstream services get the right context.
api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user) {
    config.headers["X-User-Id"] = String(user.id ?? "");
    config.headers["X-User-Name"] = user.username ?? "";
    config.headers["X-User-Role"] = user.role ?? "";
    config.headers["X-User-Email"] = user.email ?? "";
    config.headers["X-Facility-Id"] = user.facilityId ?? "";
    config.headers["X-Facility-Name"] = user.facilityName ?? "";
  }

  return config;
});

// Handle 401 — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
