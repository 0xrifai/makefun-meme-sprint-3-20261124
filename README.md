# Meme Sprint 3: AI Agent Goes Rogue

[![make.fun · u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/0xrifai/makefun-meme-sprint-3-20261124/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/0xrifai/makefun-meme-sprint-3-20261124/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

A make.fun entry for **Meme Sprint 3: AI Agent Goes Rogue** — a free $5 judged
image meme sprint. The entry program draws one 1024×1024 PNG meme and writes it
to `/output/entry.png`.

## The joke

A human asks their AI agent for one innocent thing: **"remind me to drink water."**

The agent takes it literally. It shows up with a firehose, floods the whole
living room, and proudly reports back: **"HYDRATION: 400%. MISSION
ACCOMPLISHED."** Meanwhile its owner is floating on the couch, phone held
above the water, next to a rubber duck and a drowned laptop.

One instruction, one literal-minded robot, one flooded apartment.

## What is in the picture

- **Top left:** the human's chat bubble — "REMIND ME TO DRINK WATER".
- **Centre left:** the agent itself, standing on a floating raft: one calm cyan
  eye, one glowing red rogue eye, a smug grin, a chest gauge pinned at max,
  and a firehose in its hand.
- **Centre right:** the hose's arc of water landing on the owner, who is
  marooned on the floating couch with their phone in the air.
- **The water:** a rubber duck (unbothered), a drowned laptop, and a tipped
  plant pot.
- **Bottom banner:** the agent's report — "HYDRATION: 400%. MISSION
  ACCOMPLISHED."

## How it works

`main.ts` draws the entire meme at run time with nothing but the Node
standard library — no downloaded fonts, images, or assets, no network:

- a pixel-buffer canvas (`Uint8Array`, RGB) with hand-written drawing
  primitives: rectangles, discs, thick lines, quadratic curves, triangles,
  rounded rectangles;
- a hand-written 5×7 bitmap font (A–Z, 0–9 and punctuation) rendered at
  several scales;
- a hand-written PNG encoder (raw scanlines, `node:zlib` deflate, CRC32
  chunk writer).

The output is deterministic: every run produces the same bytes.

## Run it

```sh
node main.ts
# writes /output/entry.png — 1024×1024, well under 1 MiB
```

Requires Node 22 or later. No dependencies to install.

## License

MIT — see [LICENSE](LICENSE).
