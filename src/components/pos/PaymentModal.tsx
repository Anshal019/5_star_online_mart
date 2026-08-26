'use client';

import React, { useState } from 'react';
import { PaymentMethod, ShopSettings } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Banknote, QrCode, CreditCard, Split, CheckCircle2, User, Phone } from 'lucide-react';

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
    if (submitting) return; // Prevent double submit in modal UI
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl p-6 space-y-6 bg-zinc-950">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-bold text-white">Checkout & Payment</h3>
            <p className="text-xs text-zinc-400">Complete transaction and issue receipt</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400">Total Payable</span>
            <p className="text-2xl font-black text-white">{formatCurrency(grandTotal)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Select Payment Method</label>
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
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-black border-zinc-800 text-zinc-300 hover:bg-zinc-900'
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
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Cash Received from Customer (₹)</label>
                <span className="text-xs font-bold text-white">
                  Change Return: {formatCurrency(cashChange)}
                </span>
              </div>
              <input
                type="number"
                min={grandTotal}
                step="1"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xl font-mono font-bold text-center text-white"
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
                      className="flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700"
                    >
                      ₹{amt}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {paymentMode === 'UPI' && (
            <div className="p-4 rounded-xl bg-black border border-zinc-800 text-center space-y-3">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=5staronlinemart@upi%26pn=${encodeURIComponent(
                    settings.shopName
                  )}%26am=${grandTotal}%26cu=INR`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Scan with GPay, PhonePe, Paytm or any UPI App
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-white" /> Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg glass-input text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-white" /> Mobile Number
              </label>
              <input
                type="text"
                placeholder="10-digit phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg glass-input text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold border-2 border-white shadow-lg flex items-center justify-center gap-2"
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
