import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Truck, Search, Plus } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles }) => {
  const [search, setSearch] = useState('');

  const filtered = vehicles.filter(v => 
    v.plateNumber.includes(search.toUpperCase()) || v.driver.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Fleet Management</h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search fleet..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {filtered.map(vehicle => (
          <div key={vehicle.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50/50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <Truck size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{vehicle.plateNumber}</h3>
                    <p className="text-xs text-slate-500">{vehicle.vehicleType}</p>
                 </div>
              </div>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">
                 {vehicle.department}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
               <div className="flex justify-between">
                 <span className="text-slate-400">Driver</span>
                 <span className="font-medium">{vehicle.driver}</span>
               </div>
               <div className="pt-3 border-t border-slate-200 mt-3">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tire History</p>
                 {vehicle.tireHistory.length > 0 ? (
                    vehicle.tireHistory.slice(-2).map((h, i) => (
                      <div key={i} className="flex justify-between text-xs py-1">
                         <span className="font-mono">{h.serialNumber}</span>
                         <span className="text-slate-400">{h.dateInstalled}</span>
                      </div>
                    ))
                 ) : (
                   <p className="text-xs italic text-slate-400">No tires installed yet.</p>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}