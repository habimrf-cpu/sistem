import React, { useRef } from 'react';
import { Download, Upload, Database, AlertTriangle, Cloud } from 'lucide-react';
import { dataService } from '../services/dataService';

export const SettingsView: React.FC<{ onRestore: () => void }> = ({ onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      
      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex gap-4">
        <Cloud className="text-emerald-500 flex-shrink-0" size={24} />
        <div>
            <h3 className="font-bold text-emerald-500 mb-1">Status Koneksi: Aman</h3>
            <p className="text-emerald-200 text-sm">
              Sistem menggunakan Supabase. Backup harian tetap disarankan untuk keamanan ekstra.
            </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="text-blue-500" /> Transfer Data & Backup
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

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
         <AlertTriangle className="text-orange-500 flex-shrink-0" />
         <div>
            <h4 className="font-bold text-orange-500 text-sm">Peringatan Restore</h4>
            <p className="text-orange-400/80 text-xs mt-1">
               Melakukan Restore akan <b>menimpa data di Database Cloud</b> jika terjadi konflik ID. Berhati-hatilah.
            </p>
         </div>
      </div>
    </div>
  );
};