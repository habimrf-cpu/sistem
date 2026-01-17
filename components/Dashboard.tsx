import React, { useMemo } from 'react';
import { Tire, Transaction } from '../types';
import { Package, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Tag } from 'lucide-react';

interface DashboardProps {
  tires: Tire[];
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tires, transactions }) => {
  
  const stats = useMemo(() => {
    const available = tires.filter(t => t.status === 'available');
    const out = tires.filter(t => t.status === 'out');
    const critical = available.length < 5; // Alert logic

    return { available: available.length, out: out.length, critical };
  }, [tires]);

  const stockBreakdown = useMemo(() => {
    const available = tires.filter(t => t.status === 'available');
    const byBrand: Record<string, number> = {};
    const bySize: Record<string, number> = {};

    available.forEach(t => {
       const brand = (t.brand || 'Tanpa Merk').toUpperCase();
       byBrand[brand] = (byBrand[brand] || 0) + 1;

       const size = t.size || 'Tanpa Ukuran';
       bySize[size] = (bySize[size] || 0) + 1;
    });

    return { byBrand, bySize };
  }, [tires]);

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

      {/* Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
              <Tag size={18} className="text-blue-400"/>
              <h4 className="font-bold text-white">Stok per Merk</h4>
           </div>
           <div className="space-y-3">
              {Object.keys(stockBreakdown.byBrand).length > 0 ? (
                  (Object.entries(stockBreakdown.byBrand) as [string, number][])
                    .sort(([,a], [,b]) => b - a)
                    .map(([brand, count]) => (
                    <div key={brand} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{brand}</span>
                        <div className="flex items-center">
                            <div className="w-24 h-2 bg-slate-700 rounded-full mr-3 overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${stats.available > 0 ? (count / stats.available) * 100 : 0}%` }}></div>
                            </div>
                            <span className="font-mono font-bold text-white bg-slate-700 px-2 py-0.5 rounded min-w-[30px] text-center">{count}</span>
                        </div>
                    </div>
                  ))
              ) : (
                  <p className="text-slate-500 text-sm italic">Belum ada data stok.</p>
              )}
           </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
              <Layers size={18} className="text-purple-400"/>
              <h4 className="font-bold text-white">Stok per Ukuran</h4>
           </div>
           <div className="space-y-3">
              {Object.keys(stockBreakdown.bySize).length > 0 ? (
                  (Object.entries(stockBreakdown.bySize) as [string, number][])
                    .sort(([,a], [,b]) => b - a)
                    .map(([size, count]) => (
                    <div key={size} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{size}</span>
                         <div className="flex items-center">
                            <div className="w-24 h-2 bg-slate-700 rounded-full mr-3 overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${stats.available > 0 ? (count / stats.available) * 100 : 0}%` }}></div>
                            </div>
                            <span className="font-mono font-bold text-white bg-slate-700 px-2 py-0.5 rounded min-w-[30px] text-center">{count}</span>
                        </div>
                    </div>
                  ))
              ) : (
                  <p className="text-slate-500 text-sm italic">Belum ada data stok.</p>
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