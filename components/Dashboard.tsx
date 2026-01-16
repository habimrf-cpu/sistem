import React, { useMemo } from 'react';
import { Tire, Transaction } from '../types';
import { Package, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

  // Get recent 10 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 10);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
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

      {/* Recent Activity List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Clock size={18} className="text-blue-400" />
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
