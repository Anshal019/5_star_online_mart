'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Wifi, QrCode, CheckCircle2, Copy, ExternalLink, Zap } from 'lucide-react';

interface PhoneScannerModalProps {
  onClose: () => void;
}

export const PhoneScannerModal: React.FC<PhoneScannerModalProps> = ({ onClose }) => {
  const [localIp, setLocalIp] = useState<string>('localhost');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Attempt to fetch local host IP or use current window hostname
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      setLocalIp(`${host}${port}`);
    }
  }, []);

  const phoneScanUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${localIp}/phone-scan`
    : `http://localhost:3000/phone-scan`;

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneScanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Mobile Phone Barcode Scanner</h3>
              <p className="text-[11px] text-slate-500 font-medium">Use your smartphone as a wireless scanner</p>
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
        <div className="p-6 space-y-5 text-center">
          {/* QR Code Container */}
          <div className="bg-blue-50/80 p-5 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
              <QRCodeSVG
                value={phoneScanUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold">
              <Wifi className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              Scan QR Code with Phone Camera
            </span>
          </div>

          {/* Instructions */}
          <div className="text-left space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <p className="leading-snug">
                Connect your mobile phone to the <strong>same Wi-Fi network</strong> as this system.
              </p>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <p className="leading-snug">
                Open phone camera and scan the QR code above, or open URL below in Chrome / Safari.
              </p>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <p className="leading-snug">
                Point phone camera at any item barcode. Scanned products appear instantly on POS screen!
              </p>
            </div>
          </div>

          {/* URL Box */}
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly
              value={phoneScanUrl}
              className="bg-transparent flex-1 text-xs font-mono font-bold text-slate-800 px-2 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" /> Instant Wireless Sync Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
