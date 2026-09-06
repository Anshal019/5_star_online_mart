'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, StockMovement, Supplier } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StockInModal } from './StockInModal';
import { StockOutModal } from './StockOutModal';
import { SupplierModal } from './SupplierModal';
import {
  Boxes,
  Plus,
  MinusCircle,
  AlertTriangle,
  Truck,
  TrendingUp,
  Search,
  PackageCheck,
  Building2
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'suppliers'>('stock');
  const [search, setSearch] = useState('');

  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(StorageAPI.getProducts());
    setMovements(StorageAPI.getStockMovements());
    setSuppliers(StorageAPI.getSuppliers());
  };

  const totalSKUs = products.length;
  const totalCostValue = products.reduce((acc, p) => acc + p.purchasePrice * p.stock, 0);
  const totalMRPValue = products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovements = movements.filter(
    (m) =>
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.user.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 max-w-[1700px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-7 h-7 text-blue-600" />
            Real-Time Inventory & Stock Audit Control
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time stock deduction, stock in entries, damages, valuation, and vendor relationships.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStockInOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-extrabold text-xs shadow border border-blue-600 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Stock In (Purchase)
          </button>

          <button
            onClick={() => setStockOutOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
          >
            <MinusCircle className="w-4 h-4 text-slate-600" /> Stock Out / Damage
          </button>

          <button
            onClick={() => setSupplierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
          >
            <Truck className="w-4 h-4 text-slate-600" /> Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 bg-white shadow-sm">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Total Catalog SKUs</span>
            <PackageCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalSKUs} SKUs</p>
          <p className="text-[10px] text-slate-500">Active stock tracked</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 bg-white shadow-sm">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Inventory Valuation (Cost)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(totalCostValue)}</p>
          <p className="text-[10px] text-slate-500">Total purchase asset value</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 bg-white shadow-sm">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Retail Valuation (MRP)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">{formatCurrency(totalMRPValue)}</p>
          <p className="text-[10px] text-slate-500">Expected sales revenue</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-1 bg-white shadow-sm">
          <div className="flex justify-between text-xs text-slate-500 font-extrabold uppercase">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{lowStockCount} Items</p>
          <p className="text-[10px] text-slate-500">Below threshold level</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'stock' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock Levels
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'movements' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Audit Trail Log
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'suppliers' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendors / Suppliers ({suppliers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Threshold</th>
                  <th className="p-3 text-right">Cost Value</th>
                  <th className="p-3 text-right">Selling Value</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-900">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {p.contentQty} • Barcode: {p.barcode}
                        </div>
                      </td>

                      <td className="p-3">{p.category}</td>
                      <td className="p-3 text-center font-mono">{p.unit}</td>

                      <td className="p-3 text-center font-black text-sm text-slate-900 font-mono">
                        {p.stock}
                      </td>

                      <td className="p-3 text-center font-mono text-slate-500">
                        {p.lowStockThreshold}
                      </td>

                      <td className="p-3 text-right font-mono">
                        {formatCurrency(p.purchasePrice * p.stock)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice * p.stock)}
                      </td>

                      <td className="p-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 line-through">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty Change</th>
                  <th className="p-3 text-center">Prev → New</th>
                  <th className="p-3">Reason / Ref</th>
                  <th className="p-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      No stock movements recorded yet. Sales and stock entries will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {formatDate(m.createdAt)}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {m.type}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-slate-900">{m.productName}</td>

                      <td className="p-3 text-center font-bold font-mono text-slate-900">
                        {m.type === 'STOCK_IN' || m.type === 'RETURN' ? '+' : '-'}
                        {m.qty}
                      </td>

                      <td className="p-3 text-center font-mono text-slate-500">
                        {m.previousStock} → <strong className="text-slate-900">{m.newStock}</strong>
                      </td>

                      <td className="p-3 text-slate-600">{m.reason || 'N/A'}</td>

                      <td className="p-3 font-bold text-slate-900">{m.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs bg-white"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-black flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{sup.name}</h4>
                  <p className="text-xs text-slate-500">Contact: {sup.contactPerson || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 font-mono">
                <p>📞 {sup.phone}</p>
                {sup.email && <p>✉️ {sup.email}</p>}
                {sup.address && <p>📍 {sup.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {stockInOpen && (
        <StockInModal
          products={products}
          suppliers={suppliers}
          onClose={() => setStockInOpen(false)}
          onSuccess={loadData}
        />
      )}

      {stockOutOpen && (
        <StockOutModal
          products={products}
          onClose={() => setStockOutOpen(false)}
          onSuccess={loadData}
        />
      )}

      {supplierOpen && (
        <SupplierModal onClose={() => setSupplierOpen(false)} onSuccess={loadData} />
      )}
    </div>
  );
};
