'use client';

import React, { useState } from 'react';
import { PaymentMethod, ShopSettings } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Banknote, QrCode, CreditCard, Split, CheckCircle2, User, Phone, X } from 'lucide-react';

interface PaymentModalProps {
  grandTotal: number;
  settings: ShopSettings;
  onComplete: (data: {
    paymentMode: PaymentMethod;
    cashReceived?: number;
    cashChange?: number;
    customerName?: string;
    customerPhone?: string;
    idempotencyKey: string;
  }) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  grandTotal,
  settings,
  onComplete,
  onClose,
}) => {
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<number>(Math.ceil(grandTotal));
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cashChange = Math.max(0, cashReceived - grandTotal);

  const handleQuickCash = (amt: number) => {
    setCashReceived(amt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    onComplete({
      paymentMode,
      cashReceived: paymentMode === 'Cash' ? cashReceived : undefined,
      cashChange: paymentMode === 'Cash' ? cashChange : undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      idempotencyKey,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-6 text-slate-900 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 font-medium">Complete transaction and issue receipt</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Payable</span>
            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(grandTotal)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Card', label: 'Card', icon: CreditCard },
                { id: 'Split', label: 'Split', icon: Split },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMode === 'Cash' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cash Received from Customer (₹)</label>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  Change Return: {formatCurrency(cashChange)}
                </span>
              </div>
              <input
                type="number"
                min={grandTotal}
                step="1"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xl font-mono font-black text-center text-slate-900 outline-none focus:border-blue-600"
                autoFocus
              />

              <div className="flex gap-2">
                {[Math.ceil(grandTotal), Math.ceil(grandTotal / 50) * 50, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500]
                  .filter((v, i, self) => v >= grandTotal && self.indexOf(v) === i)
                  .map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs"
                    >
                      ₹{amt}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {paymentMode === 'UPI' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=5staronlinemart@upi%26pn=${encodeURIComponent(
                    settings.shopName
                  )}%26am=${grandTotal}%26cu=INR`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Scan with GPay, PhonePe, Paytm or any UPI App
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" /> Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> Mobile Number
              </label>
              <input
                type="text"
                placeholder="10-digit phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-extrabold shadow-md flex items-center justify-center gap-2 border border-blue-600 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Processing...' : 'Complete & Print Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
