# gstack, project-local

gstack (garrytan/gstack, MIT) is never installed for this repository. Its `./setup` registers hooks in `~/.claude/settings.json` and writes state to `~/.gstack`, both outside this repository. Instead its skill files are read from a pinned checkout, `garrytan/gstack` at `e077053c3cbb9b3539d0e7801b7f5f904e88fed5` (1.98.0.0).

| gstack file | Where it runs here |
| --- | --- |
| `review/SKILL.md` | `tools/review.mjs` reads every upgrade PR with it and posts the code-review comment ([.coggs/review/](../review/README.md)) |
| `office-hours/sections/phase-2a-startup-diagnostic.md` | The six forcing questions behind the judge lenses of [docs/PITCH-QA.md](../../docs/PITCH-QA.md) |
| `plan-ceo-review/sections/review-sections.md` | The CRITICAL GAP, WARNING and OK words the same lenses score with |
| `learn/SKILL.md`, `USING_GBRAIN_WITH_GSTACK.md` | The lesson shape of [brain/lessons/](../../brain/lessons): gbrain (garrytan/gbrain, MIT, `15e3ab8`) indexes it through [tools/brain.mjs](../../tools/brain.mjs), with its home in `brain/.gbrain`, never `~/.gbrain` |

Not used: `browse`, `qa` and `benchmark` give no seeded, frozen-clock replay, and COGGS Auto's verdict depends on one; `canary` and `land-and-deploy` wait until the games deploy; `investigate` was retired upstream in ef99eb5.

