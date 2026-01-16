import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Truck, History, Settings, Package, Menu, X, Database, LogOut, CheckCircle, Edit, Trash2,
  Search, Plus, Upload, Download, FileSpreadsheet
} from 'lucide-react';
import { Tire, Transaction, Vehicle, ViewState, VEHICLE_GROUPS, VEHICLE_TYPES } from './types';
import { dataService } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { TireManager } from './components/TireComponents';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Logo } from './components/Logo';

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tires, setTires] = useState<Tire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Load Data
  const refreshData = () => {
    setTires(dataService.getTires());
    setTransactions(dataService.getTransactions());
    setVehicles(dataService.getVehicles());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Notification helper
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (msg: string, type: 'success'|'error' = 'success') => {
      setNotification({ message: msg, type });
  };

  // Views
  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return <Dashboard tires={tires} transactions={transactions} />;
      case 'stock':
        return <TireManager 
                 tires={tires} 
                 vehicles={vehicles}
                 onRefresh={() => {refreshData(); showNotification("Data berhasil diperbarui");}} 
                 onAddTransaction={(t) => {
                    // Transaction logic handled in component but we can show toast here
                 }}
               />;
      case 'transactions':
        return <TransactionHistory transactions={transactions} />;
      case 'vehicles':
        return <VehicleList vehicles={vehicles} onRefresh={() => {refreshData(); showNotification("Data kendaraan diperbarui");}} />;
      case 'settings':
        return <SettingsView onRestore={refreshData} />;
      default:
        return <Dashboard tires={tires} transactions={transactions} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        activeView === view 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex overflow-hidden">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        } no-print`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            {notification.message}
        </div>
      )}

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm no-print"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 
        transform transition-transform duration-300 ease-in-out no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
             <Logo className="w-10 h-10 text-blue-500" />
             <div>
               <h1 className="text-lg font-bold text-white tracking-tight">Bengkel Kerinci</h1>
               <p className="text-xs text-slate-500">Inventory System</p>
             </div>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-4 px-2">Menu Utama</p>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="stock" icon={Package} label="Data Stok Ban" />
            <NavItem view="transactions" icon={History} label="Riwayat Transaksi" />
            <NavItem view="vehicles" icon={Truck} label="Data Kendaraan" />
            
            <p className="text-xs font-semibold text-slate-500 uppercase mt-8 mb-4 px-2">Sistem</p>
            <NavItem view="settings" icon={Settings} label="Pengaturan & Backup" />
          </nav>

          <div className="p-4 border-t border-slate-800">
             <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500">Developed by</p>
                <p className="text-sm font-bold text-blue-400">Habifeb</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-10 no-print">
           <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300">
             <Menu size={24} />
           </button>
           <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="font-bold text-white">Bengkel Kerinci</span>
           </div>
           <div className="w-6" /> 
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
           <div className="max-w-7xl mx-auto pb-10 print:pb-0 print:max-w-none">
              <div className="mb-6 flex justify-between items-end no-print">
                <div>
                   <h2 className="text-2xl font-bold text-white capitalize">
                      {activeView === 'stock' ? 'Manajemen Stok Ban' : 
                       activeView === 'transactions' ? 'Riwayat Transaksi' :
                       activeView === 'vehicles' ? 'Database Kendaraan' : 
                       activeView === 'settings' ? 'Pengaturan' : 'Dashboard'}
                   </h2>
                   <p className="text-slate-400 text-sm mt-1">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                   </p>
                </div>
                <div className="hidden md:block">
                  <span className="text-slate-500 text-sm">Lokasi: </span>
                  <span className="text-white font-semibold bg-slate-800 px-3 py-1 rounded-full text-sm">Bengkel Krc</span>
                </div>
              </div>
              
              {renderContent()}
           </div>
           
           {/* Watermark Footer */}
           <div className="mt-auto py-6 text-center text-xs text-slate-600 border-t border-slate-800/50 no-print">
             &copy; {new Date().getFullYear()} Aplikasi ini dikembangkan oleh Habifeb
           </div>
        </div>
      </main>
    </div>
  );
}

// --- Simplified Sub-Views for App.tsx ---

const TransactionHistory = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300 print:text-black">
          <thead className="bg-slate-900 text-slate-400 uppercase font-medium print:bg-slate-200 print:text-black">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Tipe</th>
              <th className="px-6 py-4">Ban</th>
              <th className="px-6 py-4">Keterangan</th>
              <th className="px-6 py-4">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 print:divide-slate-300">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-750 print:hover:bg-transparent">
                <td className="px-6 py-4 text-slate-400 print:text-black">
                  {tx.date}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase print:border print:border-black ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500 print:text-black' : 'bg-orange-500/10 text-orange-500 print:text-black'}`}>
                    {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-white print:text-black">{tx.serialNumber}</div>
                  <div className="text-xs text-slate-500 print:text-slate-600">{tx.size}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-white print:text-black">{tx.plateNumber || '-'}</div>
                   <div className="text-xs text-slate-500 print:text-slate-600">{tx.notes}</div>
                </td>
                <td className="px-6 py-4 print:text-black">{tx.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const VehicleList = ({ vehicles, onRefresh }: { vehicles: Vehicle[], onRefresh: () => void }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
   const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const filteredVehicles = vehicles.filter(v => 
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleDeleteClick = (id: number) => {
       setConfirmDeleteId(id);
   }

   const confirmDelete = () => {
       if (confirmDeleteId !== null) {
           dataService.deleteVehicle(confirmDeleteId);
           setConfirmDeleteId(null);
           onRefresh();
       }
   }

   // --- Export Excel ---
   const handleExportExcel = () => {
      const dataToExport = filteredVehicles.map(v => ({
         'Plat Nomor': v.plateNumber,
         'Supir': v.driver,
         'Tipe': v.vehicleType,
         'Departemen': v.department,
         'Ban Terakhir': v.tireHistory.length > 0 ? v.tireHistory[v.tireHistory.length-1].serialNumber : '-',
         'Status': v.status
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kendaraan");
      XLSX.writeFile(wb, "Data_Kendaraan_Kerinci.xlsx");
   };

   // --- Download Template ---
   const handleDownloadTemplate = () => {
      const headers = [['Plat Nomor', 'Nama Supir', 'Tipe (FAW/FUSO)', 'Departemen']];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      XLSX.utils.sheet_add_json(ws, [
         {'Plat Nomor': 'B 1234 ABC', 'Nama Supir': 'Contoh Supir', 'Tipe (FAW/FUSO)': 'FUSO', 'Departemen': 'RKI'}
      ], {skipHeader: true, origin: "A2"});
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Kendaraan");
      XLSX.writeFile(wb, "Template_Import_Kendaraan.xlsx");
   };

   // --- Import Excel ---
   const handleImportClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          if (!bstr) return;

          try {
              const wb = XLSX.read(bstr, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data = XLSX.utils.sheet_to_json(ws);
              
              let count = 0;
              data.forEach((row: any) => {
                 const plat = row['Plat Nomor'] || row['plateNumber'];
                 if(plat) {
                     // Check existing to avoid duplicates (optional, here we allow update if exists or skip)
                     // Simple implementation: Just add/update based on Plate
                     const existing = vehicles.find(v => v.plateNumber === plat.toUpperCase());
                     const v: Vehicle = {
                         id: existing ? existing.id : Date.now() + Math.random(),
                         plateNumber: plat.toUpperCase(),
                         driver: row['Nama Supir'] || row['driver'] || '',
                         vehicleType: row['Tipe (FAW/FUSO)'] || row['vehicleType'] || VEHICLE_TYPES[0],
                         department: row['Departemen'] || row['department'] || VEHICLE_GROUPS[0],
                         status: 'active',
                         tireHistory: existing ? existing.tireHistory : []
                     };
                     dataService.saveVehicle(v);
                     count++;
                 }
              });
              alert(`Berhasil import ${count} data kendaraan.`);
              onRefresh();
          } catch(err) {
              console.error(err);
              alert("Gagal import file.");
          } finally {
              if(fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsBinaryString(file);
   };

   return (
    <div className="space-y-6">
       {/* Hidden File Input */}
       <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md no-print">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari Plat Nomor / Supir..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <button onClick={() => {setEditingVehicle(null); setIsFormOpen(true);}} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={16} /> Tambah
             </button>
             <button onClick={handleImportClick} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Upload size={16} /> Import
             </button>
             <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <FileSpreadsheet size={16} /> Export
             </button>
             <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg" title="Download Template">
                <Download size={18} />
             </button>
          </div>
       </div>

       {/* List View (Table) */}
       <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
               <thead className="bg-slate-900 text-slate-400 uppercase font-medium">
                  <tr>
                     <th className="px-6 py-4">Plat Nomor</th>
                     <th className="px-6 py-4">Supir</th>
                     <th className="px-6 py-4">Tipe & Dept</th>
                     <th className="px-6 py-4">Ban Terakhir</th>
                     <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                  {filteredVehicles.length > 0 ? filteredVehicles.map(v => (
                     <tr key={v.id} className="hover:bg-slate-750 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-white">{v.plateNumber}</td>
                        <td className="px-6 py-4">{v.driver || '-'}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-white">{v.vehicleType}</span>
                              <span className="text-xs text-slate-500 bg-slate-900 px-1 py-0.5 rounded w-fit mt-1">{v.department}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {v.tireHistory.length > 0 ? (
                              <div className="flex items-center gap-1 text-emerald-400 font-mono">
                                 <CheckCircle size={14}/> {v.tireHistory[v.tireHistory.length-1].serialNumber}
                              </div>
                           ) : <span className="text-slate-600 italic">Belum ada</span>}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex justify-center gap-2">
                              <button onClick={() => {setEditingVehicle(v); setIsFormOpen(true);}} className="p-1.5 hover:bg-slate-700 rounded text-blue-400" title="Edit"><Edit size={16}/></button>
                              <button onClick={() => handleDeleteClick(v.id)} className="p-1.5 hover:bg-slate-700 rounded text-red-400" title="Hapus"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                           Tidak ada data kendaraan yang ditemukan.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
       </div>

       {/* Combined Add/Edit Modal */}
       {isFormOpen && (
         <VehicleFormModal 
            vehicle={editingVehicle}
            onClose={() => {setIsFormOpen(false); setEditingVehicle(null);}}
            onSave={(updated) => {
               dataService.saveVehicle(updated);
               setIsFormOpen(false);
               setEditingVehicle(null);
               onRefresh();
            }}
         />
       )}
       
       <ConfirmationModal 
          isOpen={confirmDeleteId !== null}
          title="Hapus Kendaraan"
          message="Apakah Anda yakin ingin menghapus data kendaraan ini? Data yang dihapus tidak dapat dikembalikan."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
       />
    </div>
   );
};

// Reused for Add and Edit
const VehicleFormModal = ({ vehicle, onClose, onSave }: { vehicle: Vehicle | null, onClose: () => void, onSave: (v: Vehicle) => void }) => {
  const [form, setForm] = useState<Vehicle>(vehicle || {
      id: Date.now(),
      plateNumber: '',
      driver: '',
      vehicleType: VEHICLE_TYPES[0],
      department: VEHICLE_GROUPS[0],
      status: 'active',
      tireHistory: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.plateNumber) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[55] backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {vehicle ? <Edit className="text-blue-500" /> : <Plus className="text-emerald-500" />} 
            {vehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Plat Nomor *</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase font-mono tracking-wider focus:ring-2 focus:ring-blue-500"
              value={form.plateNumber}
              onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nama Supir</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
              value={form.driver}
              onChange={e => setForm({...form, driver: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Jenis Mobil</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  value={form.vehicleType}
                  onChange={e => setForm({...form, vehicleType: e.target.value})}
                >
                   {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Departemen</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                 >
                    {VEHICLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
             <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                 {vehicle ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsView = ({ onRestore }: { onRestore: () => void }) => {
   const [backupData, setBackupData] = useState('');
   
   const handleBackup = () => {
      const data = dataService.createBackup();
      const blob = new Blob([data], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WMS-BACKUP-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
   };

   const handleRestore = () => {
      if(window.confirm("Restore akan menimpa data saat ini. Lanjutkan?")) {
         if(dataService.restoreBackup(backupData)) {
            alert("Restore Berhasil!");
            onRestore();
            setBackupData('');
         } else {
            alert("Format JSON tidak valid");
         }
      }
   }

   return (
      <div className="max-w-2xl mx-auto space-y-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Backup Data</h3>
            <p className="text-slate-400 text-sm mb-4">Unduh semua data ban, transaksi, dan kendaraan dalam format JSON untuk keamanan.</p>
            <button onClick={handleBackup} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full flex justify-center gap-2">
               <Database size={18} /> Download Backup
            </button>
         </div>

         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Restore Data</h3>
            <p className="text-slate-400 text-sm mb-4">Paste isi file JSON backup di sini untuk mengembalikan data.</p>
            <textarea 
               className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-300 mb-4"
               placeholder='Paste JSON content here...'
               value={backupData}
               onChange={e => setBackupData(e.target.value)}
            ></textarea>
            <button onClick={handleRestore} disabled={!backupData} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg w-full flex justify-center gap-2">
               <LogOut size={18} /> Restore Database
            </button>
         </div>
      </div>
   );
};

export default App;