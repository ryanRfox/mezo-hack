/**
 * Step 2: Add a paid endpoint using x402.
 *
 * /free  — still free, unchanged from step 1
 * /paid  — same jokes, but costs $0.001 mUSD on Mezo Testnet
 *
 * setup: cp .env.example .env → fill in PAYEE_ADDRESS with your Mezo testnet address
 * 
 * Run:  pnpm x402
 * Test: curl -i http://localhost:3000/free    → 200 (free)
 *       curl -i http://localhost:3000/paid    → 402 (payment required)
 */
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";
config();

const PORT = 3000;
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS as `0x${string}`;
if (!PAYEE_ADDRESS) {
  console.error("PAYEE_ADDRESS is required. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.test.mezo.org";

// x402 imports — this is everything you add to turn a free endpoint into a paid one
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaywall } from "@x402/paywall";
import { evmPaywall } from "@x402/paywall/evm";

// Set up x402 — facilitator, scheme, and browser paywall
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const scheme = new ExactEvmScheme();
const paywall = createPaywall()
  .withNetwork(evmPaywall)
  .withConfig({ appName: "Mezo x402 Joke API", testnet: true })
  .build();

const app = express();

// Paywall middleware — only /paid is paywalled, /free is untouched
app.use(
  paymentMiddleware(
    {
      "GET /paid": {
        accepts: {
          scheme: "exact",
          network: "eip155:31611",
          payTo: PAYEE_ADDRESS,
          price: "$0.001",
        },
        description: "Unlock a Bitcoin joke",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register("eip155:*", scheme),
    {},
    paywall,
  ),
);

// Landing page — shows both endpoints
app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Joke API (Free + Paid)</title>
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:4rem auto;text-align:center}
h1{font-size:1.5rem}p{color:#555;margin:1rem 0}a{color:#2563eb;font-size:1.1rem}
code{background:#f3f4f6;padding:.2rem .4rem;border-radius:4px;font-size:.9rem}
.free{color:#059669}.paid{color:#2563eb}</style></head>
<body><h1>Joke API</h1>
<p>Two endpoints. One free, one paywalled with x402.</p>
<p class="free"><a href="/free">GET /free</a> — free, no payment</p>
<p class="paid"><a href="/paid">GET /paid</a> — $0.001 mUSD on Mezo Testnet</p>
<p style="margin-top:2rem;font-size:.85rem;color:#999">
Try: <code>curl -i http://localhost:${PORT}/paid</code></p>
</body></html>`);
});

// /free — same as step 1, no changes
app.get("/free", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

// /paid — same logic as /free, but only runs after payment settles
app.get("/paid", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Joke API on http://localhost:${PORT}`);
  console.log(`  GET /free — no paywall`);
  console.log(`  GET /paid — $0.001 mUSD via x402 (→ ${PAYEE_ADDRESS})`);
});
