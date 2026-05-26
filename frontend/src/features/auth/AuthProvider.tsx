import React, { createContext, useContext, useEffect, useState } from "react";
import { api, removeToken, setToken } from "../../shared/api";
import type { User } from "../../shared/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, full_name: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("dentistry_token");
    if (token) {
      api.get<User>("/auth/me")
        .then((r) => setUser(r.data))
        .catch(() => removeToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const r = await api.post<{ access_token: string }>("/auth/login", { username, password });
    setToken(r.data.access_token);
    const me = await api.get<User>("/auth/me");
    setUser(me.data);
  };

  const register = async (username: string, password: string, full_name: string, phone?: string) => {
    await api.post("/auth/register", { username, password, full_name, phone });
    await login(username, password);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
