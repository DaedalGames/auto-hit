---
type: lesson
title: "three r118 to r162: r162 removed the SphereBufferGeometry alias used for the sky dome"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "THREE.SphereBufferGeometry is not a constructor; frames step 1 99.71%, step 60 99.49%, step 120 99.62%, step 180 99.54%"
cause: "r162 removed the SphereBufferGeometry alias used for the sky dome"
fix: "guide 144 → 145: The `BufferGeometry` alias for geometry generators has been deprecated. Use e.g. `BoxGeometry` instead of `BoxBufferGeometry`.. Commit e900c4f6905c on PR #3: 1 file changed, 1 insertion(+), 1 deletion(-)"
result: "COGGS Auto after this fix: FAIL, frames step 1 66.81%, step 60 73.55%, step 120 73.32%, step 180 72.35%"
tags: [three, quick3drpg, r162, hit, r162, removed, spherebuffergeometry, alias, used, dome]
---

# r162 removed the SphereBufferGeometry alias used for the sky dome

Evidence: THREE.SphereBufferGeometry is not a constructor

Source: guide 144 → 145: The `BufferGeometry` alias for geometry generators has been deprecated. Use e.g. `BoxGeometry` instead of `BoxBufferGeometry`.

Written by COGGS Hit after PR #3 reached PASS. Fix 2 of 7, commit e900c4f6905cf4d322627d824cc591b565736979.

```text
games/quick3drpg/src/main.js | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

```diff
diff --git a/games/quick3drpg/src/main.js b/games/quick3drpg/src/main.js
index b810f01..dba1bd6 100644
--- a/games/quick3drpg/src/main.js
+++ b/games/quick3drpg/src/main.js
@@ -145,3 +145,3 @@ class HackNSlashDemo {
 
-    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
+    const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
     const skyMat = new THREE.ShaderMaterial({
```
