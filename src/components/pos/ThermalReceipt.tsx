'use client';

import React from 'react';
import { Bill, ShopSettings } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface ThermalReceiptProps {
  bill: Bill;
  settings: ShopSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ bill, settings }) => {
  return (
    <div className="receipt-print-area max-w-[80mm] mx-auto bg-white text-black p-3 font-mono text-[11px] leading-tight">
      {/* Shop Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="font-extrabold text-sm uppercase tracking-tight">{settings.shopName}</h2>
        <p className="text-[10px] text-gray-700">{settings.address}</p>
        <p className="text-[10px] text-gray-700">Ph: {settings.phone}</p>
        {settings.gstin && (
          <p className="text-[10px] font-bold mt-0.5">GSTIN: {settings.gstin}</p>
        )}
      </div>

      {/* Invoice Details */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No: <strong>{bill.invoiceNo}</strong></span>
          <span>Date: {formatDate(bill.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier: {bill.cashierName.split(' ')[0]}</span>
          <span>Mode: <strong>{bill.paymentMode}</strong></span>
        </div>
        {bill.customerName && (
          <div className="flex justify-between text-[10px]">
            <span>Cust: {bill.customerName}</span>
            {bill.customerPhone && <span>{bill.customerPhone}</span>}
          </div>
        )}
      </div>

      {/* Item Table */}
      <table className="w-full text-left my-2 border-b border-dashed border-black">
        <thead>
          <tr className="border-b border-black text-[10px]">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 pr-1 font-semibold">
                {item.productName}
                <div className="text-[9px] text-gray-600 font-normal">
                  {item.contentQty} {item.isTaxable ? `(GST ${item.gstRate}%)` : '(No GST)'}
                </div>
              </td>
              <td className="py-1 text-center font-bold">{item.quantity}</td>
              <td className="py-1 text-right">{item.unitPrice}</td>
              <td className="py-1 text-right font-bold">{item.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Tax Breakup */}
      <div className="space-y-1 text-right font-semibold">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(bill.subtotal)}</span>
        </div>

        {bill.discountTotal > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(bill.discountTotal)}</span>
          </div>
        )}

        {bill.taxTotal > 0 && (
          <>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>CGST:</span>
              <span>{formatCurrency(bill.cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>SGST:</span>
              <span>{formatCurrency(bill.sgstTotal)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-black">
          <span>GRAND TOTAL:</span>
          <span>{formatCurrency(bill.grandTotal)}</span>
        </div>

        {bill.paymentMode === 'Cash' && bill.cashReceived && (
          <div className="text-[10px] text-gray-700 pt-1">
            Cash Paid: ₹{bill.cashReceived} | Change: ₹{bill.cashChange || 0}
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="text-center pt-3 border-t border-dashed border-black mt-3">
        <p className="text-[9px] font-bold uppercase">{settings.receiptHeader}</p>
        <p className="text-[8px] text-gray-600 mt-0.5">{settings.receiptFooter}</p>
      </div>
    </div>
  );
};
