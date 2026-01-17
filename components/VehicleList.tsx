import React, { useState, useRef } from 'react';
import { Vehicle, UserProfile, VEHICLE_TYPES, VEHICLE_GROUPS } from '../types';
import { formatDateIndo } from '../utils/helpers';
import { Truck, Plus, Edit, Trash2, X, Search, Save, Upload, Download, MoreVertical, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ConfirmationModal } from './ConfirmationModal';
import * as XLSX from 'xlsx';

interface VehicleListProps {
  vehicles: Vehicle[];
  user: UserProfile | null;
  onRefresh: () => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, user, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // File input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      dataService.deleteVehicle(deleteId);
      setDeleteId(null);
      onRefresh();
    }
  };

  // --- Template Download ---
  const handleDownloadTemplate = () => {
    const headers = [
       ['Plat Nomor', 'Tipe Kendaraan', 'Departemen', 'Nama Supir']
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    // Add example row
    XLSX.utils.sheet_add_json(ws, [
       {'Plat Nomor': 'B 1234 ABC', 'Tipe Kendaraan': 'FUSO', 'Departemen': 'RKI', 'Nama Supir': 'Budi Santoso'}
    ], {skipHeader: true, origin: "A2"});

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Kendaraan");
    XLSX.writeFile(wb, "Template_Import_Kendaraan.xlsx");
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        if (!bstr) return;

        try {
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            let successCount = 0;
            let failCount = 0;

            // Process async to ensure we don't crash loop
            for (const row of data as any[]) {
                const plate = row['Plat Nomor'] || row['plateNumber'];
                const driver = row['Nama Supir'] || row['driver'];
                
                try {
                    if (plate) {
                        const newVehicle: Vehicle = {
                            id: Date.now() + Math.random(),
                            plateNumber: String(plate).toUpperCase(),
                            vehicleType: row['Tipe Kendaraan'] || VEHICLE_TYPES[0],
                            department: row['Departemen'] || VEHICLE_GROUPS[0],
                            driver: driver || 'Belum Ada',
                            status: 'active',
                            tireHistory: []
                        };
                        await dataService.saveVehicle(newVehicle);
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (e) {
                    failCount++;
                }
            }

            alert(`Import Selesai.\nBerhasil: ${successCount}\nGagal/Tanpa Plat: ${failCount}`);
            onRefresh();

        } catch (error) {
            console.error(error);
            alert("Gagal membaca file Excel atau koneksi database error.");
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Hidden Input for Import */}
       <input 
         type="file" 
         accept=".xlsx, .xls" 
         ref={fileInputRef} 
         onChange={handleFileChange} 
         className="hidden" 
       />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-blue-500" /> Daftar Kendaraan
         </h2>
         <div className="flex gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari Plat / Supir..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            {isAdmin && (
               <>
                  <button 
                    onClick={() => { setEditingVehicle(null); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={16} /> <span className="hidden sm:inline">Tambah</span>
                  </button>
                  
                  {/* Actions Dropdown */}
                  <div className="relative group">
                     <button className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-slate-300 border border-slate-600">
                        <MoreVertical size={20} />
                     </button>
                     <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10">
                        <button onClick={handleImportClick} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-emerald-400 hover:bg-slate-700 text-left border-b border-slate-700">
                           <Upload size={16}/> Import Excel
                        </button>
                        <button onClick={handleDownloadTemplate} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 text-left">
                           <Download size={16}/> Template Import
                        </button>
                     </div>
                  </div>
               </>
            )}
         </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-600 transition-colors">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-xl font-bold text-white font-mono">{vehicle.plateNumber}</h3>
                   <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 mt-1 inline-block">
                      {vehicle.vehicleType}
                   </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                     <button onClick={() => { setEditingVehicle(vehicle); setShowModal(true); }} className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-amber-400 rounded"><Edit size={16}/></button>
                     <button onClick={() => setDeleteId(vehicle.id)} className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 rounded"><Trash2 size={16}/></button>
                  </div>
                )}
             </div>
             
             <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Supir</span>
                   <span className="text-slate-300">{vehicle.driver}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Departemen</span>
                   <span className="text-slate-300">{vehicle.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Status</span>
                   <span className={`text-xs px-2 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {vehicle.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                   </span>
                </div>
             </div>

             <div className="mt-auto pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Riwayat Ban Terakhir</p>
                {vehicle.tireHistory.length > 0 ? (
                  <div className="space-y-2">
                     {vehicle.tireHistory.slice(-2).reverse().map((th, idx) => (
                        <div key={idx} className="bg-slate-900/50 p-2 rounded flex justify-between items-center text-xs">
                           <span className="font-mono text-blue-400">{th.serialNumber}</span>
                           <span className="text-slate-500">{formatDateIndo(th.dateInstalled)}</span>
                        </div>
                     ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">Belum ada riwayat pemasangan.</p>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showModal && (
        <VehicleFormModal 
           vehicle={editingVehicle} 
           onClose={() => setShowModal(false)}
           onSave={async (v) => {
              await dataService.saveVehicle(v);
              onRefresh();
              setShowModal(false);
           }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmationModal 
         isOpen={deleteId !== null}
         title="Hapus Kendaraan"
         message="Apakah Anda yakin ingin menghapus data kendaraan ini?"
         onConfirm={handleDelete}
         onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// Internal Sub-component: Form Modal
const VehicleFormModal: React.FC<{ vehicle: Vehicle | null, onClose: () => void, onSave: (v: Vehicle) => Promise<void> }> = ({ vehicle, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Vehicle>>(vehicle || {
     plateNumber: '',
     vehicleType: VEHICLE_TYPES[0],
     department: VEHICLE_GROUPS[0],
     driver: '',
     status: 'active',
     tireHistory: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!form.plateNumber) return;
     
     setIsSubmitting(true);
     setError('');

     try {
        await onSave({
            ...form as Vehicle,
            id: vehicle?.id || Date.now(),
            plateNumber: form.plateNumber.toUpperCase()
        });
     } catch (err: any) {
        const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        
        if (errMsg.includes("find the table") || errMsg.includes("42P01") || err?.code === 'PGRST205') {
            setError("Tabel Database belum dibuat. Silakan login admin dan buka menu Pengaturan > Database Setup.");
        } else {
            setError(errMsg);
        }
        setIsSubmitting(false);
     }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
         <div className="flex justify-between items-center p-6 border-b border-slate-700">
            <h3 className="text-xl font-bold text-white">
               {vehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
            </h3>
            <button onClick={onClose} disabled={isSubmitting}><X size={24} className="text-slate-400 hover:text-white"/></button>
         </div>
         <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertTriangle size={16} className="flex-shrink-0"/> <span>{error}</span></div>}
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Plat Nomor</label>
               <input 
                  type="text" required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase font-mono focus:ring-blue-500"
                  value={form.plateNumber}
                  onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Tipe Kendaraan</label>
               <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={form.vehicleType}
                  onChange={e => setForm({...form, vehicleType: e.target.value})}
               >
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Lainnya">Lainnya</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Departemen / Grup</label>
               <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={form.department}
                  onChange={e => setForm({...form, department: e.target.value})}
               >
                  {VEHICLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Nama Supir</label>
               <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={form.driver}
                  onChange={e => setForm({...form, driver: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
               <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as any})}
               >
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-Aktif</option>
               </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
               <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Simpan
               </button>
            </div>
         </form>
      </div>
    </div>
  );
};