import { createApiClient } from "@base-mern/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1";

function getTokenFromCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setTokenCookie(name: string, token: string) {
  document.cookie = `${name}=${encodeURIComponent(token)}; path=/; max-age=604800`;
}

export const apiFetch = createApiClient({
  baseUrl: API_URL,
  getToken: () => getTokenFromCookie("auth_token"),
  getRefreshToken: () => getTokenFromCookie("refresh_token"),
  onRefresh: async (refreshToken: string) => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    setTokenCookie("auth_token", data.data.accessToken);
    setTokenCookie("refresh_token", data.data.refreshToken);
    return data.data;
  },
  onAuthFailure: () => {
    if (typeof document !== "undefined") {
      document.cookie = "auth_token=; path=/; max-age=0";
      document.cookie = "refresh_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
  },
});
