'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { StorageAPI } from '@/lib/storage';
import { MinusCircle, CheckCircle2, X } from 'lucide-react';

interface StockOutModalProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({ products, onClose, onSuccess }) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [stockOutQty, setStockOutQty] = useState(1);
  const [reason, setReason] = useState('Damaged during shelf stocking');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || stockOutQty <= 0) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      const newStock = Math.max(0, prod.stock - stockOutQty);
      StorageAPI.adjustStock(selectedProductId, newStock, 'STOCK_OUT', reason);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <MinusCircle className="w-5 h-5 text-red-400" />
            Stock Out / Damage Entry
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

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deduct Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={stockOutQty}
              onChange={(e) => setStockOutQty(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl glass-input font-bold text-red-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reason for Stock Out</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
            >
              <option value="Damaged during shelf stocking">Damaged during shelf stocking</option>
              <option value="Product Expiry / Quality Defect">Product Expiry / Quality Defect</option>
              <option value="Internal Store Display Use">Internal Store Display Use</option>
              <option value="Lost / Theft Adjustment">Lost / Theft Adjustment</option>
            </select>
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
              className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white shadow-lg flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
