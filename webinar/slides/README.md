# Slide Deck

17-slide Marp deck for the 75-minute x402 + mUSD on Mezo webinar.

## Render locally

Install Marp CLI once:

```bash
brew install marp-cli   # macOS
# or: npm install -g @marp-team/marp-cli
```

Then render:

```bash
# Preview in browser (auto-reloads)
marp --server deck.md

# Export static HTML
marp deck.md -o deck.html

# Export PDF
marp deck.md --pdf -o deck.pdf

# Export PowerPoint (editable)
marp deck.md --pptx -o deck.pptx
```

## Render in VS Code

Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode)
extension. Open `deck.md` and click the preview icon — instant side-by-side
preview with slide navigation.

## Structure

| # | Slide | Time budget |
|---|---|---|
| 1 | Title | 0:00–0:30 |
| 2 | Hook — $20/mo vs $0.001/call | 0:30–1:30 |
| 3 | The problem | 1:30–4:00 |
| 4 | HTTP 402 (1996) | 4:00–6:00 |
| 5 | How x402 works (diagram) | 6:00–12:00 |
| 6 | Mezo + mUSD | 12:00–18:00 |
| 7 | LIVE DEMO title | 18:00–18:30 |
| 8 | humor-usw3.vativ.io | 18:30–19:00 |
| 9 | Follow along | 19:00–35:00 |
| 10 | CODE WALKTHROUGH title | 35:00–35:30 |
| 11 | paymentMiddleware | 35:30–42:00 |
| 12 | price config | 42:00–48:00 |
| 13 | route handler | 48:00–55:00 |
| 14 | Your turn | 55:00–65:00 |
| 15 | Where to go next | 65:00–68:00 |
| 16 | Agentic future | 68:00–70:00 |
| 17 | Q&A | 70:00–75:00 |

## Editing notes

- **Speaker notes**: add HTML comments like `<!-- speaker notes here -->`
  below each slide. They appear in presenter mode but not on the rendered
  slide.
- **Code blocks**: the starter code on slides 11–13 is lifted verbatim from
  `../../starter/server.ts`. If the starter changes, update the slides.
- **Hosted demo URL**: slide 8 and 9 reference `humor-usw3.vativ.io`. The
  pre-flight checklist verifies the fleet is healthy before the talk.
