import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.shopSettings.upsert({
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
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = await prisma.shopSettings.upsert({
      where: { id: 'default' },
      update: { ...body },
      create: { id: 'default', ...body },
    });

    await prisma.activityLog.create({
      data: {
        userId: 'admin',
        userName: 'Admin',
        action: 'UPDATE_SETTINGS',
        details: 'Updated 5Star Online Mart shop settings & thermal printer defaults',
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
