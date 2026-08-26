'use client';

import React, { useState } from 'react';
import { Product, Supplier } from '@/types';
import { StorageAPI } from '@/lib/storage';
import { Boxes, Plus, CheckCircle2, X } from 'lucide-react';

interface StockInModalProps {
  products: Product[];
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  products,
  suppliers,
  onClose,
  onSuccess,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [stockInQty, setStockInQty] = useState(10);
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || '');
  const [referenceId, setReferenceId] = useState('');
  const [reason, setReason] = useState('New Supplier Purchase Batch');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || stockInQty <= 0) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      const newStock = prod.stock + stockInQty;
      StorageAPI.adjustStock(
        selectedProductId,
        newStock,
        'STOCK_IN',
        `${reason} [Supplier: ${supplierName}, Ref: ${referenceId || 'N/A'}]`
      );
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <Boxes className="w-5 h-5 text-emerald-400" />
            Stock In (Purchase Entry)
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.contentQty}) — Current Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Stock Received Qty</label>
              <input
                type="number"
                min="1"
                required
                value={stockInQty}
                onChange={(e) => setStockInQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl glass-input font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Supplier / Vendor</label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Supplier Invoice / PO Reference</label>
            <input
              type="text"
              placeholder="e.g. PO-9842"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes / Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl glass-card font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Receive Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
