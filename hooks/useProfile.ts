import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { authService } from '../services/authService';

export function useProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek sesi saat ini
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           mapUser(session.user);
        } else {
           setUser(null);
        }
      } catch (error) {
        console.error("Auth Check Error", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Listen perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
       if (session?.user) {
          mapUser(session.user);
       } else {
          setUser(null);
       }
       setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const mapUser = (authUser: any) => {
    // Dalam sistem Single Admin: Jika punya user session, berarti dia Admin.
    setUser({
       email: authUser.email,
       name: authService.formatUsername(authUser.email), // Tampilkan username saja
       picture: '', // Tidak pakai foto avatar
       role: 'admin' 
    });
  };

  return { user, loading, isAdmin: user?.role === 'admin' };
}