'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, BillItem, ShopSettings, Bill } from '@/types';
import { calculateBillTotals, formatCurrency } from '@/lib/formatters';
import { PaymentModal } from './PaymentModal';
import { ThermalReceipt } from './ThermalReceipt';
import { HoldBillsModal } from './HoldBillsModal';
import { ReturnBillModal } from './ReturnBillModal';
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  Percent,
  Receipt,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const POSScreen: React.FC = () => {
  const [cart, setCart] = useState<BillItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX'>('EXCLUSIVE');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [scanError, setScanError] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
    barcodeInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setPaymentModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) handleHoldBill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const loadData = () => {
    const prods = StorageAPI.getProducts();
    const s = StorageAPI.getShopSettings();
    setProducts(prods);
    setSettings(s);
    if (s) {
      setTaxMode(s.defaultTaxMode || 'EXCLUSIVE');
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    if (!barcodeInput.trim()) return;

    const matchedProd = StorageAPI.getProductByBarcode(barcodeInput.trim());
    if (matchedProd) {
      addItemToCart(matchedProd);
      setBarcodeInput('');
    } else {
      setScanError(`Barcode "${barcodeInput.trim()}" not found in catalog.`);
      setBarcodeInput('');
    }

    barcodeInputRef.current?.focus();
  };

  const addItemToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex !== -1) {
        const updated = [...prevCart];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        const sub = item.unitPrice * newQty;
        const disc = item.discount * newQty;
        const netPrice = Math.max(0, sub - disc);
        const taxAmt = item.isTaxable ? (netPrice * item.gstRate) / 100 : 0;

        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          taxAmount: Math.round(taxAmt * 100) / 100,
          totalAmount: netPrice + taxAmt,
        };
        return updated;
      }

      const unitPrice = product.offerPrice || product.sellingPrice;
      const taxAmt = product.isTaxable ? (unitPrice * product.gstRate) / 100 : 0;

      const newItem: BillItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        sku: product.sku,
        contentQty: product.contentQty,
        quantity: 1,
        unitPrice,
        discount: 0,
        isTaxable: product.isTaxable,
        gstRate: product.gstRate,
        taxAmount: Math.round(taxAmt * 100) / 100,
        totalAmount: unitPrice + taxAmt,
      };

      return [newItem, ...prevCart];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === cartItemId) {
          const sub = item.unitPrice * newQty;
          const disc = item.discount * newQty;
          const netPrice = Math.max(0, sub - disc);
          const taxAmt = item.isTaxable ? (netPrice * item.gstRate) / 100 : 0;

          return {
            ...item,
            quantity: newQty,
            taxAmount: Math.round(taxAmt * 100) / 100,
            totalAmount: netPrice + taxAmt,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.id !== cartItemId));
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const totals = calculateBillTotals(cart, billDiscount, taxMode);
    const currentUser = StorageAPI.getCurrentUser();

    StorageAPI.holdBill({
      items: cart,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      grandTotal: totals.grandTotal,
      paymentMode: 'Cash',
      paymentStatus: 'Paid',
      cashierId: currentUser?.id || 'usr',
      cashierName: currentUser?.name || 'Cashier',
      status: 'Held',
    });

    setCart([]);
    setBillDiscount(0);
    alert('Bill suspended and saved to Hold Queue! [F8]');
  };

  const handleResumeBill = (heldBill: Bill) => {
    setCart(heldBill.items);
    StorageAPI.removeHeldBill(heldBill.id);
    setHoldModalOpen(false);
  };

  const handleCompletePayment = (data: {
    paymentMode: any;
    cashReceived?: number;
    cashChange?: number;
    customerName?: string;
    customerPhone?: string;
  }) => {
    const totals = calculateBillTotals(cart, billDiscount, taxMode);
    const currentUser = StorageAPI.getCurrentUser();

    const createdBill = StorageAPI.saveBill({
      items: cart,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      grandTotal: totals.grandTotal,
      paymentMode: data.paymentMode,
      cashReceived: data.cashReceived,
      cashChange: data.cashChange,
      paymentStatus: 'Paid',
      cashierId: currentUser?.id || 'usr',
      cashierName: currentUser?.name || 'Counter Staff',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      status: 'Completed',
    });

    setCompletedBill(createdBill);
    setPaymentModalOpen(false);
    setCart([]);
    setBillDiscount(0);

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  const handlePrintReceipt = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const totals = calculateBillTotals(cart, billDiscount, taxMode);

  const filteredManualProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
      p.barcode.includes(manualQuery) ||
      p.sku.toLowerCase().includes(manualQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto bg-black text-white">
      {/* Top Bar: Barcode Scanner Focus */}
      <div className="glass-panel p-4 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <form onSubmit={handleBarcodeSubmit} className="flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode with USB Scanner or press F2 to focus..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black border-2 border-white text-sm font-mono text-white placeholder-zinc-500 font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs shadow hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-1.5 border border-white"
          >
            Scan Item
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-700"
          >
            <Search className="w-4 h-4 text-zinc-300" />
            Search Name
          </button>

          <button
            onClick={() => setHoldModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-700"
          >
            <Pause className="w-4 h-4 text-zinc-300" />
            Hold Queue [F8]
          </button>

          <button
            onClick={() => setReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-700"
          >
            <RotateCcw className="w-4 h-4 text-zinc-300" />
            Returns
          </button>
        </div>
      </div>

      {scanError && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white" />
            {scanError}
          </div>
          <button onClick={() => setScanError('')} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Billing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-zinc-800 min-h-[520px] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-white" />
                  Cart Items ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-zinc-400 hover:text-white underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Barcode className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-sm font-bold text-white">Ready to Scan Items</p>
                  <p className="text-xs text-zinc-400 max-w-xs text-center">
                    Point your USB Barcode Scanner at any item label, or use Search to pick manually.
                  </p>
                </div>
              ) : (
                <div className="max-h-[440px] overflow-y-auto mt-2 space-y-2 pr-1">
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">#{cart.length - idx}</span>
                          <h4 className="font-bold text-xs text-white truncate">{item.productName}</h4>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span>Qty Tag: <strong className="text-white">{item.contentQty}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-zinc-300">{item.barcode}</span>
                          <span>•</span>
                          <span>{item.isTaxable ? `GST ${item.gstRate}%` : 'No Tax'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm border border-zinc-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-12 h-7 rounded glass-input text-center font-mono font-bold text-xs text-white"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm border border-zinc-700"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <p className="text-xs font-black text-white">
                          {formatCurrency(item.totalAmount)}
                        </p>
                        <p className="text-[10px] text-zinc-400">₹{item.unitPrice} / unit</p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Shortcuts: <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded font-mono text-[10px] border border-zinc-700">F2</kbd> Focus Scan | <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded font-mono text-[10px] border border-zinc-700">F4</kbd> Checkout | <kbd className="px-1.5 py-0.5 bg-zinc-900 rounded font-mono text-[10px] border border-zinc-700">F8</kbd> Hold</span>
              <span>Total Items: <strong className="text-white">{cart.reduce((a, c) => a + c.quantity, 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Bill Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-white" />
                  Bill Breakdown
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold border border-zinc-700">
                  {taxMode}
                </span>
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">GST Tax Mode</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTaxMode('EXCLUSIVE')}
                    className={`py-1.5 rounded-lg transition-all ${
                      taxMode === 'EXCLUSIVE' ? 'bg-white text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    + GST Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxMode('INCLUSIVE')}
                    className={`py-1.5 rounded-lg transition-all ${
                      taxMode === 'INCLUSIVE' ? 'bg-white text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    GST Incl.
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxMode('NO_TAX')}
                    className={`py-1.5 rounded-lg transition-all ${
                      taxMode === 'NO_TAX' ? 'bg-white text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    No Tax (0%)
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-zinc-400" /> Discount (₹)
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={billDiscount}
                    onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded glass-input text-right font-mono font-bold text-xs text-white"
                  />
                </div>

                {taxMode !== 'NO_TAX' && totals.taxTotal > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>CGST Breakup</span>
                      <span className="font-mono">{formatCurrency(totals.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>SGST Breakup</span>
                      <span className="font-mono">{formatCurrency(totals.sgstTotal)}</span>
                    </div>
                  </>
                )}

                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Total Discount Saved</span>
                    <span className="font-mono">-{formatCurrency(totals.discountTotal)}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border-2 border-white text-center space-y-1 shadow-inner">
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  Grand Total Payable
                </span>
                <p className="text-3xl font-black text-white tracking-tight">
                  {formatCurrency(totals.grandTotal)}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                disabled={cart.length === 0}
                onClick={() => setPaymentModalOpen(true)}
                className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all border-2 border-white ${
                  cart.length > 0
                    ? 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                CHECKOUT BILL (F4)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={cart.length === 0}
                  onClick={handleHoldBill}
                  className="py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Hold Bill (F8)
                </button>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setCart([])}
                  className="py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs border border-zinc-800 flex items-center justify-center gap-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {searchModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-zinc-700 shadow-2xl p-6 space-y-4 bg-black">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-white" /> Search & Select Item
              </h3>
              <button onClick={() => setSearchModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search product by name, SKU or barcode..."
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              autoFocus
            />

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredManualProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    addItemToCart(p);
                    setSearchModalOpen(false);
                    setManualQuery('');
                  }}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-white">{p.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {p.category} • Qty: {p.contentQty} • Barcode: {p.barcode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{formatCurrency(p.sellingPrice)}</p>
                    <p className="text-[10px] text-zinc-400">Stock: {p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paymentModalOpen && (
        <PaymentModal
          grandTotal={totals.grandTotal}
          settings={settings!}
          onComplete={handleCompletePayment}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}

      {holdModalOpen && (
        <HoldBillsModal onResume={handleResumeBill} onClose={() => setHoldModalOpen(false)} />
      )}

      {returnModalOpen && <ReturnBillModal onClose={() => setReturnModalOpen(false)} />}

      {completedBill && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white shadow-2xl p-6 space-y-4 no-print bg-black">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-2 font-black">
                <Sparkles className="w-6 h-6 text-black animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white">Bill Generated Successfully!</h3>
              <p className="text-xs text-zinc-400">Invoice: {completedBill.invoiceNo}</p>
            </div>

            <div className="p-3 bg-white text-black rounded-xl shadow-inner max-h-80 overflow-y-auto">
              <ThermalReceipt bill={completedBill} settings={settings!} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 border border-white hover:bg-zinc-200"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => setCompletedBill(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs hover:bg-zinc-800"
              >
                Next Bill
              </button>
            </div>
          </div>

          {/* Thermal Receipt Print Area */}
          <div className="print-only">
            <ThermalReceipt bill={completedBill} settings={settings!} />
          </div>
        </div>
      )}
    </div>
  );
};
