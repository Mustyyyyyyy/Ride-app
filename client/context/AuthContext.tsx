"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/lib/api";

type User = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role: "passenger" | "driver" | "admin";
  is_verified?: boolean;
};

type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "passenger" | "driver" | "admin";
};

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  register: (payload: RegisterPayload) => Promise<User>;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "oride_token";
const USER_KEY = "oride_user";

function normalizeUser(user: any): User {
  return {
    ...user,
    id: Number(user.id),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(normalizeUser(parsedUser));
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const register = async (payload: RegisterPayload) => {
    setLoading(true);

    try {
      const data = await authApi.register(payload);

      if (data?.token && data?.user) {
        const normalizedUser = normalizeUser(data.user);

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

        setToken(data.token);
        setUser(normalizedUser);

        return normalizedUser;
      }

      throw new Error(data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    setLoading(true);

    try {
      const data = await authApi.login(payload);

      if (data?.token && data?.user) {
        const normalizedUser = normalizeUser(data.user);

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

        setToken(data.token);
        setUser(normalizedUser);

        return normalizedUser;
      }

      throw new Error(data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      hydrated,
      register,
      login,
      logout,
    }),
    [user, token, loading, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}