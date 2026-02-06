import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { statusSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "DeadPool",
  projectId: process.env.NEXT_PUBLIC_APP_ID!,
  chains: [statusSepolia],
  ssr: false,
  transports: { [statusSepolia.id]: http() },
});
