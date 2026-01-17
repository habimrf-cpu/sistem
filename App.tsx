import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, History, Settings, Package, Menu, X, CheckCircle, LogIn, LogOut, Cloud, AlertTriangle, Database
} from 'lucide-react';

import { Tire, Transaction, Vehicle, ViewState } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { useProfile } from './hooks/useProfile';

import { Dashboard } from './components/Dashboard';
import { TireManager } from './components/TireComponents';
import { TransactionHistory } from './components/TransactionHistory';
import { VehicleList } from './components/VehicleList';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { Logo } from './components/Logo';

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Data State
  const [tires, setTires] = useState<Tire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  // System State
  const [dbStatus, setDbStatus] = useState<'ok' | 'missing_tables'>('ok');

  // Auth State
  const { user, loading: authLoading, isAdmin } = useProfile();

  // --- REAL-TIME SYNC SETUP ---
  useEffect(() => {
    // 1. Check DB Connection First
    dataService.checkDatabaseConnection().then(result => {
       if (!result.connected && result.error === 'missing_tables') {
          setDbStatus('missing_tables');
          setActiveView('settings'); // Redirect to settings for setup
       }
    });

    // 2. Subscribe
    const unsubTires = dataService.subscribeTires(setTires);
    const unsubTx = dataService.subscribeTransactions(setTransactions);
    const unsubVehicles = dataService.subscribeVehicles(setVehicles);

    return () => {
        unsubTires();
        unsubTx();
        unsubVehicles();
    };
  }, []);

  // Notification helper
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); 
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (msg: string, type: 'success'|'error' = 'success') => {
      setNotification({ message: msg, type });
  };

  const handleLogout = async () => {
    await authService.logout();
    setActiveView('dashboard'); 
    showNotification('Berhasil logout');
  };

  const handleManualRefresh = () => {
    // Data refreshes automatically via subscription
    // Re-check DB status on manual refresh
    dataService.checkDatabaseConnection().then(result => {
        setDbStatus(result.connected || result.error !== 'missing_tables' ? 'ok' : 'missing_tables');
    });
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
                 user={user} 
                 onRefresh={handleManualRefresh} 
                 onAddTransaction={() => {}}
               />;
      case 'transactions':
        return <TransactionHistory 
                  transactions={transactions} 
                  user={user}
                  onRefresh={handleManualRefresh}
               />;
      case 'vehicles':
        return <VehicleList 
                  vehicles={vehicles} 
                  user={user}
                  onRefresh={handleManualRefresh} 
               />;
      case 'settings':
        return isAdmin ? <SettingsView onRestore={handleManualRefresh} /> : <div className="text-center p-10 text-slate-500">Akses Ditolak</div>;
      default:
        return <Dashboard tires={tires} transactions={transactions} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label, hidden = false }: { view: ViewState, icon: any, label: string, hidden?: boolean }) => {
    if (hidden) return null;
    return (
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
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex overflow-hidden">
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-lg shadow-xl flex items-start gap-3 animate-bounce max-w-sm ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        } no-print`}>
            {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <X size={20} className="mt-0.5" />}
            <span className="text-sm font-medium">{notification.message}</span>
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
        transform transition-transform duration-300 ease-in-out no-print flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <Logo className="w-10 h-10 text-blue-500" />
           <div>
             <h1 className="text-lg font-bold text-white tracking-tight">Bengkel Kerinci</h1>
             <p className="text-xs text-slate-500">Inventory System</p>
           </div>
        </div>
        
        {/* Status Indicator */}
        <div className="bg-slate-900 mx-4 mt-4 p-2 rounded border border-blue-900/50 flex items-center gap-2 justify-center">
           <div className="relative">
              <Cloud size={16} className="text-blue-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
           </div>
           <span className="text-[10px] text-blue-200 font-medium">Supabase Connected</span>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Utama</p>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="stock" icon={Package} label="Stok Ban" />
            <NavItem view="transactions" icon={History} label="Riwayat" />
            <NavItem view="vehicles" icon={Truck} label="Kendaraan" />
          </div>
          
          {isAdmin && (
             <div>
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
                <NavItem view="settings" icon={Settings} label="Pengaturan" />
             </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
           {authLoading ? (
             <div className="text-center text-xs text-slate-500">Loading auth...</div>
           ) : user ? (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                       {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-sm font-bold text-white truncate capitalize">{user.name}</p>
                       <p className="text-xs text-emerald-400 font-medium">Administrator</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center justify-center gap-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-2 rounded-lg transition-colors"
                 >
                   <LogOut size={14} /> Keluar
                 </button>
              </div>
           ) : (
              <div className="text-center">
                 <p className="text-xs text-slate-500 mb-3">Mode Tamu (Read Only)</p>
                 <button 
                   onClick={() => setIsLoginModalOpen(true)}
                   className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 font-bold py-2 rounded-lg hover:bg-blue-600 hover:border-blue-500 transition-all"
                 >
                    <LogIn size={16} /> Login Admin
                 </button>
              </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900">
        <header className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
             <Logo className="w-8 h-8 text-blue-500" />
             <span className="font-bold text-white">Bengkel Kerinci</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400">
            <Menu size={24} />
          </button>
        </header>
        
        {/* Missing Tables Warning Banner */}
        {dbStatus === 'missing_tables' && (
           <div className="bg-red-600 text-white p-3 flex items-center justify-center gap-3 shadow-lg z-50 animate-pulse no-print">
              <Database size={24} />
              <div className="text-sm">
                 <span className="font-bold text-lg">PERHATIAN: Tabel Database Belum Dibuat!</span>
                 <p className="opacity-90">Aplikasi tidak menemukan tabel <b>'tires'</b>. Tabel 'Bengkel' yang Anda buat tidak sesuai format.</p>
              </div>
              {isAdmin ? (
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors ml-4"
                  >
                    Buka Setup Database
                  </button>
              ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors ml-4"
                  >
                    Login Admin untuk Setup
                  </button>
              )}
           </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
           <div className="max-w-7xl mx-auto pb-20">
              {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
}

export default App;