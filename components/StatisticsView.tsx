import React from 'react';
import { Tire, Transaction } from '../types';
import { Package, ArrowUpRight } from 'lucide-react';

interface StatsProps {
  tires: Tire[];
  transactions: Transaction[];
}

export const StatisticsView: React.FC<StatsProps> = ({ tires }) => {
  const available = tires.filter(t => t.status === 'available');
  const out = tires.filter(t => t.status === 'out');
  
  // Group by Brand (Type)
  const byBrand = available.reduce((acc, t) => {
    const key = t.brand || 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort Alphabetically
  const sortedBrands = Object.entries(byBrand).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium uppercase mb-1">Available Stock</p>
               <h3 className="text-3xl font-bold text-slate-900">{available.length}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Package size={24}/>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium uppercase mb-1">Total Installed</p>
               <h3 className="text-3xl font-bold text-slate-900">{out.length}</h3>
            </div>
             <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <ArrowUpRight size={24}/>
            </div>
         </div>
      </div>

      {/* Stock by Tire Type - Exact Design Match */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="text-lg font-bold text-slate-800 mb-8">Stock by Tire Type</h3>
         
         <div className="space-y-6">
            {sortedBrands.length > 0 ? (
                sortedBrands.map(([brand, count]) => (
                   <div key={brand} className="flex justify-between items-center group">
                      <span className="text-slate-500 font-medium text-base">{brand}</span>
                      <span className="text-emerald-500 font-bold text-lg">{count}</span>
                   </div>
                ))
            ) : (
                <div className="text-center py-8 text-slate-400 italic">
                    Belum ada data stok.
                </div>
            )}
         </div>
      </div>

    </div>
  );
}