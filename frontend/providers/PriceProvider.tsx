"use client";

import type { PricePoint } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const STREAM_URL = "wss://stream.binance.com:9443/ws/ethusdt@trade";
const SAMPLE_INTERVAL_MS = 1000;
const WINDOW_MS = 3 * 60 * 1000; // 3 minute rolling window
const EMA_ALPHA = 0.2;
const MIN_POINT_GAP_MS = 800; // Minimum gap between points to avoid overlap

type PriceSnapshot = {
  price: number | null;
  series: PricePoint[];
};

type PriceStore = {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => PriceSnapshot;
  _update: (next: PriceSnapshot) => void;
};

function createPriceStore(): PriceStore {
  let snapshot: PriceSnapshot = { price: null, series: [] };
  const listeners = new Set<() => void>();

  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot() {
      return snapshot;
    },
    _update(next: PriceSnapshot) {
      snapshot = next;
      for (const cb of listeners) cb();
    },
  };
}

const PriceContext = createContext<PriceStore | null>(null);

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createPriceStore());

  // One-time historical price fetch (60 1-minute candles from Binance)
  const { data: historicalSeries } = useQuery<PricePoint[]>({
    queryKey: ["eth-price-history"],
    queryFn: async () => {
      const res = await fetch("/api/eth-price");
      if (!res.ok) throw new Error("Failed to fetch price history");
      const json = await res.json();
      return json.series;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Refs for WebSocket sampling logic
  const latestPriceRef = useRef<number | null>(null);
  const emaRef = useRef<number | null>(null);
  const seriesRef = useRef<PricePoint[]>([]);
  const seededRef = useRef(false);

  // Seed from historical data if WebSocket hasn't delivered data yet
  useEffect(() => {
    if (
      historicalSeries &&
      historicalSeries.length > 0 &&
      !seededRef.current &&
      latestPriceRef.current === null
    ) {
      seededRef.current = true;
      const sorted = [...historicalSeries].sort((a, b) => a.time - b.time);
      const lastHistorical = sorted[sorted.length - 1];
      const now = Date.now();
      const offset = now - lastHistorical.time;
      const shifted = sorted.map((point) => ({
        time: point.time + offset,
        price: point.price,
      }));
      const filtered = shifted.filter((point) => now - point.time <= WINDOW_MS);
      const lastPoint = filtered[filtered.length - 1] ?? shifted[shifted.length - 1];
      latestPriceRef.current = lastPoint.price;
      emaRef.current = lastPoint.price;
      seriesRef.current = filtered;
      store._update({ price: lastPoint.price, series: filtered });
    }
  }, [historicalSeries, store]);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let mounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!mounted) return;
      ws = new WebSocket(STREAM_URL);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          const nextPrice = Number(data.p);
          if (!Number.isFinite(nextPrice)) return;
          latestPriceRef.current = nextPrice;
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 1000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // 1-second sampling interval
  useEffect(() => {
    const id = setInterval(() => {
      const rawPrice = latestPriceRef.current;
      if (rawPrice === null) return;

      const now = Date.now();
      const current = seriesRef.current;
      const lastPoint = current[current.length - 1];

      if (lastPoint && now - lastPoint.time < MIN_POINT_GAP_MS) {
        store._update({ price: rawPrice, series: current });
        return;
      }

      const previous = emaRef.current ?? rawPrice;
      const ema = rawPrice * EMA_ALPHA + previous * (1 - EMA_ALPHA);
      emaRef.current = ema;

      const cutoff = now - WINDOW_MS;
      const next = [
        ...current.filter((p) => p.time >= cutoff),
        { time: now, price: ema },
      ];
      seriesRef.current = next;
      store._update({ price: rawPrice, series: next });
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [store]);

  return (
    <PriceContext.Provider value={store}>{children}</PriceContext.Provider>
  );
}

export function usePriceContext(): PriceSnapshot {
  const store = useContext(PriceContext);
  if (!store) {
    throw new Error("usePriceContext must be used within a PriceProvider");
  }

  const subscribe = useCallback(
    (cb: () => void) => store.subscribe(cb),
    [store],
  );
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
