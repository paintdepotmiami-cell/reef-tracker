'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { getSupabase, isSupabasePlaceholder } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  experience_level: string | null;
  location_city: string | null;
  location_state: string | null;
  units: string;
  language: string;
  onboarding_completed: boolean;
}

interface Tank {
  id: string;
  user_id: string;
  name: string;
  size_gallons: number | null;
  tank_type: string;
  sump_type: string | null;
  reef_goal: string | null;
  photo_url: string | null;
  is_primary: boolean;
  cycle_started_at: string | null;
  setup_completed_at: string | null;
  cycle_completed: boolean | null;
  model: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tank: Tank | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTank: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tank, setTank] = useState<Tank | null>(null);
  // DEV ONLY: skip auth wait for UI preview — REMOVE before deploy
  const devBypass = process.env.NODE_ENV === 'development';
  const [loading, setLoading] = useState(!devBypass);
  const initialized = useRef(devBypass);

  const supabase = getSupabase();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('reef_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code !== 'PGRST116') console.error('fetchProfile error:', error);
      return null;
    }
    setProfile(data);
    return data;
  };

  const fetchTank = async (userId: string) => {
    const { data, error } = await supabase
      .from('reef_tanks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();
    if (error) {
      if (error.code !== 'PGRST116') console.error('fetchTank error:', error);
      return null;
    }
    setTank(data);
    return data;
  };

  useEffect(() => {
    if (isSupabasePlaceholder()) {
      setLoading(false);
      return;
    }

    // Safety timeout — never hang (3s for slow connections)
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        console.warn('Auth timeout — forcing load');
        initialized.current = true;
        setLoading(false);
      }
    }, 3000);

    // Step 1: Eagerly check existing session (prevents flash redirect)
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession?.user && !initialized.current) {
        setSession(existingSession);
        setUser(existingSession.user);
        await Promise.allSettled([
          fetchProfile(existingSession.user.id),
          fetchTank(existingSession.user.id),
        ]);
        initialized.current = true;
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    // Step 2: Subscribe to reactive auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await Promise.allSettled([
          fetchProfile(newSession.user.id),
          fetchTank(newSession.user.id),
        ]);
      } else {
        setProfile(null);
        setTank(null);
      }

      // Mark as loaded after first event (INITIAL_SESSION or SIGNED_OUT)
      if (!initialized.current) {
        initialized.current = true;
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email.split('@')[0] },
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTank(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshTank = async () => {
    if (user) await fetchTank(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, tank, loading, signUp, signIn, signInWithGoogle, resetPassword, updatePassword, signOut, refreshProfile, refreshTank }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export type { Profile, Tank };
