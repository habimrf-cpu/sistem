import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, History, Settings, Package, Menu, X, Database, LogOut, CheckCircle, Edit, Trash2
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
        return <VehicleList vehicles={vehicles} onRefresh={refreshData} />;
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
   const [form, setForm] = useState({
      plateNumber: '',
      driver: '',
      vehicleType: VEHICLE_TYPES[0],
      department: VEHICLE_GROUPS[0]
   });

   // Edit state
   const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
   // Delete confirmation state
   const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

   const handleAdd = () => {
      if(!form.plateNumber) return;
      const v: Vehicle = {
          id: Date.now(),
          plateNumber: form.plateNumber.toUpperCase(),
          vehicleType: form.vehicleType,
          department: form.department,
          driver: form.driver,
          status: 'active',
          tireHistory: []
      }
      dataService.saveVehicle(v);
      setForm({ plateNumber: '', driver: '', vehicleType: VEHICLE_TYPES[0], department: VEHICLE_GROUPS[0] });
      onRefresh();
   }

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

   return (
    <div className="space-y-6">
       <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 no-print">
          <h3 className="text-lg font-bold text-white mb-4">Tambah Kendaraan Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             <input 
               type="text" 
               placeholder="Plat Nomor" 
               className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase"
               value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value})}
             />
             <input 
               type="text" 
               placeholder="Nama Supir" 
               className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
               value={form.driver} onChange={e => setForm({...form, driver: e.target.value})}
             />
             <select 
               className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
               value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})}
             >
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <select 
                className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.department} onChange={e => setForm({...form, department: e.target.value})}
             >
                {VEHICLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
             </select>
             <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                Tambah
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:block print:space-y-4">
          {vehicles.map(v => (
             <div key={v.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl group relative print:bg-white print:border-slate-300 print:text-black print:mb-4 print:break-inside-avoid">
                <div className="flex justify-between items-start">
                   <h3 className="text-xl font-bold text-white font-mono print:text-black">{v.plateNumber}</h3>
                   <div className="flex items-center gap-2 no-print">
                      <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{v.department}</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingVehicle(v); }} className="p-1 hover:bg-slate-700 rounded text-blue-400" title="Edit"><Edit size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(v.id); }} className="p-1 hover:bg-slate-700 rounded text-red-400" title="Hapus"><Trash2 size={16}/></button>
                   </div>
                </div>
                <div className="mt-2 text-sm">
                  <p className="text-slate-400 print:text-slate-700">Driver: <span className="text-white print:text-black">{v.driver || '-'}</span></p>
                  <p className="text-slate-400 print:text-slate-700">Tipe: <span className="text-white print:text-black">{v.vehicleType || '-'}</span></p>
                  <p className="text-slate-400 print:text-slate-700 print:block hidden">Dept: <span className="text-white print:text-black">{v.department}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700 print:border-slate-300">
                   <p className="text-xs text-slate-500 print:text-slate-600">Ban Terpasang Terakhir:</p>
                   {v.tireHistory.length > 0 ? (
                      <p className="text-sm text-white font-mono mt-1 print:text-black">{v.tireHistory[v.tireHistory.length-1].serialNumber}</p>
                   ) : <p className="text-sm text-slate-600 italic">Belum ada history</p>}
                </div>
             </div>
          ))}
       </div>

       {editingVehicle && (
         <VehicleEditModal 
            vehicle={editingVehicle}
            onClose={() => setEditingVehicle(null)}
            onSave={(updated) => {
               dataService.saveVehicle(updated);
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

const VehicleEditModal = ({ vehicle, onClose, onSave }: { vehicle: Vehicle, onClose: () => void, onSave: (v: Vehicle) => void }) => {
  const [form, setForm] = useState(vehicle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[55] backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="text-blue-500" /> Edit Kendaraan
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Plat Nomor</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase"
              value={form.plateNumber}
              onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
            />
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
            <label className="block text-sm font-medium text-slate-400 mb-1">Jenis Mobil</label>
            <select 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              value={form.vehicleType}
              onChange={e => setForm({...form, vehicleType: e.target.value})}
            >
               {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Departemen</label>
             <select 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.department} onChange={e => setForm({...form, department: e.target.value})}
             >
                {VEHICLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
             </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
             <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Simpan</button>
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