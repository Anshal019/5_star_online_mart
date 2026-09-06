'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { Settings, Store, Printer, Shield, CheckCircle2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { exportFullSystemBackupToExcel } from '@/lib/backup';

export const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSettings(StorageAPI.getShopSettings());
    setUsers(StorageAPI.getUsers());
  };

  const handleChange = (field: keyof ShopSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      StorageAPI.saveShopSettings(settings);
      setSavedMsg('Shop Profile & Thermal Printer preferences saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Reset database to clean initial demo data? This will restore sample products and initial setup.')) {
      StorageAPI.resetDemoData();
      window.location.reload();
    }
  };

  if (!settings) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto bg-slate-50 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Shop Configuration & Printer Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure store metadata, invoice numbering, thermal printing defaults, and staff PIN security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportFullSystemBackupToExcel()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs border border-emerald-600 shadow-md transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" /> Download Full System Backup (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs border border-slate-300 transition-all w-fit"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" /> Reset Demo Data
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          {savedMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-blue-600" /> Shop Profile & Invoice Header
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => handleChange('shopName', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Shop Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Shop Full Address *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Shop GSTIN Number</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Printer className="w-4 h-4 text-blue-600" /> POS Billing & Thermal Printer Defaults
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default GST Tax Mode</label>
              <select
                value={settings.defaultTaxMode}
                onChange={(e) => handleChange('defaultTaxMode', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 outline-none"
              >
                <option value="EXCLUSIVE">EXCLUSIVE (Add GST on top)</option>
                <option value="INCLUSIVE">INCLUSIVE (GST included in MRP)</option>
                <option value="NO_TAX">NO TAX (Simple Cash Memo)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Label Sticker Roll Size</label>
              <select
                value={settings.thermalLabelSize}
                onChange={(e) => handleChange('thermalLabelSize', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 outline-none"
              >
                <option value="50x25">50mm × 25mm (Standard Retail)</option>
                <option value="40x25">40mm × 25mm (Compact)</option>
                <option value="50x30">50mm × 30mm (Large Label)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Invoice Prefix Format</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:border-blue-600 outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" /> Active Staff Accounts & Access Control
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Username: {u.username} • Role: {u.role}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200">
                    PIN: {u.pin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all border border-blue-600 active:scale-95"
          >
            Save Settings & Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
