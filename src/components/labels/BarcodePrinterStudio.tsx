'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, ShopSettings, LabelPrintItem } from '@/types';
import { StickerLabel } from './StickerLabel';
import {
  Printer,
  Search,
  Plus,
  Trash2,
  Sliders,
  CheckSquare,
  Square,
  Tag,
  Settings2
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
  const [customHeader, setCustomHeader] = useState('AKSHIT STORE');

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
    // Allow SVG ref rendering to flush to DOM before opening print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-black text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Printer className="w-7 h-7 text-white" />
            Thermal Barcode Label Printing Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Print CODE128 barcode stickers for single or batch products directly to your thermal printer.
          </p>
        </div>

        <button
          onClick={handleTriggerPrint}
          disabled={selectedItems.length === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-xl transition-all border-2 border-white ${
            selectedItems.length > 0
              ? 'bg-white text-black hover:bg-zinc-200 active:scale-95'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border-zinc-800'
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
          <div className="glass-panel p-4 rounded-2xl space-y-4 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-white" />
                Select Products to Print ({filteredProducts.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-xs text-white hover:underline flex items-center gap-1 font-bold"
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
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter name, barcode, SKU..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg glass-input text-white placeholder-zinc-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg glass-input text-white"
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
                        ? 'bg-zinc-900 border-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-white text-black' : 'border border-zinc-700 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{prod.name}</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{prod.category}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-300">{prod.barcode}</span>
                          <span>•</span>
                          <span>Qty: {prod.contentQty}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">
                        {formatCurrency(prod.sellingPrice)}
                      </p>
                      <p className="text-[10px] text-zinc-400">Stock: {prod.stock}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Controls & Queue */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-2xl space-y-4 border border-zinc-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Settings2 className="w-4 h-4 text-white" />
              Thermal Label Printer Format & Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Sticker Roll Size</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white"
                >
                  <option value="50x25">50mm × 25mm (Standard Retail Roll)</option>
                  <option value="40x25">40mm × 25mm (Compact Sticker)</option>
                  <option value="50x30">50mm × 30mm (Large Label)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Header Shop Text</label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="showShop"
                  checked={showShopName}
                  onChange={(e) => setShowShopName(e.target.checked)}
                  className="rounded accent-white"
                />
                <label htmlFor="showShop" className="text-zinc-300 cursor-pointer font-bold">
                  Show Shop Header Text
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="showMRP"
                  checked={showMRPText}
                  onChange={(e) => setShowMRPText(e.target.checked)}
                  className="rounded accent-white"
                />
                <label htmlFor="showMRP" className="text-zinc-300 cursor-pointer font-bold">
                  Show "MRP" Wording
                </label>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-white">
                Selected Print Batch ({selectedItems.length} Products)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold border border-zinc-700">
                Total: {totalLabelsToPrint} stickers
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No products selected yet. Click products from the catalog on the left to add them to your print queue.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {selectedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <div className="flex-1 pr-3">
                      <p className="font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {item.product.contentQty} • {formatCurrency(item.product.sellingPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.printQuantity}
                          onChange={(e) =>
                            handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 rounded glass-input text-center font-bold text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-1 text-zinc-500 hover:text-white transition-colors"
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
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 no-print">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-white" />
              Live Thermal Sticker Preview ({labelSize} Size)
            </h3>
            <span className="text-xs text-zinc-400">
              Showing single preview for each batch item
            </span>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {selectedItems.map((item) => (
              <div key={item.product.id} className="flex flex-col items-center">
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
                <span className="text-[10px] text-zinc-400 mt-1 font-mono">
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
