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
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto bg-black text-white">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-white px-2.5 py-1 rounded border border-white">
              Welcome to Akshit ERP
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
              {settings?.shopName || 'Akshit Household Superstore'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl mt-1">
              Plain Black & White POS Billing, CODE128 Label Printing, Inventory Control, and GST Reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/pos"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-black text-xs shadow transition-all active:scale-95 border-2 border-white"
            >
              <ShoppingCart className="w-4 h-4" /> Launch POS Counter
            </Link>

            <Link
              href="/labels"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 transition-all"
            >
              <Printer className="w-4 h-4 text-zinc-300" /> Print Stickers
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Today's Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(todaySales)}</p>
          <p className="text-[10px] text-zinc-500">{todayBills.length} Bills generated today</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{products.length} Products</p>
          <p className="text-[10px] text-zinc-500">Auto-barcoded items</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Low Stock Alert Items</span>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{lowStockProds.length} SKUs</p>
          <p className="text-[10px] text-zinc-500">Stock ≤ Threshold</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Total Bills Issued</span>
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{bills.length} Bills</p>
          <p className="text-[10px] text-zinc-500">Historical transactions</p>
        </div>
      </div>

      {/* Grid: Chart & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl bg-zinc-950">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" /> Sales Trend Overview
            </h3>
            <Link href="/reports" className="text-xs text-white underline font-bold flex items-center gap-1">
              Full Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                No recent billing data. Start billing at the POS Counter to see trends!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dashRevBW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} />
                  <YAxis stroke="#a1a1aa" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000000',
                      borderColor: '#ffffff',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashRevBW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl bg-zinc-950">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" /> Low Stock Items
            </h3>
            <Link href="/inventory" className="text-xs text-white underline font-bold">
              Manage Stock
            </Link>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {lowStockProds.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">
                All inventory levels are healthy!
              </p>
            ) : (
              lowStockProds.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-zinc-800 text-xs"
                >
                  <div>
                    <p className="font-bold text-white truncate max-w-[150px]">{p.name}</p>
                    <p className="text-[10px] text-zinc-400">{p.category} • {p.contentQty}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold border border-zinc-700">
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
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl bg-zinc-950">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" /> Recent Billing Transactions
          </h3>
          <Link href="/pos" className="text-xs text-white underline font-bold flex items-center gap-1">
            Open POS Counter <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-center">Items Qty</th>
                <th className="p-3 text-center">Payment Mode</th>
                <th className="p-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono">
              {recentBills.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900 transition-colors">
                  <td className="p-3 font-bold text-white">{b.invoiceNo}</td>
                  <td className="p-3 text-zinc-400">{formatDate(b.createdAt)}</td>
                  <td className="p-3 font-sans text-white">{b.customerName || 'Walk-in Customer'}</td>
                  <td className="p-3 text-center text-zinc-300">
                    {b.items.reduce((acc, i) => acc + i.quantity, 0)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-sans font-bold text-[10px] border border-zinc-800">
                      {b.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-white">
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
