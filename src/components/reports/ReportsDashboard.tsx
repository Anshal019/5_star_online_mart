'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Bill, Product } from '@/types';
import { formatCurrency, formatDate, formatShortDate } from '@/lib/formatters';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Download,
  Award
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

export const ReportsDashboard: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');

  useEffect(() => {
    setBills(StorageAPI.getBills());
    setProducts(StorageAPI.getProducts());
  }, []);

  const now = new Date();
  const filteredBills = bills.filter((b) => {
    const d = new Date(b.createdAt);
    if (dateRange === 'TODAY') {
      return d.toDateString() === now.toDateString();
    } else if (dateRange === 'THIS_WEEK') {
      const weekAgo = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    } else if (dateRange === 'THIS_MONTH') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalBillsCount = filteredBills.length;
  const averageTicket = totalBillsCount > 0 ? totalRevenue / totalBillsCount : 0;
  const totalGSTCollected = filteredBills.reduce((acc, b) => acc + b.taxTotal, 0);

  let totalCostOfGoods = 0;
  filteredBills.forEach((b) => {
    b.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.purchasePrice : item.unitPrice * 0.6;
      totalCostOfGoods += cost * item.quantity;
    });
  });

  const grossProfit = totalRevenue - totalCostOfGoods;
  const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const chartDataMap: { [key: string]: { date: string; revenue: number; orders: number } } = {};
  filteredBills.forEach((b) => {
    const key = formatShortDate(b.createdAt);
    if (!chartDataMap[key]) {
      chartDataMap[key] = { date: key, revenue: 0, orders: 0 };
    }
    chartDataMap[key].revenue += b.grandTotal;
    chartDataMap[key].orders += 1;
  });
  const chartData = Object.values(chartDataMap);

  const itemSalesMap: { [key: string]: { name: string; category: string; qty: number; revenue: number } } = {};
  filteredBills.forEach((b) => {
    b.items.forEach((i) => {
      if (!itemSalesMap[i.productName]) {
        itemSalesMap[i.productName] = {
          name: i.productName,
          category: i.contentQty,
          qty: 0,
          revenue: 0,
        };
      }
      itemSalesMap[i.productName].qty += i.quantity;
      itemSalesMap[i.productName].revenue += i.totalAmount;
    });
  });
  const topSellers = Object.values(itemSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const gstBreakdownMap: { [rate: number]: { taxable: number; cgst: number; sgst: number; totalTax: number } } = {
    5: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    12: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    18: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    28: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  };

  filteredBills.forEach((b) => {
    b.items.forEach((item) => {
      if (item.isTaxable && item.gstRate > 0) {
        const rate = item.gstRate;
        const taxable = item.unitPrice * item.quantity - item.discount * item.quantity;
        const tax = item.taxAmount;
        if (!gstBreakdownMap[rate]) {
          gstBreakdownMap[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
        }
        gstBreakdownMap[rate].taxable += taxable;
        gstBreakdownMap[rate].cgst += tax / 2;
        gstBreakdownMap[rate].sgst += tax / 2;
        gstBreakdownMap[rate].totalTax += tax;
      }
    });
  });

  const handleExportGSTReport = () => {
    const rows = [
      ['GST Rate (%)', 'Taxable Amount (₹)', 'CGST (₹)', 'SGST (₹)', 'Total GST Collected (₹)'],
      ...Object.entries(gstBreakdownMap).map(([rate, data]) => [
        `${rate}%`,
        data.taxable.toFixed(2),
        data.cgst.toFixed(2),
        data.sgst.toFixed(2),
        data.totalTax.toFixed(2),
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gst_tax_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-black text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-white" />
            GST Tax & Profit Analytics Dashboard
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time financial performance, GST tax collections, product margins, and sales trends.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-bold">
          {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'ALL'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === r ? 'bg-white text-black font-extrabold shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-zinc-500">{totalBillsCount} Bills issued</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Gross Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(grossProfit)}</p>
          <p className="text-[10px] text-zinc-300 font-bold">
            {profitMarginPercent.toFixed(1)}% Profit Margin
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Total GST Tax Collected</span>
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalGSTCollected)}</p>
          <p className="text-[10px] text-zinc-500">CGST + SGST Split</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-1 bg-zinc-950">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Average Ticket Size</span>
            <Award className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(averageTicket)}</p>
          <p className="text-[10px] text-zinc-500">Per bill average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" /> Revenue & Sales Trend
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Total {chartData.length} Days</span>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                No billing data for selected date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevBW" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="revenue"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevBW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Award className="w-4 h-4 text-white" /> Best Selling Products
          </h3>

          <div className="space-y-3">
            {topSellers.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No sales recorded yet.</p>
            ) : (
              topSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white truncate max-w-[140px]">{item.name}</p>
                      <p className="text-[10px] text-zinc-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white">{formatCurrency(item.revenue)}</p>
                    <p className="text-[10px] text-zinc-400">{item.qty} units sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GST Table */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-white" /> GST Tax Collection Breakdown (Monthly GSTR Filing)
            </h3>
            <p className="text-xs text-zinc-400">Summarized B2C tax split per GST slab</p>
          </div>

          <button
            onClick={handleExportGSTReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export GST Report (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">GST Rate Slab</th>
                <th className="p-3 text-right">Taxable Sales Value</th>
                <th className="p-3 text-right">CGST (Central Tax)</th>
                <th className="p-3 text-right">SGST (State Tax)</th>
                <th className="p-3 text-right">Total Tax Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono">
              {Object.entries(gstBreakdownMap).map(([rate, data]) => (
                <tr key={rate} className="hover:bg-zinc-900">
                  <td className="p-3 font-bold text-white">{rate}% GST Slab</td>
                  <td className="p-3 text-right">{formatCurrency(data.taxable)}</td>
                  <td className="p-3 text-right text-zinc-400">{formatCurrency(data.cgst)}</td>
                  <td className="p-3 text-right text-zinc-400">{formatCurrency(data.sgst)}</td>
                  <td className="p-3 text-right font-black text-white">
                    {formatCurrency(data.totalTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
