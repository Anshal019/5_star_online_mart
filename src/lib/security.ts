import bcrypt from 'bcryptjs';

// Cache for idempotency keys to prevent double checkout submissions
const processedIdempotencyKeys = new Set<string>();

export function hashPin(pin: string): string {
  if (!pin) return '';
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pin, salt);
}

export function verifyPin(pin: string, hashedOrPlainPin: string): boolean {
  if (!pin || !hashedOrPlainPin) return false;
  
  // If stored value is already bcrypt hash
  if (hashedOrPlainPin.startsWith('$2a$') || hashedOrPlainPin.startsWith('$2b$')) {
    return bcrypt.compareSync(pin, hashedOrPlainPin);
  }
  
  // Direct plain PIN comparison for backward compatibility
  return pin.trim() === hashedOrPlainPin.trim();
}

/**
 * XSS Sanitization helper: Escapes HTML tags & unsafe quotes
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Double-submit idempotency protection
 */
export function checkAndRegisterIdempotencyKey(key: string): boolean {
  if (!key) return true; // proceed if no key provided
  if (processedIdempotencyKeys.has(key)) {
    return false; // Duplicate transaction detected!
  }
  
  processedIdempotencyKeys.add(key);
  // Auto expire idempotency key after 60 seconds
  setTimeout(() => {
    processedIdempotencyKeys.delete(key);
  }, 60000);
  
  return true;
}

/**
 * Authoritative Server-Side Tax & Price Calculation
 * Prevents client-side price tampering
 */
export interface ServerTaxResult {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export function calculateServerTotals(
  dbItems: Array<{ unitPrice: number; discount: number; quantity: number; isTaxable: boolean; gstRate: number }>,
  billDiscount: number = 0,
  taxMode: 'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX' = 'EXCLUSIVE'
): ServerTaxResult {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let taxableAmountTotal = 0;

  dbItems.forEach((item) => {
    const qty = Math.max(1, item.quantity);
    const itemSubtotal = item.unitPrice * qty;
    const itemDisc = (item.discount || 0) * qty;
    const netItemPrice = Math.max(0, itemSubtotal - itemDisc);

    subtotal += itemSubtotal;
    itemDiscountTotal += itemDisc;

    if (taxMode === 'NO_TAX' || !item.isTaxable || item.gstRate <= 0) {
      taxableAmountTotal += netItemPrice;
    } else if (taxMode === 'INCLUSIVE') {
      const basePrice = netItemPrice / (1 + item.gstRate / 100);
      const taxAmt = netItemPrice - basePrice;
      const halfTax = taxAmt / 2;

      taxableAmountTotal += basePrice;
      taxTotal += taxAmt;
      cgstTotal += halfTax;
      sgstTotal += halfTax;
    } else {
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
    grandTotal = Math.max(0, subtotal - totalDiscount);
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(taxableAmountTotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal),
  };
}
