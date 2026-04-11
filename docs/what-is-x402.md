# What is x402?

x402 is an open protocol for HTTP-native payments. It takes the **402 Payment
Required** status code — which has been sitting unused in the HTTP spec since
1996 — and turns it into a real, in-protocol way for a client to pay a server
with a stablecoin.

## The flow in one sentence

Client hits an endpoint, server returns `402` describing what to pay, client's
wallet signs an authorization, client retries with the signed payment in a
header, server verifies and settles via a facilitator, server returns the
content.

## The three roles

| Role | What it does | Who runs it |
|---|---|---|
| **Client** | Makes the request, signs the payment authorization with a wallet | Browser, CLI, or AI agent |
| **Merchant** | Returns 402 on unpaid requests, calls facilitator to verify + settle, returns content on success | You (the API owner) |
| **Facilitator** | Verifies signatures, executes the on-chain transfer, returns tx hash | Operator (we run one for you on Mezo) |

The merchant code is the only piece most developers build. The wallet
libraries handle the client side. The facilitator handles the on-chain side.

## Why a new payment layer

Traditional web payments assume a human at a browser with a credit card and
an email address. That model breaks when the caller is an **AI agent**: no
card, no email, no subscription relationship, and a need to pay sub-cent
amounts per call. Micropayments via stablecoins solve it — but only if the
payment flow is in-band with HTTP.

x402 is that in-band flow. A single status code and a single header
(`X-PAYMENT`) carry the entire negotiation. No sessions, no accounts, no
API keys. Pay-per-request.

## What you get for free

- **Pay-per-use pricing** without building a subscription system
- **Agent-compatible** by design — agents can call your API the same way
  humans do, because the wallet is the auth primitive
- **Chain-agnostic** — the protocol carries the chain/asset/scheme in the
  `accepts` block. Merchants can offer multiple chains; clients pick.
- **Stateless** — no user table, no session store, no rate-limit workaround.
  The payment IS the access grant.

## See also

- `architecture.md` — full request flow with sequence diagram
- `why-mezo.md` — why run x402 on Mezo with mUSD
- [x402.org](https://x402.org) — upstream spec and client libraries
