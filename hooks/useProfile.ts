import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

export function useProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek sesi saat ini
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
           await fetchProfile(session.user);
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

    // 2. Listen perubahan auth (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
       if (session?.user) {
          await fetchProfile(session.user);
       } else {
          setUser(null);
       }
       setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authUser: any) => {
     // Ambil role dari tabel profiles
     const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
     
     if (data) {
        setUser({
           email: data.email || authUser.email,
           name: data.full_name || authUser.user_metadata.full_name || 'User',
           picture: data.avatar_url || authUser.user_metadata.avatar_url,
           role: data.role as 'admin' | 'user' // cast role
        });
     } else {
        // Fallback jika profil belum terbuat (jarang terjadi karena trigger)
        setUser({
           email: authUser.email,
           name: authUser.user_metadata.full_name,
           picture: authUser.user_metadata.avatar_url,
           role: 'user' // Default safe
        });
     }
  };

  return { user, loading, isAdmin: user?.role === 'admin' };
}