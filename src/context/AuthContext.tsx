"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { login, type User } from "@/src/lib/auth";
import { logout, verifySession } from "@/src/lib/session";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  loginUser: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const session = await verifySession(token);
        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);
        } else {
          localStorage.removeItem("auth_token");
        }
      }
    } catch {
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success && result.token) {
      localStorage.setItem("auth_token", result.token);
      document.cookie = `auth_token=${result.token}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`;
      setIsAuthenticated(true);
      setUser(result.user);
    }
    return result;
  };

  const logoutUser = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      await logout(token);
      localStorage.removeItem("auth_token");
      document.cookie =
        "auth_token=; path=/; max-age=0; SameSite=Lax";
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
