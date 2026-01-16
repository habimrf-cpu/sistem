import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isDanger && <AlertTriangle className="text-red-500" size={20} />}
            {title}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-850/50 rounded-b-xl">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-all transform hover:scale-105 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
