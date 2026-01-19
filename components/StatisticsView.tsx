import React from 'react';
import { Tire, Transaction } from '../types';
import { Package, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface StatsProps {
  tires: Tire[];
  transactions: Transaction[];
}

export const StatisticsView: React.FC<StatsProps> = ({ tires, transactions }) => {
  const available = tires.filter(t => t.status === 'available');
  const out = tires.filter(t => t.status === 'out');
  
  // Group by size
  const bySize = available.reduce((acc, t) => {
    acc[t.size] = (acc[t.size] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Package size={24}/></div>
               <div>
                  <p className="text-sm text-slate-500 font-medium uppercase">Available Stock</p>
                  <h3 className="text-3xl font-bold text-slate-900">{available.length}</h3>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><ArrowUpRight size={24}/></div>
               <div>
                  <p className="text-sm text-slate-500 font-medium uppercase">Total Installed</p>
                  <h3 className="text-3xl font-bold text-slate-900">{out.length}</h3>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4">Inventory by Size</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(bySize).map(([size, count]) => (
               <div key={size} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-700">{size}</span>
                  <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-sm font-bold">{count} Units</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}