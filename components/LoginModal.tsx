import React, { useState } from 'react';
import { X, LogIn, Lock, User, AlertCircle, Info } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      onClose();
      // Reset form
      setUsername('');
      setPassword('');
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Translate Supabase error to user friendly message
      if (err.message === 'Invalid login credentials') {
         setError('Gagal Login. Kemungkinan penyebab:\n1. Username/Password salah.\n2. User belum dibuat di Supabase.\n3. Email belum dikonfirmasi (Cek folder Spam/Inbox email Anda atau set "Auto Confirm" di Supabase).');
      } else if (err.message.includes('Email not confirmed')) {
         setError('Email belum dikonfirmasi. Silakan cek inbox email Anda atau atur "Auto Confirm Emails" di Supabase Authentication Settings.');
      } else {
         setError(err.message || 'Login gagal. Periksa koneksi internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <LogIn className="text-blue-500" /> Admin Login
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-start gap-2 whitespace-pre-line">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg flex gap-2">
             <Info className="text-blue-400 flex-shrink-0" size={16} />
             <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold">Info Setup:</p>
                <p>• Default user: <b>admin</b> (jika Anda membuat user <i>admin@internal.app</i>).</p>
                <p>• Anda juga bisa login menggunakan <b>email lengkap</b> yang terdaftar.</p>
                <p className="text-amber-400">• Pastikan status user di Supabase adalah "Confirmed".</p>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Username / Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};