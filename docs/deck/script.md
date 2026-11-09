# COGGS Hit + COGGS Auto, c0mpiled-17 finals live pitch

The finals script for [auto-hit-deck.html](./auto-hit-deck.html), read live in English by Bran Lee. The slide faces carry one headline and a few words; everything said and every source sits here and in each slide's speaker notes (press N). One sentence per line, the Korean under each line for rehearsal only, timed at 150 words a minute and at 120, the pace he rehearses to. The 90-second demo plays on the video slide: Space plays or pauses it, the right arrow moves on.

## The pitch (15 lines, 140 words, about 56 seconds at 150 words a minute; about 70 at 120)

> 1. "Games rot."
>    게임은 썩습니다.
>
> 2. "I'm Bran Lee, and these are COGGS Hit and COGGS Auto."
>    저는 브랜 리이고, 이것이 COGGS Hit와 COGGS Auto입니다.
>
> 3. "Watch ninety seconds."
>    90초만 보시죠.
>
> 4. "Bump the engine, and the game goes black."
>    엔진만 올리면 게임 화면이 까매집니다.
>
> 5. "No tool in games fixes this."
>    게임 업계에 이걸 고치는 도구가 없습니다.
>
> 6. "Hit writes the fix. Auto plays it."
>    Hit가 고치고, Auto가 플레이합니다.
>
> 7. "Auto replays both builds, diffs every pixel, and Ping posts the verdict."
>    Auto가 두 빌드를 다시 돌려 픽셀을 비교하고, Ping이 판정을 올립니다.
>
> 8. "Fail, and Hit fixes again. Pass, and it merges."
>    실패하면 Hit가 다시 고치고, 통과하면 머지됩니다.
>
> 9. "Black. Seventy-five percent. Twenty-five. Zero point zero two. Pass."
>    까만 화면. 75%. 25%. 0.02%. 통과.
>
> 10. "Two real pull requests today. Two cleared. Both merged."
>    오늘 실제 PR 두 개. 둘 다 통과, 둘 다 머지.
>
> 11. "Nexon and Krafton already run parts of this as LiveOps pilots, at eleven to nineteen thousand dollars a month."
>    넥슨과 크래프톤이 이미 일부를 라이브옵스 PoC로 돌리고, 월 1만 1천~1만 9천 달러를 냅니다.
>
> 12. "Zero pixels of drift, fifteen lessons, nine engine faces, and it grows with every game."
>    흔들림 0픽셀, 교훈 15개, 엔진 영역 9개, 게임마다 더 커집니다.
>
> 13. "Free for public repos, seventy-nine dollars to start, fifteen thousand per live title."
>    공개 저장소는 무료, 시작은 79달러, 라이브 타이틀 하나에 1만 5천 달러.
>
> 14. "CodeRabbit reads your code. COGGS Auto plays your game."
>    CodeRabbit은 코드를 읽고, COGGS Auto는 게임을 플레이합니다.
>
> 15. "It's open on GitHub today: Daedal Games, auto-hit."
>    오늘 GitHub에 공개돼 있습니다. DaedalGames/auto-hit.

If the slot is only 30 seconds, say lines 1, 4, 6, 9, 10, 11, 12 and 14.

The video runs between lines 3 and 4 and adds 90 seconds to the slot.

| Lines | Slide | At 150 words a minute | At 120 |
| --- | --- | --- | --- |
| 1 to 2 | 01 Cover | 0:00 to 0:05 | 0:00 to 0:07 |
| 3 | Video (90 s plays here) | 0:05 to 0:06 | 0:07 to 0:08 |
| 4 to 5 | 02 Problem | 0:06 to 0:12 | 0:08 to 0:15 |
| 6 to 8 | 03 Architecture | 0:12 to 0:23 | 0:15 to 0:29 |
| 9 | 04 Level meter | 0:23 to 0:27 | 0:29 to 0:34 |
| 10 | 05 2/2 cleared | 0:27 to 0:30 | 0:34 to 0:38 |
| 11 | 06 Already paying | 0:30 to 0:38 | 0:38 to 0:48 |
| 12 | 07 Moat | 0:38 to 0:44 | 0:48 to 0:55 |
| 13 | 08 Price | 0:44 to 0:49 | 0:55 to 1:01 |
| 14 to 15 | 09 Close | 0:49 to 0:56 | 1:01 to 1:10 |

Keyword card, by line: 1 Games rot; 2 Bran, Hit + Auto; 3 play video; 4 bump, black; 5 no tool; 6 Hit fixes, Auto plays; 7 replay, pixel diff, Ping verdict; 8 FAIL fix again, PASS merge; 9 black, 75, 25, 0.02, PASS; 10 2 of 2, merged today; 11 Nexon, Krafton, 11 to 19K a month; 12 0 px, 15 lessons, 9 faces; 13 free, 79, 15K per title; 14 reads code, plays game; 15 GitHub, auto-hit.

## Every number and its source

- Line 4, the black screen: Quick_3D_RPG at three.js r118 to r162 with the version string alone (13 files) throws `Failed to resolve module specifier "three"` and draws no 3D frame in 4 of 4 checkpoints (wow-probe results.json, `runs["r162-bump"]`).
- Line 9 and the level meter: the standalone replay probe, 1280x720 on SwiftShader, steps 1, 60, 120 and 180, against the 0.1% three.js e2e limit. Fix 1 differs 68.20 to 75.59%, fix 2 7.58 to 24.87%, fix 3 0.0202 to 0.0393% (results.json `diffs["r118-a vs r162-fix*-a"]`, rechecked by number-audit.json). The meter is drawn on a log scale so the 0.1% line is visible. The moving GIF beside it is the FAIL to PASS segment of the probe's video.
- Line 10: [PR #3](https://github.com/DaedalGames/auto-hit/pull/3), Quick 3D RPG, PASS after 7 fixes at 0.01 to 0.04%, merged as ab90995, closing issue #2; [PR #5](https://github.com/DaedalGames/auto-hit/pull/5), Crossy Road r99 to r162, PASS after 4 fixes at 0.07 to 0.10%, closing issue #4. CI took 7 fixes where the standalone probe took 3, because CI fixes one measured cause per commit.
- Line 11: the founder's statement of 2026-11-09, ₩15 to 25M a month at the pegged ₩1,300 per dollar ($11.5K to $19.2K), from studios with over 10M players. Said as his statement.
- Line 12: two replays of the same r118 build differ by 0 pixels on all four checkpoints (`diffs["r118-a vs r118-b"]`); 15 lesson files in `brain/lessons/` on main; 9 faces in `.coggs/ontology/faces.json` (color, lighting, loaders, input, audio, physics, save, network, runtime). "Grows with every game" means each solved cause is added as a lesson; it is not a claim that the brain cut the number of tries, since no run without it was measured.
- Line 13: [docs/BM.md](../BM.md): Free $0, Hobby $79, Pro $249, Heavy $499 a month, Studio from $5,000 a month billed yearly, LiveOps $15,000 per live title a month.
- How it was built (gstack and gbrain) is FAQ 10, no longer a pitch slide.

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

