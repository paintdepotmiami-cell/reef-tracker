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
  photo_url: string | null;
  is_primary: boolean;
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
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const supabase = getSupabase();

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('reef_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
      return data;
    } catch { return null; }
  };

  const fetchTank = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('reef_tanks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();
      setTank(data);
      return data;
    } catch { return null; }
  };

  useEffect(() => {
    if (isSupabasePlaceholder()) {
      setLoading(false);
      return;
    }

    // Safety timeout — never hang
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        console.warn('Auth timeout — forcing load');
        initialized.current = true;
        setLoading(false);
      }
    }, 1500);

    // Use onAuthStateChange for reactive updates
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTank(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshTank = async () => {
    if (user) await fetchTank(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, tank, loading, signUp, signIn, signOut, refreshProfile, refreshTank }}>
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
