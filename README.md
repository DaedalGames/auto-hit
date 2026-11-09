# COGGS Hit + COGGS Auto

Games rot when the engine under them moves. COGGS Hit opens the upgrade pull request and keeps the game shipped. COGGS Auto plays every pull request in CI and proves, frame by frame, that the game still looks and plays the same.

Built live at c0mpiled-17 Seoul (2026-11-09), track Self-Maintaining APIs.

## Run COGGS Auto

1. `npm ci && npx playwright install --only-shell chromium` installs the player and the three.js versions it serves locally.
2. `node auto/depth-first-qa.mjs --base . --head ../other-checkout --out out.local` replays every changed game under `games/` on both checkouts with the route in `.coggs/depth-first-qa/<game>.json`.
3. Add `--games quick3drpg` to play one game even when it did not change; `--base . --head .` must report 0% on every frame.
4. Read `out.local/verdict.json` and `out.local/comment.md`; frames and red diff images sit in `out.local/<game>/`. The exit code is 0 on PASS and 1 on FAIL.
5. In CI, `.github/workflows/coggs-auto.yml` does the same on every pull request and Daedal Ping posts the comment.

## COGGS Hit

COGGS Hit runs on the maintainer's machine with the signed-in `claude` CLI and acts through local `git` and `gh`, so every push starts COGGS Auto like any human push. One run takes one game in this repository from an old engine version to a new one:

```sh
node hit/run.mjs --game games/quick3drpg --dep three --from 0.118.1 --to 0.162.0 --no-brain
```

1. It files an issue, labelled `dependencies`, saying how many releases the game is behind, with the migration guide entries that touch APIs the game uses.
2. It opens the pull request that fixes the issue (`Fixes #n`); its first commit changes only the version strings.
3. Each COGGS Auto FAIL on the head commit starts one `claude -p` call (10 minute limit) that follows [.coggs/hit.md](.coggs/hit.md), reads the verdict and the guide in [.coggs/guides/](.coggs/guides/), may edit only the game folder, and must leave exactly one `fix(hit): <cause>` commit with `Evidence:` and `Source:` lines. A call that breaks those rules is undone.
4. One COGGS Hit status comment on the pull request is edited in place after every step.
5. On PASS it squash-merges as `<title> (#n)`, which closes the issue, deletes the branch and reads the link back. After three fixes without PASS it labels the pull request `needs-human` instead.

Every step is a line in `hit/out/<pr>.jsonl`, including attempts to PASS. Without `--no-brain`, Hit asks `tools/brain.mjs` for causes found in earlier games before each fix and adds one lesson per fix commit after PASS. `--pr <n>` resumes an open pull request, and `node hit/guide.mjs --dep three --from <v> --to <v>` refetches a guide from the three.js wiki.
