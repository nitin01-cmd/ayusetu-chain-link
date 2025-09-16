import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, phone: string, role: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          phone,
          role
        }
      }
    });

    if (data.user && !error) {
      // Insert user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: role as any
        });
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  };

  const signInWithOTP = async (phone: string, otp: string) => {
    // Check dev OTP first
    const { data: devOTP } = await supabase
      .from('dev_otps')
      .select('*')
      .eq('phone', phone)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (devOTP) {
      // Create a temporary user session for dev
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (data.user && !error) {
        // Set user role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: devOTP.role
          });
      }
      
      return { data, error };
    }

    // Regular OTP verification would go here
    return { data: null, error: { message: 'Invalid OTP' } };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const getUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return { role: data?.role, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOTP,
    signOut,
    getUserRole
  };
}