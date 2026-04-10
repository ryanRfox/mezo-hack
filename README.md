# mezo-hack

> **Status:** Under construction. Webinar Tuesday morning.

x402 + mUSD on Mezo Testnet — webinar starter, reference docs, and live demo materials.

## What's here

```
mezo-hack/
├── starter/      # Minimal merchant — clone, install, run
├── docs/         # what-is-x402, why-mezo, architecture
└── webinar/      # Slides, speaker notes, demo script, pre-flight checklist
```

## Quick start (after Tuesday)

```bash
git clone https://github.com/ryanRfox/mezo-hack.git
cd mezo-hack/starter
pnpm install
cp .env.example .env  # add your wallet address
pnpm dev
curl http://localhost:3000/joke  # → 402 Payment Required
```

The starter is ~50 lines of TypeScript using `@x402/express`. It runs against the Mezo Testnet facilitator at `https://facilitator.test.mezo.org`. You don't need to run a facilitator — we provide one.

## Webinar materials

- `webinar/slides/` — Slide deck source
- `webinar/speaker-notes.md` — Talking points with minute anchors
- `webinar/demo-script.md` — Step-by-step live demo path with fallbacks
- `webinar/pre-flight.md` — 30-minute pre-webinar checklist
- `webinar/qa.md` — Anticipated Q&A

## Reference docs

- `docs/what-is-x402.md` — The protocol in 300 words
- `docs/why-mezo.md` — Why mUSD on Mezo for x402
- `docs/architecture.md` — Full request flow with sequence diagram

## License

MIT
