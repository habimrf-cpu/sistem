import { supabase } from './supabaseClient';

const EMAIL_DOMAIN = '@internal.app';

export const authService = {
  // Login dengan Username & Password
  login: async (username: string, password: string) => {
    const input = username.toLowerCase().trim();
    let email = input;

    // Logika Fleksibel:
    // 1. Jika input mengandung '@', anggap user memasukkan email lengkap (misal: admin@gmail.com atau admin@internal.app)
    // 2. Jika tidak, anggap itu username dan tempel domain default
    if (!input.includes('@')) {
       email = `${input}${EMAIL_DOMAIN}`;
    }
    
    console.log("Attempting login with:", email); 

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // Update Username (Email) atau Password
  updateAccount: async (newUsername?: string, newPassword?: string) => {
    const updates: any = {};
    
    if (newUsername) {
      const input = newUsername.toLowerCase().trim();
      // Gunakan logika yang sama: kalau ada @ pakai langsung, kalau tidak append domain
      if (input.includes('@')) {
         updates.email = input;
      } else {
         updates.email = `${input}${EMAIL_DOMAIN}`;
      }
    }
    if (newPassword) {
      updates.password = newPassword;
    }

    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  },

  // Helper untuk membersihkan username dari domain dummy saat ditampilkan
  formatUsername: (email: string | undefined) => {
    if (!email) return 'Guest';
    // Ambil bagian sebelum @ (berlaku untuk internal.app maupun gmail.com)
    return email.split('@')[0];
  }
};