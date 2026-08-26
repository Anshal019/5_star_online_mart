import {
  Product,
  Category,
  Supplier,
  Bill,
  StockMovement,
  ShopSettings,
  User,
  ActivityLog,
} from '@/types';
import { generateBarcodeNumber, generateSKU } from './barcode';

const STORAGE_KEYS = {
  PRODUCTS: '5star_erp_products',
  CATEGORIES: '5star_erp_categories',
  SUPPLIERS: '5star_erp_suppliers',
  BILLS: '5star_erp_bills',
  HELD_BILLS: '5star_erp_held_bills',
  STOCK_MOVEMENTS: '5star_erp_stock_movements',
  SETTINGS: '5star_erp_settings',
  USERS: '5star_erp_users',
  CURRENT_USER: '5star_erp_current_user',
  LOGS: '5star_erp_logs',
  SEQUENCE: '5star_erp_sequence',
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: '5Star Online Mart',
  tagline: 'Premium Household Goods & Grocery Retail',
  address: 'Shop No. 1, Main Market Complex, Station Road',
  phone: '+91 98765 43210',
  email: 'contact@5staronlinemart.com',
  gstin: '07AAAAA0000A1Z5',
  receiptHeader: 'Thank you for shopping at 5Star Online Mart!',
  receiptFooter: 'Goods once sold can be exchanged within 7 days with valid bill.',
  invoicePrefix: '5STAR-2026-',
  defaultTaxMode: 'EXCLUSIVE',
  thermalReceiptWidth: '80mm',
  thermalLabelSize: '50x25',
  labelShowShopName: true,
  labelShowMRPText: true,
  labelCustomHeader: '5STAR MART',
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Kitchenware', description: 'Utensils, pans, knives, and cooking tools' },
  { id: 'cat-2', name: 'Plastics & Containers', description: 'Storage boxes, water bottles, and plastic tubs' },
  { id: 'cat-3', name: 'Cleaning & Hygiene', description: 'Mops, brooms, wipers, and detergent holders' },
  { id: 'cat-4', name: 'Storage & Organizers', description: 'Racks, baskets, drawers, and shoe stands' },
  { id: 'cat-5', name: 'Bathroom Accessories', description: 'Buckets, mugs, soap dishes, and dispensers' },
  { id: 'cat-6', name: 'Electricals & Appliances', description: 'Extension cords, irons, kettles, and torches' },
  { id: 'cat-7', name: 'General Home Goods', description: 'Hangers, mats, curtains, and hardware' },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Mahavir Plastic Industries', contactPerson: 'Rajesh Shah', phone: '98201 12345', email: 'sales@mahavirplastic.com', address: 'Plot 42, GIDC, Ahmedabad', createdAt: new Date().toISOString() },
  { id: 'sup-2', name: 'Apex Metalware Ltd', contactPerson: 'Sanjay Gupta', phone: '98112 34567', email: 'orders@apexmetal.in', address: 'Phase 2, Industrial Area, Delhi', createdAt: new Date().toISOString() },
  { id: 'sup-3', name: 'EcoClean Home Care', contactPerson: 'Anita Rao', phone: '99400 88776', email: 'anita@ecoclean.com', address: 'Sector 5, Noida', createdAt: new Date().toISOString() },
];

const INITIAL_USERS: User[] = [
  { id: 'usr-admin', name: 'Store Owner (Admin)', username: 'admin', role: 'ADMIN', pin: '1234' },
  { id: 'usr-cashier', name: 'Counter Staff', username: 'cashier', role: 'CASHIER', pin: '0000' },
];

function generateInitialProducts(): Product[] {
  const dateStr = new Date().toISOString();
  const rawList = [
    { name: 'Stainless Steel Pressure Cooker 3L', cat: 'Kitchenware', content: '1 pc', cost: 850, mrp: 1299, isTaxable: true, gst: 18, hsn: '7323', stock: 24, low: 5, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: 'Non-Stick Dosa Tawa 28cm', cat: 'Kitchenware', content: '1 pc', cost: 380, mrp: 699, isTaxable: true, gst: 18, hsn: '7323', stock: 18, low: 4, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: 'Chef Stainless Steel Knife Set', cat: 'Kitchenware', content: 'Set of 3', cost: 180, mrp: 349, isTaxable: true, gst: 12, hsn: '8211', stock: 35, low: 8, unit: 'Set', sup: 'Apex Metalware Ltd' },
    { name: 'Copper Bottom Saucepan 1.5L', cat: 'Kitchenware', content: '1 pc', cost: 240, mrp: 450, isTaxable: true, gst: 18, hsn: '7323', stock: 15, low: 3, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: 'Spice Box Container (Masala Dabba)', cat: 'Kitchenware', content: '7 Cups + 1 Spoon', cost: 190, mrp: 399, isTaxable: true, gst: 12, hsn: '7323', stock: 42, low: 10, unit: 'Set', sup: 'Apex Metalware Ltd' },
    { name: 'Airtight Food Storage Container Set', cat: 'Plastics & Containers', content: 'Pack of 4 (500ml-2L)', cost: 210, mrp: 499, isTaxable: true, gst: 18, hsn: '3924', stock: 50, low: 12, unit: 'Set', sup: 'Mahavir Plastic Industries' },
    { name: 'Unbreakable Water Bottle 1000ml', cat: 'Plastics & Containers', content: '1000 ml', cost: 45, mrp: 120, isTaxable: true, gst: 18, hsn: '3924', stock: 85, low: 20, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
    { name: 'Heavy Duty Plastic Bucket 18L', cat: 'Bathroom Accessories', content: '18 Litres', cost: 110, mrp: 240, isTaxable: true, gst: 18, hsn: '3924', stock: 30, low: 8, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
    { name: 'Bath Mug 1.5L Frost Finish', cat: 'Bathroom Accessories', content: '1.5 Litres', cost: 22, mrp: 55, isTaxable: true, gst: 18, hsn: '3924', stock: 120, low: 25, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
    { name: '3-Tier Vegetable Kitchen Trolley', cat: 'Storage & Organizers', content: '1 pc', cost: 320, mrp: 650, isTaxable: true, gst: 18, hsn: '9403', stock: 12, low: 3, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
    { name: 'Spin Mop Set with Bucket & 2 Refills', cat: 'Cleaning & Hygiene', content: '1 Set + 2 Refills', cost: 450, mrp: 899, isTaxable: true, gst: 18, hsn: '9603', stock: 16, low: 4, unit: 'Set', sup: 'EcoClean Home Care' },
    { name: 'Microfiber Floor Cleaning Cloth', cat: 'Cleaning & Hygiene', content: 'Pack of 3', cost: 65, mrp: 149, isTaxable: true, gst: 12, hsn: '6307', stock: 60, low: 15, unit: 'Pack', sup: 'EcoClean Home Care' },
    { name: 'Grass Broom Soft Fiber (Phool Jhadu)', cat: 'Cleaning & Hygiene', content: '1 pc', cost: 50, mrp: 90, isTaxable: false, gst: 0, hsn: '9603', stock: 95, low: 20, unit: 'Piece', sup: 'EcoClean Home Care' },
    { name: 'Stainless Steel Scrub Pad', cat: 'Cleaning & Hygiene', content: 'Pack of 6', cost: 28, mrp: 60, isTaxable: true, gst: 18, hsn: '7323', stock: 140, low: 30, unit: 'Pack', sup: 'EcoClean Home Care' },
    { name: 'Heavy Duty Dry Iron 1000W', cat: 'Electricals & Appliances', content: '1 pc', cost: 420, mrp: 799, isTaxable: true, gst: 18, hsn: '8516', stock: 8, low: 3, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: 'Electric Cordless Kettle 1.8L', cat: 'Electricals & Appliances', content: '1.8 Litres', cost: 490, mrp: 899, isTaxable: true, gst: 18, hsn: '8516', stock: 6, low: 3, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: '4-Way Extension Spike Guard Board', cat: 'Electricals & Appliances', content: '2.5 Meters Cable', cost: 180, mrp: 349, isTaxable: true, gst: 18, hsn: '8537', stock: 22, low: 5, unit: 'Piece', sup: 'Apex Metalware Ltd' },
    { name: 'Heavy Plastic Cloth Hangers', cat: 'General Home Goods', content: 'Set of 6', cost: 60, mrp: 129, isTaxable: true, gst: 18, hsn: '3924', stock: 70, low: 15, unit: 'Set', sup: 'Mahavir Plastic Industries' },
    { name: 'Anti-Slip Door Mat Rubber Backed', cat: 'General Home Goods', content: '40x60 cm', cost: 85, mrp: 175, isTaxable: true, gst: 12, hsn: '5705', stock: 45, low: 10, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
    { name: 'Unbreakable Laundry Basket 45L', cat: 'Storage & Organizers', content: '45 Litres', cost: 240, mrp: 499, isTaxable: true, gst: 18, hsn: '3924', stock: 14, low: 4, unit: 'Piece', sup: 'Mahavir Plastic Industries' }
  ];

  return rawList.map((item, idx) => {
    const seq = 1001 + idx;
    return {
      id: `prod-${seq}`,
      name: item.name,
      sku: generateSKU(item.cat, seq),
      barcode: generateBarcodeNumber(seq),
      category: item.cat,
      contentQty: item.content,
      purchasePrice: item.cost,
      sellingPrice: item.mrp,
      offerPrice: item.mrp > 300 ? item.mrp - 50 : item.mrp,
      isTaxable: item.isTaxable,
      gstRate: item.gst,
      hsnCode: item.hsn,
      stock: item.stock,
      lowStockThreshold: item.low,
      unit: item.unit,
      supplierName: item.sup,
      createdAt: dateStr,
      updatedAt: dateStr,
    };
  });
}

function generateInitialBills(products: Product[]): Bill[] {
  if (products.length < 5) return [];

  const bills: Bill[] = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const daysAgo = i;
    const billDate = new Date(now.valueOf() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const invNo = `5STAR-2026-${1000 + (5 - i)}`;

    const p1 = products[i % products.length];
    const p2 = products[(i + 3) % products.length];

    const item1Qty = 2;
    const item2Qty = 1;

    const item1Tax = p1.isTaxable ? (p1.sellingPrice * item1Qty * p1.gstRate) / 100 : 0;
    const item2Tax = p2.isTaxable ? (p2.sellingPrice * item2Qty * p2.gstRate) / 100 : 0;

    const subtotal = p1.sellingPrice * item1Qty + p2.sellingPrice * item2Qty;
    const taxTotal = item1Tax + item2Tax;
    const grandTotal = Math.round(subtotal + taxTotal);

    bills.push({
      id: `bill-${1000 + i}`,
      invoiceNo: invNo,
      items: [
        {
          id: `item-${i}-1`,
          productId: p1.id,
          productName: p1.name,
          barcode: p1.barcode,
          sku: p1.sku,
          contentQty: p1.contentQty,
          quantity: item1Qty,
          unitPrice: p1.sellingPrice,
          discount: 0,
          isTaxable: p1.isTaxable,
          gstRate: p1.gstRate,
          taxAmount: Math.round(item1Tax * 100) / 100,
          totalAmount: p1.sellingPrice * item1Qty + item1Tax,
        },
        {
          id: `item-${i}-2`,
          productId: p2.id,
          productName: p2.name,
          barcode: p2.barcode,
          sku: p2.sku,
          contentQty: p2.contentQty,
          quantity: item2Qty,
          unitPrice: p2.sellingPrice,
          discount: 0,
          isTaxable: p2.isTaxable,
          gstRate: p2.gstRate,
          taxAmount: Math.round(item2Tax * 100) / 100,
          totalAmount: p2.sellingPrice * item2Qty + item2Tax,
        },
      ],
      subtotal,
      discountTotal: 0,
      taxTotal: Math.round(taxTotal * 100) / 100,
      cgstTotal: Math.round((taxTotal / 2) * 100) / 100,
      sgstTotal: Math.round((taxTotal / 2) * 100) / 100,
      grandTotal,
      paymentMode: i % 2 === 0 ? 'UPI' : 'Cash',
      cashReceived: i % 2 === 0 ? undefined : Math.ceil(grandTotal / 100) * 100,
      cashChange: i % 2 === 0 ? undefined : Math.ceil(grandTotal / 100) * 100 - grandTotal,
      paymentStatus: 'Paid',
      cashierId: 'usr-cashier',
      cashierName: 'Counter Staff',
      customerName: i % 2 === 0 ? 'Walk-in Customer' : 'Suresh Kumar',
      customerPhone: i % 2 === 0 ? '' : '98765 12345',
      status: 'Completed',
      createdAt: billDate,
    });
  }

  return bills;
}

export function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const products = generateInitialProducts();
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SEQUENCE, '1030');

    const bills = generateInitialBills(products);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
  }
}

export const StorageAPI = {
  // Products
  getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },

  getProductByBarcode(barcode: string): Product | undefined {
    const products = this.getProducts();
    const clean = barcode.trim();
    return products.find(p => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase());
  },

  saveProduct(product: Partial<Product> & { name: string; category: string; sellingPrice: number }): Product {
    const products = this.getProducts();
    let nextSeq = parseInt(localStorage.getItem(STORAGE_KEYS.SEQUENCE) || '1030', 10);
    nextSeq += 1;
    localStorage.setItem(STORAGE_KEYS.SEQUENCE, String(nextSeq));

    const now = new Date().toISOString();

    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        const updated: Product = {
          ...products[index],
          ...product,
          updatedAt: now,
        };
        products[index] = updated;
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.logActivity('UPDATE_PRODUCT', `Updated product: ${updated.name} (${updated.sku})`);

        // Async Sync to SQLite REST API
        fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});

        return updated;
      }
    }

    const newProduct: Product = {
      id: `prod-${nextSeq}`,
      name: product.name,
      sku: product.sku || generateSKU(product.category, nextSeq),
      barcode: product.barcode || generateBarcodeNumber(nextSeq),
      category: product.category,
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      contentQty: product.contentQty || '1 pc',
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice,
      offerPrice: product.offerPrice || product.sellingPrice,
      isTaxable: product.isTaxable ?? true,
      gstRate: product.gstRate ?? 18,
      hsnCode: product.hsnCode || '3924',
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      unit: product.unit || 'Piece',
      supplierName: product.supplierName || '',
      supplierId: product.supplierId || '',
      imageUrl: product.imageUrl || '',
      createdAt: now,
      updatedAt: now,
    };

    products.unshift(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.logActivity('ADD_PRODUCT', `Added new product: ${newProduct.name} (${newProduct.sku})`);

    // Async Sync to SQLite REST API
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    }).catch(() => {});

    return newProduct;
  },

  deleteProduct(id: string): boolean {
    let products = this.getProducts();
    const target = products.find(p => p.id === id);
    if (target) {
      products = products.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.logActivity('DELETE_PRODUCT', `Deleted product: ${target.name} (${target.sku})`);

      fetch(`/api/products?id=${id}`, { method: 'DELETE' }).catch(() => {});
      return true;
    }
    return false;
  },

  bulkImportProducts(newItems: Array<Partial<Product> & { name: string; category: string; sellingPrice: number }>): number {
    let count = 0;
    newItems.forEach(item => {
      if (item.name && item.category && item.sellingPrice) {
        this.saveProduct(item);
        count++;
      }
    });
    return count;
  },

  // Categories
  getCategories(): Category[] {
    if (typeof window === 'undefined') return INITIAL_CATEGORIES;
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  },

  saveCategory(name: string, description?: string): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description: description || '',
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return newCat;
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
  },

  saveSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    suppliers.push(newSup);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
    return newSup;
  },

  // Bills & Checkout
  getBills(): Bill[] {
    if (typeof window === 'undefined') return [];
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  },

  saveBill(billData: Omit<Bill, 'id' | 'invoiceNo' | 'createdAt'>): Bill {
    const bills = this.getBills();
    const nextInvNo = 1001 + bills.length;
    const settings = this.getShopSettings();
    const invoiceNo = `${settings.invoicePrefix}${nextInvNo}`;

    const now = new Date().toISOString();
    const newBill: Bill = {
      ...billData,
      id: `bill-${Date.now()}`,
      invoiceNo,
      createdAt: now,
    };

    bills.unshift(newBill);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));

    const products = this.getProducts();
    newBill.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        const prevStock = products[prodIndex].stock;
        const newStock = Math.max(0, prevStock - item.quantity);
        products[prodIndex].stock = newStock;
        products[prodIndex].updatedAt = now;

        this.addStockMovement({
          productId: item.productId,
          productName: item.productName,
          type: 'SALE',
          qty: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `POS Sale (${invoiceNo})`,
          referenceId: invoiceNo,
          user: newBill.cashierName,
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.logActivity('GENERATE_BILL', `Created bill ${invoiceNo} for ₹${newBill.grandTotal}`);

    // Async Sync to SQLite REST API
    fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBill),
    }).catch(() => {});

    return newBill;
  },

  // Held Bills
  getHeldBills(): Bill[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.HELD_BILLS);
    return data ? JSON.parse(data) : [];
  },

  holdBill(bill: Omit<Bill, 'id' | 'invoiceNo' | 'createdAt'>): Bill {
    const held = this.getHeldBills();
    const newHeld: Bill = {
      ...bill,
      id: `held-${Date.now()}`,
      invoiceNo: `HOLD-${Date.now().toString().slice(-4)}`,
      status: 'Held',
      heldAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    held.unshift(newHeld);
    localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(held));
    return newHeld;
  },

  removeHeldBill(id: string) {
    let held = this.getHeldBills();
    held = held.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(held));
  },

  processReturn(invoiceNo: string, returnItems: Array<{ productId: string; qty: number }>): Bill | null {
    const bills = this.getBills();
    const bill = bills.find(b => b.invoiceNo === invoiceNo);
    if (!bill) return null;

    const products = this.getProducts();
    const now = new Date().toISOString();

    returnItems.forEach(ret => {
      const prodIndex = products.findIndex(p => p.id === ret.productId);
      if (prodIndex !== -1) {
        const prevStock = products[prodIndex].stock;
        const newStock = prevStock + ret.qty;
        products[prodIndex].stock = newStock;

        this.addStockMovement({
          productId: ret.productId,
          productName: products[prodIndex].name,
          type: 'RETURN',
          qty: ret.qty,
          previousStock: prevStock,
          newStock,
          reason: `Customer Return (${invoiceNo})`,
          referenceId: invoiceNo,
          user: 'Store Admin',
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    bill.paymentStatus = 'Refunded';
    bill.status = 'Returned';
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));

    this.logActivity('PROCESS_RETURN', `Processed customer return for bill ${invoiceNo}`);
    return bill;
  },

  getStockMovements(): StockMovement[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    return data ? JSON.parse(data) : [];
  },

  addStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
    const movements = this.getStockMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
    return newMovement;
  },

  adjustStock(productId: string, newStock: number, type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT', reason: string): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return null;

    const prod = products[index];
    const prevStock = prod.stock;
    const qtyChange = Math.abs(newStock - prevStock);

    prod.stock = newStock;
    prod.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    const currentUser = this.getCurrentUser();
    this.addStockMovement({
      productId: prod.id,
      productName: prod.name,
      type,
      qty: qtyChange,
      previousStock: prevStock,
      newStock,
      reason,
      user: currentUser ? currentUser.name : 'System',
    });

    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: prod.id,
        newStock,
        type,
        reason,
        user: currentUser ? currentUser.name : 'System',
      }),
    }).catch(() => {});

    return prod;
  },

  getShopSettings(): ShopSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveShopSettings(settings: Partial<ShopSettings>): ShopSettings {
    const current = this.getShopSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.logActivity('UPDATE_SETTINGS', 'Updated 5Star Online Mart shop profile & printer settings');

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    return updated;
  },

  getUsers(): User[] {
    if (typeof window === 'undefined') return INITIAL_USERS;
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  },

  getCurrentUser(): User {
    if (typeof window === 'undefined') return INITIAL_USERS[0];
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : INITIAL_USERS[0];
  },

  setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getActivityLogs(): ActivityLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  logActivity(action: string, details: string) {
    const logs = this.getActivityLogs();
    const currentUser = this.getCurrentUser();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser ? currentUser.id : 'sys',
      userName: currentUser ? currentUser.name : 'System',
      action,
      details,
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
    localStorage.removeItem(STORAGE_KEYS.HELD_BILLS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SEQUENCE);
    initializeStorage();

    fetch('/api/seed', { method: 'POST' }).catch(() => {});
  }
};
