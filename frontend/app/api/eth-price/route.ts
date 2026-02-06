import { NextResponse } from "next/server";

// Fetch 180 1-second candles from Binance (3 minutes of history)
const BINANCE_KLINES_URL =
  "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1s&limit=180";

export async function GET() {
  try {
    const res = await fetch(BINANCE_KLINES_URL, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Binance request failed" },
        { status: 502 },
      );
    }

    const klines = await res.json();

    if (!Array.isArray(klines) || klines.length === 0) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 502 },
      );
    }

    // Transform klines to PricePoint array
    // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
    const series = klines.map((k: (string | number)[]) => ({
      time: Number(k[6]), // closeTime in ms
      price: Number(k[4]), // close price
    }));

    return NextResponse.json({ series });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ETH price history" },
      { status: 500 },
    );
  }
}
