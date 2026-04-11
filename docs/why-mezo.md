# Why Mezo for x402

x402 is chain-agnostic. You can run it on Ethereum, Base, Solana, or any
other chain with a stablecoin. So why build on **Mezo** — a Bitcoin-backed L2
with **mUSD** as the native stablecoin?

## Bitcoin-backed settlement

Mezo is a Layer 2 that inherits Bitcoin's security via BitVM-style rollup
bridging. When your merchant accepts mUSD, the value is backstopped by BTC
held in the Mezo bridge. For API payments this means the settlement medium is
the hardest money in crypto — not a token whose backing depends on a
specific company's reserves.

## mUSD: 18 decimals, Permit2-native

mUSD is an ERC-20 stablecoin native to Mezo with two properties that matter
for x402:

1. **18 decimals**, not USDC's 6. This makes sub-cent micropayments ergonomic
   — `0.0001 mUSD = 10^14 wei` is a clean, precise integer. USDC's 6 decimals
   force awkward rounding for the price points x402 is designed for.
2. **EIP-2612 permit** and **Permit2**. Both gasless-approval flows are
   supported, which means the client can authorize a transfer with a signed
   message instead of a prior on-chain `approve()` transaction. x402 uses
   this to make the "signature → settlement" step one-shot.

## Low fees, fast finality

Mezo Testnet transactions settle in ~2 seconds at negligible cost. The
facilitator pays gas on behalf of the merchant, so neither the client nor the
merchant needs to hold native gas. The x402 round trip — `GET → 402 → sign →
retry → 200` — completes in under 3 seconds end-to-end on a healthy fleet.

## Free testnet, free facilitator

- **[faucet.mezo.org](https://faucet.mezo.org)** — testnet mUSD and gas BTC,
  refilled on demand, no allowlist
- **[facilitator.vativ.io](https://facilitator.vativ.io)** — hosted
  facilitator you can use for free. No registration. Point your merchant at
  it, you're settling x402 payments in minutes.
- **[rpc.test.mezo.org](https://rpc.test.mezo.org)** — public testnet RPC
- **[explorer.test.mezo.org](https://explorer.test.mezo.org)** — testnet
  block explorer for verifying settlements

## The short pitch

Bitcoin-anchored stablecoin, 18-decimal precision, gasless authorization,
free hosted facilitator, two-second finality. For API developers building
x402 merchants today, Mezo is the lowest-friction path from zero to
production.

## See also

- `what-is-x402.md` — the protocol
- `architecture.md` — full request flow
- [mezo.org](https://mezo.org) — Mezo project site
