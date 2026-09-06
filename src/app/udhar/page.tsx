'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Users,
  FileText,
  Wallet,
  Clock,
  AlertCircle,
  Bell,
  Calendar,
  Download,
  Upload,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  Phone,
  Building,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { StorageAPI } from '@/lib/storage';
import {
  Customer,
  UdharTransaction,
  PaymentTransaction,
  ReminderLog,
  CustomerNote,
  Product,
  PaymentStatus,
  LedgerEntry
} from '@/types';
import * as XLSX from 'xlsx';

export default function UdharKhataPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentView = searchParams.get('view') || 'dashboard';

  // Core Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [udharTxns, setUdharTxns] = useState<UdharTransaction[]>([]);
  const [paymentTxns, setPaymentTxns] = useState<PaymentTransaction[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Selection & Modal States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form States - Add Customer
  const [custForm, setCustForm] = useState({
    name: '',
    mobile: '',
    address: '',
    shopName: '',
    customerId: '',
    registrationDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Form States - Add New Udhar
  const [udharForm, setUdharForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    productName: '',
    quantity: 1,
    productPrice: 0,
    amountPaidNow: 0,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  // Form States - Receive Payment
  const [payForm, setPayForm] = useState({
    customerId: '',
    paymentAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI' as 'Cash' | 'UPI' | 'Bank Transfer',
    refNumber: '',
    notes: '',
  });

  // Form States - Add Customer Note
  const [newNoteText, setNewNoteText] = useState('');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('PENDING_DESC');

  // Load Data Effect
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const custs = StorageAPI.getCustomers();
    const udhs = StorageAPI.getUdharTransactions();
    const pays = StorageAPI.getPaymentTransactions();
    const rems = StorageAPI.getReminderLogs();
    const notes = StorageAPI.getCustomerNotes();
    const prods = StorageAPI.getProducts();

    setCustomers(custs);
    setUdharTxns(udhs);
    setPaymentTxns(pays);
    setReminderLogs(rems);
    setCustomerNotes(notes);
    setProducts(prods);

    if (custs.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(custs[0].id);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const changeView = (view: string) => {
    router.push(`/udhar?view=${view}`);
  };

  // Dashboard Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalUdhar = customers.reduce((acc, c) => acc + c.totalUdhar, 0);
    const totalReceived = customers.reduce((acc, c) => acc + c.totalReceived, 0);
    const totalPending = customers.reduce((acc, c) => acc + c.totalPending, 0);
    const pendingCustomersCount = customers.filter((c) => c.totalPending > 0).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueAmount = customers
      .filter((c) => c.paymentStatus === 'OVERDUE')
      .reduce((acc, c) => acc + c.totalPending, 0);

    return {
      totalUdhar,
      totalReceived,
      totalPending,
      overdueAmount,
      pendingCustomersCount,
    };
  }, [customers]);

  // Dynamic Calculation Handlers
  const calculatedUdharTotal = udharForm.quantity * udharForm.productPrice;
  const calculatedUdharRemaining = Math.max(0, calculatedUdharTotal - udharForm.amountPaidNow);

  // Customer Form Actions
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim() || !custForm.mobile.trim()) {
      showToast('Please provide Customer Name and Mobile Number', 'error');
      return;
    }

    if (editingCustomer) {
      StorageAPI.saveCustomer({
        ...editingCustomer,
        name: custForm.name,
        mobile: custForm.mobile,
        address: custForm.address,
        shopName: custForm.shopName,
        notes: custForm.notes,
      });
      showToast(`Updated customer ${custForm.name} successfully!`);
    } else {
      StorageAPI.saveCustomer({
        name: custForm.name,
        mobile: custForm.mobile,
        address: custForm.address,
        shopName: custForm.shopName,
        customerId: custForm.customerId || undefined,
        registrationDate: custForm.registrationDate,
        notes: custForm.notes,
      });
      showToast(`Added new customer ${custForm.name} successfully!`);
    }

    setCustForm({
      name: '',
      mobile: '',
      address: '',
      shopName: '',
      customerId: '',
      registrationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingCustomer(null);
    setShowAddCustomerModal(false);
    loadAllData();
  };

  const handleEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustForm({
      name: cust.name,
      mobile: cust.mobile,
      address: cust.address || '',
      shopName: cust.shopName || '',
      customerId: cust.customerId,
      registrationDate: cust.registrationDate,
      notes: cust.notes || '',
    });
    setShowAddCustomerModal(true);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}" and all related transactions?`)) {
      StorageAPI.deleteCustomer(id);
      showToast(`Deleted customer ${name}`, 'info');
      loadAllData();
    }
  };

  // Add Udhar Form Submission
  const handleSaveUdhar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!udharForm.customerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (!udharForm.productName.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }
    if (udharForm.productPrice <= 0) {
      showToast('Please enter a valid product price', 'error');
      return;
    }

    try {
      StorageAPI.saveUdharTransaction({
        customerId: udharForm.customerId,
        date: udharForm.date,
        productName: udharForm.productName,
        quantity: udharForm.quantity,
        productPrice: udharForm.productPrice,
        amountPaidNow: udharForm.amountPaidNow,
        dueDate: udharForm.dueDate,
        notes: udharForm.notes,
      });

      showToast('Udhar entry added and customer ledger updated!');
      setUdharForm({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        productName: '',
        quantity: 1,
        productPrice: 0,
        amountPaidNow: 0,
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        notes: '',
      });
      loadAllData();
      changeView('ledger');
    } catch (err: any) {
      showToast(err?.message || 'Error saving Udhar transaction', 'error');
    }
  };

  // Receive Payment Submission
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.customerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (payForm.paymentAmount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    try {
      StorageAPI.savePaymentTransaction({
        customerId: payForm.customerId,
        paymentAmount: payForm.paymentAmount,
        paymentDate: payForm.paymentDate,
        paymentMethod: payForm.paymentMethod,
        refNumber: payForm.refNumber,
        notes: payForm.notes,
      });

      showToast('Payment received and pending balance updated successfully!');
      setPayForm({
        customerId: '',
        paymentAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        refNumber: '',
        notes: '',
      });
      loadAllData();
      changeView('ledger');
    } catch (err: any) {
      showToast(err?.message || 'Error receiving payment', 'error');
    }
  };

  // WhatsApp Reminder Sender
  const sendWhatsAppReminder = (cust: Customer, customType: string = 'Payment Reminder') => {
    const cleanMobile = cust.mobile.replace(/\D/g, '');
    const mobileWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    const message = `Hello ${cust.name},

This is a friendly payment reminder from 5Star Online Mart.

Your pending Udhar balance is ₹${cust.totalPending.toLocaleString('en-IN')}.
Status: ${cust.paymentStatus}

Please complete your payment as soon as possible.
Thank You.`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${mobileWithCode}?text=${encoded}`;

    // Log the reminder action
    StorageAPI.logReminder({
      customerId: cust.id,
      customerName: cust.name,
      reminderDate: new Date().toISOString().split('T')[0],
      pendingAmount: cust.totalPending,
      daysPending: 15,
      reminderType: customType as any,
      status: 'Sent',
    });

    showToast(`WhatsApp reminder initialized for ${cust.name}!`);
    loadAllData();
    window.open(url, '_blank');
  };

  // Add Customer Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Select a customer to add note', 'error');
      return;
    }
    if (!newNoteText.trim()) return;

    StorageAPI.saveCustomerNote(selectedCustomerId, newNoteText.trim());
    showToast('Customer note added!');
    setNewNoteText('');
    loadAllData();
  };

  const handleDeleteNote = (noteId: string) => {
    StorageAPI.deleteCustomerNote(noteId);
    showToast('Note deleted');
    loadAllData();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = customers.map((c) => ({
      'Customer ID': c.customerId,
      'Customer Name': c.name,
      'Mobile Number': c.mobile,
      'Shop / Business': c.shopName || '-',
      'Total Udhar (₹)': c.totalUdhar,
      'Total Received (₹)': c.totalReceived,
      'Pending Amount (₹)': c.totalPending,
      'Payment Status': c.paymentStatus,
      'Registration Date': c.registrationDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Udhar Customers');
    XLSX.writeFile(workbook, `Udhar_Khata_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Exported customer list to Excel!');
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const jsonStr = StorageAPI.exportUdharData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Udhar_Khata_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Downloaded Udhar Khata JSON backup file!');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageAPI.importUdharData(content);
      if (success) {
        showToast('Restored Udhar Khata data successfully!');
        loadAllData();
      } else {
        showToast('Failed to restore backup file. Invalid format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Search & Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesQuery =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.mobile.includes(searchQuery) ||
          c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.shopName && c.shopName.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
          matchesStatus = c.paymentStatus === statusFilter;
        }

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'PENDING_DESC') return b.totalPending - a.totalPending;
        if (sortBy === 'PENDING_ASC') return a.totalPending - b.totalPending;
        if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [customers, searchQuery, statusFilter, sortBy]);

  // Selected Customer Ledger
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  const selectedLedger = useMemo(() => {
    if (!selectedCustomer) return [];
    return StorageAPI.getCustomerLedger(selectedCustomer.id);
  }, [selectedCustomer, udharTxns, paymentTxns]);

  const activeCustomerNotes = useMemo(() => {
    if (!selectedCustomer) return [];
    return customerNotes.filter((n) => n.customerId === selectedCustomer.id);
  }, [selectedCustomer, customerNotes]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-bold animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Udhar Khata / Credit Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer balances, credit entries, payment receipts, automatic reminders & khata ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setCustForm({
                name: '',
                mobile: '',
                address: '',
                shopName: '',
                customerId: '',
                registrationDate: new Date().toISOString().split('T')[0],
                notes: '',
              });
              setShowAddCustomerModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Users className="w-4 h-4" />
            Add Customer
          </button>

          <button
            onClick={() => changeView('add')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Udhar
          </button>

          <button
            onClick={() => changeView('receive-payment')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Receive Payment
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel Export
          </button>
        </div>
      </div>

      {/* Submenu View Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard },
          { id: 'add', label: '➕ Add Udhar', icon: PlusCircle },
          { id: 'customers', label: '👥 Customers', icon: Users },
          { id: 'ledger', label: '📒 Customer Ledger', icon: FileText },
          { id: 'receive-payment', label: '💰 Receive Payment', icon: Wallet },
          { id: 'pending', label: '⏳ Pending Payments', icon: Clock },
          { id: 'overdue', label: '🔴 Overdue Alerts', icon: AlertCircle },
          { id: 'reminders', label: '🔔 Reminders', icon: Bell },
          { id: 'reminder-history', label: '📅 Reminder History', icon: Calendar },
          { id: 'reports', label: '📊 Financial Reports', icon: FileText },
          { id: 'export-backup', label: '📥 Backup & Restore', icon: Download },
        ].map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeView(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 📊 1. UDHAR DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">
          {/* Modern Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Udhar Given</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">💰</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-mono">
                  ₹{summaryMetrics.totalUdhar.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Total credit extended</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Received</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">💵</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{summaryMetrics.totalReceived.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Payments collected</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Pending</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold">⏳</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-700 font-mono">
                  ₹{summaryMetrics.totalPending.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Outstanding customer balance</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between bg-rose-50/30">
              <div className="flex items-center justify-between text-rose-600 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Overdue Amount</span>
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700 font-bold">🔴</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-rose-700 font-mono">
                  ₹{summaryMetrics.overdueAmount.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-rose-600 mt-1">Past due date payment total</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">Pending Customers</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold">👥</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-mono">
                  {summaryMetrics.pendingCustomersCount}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Customers with active pending balance</p>
              </div>
            </div>
          </div>

          {/* Alert Banner if Overdue */}
          {summaryMetrics.overdueAmount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold">⚠️ PAYMENT REMINDER ALERT:</span> You have ₹
                  {summaryMetrics.overdueAmount.toLocaleString('en-IN')} overdue across customer accounts!
                </div>
              </div>
              <button
                onClick={() => changeView('overdue')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs"
              >
                View Overdue Payments
              </button>
            </div>
          )}

          {/* Grid Layout: Recent Transactions & Overdue List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Credit Transactions */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  Recent Credit Transactions (Udhar)
                </h3>
                <button onClick={() => changeView('customers')} className="text-xs font-bold text-blue-600 hover:underline">
                  View All Customers →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-right">Total Amount</th>
                      <th className="py-2 px-3 text-right">Paid Now</th>
                      <th className="py-2 px-3 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {udharTxns.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{t.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{t.customerName}</td>
                        <td className="py-2.5 px-3">{t.productName} ({t.quantity} pc)</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{t.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          ₹{t.amountPaidNow.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                          ₹{t.remainingAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overdue Customers List */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Overdue Customers
                </h3>
                <span className="text-[10px] bg-rose-100 text-rose-808 font-mono px-2 py-0.5 rounded-full font-bold">
                  Action Required
                </span>
              </div>

              <div className="space-y-3">
                {customers
                  .filter((c) => c.paymentStatus === 'OVERDUE' || (c.totalPending > 0 && c.paymentStatus !== 'PAID'))
                  .slice(0, 4)
                  .map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{cust.name}</p>
                        <p className="text-[11px] text-slate-500">📱 {cust.mobile}</p>
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                          Pending: ₹{cust.totalPending.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => sendWhatsAppReminder(cust, 'Overdue Payment Alert')}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-all flex items-center gap-1 text-[11px]"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Remind
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👤 2. CUSTOMER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {currentView === 'customers' && (
        <div className="space-y-6">
          {/* Controls: Search, Filters & Action */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by Name, Mobile number, Customer ID or Shop..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-808 placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl glass-input text-slate-800 font-medium"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">🟢 PAID</option>
                <option value="PARTIAL PAID">🟡 PARTIAL PAID</option>
                <option value="PENDING">🔴 PENDING</option>
                <option value="OVERDUE">⚠️ OVERDUE</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl glass-input text-slate-800 font-medium"
              >
                <option value="PENDING_DESC">Highest Pending Amount</option>
                <option value="PENDING_ASC">Lowest Pending Amount</option>
                <option value="NAME_ASC">Customer Name (A-Z)</option>
              </select>

              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setCustForm({
                    name: '',
                    mobile: '',
                    address: '',
                    shopName: '',
                    customerId: '',
                    registrationDate: new Date().toISOString().split('T')[0],
                    notes: '',
                  });
                  setShowAddCustomerModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Customer Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Shop / Business</th>
                  <th className="py-3 px-4 text-right">Total Udhar</th>
                  <th className="py-3 px-4 text-right">Total Received</th>
                  <th className="py-3 px-4 text-right">Pending Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{cust.customerId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{cust.name}</p>
                      <p className="text-[10px] text-slate-400">Reg: {cust.registrationDate}</p>
                    </td>
                    <td className="py-3 px-4 font-mono">{cust.mobile}</td>
                    <td className="py-3 px-4 text-slate-500">{cust.shopName || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                      ₹{cust.totalUdhar.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      ₹{cust.totalReceived.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-extrabold text-sm">
                      ₹{cust.totalPending.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cust.paymentStatus === 'PAID'
                            ? 'badge-status-paid'
                            : cust.paymentStatus === 'PARTIAL PAID'
                            ? 'badge-status-partial'
                            : cust.paymentStatus === 'OVERDUE'
                            ? 'badge-status-overdue'
                            : 'badge-status-pending'
                        }`}
                      >
                        {cust.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          changeView('ledger');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200"
                        title="View Customer Khata Ledger"
                      >
                        Ledger
                      </button>
                      <button
                        onClick={() => sendWhatsAppReminder(cust)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(cust)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 3. ADD NEW UDHAR FORM VIEW */}
      {/* ========================================================================= */}
      {currentView === 'add' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Add New Udhar Entry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record new item given on credit to a customer. Total and remaining balance will auto calculate.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200">
              JS Auto Calc Active
            </span>
          </div>

          <form onSubmit={handleSaveUdhar} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Select Customer Name *</label>
                <select
                  value={udharForm.customerId}
                  onChange={(e) => setUdharForm({ ...udharForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile}) - Pending: ₹{c.totalPending}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Udhar Date *</label>
                <input
                  type="date"
                  value={udharForm.date}
                  onChange={(e) => setUdharForm({ ...udharForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                list="product-suggestions"
                value={udharForm.productName}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = products.find((p) => p.name.toLowerCase() === val.toLowerCase());
                  if (matched) {
                    setUdharForm({
                      ...udharForm,
                      productName: matched.name,
                      productPrice: matched.sellingPrice,
                    });
                  } else {
                    setUdharForm({ ...udharForm, productName: val });
                  }
                }}
                placeholder="Type or select product name..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-medium"
                required
              />
              <datalist id="product-suggestions">
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    ₹{p.sellingPrice} - Stock: {p.stock}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={udharForm.quantity}
                  onChange={(e) => setUdharForm({ ...udharForm, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Product Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={udharForm.productPrice}
                  onChange={(e) => setUdharForm({ ...udharForm, productPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-extrabold text-blue-700 mb-1">Total Amount (Auto Calc)</label>
                <input
                  type="text"
                  value={`₹${calculatedUdharTotal.toLocaleString('en-IN')}`}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-mono font-black text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Amount Paid Now (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={udharForm.amountPaidNow}
                  onChange={(e) => setUdharForm({ ...udharForm, amountPaidNow: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-emerald-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-rose-700 mb-1">Remaining Amount (Auto Calc)</label>
                <input
                  type="text"
                  value={`₹${calculatedUdharRemaining.toLocaleString('en-IN')}`}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-mono font-black text-sm"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Payment Due Date *</label>
                <input
                  type="date"
                  value={udharForm.dueDate}
                  onChange={(e) => setUdharForm({ ...udharForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Notes / Item Details</label>
              <textarea
                rows={2}
                value={udharForm.notes}
                onChange={(e) => setUdharForm({ ...udharForm, notes: e.target.value })}
                placeholder="Optional description or note..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => changeView('dashboard')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-sm"
              >
                Save Udhar Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💰 4. RECEIVE PAYMENT VIEW */}
      {/* ========================================================================= */}
      {currentView === 'receive-payment' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Receive Payment from Customer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record payment collected. Automatically reduces pending amount and updates customer status.
            </p>
          </div>

          <form onSubmit={handleReceivePayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={payForm.customerId}
                onChange={(e) => {
                  const custId = e.target.value;
                  const c = customers.find((cust) => cust.id === custId);
                  setPayForm({
                    ...payForm,
                    customerId: custId,
                    paymentAmount: c ? c.totalPending : 0,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile}) — Current Pending: ₹{c.totalPending.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-emerald-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={payForm.paymentAmount}
                  onChange={(e) => setPayForm({ ...payForm, paymentAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-emerald-800 font-mono font-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                >
                  <option value="Cash">Cash 💵</option>
                  <option value="UPI">UPI / GPay / PhonePe 📲</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS) 🏦</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Ref / Txn Number (Optional)</label>
                <input
                  type="text"
                  value={payForm.refNumber}
                  onChange={(e) => setPayForm({ ...payForm, refNumber: e.target.value })}
                  placeholder="e.g. UPI/409823104921"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Remarks for receipt..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => changeView('dashboard')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm"
              >
                Submit Payment Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📒 5. CUSTOMER KHATA / LEDGER VIEW */}
      {/* ========================================================================= */}
      {currentView === 'ledger' && selectedCustomer && (
        <div className="space-y-6">
          {/* Customer Selection & Summary Header */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Customer Account:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-slate-900 font-extrabold text-sm"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile}) — Pending: ₹{c.totalPending.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Udhar</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{selectedCustomer.totalUdhar.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Paid</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{selectedCustomer.totalReceived.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Balance</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  ₹{selectedCustomer.totalPending.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                    selectedCustomer.paymentStatus === 'PAID'
                      ? 'badge-status-paid'
                      : selectedCustomer.paymentStatus === 'PARTIAL PAID'
                      ? 'badge-status-partial'
                      : selectedCustomer.paymentStatus === 'OVERDUE'
                      ? 'badge-status-overdue'
                      : 'badge-status-pending'
                  }`}
                >
                  {selectedCustomer.paymentStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Print Ledger
              </button>
              <button
                onClick={() => sendWhatsAppReminder(selectedCustomer)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>

          {/* Ledger Table with Dynamic Running Balance */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
              <span>Customer Khata Passbook / Statement</span>
              <span className="text-xs text-slate-400 font-normal">
                Running Balance automatically calculated line-by-line
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Transaction Details</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right text-slate-900">Credit Amount (+)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Payment Received (-)</th>
                    <th className="py-2.5 px-3 text-right text-rose-600">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {selectedLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No credit or payment transactions logged yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    selectedLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500">{row.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{row.transactionDetails}</td>
                        <td className="py-3 px-3 text-slate-600">{row.productName}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {row.creditAmount > 0 ? `+ ₹${row.creditAmount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {row.paymentReceived > 0 ? `- ₹${row.paymentReceived.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{row.runningBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Notes Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
              <span>Customer Notes & Follow-up History</span>
              <span className="text-xs text-slate-400 font-normal">Add customer promises & notes</span>
            </h3>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add new note (e.g. Customer promised to pay by 10 September...)"
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Add Note
              </button>
            </form>

            <div className="space-y-2">
              {activeCustomerNotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No notes added for this customer.</p>
              ) : (
                activeCustomerNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="text-slate-800 font-medium">{note.content}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Date: {note.noteDate}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏳ 6. PENDING PAYMENTS VIEW */}
      {/* ========================================================================= */}
      {currentView === 'pending' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Pending Payment Customers
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Customer ID</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Mobile Number</th>
                    <th className="py-2.5 px-3 text-right">Total Udhar</th>
                    <th className="py-2.5 px-3 text-right">Total Paid</th>
                    <th className="py-2.5 px-3 text-right text-rose-600">Pending Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {customers
                    .filter((c) => c.totalPending > 0)
                    .map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{cust.customerId}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{cust.name}</td>
                        <td className="py-3 px-3 font-mono">{cust.mobile}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{cust.totalUdhar.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{cust.totalReceived.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-600 text-sm">
                          ₹{cust.totalPending.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              cust.paymentStatus === 'OVERDUE' ? 'badge-status-overdue' : 'badge-status-pending'
                            }`}
                          >
                            {cust.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              changeView('receive-payment');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                          >
                            Collect Payment
                          </button>
                          <button
                            onClick={() => sendWhatsAppReminder(cust)}
                            className="p-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔴 7. OVERDUE PAYMENT ALERT VIEW */}
      {/* ========================================================================= */}
      {currentView === 'overdue' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Overdue Payment Alerts
              </h3>
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-xs">
                🔴 OVERDUE ACTION REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers
                .filter((c) => c.paymentStatus === 'OVERDUE' || (c.totalPending > 0 && c.paymentStatus !== 'PAID'))
                .map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-black uppercase">
                        🔴 OVERDUE
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">{cust.customerId}</span>
                    </div>

                    <div>
                      <h4 className="font-black text-base text-slate-900">{cust.name}</h4>
                      <p className="text-xs text-slate-500">📱 {cust.mobile}</p>
                      {cust.shopName && <p className="text-xs text-slate-500">🏢 {cust.shopName}</p>}
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Pending Balance:</span>
                      <span className="font-mono text-base font-black text-rose-700">
                        ₹{cust.totalPending.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => sendWhatsAppReminder(cust, 'Overdue Alert')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send WhatsApp Overdue Alert
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔔 8. AUTOMATIC REMINDER SYSTEM VIEW */}
      {/* ========================================================================= */}
      {currentView === 'reminders' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Automatic Payment Reminder System
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers
                .filter((c) => c.totalPending > 0)
                .map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">{cust.name}</p>
                      <p className="text-slate-500">Mobile: {cust.mobile}</p>
                      <p className="font-mono font-bold text-rose-600">
                        Pending: ₹{cust.totalPending.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      onClick={() => sendWhatsAppReminder(cust, 'Payment Reminder')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send Reminder
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 9. REMINDER HISTORY VIEW */}
      {/* ========================================================================= */}
      {currentView === 'reminder-history' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Reminder Notification History Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3 text-right">Pending Amount</th>
                    <th className="py-2.5 px-3">Reminder Type</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reminderLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{log.reminderDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{log.customerName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        ₹{log.pendingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">{log.reminderType}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-808 font-bold text-[10px]">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 10. FINANCIAL REPORTS VIEW */}
      {/* ========================================================================= */}
      {currentView === 'reports' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Udhar Khata Financial Reports & Analytics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase">Daily Summary</h4>
                <p className="text-xl font-black text-slate-900 font-mono">
                  ₹{summaryMetrics.totalUdhar.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500">Today's Udhar given</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase">Monthly Collections</h4>
                <p className="text-xl font-black text-emerald-700 font-mono">
                  ₹{summaryMetrics.totalReceived.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500">Collected this month</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase">Total Outstanding</h4>
                <p className="text-xl font-black text-rose-600 font-mono">
                  ₹{summaryMetrics.totalPending.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500">Total pending credit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 11. EXPORT & BACKUP VIEW */}
      {/* ========================================================================= */}
      {currentView === 'export-backup' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Udhar Khata Data Backup & Export
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Download your credit data as Excel spreadsheets or full JSON backup files for offline safety.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Excel Export (.xlsx)
              </div>
              <p className="text-slate-500">Export complete customer list with pending balances to Excel.</p>
              <button
                onClick={handleExportExcel}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
              >
                Export Excel File
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Full JSON Backup
              </div>
              <p className="text-slate-500">Save complete Udhar Khata database backup to your disk.</p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
              >
                Download JSON Backup
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Restore Backup File
            </div>
            <p className="text-slate-500">Select a previously saved Udhar Khata JSON backup file to restore.</p>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 ADD / EDIT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingCustomer ? 'Edit Customer Info' : 'Add New Udhar Customer'}
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder="e.g. Rahul Patel"
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={custForm.mobile}
                    onChange={(e) => setCustForm({ ...custForm, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Business / Shop Name (Optional)</label>
                  <input
                    type="text"
                    value={custForm.shopName}
                    onChange={(e) => setCustForm({ ...custForm, shopName: e.target.value })}
                    placeholder="e.g. Rahul Traders"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder="Street / Shop Address..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Customer Notes</label>
                <textarea
                  rows={2}
                  value={custForm.notes}
                  onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
                  placeholder="Payment habits, promises, or notes..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save New Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
