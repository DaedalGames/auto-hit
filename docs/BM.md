# Business model

COGGS Hit keeps a shipped game alive when its engine moves: it opens the upgrade pull request and pushes fixes. COGGS Auto plays that pull request in CI, compares frames against the base branch and posts the verdict. We sell the fix. The play is free, because it runs in the customer's own GitHub Actions. And every fix becomes a lesson in a memory the next game reads first.

## Launch package

| Plan | Price a month | Hit fixes a month | Repositories | What it adds |
| --- | --- | --- | --- | --- |
| Free | $0 | 3, once | Public only | Unlimited Auto plays on public repositories, Hit fixes drawn from the shared lesson brain |
| Hobby | $79 | 5 | 1 private | Private repository, single-fix top-ups at $19 |
| Pro | $249 | 15 | 3 | Hit watches engine releases and store deadlines and opens the PR unasked; a private brain of the studio's own solved causes |
| Heavy | $499 | 25 | 10 | The same for a studio running a catalog |
| Studio contract | from $2,500, yearly | 200 | 50 | Engine and platform ports, consoles and SDK deadlines under contract, with a named engineer |

A fix is one COGGS Hit attempt: one coding-agent run that edits the game and pushes, after which Auto plays it. A top-up fix costs $19 on every paid plan. There is no yearly discount at launch; the Studio contract is yearly by nature. Tier names follow the COGGS ladder (Free, Hobby, Pro, Heavy), and the studio offer is a contract rather than a self-serve tier, as COGGS keeps it.

## Why this shape

**The play is free, and the market says so.** Every tool a game team already runs on a pull request gives public code away. CodeRabbit reviews public repositories free forever [coderabbit-pricing]. Greptile is free for qualified non-commercial OSI-licensed projects [greptile-pricing]. Renovate's CLI and hosted Community edition are free [mend-renovate-pricing]. Dependabot runs on GitHub-hosted runners without counting against included Actions minutes [github-dependabot-actions-minutes]. Auto costs us nothing to give away, because standard GitHub-hosted runners are free in public repositories [github-actions-billing]. A free public tier is the funnel: open-source web games are where the lesson brain fills fastest.

**We sell the fix, not the seat.** Reviewers price per developer: CodeRabbit Essentials, Team and Advanced are $24, $48 and $72 per user a month, billed annually [coderabbit-pricing]. Game QA prices per device or per test node: AWS Device Farm $0.17 a device minute or $250 a device slot a month [aws-device-farm-pricing], Firebase Test Lab $1 a virtual and $5 a physical device hour [firebase-pricing], nunu.ai $200 a month for 20,000 credits ("up to ~40 h of agent work") [nunu-ai-pricing], GameDriver $200 or $400 a node a month with five nodes minimum, billed annually [gamedriver-pricing-www2]. modl.ai and Regression Games publish no price and sell through demos [modl-ai-home, regression-games-home]. None of them ships the upgrade. A seat price would charge a solo maintainer as much as a studio; a fix price follows the work, and our cost sits in the agent run.

**The cost floor is one agent run.** One 20-minute COGGS harness run cost $2.41 at its measured median (daedal-games PRICING.md). The model ranges a fix from $0.50 to $5, with a 5% to 30% rerun share on top. At that worst case every paid tier still covers its full quota (the run's unit check lists none of the launch tiers), and the model puts the paid gross margin at 78% to 81% (model estimate).

**Firebase Test Lab is closing.** Google has deprecated it and will shut it down on September 30, 2027 [firebase-test-lab-usage-quotas]. Teams on its game loop tests will need a replacement within the year.

## Moat

A competitor can rebuild the replay harness in a week. Three other things compound with every customer, and each one sits in this repository.

- **The lesson brain.** Every cause Hit solves becomes a lesson in [brain/lessons/](../brain/lessons), indexed by gbrain ([tools/brain.mjs](../tools/brain.mjs)), and Hit queries it before its next fix. The first game left four measured three.js r118 to r162 causes; the FBXLoader one took the frame diff from 24.87% to 0.020%. Public repositories fill the shared brain; paid studios keep a private brain on top of it, which is what the cancel screen shows them losing.
- **The game-domain ontology.** Hit and Auto read the game the way a game team does: engine, renderer, loaders, assets, input, the route a player takes. Daedal Games' game-domain ontology is distilled into [.coggs/ontology/](../.coggs/ontology), so a new game is mapped onto known parts before the first fix. A code reviewer reads files; we read a game.
- **The verdict history.** Every PR Auto plays leaves base and head frames with the same seed. That record of what changed on screen, upgrade by upgrade and engine by engine, is data no code reviewer and no device farm collects.

## What the simulation kept

Twelve packages ran through `pricing-sim` on [docs/bm/model.mjs](bm/model.mjs) (six buyer segments from open-source maintainer to web game portal, 400 worlds a run, two seeds, and a calibration shift). The launch package above is `final` in the model. Every number in this section is a model estimate under the model's ranges.

| Decision | Result across worlds | Kept |
| --- | --- | --- |
| Higher ladder ($79 / $249 / $499 / $2,500) against $49 / $149 / $249 / $1,500 | Higher wins on profit in 78% of worlds; median regret 0 | Yes |
| Studio contract tier | Raises profit in over 99% of worlds on both seeds | Yes |
| Single-fix top-ups | $12 top-ups on the lower ladder raise profit in over 99% of worlds; $19 top-ups with the decoy, cancel screen and yearly plan removed beat the plain higher ladder in over 99% | Yes, at $19 |
| Free tier gives 3 fixes, not plays alone | Plays-only free loses in 96% of worlds | Yes |
| 3 free fixes once, not monthly | Monthly loses in every world | Yes |
| 14-day trial | Lifts conversion about 3 points but loses profit in every world | No |
| 20% yearly plan | Loses in about 80% of worlds | No |
| Price per repository ($29 a repo) | Loses in 92% of worlds on both seeds, 62% with conversion shifted down | No |
| Sell Auto alone at $24 a seat | Loses in every world | No |

`final` and its yearly variant hold the top two places in all three runs. `final` has the lowest median regret (0) and wins the most worlds (65% to 69%); the yearly variant has the lower worst-case regret on seed 20261109 and in the calibration run, and `final` ranks first on seed 20261110. The tie breaks against the yearly plan because it loses profit in about 80% of worlds. The winner moves most with willingness to pay (Spearman 0.46 to 0.80), then the signup lift from free fixes, then the cost of a fix.

The prices sit above the COGGS maker ladder (Hobby $49, Pro $149, Heavy $249 in daedal-games PRICING.md) under the same names. A maker buys games; a studio buys a shipped game that keeps shipping, and the simulation's buyers pay more for that.

## Predictions the first data can refute

Free-to-paid conversion is where the model is weakest. It lands between 6.9% and 14.5% at the median across the runs, and no saved source gives a developer-tool benchmark to calibrate it. So the first measurement checks it before anything else: if fewer than 2% of free accounts that used all three fixes pay within 60 days, the free allowance or the Hobby price moves, and the model reruns with the measured value. The calibration arm randomizes new public signups between three free fixes and plays-only free.

## Run record

- Engine: LilMSkills `pricing-sim` `scripts/sim.mjs`, sha256 `c3e1633d81b4c11446da9d87374721c49c81b19348ddff2e56b61978336462a9`. It was written before today, so it stays outside this repository; the model file is the part written for this product.
- Runs: seed 20261109 (output sha256 `fc8f9ef8...`), seed 20261110 (`11f2765a...`), seed 20261109 with `--shift asc=3` (`1bbfab38...`), all 400 worlds.
- Ladder check: every launch tier clears the free allowance and the rung below.

## Sources

Every price above was read on 2026-11-09 between 02:15 and 02:20 UTC, from the page named here.

| Source | Page | What it says |
| --- | --- | --- |
| coderabbit-pricing | https://www.coderabbit.ai/pricing | $24, $48, $72 per user a month billed annually; public repositories free forever; usage reviews at $0.25 a file |
| greptile-pricing | https://www.greptile.com/pricing | 50 free credits a month, then $1 a credit; free for qualified non-commercial OSI-licensed projects |
| mend-renovate-pricing | https://www.mend.io/renovate/ | Renovate CLI and Community edition free |
| github-dependabot-actions-minutes | https://docs.github.com/en/code-security/dependabot/working-with-dependabot/about-dependabot-on-github-actions-runners | Dependabot on standard runners does not count towards included Actions minutes |
| github-actions-billing | https://docs.github.com/en/billing/concepts/product-billing/github-actions | Standard hosted runners free in public repositories; $0.006 a Linux minute |
| aws-device-farm-pricing | https://aws.amazon.com/device-farm/pricing/ | $0.17 a device minute; unmetered $250 a device slot a month |
| firebase-pricing | https://firebase.google.com/pricing | Test Lab virtual devices $1 a device hour, physical $5, after the no-cost daily minutes |
| firebase-test-lab-usage-quotas | https://firebase.google.com/docs/test-lab/usage-quotas-pricing | Test Lab is deprecated and shuts down on September 30, 2027 |
| nunu-ai-pricing | https://nunu.ai/pricing | $0 with 2,000 one-time credits; $200 a month for 20,000 credits; persistent device $500 a month |
| gamedriver-pricing-www2 | https://www2.gamedriver.io/en-us/pricing | Starter from 5 nodes at $200 a node a month, Growth $400, Advanced $267, billed annually |
| modl-ai-home | https://modl.ai/ | No public price; "Book a Demo" (the /pricing page answers 404) |
| regression-games-home | https://regression.gg/ | No public price; "Book a Demo" (the /pricing page answers 404) |

