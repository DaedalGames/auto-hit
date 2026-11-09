# COGGS Hit + COGGS Auto

Games rot when the engine under them moves. COGGS Hit opens the upgrade pull request and keeps the game shipped. COGGS Auto plays every pull request in CI and proves, frame by frame, that the game still looks and plays the same.

Built live at c0mpiled-17 Seoul (2026-11-09), track Self-Maintaining APIs.

## Run COGGS Auto

1. `npm ci && npx playwright install --only-shell chromium` installs the player and the three.js versions it serves locally.
2. `node auto/depth-first-qa.mjs --base . --head ../other-checkout --out out.local` replays every changed game under `games/` on both checkouts with the route in `.coggs/depth-first-qa/<game>.json`.
3. Add `--games quick3drpg` to play one game even when it did not change; `--base . --head .` must report 0% on every frame.
4. Read `out.local/verdict.json` and `out.local/comment.md`; frames and red diff images sit in `out.local/<game>/`. The exit code is 0 on PASS and 1 on FAIL.
5. In CI, `.github/workflows/coggs-auto.yml` does the same on every pull request and Daedal Ping posts the comment.
