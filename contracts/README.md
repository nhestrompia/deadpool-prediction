# Deadpool Arena Contracts

Onchain prediction arena for the Deadpool MVP. Balances are backed by **native ETH deposits**. Bets consume internal balance and winners/losses are accounted for on-chain; frontend history/leaderboards are derived from events.

## Contract

`DeadpoolArena` at `src/DeadpoolArena.sol`.

### Core Functions

- `deposit()` payable: add ETH to your internal balance.
- `withdraw(amount)`: withdraw unused balance. **Blocked while an active bet exists.**
- `createMarket(question, asset, strike, above, resolveTime)` `onlyOwner`
- `resolveMarket(marketId, outcome)` `onlyOracle` (owner or oracle)
- `resolveMarketAndSettle(marketId, outcome)` `onlyOracle` (owner or oracle)
- `settleMarketBets(marketId)` `onlyOracle` (owner or oracle)
- `placeBet(marketId, choice, amount)` where `amount` is in wei
- `resolveMyBet()`
- `getWallet(user)` returns `(balance, lossStreak, banned)`
- `getMarket(marketId)` returns `(question, asset, strike, above, resolveTime, resolved, outcome)`
- `getActiveBet(user)` returns `(marketId, amount, choice, placedAt)`
- `setOracle(newOracle)` `onlyOwner`
- `deadWalletCount()` returns total dead wallets
- `deadWalletAt(index)` returns a dead wallet by index
- `getDeadWallets(start, count)` returns a slice for pagination

### Events (indexing guidance)

Events are the source of truth for live feed, wall of shame, and leaderboard:

- `MarketCreated(marketId, question, asset, strike, above, resolveTime)`
- `BetPlaced(user, marketId, choice, amount)`
- `BetResolved(user, marketId, win, amount, newBalance, lossStreak)`
- `PlayerDead(user, marketId, balanceBefore)`
- `Deposit(user, amount, newBalance)`
- `Withdraw(user, amount, newBalance)`

Use `PlayerDead` to build the Wall of Shame (sorted newest first). Use `BetResolved` for balance/streak updates.

## Usage Examples

```shell
# Build
forge build

# Test
forge test

# Deploy (example)
forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```

## Notes

- One active bet per wallet.
- No negative balances: losses are clamped to zero.
- When a wallet reaches 3 consecutive losses, it is banned and balance is wiped to zero.
- Markets can be resolved and settled in one call for auto-settlement by the oracle bot.
- Dead wallets are stored on-chain for the Wall of Shame UI.
- Betting closes 60 seconds before the market resolve time.
- Bet economics: `amount` is deducted at placement, then on resolution wins add `amount * 2` and losses subtract `amount * 2`.
