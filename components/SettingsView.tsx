import React, { useRef, useState } from 'react';
import { Download, Upload, Database, AlertTriangle, Cloud, Lock, User, Save, Copy, Check } from 'lucide-react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { useProfile } from '../hooks/useProfile';

const SETUP_SQL = `-- COPY SCRIPT INI KE SUPABASE SQL EDITOR

-- 1. Create Tires Table
create table if not exists public.tires (
  id bigint primary key,
  "serialNumber" text not null,
  brand text,
  size text,
  status text check (status in ('available', 'out')),
  condition text,
  location text,
  supplier text,
  "dateIn" text,
  "dateOut" text,
  "plateNumber" text,
  odometer bigint,
  notes text,
  "createdBy" text,
  "updatedAt" bigint
);

-- 2. Create Transactions Table
create table if not exists public.transactions (
  id bigint primary key,
  type text check (type in ('in', 'out')),
  "serialNumber" text,
  brand text,
  size text,
  condition text,
  date text,
  "plateNumber" text,
  odometer bigint,
  notes text,
  "user" text,
  timestamp bigint
);

-- 3. Create Vehicles Table
create table if not exists public.vehicles (
  id bigint primary key,
  "plateNumber" text not null,
  "vehicleType" text,
  department text,
  driver text,
  status text,
  "tireHistory" jsonb default '[]'::jsonb
);

-- 4. Enable RLS
alter table public.tires enable row level security;
alter table public.transactions enable row level security;
alter table public.vehicles enable row level security;

-- 5. Create Policies (Public Access for App)
create policy "Public Access Tires" on public.tires for all using (true) with check (true);
create policy "Public Access Tx" on public.transactions for all using (true) with check (true);
create policy "Public Access Vehicles" on public.vehicles for all using (true) with check (true);
`;

export const SettingsView: React.FC<{ onRestore: () => void }> = ({ onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useProfile();
  
  // Account State
  const [newUsername, setNewUsername] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    setIsSaving(true);

    try {
       const u = newUsername !== user?.name ? newUsername : undefined;
       const p = newPassword ? newPassword : undefined;

       if (!u && !p) {
          setIsSaving(false);
          return;
       }

       await authService.updateAccount(u, p);
       setAccountMsg({ text: 'Akun berhasil diperbarui! Silakan login ulang jika mengubah username.', type: 'success' });
       setNewPassword('');
    } catch (err: any) {
       setAccountMsg({ text: 'Gagal update akun: ' + err.message, type: 'error' });
    } finally {
       setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    const data = await dataService.createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-wms-kerinci-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (await dataService.restoreBackup(content)) {
        alert('Data berhasil dipulihkan!');
        onRestore();
      } else {
        alert('Gagal memulihkan data. File mungkin rusak.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Database Setup Section (Critical for first run) */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
         <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="text-purple-500" /> Database Setup (SQL)
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Jika aplikasi error "Table not found", jalankan script ini di SQL Editor Supabase.
                </p>
            </div>
            <button 
                onClick={handleCopySQL}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
                {copied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                {copied ? 'Tersalin' : 'Copy SQL'}
            </button>
         </div>
         
         <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 relative group">
            <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                {SETUP_SQL}
            </pre>
         </div>
         <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 p-2 rounded border border-amber-900/50">
            <AlertTriangle size={14} />
            <span>Pastikan Anda menjalankan script ini di Dashboard Supabase &gt; SQL Editor agar aplikasi berfungsi normal.</span>
         </div>
      </div>

      <div className="border-t border-slate-800"></div>

      {/* Account Management */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="text-blue-500" /> Pengaturan Akun Admin
         </h2>
         <form onSubmit={handleUpdateAccount} className="space-y-4">
            {accountMsg && (
               <div className={`p-3 rounded-lg text-sm ${accountMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {accountMsg.text}
               </div>
            )}
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Username Baru</label>
               <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="admin"
               />
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Password Baru</label>
               <input 
                  type="password" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah"
               />
            </div>

            <div className="flex justify-end">
               <button 
                 type="submit" 
                 disabled={isSaving}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
               >
                  <Save size={16}/> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
               </button>
            </div>
         </form>
      </div>

      <div className="border-t border-slate-800"></div>

      {/* Backup Restore Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Cloud className="text-emerald-500" /> Transfer Data & Backup
         </h2>
         <p className="text-slate-400 text-sm mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
            Gunakan fitur ini untuk menyimpan salinan data (Backup) atau memindahkan data dari satu perangkat ke perangkat lain secara manual.
         </p>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
               onClick={handleBackup}
               className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-blue-500 transition-all group"
            >
               <div className="p-3 bg-blue-500/10 rounded-full mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500">
                  <Download size={24} />
               </div>
               <span className="font-bold text-white">Download Backup</span>
               <span className="text-xs text-slate-500 mt-1">Export data ke file JSON</span>
            </button>

            <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-emerald-500 transition-all group"
            >
               <div className="p-3 bg-emerald-500/10 rounded-full mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                  <Upload size={24} />
               </div>
               <span className="font-bold text-white">Restore Data</span>
               <span className="text-xs text-slate-500 mt-1">Import dari file JSON</span>
            </button>
            <input 
               type="file" 
               ref={fileInputRef}
               className="hidden" 
               accept=".json"
               onChange={handleRestore}
            />
         </div>
      </div>
    </div>
  );
};