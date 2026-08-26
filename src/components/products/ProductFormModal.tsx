'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '@/types';
import { StorageAPI } from '@/lib/storage';
import { StickerLabel } from '../labels/StickerLabel';
import { Package, Barcode, CheckCircle2, RefreshCw, X, Tag } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  suppliers,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || 'Kitchenware',
    subCategory: '',
    brand: '',
    contentQty: '1 pc',
    purchasePrice: 0,
    sellingPrice: 0,
    offerPrice: 0,
    isTaxable: true,
    gstRate: 18,
    hsnCode: '3924',
    stock: 10,
    lowStockThreshold: 5,
    unit: 'Piece',
    supplierName: suppliers[0]?.name || '',
    barcode: '',
  });

  const [barcodePreview, setBarcodePreview] = useState('');

  useEffect(() => {
    if (product) {
      setFormData(product);
      setBarcodePreview(product.barcode);
    } else {
      // Auto pre-generate next sequence barcode preview
      const prods = StorageAPI.getProducts();
      const nextSeq = 1001 + prods.length;
      const code = `8904000${String(nextSeq).padStart(5, '0')}`;
      setFormData((prev) => ({ ...prev, barcode: code }));
      setBarcodePreview(code);
    }
  }, [product]);

  const handleChange = (field: keyof Product, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'barcode') {
        setBarcodePreview(value);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.sellingPrice) {
      alert('Please fill in required fields: Product Name, Category and Selling Price.');
      return;
    }

    StorageAPI.saveProduct(formData as any);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
            <Package className="w-6 h-6 text-brand-400" />
            {product ? 'Edit Product Master' : 'Add New Product (Auto Barcode)'}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stainless Steel Pressure Cooker 3L"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Content / Quantity Tag <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 500 ml, 1 pc, Set of 3"
                value={formData.contentQty || ''}
                onChange={(e) => handleChange('contentQty', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sub-Category (Optional)</label>
              <input
                type="text"
                placeholder="Cookware, Storage"
                value={formData.subCategory || ''}
                onChange={(e) => handleChange('subCategory', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Apex, Mahavir"
                value={formData.brand || ''}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          {/* Section 2: Pricing & GST */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Pricing, Tax & GST Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Price (Cost ₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice || 0}
                  onChange={(e) => handleChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selling Price / MRP (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice || 0}
                  onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Offer / Special Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.offerPrice || 0}
                  onChange={(e) => handleChange('offerPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* GST Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={formData.isTaxable ?? true}
                  onChange={(e) => handleChange('isTaxable', e.target.checked)}
                  className="rounded accent-brand-500 w-4 h-4"
                />
                <label htmlFor="taxable" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Product is Taxable (GST)
                </label>
              </div>

              {formData.isTaxable && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GST Rate (%)</label>
                    <select
                      value={formData.gstRate ?? 18}
                      onChange={(e) => handleChange('gstRate', parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    >
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">HSN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 3924, 7323"
                      value={formData.hsnCode || ''}
                      onChange={(e) => handleChange('hsnCode', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Stock & Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Stock Qty</label>
              <input
                type="number"
                min="0"
                value={formData.stock ?? 0}
                onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold ?? 5}
                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 5)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Type</label>
              <select
                value={formData.unit || 'Piece'}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              >
                <option value="Piece">Piece (pc)</option>
                <option value="Kg">Kilogram (Kg)</option>
                <option value="Litre">Litre (L)</option>
                <option value="Box">Box</option>
                <option value="Set">Set</option>
                <option value="Dozen">Dozen</option>
              </select>
            </div>
          </div>

          {/* Barcode Number & Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Barcode className="w-4 h-4 text-brand-400" /> CODE128 Barcode Number
              </label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-assigned by system. Override manually if product has a manufacturer barcode.
              </p>
            </div>

            {/* Sticker Preview */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 mb-1">Thermal Sticker Preview:</span>
              {formData.barcode && (
                <StickerLabel
                  product={{
                    ...formData,
                    id: formData.id || 'preview',
                    name: formData.name || 'Sample Household Item',
                    barcode: formData.barcode || '8901001001',
                    contentQty: formData.contentQty || '1 pc',
                    sellingPrice: formData.sellingPrice || 199,
                  } as Product}
                  size="50x25"
                />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl glass-card text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Product & Update Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
