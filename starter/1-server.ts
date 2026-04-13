/**
 * Step 1: A free joke API — no paywall, no x402.
 *
 * Run:  pnpm demo:free
 * Test: curl http://localhost:3000/free
 */
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PORT = 3000;
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const app = express();

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Joke API (Free)</title>
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:4rem auto;text-align:center}
h1{font-size:1.5rem}p{color:#555;margin:1rem 0}a{color:#2563eb;font-size:1.1rem}
code{background:#f3f4f6;padding:.2rem .4rem;border-radius:4px;font-size:.9rem}</style></head>
<body><h1>Joke API</h1>
<p>One endpoint. Totally free.</p>
<p><a href="/free">GET /free</a> — returns a random Bitcoin joke</p>
<p style="margin-top:2rem;font-size:.85rem;color:#999">
Try: <code>curl http://localhost:${PORT}/free</code></p>
</body></html>`);
});

app.get("/free", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Joke API on http://localhost:${PORT} — GET /free (no paywall)`);
});
