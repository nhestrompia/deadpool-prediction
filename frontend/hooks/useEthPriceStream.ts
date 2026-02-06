"use client";

import { usePriceContext } from "@/providers/PriceProvider";

export function useEthPriceStream() {
  return usePriceContext();
}
