import { NextResponse } from "next/server";

// Fetch 180 1-second candles (3 minutes of history)
const KLINES_ENDPOINTS = [
  "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1s&limit=180",
  "https://data-api.binance.vision/api/v3/klines?symbol=ETHUSDT&interval=1s&limit=180",
];

export async function GET() {
  try {
    let res: Response | null = null;
    for (const url of KLINES_ENDPOINTS) {
      try {
        const attempt = await fetch(url, {
          headers: {
            "User-Agent": "deadpool-arena/1.0",
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (attempt.ok) {
          res = attempt;
          break;
        }
        console.warn(`Binance fetch failed: ${url} (${attempt.status})`);
      } catch (error) {
        console.warn(`Binance fetch error: ${url}`, error);
      }
    }

    if (!res) {
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
