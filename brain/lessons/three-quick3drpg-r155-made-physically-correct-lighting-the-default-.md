---
type: lesson
title: "three r118 to r162: r155 made physically correct lighting the default, dimming every light"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "frame mean luma 96.22 against 167.47, 73.53% of pixels differ; frames step 1 66.76%, step 60 73.53%, step 120 73.30%, step 180 72.33%"
cause: "r155 made physically correct lighting the default, dimming every light"
fix: "guide 154 → 155: `WebGLRenderer.useLegacyLights` is now set to `false` by default and deprecated. Commit 784477652de1 on PR #3: 1 file changed, 1 insertion(+)"
result: "COGGS Auto after this fix: FAIL, frames step 1 64.94%, step 60 70.09%, step 120 70.29%, step 180 68.92%"
tags: [three, quick3drpg, r162, hit, r155, made, physically, correct, lighting, default, dimming, every, light]
---

# r155 made physically correct lighting the default, dimming every light

Evidence: "73.53% of pixels differ" (f060, baseLuma 167.47, headLuma 96.22)

Source: guide 154 → 155: `WebGLRenderer.useLegacyLights` is now set to `false` by default and deprecated

Written by COGGS Hit after PR #3 reached PASS. Fix 4 of 7, commit 784477652de10c29419ef4c3679d73b11411edf4.

```text
games/quick3drpg/src/main.js | 1 +
 1 file changed, 1 insertion(+)
```

```diff
diff --git a/games/quick3drpg/src/main.js b/games/quick3drpg/src/main.js
index dba1bd6..caa339a 100644
--- a/games/quick3drpg/src/main.js
+++ b/games/quick3drpg/src/main.js
@@ -59,2 +59,3 @@ class HackNSlashDemo {
     this._threejs.gammaFactor = 2.2;
+    this._threejs.useLegacyLights = true;
     this._threejs.shadowMap.enabled = true;
```
