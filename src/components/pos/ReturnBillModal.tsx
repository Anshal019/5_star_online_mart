'use client';

import React, { useState } from 'react';
import { Bill } from '@/types';
import { StorageAPI } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { RotateCcw, Search, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ReturnBillModalProps {
  onClose: () => void;
}

export const ReturnBillModal: React.FC<ReturnBillModalProps> = ({ onClose }) => {
  const [searchInv, setSearchInv] = useState('');
  const [foundBill, setFoundBill] = useState<Bill | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{ [productId: string]: number }>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const bills = StorageAPI.getBills();
    const query = searchInv.trim().toLowerCase();
    const match = bills.find(
      (b) => b.invoiceNo.toLowerCase() === query || b.id.toLowerCase() === query
    );

    if (match) {
      setFoundBill(match);
      const initial: { [key: string]: number } = {};
      match.items.forEach((i) => {
        initial[i.productId] = i.quantity;
      });
      setSelectedReturnItems(initial);
    } else {
      setFoundBill(null);
      setErrorMsg('Invoice number not found. Please verify the bill receipt.');
    }
  };

  const handleQtyChange = (productId: string, maxQty: number, val: number) => {
    const valid = Math.max(0, Math.min(maxQty, val));
    setSelectedReturnItems((prev) => ({
      ...prev,
      [productId]: valid,
    }));
  };

  const handleConfirmReturn = () => {
    if (!foundBill) return;

    const returnList = Object.entries(selectedReturnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));

    if (returnList.length === 0) {
      setErrorMsg('Please select at least one item quantity to return.');
      return;
    }

    const res = StorageAPI.processReturn(foundBill.invoiceNo, returnList);
    if (res) {
      setSuccessMsg(`Successfully processed return for ${foundBill.invoiceNo}! Stock has been auto-restocked.`);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <RotateCcw className="w-5 h-5 text-brand-400" />
            Customer Item Return & Refund
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Lookup Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInv}
              onChange={(e) => setSearchInv(e.target.value)}
              placeholder="Scan or type Invoice No (e.g. INV-2026-1001)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input text-slate-200"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Find Bill
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Found Bill Details */}
        {foundBill && (
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex justify-between">
              <div>
                <span className="font-bold text-white">{foundBill.invoiceNo}</span>
                <p className="text-[10px] text-slate-400">Date: {formatDate(foundBill.createdAt)}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-400">{formatCurrency(foundBill.grandTotal)}</span>
                <p className="text-[10px] text-slate-400">Mode: {foundBill.paymentMode}</p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Select Quantity to Restock & Refund:
              </label>
              {foundBill.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <p className="font-medium text-slate-200">{item.productName}</p>
                    <p className="text-[10px] text-slate-400">
                      Billed Qty: {item.quantity} • Unit Price: ₹{item.unitPrice}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Return:</span>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedReturnItems[item.productId] ?? 0}
                      onChange={(e) =>
                        handleQtyChange(item.productId, item.quantity, parseInt(e.target.value) || 0)
                      }
                      className="w-14 px-2 py-1 rounded glass-input text-center font-bold text-emerald-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl glass-card text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Refund & Restock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
