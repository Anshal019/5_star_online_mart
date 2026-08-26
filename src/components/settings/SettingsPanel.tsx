'use client';

import React, { useState, useEffect } from 'react';
import { StorageAPI } from '@/lib/storage';
import { ShopSettings, User } from '@/types';
import { Settings, Store, Printer, Shield, CheckCircle2, RefreshCw } from 'lucide-react';

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
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto bg-black text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-white" />
            Shop Configuration & Printer Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure store metadata, invoice numbering, thermal printing defaults, and staff PIN security.
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs border border-zinc-700 transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Reset Demo Data
        </button>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-white text-white text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-white" />
          {savedMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Store className="w-4 h-4 text-white" /> Shop Profile & Invoice Header
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => handleChange('shopName', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Shop Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-300 font-semibold mb-1">Shop Full Address *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Shop GSTIN Number</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Printer className="w-4 h-4 text-white" /> POS Billing & Thermal Printer Defaults
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Default GST Tax Mode</label>
              <select
                value={settings.defaultTaxMode}
                onChange={(e) => handleChange('defaultTaxMode', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              >
                <option value="EXCLUSIVE">EXCLUSIVE (Add GST on top)</option>
                <option value="INCLUSIVE">INCLUSIVE (GST included in MRP)</option>
                <option value="NO_TAX">NO TAX (Simple Cash Memo)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Default Label Sticker Roll Size</label>
              <select
                value={settings.thermalLabelSize}
                onChange={(e) => handleChange('thermalLabelSize', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              >
                <option value="50x25">50mm × 25mm (Standard Retail)</option>
                <option value="40x25">40mm × 25mm (Compact)</option>
                <option value="50x30">50mm × 30mm (Large Label)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Invoice Prefix Format</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-300 font-semibold mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-white"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Shield className="w-4 h-4 text-white" /> Active Staff Accounts & Access Control
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-black border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white text-sm">{u.name}</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Role: {u.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400">PIN: {u.pin || 'None'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 border-2 border-white shadow flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Save Shop & Printer Settings
          </button>
        </div>
      </form>
    </div>
  );
};
