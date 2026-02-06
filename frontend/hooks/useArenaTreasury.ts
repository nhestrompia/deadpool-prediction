"use client";

import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

export function useArenaTreasury() {
  const contractAddress = deadpoolArenaAddress ?? zeroAddress;

  const query = {
    enabled: Boolean(deadpoolArenaAddress),
    refetchInterval: 5000,
  };

  const { data: contractBalance } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "contractBalance",
    query,
  });

  const { data: totalBalances } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "totalBalances",
    query,
  });

  const { data: totalLocked } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "totalLocked",
    query,
  });

  const { data: treasuryAvailable } = useReadContract({
    address: contractAddress,
    abi: deadpoolArenaAbi,
    functionName: "treasuryAvailable",
    query,
  });

  return {
    contractBalance: contractBalance ?? 0n,
    totalBalances: totalBalances ?? 0n,
    totalLocked: totalLocked ?? 0n,
    treasuryAvailable: treasuryAvailable ?? 0n,
  };
}
