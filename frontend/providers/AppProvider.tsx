"use client";
import { config } from "@/config";
import { PriceProvider } from "@/providers/PriceProvider";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PriceProvider>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </PriceProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default AppProvider;
