'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Printer,
  Boxes,
  BarChart3,
  Settings,
  Tag
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/pos', icon: ShoppingCart, highlight: true },
    { name: 'Product Master', href: '/products', icon: Package },
    { name: 'Barcode Printing', href: '/labels', icon: Printer },
    { name: 'Inventory & Stock', href: '/inventory', icon: Boxes },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Shop Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-30 hidden md:flex">
      <div className="p-4 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Core Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-white text-black shadow-md border border-white'
                  : item.highlight
                  ? 'bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
              <span>{item.name}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono border border-zinc-700">
                  LIVE
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Info Card */}
      <div className="p-4 border-t border-zinc-800">
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-white font-bold mb-1">
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            Barcode Printer Ready
          </div>
          <p className="text-[11px] text-zinc-400">
            Thermal Sticker rolls (50×25mm, 40×25mm) supported via CODE128 driver.
          </p>
        </div>
      </div>
    </aside>
  );
};
