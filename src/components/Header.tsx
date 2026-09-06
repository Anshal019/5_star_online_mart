'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Bell,
  User,
  Shield,
  Search,
  ShoppingCart,
  Printer,
  Package,
  AlertTriangle,
  ChevronDown,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import { StorageAPI } from '@/lib/storage';
import { Product, ShopSettings, User as UserType, Customer } from '@/types';
import { BackupModal } from './backup/BackupModal';
import Link from 'next/link';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [overdueCustomers, setOverdueCustomers] = useState<Customer[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const s = StorageAPI.getShopSettings();
    const u = StorageAPI.getCurrentUser();
    const allU = StorageAPI.getUsers();
    const prods = StorageAPI.getProducts();
    const custs = StorageAPI.getCustomers();

    setSettings(s);
    setCurrentUser(u);
    setUsers(allU);

    const low = prods.filter((p) => p.stock <= p.lowStockThreshold);
    setLowStockProducts(low);

    const overdue = custs.filter((c) => c.paymentStatus === 'OVERDUE' || (c.totalPending > 0 && c.paymentStatus !== 'PAID'));
    setOverdueCustomers(overdue);
  };

  const handleUserSwitch = (user: UserType) => {
    StorageAPI.setCurrentUser(user);
    setCurrentUser(user);
    setShowUserDropdown(false);
    window.location.reload();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow font-black">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-slate-900 leading-none tracking-wide flex items-center gap-2">
            {settings?.shopName || '5Star Online Mart ERP'}
            <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded border border-blue-200 font-bold">
              Formula v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            {settings?.tagline || 'Store Billing, Inventory & Credit Management'}
          </p>
        </div>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search products by Name, Barcode or SKU..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg glass-input text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Link
          href="/udhar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Udhar Khata</span>
          {overdueCustomers.length > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-bold">
              {overdueCustomers.length}
            </span>
          )}
        </Link>

        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all active:scale-95 border border-blue-600"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">POS Counter</span>
        </Link>

        <Link
          href="/labels"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">Labels</span>
        </Link>

        {/* Day-End Excel Backup Trigger */}
        <button
          onClick={() => setShowBackupModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all shadow-sm"
          title="Daily Excel Full System Backup & Disaster Recovery"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden lg:inline">EOD Backup</span>
        </button>

        {/* Low Stock Alert Bell Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 relative transition-all"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {(lowStockProducts.length > 0 || overdueCustomers.length > 0) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                {lowStockProducts.length + overdueCustomers.length}
              </span>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Notifications & Alerts
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto mt-2 space-y-2 pr-1">
                {overdueCustomers.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
                      Udhar Payment Alerts ({overdueCustomers.length})
                    </p>
                    {overdueCustomers.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        href="/udhar?view=overdue"
                        onClick={() => setShowAlerts(false)}
                        className="flex items-center justify-between p-2 mb-1 rounded-lg bg-rose-50 border border-rose-200 text-xs hover:bg-rose-100 transition-colors block"
                      >
                        <div>
                          <p className="font-bold text-slate-900 truncate w-36">{c.name}</p>
                          <p className="text-[10px] text-slate-500">Mobile: {c.mobile}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-rose-700 font-mono">
                            ₹{c.totalPending.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                    Low Stock Products ({lowStockProducts.length})
                  </p>
                  {lowStockProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      All inventory stocks look healthy!
                    </p>
                  ) : (
                    lowStockProducts.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 mb-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800 truncate w-36">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.category}</p>
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

              <div className="mt-3 pt-2 border-t border-slate-100 text-center flex justify-between text-xs">
                <Link
                  href="/inventory"
                  onClick={() => setShowAlerts(false)}
                  className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  Inventory
                </Link>
                <Link
                  href="/udhar?view=reminders"
                  onClick={() => setShowAlerts(false)}
                  className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Udhar Reminders
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left hidden lg:block">
              <p className="font-bold text-slate-800 leading-tight">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-mono">{currentUser?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
                Switch User Profile
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleUserSwitch(u)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                    u.id === currentUser?.id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.role}</p>
                  </div>
                  {u.id === currentUser?.id && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBackupModal && <BackupModal onClose={() => setShowBackupModal(false)} />}
    </header>
  );
};

