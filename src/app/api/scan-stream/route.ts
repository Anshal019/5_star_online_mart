import { NextResponse } from 'next/server';

// Global memory store for real-time barcode events across local network requests
type ScanEvent = {
  id: string;
  barcode: string;
  timestamp: number;
};

let recentScans: ScanEvent[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const barcode = body.barcode?.toString().trim();

    if (!barcode) {
      return NextResponse.json({ success: false, error: 'Barcode required' }, { status: 400 });
    }

    const event: ScanEvent = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      barcode,
      timestamp: Date.now(),
    };

    // Add to recent scans, keep max 50 in buffer
    recentScans.unshift(event);
    if (recentScans.length > 50) {
      recentScans = recentScans.slice(0, 50);
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get('since') || '0', 10);

  // Return new scans since the given timestamp
  const newScans = recentScans.filter((s) => s.timestamp > since);

  return NextResponse.json({
    success: true,
    scans: newScans,
    latestTimestamp: recentScans[0]?.timestamp || since,
  });
}
