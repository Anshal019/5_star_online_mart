'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, ShopSettings, LabelPrintItem } from '@/types';
import { StickerLabel } from './StickerLabel';
import {
  Printer,
  Search,
  CheckSquare,
  Square,
  Tag,
  Settings2,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const BarcodePrinterStudio: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [selectedItems, setSelectedItems] = useState<LabelPrintItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [labelSize, setLabelSize] = useState<'50x25' | '40x25' | '50x30'>('50x25');
  const [showShopName, setShowShopName] = useState(true);
  const [showMRPText, setShowMRPText] = useState(true);
  const [customHeader, setCustomHeader] = useState('5STAR MART');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const prods = StorageAPI.getProducts();
    const s = StorageAPI.getShopSettings();
    setProducts(prods);
    setSettings(s);
    if (s) {
      setLabelSize((s.thermalLabelSize as any) || '50x25');
      setShowShopName(s.labelShowShopName ?? true);
      setShowMRPText(s.labelShowMRPText ?? true);
      setCustomHeader(s.labelCustomHeader || s.shopName);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleProduct = (product: Product) => {
    const existingIndex = selectedItems.findIndex((item) => item.product.id === product.id);
    if (existingIndex !== -1) {
      setSelectedItems(selectedItems.filter((item) => item.product.id !== product.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        { product, printQuantity: Math.max(1, product.stock || 1) },
      ]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        filteredProducts.map((p) => ({
          product: p,
          printQuantity: Math.max(1, p.stock || 1),
        }))
      );
    }
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.product.id === productId
          ? { ...item, printQuantity: Math.max(1, qty) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.product.id !== productId));
  };

  const totalLabelsToPrint = selectedItems.reduce((acc, curr) => acc + curr.printQuantity, 0);

  const handleTriggerPrint = () => {
    if (selectedItems.length === 0) return;
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 max-w-[1700px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Printer className="w-7 h-7 text-blue-600" />
            Thermal Barcode Label Printing Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Print CODE128 barcode stickers for single or batch products directly to your thermal printer.
          </p>
        </div>

        <button
          onClick={handleTriggerPrint}
          disabled={selectedItems.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all border-2 ${
            selectedItems.length > 0
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
          }`}
        >
          <Printer className="w-5 h-5" />
          Print {totalLabelsToPrint} Labels Now
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Catalog Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Select Products to Print ({filteredProducts.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                {selectedItems.length === filteredProducts.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> Select All Filtered
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter name, barcode, SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-blue-600 outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((prod) => {
                const isSelected = selectedItems.some((item) => item.product.id === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProduct(prod)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{prod.name}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                          <span>{prod.category}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700">{prod.barcode}</span>
                          <span>•</span>
                          <span>Qty: {prod.contentQty}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 font-mono">
                        {formatCurrency(prod.sellingPrice)}
                      </p>
                      <p className="text-[10px] text-slate-500">Stock: {prod.stock}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Controls & Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-2xl space-y-4 border border-slate-200 bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings2 className="w-4 h-4 text-blue-600" />
              Thermal Label Printer Format & Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Sticker Roll Size</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 outline-none"
                >
                  <option value="50x25">50mm × 25mm (Standard Retail Roll)</option>
                  <option value="40x25">40mm × 25mm (Compact Sticker)</option>
                  <option value="50x30">50mm × 30mm (Large Label)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Header Shop Text</label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="showShop"
                  checked={showShopName}
                  onChange={(e) => setShowShopName(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="showShop" className="text-slate-700 cursor-pointer font-bold">
                  Show Shop Header Text
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="showMRP"
                  checked={showMRPText}
                  onChange={(e) => setShowMRPText(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="showMRP" className="text-slate-700 cursor-pointer font-bold">
                  Show "MRP" Wording
                </label>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-3 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Selected Print Batch ({selectedItems.length} Products)
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-mono font-extrabold border border-blue-200">
                Total: {totalLabelsToPrint} stickers
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                No products selected yet. Click products from the catalog on the left to add them to your print queue.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {selectedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex-1 pr-3">
                      <p className="font-extrabold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.product.contentQty} • {formatCurrency(item.product.sellingPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.printQuantity}
                          onChange={(e) =>
                            handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 bg-white text-center font-extrabold text-slate-900 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 no-print shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600" />
              Live Thermal Sticker Preview ({labelSize} Size)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Showing single preview for each batch item
            </span>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {selectedItems.map((item) => (
              <div key={item.product.id} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                <StickerLabel
                  product={item.product}
                  size={labelSize}
                  settings={{
                    ...settings!,
                    labelShowShopName: showShopName,
                    labelShowMRPText: showMRPText,
                    labelCustomHeader: customHeader,
                  }}
                />
                <span className="text-[10px] text-slate-600 mt-2 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {item.printQuantity} stickers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT-ONLY CONTAINER */}
      <div className="print-only">
        <div className="label-print-container">
          {selectedItems.map((item) => {
            const stickers = [];
            for (let i = 0; i < item.printQuantity; i++) {
              stickers.push(
                <StickerLabel
                  key={`${item.product.id}-${i}`}
                  product={item.product}
                  size={labelSize}
                  settings={{
                    ...settings!,
                    labelShowShopName: showShopName,
                    labelShowMRPText: showMRPText,
                    labelCustomHeader: customHeader,
                  }}
                />
              );
            }
            return stickers;
          })}
        </div>
      </div>
    </div>
  );
};
