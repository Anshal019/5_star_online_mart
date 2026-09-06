'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface CameraScannerModalProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({ onScan, onClose }) => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scannerId = 'reader-modal-element';

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          if (decodedText) {
            setScannedCode(decodedText);
            onScan(decodedText);
            // Play audio feedback beep
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}

            setTimeout(() => {
              setScannedCode('');
            }, 1200);
          }
        },
        (error) => {
          // Ignore frequent frame scan misses
        }
      );
    } catch (err: any) {
      setErrorMsg('Failed to access camera. Please make sure camera permissions are allowed.');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Camera Barcode Scanner</h3>
              <p className="text-[11px] text-slate-500 font-medium">Point camera at product barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="p-6 space-y-4 text-center">
          {errorMsg ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 p-2 shadow-inner">
              <div id="reader-modal-element" className="w-full h-auto text-white rounded-xl overflow-hidden" />

              {scannedCode && (
                <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4" />
                  Scanned: {scannedCode}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium">
            Supports EAN-13, EAN-8, Code 128, UPC, and QR Codes. Items add directly to cart!
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all shadow"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};
