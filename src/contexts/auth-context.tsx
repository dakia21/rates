"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { connectSocket, disconnectSocket } from "@/lib/socket/client";
import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, [mounted]);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
    return data;
  }, [supabase]);

  const connectUserSocket = useCallback(async (userId: string) => {
    try {
      const res = await fetch("/api/auth/socket-token");
      const data = await res.json();
      if (data.success) {
        connectSocket(data.data.token, userId);
      }
    } catch {
      // Socket connection is optional
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id);
        if (prof) {
          await connectUserSocket(prof.id);
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id);
        if (prof && event === "SIGNED_IN") {
          await connectUserSocket(prof.id);
        }
      } else {
        setUser(null);
        setProfile(null);
        disconnectSocket();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, connectUserSocket]);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, displayName }),
      });
      const data = await res.json();

      if (!data.success) {
        return { error: data.error || "Ошибка регистрации" };
      }

      if (data.hasSession && supabase) {
        await supabase.auth.getSession();
      }

      return {};
    } catch {
      return { error: "Не удалось подключиться к серверу. Запущен ли npm run dev?" };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "Клиент не инициализирован" };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Неизвестная ошибка сети при входе" };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: "Клиент не инициализирован" };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    disconnectSocket();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user || !supabase) return { error: "Не авторизован" };

    if (data.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", data.username)
        .neq("id", user.id)
        .single();

      if (existing) return { error: "Имя пользователя уже занято" };
    }

    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    if (error) return { error: error.message };

    await fetchProfile(user.id);
    return {};
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
