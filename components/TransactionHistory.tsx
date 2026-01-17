import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile } from '../types';
import { formatDateIndo } from '../utils/helpers';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, User } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ConfirmationModal } from './ConfirmationModal';

interface TransactionHistoryProps {
  transactions: Transaction[];
  user: UserProfile | null;
  onRefresh: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, user, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin';

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = 
        t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [transactions, searchTerm, filterType]);

  const handleDelete = () => {
    if (deleteId) {
      dataService.deleteTransaction(deleteId);
      setDeleteId(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
           Riwayat Transaksi
        </h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input 
               type="text" 
               placeholder="Cari Serial / Plat..."
               className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <select 
             className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-300 outline-none"
             value={filterType}
             onChange={e => setFilterType(e.target.value as any)}
          >
             <option value="all">Semua</option>
             <option value="in">Masuk</option>
             <option value="out">Keluar</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nomor Seri</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">User</th>
                {isAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                         tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {tx.type === 'in' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                        {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {formatDateIndo(tx.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white">{tx.serialNumber}</div>
                      <div className="text-xs text-slate-500">{tx.brand} - {tx.size}</div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.type === 'out' && tx.plateNumber && (
                        <div className="font-bold text-white mb-1">{tx.plateNumber}</div>
                      )}
                      <div className="text-slate-400">{tx.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-500" />
                          <span>{tx.user}</span>
                       </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setDeleteId(tx.id)}
                          className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteId !== null}
        title="Hapus Riwayat Transaksi"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Stok barang tidak akan berubah, hanya riwayat yang dihapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};