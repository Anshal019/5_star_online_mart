'use client';

import React, { useState, useEffect } from 'react';
import { exportFullSystemBackupToExcel, exportFullSystemBackupToCSV, restoreFullSystemFromExcel } from '@/lib/backup';
import { X, FileSpreadsheet, Download, Upload, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const [lastBackupDate, setLastBackupDate] = useState<string>('Never');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const last = localStorage.getItem('5star_last_backup_timestamp');
      if (last) {
        setLastBackupDate(new Date(last).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }));
      }
    }
  }, []);

  const handleExportExcel = () => {
    setIsExporting(true);
    setStatusMsg('');
    setErrorMsg('');

    setTimeout(() => {
      const result = exportFullSystemBackupToExcel();
      setIsExporting(false);
      if (result.success) {
        setStatusMsg(`✓ Excel Backup (${result.fileName}) downloaded successfully!`);
        updateTimestamp();
      } else {
        setErrorMsg(`Failed to generate Excel backup: ${result.error}`);
      }
    }, 300);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setStatusMsg('');
    setErrorMsg('');

    setTimeout(() => {
      const result = exportFullSystemBackupToCSV();
      setIsExporting(false);
      if (result.success) {
        setStatusMsg(`✓ CSV Backup (${result.fileName}) downloaded successfully!`);
        updateTimestamp();
      } else {
        setErrorMsg(`Failed to generate CSV backup: ${result.error}`);
      }
    }, 300);
  };

  const updateTimestamp = () => {
    setLastBackupDate(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('WARNING: Restoring from backup file will update your database with the backup data. Do you wish to proceed?')) {
      return;
    }

    setIsRestoring(true);
    setStatusMsg('');
    setErrorMsg('');

    const res = await restoreFullSystemFromExcel(file);
    setIsRestoring(false);

    if (res.success) {
      setStatusMsg(res.message || 'Restored successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Failed to restore system from file.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Full System Backup & Disaster Recovery</h3>
              <p className="text-[11px] text-slate-500 font-medium">Download CSV / Excel files for products, bills, udhar khata & stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Last Backup Info Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Last Backup Date
              </span>
              <p className="text-xs font-bold text-slate-900 font-mono">{lastBackupDate}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Auto-Recovery Ready
            </span>
          </div>

          {/* Format Selection Action Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">1. Choose Backup Format</h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Excel (.xlsx) Download */}
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left space-y-2 group shadow-xs active:scale-95"
              >
                <div className="flex items-center justify-between">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    .XLSX
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700">
                    Excel Workbook
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">Multi-sheet Excel file with all 8 modules</p>
                </div>
              </button>

              {/* CSV (.csv) Download */}
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="p-3.5 rounded-xl border-2 border-blue-500/40 bg-blue-50/50 hover:bg-blue-100/60 transition-all text-left space-y-2 group shadow-xs active:scale-95"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-5 h-5 text-blue-700" />
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                    .CSV
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700">
                    CSV Excel File
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">Standard CSV format for Excel & Sheets</p>
                </div>
              </button>
            </div>
          </div>

          {/* Restore Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">2. Restore System Data</h4>
            <label className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
              {isRestoring ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-blue-400" />
              )}
              {isRestoring ? 'Restoring System...' : 'Upload & Restore (.xlsx / .csv)'}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isRestoring}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
