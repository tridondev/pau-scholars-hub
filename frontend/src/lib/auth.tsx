"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as api from "./api";

// api.ts doesn't export a CurrentUser type yet — this is a light shape
// covering what /api/users/me/ actually returns (per apps/users/serializers.py).
// Extend this if you add more fields to UserSerializer later.
export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institute: { id: string; name: string; acronym: string } | null;
  student_staff_id: string;
  country: string;
  orcid_id: string | null;
  profile: {
    id: string;
    faculty: string;
    department: string;
    programme: string;
    biography: string;
    research_interests: string[];
    google_scholar_url: string;
    linkedin_url: string;
    cv_file: string | null;
    profile_image: string | null;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (typeof window === "undefined" || !localStorage.getItem("access_token")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me as AuthUser);
    } catch {
      api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    await api.login(email, password);
    await refresh();
  }

  function logout() {
    api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
