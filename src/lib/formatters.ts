import { BillItem } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export interface TaxCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export function calculateBillTotals(
  items: BillItem[],
  billDiscount: number = 0,
  taxMode: 'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX' = 'EXCLUSIVE'
): TaxCalculationResult {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let taxableAmountTotal = 0;

  items.forEach((item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    const itemDisc = item.discount * item.quantity;
    const netItemPrice = Math.max(0, itemSubtotal - itemDisc);

    subtotal += itemSubtotal;
    itemDiscountTotal += itemDisc;

    if (taxMode === 'NO_TAX' || !item.isTaxable || item.gstRate <= 0) {
      taxableAmountTotal += netItemPrice;
    } else if (taxMode === 'INCLUSIVE') {
      // GST is already included in unitPrice
      // Base Price = Net Item Price / (1 + GST% / 100)
      const basePrice = netItemPrice / (1 + item.gstRate / 100);
      const taxAmt = netItemPrice - basePrice;
      const halfTax = taxAmt / 2;

      taxableAmountTotal += basePrice;
      taxTotal += taxAmt;
      cgstTotal += halfTax;
      sgstTotal += halfTax;
    } else {
      // EXCLUSIVE: GST added on top of unitPrice
      const taxAmt = (netItemPrice * item.gstRate) / 100;
      const halfTax = taxAmt / 2;

      taxableAmountTotal += netItemPrice;
      taxTotal += taxAmt;
      cgstTotal += halfTax;
      sgstTotal += halfTax;
    }
  });

  const overallDiscount = Math.max(0, billDiscount);
  const totalDiscount = itemDiscountTotal + overallDiscount;

  let grandTotal = 0;
  if (taxMode === 'EXCLUSIVE') {
    grandTotal = Math.max(0, subtotal - totalDiscount + taxTotal);
  } else {
    // INCLUSIVE or NO_TAX
    grandTotal = Math.max(0, subtotal - totalDiscount);
  }

  return {
    subtotal,
    discountTotal: totalDiscount,
    taxableAmount: Math.round(taxableAmountTotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal),
  };
}
