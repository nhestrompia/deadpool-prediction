import "dotenv/config";
import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import WebSocket from "ws";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const STREAM_URL =
  process.env.STREAM_URL ?? "wss://stream.binance.com:9443/ws/ethusdt@trade";
const MARKET_INTERVAL_SEC = Number(process.env.MARKET_INTERVAL_SEC ?? 300);
const PRICE_OFFSET = Number(process.env.PRICE_OFFSET ?? 5);

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("Missing RPC_URL, PRIVATE_KEY, or CONTRACT_ADDRESS");
  process.exit(1);
}

const arenaAbi = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "asset", type: "bytes32" },
      { name: "strike", type: "uint256" },
      { name: "above", type: "bool" },
      { name: "resolveTime", type: "uint64" },
    ],
    outputs: [{ name: "marketId", type: "uint256" }],
  },
  {
    type: "function",
    name: "resolveMarketAndSettle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcome", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getMarket",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      { name: "question", type: "string" },
      { name: "asset", type: "bytes32" },
      { name: "strike", type: "uint256" },
      { name: "above", type: "bool" },
      { name: "resolveTime", type: "uint64" },
      { name: "resolved", type: "bool" },
      { name: "outcome", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "nextMarketId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, transport: http(RPC_URL) });

let latestPrice = null;
let currentMarketId = null;

function toBytes32(text) {
  return toHex(text, { size: 32 });
}

function connectStream() {
  const ws = new WebSocket(STREAM_URL);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      const price = Number(data.p);
      if (Number.isFinite(price)) {
        latestPrice = price;
      }
    } catch {
      // ignore
    }
  });

  ws.on("close", () => {
    setTimeout(connectStream, 1000);
  });

  ws.on("error", () => {
    ws.close();
  });
}

async function initMarketPointer() {
  const nextMarketId = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "nextMarketId",
  });

  if (nextMarketId > 0n) {
    currentMarketId = nextMarketId - 1n;
    const market = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: arenaAbi,
      functionName: "getMarket",
      args: [currentMarketId],
    });
    // keep pointer aligned with latest market
  }
}

async function createMarket() {
  if (!latestPrice) return;
  const strike = Math.round(latestPrice + PRICE_OFFSET);
  const resolveTime = Math.floor(Date.now() / 1000) + MARKET_INTERVAL_SEC;
  const minutes = Math.max(1, Math.round(MARKET_INTERVAL_SEC / 60));
  const question = `Will ETH be ${strike} in ${minutes} minutes?`;

  await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "createMarket",
    args: [question, toBytes32("ETH"), BigInt(strike), true, resolveTime],
  });

  const nextMarketId = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "nextMarketId",
  });
  currentMarketId = nextMarketId - 1n;
  console.log(`Opened market #${currentMarketId} at strike ${strike}`);
}

async function resolveIfDue() {
  if (currentMarketId === null || latestPrice === null) return;

  const market = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "getMarket",
    args: [currentMarketId],
  });

  const strike = Number(market[2]);
  const above = market[3];
  const resolveTime = Number(market[4]);
  const resolved = market[5];

  if (resolved || Date.now() / 1000 < resolveTime) return;

  const outcome = above ? latestPrice >= strike : latestPrice <= strike;

  await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "resolveMarketAndSettle",
    args: [currentMarketId, outcome],
  });

  console.log(`Resolved market #${currentMarketId} with outcome ${outcome}`);
}

async function tick() {
  if (!latestPrice) return;

  if (currentMarketId === null) {
    await createMarket();
    return;
  }

  await resolveIfDue();

  const market = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: arenaAbi,
    functionName: "getMarket",
    args: [currentMarketId],
  });

  if (market[5]) {
    await createMarket();
  }
}

connectStream();
await initMarketPointer();

setInterval(() => {
  tick().catch((error) => {
    console.error("tick error", error);
  });
}, 2000);
