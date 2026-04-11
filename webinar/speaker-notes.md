# Speaker Notes

Slide-by-slide narration with explicit minute anchors. Webinars have no
audience cues — no laughter, no shuffling, no raised hands — so pacing has
to come from the clock.

**Total runtime:** 75 minutes (hard stop)
**Buffer:** 5 minutes at the end for Q&A overflow or to absorb demo
overrun. If you're behind at minute 55, skip "your turn" (slide 14) and go
straight to "where to go next" (slide 15).

---

## Slide 1 — Title (0:00–0:30)

**Say:** "Good morning. I'm Ryan Fox, I work on Mezo, and for the next 75
minutes I'm going to show you how to make your APIs charge money per call —
without building any of the payment infrastructure yourself."

**Do not:** Thank the host, introduce yourself in depth, or apologize for
anything. Open strong.

---

## Slide 2 — Hook (0:30–1:30)

**Say:** "Quick thought experiment. Your API — the one you're building for
your thesis, or your startup, or the open-source project you work on at
night — charges twenty bucks a month. Standard SaaS. What if instead, it
charged one-tenth of a cent per call? A thousand calls for a buck. Ten
thousand for ten bucks. No subscription, no signup, no account."

"Raise your hand if you'd use that pricing model." *(Pause 3 seconds. You
won't see hands in a webinar — that's fine, the pause lands the point.)*

"Me too. The reason you can't do that today is that the web's payment layer
was built for humans with credit cards. Stripe's minimum transaction is 50
cents. Zero-dot-zero-zero-one dollars doesn't fit. And that's before we talk
about who — or what — is calling your API."

---

## Slide 3 — The problem (1:30–4:00)

**Say:** "Subscriptions work for humans. They don't work for AI agents,
because agents don't have credit cards, they don't have email addresses,
they don't sign up. They have wallets."

"They don't work for one-off calls either. If I call your API once a year,
I'm not signing up for a monthly plan."

"They don't work for sub-cent pricing because Stripe won't let you charge
less than fifty cents."

"And they don't work for anonymous buyers, because every subscription means
KYC paperwork."

*(Transition:)* "What we need is a payment layer that lives inside HTTP
itself. And the spec authors — unbeknownst to themselves — left one sitting
there for us in 1996."

---

## Slide 4 — HTTP 402 (4:00–6:00)

**Say:** "HTTP 402 Payment Required. Reserved in RFC 1945, the first HTTP
spec. Reserved again in RFC 2616. Reserved in RFC 9110 — the current spec —
with the exact language 'reserved for future use.' For twenty-nine years,
nobody used it."

"The x402 protocol — the group of researchers at Coinbase, and now an open
community — decided the future was today. They took 402 and turned it into
a real payment flow using stablecoins."

"Here's how it works."

---

## Slide 5 — How x402 works (6:00–12:00)

**Say:** "Three actors. The client — a browser, a CLI, an AI agent. The
merchant — your code, the API you're selling access to. And the
facilitator — a piece of infrastructure that talks to the chain so you
don't have to."

*(Walk through the diagram step-by-step. Use the numbered callouts.)*

"One: the client hits your endpoint. Two: your server returns a 402 with a
`PAYMENT-REQUIRED` header that says 'this costs 0.001 mUSD on Mezo, pay it
to this address.' The body is empty — in x402 version 2 the envelope lives
in the header so clients can detect paywalls without parsing JSON. Three
and four: the client's wallet signs a Permit2 authorization — that's a
gasless signature, not a transaction. Five: the client retries the same
endpoint, this time with the signed authorization in an `X-PAYMENT` header.
Six: your server calls the facilitator to verify the signature. Seven:
your server calls the facilitator to settle — the facilitator executes the
Permit2 transfer on-chain. Eight: you return 200 OK with the content plus
a `PAYMENT-RESPONSE` header containing the transaction hash."

"Here's the key insight: you — the merchant — only handle HTTP. You never
touch a wallet library. You never submit a transaction. You never hold
gas. The facilitator does all of that."

---

## Slide 6 — Mezo + mUSD (12:00–18:00)

**Say:** "Three reasons Mezo is the right chain for this."

"One: Bitcoin-backed. Mezo is a Layer 2 secured by BTC. Your payments
settle on the hardest money in crypto. When an agent pays your API, the
value backing that payment is ultimately BTC."

"Two: mUSD is 18 decimals with Permit2. Eighteen decimals gives you clean
integers for sub-cent pricing — 10-to-the-14 is 0.0001 mUSD. Permit2 gives
you the gasless signature flow that makes the entire round trip feel like
a normal HTTP request."

"Three: everything is free to use. The testnet is free. The faucet is
free. The facilitator we run is free. You go to faucet-dot-mezo-dot-org,
get some mUSD, point your merchant at facilitator-dot-vativ-dot-io, and
you're settling real on-chain x402 payments in ten minutes."

*(Transition — this is the pivot point:)* "Enough talk. Let me show you."

---

## Slide 7 — LIVE DEMO title (18:00–18:30)

**Do:** Switch to browser/terminal. Leave this slide up on presenter
display.

**Say:** "I'm going to show you the humor server — a tiny paywalled API
that tells Bitcoin jokes for 0.001 mUSD each. It's deployed and live right
now at humor-usw3-dot-vativ-dot-io. Same code as the starter in the repo.
Same facilitator you'll use."

**Full demo script:** [`demo-script.md`](demo-script.md)

---

## Slide 8 — humor-usw3.vativ.io (18:30–19:00)

**Do:** Switch to browser tab 1. Show the unconnected paywall UI.

**Say:** "Here's the page. It's showing me the x402 paywall UI — but before
I click anything, I want you to see the raw HTTP request."

---

## Slide 9 — Follow along (19:00–35:00)

**Do:** Execute the 5 demo beats from `demo-script.md`:
1. `curl -i https://humor-usw3.vativ.io/joke` → show 402 + accepts block
2. Browser → Connect Wallet → Permit2 sign → joke + tx hash
3. Click tx hash → explorer shows mUSD transfer
4. Back + refresh + pay again → second joke
5. Close on: "Every request is its own payment."

**Pacing guards:**
- Minute 25: you should be on beat 3 (clicking the tx hash). If you're
  still on beat 1, skip beat 5 (the repeat pay).
- Minute 30: you should be wrapping up. If the demo has gone long, cut
  narration on beat 5 and jump straight to "Now let's look at the code."
- Minute 33: **hard stop on live demo**. If you're still in the browser
  at minute 33, whatever happens next is a fallback. Check
  [`demo-script.md`](demo-script.md) recovery paths F1–F4.

**Transition:** "That was the 17-line merchant, running in production.
Let me show you the code."

---

## Slide 10 — CODE WALKTHROUGH title (35:00–35:30)

**Do:** Switch to editor tab with `starter/server.ts` open. Leave slide up
on presenter display.

**Say:** "This is the file. Fifty lines including imports. One route. One
JSON config. Let me walk you through the three things that matter."

---

## Slide 11 — paymentMiddleware (35:30–42:00)

**Do:** Show the `app.use(paymentMiddleware(...))` block on screen.

**Say:** "Here's the middleware. It's from the `@x402/express` package.
It takes two arguments: a config object describing which routes are
paywalled and what they cost, and a resource server wrapping an HTTP
facilitator client."

"The config is declarative. I say: 'for GET /joke, I accept the exact
scheme on chain eip155:31611 — that's Mezo Testnet — paying mUSD to this
address.' That's it. The middleware generates the 402 responses, parses
incoming X-PAYMENT headers, calls the facilitator for verify and settle,
and injects X-PAYMENT-RESPONSE into successful responses. I never touch
any of that."

"The last line — `register(eip155:*, new ExactEvmScheme())` — tells the
middleware which schemes it knows how to handle. For us, that's the exact
EVM scheme on any EVM chain. Plug-and-play."

---

## Slide 12 — price config (42:00–48:00)

**Do:** Highlight the `price` block on screen.

**Say:** "Zoom in on the price. Amount is the string
'1000000000000000' — that's 10 to the 15, in wei. mUSD has 18 decimals, so
10-to-the-15-wei is 0.001 mUSD. Change that string, change your price."

"The `extra` block is Permit2 configuration. It tells the client's wallet
how to sign the authorization — which EIP-712 domain, which version,
whether EIP-2612 is supported. For mUSD on Mezo, you paste this block in
verbatim. That's it."

"If you wanted to charge a different asset — say, USDC on Base — you'd
change the asset address, change the network string, and change this extra
block. The merchant logic doesn't change. It's declarative."

---

## Slide 13 — route handler (48:00–55:00)

**Do:** Highlight the `app.get('/joke', ...)` handler.

**Say:** "And here's the actual route handler. It reads a JSON file, picks
a random joke, returns it. That's your API logic."

"What's important about this handler — and this is the thing I want you
to walk away understanding — is that **it only runs after the payment is
settled**. The middleware sits in front of it. If the request has no
X-PAYMENT header, the middleware returns 402 and this handler never
executes. If the request has a valid payment, the middleware verifies,
settles on-chain, and then — and only then — calls this handler."

"The payment *is* the access grant. There's no session. There's no auth
header. There's no user table. You paid 0.001 mUSD, you got a joke. You
want another joke, you pay again."

*(Pause for effect.)*

"This is a really different mental model from building APIs. Stop for a
second and let that sink in."

---

## Slide 14 — Your turn (55:00–65:00)

**Say:** "Three commands to build this yourself."

*(Read the three commands aloud slowly.)*

"Clone the repo. Install dependencies. Run dev. You now have a paywalled
API on your laptop, running against our hosted facilitator on Mezo
Testnet."

"Three things to change once you have it running:"

"One — change the jokes. Open `jokes.json`, replace the entries with
whatever your API actually returns. This is the trivial change."

"Two — change the price. Open `server.ts`, find the `amount` field, change
the number. Ten to the 14 is 0.0001 mUSD. Ten to the 16 is 0.01 mUSD. Pick
your price."

"Three — rename the route. Point it at your real business logic. Maybe
it's a chat completion, maybe it's a data query, maybe it's an image
render. Whatever it is, paywall it with one block of config."

"And then deploy it. It's just Express. Put it on Render, Fly, Railway,
your own VPS. The facilitator is public, so it works from anywhere."

**Pacing guard:** If you're past minute 63 here, drop the "three things
to change" and just read the three commands, then skip to slide 15.

---

## Slide 15 — Where to go next (65:00–68:00)

**Say:** "Here are the links. The repo is the main one — mezo-hack. Inside
the repo you'll find the three reference docs I mentioned: what-is-x402,
why-mezo, and architecture. The faucet is at faucet-dot-mezo-dot-org. The
facilitator is at facilitator-dot-vativ-dot-io. And if you want to dig into
the upstream x402 protocol, the canonical site is x402-dot-org."

"Take a picture of this slide if you need to."

*(Leave it up for ~15 seconds.)*

---

## Slide 16 — Agentic future (68:00–70:00)

**Say:** "I want to close with a thought about where this is going."

"The payment layer of the web was built assuming a human would be at the
other end. A human who could fill out a form, receive an email, enter a
credit card number, remember a password. That assumption is quietly
becoming wrong."

"AI agents are starting to call APIs on behalf of humans — booking travel,
researching code, buying things. And those agents don't have emails or
credit cards. They have wallets and HTTP clients. If the API they need to
call only accepts Stripe, the agent is stuck."

"x402 is how you unstick it. And on Mezo, that settlement happens on
Bitcoin — the most trustworthy money in crypto. You build the merchant,
you point at our facilitator, and your API is ready for the agentic web."

"That's the pitch. Build the merchant. Point at our facilitator. Ship."

---

## Slide 17 — Questions? (70:00–75:00)

**Say:** "I've got five minutes for questions. If you want to ask later,
the repo is on screen — github-dot-com-slash-ryanRfox-slash-mezo-hack. My
handle is on there too."

**Use:** [`qa.md`](qa.md) for anticipated questions and crisp answers.

**Hard stop at minute 75.** If you run out of time mid-answer, say:
"Ryan's handle is on the slide — DM me and I'll finish this answer in
text." Do not run over.

---

## Pacing cheat sheet (pin this on your second monitor)

```
0:00   slide 1    title
0:30   slide 2    hook
1:30   slide 3    problem
4:00   slide 4    402
6:00   slide 5    how x402 works ← longest non-demo slide
12:00  slide 6    Mezo + mUSD
18:00  slide 7    LIVE DEMO → browser/terminal
33:00  ← hard stop on live demo
35:00  slide 10   code walkthrough → editor
35:30  slide 11   paymentMiddleware
42:00  slide 12   price config
48:00  slide 13   route handler
55:00  slide 14   your turn
65:00  slide 15   where to go next
68:00  slide 16   agentic future
70:00  slide 17   Q&A
75:00  HARD STOP
```

If you're **5 min ahead** at any point: slow down on slide 5 (more
diagram detail) or slide 13 (emphasize the "payment is the access grant"
moment). Don't ramble on the opening.

If you're **5 min behind** at minute 30 (demo still happening): drop
repeat-pay beat, jump to code at minute 33.

If you're **5 min behind** at minute 50 (still in code): cut the "three
things to change" section on slide 14. Read the commands, skip to 15.

---

## See also

- [`plan.md`](plan.md) — audience profile, risk analysis, 4-day work plan
- [`demo-script.md`](demo-script.md) — full demo script with fallbacks
- [`pre-flight.md`](pre-flight.md) — pre-demo checklist
- [`qa.md`](qa.md) — anticipated audience questions
