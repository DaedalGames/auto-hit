# Pitch Q&A

The ten questions the judges are most likely to press, each with a one-line answer from a measurement in this repository. The questions come from six fresh, context-free model runs that read only this README and [BM.md](BM.md), one per judge lens (Jon Xu, Peter Shin, Daniel Park, Merlin Kafka, Lewis Blackwood, James Tan). The lenses used the six forcing questions of gstack's `/office-hours` (`office-hours/sections/phase-2a-startup-diagnostic.md` at gstack e077053, MIT) and the judges' roles and stated interests. Ordered by how many lenses asked.

| # | Question (asked by) | Answer |
| --- | --- | --- |
| 1 | Your PASS samples four frames, and your own capture failed at steps 6 and 8. Why trust it? (all six) | We checked every second step from 1 to 180: the final fix passes 89 of 91 frames, and only steps 6 and 8 miss, at 0.33% and 0.14% during the loading fade. The four steps were committed in [the route](../.coggs/depth-first-qa/quick3drpg.json) at 11:09, before Hit opened its PR at 11:37. |
| 2 | Who pays today? (Jon Xu, Peter Shin, Daniel Park, James Tan, Merlin Kafka) | Modules of COGGS Hit + COGGS Auto already run as LiveOps PoCs at game companies with 10M+ players, including Nexon and Krafton, at ₩15–25M a month, $11.5K to $19.2K ([BM.md](BM.md#traction), founder's statement of 2026-11-09). |
| 3 | Engine upgrades are rare. Why a subscription? (Jon Xu, Peter Shin, Daniel Park, James Tan) | Hit watches every dependency and store deadline, not one upgrade: Quick 3D RPG is 44 three.js releases behind ([issue #2](https://github.com/DaedalGames/auto-hit/issues/2)) and Crossy Road 63 ([issue #4](https://github.com/DaedalGames/auto-hit/issues/4)), and Firebase Test Lab itself shuts down on 2027-09-30. |
| 4 | Did Hit do it, or did you? (James Tan, Daniel Park, Lewis Blackwood) | Hit opened issues #2 and #4 and PRs #3 and #5 on its own; every attempt is a line in `hit/out/<pr>.jsonl`, and each fix commit must name its cause, evidence and source or Hit refuses it. |
| 5 | What does Auto catch that a code reviewer misses? (Lewis Blackwood, Merlin Kafka) | On [PR #3](https://github.com/DaedalGames/auto-hit/pull/3) gstack /review read the diff and could only guess; Auto played it and failed it. After the renames, 24.87% of pixels still differ, from an FBXLoader color change no diff line shows. |
| 6 | Can Hit game the oracle? (Merlin Kafka, Lewis Blackwood) | Hit may edit only the game folder: a change touching `.coggs/`, `auto/`, `hit/`, `tools/`, `brain/` or the workflow is refused, so the route, threshold and judge stay out of its reach. |
| 7 | What breaks first on a repository you have never seen? (Lewis Blackwood, Peter Shin) | The route: each game needs a route file of about 30 lines (canvas, seeds, inputs, capture steps). On Crossy Road, the second game, the upgraded head draws no canvas and throws `THREE is not defined` ([PR #5](https://github.com/DaedalGames/auto-hit/pull/5)); Auto reports that as a FAIL before anyone merges. |
| 8 | Is the brain memory or your own answer key? (James Tan, Peter Shin) | It is memory: `node tools/brain.mjs query "colors washed out after three upgrade"` returns the FBXLoader lesson first, and removing that lesson turns the test red. Game 2 is the measurement; its attempts to PASS land in `hit/out/5.jsonl`. |
| 9 | What can't a studio rebuild by Friday? (Peter Shin) | The harness, yes. The lesson brain, the game-domain ontology in [.coggs/ontology/](../.coggs/ontology) and the base and head frame history grow with every PR we play ([BM.md](BM.md#moat)). |
| 10 | Your business model is a simulation you wrote today. (Jon Xu, Daniel Park, Merlin Kafka) | Every price beside it is a cited page, every unmeasured value is a named range, and the first refutation is set: under 2% of free accounts that use all three fixes paying within 60 days moves the free tier or the Hobby price. |

## FAQ

**Why is the agent called Ping?** In games you ping a spot to call your teammates' attention, and ping is also network latency, the number every player blames. Both are what the agent does: it flags what broke and measures what drifted. It also sounds like pink, our brand color.

