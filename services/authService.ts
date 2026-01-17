import { UserProfile } from '../types';

// Daftar email yang diizinkan menjadi ADMIN
// Ganti atau tambahkan email lain di sini sesuai kebutuhan
const ADMIN_WHITELIST = [
  'habimrf@gmail.com',
  // 'other.admin@gmail.com' 
];

export const authService = {
  /**
   * Cek apakah email termasuk dalam whitelist Admin
   */
  isAdmin: (email: string | undefined | null): boolean => {
    if (!email) return false;
    return ADMIN_WHITELIST.includes(email);
  },

  /**
   * Menentukan Role berdasarkan email
   */
  getRole: (email: string | undefined): 'admin' | 'user' | 'guest' => {
    if (!email) return 'guest';
    if (authService.isAdmin(email)) return 'admin';
    return 'user';
  }
};