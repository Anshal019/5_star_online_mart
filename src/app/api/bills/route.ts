import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product } from '@prisma/client';
import {
  calculateServerTotals,
  checkAndRegisterIdempotencyKey,
  sanitizeString,
} from '@/lib/security';

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, bills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Edge Case Check: Empty Cart
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot issue bill with 0 cart items.' },
        { status: 400 }
      );
    }

    // 2. Idempotency Check: Prevent Double-Submit
    const idempotencyKey = body.idempotencyKey || req.headers.get('x-idempotency-key') || '';
    if (idempotencyKey && !checkAndRegisterIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { success: false, error: 'Duplicate transaction request detected.' },
        { status: 409 }
      );
    }

    // 3. Anti-Tampering: Fetch Authoritative Prices directly from Database
    const verifiedItems: Array<{
      dbProd: Product;
      quantity: number;
      unitPrice: number;
      discount: number;
      isTaxable: boolean;
      gstRate: number;
    }> = [];
    const stockWarnings: string[] = [];

    for (const item of body.items) {
      const dbProd = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!dbProd) {
        return NextResponse.json(
          { success: false, error: `Product "${item.productName}" no longer exists in catalog.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, parseInt(item.quantity || 1, 10));

      // Check overselling
      if (dbProd.stock < qty) {
        stockWarnings.push(`Item "${dbProd.name}" oversold (Available: ${dbProd.stock}, Requested: ${qty})`);
      }

      // Use database selling price (or offer price) as single source of truth
      const authoritativeUnitPrice = dbProd.offerPrice || dbProd.sellingPrice;
      const itemDiscount = Math.max(0, parseFloat(item.discount || 0));

      verifiedItems.push({
        dbProd,
        quantity: qty,
        unitPrice: authoritativeUnitPrice,
        discount: itemDiscount,
        isTaxable: dbProd.isTaxable,
        gstRate: dbProd.gstRate,
      });
    }

    // 4. Server-Side Recalculation
    const taxMode = (body.taxMode as any) || 'EXCLUSIVE';
    const billDiscount = Math.max(0, parseFloat(body.discountTotal || 0));
    const serverTotals = calculateServerTotals(verifiedItems, billDiscount, taxMode);

    // 5. Generate Invoice Prefix & Sequential Number
    const settings = await prisma.shopSettings.findFirst({ where: { id: 'default' } });
    const prefix = settings?.invoicePrefix || '5STAR-2026-';
    const count = await prisma.bill.count();
    const invoiceNo = `${prefix}${1001 + count}`;

    // 6. Execute Transaction
    const createdBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          invoiceNo,
          subtotal: serverTotals.subtotal,
          discountTotal: serverTotals.discountTotal,
          taxTotal: serverTotals.taxTotal,
          cgstTotal: serverTotals.cgstTotal,
          sgstTotal: serverTotals.sgstTotal,
          grandTotal: serverTotals.grandTotal,
          paymentMode: sanitizeString(body.paymentMode) || 'Cash',
          cashReceived: body.cashReceived ? parseFloat(body.cashReceived) : null,
          cashChange: body.cashChange ? parseFloat(body.cashChange) : null,
          paymentStatus: 'Paid',
          cashierId: sanitizeString(body.cashierId) || 'usr-cashier',
          cashierName: sanitizeString(body.cashierName) || 'Counter Staff',
          customerName: sanitizeString(body.customerName) || null,
          customerPhone: sanitizeString(body.customerPhone) || null,
          status: 'Completed',
          items: {
            create: verifiedItems.map((vi) => {
              const netPrice = vi.unitPrice * vi.quantity - vi.discount * vi.quantity;
              const taxAmt = vi.isTaxable ? (netPrice * vi.gstRate) / 100 : 0;
              return {
                productId: vi.dbProd.id,
                productName: vi.dbProd.name,
                barcode: vi.dbProd.barcode,
                sku: vi.dbProd.sku,
                contentQty: vi.dbProd.contentQty,
                quantity: vi.quantity,
                unitPrice: vi.unitPrice,
                discount: vi.discount,
                isTaxable: vi.isTaxable,
                gstRate: vi.gstRate,
                taxAmount: Math.round(taxAmt * 100) / 100,
                totalAmount: Math.round((netPrice + taxAmt) * 100) / 100,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Stock deduction & movement audit
      for (const vi of verifiedItems) {
        const prevStock = vi.dbProd.stock;
        const newStock = Math.max(0, prevStock - vi.quantity);

        await tx.product.update({
          where: { id: vi.dbProd.id },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: vi.dbProd.id,
            productName: vi.dbProd.name,
            type: 'SALE',
            qty: vi.quantity,
            previousStock: prevStock,
            newStock,
            reason: `POS Sale (${invoiceNo})`,
            referenceId: invoiceNo,
            user: sanitizeString(body.cashierName) || 'Counter Staff',
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: sanitizeString(body.cashierId) || 'usr-cashier',
          userName: sanitizeString(body.cashierName) || 'Counter Staff',
          action: 'GENERATE_BILL',
          details: `Generated Bill ${invoiceNo} for ₹${serverTotals.grandTotal} (${body.paymentMode})`,
        },
      });

      return bill;
    });

    return NextResponse.json({
      success: true,
      bill: createdBill,
      warnings: stockWarnings,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal transaction error' }, { status: 500 });
  }
}
