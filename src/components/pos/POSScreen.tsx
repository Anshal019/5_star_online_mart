'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, BillItem, ShopSettings, Bill } from '@/types';
import { calculateBillTotals, formatCurrency } from '@/lib/formatters';
import { PaymentModal } from './PaymentModal';
import { ThermalReceipt } from './ThermalReceipt';
import { HoldBillsModal } from './HoldBillsModal';
import { ReturnBillModal } from './ReturnBillModal';
import { PhoneScannerModal } from './PhoneScannerModal';
import { CameraScannerModal } from './CameraScannerModal';
import { CustomItemModal } from './CustomItemModal';
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Pause,
  RotateCcw,
  CheckCircle2,
  Printer,
  Percent,
  Receipt,
  X,
  Sparkles,
  AlertCircle,
  Smartphone,
  Camera,
  PlusCircle,
  Package,
  Grid,
  Zap,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const POSScreen: React.FC = () => {
  const [cart, setCart] = useState<BillItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [inlineSearch, setInlineSearch] = useState('');
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX'>('EXCLUSIVE');

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);

  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [scanError, setScanError] = useState('');
  const [lastScannedToast, setLastScannedToast] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimestampRef = useRef<number>(Date.now());

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

  // Stream listener for mobile phone wireless scanner
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scan-stream?since=${lastScanTimestampRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.scans && data.scans.length > 0) {
          lastScanTimestampRef.current = data.latestTimestamp;
          // Process incoming scanned barcodes in order
          data.scans.forEach((scan: { barcode: string }) => {
            handleScannedCode(scan.barcode);
          });
        }
      } catch (err) {}
    }, 800);

    return () => clearInterval(interval);
  }, [products]);

  const loadData = () => {
    const prods = StorageAPI.getProducts();
    const s = StorageAPI.getShopSettings();
    setProducts(prods);
    setSettings(s);

    const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)));
    setCategories(cats);

    if (s) {
      setTaxMode(s.defaultTaxMode || 'EXCLUSIVE');
    }
  };

  const handleScannedCode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setScanError('');
    const matchedProd = StorageAPI.getProductByBarcode(clean);
    if (matchedProd) {
      addItemToCart(matchedProd);
      setLastScannedToast(`✓ Scanned: ${matchedProd.name}`);
      playBeep();
      setTimeout(() => setLastScannedToast(''), 3000);
    } else {
      setScanError(`Barcode "${clean}" not found in product catalog.`);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleScannedCode(barcodeInput.trim());
    setBarcodeInput('');
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
          totalAmount: Math.round((netPrice + taxAmt) * 100) / 100,
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
        totalAmount: Math.round((unitPrice + taxAmt) * 100) / 100,
      };

      return [newItem, ...prevCart];
    });
  };

  const addCustomItemToCart = (item: BillItem) => {
    setCart((prevCart) => [item, ...prevCart]);
    setLastScannedToast(`✓ Added Custom Item: ${item.productName}`);
    setTimeout(() => setLastScannedToast(''), 3000);
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
            totalAmount: Math.round((netPrice + taxAmt) * 100) / 100,
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

  // Filter products for touch billing grid
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      !inlineSearch ||
      p.name.toLowerCase().includes(inlineSearch.toLowerCase()) ||
      p.barcode.includes(inlineSearch) ||
      p.sku.toLowerCase().includes(inlineSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1700px] mx-auto bg-slate-50 text-slate-900">
      {/* Top Action Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm bg-white">
        {/* USB Barcode Scan Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode (USB Scanner) or press F2..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border-2 border-blue-600 text-xs font-mono text-slate-900 placeholder-slate-400 font-bold outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1.5 border border-blue-600"
          >
            Scan
          </button>
        </form>

        {/* Quick Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Phone Wireless Scanner Launcher */}
          <button
            onClick={() => setPhoneModalOpen(true)}
            className="flex-1 md:flex-none items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-extrabold border border-blue-200 shadow-xs flex transition-all"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            Phone Scanner
          </button>

          {/* Web Camera Barcode Modal */}
          <button
            onClick={() => setCameraModalOpen(true)}
            className="flex-1 md:flex-none items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex transition-all"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            Webcam Scan
          </button>

          {/* Custom Unlisted Item */}
          <button
            onClick={() => setCustomItemModalOpen(true)}
            className="flex-1 md:flex-none items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-extrabold border border-emerald-200 flex transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            + Custom Item
          </button>

          <button
            onClick={() => setHoldModalOpen(true)}
            className="items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 flex"
          >
            <Pause className="w-3.5 h-3.5 text-slate-300" />
            Hold [F8]
          </button>

          <button
            onClick={() => setReturnModalOpen(true)}
            className="items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 flex"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
            Returns
          </button>
        </div>
      </div>

      {/* Notifications Toast / Alerts */}
      {scanError && (
        <div className="p-3 rounded-xl bg-red-900 text-white text-xs flex items-center justify-between font-mono shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-200" />
            {scanError}
          </div>
          <button onClick={() => setScanError('')} className="text-red-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {lastScannedToast && (
        <div className="p-3 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          {lastScannedToast}
        </div>
      )}

      {/* Main Billing Split View: Touch Catalog (Left) + Cart & Billing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 Cols): Quick Touch Product Catalog (Billing without scanning) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm min-h-[580px] flex flex-col justify-between">
            <div>
              {/* Touch Catalog Title & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Quick Touch Product Catalog ({filteredProducts.length})
                  </h3>
                </div>

                {/* Inline Search Input */}
                <div className="relative sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={inlineSearch}
                    onChange={(e) => setInlineSearch(e.target.value)}
                    placeholder="Search name, barcode..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                  {inlineSearch && (
                    <button
                      onClick={() => setInlineSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 pr-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  All Items ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Touch Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto mt-2 pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 text-xs font-medium space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No matching products found.</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => addItemToCart(prod)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-95"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {prod.category}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Qty: {prod.contentQty} • Stock: <span className={prod.stock <= prod.lowStockThreshold ? 'text-amber-600 font-bold' : 'text-slate-700'}>{prod.stock}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/80">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {formatCurrency(prod.offerPrice || prod.sellingPrice)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-110 transition-transform">
                          +
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Single-click any item above to add directly to current bill</span>
              <button
                onClick={() => setCustomItemModalOpen(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                + Add Unlisted Item
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column (6 Cols): Active Cart Items & Bill Summary */}
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Cart Table Container */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm min-h-[380px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    Billing Cart Items ({cart.length})
                  </h3>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <ShoppingCart className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Billing Cart is Empty</p>
                    <p className="text-[11px] text-slate-400 text-center max-w-xs">
                      Click items from Touch Catalog on the left, scan with USB/Phone Camera, or add a Custom Item.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto mt-2 space-y-1.5 pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{item.productName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>₹{item.unitPrice} / unit</span>
                            <span>•</span>
                            <span>{item.isTaxable ? `GST ${item.gstRate}%` : 'No Tax'}</span>
                          </p>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300"
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
                            className="w-10 h-6 rounded border border-slate-300 bg-white text-center font-mono font-bold text-xs text-slate-900 outline-none"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[75px]">
                          <p className="text-xs font-black text-slate-900 font-mono">
                            {formatCurrency(item.totalAmount)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Shortcuts: <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-300 text-[9px] font-mono">F2</kbd> Focus Scan | <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-300 text-[9px] font-mono">F4</kbd> Checkout</span>
                <span>Total Items: <strong className="text-slate-900 font-mono">{cart.reduce((a, c) => a + c.quantity, 0)}</strong></span>
              </div>
            </div>

            {/* Bill Summary & Payment Trigger Box */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-blue-600" /> Total Payment Summary
                  </h3>

                  {/* GST Tax Mode Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTaxMode('EXCLUSIVE')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        taxMode === 'EXCLUSIVE' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-600'
                      }`}
                    >
                      + GST Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('INCLUSIVE')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        taxMode === 'INCLUSIVE' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-600'
                      }`}
                    >
                      GST Incl.
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('NO_TAX')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        taxMode === 'NO_TAX' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-600'
                      }`}
                    >
                      No Tax
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(totals.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-slate-400" /> Discount (₹)
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={billDiscount}
                      onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-0.5 rounded border border-slate-300 text-right font-mono font-bold text-xs text-slate-900 outline-none"
                    />
                  </div>

                  {taxMode !== 'NO_TAX' && totals.taxTotal > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>GST Tax Total (CGST + SGST)</span>
                      <span className="font-mono">{formatCurrency(totals.taxTotal)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total Highlight */}
                <div className="p-3 rounded-xl bg-slate-900 text-white text-center space-y-0.5 shadow-md">
                  <span className="text-[10px] font-extrabold text-blue-400 tracking-wider uppercase">
                    Grand Total Payable
                  </span>
                  <p className="text-3xl font-black text-white tracking-tight font-mono">
                    {formatCurrency(totals.grandTotal)}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0}
                onClick={() => setPaymentModalOpen(true)}
                className={`w-full py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all border-2 ${
                  cart.length > 0
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                CHECKOUT & PRINT BILL (F4)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals rendering */}
      {phoneModalOpen && <PhoneScannerModal onClose={() => setPhoneModalOpen(false)} />}

      {cameraModalOpen && (
        <CameraScannerModal
          onScan={(code) => {
            handleScannedCode(code);
            setCameraModalOpen(false);
          }}
          onClose={() => setCameraModalOpen(false)}
        />
      )}

      {customItemModalOpen && (
        <CustomItemModal
          onAdd={addCustomItemToCart}
          onClose={() => setCustomItemModalOpen(false)}
        />
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 no-print text-slate-900">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-black">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-bounce" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Bill Generated Successfully!</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice: {completedBill.invoiceNo}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl shadow-inner max-h-80 overflow-y-auto">
              <ThermalReceipt bill={completedBill} settings={settings!} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 border border-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => setCompletedBill(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Next Bill
              </button>
            </div>
          </div>

          <div className="print-only">
            <ThermalReceipt bill={completedBill} settings={settings!} />
          </div>
        </div>
      )}
    </div>
  );
};
