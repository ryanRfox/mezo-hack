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
const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const app = express();

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
              assetTransferMethod: "permit2",
              supportsEip2612: true,
            },
          },
          maxTimeoutSeconds: 300,
        },
        description: "Unlock a Bitcoin joke",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register("eip155:*", new ExactEvmScheme()),
  ),
);

app.get("/joke", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Mezo x402 starter on :${PORT} — GET /joke (0.001 mUSD → ${PAYEE_ADDRESS})`);
});
