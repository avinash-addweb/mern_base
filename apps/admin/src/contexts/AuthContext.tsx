import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { IUser } from "@base-mern/types";
import { UserRole } from "@base-mern/types";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@base-mern/types";

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    apiFetch<ApiResponse<{ user: IUser }>>("/auth/me")
      .then((res) => {
        if (res.data.user.role !== UserRole.ADMIN) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setToken(null);
          setUser(null);
        } else {
          setUser(res.data.user);
          setToken(storedToken);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<
      ApiResponse<{ user: IUser; accessToken: string; refreshToken: string }>
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.data.user.role !== UserRole.ADMIN) {
      throw new Error("Access denied. Admin privileges required.");
    }

    localStorage.setItem("token", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
