import { createApiClient } from "@base-mern/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4100/api/v1";

export const apiFetch = createApiClient({
  baseUrl: API_URL,
  getToken: () => localStorage.getItem("token"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  onRefresh: async (refreshToken: string) => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    localStorage.setItem("token", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    return data.data;
  },
  onAuthFailure: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  },
});
