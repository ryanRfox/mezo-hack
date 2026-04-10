# x402 + mUSD on Mezo Webinar — Planning Doc

> **Date:** Tuesday morning (TBC week of 2026-04-13)
> **Format:** 75-minute webinar (talk + live demo, no build-along)
> **Audience:** Mostly students, mixed backgrounds
> **Goal:** Get developers building paywalled APIs on Mezo
> **Repo:** [github.com/ryanRfox/mezo-hack](https://github.com/ryanRfox/mezo-hack)

---

## Audience Profile

| Background | Approximate share | Implications |
|------------|------------------|--------------|
| Used ChatGPT | Most | Hook with familiar AI scenario |
| Knows what an API is | Many | Don't explain HTTP basics |
| Has built an API | Some | Code walkthrough lands |
| Has used a wallet | Some | Need to explain wallet connect briefly |
| Has written a smart contract | Few | Skip Solidity entirely |
| Has built an AI agent | Few | Don't assume agent fluency |
| Knows what x402 is | Few | Treat as net-new |
| Understands agentic payments | Few | Concept-first framing required |

**Floor:** "you've used ChatGPT and you understand HTTP."

---

## Time Budget (75 min)

| Min | Section | Asset | Risk |
|-----|---------|-------|------|
| 0-3 | Hook: "your API doesn't work for AI agents (yet)" | Slide 1-2 | Low |
| 3-12 | Problem framing: subscriptions vs micropayments + x402 in one diagram | Slides 3-5 + mermaid | Low |
| 12-18 | Mezo + mUSD: Bitcoin-backed, 18 decimals, Permit2 path | Slide 6 | Low |
| 18-35 | **Live demo:** browser → 402 → wallet → pay → joke + tx hash on Mezo Explorer | humor-usw3.vativ.io live | **HIGH** |
| 35-55 | **Code walkthrough:** the 50-line starter merchant. Show paymentMiddleware, price config, route handler. | mezo-hack/starter on screen | Medium |
| 55-65 | "Now your turn": clone the repo, change the route, change the price. Show what they should see — don't actually clone live. | Slide + repo URL | Low |
| 65-70 | Where to go next: docs, repo, faucet, support channel | Slide | Low |
| 70-75 | Q&A | Anticipated Q doc | Medium |

**Slack:** if demo runs long, eat into the "Now your turn" section. If demo fails, jump to recorded fallback (TBD whether we record one given time constraints).

---

## Deliverables (priority order)

| # | Deliverable | Effort | Status |
|---|------------|--------|--------|
| 1 | **Minimal starter** (`mezo-hack/starter/`) — 1 GET route, JSON file, ~50 lines | Small | TODO |
| 2 | **Starter README** — clone, install, run, modify | Small | TODO |
| 3 | **Top-level README** — landing page, what + how to clone + run | Small | TODO |
| 4 | **Slide deck** (~15-18 slides) | Medium | TODO |
| 5 | **Mermaid sequence diagram** (client → merchant → facilitator → mUSD settlement) | Small | TODO |
| 6 | **Speaker notes** with explicit transitions (webinars need pacing) | Medium | TODO |
| 7 | **Demo script** (`webinar/demo-script.md`) — exact steps, fallbacks | Small | TODO |
| 8 | **Reference docs** (`docs/what-is-x402.md`, `docs/why-mezo.md`, `docs/architecture.md`) | Medium | TODO |
| 9 | **Pre-flight checklist** (`webinar/pre-flight.md`) — verify facilitator, fund wallet, test flow | Small | TODO |
| 10 | **Anticipated Q&A** (`webinar/qa.md`) — top 10 student questions | Small | TODO |

---

## Explicitly NOT Building

- Smart contract walkthrough (audience won't connect)
- Client code deep-dive (audience isn't writing the client)
- Facilitator architecture (advanced topic, distract from goal)
- Build-along environment setup (webinars can't debug 100 students)
- Recorded demo backup video (live demo with healthy fleet is fine for webinar; revisit if time allows)
- Multiple chains comparison (we're selling Mezo, not the field)
- The current humor server's `/add` endpoint or AI moderation (too complex for 50-line starter)

---

## Push Backs / Risks

### Risk 1: Live demo fails on webinar day

**Probability:** Medium. The fleet has been stable but webinars are a Murphy's-Law magnet.

**Mitigations:**
- Pre-flight checklist run 30 min before going live
- Demo wallet pre-funded with 1 mUSD (>>1000 jokes worth)
- Test full flow within the hour before
- All 3 VMs healthy on v0.9.5 — if one fails, the LB routes around it
- If everything fails: pivot to walking through code on screen instead, narrate the demo verbally

### Risk 2: "Build-along" expectations

Students hear "build a paywalled API" and expect a workshop. **It's not a workshop.** Frame it explicitly: "I'll show you the code. You'll clone it after this webinar. The repo is `github.com/ryanRfox/mezo-hack`." Set expectations in slide 1.

### Risk 3: Audience over-rotates on agentic angle

The hook is "AI agents need to pay for things." But students mostly haven't built agents. **Don't dwell on agents.** The mental model that lands: "your API charges $20/month. What if you could charge $0.001 per call? That's x402." Save the agent angle for the closing pitch.

### Risk 4: Mezo-specific quirks confuse beginners

mUSD uses 18 decimals (not USDC's 6) and Permit2 (not EIP-3009). These are inside-baseball. **Hide them.** The slide says "mUSD on Mezo." The starter code uses our facilitator URL. Students don't see Permit2 config unless they ask. (Our existing humor server has the Permit2 `extra` block — keep it in the starter but don't dwell on it.)

### Risk 5: 75 minutes is generous and we drift

Pacing risk. Webinars without audience cues feel longer for the speaker. **Use the time budget as a hard schedule.** Speaker notes should mark "minute X" anchors so the speaker can check pace.

---

## Source Materials (already exist)

| Asset | Location | Use |
|-------|----------|-----|
| Working merchant (humor server, 292 lines) | `server/humor-server.ts` | Source for the minimal starter |
| Working facilitator fleet | `https://facilitator.vativ.io` (3 VMs) | Live demo backend |
| Working SPA (v0.9.5) | `https://humor-usw3.vativ.io` | Live demo target |
| Competitive analysis | `docs/x402-devrel-competitive-analysis.md` | Source for "where x402 is in the ecosystem" slide if needed |
| Algorand devrel concepts | (in competitive analysis) | Source for slide structure principles (Diátaxis, 20-min win) |
| Upstream PRs in flight | x402-foundation/x402#1920, #1973, #1980 | Mention as "improving the SDK" if asked |

---

## Pitfalls to Avoid

1. **Don't use `@x402/paywall`** — it breaks on Mezo (hardcoded decimals, USDC label, missing chain support). Our PRs #1973/#1980 fix this but won't be merged by Tuesday. Stick with our custom SPA at `humor-usw3.vativ.io`.

2. **Don't show chain shims** — viem 2.47.10 has Mezo natively (Ryan's PR #4422). No `defineChain()` needed in the starter.

3. **Don't show fleet config** — single-instance facilitator URL is what the audience needs. The 3-VM LB setup is impressive but irrelevant to a beginner.

4. **Don't show the leaderboard or moderation** — the humor server has them; the starter does not.

5. **Don't show the dashboard** — it's an ops tool, not a teaching tool.

---

## Starter Spec (Deliverable #1 detail)

The starter is the centerpiece. It MUST be:

- **~50 lines of TypeScript** (excluding imports and config)
- **Single file** (`server.ts`) — students can read it in one screen
- **One paywalled route** (`GET /joke`) — returns a JSON object
- **No SPA** — `curl` it, that's the demo
- **No /add, no moderation, no admin, no /health, no /info, no compression**
- **Hardcoded facilitator URL** (`https://facilitator.vativ.io`)
- **Hardcoded mUSD address and Permit2 `extra` block** (the protocol minimum)
- **`.env.example`** with only 3 vars: `PAYEE_ADDRESS`, `PORT`, optional `FACILITATOR_URL`
- **`package.json`** with the minimum deps: `@x402/express`, `@x402/evm`, `@x402/core`, `express`, `dotenv`, `tsx`, `typescript`
- **`README.md`** with: prerequisites (Node 20+, pnpm), `pnpm install && pnpm dev`, hit it with curl, expected 402 + paid 200, link to faucet, "now change the joke"

**Template source:** Take `server/humor-server.ts` from our repo, strip everything that isn't `paymentMiddleware` + the route handler. Target line count: 50 lines including imports.

---

## Reference Docs Spec (Deliverable #8 detail)

Three short docs in `mezo-hack/docs/`:

### `what-is-x402.md` (~300 words)
- The HTTP 402 status code (existed since 1996, never used)
- How x402 reuses it for crypto micropayments
- The 3 roles: client (buyer), merchant (seller), facilitator (settlement)
- Diagram (mermaid sequence)
- One paragraph: "this works for AI agents because they don't have credit cards"

### `why-mezo.md` (~250 words)
- Mezo is a Bitcoin-backed L2
- mUSD is the native stablecoin (18 decimals, Permit2 path)
- Why this matters for x402: free testnet faucet, low fees, fast finality
- Link to the Mezo testnet faucet
- Link to our facilitator URL

### `architecture.md` (~400 words)
- The full request flow (client makes request → 402 → signs → retries with payment → facilitator verifies → facilitator settles on-chain → merchant returns content)
- The mermaid sequence diagram (same one used in slides)
- Where each piece runs (client = browser/CLI, merchant = your code, facilitator = ours)
- "You only build the merchant. We provide the rest."

---

## Slide Deck Outline (Deliverable #4 detail)

| # | Slide | Notes |
|---|-------|-------|
| 1 | Title: "x402 + mUSD: Internet-Native Payments for APIs" | Speaker name, date, repo URL |
| 2 | Hook: "your API charges $20/month. What if you could charge $0.001/call?" | One question, no bullets |
| 3 | The problem: subscriptions don't fit AI agents | Briefly mention agents |
| 4 | The HTTP 402 status code (existed since 1996) | Historical |
| 5 | How x402 works: 3 actors | Diagram (mermaid) |
| 6 | Mezo + mUSD: why this chain | 3 bullets max |
| 7-9 | Live demo placeholder (just a screen with "DEMO" so the speaker knows to switch) | |
| 10 | Code walkthrough placeholder | |
| 11 | The 50-line merchant: paymentMiddleware | Code screenshot |
| 12 | The price config | Code screenshot |
| 13 | The route handler | Code screenshot |
| 14 | "Your turn": clone, modify, deploy | Repo URL big and clear |
| 15 | Where to go next: docs, faucet, community | Links |
| 16 | The agentic future (closing pitch, 1 minute) | Vision |
| 17 | Q&A | Same slide as 14 (so they can write down the URL) |

Total: ~17 slides, ~3 min/slide average. Comfortable pacing.

---

## 4-Day Work Plan

| Day | Work | Owner |
|-----|------|-------|
| Fri | Build minimal starter (`#1`), write top-level README (`#3`), file beads | Fresh session |
| Sat | Slide deck (`#4`), mermaid diagram (`#5`), reference docs (`#8`) | Fresh session |
| Sun | Speaker notes (`#6`), demo script (`#7`), Q&A doc (`#10`) | Fresh session |
| Mon | Pre-flight checklist (`#9`), full dry-run, fix anything that broke | Fresh session + human |

---

## Beads

| Bead | Title | Priority |
|------|-------|----------|
| **me-ak4** | **Epic:** x402 webinar Tuesday morning | P1 |
| me-4km | Build minimal starter merchant (~50 LOC) | P1 |
| me-xxm | Write starter README + top-level mezo-hack README | P1 |
| me-dvw | Build slide deck (~17 slides) | P1 |
| me-1sk | Mermaid sequence diagram | P1 |
| me-96f | Reference docs (what-is-x402, why-mezo, architecture) | P1 |
| me-9k4 | Speaker notes with timing anchors | P1 |
| me-5ry | Demo script with fallbacks | P1 |
| me-cl5 | Pre-flight checklist | P1 |
| me-61e | Anticipated Q&A doc | P2 |
| me-g2r | Full dry-run on Monday | P0 |

---

## Success Metrics

- **Primary:** Number of `git clone github.com/ryanRfox/mezo-hack` events in the 24 hours after the webinar
- **Secondary:** Number of Q&A questions about *building* (not "what is x402")
- **Tertiary:** Number of facilitator settlements from non-fox wallet addresses in the 24 hours after

We can instrument the first via GitHub clone stats. Second is qualitative. Third we can query via the Mezo Explorer.
