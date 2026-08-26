'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Product, ShopSettings } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface StickerLabelProps {
  product: Product;
  settings?: ShopSettings;
  size?: '50x25' | '40x25' | '50x30' | 'custom';
}

export const StickerLabel: React.FC<StickerLabelProps> = ({
  product,
  settings,
  size = '50x25',
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: 'CODE128',
          width: 1.4,
          height: size === '50x30' ? 24 : 20,
          displayValue: true,
          fontSize: 9,
          fontOptions: 'bold',
          font: 'monospace',
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [product.barcode, size]);

  const sizeClass =
    size === '40x25'
      ? 'sticker-size-40x25 w-[150px] h-[95px]'
      : size === '50x30'
      ? 'sticker-size-50x30 w-[190px] h-[115px]'
      : 'sticker-size-50x25 w-[190px] h-[95px]';

  return (
    <div
      className={`thermal-sticker bg-white text-black p-1 rounded border border-slate-300 shadow-sm flex flex-col justify-between items-center select-none ${sizeClass}`}
    >
      {/* Header: Shop Name (Optional) */}
      {settings?.labelShowShopName && (
        <div className="text-[8px] font-black uppercase tracking-wider text-black truncate max-w-full leading-tight">
          {settings.labelCustomHeader || settings.shopName || 'AKSHIT STORE'}
        </div>
      )}

      {/* Item Name & Content/Qty */}
      <div className="w-full text-center px-0.5">
        <h4 className="text-[10px] font-bold text-black leading-tight line-clamp-1 truncate">
          {product.name}
        </h4>
        <p className="text-[8px] text-gray-800 font-medium">
          Qty: <span className="font-bold">{product.contentQty}</span>
        </p>
      </div>

      {/* Price tag (Large & Bold) */}
      <div className="w-full flex items-center justify-center gap-1 my-0.5">
        <span className="text-[9px] font-extrabold text-black">
          {settings?.labelShowMRPText ? 'MRP ' : ''}
        </span>
        <span className="text-xs font-black text-black tracking-tight">
          {formatCurrency(product.sellingPrice)}
        </span>
      </div>

      {/* CODE128 Barcode */}
      <div className="w-full flex flex-col items-center overflow-hidden">
        <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
      </div>
    </div>
  );
};
