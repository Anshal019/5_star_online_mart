'use client';

import React, { useState } from 'react';
import { BillItem } from '@/types';
import { X, PlusCircle, DollarSign, Tag, Package, Percent } from 'lucide-react';

interface CustomItemModalProps {
  onAdd: (item: BillItem) => void;
  onClose: () => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isTaxable, setIsTaxable] = useState<boolean>(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter item description or name');
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid unit price');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be at least 1');
      return;
    }

    const sub = price * quantity;
    const taxAmt = isTaxable ? (sub * gstRate) / 100 : 0;
    const totalAmount = sub + taxAmt;

    const customBillItem: BillItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: `custom-${Date.now()}`,
      productName: name.trim(),
      barcode: 'CUSTOM-ITEM',
      sku: 'MANUAL',
      contentQty: '1 pc',
      quantity,
      unitPrice: price,
      discount: 0,
      isTaxable,
      gstRate: isTaxable ? gstRate : 0,
      taxAmount: Math.round(taxAmt * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };

    onAdd(customBillItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Add Custom / Unlisted Item</h3>
              <p className="text-[11px] text-slate-500 font-medium">Bill item without scanning barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Item Name / Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Loose Grain 5Kg, Repair Fee, Custom Plate"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-center"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">Apply GST Tax</label>
              <input
                type="checkbox"
                checked={isTaxable}
                onChange={(e) => setIsTaxable(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {isTaxable && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">GST Tax Rate</label>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        gstRate === rate
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Add to Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
