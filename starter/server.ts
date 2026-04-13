import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createPaywall } from "@x402/paywall";
import { evmPaywall } from "@x402/paywall/evm";
import { config } from "dotenv";
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
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const scheme = new ExactEvmScheme();
const paywall = createPaywall()
  .withNetwork(evmPaywall)
  .withConfig({ appName: "Mezo x402 Starter", testnet: true })
  .build();

const app = express();

app.use(
  paymentMiddleware(
    {
      "GET /joke": {
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
    undefined,
    paywall,
  ),
);

app.get("/", (_req, res) => {
  res.redirect("/joke");
});

app.get("/joke", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Mezo x402 starter on http://localhost:${PORT} — GET /joke ($0.001 mUSD → ${PAYEE_ADDRESS})`);
});
