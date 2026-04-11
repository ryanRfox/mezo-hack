---
marp: true
theme: uncover
paginate: true
footer: 'x402 + mUSD on Mezo · github.com/ryanRfox/mezo-hack'
style: |
  section {
    font-family: -apple-system, 'Segoe UI', sans-serif;
  }
  section.lead h1 {
    font-size: 2.6em;
  }
  code {
    font-size: 0.85em;
  }
  pre {
    font-size: 0.75em;
  }
  .small {
    font-size: 0.7em;
    color: #666;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# x402 + mUSD
## Internet-Native Payments for APIs

Ryan Fox · Mezo Foundation
Tuesday, 2026-04-14

<span class="small">github.com/ryanRfox/mezo-hack</span>

---

## Your API charges $20/month.

## What if you could charge **$0.001/call**?

---

## The problem

Subscriptions work for humans with credit cards.

They **don't** work for:

- AI agents (no card, no email)
- One-off calls (pay once, never again)
- Sub-cent pricing (Stripe's minimum is $0.50)
- Anonymous buyers (no KYC)

The web's payment layer was built for **people signing up**. Not for **software calling APIs**.

---

## HTTP 402 Payment Required

```
HTTP/1.1 402 Payment Required
```

Reserved in the HTTP spec since **1996**.

Never used. Until now.

<span class="small">RFC 9110 §15.5.2 still says "reserved for future use". The future is now.</span>

---

## How x402 works

Three actors, one HTTP round trip:

```
        1. GET /joke
Client ───────────────▶ Merchant
        2. 402 + accepts
       ◀───────────────
        3. sign with wallet
        4. GET /joke + X-PAYMENT
       ────────────────▶
                        5. /verify ─▶ Facilitator
                        6. /settle ─▶ Facilitator ─▶ Chain
        7. 200 + content
       ◀────────────────
```

**You** build the merchant. **We** host the facilitator. **They** bring the wallet.

---

## Mezo + mUSD

- **Bitcoin-backed L2.** Your payment rails are secured by BTC.
- **mUSD: 18 decimals + Permit2.** Gasless signature-based authorization. Clean sub-cent micropayments.
- **Free testnet + free facilitator.** `faucet.mezo.org`, `facilitator.vativ.io`. No allowlist, no signup, ~2 second finality.

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 🎬 LIVE DEMO

<span class="small">(speaker: switch to browser)</span>

---

<!-- _class: lead -->
<!-- _paginate: false -->

## humor-usw3.vativ.io

## browser → 402 → sign → paid joke → tx hash on explorer

---

<!-- _class: lead -->
<!-- _paginate: false -->

## Follow along

# humor-usw3.vativ.io

<span class="small">open it in another tab — the joke is funnier when it's yours</span>

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 📝 CODE WALKTHROUGH

<span class="small">(speaker: switch to editor — mezo-hack/starter/server.ts)</span>

---

## The paymentMiddleware

```ts
app.use(
  paymentMiddleware(
    {
      "GET /joke": {
        accepts: {
          scheme: "exact",
          network: "eip155:31611",
          payTo: PAYEE_ADDRESS,
          price: { amount: "1000000000000000", asset: MUSD_ADDRESS, ... },
        },
        description: "Unlock a Bitcoin joke",
      },
    },
    new x402ResourceServer(
      new HTTPFacilitatorClient({ url: FACILITATOR_URL }),
    ).register("eip155:*", new ExactEvmScheme()),
  ),
);
```

**One block. One route. Done.**

---

## The price config

```ts
price: {
  amount: "1000000000000000",  // 0.001 mUSD (18 decimals)
  asset: MUSD_ADDRESS,
  extra: {
    name: "Mezo USD",
    version: "1",
    assetTransferMethod: "permit2",
    supportsEip2612: true,
  },
}
```

Change the amount. Change the price.
Change the asset. Change the chain.

---

## The route handler

```ts
app.get("/joke", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});
```

**This runs only after payment settles.**

No session check. No auth header. No user table.
The payment *is* the access grant.

---

## Your turn

```bash
git clone https://github.com/ryanRfox/mezo-hack.git
cd mezo-hack/starter
pnpm install && pnpm dev
```

1. Change `jokes.json`
2. Change the price in `server.ts`
3. Rename the route — point it at your real API

Deploy it anywhere. It's just Express.

---

## Where to go next

- **Repo:** [github.com/ryanRfox/mezo-hack](https://github.com/ryanRfox/mezo-hack)
- **Docs:** `docs/what-is-x402.md`, `docs/why-mezo.md`, `docs/architecture.md`
- **Faucet:** [faucet.mezo.org](https://faucet.mezo.org)
- **Facilitator:** `https://facilitator.vativ.io`
- **Mezo:** [mezo.org](https://mezo.org)
- **Upstream x402:** [x402.org](https://x402.org)

---

## The agentic web is coming

Agents that negotiate, buy, and settle autonomously need a payment layer
that **doesn't require a human at a browser**.

x402 is that layer — HTTP-native, wallet-authorized, chain-agnostic.

On Mezo, it settles on Bitcoin.

**Build the merchant. Point at our facilitator. Ship.**

---

<!-- _class: lead -->
<!-- _paginate: false -->

# Questions?

**github.com/ryanRfox/mezo-hack**

Ryan Fox · @ryanRfox
