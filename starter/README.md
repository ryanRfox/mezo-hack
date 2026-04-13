# Mezo x402 Starter

A two-step demo showing how to add an x402 paywall to an existing Express
API. Start with a free joke endpoint, then add a paid version using the
x402 SDK.

## Prerequisites

- **Node 20+** and **pnpm**
- A wallet with a Mezo Testnet address (MetaMask, Rabby, any EVM wallet)
- A small amount of testnet **mUSD** (free — see below)

## Get testnet mUSD

1. Add Mezo Testnet to your wallet:
   - **Network name:** Mezo Testnet
   - **RPC URL:** `https://rpc.test.mezo.org`
   - **Chain ID:** `31611`
   - **Currency symbol:** BTC (gas token)
   - **Explorer:** `https://explorer.test.mezo.org`
2. Visit [faucet.mezo.org](https://faucet.mezo.org) and request testnet mUSD.
3. You'll also need a tiny bit of testnet BTC for gas — the faucet gives both.

## Install

```bash
git clone https://github.com/ryanRfox/mezo-hack.git
cd mezo-hack/starter
pnpm install
cp .env.example .env
# Edit .env and set PAYEE_ADDRESS to your wallet address
```

---

## Step 1: The free joke API

```bash
pnpm dev
```

This runs `1-server.ts` — a vanilla Express server with one endpoint.
No x402, no paywall, no payment libraries.

```bash
curl -i http://localhost:3000/free
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"setup":"Why do bitcoiners never get cold?","punchline":"Because they have plenty of hash power!"}
```

Standard HTTP 200. Open `http://localhost:3000` in your browser to see
the landing page. Kill the server with `Ctrl+C` when ready for step 2.

---

## Step 2: Add the x402 paywall

```bash
pnpm x402
```

This runs `2-server.ts` — the same server with a new `/paid` endpoint
wrapped in the x402 paywall. The `/free` endpoint is unchanged.

### The free endpoint still works

```bash
curl -i http://localhost:3000/free
```

Same 200 as before. No payment, no headers, just the joke.

### The paid endpoint returns 402

```bash
curl -i http://localhost:3000/paid
```

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json; charset=utf-8
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Mi...

{}
```

The body is empty. The payment requirements are in the `PAYMENT-REQUIRED`
header, base64-encoded. Decode it:

```bash
echo "PASTE_THE_HEADER_VALUE" | base64 -D | jq .
```

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "http://localhost:3000/paid",
    "description": "Unlock a Bitcoin joke",
    "mimeType": "application/json"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:31611",
    "amount": "1000000000000000",
    "asset": "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
    "payTo": "0xYour...",
    "maxTimeoutSeconds": 300,
    "extra": {
      "name": "Mezo USD",
      "version": "1",
      "assetTransferMethod": "permit2"
    }
  }]
}
```

The server is asking for **$0.001 in mUSD** on Mezo Testnet, settled
via Permit2. The SDK resolved the dollar price to the correct 18-decimal
mUSD amount automatically.

### Pay in the browser

Open `http://localhost:3000/paid` in Chrome with MetaMask. The paywall
UI detects the browser and shows a wallet-connect flow instead of the
raw 402:

1. Connect your wallet
2. Approve the Permit2 signature
3. The joke and transaction hash appear

The settlement is visible on
[Mezo Testnet Explorer](https://explorer.test.mezo.org).

### How the middleware routes requests

```
Browser (Accept: text/html)  →  402 + paywall HTML (2MB interactive UI)
curl / API (Accept: */*)     →  402 + {} body + PAYMENT-REQUIRED header
```

The middleware checks `Accept` and `User-Agent` to decide which response
to send. Both return 402 — the difference is how the payment requirements
are delivered.

---

## What changed between step 1 and step 2

Compare `1-server.ts` and `2-server.ts`. The differences:

1. **Imports** — `@x402/express`, `@x402/evm`, `@x402/core`, `@x402/paywall`
2. **Setup** — facilitator client, EVM scheme, paywall builder (~5 lines)
3. **Middleware** — `app.use(paymentMiddleware(...))` with one route config
4. **New handler** — `app.get("/paid", ...)` — same logic as `/free`

The `/free` handler is copy-pasted unchanged. The paywall middleware only
affects routes declared in the config (`GET /paid`). Everything else
passes through.

---

## Change the price

In `2-server.ts`, update the `price` field:

```typescript
price: "$0.001",   // one-tenth of a cent
price: "$0.01",    // one cent
price: "$0.10",    // ten cents
price: "$1.00",    // one dollar
```

The SDK converts dollar amounts to the correct mUSD atomic units
automatically (18 decimals).

## Change the route

Replace `/paid` with your own endpoint. The `paymentMiddleware` config
maps HTTP routes to payment requirements — declare which routes cost
money and how much. The route handler only runs after payment settles.

## Troubleshooting

**`PAYEE_ADDRESS is required`** — Edit `.env` and set `PAYEE_ADDRESS` to
a wallet address you control.

**`ECONNREFUSED` on startup** — The server connects to the hosted
facilitator at `https://facilitator.vativ.io`. Check your network.

**402 in the browser but no paywall UI** — Make sure you're running
`pnpm x402` (step 2), not `pnpm dev` (step 1).

**"Insufficient mUSD"** — Top up from
[faucet.mezo.org](https://faucet.mezo.org).

## What's next

- **[docs/what-is-x402.md](../docs/what-is-x402.md)** — the protocol in 300 words
- **[docs/why-mezo.md](../docs/why-mezo.md)** — why mUSD on Mezo for x402
- **[docs/architecture.md](../docs/architecture.md)** — full request flow diagram
- **[x402.org](https://x402.org)** — upstream spec and client libraries
