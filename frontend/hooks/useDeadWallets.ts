"use client";

import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

const BATCH_SIZE = 50n;

export function useDeadWallets() {
  const contractAddress = deadpoolArenaAddress ?? zeroAddress;
  const enabled = Boolean(deadpoolArenaAddress);

  const { data: deadCount, isLoading: countLoading } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "deadWalletCount",
    query: { enabled, refetchInterval: 10000 },
  });

  const total = typeof deadCount === "bigint" ? deadCount : 0n;

  const { data: deadWallets, isLoading: walletsLoading } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "getDeadWallets",
    args: [0n, total > BATCH_SIZE ? BATCH_SIZE : total],
    query: {
      enabled: enabled && total > 0n,
      refetchInterval: 10000,
    },
  });

  return {
    total,
    wallets: deadWallets ? [...deadWallets].reverse() : [],
    isLoading: countLoading || walletsLoading,
  };
}
