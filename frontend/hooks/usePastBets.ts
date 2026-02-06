"use client";

import { useCallback, useEffect, useState } from "react";
import { zeroAddress } from "viem";
import { useConnection, usePublicClient } from "wagmi";

import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";

export type PastBet = {
  marketId: bigint;
  win: boolean;
  choice: boolean;
  amount: bigint;
  question: string;
};

export function usePastBets() {
  const { address } = useConnection();
  const publicClient = usePublicClient();

  const [bets, setBets] = useState<PastBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBets = useCallback(async () => {
    if (!address || !publicClient || !deadpoolArenaAddress) {
      setBets([]);
      return;
    }

    setIsLoading(true);
    try {
      const [resolvedLogs, placedLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: deadpoolArenaAddress,
          abi: deadpoolArenaAbi,
          eventName: "BetResolved",
          args: { user: address },
          fromBlock: 0n,
        }),
        publicClient.getContractEvents({
          address: deadpoolArenaAddress,
          abi: deadpoolArenaAbi,
          eventName: "BetPlaced",
          args: { user: address },
          fromBlock: 0n,
        }),
      ]);

      // Map marketId -> choice from BetPlaced events
      const choiceMap = new Map<bigint, boolean>();
      for (const log of placedLogs) {
        if (log.args.marketId != null && log.args.choice != null) {
          choiceMap.set(log.args.marketId, log.args.choice);
        }
      }

      const uniqueMarketIds = [
        ...new Set(resolvedLogs.map((l) => l.args.marketId!)),
      ];

      const markets = await Promise.all(
        uniqueMarketIds.map(async (id) => {
          const data = await publicClient.readContract({
            address: deadpoolArenaAddress!,
            abi: deadpoolArenaAbi,
            functionName: "getMarket",
            args: [id],
          });
          return [id, data[0]] as const;
        }),
      );
      const questionMap = new Map(markets.map(([id, q]) => [id, q]));

      const parsed: PastBet[] = resolvedLogs
        .map((log) => ({
          marketId: log.args.marketId!,
          win: log.args.win!,
          choice: choiceMap.get(log.args.marketId!) ?? false,
          amount: log.args.amount!,
          question: questionMap.get(log.args.marketId!) ?? "",
        }))
        .reverse();

      setBets(parsed);
    } catch {
      setBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  return { bets, isLoading, refetchBets: fetchBets };
}
