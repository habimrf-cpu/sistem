import React, { useState, useEffect } from 'react';
import { dataService } from './services/dataService';
import { Tire, Transaction, Vehicle } from './types';
import { StockView } from './components/StockView';
import { VehicleList } from './components/VehicleList';
import { StatisticsView } from './components/StatisticsView';
import { TransactionModal } from './components/TransactionModal';
import { Upload, Plus, Database, AlertCircle } from 'lucide-react';
import { SettingsView } from './components/SettingsView';

// Tab Configuration
type Tab = 'stock' | 'vehicles' | 'statistics';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Centralized Data State
  const [tires, setTires] = useState<Tire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    // Check DB
    dataService.checkDatabaseConnection().then(res => {
      if (res.error === 'missing_tables') setDbError(true);
    });

    // Subscriptions
    const unsubTires = dataService.subscribeTires(setTires);
    const unsubTx = dataService.subscribeTransactions(setTransactions);
    const unsubVehicles = dataService.subscribeVehicles(setVehicles);

    return () => {
      unsubTires();
      unsubTx();
      unsubVehicles();
    };
  }, []);

  const handleRefresh = () => {
    // Subscriptions handle real-time, but we can force re-check DB
    dataService.checkDatabaseConnection().then(res => setDbError(res.error === 'missing_tables'));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans p-4 md:p-8">
      
      {/* DB Warning Banner */}
      {dbError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">Database Error: Tabel tidak ditemukan.</span>
          </div>
          <button onClick={() => setShowSettings(true)} className="text-sm underline font-bold hover:text-red-900">
            Fix Database
          </button>
        </div>
      )}

      {showSettings ? (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setShowSettings(false)} className="mb-4 text-slate-500 hover:text-slate-800 font-medium">
            &larr; Back to Dashboard
          </button>
          <SettingsView onRestore={handleRefresh} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Tire Inventory Management</h1>
              <p className="text-slate-500 mt-1">Manage your tire stock and vehicle data</p>
            </div>
            
            <div className="flex items-center gap-3">
               {activeTab === 'stock' && (
                 <>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors shadow-sm">
                    <Upload size={18} />
                    Import
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm shadow-green-200"
                  >
                    <Plus size={18} />
                    New Transaction
                  </button>
                 </>
               )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {[
              { id: 'stock', label: 'Stock' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'statistics', label: 'Statistics' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-primary-500 text-primary-700 bg-primary-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                {activeTab === tab.id && <span className="mr-2">📦</span>}
                {tab.label}
              </button>
            ))}
             <div className="flex-1"></div>
             <button onClick={() => setShowSettings(true)} className="px-4 py-3 text-slate-400 hover:text-slate-600">
                <Database size={18} />
             </button>
          </div>

          {/* Main Content Area */}
          <div className="animate-fade-in">
            {activeTab === 'stock' && (
              <StockView transactions={transactions} tires={tires} />
            )}
            {activeTab === 'vehicles' && (
              <VehicleList vehicles={vehicles} onRefresh={handleRefresh} />
            )}
            {activeTab === 'statistics' && (
              <StatisticsView tires={tires} transactions={transactions} />
            )}
          </div>

        </div>
      )}

      {/* New Transaction Modal */}
      {isModalOpen && (
        <TransactionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vehicles={vehicles}
          existingTires={tires.filter(t => t.status === 'available')}
          onSuccess={handleRefresh}
        />
      )}

    </div>
  );
}

export default App;