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

function setTokenCookie(token: string) {
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=604800`;
}

function removeTokenCookie() {
  document.cookie = "auth_token=; path=/; max-age=0";
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getTokenFromCookie();
    if (savedToken) {
      setToken(savedToken);
      apiFetch<ApiResponse<{ user: IUser }>>("/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          removeTokenCookie();
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<ApiResponse<{ user: IUser; token: string }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokenCookie(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiFetch<ApiResponse<{ user: IUser; token: string }>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
    setTokenCookie(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    removeTokenCookie();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
