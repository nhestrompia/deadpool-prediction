"use client";

import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

import { useConnection } from "wagmi";
export function useArenaWallet() {
  const { address } = useConnection();
  const contractAddress = deadpoolArenaAddress ?? zeroAddress;

  const { data: walletData, refetch: refetchWallet } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getWallet",
    args: [address ?? zeroAddress],
    query: {
      enabled: Boolean(address && deadpoolArenaAddress),
      refetchInterval: 8000,
    },
  });

  const { data: activeBet } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getActiveBet",
    args: [address ?? zeroAddress],
    query: {
      enabled: Boolean(address && deadpoolArenaAddress),
      refetchInterval: 8000,
    },
  });

  const balance = walletData?.[0] ?? 0n;
  const lossStreak = walletData?.[1] ?? 0;
  const banned = walletData?.[2] ?? false;
  const activeBetAmount = activeBet?.[1] ?? 0n;
  const activeBetMarketId = activeBet?.[0] ?? 0n;
  const activeBetChoice = activeBet?.[2] ?? false;
  const hasActiveBet = activeBetAmount > 0n;

  const { data: activeBetMarket } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getMarket",
    args: [activeBetMarketId],
    query: {
      enabled: hasActiveBet && Boolean(deadpoolArenaAddress),
    },
  });

  return {
    balance,
    lossStreak,
    banned,
    activeBetAmount,
    activeBetMarketId,
    activeBetChoice,
    activeBetQuestion: activeBetMarket?.[0] ?? "",
    hasActiveBet,
    refetchWallet,
  };
}
