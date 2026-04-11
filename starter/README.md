# Mezo x402 Starter

A minimal paywalled API on Mezo Testnet. One route. ~50 lines of TypeScript.
Clone, change the jokes, ship.

```
GET /joke  →  402 Payment Required  →  sign with mUSD  →  200 OK + joke
```

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

## Install and run

```bash
git clone https://github.com/ryanRfox/mezo-hack.git
cd mezo-hack/starter

pnpm install
cp .env.example .env
# Edit .env and set PAYEE_ADDRESS to your wallet address
pnpm dev
```

The server starts on `http://localhost:3000`. You'll see:

```
Mezo x402 starter on :3000 — GET /joke (0.001 mUSD → 0xYour…)
```

## Hit it with curl

Without payment:

```bash
curl -i http://localhost:3000/joke
```

Expected response — HTTP **402 Payment Required** with a JSON body describing
what to pay, to whom, and how:

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:31611",
    "payTo": "0xYour...",
    "maxAmountRequired": "1000000000000000",
    "asset": "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
    "extra": {
      "name": "Mezo USD",
      "version": "1",
      "assetTransferMethod": "permit2",
      "supportsEip2612": true
    }
  }]
}
```

That's a request for **0.001 mUSD** (1×10¹⁵ wei — mUSD has 18 decimals) on
Mezo Testnet, settled via Permit2.

## Pay for it

Any x402 client will read the 402 body, sign a Permit2 authorization with your
wallet, and retry the request. The easiest way to try it without writing a
client: use our hosted paywall demo at **[humor-usw3.vativ.io](https://humor-usw3.vativ.io)** — it runs the same starter pattern with a browser-based wallet flow.

On a successful payment you get a **200 OK** with the joke:

```json
{
  "setup": "Why don't Bitcoin holders ever lose at poker?",
  "punchline": "They never fold."
}
```

And the settlement transaction shows up on
[Mezo Testnet Explorer](https://explorer.test.mezo.org) — that's your 0.001
mUSD moving from the buyer to your `PAYEE_ADDRESS`.

## Change the joke

Open `jokes.json` and replace the entries. Restart `pnpm dev` and curl again.
That's the whole modification loop.

## Change the price

In `server.ts`, update the `price.amount` field. Values are in wei (mUSD has
18 decimals):

| Amount | Value |
|---|---|
| 0.0001 mUSD | `"100000000000000"` |
| 0.001 mUSD  | `"1000000000000000"` |
| 0.01 mUSD   | `"10000000000000000"` |
| 0.1 mUSD    | `"100000000000000000"` |
| 1 mUSD      | `"1000000000000000000"` |

## Change the route

Replace `/joke` with whatever resource you're actually monetizing — a chat
completion, a data API, a rendered image. The `paymentMiddleware` config maps
HTTP routes to payment requirements; the route handler runs only after
settlement succeeds.

## Troubleshooting

**`PAYEE_ADDRESS is required`** — You skipped editing `.env`. Set
`PAYEE_ADDRESS` to a wallet address you control.

**`ECONNREFUSED` when the server starts** — The starter connects to our hosted
facilitator at `https://facilitator.vativ.io`. If it's unreachable, check your
network or see [status page](https://github.com/ryanRfox/mezo-hack/issues).

**Client says "insufficient mUSD"** — Top up from [faucet.mezo.org](https://faucet.mezo.org). The faucet refills frequently.

**Client settles but the joke endpoint 500s** — Check `jokes.json` is valid
JSON. The route handler reads it on every request.

## What's next

- **[docs/what-is-x402.md](../docs/what-is-x402.md)** — the protocol in 300 words
- **[docs/why-mezo.md](../docs/why-mezo.md)** — why mUSD on Mezo for x402
- **[docs/architecture.md](../docs/architecture.md)** — full request flow diagram
- **[x402.org](https://x402.org)** — upstream spec and client libraries
