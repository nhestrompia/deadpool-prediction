"use client";

import { ConnectButton as ConnectButtonRainbow } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useBalance, useConnection } from "wagmi";
import { Button } from "./ui/button";
export const ConnectButton = () => {
  const connection = useConnection();

  const { data } = useBalance({
    address: connection.address,
    query: {
      enabled: !!connection.address,
    },
  });

  return (
    <ConnectButtonRainbow.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} type="button">
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    type="button"
                    variant="neutral"
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <Button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {data?.value
                      ? ` (${parseFloat(formatEther(data.value)).toFixed(2)} ETH)`
                      : ""}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButtonRainbow.Custom>
  );
};
