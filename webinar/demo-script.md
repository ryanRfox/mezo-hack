# Live Demo Script

**Target URL:** `https://humor-usw3.vativ.io`
**Duration budget:** 17 minutes (slides 7–9, webinar minutes 18–35)
**Goal:** Audience sees an unpaid request get 402'd, a wallet sign the
payment, a settled transaction on the Mezo explorer, and a returned joke —
end-to-end in under 30 seconds of real time.

## Pre-demo setup (done during the pre-flight, not live)

- [ ] Browser: fresh Chrome/Brave profile, zoom at 125%, no extensions except
      the wallet
- [ ] Wallet: MetaMask or Rabby loaded with the demo wallet (see
      `pre-flight.md` for the mnemonic location)
- [ ] Wallet balance: ≥ 1 mUSD testnet (top up from
      [faucet.mezo.org](https://faucet.mezo.org) if low)
- [ ] Wallet balance: ≥ 0.001 BTC testnet for gas
- [ ] Wallet network: Mezo Testnet (chain 31611), verified
- [ ] Three tabs open, left-to-right:
  1. `humor-usw3.vativ.io` (the demo)
  2. `explorer.test.mezo.org/address/<demo-wallet>` (settlement verification)
  3. Terminal with `curl -i https://humor-usw3.vativ.io/joke` ready to paste
- [ ] Terminal font size bumped to 18pt for back-row visibility
- [ ] Presenter monitor mirrored, network hotspot as backup

## Happy path (11 minutes)

### Beat 1 — "Show them the plumbing" (slide 7, 0:00–2:00)

> **Narration:** "Before I click anything in the browser, I want you to see
> what a raw HTTP request looks like when the server wants payment. I'm
> going to curl the endpoint."

**Action:** Switch to terminal tab. Paste:

```bash
curl -i https://humor-usw3.vativ.io/joke
```

**What the audience sees:** HTTP/1.1 402 Payment Required, then the JSON
body with `accepts`, `scheme: exact`, `asset: 0x118917...` (mUSD),
`maxAmountRequired: 10000000000000000` (0.01 mUSD), `payTo: 0x...`, the
Permit2 extra block.

> **Narration points:**
> - "402 Payment Required — this status code has existed since 1996. Nobody
>   used it. We're using it."
> - "The server is telling me exactly what it wants: 0.01 mUSD on Mezo
>   Testnet, paid to this address."
> - "There's no session. There's no account. Just HTTP and a number."

### Beat 2 — "Now let me pay it" (slide 8, 2:00–4:00)

**Action:** Switch to browser tab 1 (`humor-usw3.vativ.io`).

- The page should show the x402 paywall UI with a "Get joke" or "Pay" button
- Click **Connect Wallet**

**What the audience sees:** Wallet extension popup appears.

> **Narration:** "This is the same 402 response, but rendered as a button by
> the `@x402/paywall` library. The merchant didn't build this UI — it's a
> drop-in."

- Click **Connect** in the wallet popup
- Select the demo account

**What the audience sees:** Page updates to show the wallet address, the
price (0.01 mUSD), and a "Pay and unlock" button.

### Beat 3 — "Sign the Permit2 authorization" (slide 9, 4:00–7:00)

**Action:** Click **Pay and unlock**.

**What the audience sees:** Wallet popup appears asking to sign a typed-data
message (Permit2 authorization). The popup shows:
- `Permit2.SignatureTransfer`
- Token: `Mezo USD`
- Amount: `0.01`
- Spender: the facilitator's Permit2 executor address
- Deadline: ~5 minutes out

> **Narration points:**
> - "This is a signature, not a transaction. No gas yet. The wallet is
>   signing a Permit2 authorization that says 'I allow this spender to move
>   0.01 mUSD from my account.'"
> - "Permit2 is how we avoid the two-step 'approve then transfer' dance that
>   usually makes ERC-20 payments feel clunky."

**Action:** Click **Sign** in the wallet.

**What the audience sees:** The signature is sent to the merchant via the
`X-PAYMENT` header. The merchant calls `/verify` and `/settle` on the
facilitator. The facilitator submits the on-chain call. The page updates
with a loading spinner, then unlocks.

### Beat 4 — "The content + the receipt" (still slide 9, 7:00–10:00)

**What the audience sees:** The joke appears (setup + punchline) along with
a clickable transaction hash.

> **Narration:** "There's the joke. And there's the transaction hash — the
> on-chain proof that the merchant actually got paid. Let me click it."

**Action:** Click the tx hash. Browser switches to the explorer tab
(explorer.test.mezo.org/tx/...).

**What the audience sees:** The transaction detail page showing:
- Status: Success
- Block number
- From: demo wallet address
- To: Permit2 contract
- Value: 0 (the mUSD moves in an internal call)
- Internal transaction: mUSD transfer from demo wallet → merchant payTo

> **Narration points:**
> - "Two-second finality. The merchant is already paid. The content is
>   delivered. I never touched gas — the facilitator handled that."
> - "And I never had to 'sign up' for anything. No account on this site. No
>   credit card. Just a wallet and an HTTP round trip."

### Beat 5 — "Do it again, faster" (10:00–11:00)

**Action:** Hit browser back button to `humor-usw3.vativ.io`. Refresh the
page. The paywall is back.

> **Narration:** "Every request is its own payment. There's no session
> cookie keeping me authenticated. If I want another joke, I pay again."

**Action:** Click **Pay and unlock**, sign, get a different joke.

> **Narration:** "This is what an API call costs in the x402 world. Not $20
> a month. Not a tier. One penny, one call, one tx."

## Fallback paths

### F1 — Wallet doesn't connect (30s recovery)

**Symptoms:** Click "Connect Wallet", nothing happens, or the wallet popup
shows an error.

**Recovery:**
1. Refresh the page
2. Re-click Connect Wallet
3. If still broken: **"My wallet is having a moment. Let me fall back to
   the raw curl flow — it's actually more interesting anyway."**
4. Switch to terminal tab and show the 402 response again
5. Narrate what *would* happen: "The wallet would sign a Permit2
   authorization, the client would retry with X-PAYMENT, the merchant
   would verify and settle, and the 200 would come back with the joke. All
   in about 3 seconds."
6. Return to slide deck and proceed to code walkthrough

### F2 — Facilitator returns 500 (1 min recovery)

**Symptoms:** Wallet signs, page shows "Settlement failed" or spins forever.

**Recovery:**
1. Switch to terminal. Quick health check:
   ```bash
   curl -i https://facilitator.vativ.io/health
   ```
   (No health endpoint in x402 spec, but `curl -i https://facilitator.vativ.io/`
   should return *something*.)
2. If facilitator is down: **"Looks like the facilitator is taking a
   break. Let me show you how this works in code instead — that's slide 11
   anyway."**
3. Advance to slide 10 (code walkthrough title) and run the demo narration
   from the code side
4. Mention: "In production you'd want retry logic and a fallback
   facilitator. We haven't needed it yet on testnet."

### F3 — Transaction fails on-chain (30s recovery)

**Symptoms:** Facilitator returns an error after settling, tx hash shows
`Failed` on explorer.

**Recovery:**
1. Most common cause: wallet is out of mUSD or out of gas BTC
2. Narrate: **"The wallet ran out of testnet funds. Watch this — I'll top
   up."**
3. Open a 4th tab (pre-opened to `faucet.mezo.org`), request top-up
4. Switch back, retry the payment
5. If faucet is unavailable: advance to code walkthrough

### F4 — Whole fleet is down (break glass)

**Symptoms:** `humor-usw3.vativ.io` returns 502/504 or times out.

**Recovery:**
1. **"The demo fleet is having a bad minute. Here's what it normally
   looks like — let me walk you through the code instead."**
2. Switch directly to slide 10 (code walkthrough)
3. Open `starter/server.ts` in editor tab
4. Narrate the flow from code + the sequence diagram on slide 5
5. Commit to the code walkthrough — do NOT try to restart the demo
   mid-talk. The audience will accept one graceful fallback, not two.

## Presenter quick-reference card

Print this or keep it visible during the talk:

```
┌─────────────────────────────────────────────────────┐
│  DEMO SEQUENCE (target: 11 min, hard stop at 15)    │
├─────────────────────────────────────────────────────┤
│  1. curl /joke            → show 402 + accepts      │
│  2. browser → Connect     → wallet popup            │
│  3. click Pay             → Permit2 sign popup      │
│  4. sign                  → joke + tx hash appear   │
│  5. click tx hash         → explorer opens          │
│  6. back + refresh + pay  → second joke             │
├─────────────────────────────────────────────────────┤
│  F1 wallet broken  → curl fallback + narrate        │
│  F2 facilitator    → jump to slide 10 code walk     │
│  F3 tx failed      → top up from faucet             │
│  F4 fleet down     → skip demo, direct to slide 10  │
└─────────────────────────────────────────────────────┘
```

## See also

- `pre-flight.md` — the 30-minute pre-demo checklist
- `speaker-notes.md` — narration with slide-by-slide timing
- `qa.md` — anticipated audience questions
- [starter/README.md](../starter/README.md) — the code being demoed
