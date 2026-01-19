import React, { useState } from 'react';
import { Tire, Transaction, Vehicle, BRAND_OPTIONS, SIZE_OPTIONS } from '../types';
import { X, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  existingTires: Tire[];
  onSuccess: () => void;
}

export const TransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, vehicles, existingTires, onSuccess }) => {
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    serialNumber: '',
    brand: BRAND_OPTIONS[0],
    size: SIZE_OPTIONS[0],
    condition: 'Baru',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    // Out specific
    plateNumber: '',
    odometer: '',
    selectedTireId: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'IN') {
        // Validation: Uppercase Serial
        const serial = formData.serialNumber.toUpperCase();
        if(!serial) throw new Error("Serial Number required");
        
        // Check duplicate
        const isUnique = await dataService.isSerialUnique(serial);
        if(!isUnique) throw new Error("Serial Number already exists");

        const tire: Tire = {
          id: Date.now(),
          serialNumber: serial,
          brand: formData.brand,
          size: formData.size,
          condition: formData.condition as any,
          status: 'available',
          location: 'Gudang',
          dateIn: formData.date,
          createdBy: 'Admin',
          updatedAt: Date.now()
        };

        const tx: Transaction = {
          id: Date.now(),
          type: 'in',
          serialNumber: serial,
          brand: formData.brand,
          size: formData.size,
          condition: formData.condition,
          date: formData.date,
          user: 'Admin',
          notes: formData.notes,
          timestamp: Date.now()
        };

        await dataService.saveTire(tire);
        await dataService.addTransaction(tx);

      } else {
        // OUT Logic
        if(!formData.selectedTireId) throw new Error("Please select a tire");
        if(!formData.plateNumber) throw new Error("Plate number required");

        const tire = existingTires.find(t => t.id === Number(formData.selectedTireId));
        if(!tire) throw new Error("Tire not found");

        const updatedTire: Tire = {
          ...tire,
          status: 'out',
          dateOut: formData.date,
          plateNumber: formData.plateNumber,
          odometer: Number(formData.odometer) || 0,
          updatedAt: Date.now()
        };

        const tx: Transaction = {
          id: Date.now(),
          type: 'out',
          serialNumber: tire.serialNumber,
          brand: tire.brand,
          size: tire.size,
          condition: tire.condition,
          date: formData.date,
          plateNumber: formData.plateNumber,
          odometer: Number(formData.odometer) || 0,
          user: 'Admin', // In real app, get from selected vehicle's driver?
          notes: formData.notes,
          timestamp: Date.now()
        };

        await dataService.saveTire(updatedTire);
        await dataService.addTransaction(tx);
        
        // Update Vehicle History
        const v = vehicles.find(veh => veh.plateNumber === formData.plateNumber);
        if(v) {
          const updatedV = {
            ...v,
            tireHistory: [...v.tireHistory, {
              serialNumber: tire.serialNumber,
              dateInstalled: formData.date,
              odometer: Number(formData.odometer) || 0
            }]
          };
          await dataService.saveVehicle(updatedV);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">New Transaction</h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'IN' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
            >
              Stock In (Baru)
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'OUT' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              Stock Out (Pasang)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === 'IN' ? (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serial Number</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.serialNumber}
                  onChange={e => setFormData({...formData, serialNumber: e.target.value.toUpperCase()})}
                  placeholder="SN123456"
                />
              </div>
            ) : (
               <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Tire (Available)</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.selectedTireId}
                  onChange={e => setFormData({...formData, selectedTireId: e.target.value})}
                >
                  <option value="">-- Select Serial --</option>
                  {existingTires.map(t => (
                    <option key={t.id} value={t.id}>{t.serialNumber} - {t.brand} {t.size}</option>
                  ))}
                </select>
              </div>
            )}

            {type === 'IN' && (
              <>
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Brand</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                  >
                    {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Size</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                  >
                    {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
               <input 
                 type="date"
                 className="w-full border border-slate-300 rounded-lg px-3 py-2"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
            </div>

            {type === 'OUT' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plate Number</label>
                  <input 
                    type="text" list="vehicleList"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
                    value={formData.plateNumber}
                    onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
                  />
                  <datalist id="vehicleList">
                    {vehicles.map(v => <option key={v.id} value={v.plateNumber} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Odometer</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={formData.odometer}
                    onChange={e => setFormData({...formData, odometer: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Notes</label>
              <textarea 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className={`flex-1 py-2.5 text-white rounded-lg font-medium flex justify-center items-center gap-2
                 ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
               `}
             >
               {loading && <Loader2 size={16} className="animate-spin" />}
               {type === 'IN' ? 'Save Incoming' : 'Save Outgoing'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};