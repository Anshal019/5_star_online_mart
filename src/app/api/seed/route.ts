import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBarcodeNumber, generateSKU } from '@/lib/barcode';

export async function POST() {
  try {
    // 1. Seed Shop Settings
    await prisma.shopSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
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
      },
    });

    // 2. Seed Staff Users
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        name: 'Store Owner (Admin)',
        username: 'admin',
        role: 'ADMIN',
        pin: '1234',
      },
    });

    await prisma.user.upsert({
      where: { username: 'cashier' },
      update: {},
      create: {
        name: 'Counter Staff',
        username: 'cashier',
        role: 'CASHIER',
        pin: '0000',
      },
    });

    // 3. Seed Categories
    const categories = [
      { name: 'Kitchenware', description: 'Cookware, utensils, and dining sets' },
      { name: 'Plastics & Containers', description: 'Storage boxes and water bottles' },
      { name: 'Cleaning & Hygiene', description: 'Mops, brooms, wipers, and detergents' },
      { name: 'Storage & Organizers', description: 'Racks, baskets, and shoe stands' },
      { name: 'Bathroom Accessories', description: 'Buckets, mugs, and soap dispensers' },
      { name: 'Electricals & Appliances', description: 'Irons, extension boards, and kettles' },
      { name: 'General Home Goods', description: 'Hangers, door mats, and hardware' },
    ];

    for (const c of categories) {
      await prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      });
    }

    // 4. Seed Suppliers
    const suppliers = [
      { name: 'Mahavir Plastic Industries', contactPerson: 'Rajesh Shah', phone: '98201 12345', email: 'sales@mahavirplastic.com', address: 'Plot 42, GIDC, Ahmedabad' },
      { name: 'Apex Metalware Ltd', contactPerson: 'Sanjay Gupta', phone: '98112 34567', email: 'orders@apexmetal.in', address: 'Phase 2, Industrial Area, Delhi' },
      { name: 'EcoClean Home Care', contactPerson: 'Anita Rao', phone: '99400 88776', email: 'anita@ecoclean.com', address: 'Sector 5, Noida' },
    ];

    for (const s of suppliers) {
      const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
      if (!existing) {
        await prisma.supplier.create({ data: s });
      }
    }

    // 5. Seed Initial Products
    const count = await prisma.product.count();
    if (count === 0) {
      const initialRaw = [
        { name: 'Stainless Steel Pressure Cooker 3L', cat: 'Kitchenware', content: '1 pc', cost: 850, mrp: 1299, isTaxable: true, gst: 18, hsn: '7323', stock: 24, low: 5, unit: 'Piece', sup: 'Apex Metalware Ltd' },
        { name: 'Non-Stick Dosa Tawa 28cm', cat: 'Kitchenware', content: '1 pc', cost: 380, mrp: 699, isTaxable: true, gst: 18, hsn: '7323', stock: 18, low: 4, unit: 'Piece', sup: 'Apex Metalware Ltd' },
        { name: 'Chef Stainless Steel Knife Set', cat: 'Kitchenware', content: 'Set of 3', cost: 180, mrp: 349, isTaxable: true, gst: 12, hsn: '8211', stock: 35, low: 8, unit: 'Set', sup: 'Apex Metalware Ltd' },
        { name: 'Airtight Food Storage Container Set', cat: 'Plastics & Containers', content: 'Pack of 4', cost: 210, mrp: 499, isTaxable: true, gst: 18, hsn: '3924', stock: 50, low: 12, unit: 'Set', sup: 'Mahavir Plastic Industries' },
        { name: 'Unbreakable Water Bottle 1000ml', cat: 'Plastics & Containers', content: '1000 ml', cost: 45, mrp: 120, isTaxable: true, gst: 18, hsn: '3924', stock: 85, low: 20, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
        { name: 'Heavy Duty Plastic Bucket 18L', cat: 'Bathroom Accessories', content: '18 Litres', cost: 110, mrp: 240, isTaxable: true, gst: 18, hsn: '3924', stock: 30, low: 8, unit: 'Piece', sup: 'Mahavir Plastic Industries' },
        { name: 'Spin Mop Set with Bucket & 2 Refills', cat: 'Cleaning & Hygiene', content: '1 Set + 2 Refills', cost: 450, mrp: 899, isTaxable: true, gst: 18, hsn: '9603', stock: 16, low: 4, unit: 'Set', sup: 'EcoClean Home Care' },
        { name: 'Grass Broom Soft Fiber (Phool Jhadu)', cat: 'Cleaning & Hygiene', content: '1 pc', cost: 50, mrp: 90, isTaxable: false, gst: 0, hsn: '9603', stock: 95, low: 20, unit: 'Piece', sup: 'EcoClean Home Care' },
        { name: 'Heavy Duty Dry Iron 1000W', cat: 'Electricals & Appliances', content: '1 pc', cost: 420, mrp: 799, isTaxable: true, gst: 18, hsn: '8516', stock: 8, low: 3, unit: 'Piece', sup: 'Apex Metalware Ltd' },
        { name: '4-Way Extension Spike Guard Board', cat: 'Electricals & Appliances', content: '2.5 Meters Cable', cost: 180, mrp: 349, isTaxable: true, gst: 18, hsn: '8537', stock: 22, low: 5, unit: 'Piece', sup: 'Apex Metalware Ltd' }
      ];

      for (let idx = 0; idx < initialRaw.length; idx++) {
        const item = initialRaw[idx];
        const seq = 1001 + idx;
        await prisma.product.create({
          data: {
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
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully for 5Star Online Mart!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
