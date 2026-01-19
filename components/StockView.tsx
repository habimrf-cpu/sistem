import React, { useState, useMemo } from 'react';
import { Transaction, Tire, SIZE_OPTIONS } from '../types';
import { Search, FileDown, Trash2, Edit } from 'lucide-react';
import { formatDateIndo } from '../utils/helpers';
import { dataService } from '../services/dataService';

interface StockViewProps {
  transactions: Transaction[];
  tires: Tire[];
}

export const StockView: React.FC<StockViewProps> = ({ transactions, tires }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterSize, setFilterSize] = useState('All Sizes');

  // Logic: The screenshot shows "Stock Transactions".
  // We filter the transactions list.
  const filteredData = useMemo(() => {
    return transactions.filter(item => {
      const matchSearch = 
        item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        (item.plateNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.user || '').toLowerCase().includes(search.toLowerCase());
      
      const matchType = filterType === 'All Types' || 
                        (filterType === 'IN' && item.type === 'in') || 
                        (filterType === 'OUT' && item.type === 'out');
      
      const matchSize = filterSize === 'All Sizes' || item.size === filterSize;

      return matchSearch && matchType && matchSize;
    });
  }, [transactions, search, filterType, filterSize]);

  const handleDelete = async (id: number) => {
    if(confirm('Are you sure you want to delete this record?')) {
      await dataService.deleteTransaction(id);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Card Header & Filters */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Stock Transactions</h2>
          <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 border border-slate-200 px-3 py-1.5 rounded-lg bg-white">
            <FileDown size={16} /> Export CSV
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search serial, plate, driver..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option>All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>

          <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none">
            <option>All Tires</option>
            {/* Hardcoded for now based on options */}
            <option>TMD 97</option>
            <option>TMD 18</option>
          </select>

          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none"
            value={filterSize}
            onChange={e => setFilterSize(e.target.value)}
          >
            <option>All Sizes</option>
            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" /></th>
              <th className="px-6 py-4">Serial</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Plate</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Tire</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4"><input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" /></td>
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{item.serialNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.type === 'in' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">{formatDateIndo(item.date)}</td>
                <td className="px-6 py-4 font-mono">{item.plateNumber || '-'}</td>
                <td className="px-6 py-4">{item.user !== 'Admin' ? item.user : '-'}</td>
                <td className="px-6 py-4">-</td> {/* Map Company/Dept here later */}
                <td className="px-6 py-4">{item.brand}</td>
                <td className="px-6 py-4">{item.size}</td>
                <td className="px-6 py-4 max-w-xs truncate" title={item.notes}>{item.notes || '-'}</td>
                <td className="px-6 py-4 text-center">
                   <div className="flex items-center justify-center gap-2">
                      <button className="text-slate-400 hover:text-primary-600"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
         Showing {filteredData.length} records
      </div>
    </div>
  );
};