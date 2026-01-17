import React, { useMemo, useState } from 'react';
import { Tire, Transaction } from '../types';
import { Package, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, Layers, Tag, ChevronRight, Info, Calendar, Hash } from 'lucide-react';

interface DashboardProps {
  tires: Tire[];
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tires, transactions }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const stats = useMemo(() => {
    const available = tires.filter(t => t.status === 'available');
    const out = tires.filter(t => t.status === 'out');
    const critical = available.length < 5; // Alert logic

    return { available: available.length, out: out.length, critical };
  }, [tires]);

  // Calculate generic stock breakdown (Size only for the main list)
  const sizeBreakdown = useMemo(() => {
    const available = tires.filter(t => t.status === 'available');
    const bySize: Record<string, number> = {};

    available.forEach(t => {
       const size = t.size || 'Tanpa Ukuran';
       bySize[size] = (bySize[size] || 0) + 1;
    });

    return bySize;
  }, [tires]);

  // Get Specific Tires List for Selected Size
  const tiresForSize = useMemo(() => {
    if (!selectedSize) return [];

    return tires
      .filter(t => t.status === 'available' && t.size === selectedSize)
      // Sort by dateIn descending (newest first)
      .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());
  }, [tires, selectedSize]);

  // Get recent 10 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 10);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Lightweight Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-3">
            <Package size={32} />
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Sisa Stok Ban</p>
          <h3 className={`text-4xl font-bold mt-2 ${stats.critical ? 'text-red-500' : 'text-emerald-400'}`}>
            {stats.available}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Unit Tersedia</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-orange-500/10 rounded-full text-orange-500 mb-3">
            <TrendingDown size={32} />
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Total Keluar</p>
          <h3 className="text-4xl font-bold text-orange-400 mt-2">{stats.out}</h3>
          <p className="text-xs text-slate-500 mt-1">Unit Terpasang</p>
        </div>
      </div>

      {/* Main Stock Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Stock per Size (Interactive) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col h-[400px]">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3 flex-shrink-0">
              <Layers size={18} className="text-purple-400"/>
              <h4 className="font-bold text-white">Stok per Ukuran</h4>
           </div>
           
           <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-xs text-slate-500 mb-2">Klik pada ukuran untuk melihat daftar serial number.</p>
              {Object.keys(sizeBreakdown).length > 0 ? (
                  (Object.entries(sizeBreakdown) as [string, number][])
                    .sort(([,a], [,b]) => b - a)
                    .map(([size, count]) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button 
                        key={size} 
                        onClick={() => setSelectedSize(isSelected ? null : size)}
                        className={`w-full flex justify-between items-center text-sm p-3 rounded-lg transition-all border ${
                          isSelected 
                            ? 'bg-purple-500/20 border-purple-500/50' 
                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400' : 'bg-slate-600'}`}></div>
                             <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{size}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded min-w-[30px] text-center shadow-sm border border-slate-700">
                                {count}
                              </span>
                              <ChevronRight size={16} className={`transition-transform ${isSelected ? 'text-purple-400 rotate-90' : 'text-slate-600'}`} />
                          </div>
                      </button>
                    )})
              ) : (
                  <p className="text-slate-500 text-sm italic py-4 text-center">Belum ada data stok.</p>
              )}
           </div>
        </div>

        {/* Card 2: Serial Number List (Details) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col h-[400px]">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3 flex-shrink-0">
              <Hash size={18} className="text-blue-400"/>
              <h4 className="font-bold text-white truncate">
                {selectedSize ? `Rincian: ${selectedSize}` : 'Rincian Serial Number'}
              </h4>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {selectedSize ? (
                <div className="space-y-2 animate-fade-in">
                  {tiresForSize.length > 0 ? (
                    tiresForSize.map((tire) => (
                        <div key={tire.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-700 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                                    {tire.serialNumber}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    tire.condition === 'Baru' 
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {tire.condition}
                                </span>
                            </div>
                            <div className="flex justify-between items-end text-xs text-slate-400">
                                <div className="flex flex-col">
                                    <span className="flex items-center gap-1"><Tag size={10} /> {tire.brand}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-70">
                                    <Calendar size={10} /> {tire.dateIn}
                                </div>
                            </div>
                        </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm italic text-center py-8">Tidak ada data untuk ukuran ini.</p>
                  )}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                   <Info size={48} className="text-slate-700 mb-3" />
                   <p className="text-sm">Pilih ukuran ban di sebelah kiri untuk melihat daftar Nomor Seri yang tersedia.</p>
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Clock size={18} className="text-slate-400" />
          <h3 className="font-bold text-white">Riwayat Terakhir (Masuk/Keluar)</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-750 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {tx.type === 'in' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="text-white font-mono font-bold">{tx.serialNumber}</p>
                    <p className="text-xs text-slate-400">{tx.size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{tx.date}</p>
                  <p className="text-sm font-medium text-white">
                    {tx.type === 'in' ? 'Stok Masuk' : tx.plateNumber || 'Keluar'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">Belum ada riwayat transaksi.</div>
          )}
        </div>
      </div>
    </div>
  );
};