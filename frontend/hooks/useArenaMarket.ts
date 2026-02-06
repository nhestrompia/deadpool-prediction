"use client";

import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

export function useArenaMarket() {
  const contractAddress = deadpoolArenaAddress ?? zeroAddress;

  const { data: nextMarketId } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "nextMarketId",
    query: { enabled: Boolean(deadpoolArenaAddress), refetchInterval: 8000 },
  });

  const latestMarketId =
    typeof nextMarketId === "bigint" && nextMarketId > 0n
      ? nextMarketId - 1n
      : null;

  const { data: market } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getMarket",
    args: latestMarketId !== null ? [latestMarketId] : undefined,
    query: {
      enabled: latestMarketId !== null && Boolean(deadpoolArenaAddress),
    },
  });

  const question = market?.[0] ?? "";
  const strike = market?.[2];
  const resolveTime = market?.[4];
  const resolved = market?.[5] ?? false;

  return {
    latestMarketId,
    question,
    strike,
    resolveTime,
    resolved,
  };
}
