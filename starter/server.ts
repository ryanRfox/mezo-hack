import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { config } from "dotenv";
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

config();

const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS as `0x${string}`;
if (!PAYEE_ADDRESS) {
  console.error("PAYEE_ADDRESS is required. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3000);
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.vativ.io";
// SHIM: Mezo Testnet (eip155:31611) is not in @x402/evm@2.9.0's DEFAULT_STABLECOINS
// registry. Restored upstream in x402-foundation/x402 PR #1920 but not yet published.
// When @x402/evm >= 2.10.0 ships, drop this constant — ExactEvmScheme will resolve
// mUSD from the registry automatically and new x402ResourceServer(...) will register
// it via `register("eip155:*", new ExactEvmScheme())` without a hardcoded address.
const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const app = express();

const paywallHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Required — Mezo x402 Starter</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f5f5f7;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:1rem}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:480px;width:100%;padding:2.5rem}
h1{font-size:1.1rem;color:#666;font-weight:500;letter-spacing:.05em;text-transform:uppercase;margin-bottom:1.5rem}
.price{font-size:2.5rem;font-weight:700;color:#1a1a2e;margin-bottom:.25rem}
.asset{color:#888;font-size:.9rem;margin-bottom:2rem}
.section{margin-bottom:1.5rem}
.label{font-size:.75rem;color:#999;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem}
pre{background:#1a1a2e;color:#e0e0e0;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.85rem;line-height:1.5}
a{color:#5b21b6;text-decoration:none;font-weight:500}
a:hover{text-decoration:underline}
.links{display:flex;flex-direction:column;gap:.5rem;font-size:.9rem}
.badge{display:inline-block;background:#5b21b6;color:#fff;font-size:.7rem;padding:.2rem .6rem;border-radius:99px;vertical-align:middle;margin-left:.5rem}
</style></head><body><div class="card">
<h1>402 Payment Required</h1>
<div class="price">0.001 mUSD</div>
<div class="asset">Mezo Testnet · Permit2 · per request</div>
<div class="section"><div class="label">Try it with curl</div>
<pre>curl -i http://localhost:${PORT}/joke</pre></div>
<div class="section"><div class="label">Or try the live demo with a wallet</div>
<div class="links">
<a href="https://humor-usw3.vativ.io" target="_blank">humor-usw3.vativ.io<span class="badge">Live</span></a>
<a href="https://faucet.mezo.org" target="_blank">Get free testnet mUSD</a>
<a href="https://explorer.test.mezo.org" target="_blank">Mezo Testnet Explorer</a>
</div></div>
<div class="section"><div class="label">Paying to</div>
<pre style="font-size:.75rem;word-break:break-all">${PAYEE_ADDRESS}</pre></div>
</div></body></html>`;

app.use(
  paymentMiddleware(
    {
      "GET /joke": {
        accepts: {
          scheme: "exact",
          network: "eip155:31611",
          payTo: PAYEE_ADDRESS,
          price: {
            amount: "1000000000000000", // 0.001 mUSD (18 decimals)
            asset: MUSD_ADDRESS,
            extra: {
              name: "Mezo USD",
              version: "1",
              decimals: 18,
              assetTransferMethod: "permit2",
              supportsEip2612: true,
            },
          },
          maxTimeoutSeconds: 300,
        },
        description: "Unlock a Bitcoin joke",
        mimeType: "application/json",
        customPaywallHtml: paywallHtml,
      },
    },
    new x402ResourceServer(facilitatorClient).register("eip155:*", new ExactEvmScheme()),
  ),
);

app.get("/", (_req, res) => {
  res.type("text/plain").send(
    `Mezo x402 starter is running.\n\n` +
      `This demo is curl-only. Try:\n` +
      `  curl -i http://localhost:${PORT}/joke\n\n` +
      `For the browser wallet flow, see https://humor-usw3.vativ.io\n`,
  );
});

app.get("/joke", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Mezo x402 starter on http://localhost:${PORT} — GET /joke (0.001 mUSD → ${PAYEE_ADDRESS})`);
});
