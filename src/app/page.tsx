'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Bill, Product, ShopSettings } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import Link from 'next/link';
import {
  ShoppingCart,
  Printer,
  Package,
  Boxes,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DashboardHome() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    setBills(StorageAPI.getBills());
    setProducts(StorageAPI.getProducts());
    setSettings(StorageAPI.getShopSettings());
  }, []);

  const todayStr = new Date().toDateString();
  const todayBills = bills.filter((b) => new Date(b.createdAt).toDateString() === todayStr);
  const todaySales = todayBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const lowStockProds = products.filter((p) => p.stock <= p.lowStockThreshold);

  const recentBills = bills.slice(0, 5);

  const chartMap: { [key: string]: number } = {};
  bills.slice(0, 20).forEach((b) => {
    const d = new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    chartMap[d] = (chartMap[d] || 0) + b.grandTotal;
  });
  const chartData = Object.entries(chartMap).map(([date, sales]) => ({ date, sales }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 text-slate-900">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Welcome to 5Star Online Mart ERP
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
              {settings?.shopName || '5Star Household & Superstore'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mt-1">
              Formula POS Billing, Udhar Khata Credit Management, Barcode Printing, and Inventory Control.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/udhar"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs shadow-sm transition-all border border-blue-200"
            >
              <Receipt className="w-4 h-4 text-blue-600" /> Udhar Khata
            </Link>

            <Link
              href="/pos"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-black text-xs shadow transition-all active:scale-95 border-2 border-blue-600"
            >
              <ShoppingCart className="w-4 h-4" /> Launch POS Counter
            </Link>

            <Link
              href="/labels"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-600" /> Print Stickers
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 shadow-xs bg-white">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Today's Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(todaySales)}</p>
          <p className="text-[10px] text-slate-500">{todayBills.length} Bills generated today</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 shadow-xs bg-white">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{products.length} Products</p>
          <p className="text-[10px] text-slate-500">Auto-barcoded items</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 shadow-xs bg-white">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Low Stock Alert Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{lowStockProds.length} SKUs</p>
          <p className="text-[10px] text-slate-500">Stock ≤ Threshold</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 shadow-xs bg-white">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Total Bills Issued</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{bills.length} Bills</p>
          <p className="text-[10px] text-slate-500">Historical transactions</p>
        </div>
      </div>

      {/* Grid: Chart & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs bg-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Sales Trend Overview
            </h3>
            <Link href="/reports" className="text-xs text-blue-600 underline font-bold flex items-center gap-1">
              Full Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No recent billing data. Start billing at the POS Counter to see trends!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dashRevBW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashRevBW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs bg-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Items
            </h3>
            <Link href="/inventory" className="text-xs text-blue-600 underline font-bold">
              Manage Stock
            </Link>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {lowStockProds.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                All inventory levels are healthy!
              </p>
            ) : (
              lowStockProds.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 truncate max-w-[150px]">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.category} • {p.contentQty}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[11px]">
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills Feed */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs bg-white">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Recent Billing Transactions
          </h3>
          <Link href="/pos" className="text-xs text-blue-600 underline font-bold flex items-center gap-1">
            Open POS Counter <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-center">Items Qty</th>
                <th className="p-3 text-center">Payment Mode</th>
                <th className="p-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recentBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-blue-700">{b.invoiceNo}</td>
                  <td className="p-3 text-slate-500">{formatDate(b.createdAt)}</td>
                  <td className="p-3 font-sans text-slate-900 font-bold">{b.customerName || 'Walk-in Customer'}</td>
                  <td className="p-3 text-center text-slate-600">
                    {b.items.reduce((acc, i) => acc + i.quantity, 0)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans font-bold text-[10px] border border-slate-200">
                      {b.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    {formatCurrency(b.grandTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


