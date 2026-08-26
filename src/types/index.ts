export type UnitType = 'Piece' | 'Kg' | 'Litre' | 'Box' | 'Set' | 'Dozen';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  subCategory?: string;
  brand?: string;
  contentQty: string; // e.g. "500 ml", "1 pc", "2 Kg", "Set of 3"
  purchasePrice: number;
  sellingPrice: number;
  offerPrice?: number;
  isTaxable: boolean;
  gstRate: number; // 0, 5, 12, 18, 28
  hsnCode?: string;
  stock: number;
  lowStockThreshold: number;
  unit: UnitType | string;
  supplierName?: string;
  supplierId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  sku: string;
  contentQty: string;
  quantity: number;
  unitPrice: number;
  discount: number; // per item discount in ₹
  isTaxable: boolean;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Split';

export interface Bill {
  id: string;
  invoiceNo: string; // e.g. INV-2026-0001
  items: BillItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  paymentMode: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  paymentStatus: 'Paid' | 'Refunded' | 'Partially Refunded';
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  status: 'Completed' | 'Held' | 'Returned';
  heldAt?: string;
  createdAt: string;
}

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'RETURN' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  qty: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string;
  user: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  receiptHeader: string;
  receiptFooter: string;
  invoicePrefix: string;
  defaultTaxMode: 'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX';
  thermalReceiptWidth: '58mm' | '80mm';
  thermalLabelSize: '50x25' | '40x25' | '50x30' | 'custom';
  labelShowShopName: boolean;
  labelShowMRPText: boolean;
  labelCustomHeader?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'CASHIER';
  pin?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface LabelPrintItem {
  product: Product;
  printQuantity: number;
}
