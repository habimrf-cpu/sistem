import React, { useState, useEffect, useRef } from 'react';
import { dataService } from './services/dataService';
import { Tire, Transaction, Vehicle, BRAND_OPTIONS, SIZE_OPTIONS, VEHICLE_TYPES, VEHICLE_GROUPS } from './types';
import { StockView } from './components/StockView';
import { VehicleList } from './components/VehicleList';
import { StatisticsView } from './components/StatisticsView';
import { TransactionModal } from './components/TransactionModal';
import { Upload, Plus, Database, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { SettingsView } from './components/SettingsView';
import * as XLSX from 'xlsx';

// Tab Configuration
type Tab = 'stock' | 'vehicles' | 'statistics';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Centralized Data State
  const [tires, setTires] = useState<Tire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    // Check DB Connection
    dataService.checkDatabaseConnection().then(res => {
      if (res.error === 'missing_tables') setDbError(true);
    });

    // Subscriptions (Listen to real-time changes)
    const unsubTires = dataService.subscribeTires(setTires);
    const unsubTx = dataService.subscribeTransactions(setTransactions);
    const unsubVehicles = dataService.subscribeVehicles(setVehicles);

    return () => {
      unsubTires();
      unsubTx();
      unsubVehicles();
    };
  }, []);

  const handleRefresh = async () => {
    // Manual Refresh: Fetch data directly to ensure UI is in sync immediately
    const [freshTires, freshTx, freshVehicles] = await Promise.all([
      dataService.fetchTires(),
      dataService.fetchTransactions(),
      dataService.fetchVehicles()
    ]);
    
    setTires(freshTires);
    setTransactions(freshTx);
    setVehicles(freshVehicles);
    
    // Re-check DB status
    dataService.checkDatabaseConnection().then(res => setDbError(res.error === 'missing_tables'));
  };

  // --- IMPORT LOGIC ---
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        if (!bstr) return;

        try {
            const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            let successCount = 0;
            let failCount = 0;

            if (activeTab === 'stock') {
              // --- IMPORT STOK BAN ---
              for (const row of data as any[]) {
                  const sn = row['Nomor Seri'] || row['Serial'] || row['serialNumber'];
                  if (sn && await dataService.isSerialUnique(sn)) {
                      const finalSn = String(sn).toUpperCase();
                      const brand = row['Merk'] || row['Brand'] || BRAND_OPTIONS[0];
                      const size = row['Ukuran'] || row['Size'] || SIZE_OPTIONS[0];
                      const condition = row['Kondisi'] || 'Baru';
                      
                      // Date Parsing Logic
                      let dateIn = new Date().toISOString().split('T')[0];
                      const rawDate = row['Tanggal'] || row['Date'] || row['dateIn'] || row['Tanggal Masuk'];
                      
                      if (rawDate) {
                        if (rawDate instanceof Date) {
                          // If cell is already formatted as Date in Excel
                          const year = rawDate.getFullYear();
                          const month = String(rawDate.getMonth() + 1).padStart(2, '0');
                          const day = String(rawDate.getDate()).padStart(2, '0');
                          dateIn = `${year}-${month}-${day}`;
                        } else if (typeof rawDate === 'number') {
                          // Excel Serial Date
                          const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          dateIn = `${year}-${month}-${day}`;
                        } else {
                          // String parsing
                          const strDate = String(rawDate).trim();
                          
                          // Try parsing DD-MM-YYYY or DD/MM/YYYY
                          const parts = strDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
                          
                          if (parts) {
                             // parts[1]=DD, parts[2]=MM, parts[3]=YYYY -> Convert to YYYY-MM-DD
                             dateIn = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                          } else {
                             // Fallback to standard ISO or US format
                             const d = new Date(strDate);
                             if (!isNaN(d.getTime())) {
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                dateIn = `${year}-${month}-${day}`;
                             }
                          }
                        }
                      }

                      // 1. Save Tire
                      const newTire: Tire = {
                          id: Date.now() + Math.random(),
                          serialNumber: finalSn,
                          brand, size, condition,
                          status: 'available',
                          location: 'Gudang',
                          dateIn,
                          createdBy: 'Import',
                          updatedAt: Date.now()
                      };
                      await dataService.saveTire(newTire);

                      // 2. Create Transaction Log (Important for "Stock Transactions" view)
                      await dataService.addTransaction({
                         id: Date.now() + Math.random(),
                         type: 'in',
                         serialNumber: finalSn,
                         brand, size, condition,
                         date: dateIn,
                         user: 'Import',
                         notes: 'Bulk Import from Excel',
                         timestamp: Date.now()
                      });

                      successCount++;
                  } else {
                      failCount++;
                  }
              }
            } else if (activeTab === 'vehicles') {
               // --- IMPORT KENDARAAN ---
               for (const row of data as any[]) {
                  const plate = row['Plat Nomor'] || row['Plate'] || row['plateNumber'];
                  if (plate) {
                      const finalPlate = String(plate).toUpperCase();
                      const vType = row['Tipe'] || row['Type'] || VEHICLE_TYPES[0];
                      const dept = row['Departemen'] || row['Dept'] || VEHICLE_GROUPS[0];
                      const driver = row['Supir'] || row['Driver'] || 'Belum Ada';

                      await dataService.saveVehicle({
                          id: Date.now() + Math.random(),
                          plateNumber: finalPlate,
                          vehicleType: vType,
                          department: dept,
                          driver: driver,
                          status: 'active',
                          tireHistory: []
                      });
                      successCount++;
                  } else {
                      failCount++;
                  }
               }
            }

            alert(`Import ${activeTab === 'stock' ? 'Stok' : 'Kendaraan'} Selesai.\nBerhasil: ${successCount}\nGagal/Duplikat: ${failCount}`);
            handleRefresh(); // Instant Sync

        } catch (error) {
            console.error(error);
            alert("Gagal membaca file Excel. Pastikan format sesuai.");
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
     let headers = [];
     let filename = "";
     
     if (activeTab === 'vehicles') {
        headers = [['Plat Nomor', 'Tipe', 'Departemen', 'Supir']];
        filename = "Template_Kendaraan.xlsx";
     } else {
        // Updated Header with 'Tanggal'
        headers = [['Nomor Seri', 'Merk', 'Ukuran', 'Kondisi', 'Tanggal']];
        filename = "Template_Stok_Ban.xlsx";
     }

     const ws = XLSX.utils.aoa_to_sheet(headers);
     
     // Add example row for clarity with requested Date Format
     if (activeTab === 'stock') {
        XLSX.utils.sheet_add_json(ws, [
           {'Nomor Seri': 'SN12345', 'Merk': 'TMD 97', 'Ukuran': '11.00', 'Kondisi': 'Baru', 'Tanggal': '08-01-2026'}
        ], {skipHeader: true, origin: "A2"});
     }

     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Template");
     XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans p-4 md:p-8">
      
      {/* Hidden File Input */}
      <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* DB Warning */}
      {dbError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">Database Error: Tabel tidak ditemukan.</span>
          </div>
          <button onClick={() => setShowSettings(true)} className="text-sm underline font-bold hover:text-red-900">Fix Database</button>
        </div>
      )}

      {showSettings ? (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setShowSettings(false)} className="mb-4 text-slate-500 hover:text-slate-800 font-medium">&larr; Back to Dashboard</button>
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
            
            <div className="flex items-center gap-2">
               {/* Import Button (Dynamic for Stock & Vehicles) */}
               {(activeTab === 'stock' || activeTab === 'vehicles') && (
                 <div className="flex gap-2">
                    <button onClick={handleDownloadTemplate} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" title="Download Template Excel">
                       <FileSpreadsheet size={20} />
                    </button>
                    <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors shadow-sm">
                      <Upload size={18} />
                      Import {activeTab === 'stock' ? 'Stock' : 'Vehicles'}
                    </button>
                 </div>
               )}
               
               {activeTab === 'stock' && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm shadow-green-200"
                  >
                    <Plus size={18} />
                    New Transaction
                  </button>
               )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {[
              { id: 'stock', label: 'Stock Transactions' },
              { id: 'vehicles', label: 'Fleet / Vehicles' },
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