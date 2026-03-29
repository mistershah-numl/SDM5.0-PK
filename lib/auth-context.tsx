"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "company";
  companyId?: string;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
  size: string;
  region: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    console.log("[v0] Attempting login with email:", email);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("[v0] Login response status:", res.status);
    if (!res.ok) {
      const data = await res.json();
      console.error("[v0] Login error response:", data);
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    console.log("[v0] Login successful, user:", data.user?.email);
    setUser(data.user);
  };

  const register = async (data: RegisterData) => {
    console.log("[v0] Register function called with email:", data.email);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("[v0] Register response status:", res.status);
      
      if (!res.ok) {
        const responseData = await res.json();
        console.error("[v0] Register error response:", responseData);
        throw new Error(responseData.error || `Registration failed (${res.status})`);
      }

      const responseData = await res.json();
      console.log("[v0] Registration successful:", responseData.user?.email);
      setUser(responseData.user);
    } catch (error) {
      console.error("[v0] Register catch error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
