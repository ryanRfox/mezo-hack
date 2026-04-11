# Pre-flight Checklist

**Run this checklist starting 30 minutes before going live.** Every item is
blocking — if something fails, you have time to fix it or switch to a
fallback. If you're running it at 15 minutes out and something's broken,
you're going to talk through the code walkthrough instead of doing the live
demo. Plan accordingly.

**Timestamp format below:** `T-Nm` means "N minutes before talk start."

---

## T-30m — Fleet health

Verify all three facilitator VMs respond and the load balancer is healthy.

- [ ] **USW3** (primary) responds:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://facilitator.vativ.io/
  # expect: 200 or 404 (anything non-5xx; root path has no handler)
  ```
- [ ] **USE1** responds:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://facilitator-use1.vativ.io/
  ```
- [ ] **EUW1** responds:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://facilitator-euw1.vativ.io/
  ```
- [ ] Load balancer round-trip latency < 500ms:
  ```bash
  time curl -s https://facilitator.vativ.io/ > /dev/null
  ```
- [ ] Humor server fleet (the demo target) serves /joke with 402:
  ```bash
  curl -s -i https://humor-usw3.vativ.io/joke | head -1
  # expect: HTTP/2 402
  ```

**If any VM is unhealthy:** Park the node in the load balancer (AWS console
or `gt dolt status`-style procedure — see the facilitator/ops runbook).
Talk can still proceed with 2/3 VMs; Cloudflare handles failover.

**If the humor server is down:** Blocker. Restart it via the deploy script
(`facilitator/deploy.sh` or similar). If the restart takes more than 10
minutes, switch to fallback F4 (skip live demo).

---

## T-25m — Facilitator gas balance

Each facilitator VM pays gas on behalf of merchants. If gas runs out,
settlement fails with an opaque 500 — the worst failure mode for a demo.

- [ ] Check each VM's facilitator wallet has ≥ 0.005 BTC (testnet):
  ```bash
  # Check via explorer or RPC — script is in ops/check-gas.sh
  for vm in usw3 use1 euw1; do
    echo -n "$vm: "
    curl -s "https://rpc.test.mezo.org" \
      -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$FACILITATOR_ADDR'","latest"],"id":1}' \
      | jq -r .result
  done
  ```
- [ ] Top up any VM below threshold from the ops faucet account.

---

## T-20m — Demo wallet funding

The wallet you'll use during the live demo must be ready to sign and pay.

- [ ] Open wallet (MetaMask or Rabby), confirm it's on **Mezo Testnet**
      (chain 31611)
- [ ] Balance check: **≥ 0.1 mUSD**
  - 0.1 mUSD covers 10 demo payments at 0.01 each — plenty for one failed
    attempt plus the live run plus the repeat-pay beat
- [ ] Balance check: **≥ 0.001 BTC** (testnet) for gas headroom
- [ ] If low: top up from [faucet.mezo.org](https://faucet.mezo.org)
  - Faucet limit is typically 10 mUSD per address per day. If hit, use
    the backup wallet (address in `~/.config/mezo-hack/demo-wallets.txt`,
    access via 1Password).

---

## T-15m — End-to-end curl test

Run the full paid flow from the command line to prove the whole pipeline
works. This is the single most important check — if it passes, the demo
will work.

- [ ] Paid curl test using `@x402/fetch`:
  ```bash
  cd ~/gt/mezo/crew/fox/mezo-hack/starter
  npx tsx scripts/paid-curl.ts https://humor-usw3.vativ.io/joke
  # expect: { "setup": "...", "punchline": "..." } + tx hash in X-PAYMENT-RESPONSE
  ```
  (If `scripts/paid-curl.ts` doesn't exist yet, use the humor server's own
  client smoke test: `demo/client.ts --fast` from the main repo.)
- [ ] Verify the tx hash appears on
      [explorer.test.mezo.org](https://explorer.test.mezo.org) as a
      successful Permit2 transfer

**If the curl test fails:** Check in order — facilitator health (step
T-30m), gas (T-25m), wallet balance (T-20m). If all pass and settlement
still fails, the issue is likely in `@x402/paywall` or the humor server's
x402 middleware — switch to fallback F4.

---

## T-10m — Browser + presentation setup

- [ ] Fresh Chrome/Brave profile opened, zoom at **125%**, no extensions
      except the wallet
- [ ] Three tabs open, left to right:
  1. `https://humor-usw3.vativ.io`
  2. `https://explorer.test.mezo.org/address/<demo-wallet-address>`
  3. Terminal with `curl -i https://humor-usw3.vativ.io/joke` pre-typed
- [ ] Editor tab (VS Code or similar) with `mezo-hack/starter/server.ts`
      open and font size ≥ 18pt
- [ ] Slide deck opened in presenter mode (`marp --server deck.md` or
      VS Code Marp preview)
- [ ] Presenter monitor: speaker notes visible. Audience monitor: slides
      only.
- [ ] Terminal font size bumped to **18pt** for back-row visibility

---

## T-8m — Wallet pre-warming

The first Permit2 sign of the day can be slow if the wallet needs to fetch
the token metadata. Pre-warm it.

- [ ] In the browser, go to `humor-usw3.vativ.io`
- [ ] Click **Connect Wallet**, sign-in to the wallet
- [ ] Click **Pay and unlock** — take the full happy path
- [ ] Verify you got a joke + tx hash
- [ ] **Refresh the page** so the paywall is showing again when you start
      the real demo
- [ ] Confirm the wallet is still connected and on Mezo Testnet

**Why:** This primes all the client-side caches (token metadata, chain
config, wallet connection state) so the live demo round trip is 2 seconds
instead of 8.

---

## T-5m — Network + backup

- [ ] Primary network: wired Ethernet OR known-good WiFi
- [ ] **Phone hotspot configured and tethered as backup** (not active, just
      available — one click to switch)
- [ ] Verify: if primary fails mid-demo, you can swap to hotspot in < 30
      seconds. Practice this once before going live.
- [ ] Do Not Disturb enabled on laptop (no Slack pings on screen share)
- [ ] Close Slack, email, calendar, chat apps

---

## T-3m — Open the deck

- [ ] Slide 1 up on the shared screen
- [ ] Speaker notes on presenter display
- [ ] Microphone test — audible, no echo
- [ ] Webcam framed (if on camera)
- [ ] Deep breath

---

## T-0 — Go

**Open strong.** No throat-clearing. No "um, can you hear me." Your first
line is on slide 1 of the speaker notes. Say it.

---

## Abort criteria (break glass)

If at **T-5m** any of these are true, skip the live demo entirely and go to
fallback F4 (code walkthrough only):

- Fleet has < 2 of 3 VMs healthy AND load balancer is failing over
- Facilitator gas is below 0.002 BTC on the primary VM and top-up isn't
  possible in time
- Demo wallet is below 0.02 mUSD (not enough for even one attempt)
- Humor server returns anything other than 402 on an unpaid curl test
- End-to-end paid curl test returns 500 twice in a row

**Don't** try to fix something under 5 minutes of pressure. Switch to the
fallback cleanly, narrate "we're going to skip the live demo today and go
deep on the code instead," and run the code walkthrough for 17 minutes
(slides 10–13) at a more leisurely pace.

---

## See also

- [`demo-script.md`](demo-script.md) — full demo script with in-flight
  fallbacks F1–F4
- [`speaker-notes.md`](speaker-notes.md) — slide-by-slide narration with
  minute anchors
- [`plan.md`](plan.md) — audience profile and risk analysis
