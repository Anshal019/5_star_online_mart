'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Product, Category, Supplier } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { ProductFormModal } from './ProductFormModal';
import { CSVImportModal } from './CSVImportModal';
import {
  Package,
  Plus,
  Upload,
  Download,
  Search,
  Printer,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Barcode
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [taxFilter, setTaxFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent'>('recent');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(StorageAPI.getProducts());
    setCategories(StorageAPI.getCategories());
    setSuppliers(StorageAPI.getSuppliers());
  };

  const filteredProducts = products.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query));

    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'LOW') matchesStock = p.stock <= p.lowStockThreshold && p.stock > 0;
    if (stockStatusFilter === 'OUT') matchesStock = p.stock === 0;
    if (stockStatusFilter === 'IN') matchesStock = p.stock > p.lowStockThreshold;

    let matchesTax = true;
    if (taxFilter === 'TAXABLE') matchesTax = p.isTaxable;
    if (taxFilter === 'NON_TAXABLE') matchesTax = !p.isTaxable;

    return matchesSearch && matchesCat && matchesStock && matchesTax;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'stock') return b.stock - a.stock;
    return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();
  });

  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProducts.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      selectedIds.forEach((id) => StorageAPI.deleteProduct(id));
      setSelectedIds([]);
      loadData();
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Name', 'Category', 'SubCategory', 'Brand', 'ContentQty', 'PurchasePrice', 'SellingPrice', 'OfferPrice', 'IsTaxable', 'GSTRate', 'HSNCode', 'Stock', 'LowStockThreshold', 'Unit', 'Supplier', 'SKU', 'Barcode'],
      ...sortedProducts.map((p) => [
        `"${p.name}"`,
        `"${p.category}"`,
        `"${p.subCategory || ''}"`,
        `"${p.brand || ''}"`,
        `"${p.contentQty}"`,
        p.purchasePrice,
        p.sellingPrice,
        p.offerPrice || p.sellingPrice,
        p.isTaxable ? 'TRUE' : 'FALSE',
        p.gstRate,
        `"${p.hsnCode || ''}"`,
        p.stock,
        p.lowStockThreshold,
        `"${p.unit}"`,
        `"${p.supplierName || ''}"`,
        `"${p.sku}"`,
        `"${p.barcode}"`,
      ]),
    ];

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `akshit_catalog_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSingle = (id: string, name: string) => {
    if (confirm(`Delete product "${name}"?`)) {
      StorageAPI.deleteProduct(id);
      loadData();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-black text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-white" />
            Product Master Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage product listings, prices, taxability, and auto-generated barcodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 transition-all"
          >
            <Upload className="w-4 h-4 text-zinc-300" />
            Bulk CSV Import
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 transition-all"
          >
            <Download className="w-4 h-4 text-zinc-300" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-extrabold text-xs shadow border-2 border-white transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-zinc-800 space-y-3 bg-zinc-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Barcode, SKU, Brand..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input text-white placeholder-zinc-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-white"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN">In Stock</option>
            <option value="LOW">Low Stock Alert</option>
            <option value="OUT">Out of Stock</option>
          </select>

          <select
            value={taxFilter}
            onChange={(e) => setTaxFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-white"
          >
            <option value="ALL">All Tax Types</option>
            <option value="TAXABLE">Taxable (GST)</option>
            <option value="NON_TAXABLE">Non-Taxable (0%)</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Sort by:</span>
            {(['recent', 'name', 'price', 'stock'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`capitalize px-2.5 py-1 rounded-lg transition-all ${
                  sortBy === s ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{selectedIds.length} Selected</span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-bold border border-zinc-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={handleSelectAllOnPage}
                    className="rounded accent-white"
                  />
                </th>
                <th className="p-3">Product Name & Content</th>
                <th className="p-3">Category</th>
                <th className="p-3">CODE128 Barcode</th>
                <th className="p-3">Stock Status</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">GST Tax</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-900 transition-colors ${
                        isSelected ? 'bg-zinc-900' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded accent-white"
                        />
                      </td>

                      <td className="p-3 font-medium text-white">
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>Qty: <strong className="text-white">{p.contentQty}</strong></span>
                          <span>•</span>
                          <span>SKU: {p.sku}</span>
                          {p.brand && (
                            <>
                              <span>•</span>
                              <span>Brand: {p.brand}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 font-bold border border-zinc-800">
                          {p.category}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        <span className="px-2.5 py-1 rounded bg-black border border-zinc-700 text-white font-bold flex items-center gap-1.5 w-fit">
                          <Barcode className="w-3.5 h-3.5" />
                          {p.barcode}
                        </span>
                      </td>

                      <td className="p-3">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded bg-black text-zinc-500 font-bold border border-zinc-800 line-through">
                            Out of Stock (0)
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold border border-zinc-700 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-white" /> Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold border border-zinc-700">
                            In Stock ({p.stock})
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono">
                        <div className="font-black text-sm text-white">
                          {formatCurrency(p.sellingPrice)}
                        </div>
                        {p.purchasePrice > 0 && (
                          <div className="text-[10px] text-zinc-400">Cost: ₹{p.purchasePrice}</div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {p.isTaxable ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold border border-zinc-800">
                            {p.gstRate}% GST
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-black text-zinc-500">
                            No Tax
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-black border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length} items
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {formModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setFormModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {importModalOpen && (
        <CSVImportModal onClose={() => setImportModalOpen(false)} onSuccess={loadData} />
      )}
    </div>
  );
};
