# COGGS Hit + COGGS Auto, c0mpiled-17 finals live pitch

The finals script for [auto-hit-deck.html](./auto-hit-deck.html), read live in English by Bran Lee. The judges first decide from a 90-second video, which is a separate cut; this is what he says on stage after it. One sentence per line, short words, the Korean under each line for rehearsal only. Timed at 150 words a minute and at 120, the pace he rehearses to. Press the right arrow to move on, N to show the notes, Esc for the overview.

## The pitch (14 lines, 202 words, about 81 seconds at 150 words a minute; about 101 at 120)

> 1. "Games rot."
>    게임은 썩습니다.
>
> 2. "I'm Bran Lee from Daedal Games, and these are COGGS Hit and COGGS Auto."
>    저는 다이달게임즈의 브랜 리이고, 이것이 COGGS Hit와 COGGS Auto입니다.
>
> 3. "When a game engine moves on, the game goes black, and code review can't see it."
>    게임 엔진이 버전을 올리면 게임 화면이 까맣게 되는데, 코드 리뷰로는 그게 안 보입니다.
>
> 4. "No tool in games upgrades the engine and proves the game still plays the same."
>    엔진을 올리고 게임이 똑같이 돌아가는지 증명해 주는 도구는 게임 업계에 아직 없습니다.
>
> 5. "Nexon and Krafton already run parts of this as LiveOps pilots, at eleven to nineteen thousand dollars a month."
>    넥슨과 크래프톤이 이미 이것의 일부를 라이브옵스 PoC로 돌리고 있고, 월 1만 1천~1만 9천 달러입니다.
>
> 6. "COGGS Hit writes the upgrade pull request and pushes the fixes."
>    COGGS Hit는 업그레이드 PR을 쓰고 수정을 푸시합니다.
>
> 7. "COGGS Auto plays the old game and the new game, frame by frame, and posts the verdict."
>    COGGS Auto는 옛 게임과 새 게임을 프레임 단위로 플레이해 보고 판정을 올립니다.
>
> 8. "Auto never writes game code. Hit never touches the verdict."
>    Auto는 게임 코드를 절대 쓰지 않고, Hit는 판정에 절대 손대지 않습니다.
>
> 9. "The version bump was black. Then seventy-five percent of pixels differed, then twenty-five, then zero point zero two. Pass."
>    버전만 올리면 까만 화면. 그다음 픽셀 75% 다름, 그다음 25%, 그다음 0.02%. 통과.
>
> 10. "Today, on two real pull requests, Hit upgraded both games, Auto passed both, and we merged both."
>    오늘 실제 PR 두 개에서 Hit가 두 게임을 모두 올렸고, Auto가 둘 다 통과시켰고, 둘 다 머지했습니다.
>
> 11. "Play it twice and zero pixels change, and every fix becomes a lesson the next game reads first."
>    두 번 돌려도 픽셀이 하나도 안 바뀌고, 모든 수정은 다음 게임이 먼저 읽는 교훈이 됩니다.
>
> 12. "Public repos are free, teams pay seventy-nine to four ninety-nine a month, and a live title is fifteen thousand."
>    공개 저장소는 무료, 팀은 월 79~499달러, 라이브 타이틀 하나는 월 1만 5천 달러입니다.
>
> 13. "We built it on Garry Tan's gstack review and gbrain memory."
>    개리 탄의 gstack 리뷰와 gbrain 메모리 위에 만들었습니다.
>
> 14. "CodeRabbit reads your code. COGGS Auto plays your game. COGGS Hit keeps it alive."
>    CodeRabbit은 코드를 읽습니다. COGGS Auto는 게임을 플레이합니다. COGGS Hit는 게임을 살려 둡니다.

If the slot is only 45 seconds, say lines 1, 3, 5, 6, 7, 9, 10 and 14.

| Lines | Slide | At 150 words a minute | At 120 |
| --- | --- | --- | --- |
| 1 to 2 | 01 Cover | 0:00 to 0:06 | 0:00 to 0:08 |
| 3 to 5 | 02 Problem | 0:06 to 0:26 | 0:08 to 0:33 |
| 6 to 8 | 03 Two products, one loop | 0:26 to 0:42 | 0:33 to 0:52 |
| 9 | 04 Proof, replay | 0:42 to 0:49 | 0:52 to 1:01 |
| 10 | 05 Proof, real pull requests | 0:49 to 0:56 | 1:01 to 1:10 |
| 11 | 06 Moat | 0:56 to 1:03 | 1:10 to 1:19 |
| 12 | 07 Business model | 1:03 to 1:11 | 1:19 to 1:29 |
| 13 | 08 How we built it | 1:11 to 1:15 | 1:29 to 1:34 |
| 14 | 09 Close | 1:15 to 1:21 | 1:34 to 1:41 |

Keyword card, by line: 1 Games rot; 2 Bran, Daedal Games, Hit + Auto; 3 engine moves, black screen, review blind; 4 no tool: upgrade + prove; 5 Nexon, Krafton, LiveOps, 11 to 19K a month; 6 Hit writes PR + fixes; 7 Auto plays old + new, verdict; 8 Auto never codes, Hit never judges; 9 black, 75, 25, 0.02, PASS; 10 two real PRs, both PASS, both merged; 11 twice, 0 pixels, lesson for next game; 12 free public, 79 to 499, live title 15K; 13 gstack review, gbrain memory; 14 reads code, plays game, keeps alive.

## Every number and its source

- Line 3, the black screen: Quick_3D_RPG at three.js r118 → r162 with the version string alone (13 files) throws `Failed to resolve module specifier "three"` and draws no 3D frame in 4 of 4 checkpoints (wow-probe results.json, `runs["r162-bump"]`).
- Line 5: the founder's statement of 2026-11-09, ₩15–25M a month, converted at the pegged ₩1,300 per dollar ($11.5K–$19.2K). It is said as his statement, never as a signed figure; the slide carries the note.
- Line 9: the standalone replay probe, 1280x720 on SwiftShader. Fix 1 differs 68.20–75.59%, fix 2 7.58–24.87%, fix 3 0.0202–0.0393% on steps 1, 60, 120 and 180, against the 0.1% three.js e2e limit (results.json `diffs["r118-a vs r162-fix*-a"]`, rechecked by number-audit.json).
- Line 10: [PR #3](https://github.com/DaedalGames/auto-hit/pull/3), Quick 3D RPG, PASS after 7 fixes at 0.01–0.04%, merged as ab90995, closing issue #2; [PR #5](https://github.com/DaedalGames/auto-hit/pull/5), Crossy Road r99 → r162, PASS after 4 fixes at 0.07–0.10%, closing issue #4. Both from the daedal-ping[bot] and COGGS Hit comments on the PRs. CI took 7 fixes where the standalone probe took 3, because CI fixes one measured cause per commit.
- Line 11: two runs of the same r118 build differ by 0 pixels on all four checkpoints (`diffs["r118-a vs r118-b"]`). "Every fix becomes a lesson the next game reads first" means Hit queries `tools/brain.mjs` before each fix; it is not a claim that the brain cut the number of tries, since no run without it was measured.
- Line 12: [docs/BM.md](../BM.md): Free $0, Hobby $79, Pro $249, Heavy $499 a month, Studio from $5,000 a month billed yearly, LiveOps $15,000 per live title a month.
- Line 13: gstack's `/review` runs in `tools/review.mjs`; gbrain indexes `brain/lessons/` through `tools/brain.mjs` (.coggs/gstack/README.md). The full answer is FAQ 10.

## FAQ answers to read aloud

One slide each after the FAQ divider, in this order. The quoted line is what he says.

> F1. Q: Your PASS checks only 4 frames?
>    "We checked every second step, 1 to 180. The final fix passes 89 of 91 frames. The 2 misses are steps 6 and 8, right after the game loads."
>    4프레임만 보나요? → 1~180 사이 짝수 스텝을 다 봤고, 마지막 수정은 91프레임 중 89개 통과. 실패 2개는 스텝 6과 8, 게임이 막 로드된 직후.
>
> F2. Q: Who pays today?
>    "Major studios with over ten million players run parts of this as LiveOps pilots, Nexon and Krafton among them, at fifteen to twenty-five million won a month."
>    지금 누가 돈을 내나요? → 천만 유저 넘는 대형 게임사가 라이브옵스 PoC로 일부를 돌리고, 넥슨과 크래프톤이 그중이며 월 1,500만~2,500만 원.
>
> F3. Q: Engine upgrades are rare. Why a subscription?
>    "Hit watches every engine release and store deadline. Quick 3D RPG is 44 three.js releases behind, Crossy Road was 63. Firebase Test Lab shuts down in September 2027."
>    업그레이드는 드문데 왜 구독? → Hit는 모든 엔진 릴리스와 스토어 마감을 지켜봄. Quick 3D RPG는 44개, Crossy Road는 63개 릴리스 뒤처짐. Firebase Test Lab은 2027년 9월 종료.
>
> F4. Q: Did Hit do it, or did you?
>    "Hit opened the issues and the pull requests on its own. Every try is a line in its log, and every fix must name its cause and its source, or Hit refuses it."
>    Hit가 했나요, 당신이 했나요? → Hit가 이슈와 PR을 스스로 열었고, 시도마다 로그 한 줄, 원인과 출처를 못 대면 커밋 거부.
>
> F5. Q: What does Auto catch that code review misses?
>    "On PR #3, code review read the diff and guessed the lights look darker, at 6 of 10 confidence. Auto played it: 73.53% of pixels differ."
>    코드 리뷰가 놓치는 걸? → PR #3에서 코드 리뷰는 조명이 어두울 거라 6/10 확신으로 추측, Auto는 플레이해서 픽셀 73.53% 다름을 측정.
>
> F6. Q: Can Hit cheat the test?
>    "No. Hit may edit only the game folder. A change to the route, the limit or the judge is refused."
>    Hit가 시험을 속일 수 있나? → 아니요. 게임 폴더만 고칠 수 있고 경로, 기준, 판정을 건드리면 거부.
>
> F7. Q: What breaks first on a new game?
>    "The route file, about 30 lines per game. On Crossy Road the bump drew no canvas: THREE is not defined. Auto failed it before anyone merged."
>    새 게임에서 먼저 깨지는 건? → 게임마다 30줄쯤 되는 경로 파일. Crossy Road는 버전만 올리자 캔버스가 안 그려졌고 Auto가 머지 전에 FAIL.
>
> F8. Q: Is the brain memory, or your answer key?
>    "It is memory. On game 2, the brain returned game 1's color lesson before fix 3. That fix took the diff from 92.83% to 0.12%."
>    브레인은 기억인가 정답지인가? → 기억. 게임 2에서 브레인이 게임 1의 색 교훈을 수정 3 전에 돌려줬고, 그 수정이 92.83%를 0.12%로.
>
> F9. Q: What can't a studio rebuild by Friday?
>    "The harness, yes. The lesson brain, the game-domain ontology and the frame history grow with every pull request we play."
>    스튜디오가 금요일까지 못 만드는 것? → 하네스는 만들 수 있음. 교훈 브레인, 게임 도메인 온톨로지, 프레임 기록은 PR마다 쌓임.
>
> F10. Q: How did you build it?
>    "With two open tools by Garry Tan. gstack's review reads every upgrade pull request through tools/review.mjs, and its office-hours and plan-ceo-review gave the YC-partner lens our partner-grill used to write the pitch Q&A. gbrain is Hit's memory: every solved cause is a lesson, queried before every fix. Our prices came from pricing-pick and pricing-sim on 17 saved price pages."
>    어떻게 만들었나? → 개리 탄의 오픈 도구 둘. gstack /review가 모든 업그레이드 PR을 읽고, office-hours와 plan-ceo-review가 partner-grill의 YC 파트너 렌즈가 되어 PITCH-QA를 씀. gbrain은 Hit의 기억, 수정마다 먼저 조회. 가격은 pricing-pick과 pricing-sim이 저장된 가격 페이지 17개로 냄.
>
> F11. Q: Why is the agent called Ping?
>    "In games you ping a spot to call your team. Ping is also network lag, the number every player blames. And it sounds like pink, our brand color."
>    왜 Ping? → 게임에서 팀을 부르는 핑, 모든 플레이어가 탓하는 네트워크 핑, 그리고 브랜드 색 핑크와 소리가 비슷.

Sources for the FAQ: the 89 of 91 frames are `wow-video.local/diffs/diffs.json` heads.vfix3 (fails only f006 0.33% and f008 0.14%); the brain answer is `hit/out/5.jsonl`, where the brain hit `three-r152-color-management-legacy-lights` came before fix 3 and that fix's verdict fell from 92.83% to 0.12%; the rest are [docs/PITCH-QA.md](../PITCH-QA.md) and [docs/BM.md](../BM.md). gbrain did not store the pricing data: the prices came from pricing-pick and pricing-sim over 17 saved source pages, so the deck and FAQ 10 say only that.

