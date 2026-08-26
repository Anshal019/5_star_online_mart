import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Akshit ERP — Household Item Retail & POS System',
  description: 'Full-featured ERP, POS Barcode Scanner Billing, Barcode Label Printing, and Inventory Control for Household Item Retail Shops.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b1329] text-slate-100 min-h-screen antialiased flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto max-w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
