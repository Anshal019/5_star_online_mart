'use client';

import React from 'react';
import { Bill } from '@/types';
import { StorageAPI } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Clock, Play, Trash2, X } from 'lucide-react';

interface HoldBillsModalProps {
  onResume: (bill: Bill) => void;
  onClose: () => void;
}

export const HoldBillsModal: React.FC<HoldBillsModalProps> = ({ onResume, onClose }) => {
  const heldBills = StorageAPI.getHeldBills();

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageAPI.removeHeldBill(id);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <Clock className="w-5 h-5 text-amber-400" />
            Held Bills Queue ({heldBills.length})
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {heldBills.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No bills currently on hold.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {heldBills.map((b) => (
              <div
                key={b.id}
                onClick={() => onResume(b)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{b.invoiceNo}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(b.heldAt || b.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {b.items.length} Items ({b.items.map((i) => i.productName).join(', ')})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-emerald-400">
                    {formatCurrency(b.grandTotal)}
                  </span>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(b.id, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
