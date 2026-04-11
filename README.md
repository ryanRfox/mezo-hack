# mezo-hack

x402 + mUSD on Mezo Testnet — a minimal merchant starter, reference docs, and
live demo materials from the Tuesday webinar.

## What is x402?

x402 is an open protocol that turns HTTP's long-forgotten **402 Payment
Required** status into a real payment flow. A client hits your API, gets a
`402` describing what to pay and to whom, signs a stablecoin authorization
with their wallet, and retries. Your merchant code settles through a
**facilitator** — the only piece you don't have to run yourself — and returns
the resource. No accounts, no subscriptions, no Stripe. It's designed for AI
agents that don't have credit cards but do have wallets.

## Why Mezo

[Mezo](https://mezo.org) is a Bitcoin-backed L2 with **mUSD**, a native
stablecoin (18 decimals, Permit2-native). For x402 this means: free testnet
faucet, low gas, Bitcoin-anchored settlement, and a facilitator we host for
you. You write the merchant. We provide everything else.

## Repo layout

```
mezo-hack/
├── starter/      # Minimal merchant (~50 LOC) — clone, install, run
├── docs/         # what-is-x402, why-mezo, architecture
└── webinar/      # Slides, speaker notes, demo script, pre-flight
```

## Quick start

```bash
git clone https://github.com/ryanRfox/mezo-hack.git
cd mezo-hack/starter
pnpm install
cp .env.example .env   # set PAYEE_ADDRESS to your wallet
pnpm dev
curl -i http://localhost:3000/joke   # → 402 Payment Required
```

Full walkthrough including how to get testnet mUSD, pay for the endpoint, and
modify the route: **[starter/README.md](starter/README.md)**.

## Live demo

The same pattern, deployed and wallet-connected, is live at
**[humor-usw3.vativ.io](https://humor-usw3.vativ.io)**. Browser-based wallet
flow, real Mezo Testnet settlement, free if the faucet's cooperating.

## Webinar materials

| File | Purpose |
|---|---|
| `webinar/plan.md` | Time budget, audience profile, risk table |
| `webinar/slides/` | Slide deck source (~17 slides) |
| `webinar/speaker-notes.md` | Talking points with minute anchors |
| `webinar/demo-script.md` | Step-by-step live demo path with fallbacks |
| `webinar/pre-flight.md` | 30-minute pre-webinar checklist |
| `webinar/qa.md` | Anticipated Q&A |

## Reference docs

| File | Content |
|---|---|
| `docs/what-is-x402.md` | The protocol in 300 words |
| `docs/why-mezo.md` | Why mUSD on Mezo for x402 |
| `docs/architecture.md` | Full request flow with sequence diagram |

## Hosted infrastructure you can use for free

- **Facilitator:** `https://facilitator.vativ.io` (Mezo Testnet, chain 31611)
- **Testnet RPC:** `https://rpc.test.mezo.org`
- **Explorer:** `https://explorer.test.mezo.org`
- **Faucet:** [faucet.mezo.org](https://faucet.mezo.org)

## License

MIT
