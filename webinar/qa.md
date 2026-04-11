# Anticipated Q&A

Top questions likely from a mixed-background student audience who just
watched the 75-minute x402 + mUSD on Mezo talk. Answers are crisp — 2-4
sentences each — because you have 5 minutes of Q&A for 10+ questions.

If a question is outside this list, buy time: "Great question — let me
finish answering and I'll come back to yours." If you can't answer at all,
say: "I don't know — DM me on GitHub and I'll get you a real answer." Do
not fake it.

---

## Protocol / x402 questions

### Q1. "Is x402 an Ethereum thing or a standard?"

**A:** It's an open protocol, not tied to a specific chain. The spec is at
x402.org and implementations exist for EVM chains (Ethereum, Base, Mezo),
Solana, and Bitcoin is in progress. The 402 status code and the
`X-PAYMENT` header are chain-agnostic — the `accepts` block in the 402
response declares which chain and asset the merchant wants. A single
merchant can accept multiple chains.

### Q2. "Can I use this on mainnet?"

**A:** Yes — Mezo mainnet is live. For this webinar we're using testnet
because it's free. Mainnet mUSD has the same interface; you'd change the
chain ID from 31611 to 31612, the mUSD address, and point at a mainnet
facilitator. The merchant code is identical. Note that we're not running a
free mainnet facilitator yet, so you'd either self-host or wait for a
hosted option.

### Q3. "What if the client disconnects between the 402 and the paid retry?"

**A:** Nothing bad happens. The client has signed a Permit2 authorization
but hasn't submitted it anywhere, so no funds moved. The authorization has
a deadline (typically 5 minutes), after which it's invalid. The client can
always start over. There's no partial state to recover from.

### Q4. "Is the payment refundable?"

**A:** Not through the protocol itself. Once the facilitator settles
on-chain, the funds are in the merchant's wallet. Refunds are a merchant
business decision — you can implement them as a separate API call or a
reverse transfer, but x402 doesn't mediate them. In practice,
micropayment-sized refunds rarely make sense.

---

## Mezo / mUSD questions

### Q5. "Why not just use USDC on Base or Solana?"

**A:** You can — x402 works on all of them. The reasons to pick Mezo: (1)
mUSD has 18 decimals, which gives you clean integer math for sub-cent
pricing (USDC's 6 decimals force awkward rounding); (2) Bitcoin-backed
settlement is a differentiator for merchants who care about the security
model; (3) we run a free facilitator and a free faucet with no signup. The
best chain is the one that ships. If you've already got a Base deployment,
use it.

### Q6. "What's the difference between Permit2 and EIP-2612?"

**A:** Both are gasless-authorization schemes for ERC-20 transfers.
EIP-2612 is per-token and older; Permit2 is a single contract that works
for any ERC-20 and has better nonce semantics for repeated use. mUSD
supports both — x402 uses Permit2 on Mezo because it handles multiple
merchants per client more cleanly. You don't need to know this to use the
starter.

### Q7. "How fast is settlement?"

**A:** Mezo Testnet has ~2 second block times, and the x402 round trip
(402 → sign → retry → verify → settle → 200) completes in about 3 seconds
end-to-end on a healthy fleet. Mainnet is similar. This is fast enough
that the user experience feels like a normal HTTP request with a small
wallet popup.

---

## Agents / use case questions

### Q8. "Does this work with OpenAI function calls or Claude tool use?"

**A:** Yes — the agent treats the paywalled endpoint as a regular tool.
When the agent hits a 402, an x402-aware HTTP client (like `@x402/fetch`
or the upcoming agent SDK integrations) handles the wallet step
transparently. The agent's "tool call" just takes a bit longer because
there's a settlement in the middle. We have example code for this in the
repo under `docs/agentic.md` (or coming soon).

### Q9. "How does an agent get a wallet in the first place?"

**A:** Two paths. (1) The agent has its own wallet — a private key or
seed phrase stored alongside its other secrets, with the human topping up
periodically. (2) The agent has a delegated wallet — the human grants a
spending allowance via a smart contract wallet like Safe or a session key
on an account-abstraction wallet. Both work with x402 unchanged because
x402 only cares about who signs the Permit2 authorization.

### Q10. "Can I see who paid me and how much?"

**A:** Yes — it's all on-chain. Every settlement is a visible Permit2
transfer from the buyer's wallet to your `payTo` address, with the tx
hash returned to the merchant in the settlement response. You can query
your merchant wallet's transaction history from an RPC or explorer, or
keep a local log in your merchant code. There's no privacy here by
default — this is public blockchain.

---

## Implementation questions

### Q11. "Do I have to use Express? What about Python / Go / Rust?"

**A:** The starter uses Express because it's the canonical JavaScript
example, but x402 is just HTTP — any framework works. There are libraries
for Python (FastAPI middleware), Go, Rust, and more on the upstream
x402 org. The protocol is small enough that implementing it from scratch
is about 200 lines in any language.

### Q12. "How do I test this without a wallet UI?"

**A:** Use a programmatic client. The `@x402/fetch` package is a
drop-in `fetch` replacement that handles the 402 → sign → retry loop
automatically if you give it a private key. You can wire it up in a node
script or a test suite. The humor server's own smoke test
(`demo/client.ts`) does exactly this.

### Q13. "What's the catch? Why isn't everyone using this already?"

**A:** Two reasons. One: the tooling is new. Client libraries, wallet
UIs, and facilitator infrastructure have only been solid in the last 6
months. Two: most APIs don't need micropayments — subscriptions work
fine for human-facing SaaS. The pressure point is agents, and agent
traffic is just starting to hit production scale. x402 is a bet that
over the next 2 years, every API that wants agent traffic will need a
payment layer like this.

---

## Logistics / next-steps questions

### Q14. "Where's the repo again?"

**A:** `github.com/ryanRfox/mezo-hack`. It's on the slide too. Star it.

### Q15. "Can I deploy this to production today?"

**A:** The starter code is production-shaped — it's the same code that
runs humor-usw3.vativ.io. For real production you'd want to: (1) add rate
limiting so a single client can't drain your facilitator's budget,
(2) log settlements for your own bookkeeping, (3) have a monitoring story
for failed settlements. None of that is in the starter because it's meant
to be ~50 lines. All of it is straightforward to bolt on.

### Q16. "Will you open-source the facilitator?"

**A:** It's already open. The facilitator code lives in the `facilitator/`
directory of our main repo. The one we host at facilitator.vativ.io is
just a deployment of that code. You can run your own on any hosting
provider — it's a stateless Express server.

---

## If you get stumped — redirects that buy time

- "Great question, let me finish what I'm saying and come back to that" —
  then steer to a question you know
- "That's outside the scope of what we covered today, but DM me on GitHub
  and I'll send you the technical details"
- "Someone else in the audience probably knows this better than me —
  anyone want to jump in?"
- "I'd rather give you the right answer than a fast wrong one — ping me
  after"

## See also

- [`speaker-notes.md`](speaker-notes.md) — slide-by-slide narration
- [`plan.md`](plan.md) — the full webinar plan
