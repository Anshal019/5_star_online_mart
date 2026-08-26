'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { StorageAPI } from '@/lib/storage';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface CSVImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownloadSample = () => {
    const csvContent =
      'Name,Category,ContentQty,PurchasePrice,SellingPrice,IsTaxable,GSTRate,HSNCode,Stock,LowStockThreshold,Unit,SupplierName,Barcode\n' +
      'Glass Water Bottle 750ml,Plastics & Containers,750 ml,60,149,TRUE,18,3924,40,10,Piece,Mahavir Plastic Industries,\n' +
      'Kitchen Scissors Stainless Steel,Kitchenware,1 pc,45,99,TRUE,12,8213,25,5,Piece,Apex Metalware Ltd,\n' +
      'Cotton Floor Duster,Cleaning & Hygiene,Pack of 2,30,60,FALSE,0,6307,80,15,Pack,EcoClean Home Care,\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_household_products_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setResultMsg('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setPreviewData(results.data.slice(0, 5));
          } else {
            setErrorMsg('CSV file appears empty or unreadable.');
          }
        },
        error: (err) => {
          setErrorMsg(`CSV parsing error: ${err.message}`);
        },
      });
    }
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedRows = results.data.map((row: any) => ({
            name: row.Name || row.name || 'Unnamed Item',
            category: row.Category || row.category || 'General Home Goods',
            contentQty: row.ContentQty || row.contentQty || '1 pc',
            purchasePrice: parseFloat(row.PurchasePrice || row.cost || 0),
            sellingPrice: parseFloat(row.SellingPrice || row.price || 0),
            isTaxable: String(row.IsTaxable || row.taxable).toUpperCase() !== 'FALSE',
            gstRate: parseInt(row.GSTRate || row.gst || 18, 10),
            hsnCode: row.HSNCode || row.hsn || '',
            stock: parseInt(row.Stock || row.stock || 0, 10),
            lowStockThreshold: parseInt(row.LowStockThreshold || row.low || 5, 10),
            unit: row.Unit || row.unit || 'Piece',
            supplierName: row.SupplierName || row.supplier || '',
            barcode: row.Barcode || row.barcode || '',
          }));

          const importedCount = StorageAPI.bulkImportProducts(parsedRows);
          setResultMsg(`Successfully imported ${importedCount} products into the ERP catalog! Auto-generated barcodes & SKUs.`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } catch (err: any) {
          setErrorMsg(`Import failed: ${err.message}`);
        } finally {
          setImporting(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <FileSpreadsheet className="w-5 h-5 text-brand-400" />
            Bulk CSV Catalog Import
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions & Template Download */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">1. Download CSV Template</span>
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1 bg-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Sample CSV Template
            </button>
          </div>
          <p className="text-slate-400 text-[11px]">
            Fill your product details in the CSV. Any row missing a barcode will get an automatic CODE128 barcode assigned!
          </p>
        </div>

        {/* Upload Input */}
        <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center space-y-3 transition-colors bg-slate-900/40">
          <Upload className="w-8 h-8 text-brand-400 mx-auto" />
          <div>
            <label className="cursor-pointer text-xs font-bold text-brand-400 hover:underline">
              <span>Click to select CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            <p className="text-[10px] text-slate-500 mt-1">Supports UTF-8 CSV files up to 5,000 products</p>
          </div>
          {file && (
            <p className="text-xs font-mono font-bold text-emerald-400">Selected: {file.name}</p>
          )}
        </div>

        {/* Preview Snippet */}
        {previewData.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">File Data Preview (First 5 Rows):</label>
            <div className="max-h-36 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2 text-[10px] font-mono text-slate-300">
              <pre>{JSON.stringify(previewData, null, 2)}</pre>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMsg}
          </div>
        )}

        {resultMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {resultMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-card text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            disabled={!file || importing}
            onClick={handleImport}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 ${
              file && !importing
                ? 'bg-brand-600 hover:bg-brand-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {importing ? 'Importing Products...' : 'Confirm Bulk Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
