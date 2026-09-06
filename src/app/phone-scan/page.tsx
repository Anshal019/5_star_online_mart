'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Smartphone, CheckCircle2, RefreshCw, Barcode, Zap, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PhoneScanPage() {
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scanCount, setScanCount] = useState<number>(0);
  const [manualCode, setManualCode] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('Ready to scan');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scannerId = 'phone-camera-viewport';

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
            handleSendBarcode(decodedText);
          }
        },
        (err) => {}
      );
    } catch (e: any) {
      setErrorMsg('Please allow camera permissions on your mobile browser.');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handleSendBarcode = async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean || isSending) return;

    setIsSending(true);
    setStatusMsg(`Sending ${clean}...`);

    try {
      // Play audio beep sound
      playBeep();

      const res = await fetch('/api/scan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean }),
      });

      const data = await res.json();
      if (data.success) {
        setLastScanned(clean);
        setScanCount((prev) => prev + 1);
        setStatusMsg(`✓ Transmitted "${clean}" to POS Billing Counter`);
      } else {
        setStatusMsg(`Failed to sync: ${data.error}`);
      }
    } catch (e) {
      setStatusMsg('Network error. Check Wi-Fi connection.');
    } finally {
      setIsSending(false);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // High C pitch
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) {
      handleSendBarcode(manualCode);
      setManualCode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm text-white flex items-center gap-1.5">
              5Star Mobile Scanner
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h1>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Live POS Network Sync
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800 font-extrabold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Scanned: {scanCount}
          </span>
        </div>
      </div>

      {/* Main Camera Scanner Container */}
      <div className="my-4 space-y-4">
        {errorMsg ? (
          <div className="p-4 rounded-2xl bg-red-950 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="bg-slate-900 border-2 border-blue-600 rounded-2xl p-2 shadow-2xl relative overflow-hidden">
            <div id="phone-camera-viewport" className="w-full text-white rounded-xl overflow-hidden" />
          </div>
        )}

        {/* Live Status Toast */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <p className="text-xs font-mono font-bold text-blue-400 flex items-center justify-center gap-2">
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {statusMsg}
          </p>

          {lastScanned && (
            <p className="text-[11px] text-slate-400 font-mono">
              Last Item: <strong className="text-white">{lastScanned}</strong>
            </p>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Type barcode manually..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 font-bold focus:border-blue-600 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-md active:scale-95 transition-all"
          >
            Send
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center text-[10px] text-slate-400 space-y-1">
        <p className="font-medium">
          Connected to <strong>5Star Online Mart POS Billing System</strong>
        </p>
        <p className="text-slate-500">Keep this screen open while scanning product labels.</p>
      </div>
    </div>
  );
}
