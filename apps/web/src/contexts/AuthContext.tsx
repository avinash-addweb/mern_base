"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import type { IUser, ApiResponse } from "@base-mern/types";
import { apiFetch } from "@/lib/api";

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function setTokenCookie(name: string, token: string) {
  document.cookie = `${name}=${encodeURIComponent(token)}; path=/; max-age=604800`;
}

function removeTokenCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function getTokenFromCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getTokenFromCookie("auth_token");
    if (savedToken) {
      setToken(savedToken);
      apiFetch<ApiResponse<{ user: IUser }>>("/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          removeTokenCookie("auth_token");
          removeTokenCookie("refresh_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<
      ApiResponse<{ user: IUser; accessToken: string; refreshToken: string }>
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokenCookie("auth_token", res.data.accessToken);
    setTokenCookie("refresh_token", res.data.refreshToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiFetch<
      ApiResponse<{ user: IUser; accessToken: string; refreshToken: string }>
    >("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
    setTokenCookie("auth_token", res.data.accessToken);
    setTokenCookie("refresh_token", res.data.refreshToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getTokenFromCookie("refresh_token");
    if (refreshToken) {
      apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    removeTokenCookie("auth_token");
    removeTokenCookie("refresh_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
