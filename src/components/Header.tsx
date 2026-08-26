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
  ChevronDown
} from 'lucide-react';
import { StorageAPI } from '@/lib/storage';
import { Product, ShopSettings, User as UserType } from '@/types';
import Link from 'next/link';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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

    setSettings(s);
    setCurrentUser(u);
    setUsers(allU);

    const low = prods.filter((p) => p.stock <= p.lowStockThreshold);
    setLowStockProducts(low);
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
    <header className="h-16 border-b border-zinc-800 bg-black sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-md">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-md font-black">
          <Store className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white leading-none tracking-wide flex items-center gap-2">
            {settings?.shopName || 'Akshit Household ERP'}
            <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-700">
              v1.0 ERP
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
            {settings?.tagline || 'Single Store POS & Inventory Control'}
          </p>
        </div>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search products by Name, Barcode or SKU..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg glass-input text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold text-xs shadow transition-all active:scale-95 border border-white"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">POS Counter</span>
        </Link>

        <Link
          href="/labels"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-zinc-700 transition-all"
        >
          <Printer className="w-4 h-4 text-zinc-300" />
          <span className="hidden sm:inline">Print Labels</span>
        </Link>

        {/* Low Stock Alert Bell Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 relative transition-all"
            title="Low Stock Alerts"
          >
            <Bell className="w-5 h-5" />
            {lowStockProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center border border-black shadow">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Low Stock Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-black border border-zinc-700 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-zinc-400" />
                  Low Stock Inventory ({lowStockProducts.length})
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto mt-2 space-y-2 pr-1">
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    All product stocks are healthy!
                  </p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white truncate w-40">{p.name}</p>
                        <p className="text-[10px] text-zinc-400">{p.category} • {p.contentQty}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold border border-zinc-700">
                          Stock: {p.stock} {p.unit}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lowStockProducts.length > 0 && (
                <div className="mt-3 pt-2 border-t border-zinc-800 text-center">
                  <Link
                    href="/inventory"
                    onClick={() => setShowAlerts(false)}
                    className="text-xs text-white underline font-bold inline-flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Manage Stock In / Reorder
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white text-black font-black flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-left hidden lg:block">
              <p className="font-bold text-white leading-tight">{currentUser?.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase font-mono">{currentUser?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-black border border-zinc-700 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400">
                Switch User / Role
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleUserSwitch(u)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                    u.id === currentUser?.id
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[10px] text-zinc-400">{u.role}</p>
                  </div>
                  {u.id === currentUser?.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
