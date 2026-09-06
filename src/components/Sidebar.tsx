'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Printer,
  Boxes,
  BarChart3,
  Settings,
  BookOpen,
  PlusCircle,
  Users,
  FileText,
  Wallet,
  Clock,
  AlertCircle,
  Bell,
  Calendar,
  Download,
  ChevronDown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const [udharOpen, setUdharOpen] = useState(true);

  const coreNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/pos', icon: ShoppingCart, highlight: true },
    { name: 'Product Master', href: '/products', icon: Package },
    { name: 'Barcode Printing', href: '/labels', icon: Printer },
    { name: 'Inventory & Stock', href: '/inventory', icon: Boxes },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Shop Settings', href: '/settings', icon: Settings },
  ];

  const udharNavItems = [
    { name: 'Udhar Dashboard', view: 'dashboard', icon: LayoutDashboard },
    { name: 'Add New Udhar', view: 'add', icon: PlusCircle },
    { name: 'Customers', view: 'customers', icon: Users },
    { name: 'Customer Ledger', view: 'ledger', icon: FileText },
    { name: 'Receive Payment', view: 'receive-payment', icon: Wallet },
    { name: 'Pending Payments', view: 'pending', icon: Clock },
    { name: 'Overdue Payments', view: 'overdue', icon: AlertCircle, alert: true },
    { name: 'Reminders', view: 'reminders', icon: Bell },
    { name: 'Reminder History', view: 'reminder-history', icon: Calendar },
    { name: 'Reports', view: 'reports', icon: BarChart3 },
    { name: 'Export & Backup', view: 'export-backup', icon: Download },
  ];

  const isUdharActive = pathname.startsWith('/udhar');

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-30 hidden md:flex shadow-sm overflow-y-auto">
      <div className="p-3 space-y-4 flex-1">
        {/* Core Navigation Section */}
        <div>
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Core Navigation
          </div>
          <div className="space-y-1">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                      : item.highlight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono border border-blue-300 font-extrabold">
                      LIVE
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* UDHAR KHATA / CREDIT MANAGEMENT MODULE */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setUdharOpen(!udharOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg border border-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>📒 Udhar Khata</span>
            </div>
            {udharOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
            )}
          </button>

          {udharOpen && (
            <div className="mt-1.5 ml-2 pl-2 border-l-2 border-blue-200 space-y-1">
              {udharNavItems.map((item) => {
                const Icon = item.icon;
                const itemHref = `/udhar?view=${item.view}`;
                const isActive = isUdharActive && currentView === item.view;

                return (
                  <Link
                    key={item.view}
                    href={itemHref}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : item.alert
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.alert ? 'text-rose-500' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Formula Credit Manager
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Automated calculations, WhatsApp reminders & dynamic khata ledgers active.
          </p>
        </div>
      </div>
    </aside>
  );
};

