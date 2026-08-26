import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBarcodeNumber, generateSKU } from '@/lib/barcode';
import { sanitizeString } from '@/lib/security';

function checkAdminRole(req: Request): boolean {
  const userRole = req.headers.get('x-user-role');
  // If role header specified and equals CASHIER, deny admin actions
  if (userRole && userRole.toUpperCase() === 'CASHIER') {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');

    if (barcode) {
      const clean = barcode.trim();
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { barcode: clean },
            { sku: { equals: clean } },
          ],
        },
      });
      return NextResponse.json({ success: true, product });
    }

    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        { success: false, error: 'HTTP 403 Forbidden: Cashier role is not authorized to create products.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.name || !body.sellingPrice) {
      return NextResponse.json(
        { success: false, error: 'Product name and selling price are required.' },
        { status: 400 }
      );
    }

    const count = await prisma.product.count();
    const nextSeq = 1001 + count;

    const rawBarcode = body.barcode?.trim() || generateBarcodeNumber(nextSeq);
    const rawSku = body.sku?.trim() || generateSKU(body.category || 'General', nextSeq);

    // Duplicate Check
    const existingCode = await prisma.product.findFirst({
      where: { OR: [{ barcode: rawBarcode }, { sku: rawSku }] },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Duplicate error: Barcode "${rawBarcode}" or SKU "${rawSku}" already exists in database.` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: sanitizeString(body.name),
        sku: rawSku,
        barcode: rawBarcode,
        category: sanitizeString(body.category) || 'General Home Goods',
        subCategory: sanitizeString(body.subCategory) || '',
        brand: sanitizeString(body.brand) || '',
        contentQty: sanitizeString(body.contentQty) || '1 pc',
        purchasePrice: Math.max(0, parseFloat(body.purchasePrice || 0)),
        sellingPrice: Math.max(0, parseFloat(body.sellingPrice)),
        offerPrice: body.offerPrice ? Math.max(0, parseFloat(body.offerPrice)) : Math.max(0, parseFloat(body.sellingPrice)),
        isTaxable: body.isTaxable ?? true,
        gstRate: parseInt(body.gstRate || 18, 10),
        hsnCode: sanitizeString(body.hsnCode) || '3924',
        stock: Math.max(0, parseInt(body.stock || 0, 10)),
        lowStockThreshold: Math.max(1, parseInt(body.lowStockThreshold || 5, 10)),
        unit: sanitizeString(body.unit) || 'Piece',
        supplierName: sanitizeString(body.supplierName) || '',
        imageUrl: sanitizeString(body.imageUrl) || '',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: 'admin',
        userName: 'Admin',
        action: 'ADD_PRODUCT',
        details: `Created product ${product.name} (${product.sku})`,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal database error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        { success: false, error: 'HTTP 403 Forbidden: Cashier role is not authorized to edit prices or products.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: body.id },
      data: {
        name: sanitizeString(body.name),
        category: sanitizeString(body.category),
        subCategory: sanitizeString(body.subCategory),
        brand: sanitizeString(body.brand),
        contentQty: sanitizeString(body.contentQty),
        purchasePrice: Math.max(0, parseFloat(body.purchasePrice || 0)),
        sellingPrice: Math.max(0, parseFloat(body.sellingPrice)),
        offerPrice: Math.max(0, parseFloat(body.offerPrice || body.sellingPrice)),
        isTaxable: body.isTaxable,
        gstRate: parseInt(body.gstRate || 18, 10),
        hsnCode: sanitizeString(body.hsnCode),
        stock: Math.max(0, parseInt(body.stock || 0, 10)),
        lowStockThreshold: Math.max(1, parseInt(body.lowStockThreshold || 5, 10)),
        unit: sanitizeString(body.unit),
        supplierName: sanitizeString(body.supplierName),
        barcode: sanitizeString(body.barcode),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: 'admin',
        userName: 'Admin',
        action: 'UPDATE_PRODUCT',
        details: `Updated product ${updated.name} (${updated.sku})`,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal update error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        { success: false, error: 'HTTP 403 Forbidden: Cashier role is not authorized to delete products.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const target = await prisma.product.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: 'admin',
        userName: 'Admin',
        action: 'DELETE_PRODUCT',
        details: `Deleted product ${target.name} (${target.sku})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal delete error' }, { status: 500 });
  }
}
