import React, { useState, useMemo, useRef } from 'react';
import { Tire, Vehicle, SIZE_OPTIONS, BRAND_OPTIONS, Transaction, UserProfile } from '../types';
import { 
  Search, Eye, Edit, Trash2, QrCode, Plus, ArrowUpRight, ArrowDownRight, 
  X, AlertTriangle, FileSpreadsheet, Printer, Archive, Save, Upload, Download
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatDateIndo } from '../utils/helpers';
import { ConfirmationModal } from './ConfirmationModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Shared Helper for QR URL ---
const getQrUrl = (text: string) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;

// --- Props ---
interface TireListProps {
  tires: Tire[];
  vehicles: Vehicle[];
  user: UserProfile | null;
  onRefresh: () => void;
  onAddTransaction: (t: Transaction) => void;
}

// --- Main Component ---
export const TireManager: React.FC<TireListProps> = ({ tires, vehicles, user, onRefresh, onAddTransaction }) => {
  const [filter, setFilter] = useState({ search: '', status: 'all', size: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState<'in' | 'out' | 'edit' | 'detail' | 'qr' | null>(null);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Delete confirmation state (number for single, -1 for bulk)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Role
  const isAdmin = user?.role === 'admin';

  // Filter Logic
  const filteredData = useMemo(() => {
    return tires.filter(tire => {
      const matchSearch = 
        tire.serialNumber.toLowerCase().includes(filter.search.toLowerCase()) ||
        (tire.plateNumber || '').toLowerCase().includes(filter.search.toLowerCase());
      
      const matchStatus = filter.status === 'all' || tire.status === filter.status;
      const matchSize = filter.size === 'all' || tire.size === filter.size;

      return matchSearch && matchStatus && matchSize;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tires, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
  };
  
  const handleBulkDeleteClick = () => {
    setConfirmDeleteId(-1); // Signal bulk delete
  };

  const confirmDelete = () => {
    if (confirmDeleteId === -1) {
        // Bulk delete
        if (dataService.deleteTires) {
            dataService.deleteTires(selectedIds);
        } else {
            selectedIds.forEach(id => dataService.deleteTire(id));
        }
        setSelectedIds([]);
        setConfirmDeleteId(null);
        onRefresh();
    } else if (confirmDeleteId !== null) {
      dataService.deleteTire(confirmDeleteId);
      setConfirmDeleteId(null);
      onRefresh();
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          const currentIds = currentData.map(t => t.id);
          setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
      } else {
          const currentIds = new Set(currentData.map(t => t.id));
          setSelectedIds(prev => prev.filter(id => !currentIds.has(id)));
      }
  };

  const handleSelectOne = (id: number) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };
  
  const isAllSelected = currentData.length > 0 && currentData.every(t => selectedIds.includes(t.id));

  // --- Print Functionality (Browser Print) ---
  const handlePrintPage = () => {
    window.print();
  };

  // --- Export Excel ---
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(t => ({
      ...t,
      location: 'Bengkel Krc', 
      brand: t.brand
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Ban");
    XLSX.writeFile(wb, "Data_Stok_Ban_Habifeb.xlsx");
  };

  // --- Export PDF ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Stok Ban - Bengkel Kerinci", 14, 15);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);
    doc.setFontSize(10);
    
    (doc as any).autoTable({
      startY: 25,
      head: [['No. Seri', 'Tipe', 'Ukuran', 'Status', 'Lokasi', 'Tgl Masuk']],
      body: filteredData.map(t => [
        t.serialNumber, t.brand, t.size, t.status, 'Bengkel Krc', formatDateIndo(t.dateIn)
      ]),
    });
    
    doc.save("Laporan_Stok_Ban.pdf");
  };

  // --- Download Template ---
  const handleDownloadTemplate = () => {
    const headers = [
       ['Nomor Seri', 'Ukuran', 'Merk', 'Kondisi', 'Tanggal Masuk (YYYY-MM-DD)']
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    // Add example row
    XLSX.utils.sheet_add_json(ws, [
       {'Nomor Seri': 'SN-CONTOH-01', 'Ukuran': SIZE_OPTIONS[0], 'Merk': BRAND_OPTIONS[0], 'Kondisi': 'Baru', 'Tanggal Masuk (YYYY-MM-DD)': '2024-01-01'}
    ], {skipHeader: true, origin: "A2"});

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Import_Ban.xlsx");
  };

  // --- Import Excel ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        if (!bstr) return;

        try {
            // Updated to use cellDates: true for better date handling
            const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            let successCount = 0;
            let failCount = 0;

            data.forEach((row: any) => {
                const sn = row['Nomor Seri'] || row['serialNumber'];
                
                // --- DATE PARSING FIX ---
                const rawDate = row['Tanggal Masuk (YYYY-MM-DD)'] || row['dateIn'];
                let finalDate = new Date().toISOString().split('T')[0];

                if (rawDate) {
                  if (rawDate instanceof Date) {
                    // If library parsed it as Date object, format it manually to YYYY-MM-DD local
                    const year = rawDate.getFullYear();
                    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
                    const day = String(rawDate.getDate()).padStart(2, '0');
                    finalDate = `${year}-${month}-${day}`;
                  } else if (typeof rawDate === 'number') {
                    // Fallback if it comes as number (Excel Serial Date)
                    // Convert Excel date to JS date
                    const date = new Date((rawDate - 25569) * 86400 * 1000);
                    finalDate = date.toISOString().split('T')[0];
                  } else {
                    // String fallback
                    finalDate = String(rawDate);
                  }
                }
                
                // Basic Validation
                if (sn && dataService.isSerialUnique(sn)) {
                    const newTire: Tire = {
                        id: Date.now() + Math.random(),
                        serialNumber: String(sn).toUpperCase(),
                        brand: row['Merk'] || BRAND_OPTIONS[0],
                        size: row['Ukuran'] || SIZE_OPTIONS[0],
                        condition: row['Kondisi'] || 'Baru',
                        status: 'available',
                        location: 'Bengkel Krc',
                        dateIn: finalDate,
                        createdBy: 'Import',
                        updatedAt: Date.now()
                    };
                    dataService.saveTire(newTire);
                    successCount++;
                } else {
                    failCount++;
                }
            });

            alert(`Import Selesai.\nBerhasil: ${successCount}\nGagal/Duplikat: ${failCount}`);
            onRefresh();

        } catch (error) {
            console.error(error);
            alert("Gagal membaca file Excel. Pastikan format sesuai template.");
        } finally {
            // Reset input
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Header & Controls (Hidden when printing) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md no-print">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari No. Seri / Plat..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={filter.search}
              onChange={e => setFilter({...filter, search: e.target.value})}
            />
          </div>
          
          <select 
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-300 outline-none"
            value={filter.size}
            onChange={e => setFilter({...filter, size: e.target.value})}
          >
            <option value="all">Semua Ukuran</option>
            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-300 outline-none"
            value={filter.status}
            onChange={e => setFilter({...filter, status: e.target.value})}
          >
            <option value="all">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="out">Keluar</option>
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && isAdmin ? (
             <button onClick={handleBulkDeleteClick} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors animate-fade-in">
               <Trash2 size={16} /> Hapus ({selectedIds.length})
             </button>
          ) : (
            isAdmin && (
                <>
                    <button onClick={() => setShowModal('in')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> Ban Masuk
                    </button>
                    <button onClick={() => setShowModal('out')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <ArrowUpRight size={16} /> Ban Keluar
                    </button>
                </>
            )
          )}
          
           <div className="dropdown relative group">
              <button className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-slate-300">
                <Printer size={20} />
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10">
                <button onClick={handlePrintPage} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white font-bold hover:bg-slate-700 text-left border-b border-slate-700">
                  <Printer size={16}/> Cetak (Print)
                </button>
                <div className="p-2 text-xs text-slate-500 uppercase font-bold">Import / Export</div>
                {isAdmin && (
                   <button onClick={handleImportClick} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700 text-left">
                    <Upload size={16}/> Import Excel
                   </button>
                )}
                <button onClick={handleDownloadTemplate} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 text-left">
                  <Download size={16}/> Template Import
                </button>
                 <div className="border-t border-slate-700 my-1"></div>
                <button onClick={handleExportExcel} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left">
                  <FileSpreadsheet size={16}/> Export Excel
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 text-left">
                  <Printer size={16}/> Export PDF
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-8 text-black">
        <h1 className="text-2xl font-bold">Laporan Stok Ban - Bengkel Kerinci</h1>
        <p className="text-sm">Dicetak pada: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
        <div className="border-b-2 border-black mt-2"></div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden print:shadow-none print:border-none print:bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 print:text-black">
            <thead className="bg-slate-900 text-slate-400 uppercase font-medium print:bg-slate-200 print:text-black">
              <tr>
                <th className="px-6 py-4 w-10 no-print">
                    <input 
                        type="checkbox" 
                        className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                    />
                </th>
                <th className="px-6 py-4">Nomor Seri</th>
                <th className="px-6 py-4">Tipe & Ukuran</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Lokasi/Plat</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 print:divide-slate-300">
              {currentData.length > 0 ? currentData.map((tire) => (
                <tr key={tire.id} className={`hover:bg-slate-750 transition-colors print:hover:bg-transparent ${selectedIds.includes(tire.id) ? 'bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4 no-print">
                      <input 
                        type="checkbox" 
                        className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(tire.id)}
                        onChange={() => handleSelectOne(tire.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-white print:text-black">
                    {tire.serialNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-bold print:text-black">{tire.brand}</div>
                    <div className="text-xs text-slate-400 print:text-black">{tire.size}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit print:border print:border-black ${
                        tire.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 print:text-black' : 'bg-orange-500/10 text-orange-500 print:text-black'
                      }`}>
                        {tire.status === 'available' ? 'Tersedia' : 'Keluar'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {tire.status === 'available' ? (
                        <span className="text-slate-400 flex items-center gap-1 print:text-black"><Archive size={14} className="no-print"/> Bengkel Krc</span>
                     ) : (
                        <span className="text-orange-400 font-mono print:text-black">{tire.plateNumber}</span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div>Masuk: {formatDateIndo(tire.dateIn)}</div>
                    {tire.dateOut && <div className="text-orange-400 print:text-black">Keluar: {formatDateIndo(tire.dateOut)}</div>}
                  </td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => {setSelectedTire(tire); setShowModal('detail');}} className="p-1.5 hover:bg-slate-700 rounded text-blue-400" title="Detail"><Eye size={16}/></button>
                      <button onClick={() => {setSelectedTire(tire); setShowModal('qr');}} className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="QR Code"><QrCode size={16}/></button>
                      
                      {/* Protected Actions */}
                      {isAdmin && (
                         <>
                            <button onClick={() => {setSelectedTire(tire); setShowModal('edit');}} className="p-1.5 hover:bg-slate-700 rounded text-amber-400" title="Edit Data"><Edit size={16}/></button>
                            <button onClick={(e) => {e.stopPropagation(); handleDeleteClick(tire.id);}} className="p-1.5 hover:bg-slate-700 rounded text-red-400" title="Hapus"><Trash2 size={16}/></button>
                         </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data ban yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Hidden on print) */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center no-print">
          <span className="text-xs text-slate-500">Hal {currentPage} dari {totalPages || 1}</span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(c => c - 1)}
              className="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50"
            >Prev</button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(c => c + 1)}
              className="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* MODALS - Wrapped with Admin Checks (Except Detail & QR) */}
      {showModal === 'in' && isAdmin && (
        <TireFormModal type="in" onClose={() => setShowModal(null)} onSave={(t) => {
             dataService.saveTire(t);
             dataService.addTransaction({
                 id: Date.now(),
                 type: 'in',
                 serialNumber: t.serialNumber,
                 brand: t.brand,
                 size: t.size,
                 condition: t.condition,
                 date: t.dateIn,
                 user: user?.name || 'Admin',
                 timestamp: Date.now(),
                 notes: 'Ban Baru Masuk'
             });
             onAddTransaction({} as any); // just trigger refresh
             onRefresh();
             setShowModal(null);
        }} />
      )}

      {showModal === 'edit' && selectedTire && isAdmin && (
        <TireEditModal tire={selectedTire} onClose={() => {setShowModal(null); setSelectedTire(null);}} onSave={(t) => {
            dataService.saveTire(t);
            onRefresh();
            setShowModal(null);
            setSelectedTire(null);
        }} />
      )}

      {showModal === 'out' && isAdmin && (
        <TireOutModal 
          tires={tires} 
          vehicles={vehicles}
          onClose={() => setShowModal(null)} 
          onSave={(updatedTire, tx) => {
            dataService.saveTire(updatedTire);
            dataService.addTransaction({...tx, user: user?.name || 'Admin'});
            // Update vehicle history if needed
            const vehicle = vehicles.find(v => v.plateNumber === updatedTire.plateNumber);
            if(vehicle) {
                const updatedVehicle = {...vehicle, tireHistory: [...vehicle.tireHistory, {
                    serialNumber: updatedTire.serialNumber,
                    dateInstalled: updatedTire.dateOut || '',
                    odometer: updatedTire.odometer || 0
                }]};
                dataService.saveVehicle(updatedVehicle);
            }
            onRefresh();
            setShowModal(null);
          }} 
        />
      )}

      {showModal === 'detail' && selectedTire && (
        <TireDetailModal tire={selectedTire} onClose={() => {setShowModal(null); setSelectedTire(null);}} />
      )}

      {showModal === 'qr' && selectedTire && (
        <QRModal tire={selectedTire} onClose={() => {setShowModal(null); setSelectedTire(null);}} />
      )}
      
      <ConfirmationModal 
          isOpen={confirmDeleteId !== null}
          title={confirmDeleteId === -1 ? `Hapus ${selectedIds.length} Ban Terpilih` : "Hapus Ban"}
          message={confirmDeleteId === -1 
            ? "Apakah Anda yakin ingin menghapus semua data ban yang dipilih? Tindakan ini tidak dapat dibatalkan."
            : "Apakah Anda yakin ingin menghapus data ban ini? Data yang dihapus tidak dapat dikembalikan."
          }
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
       />

    </div>
  );
};

// --- Sub-components (Modals) ---
// (No changes needed in modals internal logic, just parent rendering logic)
const TireFormModal: React.FC<{ type: 'in', onClose: () => void, onSave: (t: Tire) => void }> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Tire>>({
    serialNumber: '',
    brand: BRAND_OPTIONS[0],
    size: SIZE_OPTIONS[0],
    condition: 'Baru',
    location: 'Bengkel Krc',
    dateIn: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serialNumber) {
      setError('Mohon lengkapi Nomor Seri');
      return;
    }
    if (!dataService.isSerialUnique(form.serialNumber)) {
       setError('Nomor Seri sudah ada di database!');
       return;
    }

    const newTire: Tire = {
      ...form as Tire,
      id: Date.now(),
      status: 'available',
      createdBy: 'Admin',
      updatedAt: Date.now()
    };
    onSave(newTire);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-emerald-500" /> Input Ban Masuk
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nomor Seri *</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 font-mono"
              value={form.serialNumber}
              onChange={e => {setForm({...form, serialNumber: e.target.value.toUpperCase()}); setError('')}}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Tipe Ban (Pattern)</label>
             <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}>
                {BRAND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Ukuran</label>
             <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.size} onChange={e => setForm({...form, size: e.target.value})}>
                {SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Tanggal Masuk</label>
             <input type="date" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.dateIn} onChange={e => setForm({...form, dateIn: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Lokasi Gudang</label>
            <input 
              type="text" 
              disabled
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-500"
              value="Bengkel Krc"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
             <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TireEditModal: React.FC<{ tire: Tire, onClose: () => void, onSave: (t: Tire) => void }> = ({ tire, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    serialNumber: tire.serialNumber,
    brand: tire.brand || BRAND_OPTIONS[0],
    size: tire.size || SIZE_OPTIONS[0]
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber) {
      setError("Nomor Seri tidak boleh kosong");
      return;
    }
    if (formData.serialNumber !== tire.serialNumber && !dataService.isSerialUnique(formData.serialNumber)) {
      setError("Nomor Seri sudah digunakan oleh ban lain!");
      return;
    }

    onSave({
        ...tire,
        serialNumber: formData.serialNumber.toUpperCase(),
        brand: formData.brand,
        size: formData.size,
        updatedAt: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="text-blue-500" /> Edit Data Ban
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nomor Seri</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500"
              value={formData.serialNumber}
              onChange={e => {setFormData({...formData, serialNumber: e.target.value.toUpperCase()}); setError('');}}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Tipe Ban (Pattern)</label>
             <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                {BRAND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Ukuran</label>
             <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})}>
                {SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
             <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">
                <Save size={16}/> Simpan
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TireOutModal: React.FC<{ tires: Tire[], vehicles: Vehicle[], onClose: () => void, onSave: (t: Tire, tx: Transaction) => void }> = ({ tires, vehicles, onClose, onSave }) => {
  const availableTires = tires.filter(t => t.status === 'available');
  const [selectedSerial, setSelectedSerial] = useState('');
  const [form, setForm] = useState({
    plateNumber: '',
    odometer: 0,
    dateOut: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerial || !form.plateNumber) return;

    const tire = availableTires.find(t => t.serialNumber === selectedSerial);
    if (!tire) return;

    const updatedTire: Tire = {
      ...tire,
      status: 'out',
      dateOut: form.dateOut,
      plateNumber: form.plateNumber,
      odometer: form.odometer,
      updatedAt: Date.now()
    };

    const tx: Transaction = {
      id: Date.now(),
      type: 'out',
      serialNumber: tire.serialNumber,
      brand: tire.brand,
      size: tire.size,
      condition: tire.condition,
      date: form.dateOut,
      plateNumber: form.plateNumber,
      odometer: form.odometer,
      user: 'Admin',
      notes: form.notes,
      timestamp: Date.now()
    };

    onSave(updatedTire, tx);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="text-orange-500" /> Input Ban Keluar
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Pilih Ban (Tersedia) *</label>
            <select 
               required
               className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white font-mono"
               value={selectedSerial}
               onChange={e => setSelectedSerial(e.target.value)}
            >
              <option value="">-- Pilih Nomor Seri --</option>
              {availableTires.map(t => (
                <option key={t.id} value={t.serialNumber}>{t.serialNumber} ({t.brand} {t.size})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Plat Nomor Kendaraan *</label>
            <input 
              list="vehicles"
              type="text" 
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase"
              value={form.plateNumber}
              onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
            />
            <datalist id="vehicles">
              {vehicles.map(v => <option key={v.id} value={v.plateNumber} />)}
            </datalist>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Tanggal Keluar</label>
             <input type="date" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={form.dateOut} onChange={e => setForm({...form, dateOut: e.target.value})} />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Catatan</label>
             <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white h-20"
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Keterangan pemasangan..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
             <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">Simpan Keluar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TireDetailModal: React.FC<{ tire: Tire, onClose: () => void }> = ({ tire, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
           <h3 className="text-xl font-bold text-white">Detail Ban</h3>
           <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Nomor Seri</span>
                   <p className="text-lg font-mono font-bold text-white">{tire.serialNumber}</p>
                </div>
                <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                   <p className={`font-bold ${tire.status === 'available' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tire.status === 'available' ? 'TERSEDIA' : 'KELUAR'}
                   </p>
                </div>
                 <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Tipe</span>
                   <p className="text-white">{tire.brand}</p>
                </div>
                <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Ukuran</span>
                   <p className="text-white">{tire.size}</p>
                </div>
                <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Lokasi</span>
                   <p className="text-white">Bengkel Krc</p>
                </div>
                 <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Tanggal Masuk</span>
                   <p className="text-white">{formatDateIndo(tire.dateIn)}</p>
                </div>
                 <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Tanggal Keluar</span>
                   <p className="text-white">{formatDateIndo(tire.dateOut)}</p>
                </div>
                 <div>
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Plat Nomor</span>
                   <p className="text-white">{tire.plateNumber || '-'}</p>
                </div>
              </div>
           </div>
           <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg">
              <img src={getQrUrl(JSON.stringify({sn: tire.serialNumber}))} alt="QR Code" className="w-48 h-48" />
              <p className="text-slate-800 font-mono text-sm mt-2 font-bold">{tire.serialNumber}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const QRModal: React.FC<{ tire: Tire, onClose: () => void }> = ({ tire, onClose }) => {
   const qrUrl = getQrUrl(JSON.stringify({sn: tire.serialNumber}));
   
   const handleDownload = async () => {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${tire.serialNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm no-print">
       <div className="bg-slate-800 p-8 rounded-xl flex flex-col items-center gap-4 border border-slate-700">
          <h3 className="text-white text-lg font-bold">QR Code Ban</h3>
          <div className="bg-white p-4 rounded-lg">
             <img src={qrUrl} alt="QR" className="w-64 h-64" />
          </div>
          <div className="text-center">
             <p className="text-white font-mono text-xl">{tire.serialNumber}</p>
             <p className="text-slate-400">{tire.brand} - {tire.size}</p>
          </div>
          <div className="flex gap-4 mt-2">
             <button onClick={onClose} className="text-slate-400 hover:text-white px-4 py-2">Tutup</button>
             <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <ArrowDownRight size={16}/> Download PNG
             </button>
          </div>
       </div>
    </div>
   )
}
