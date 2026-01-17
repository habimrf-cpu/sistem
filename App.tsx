import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, History, Settings, Package, Menu, X, CheckCircle, LogIn, LogOut
} from 'lucide-react';
import { GoogleOAuthProvider, googleLogout, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import { Tire, Transaction, Vehicle, ViewState, UserProfile } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { Dashboard } from './components/Dashboard';
import { TireManager } from './components/TireComponents';
import { TransactionHistory } from './components/TransactionHistory';
import { VehicleList } from './components/VehicleList';
import { SettingsView } from './components/SettingsView';
import { Logo } from './components/Logo';

// Client ID untuk Google OAuth (Bengkel Kerinci)
const GOOGLE_CLIENT_ID = "1007543822536-dmnmdepgjqg055rmnn95gsg76h8iaqsb.apps.googleusercontent.com";

function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tires, setTires] = useState<Tire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);

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

  // Auth Handlers
  const handleLoginSuccess = (response: any) => {
    try {
      if (!response.credential) {
         throw new Error("No credential received");
      }
      const decoded: any = jwtDecode(response.credential);
      const email = decoded.email;
      const role = authService.getRole(email);
      
      const userProfile: UserProfile = {
        email: email,
        name: decoded.name,
        picture: decoded.picture,
        role: role
      };

      setUser(userProfile);
      showNotification(`Selamat datang, ${decoded.name} (${role === 'admin' ? 'Admin' : 'User'})`);
    } catch (error) {
      console.error('Login Failed', error);
      showNotification('Gagal login', 'error');
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setActiveView('dashboard'); // Reset to safe view
    showNotification('Berhasil logout');
  };

  const isAdmin = user?.role === 'admin';

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
                 onRefresh={() => {refreshData(); showNotification("Data berhasil diperbarui");}} 
                 onAddTransaction={() => {
                     // Transaction handled internally now, but we trigger refresh
                     refreshData();
                 }}
               />;
      case 'transactions':
        return <TransactionHistory 
                  transactions={transactions} 
                  user={user}
                  onRefresh={() => {refreshData(); showNotification("Data transaksi diperbarui");}}
               />;
      case 'vehicles':
        return <VehicleList 
                  vehicles={vehicles} 
                  user={user}
                  onRefresh={() => {refreshData(); showNotification("Data kendaraan diperbarui");}} 
               />;
      case 'settings':
        return isAdmin ? <SettingsView onRestore={refreshData} /> : <div className="text-center p-10 text-slate-500">Akses Ditolak</div>;
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
             {user ? (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                   <div className="flex items-center gap-3 mb-3">
                      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-slate-600" />
                      <div className="overflow-hidden">
                         <p className="text-sm font-bold text-white truncate">{user.name}</p>
                         <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                      </div>
                   </div>
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center justify-center gap-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-2 rounded-lg transition-colors"
                   >
                     <LogOut size={14} /> Sign Out
                   </button>
                </div>
             ) : (
                <div className="text-center">
                   <p className="text-xs text-slate-500 mb-3">Login untuk akses penuh</p>
                   <div className="flex justify-center">
                      <GoogleLogin 
                        onSuccess={handleLoginSuccess}
                        onError={() => showNotification("Login gagal", "error")}
                        theme="filled_blue"
                        shape="circle"
                        width="200"
                        text="signin_with"
                      />
                   </div>
                </div>
             )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900">
          {/* Header Mobile */}
          <header className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
               <Logo className="w-8 h-8 text-blue-500" />
               <span className="font-bold text-white">Bengkel Kerinci</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400">
              <Menu size={24} />
            </button>
          </header>

          {/* Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
             <div className="max-w-7xl mx-auto pb-20">
                {renderContent()}
             </div>
          </div>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;