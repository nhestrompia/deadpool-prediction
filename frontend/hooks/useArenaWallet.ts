"use client";

import { useQueryClient } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { useConnection, useReadContract, useWatchContractEvent } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

export function useArenaWallet() {
  const { address } = useConnection();
  const queryClient = useQueryClient();
  const contractAddress = deadpoolArenaAddress ?? zeroAddress;

  const { data: walletData, refetch: refetchWallet } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getWallet",
    args: [address ?? zeroAddress],
    query: {
      enabled: Boolean(address && deadpoolArenaAddress),
      refetchInterval: 5000,
    },
  });

  const { data: activeBet } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getActiveBet",
    args: [address ?? zeroAddress],
    query: {
      enabled: Boolean(address && deadpoolArenaAddress),
      refetchInterval: 5000,
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
      refetchInterval: 5000,
    },
  });

  // Watch for BetResolved events for this user to trigger immediate refresh
  useWatchContractEvent({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    eventName: "BetResolved",
    enabled: Boolean(address && deadpoolArenaAddress),
    onLogs: (logs) => {
      // Check if any log is for this user
      const isForUser = logs.some(
        (log) => log.args && "user" in log.args && log.args.user === address,
      );
      if (isForUser) {
        queryClient.invalidateQueries({ queryKey: ["readContract"] });
      }
    },
  });

  // Watch for BetPlaced events for this user
  useWatchContractEvent({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    eventName: "BetPlaced",
    enabled: Boolean(address && deadpoolArenaAddress),
    onLogs: (logs) => {
      const isForUser = logs.some(
        (log) => log.args && "user" in log.args && log.args.user === address,
      );
      if (isForUser) {
        queryClient.invalidateQueries({ queryKey: ["readContract"] });
      }
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
