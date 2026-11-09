---
type: lesson
title: "three r118 to r162: r152 enabled ColorManagement by default, darkening sky and colors"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "frame mean luma 123.34 against 168.9, 70.29% of pixels differ; frames step 1 64.94%, step 60 70.09%, step 120 70.29%, step 180 68.92%"
cause: "r152 enabled ColorManagement by default, darkening sky and colors"
fix: "guide r152: `THREE.ColorManagement.enabled` is now `true` by default. Commit b4aeb07ffc85 on PR #3: 1 file changed, 1 insertion(+)"
result: "COGGS Auto after this fix: FAIL, frames step 1 14.47%, step 60 10.64%, step 120 10.02%, step 180 9.20%"
tags: [three, quick3drpg, r162, hit, r152, enabled, colormanagement, default, darkening, colors]
---

# r152 enabled ColorManagement by default, darkening sky and colors

Evidence: "64.94% of pixels differ" (f001 baseLuma 166.06, headLuma 126.52)

Source: guide r152: `THREE.ColorManagement.enabled` is now `true` by default

Written by COGGS Hit after PR #3 reached PASS. Fix 5 of 7, commit b4aeb07ffc854ac391f0a8eb348385659d121ed2.

```text
games/quick3drpg/src/main.js | 1 +
 1 file changed, 1 insertion(+)
```

```diff
diff --git a/games/quick3drpg/src/main.js b/games/quick3drpg/src/main.js
index caa339a..e60c44d 100644
--- a/games/quick3drpg/src/main.js
+++ b/games/quick3drpg/src/main.js
@@ -54,2 +54,3 @@ class HackNSlashDemo {
   _Initialize() {
+    THREE.ColorManagement.enabled = false;
     this._threejs = new THREE.WebGLRenderer({
```
