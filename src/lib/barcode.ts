export function generateCategoryCode(categoryName: string): string {
  if (!categoryName) return 'GEN';
  const clean = categoryName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return clean.substring(0, 4) || 'GEN';
}

export function generateSKU(categoryName: string, sequenceNumber: number): string {
  const catCode = generateCategoryCode(categoryName);
  const numStr = String(sequenceNumber).padStart(4, '0');
  return `SKU-${catCode}-${numStr}`;
}

export function generateBarcodeNumber(sequenceNumber: number): string {
  // CODE128 format: 12-digit numeric starting with 200 (retail standard internal range)
  const prefix = '890'; // EAN / India retail style numeric prefix
  const middle = '4000';
  const suffix = String(sequenceNumber).padStart(5, '0');
  return `${prefix}${middle}${suffix}`;
}

export function isValidBarcode(barcode: string): boolean {
  if (!barcode || barcode.trim().length === 0) return false;
  // Allow numbers, letters, hyphens (CODE128 standard)
  return /^[A-Za-z0-9\-_]+$/.test(barcode.trim());
}
