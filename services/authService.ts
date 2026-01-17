import { supabase } from './supabaseClient';

const EMAIL_DOMAIN = '@internal.app';

export const authService = {
  // Login dengan Username & Password
  login: async (username: string, password: string) => {
    // Kita tempel domain dummy agar valid format email Supabase
    const email = `${username.toLowerCase().trim()}${EMAIL_DOMAIN}`;
    
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
      updates.email = `${newUsername.toLowerCase().trim()}${EMAIL_DOMAIN}`;
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
    return email.replace(EMAIL_DOMAIN, '');
  }
};