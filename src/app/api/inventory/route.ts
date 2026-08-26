import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { productId, newStock, type, reason, user } = await req.json();

    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const prevStock = prod.stock;
    const qtyChange = Math.abs(newStock - prevStock);

    const updatedProd = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        productName: prod.name,
        type: type || 'ADJUSTMENT',
        qty: qtyChange,
        previousStock: prevStock,
        newStock,
        reason: reason || 'Manual Stock Adjustment',
        user: user || 'System',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user || 'sys',
        userName: user || 'System',
        action: `STOCK_${type}`,
        details: `Adjusted stock for ${prod.name}: ${prevStock} → ${newStock} (${reason})`,
      },
    });

    return NextResponse.json({ success: true, product: updatedProd, movement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
