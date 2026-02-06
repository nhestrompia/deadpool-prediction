# Deadpool Market Oracle

This script listens to the Binance ETH/USDT trade stream, opens a market every interval, and resolves the previous market when its resolve time hits.

## Setup

1. Install dependencies:

```shell
pnpm install
```

2. Configure environment variables (copy from `.env.example`):

```shell
RPC_URL=
PRIVATE_KEY=
CONTRACT_ADDRESS=
MARKET_INTERVAL_SEC=300
PRICE_OFFSET=5
STREAM_URL=wss://stream.binance.com:9443/ws/ethusdt@trade
```

3. Run:

```shell
node market-oracle.mjs
```

## Notes

- `PRICE_OFFSET` is added to the live ETH price to set the strike.
- The question text reflects `MARKET_INTERVAL_SEC` rounded to minutes.
- The script assumes a single active market at a time.
