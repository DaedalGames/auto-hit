---
type: lesson
title: "three r99 to r162: three r152 color management and r155 physical lights darken the scene"
engine: three
from: r99
to: r162
game: crossyroad
symptom: "frame mean luma 110.12 against 185.31, 92.83% of pixels differ; frames step 1 92.83%, step 60 90.79%, step 120 87.01%, step 180 86.90%"
cause: "three r152 color management and r155 physical lights darken the scene"
fix: "r151 → r152 'THREE.ColorManagement.enabled is now true by default' and outputColorSpace default SRGBColorSpace; r154 → r155 'WebGLRenderer.useLegacyLights is now set to false by default'. Commit 1e4992ca146f on PR #5: 1 file changed, 7 insertions(+), 1 deletion(-)"
result: "COGGS Auto after this fix: FAIL, frames step 1 0.08%, step 60 0.11%, step 120 0.12%, step 180 0.11%"
tags: [three, crossyroad, r162, hit, three, r152, color, management, r155, physical, lights, darken, scene]
---

# three r152 color management and r155 physical lights darken the scene

Evidence: "92.83% of pixels differ" (f001, baseLuma 185.31, headLuma 110.12)

Source: r151 → r152 "THREE.ColorManagement.enabled is now true by default" and outputColorSpace default SRGBColorSpace; r154 → r155 "WebGLRenderer.useLegacyLights is now set to false by default"

Written by COGGS Hit after PR #5 reached PASS. Fix 3 of 4, commit 1e4992ca146f830d339c93579a07743e2440a227.

```text
games/crossyroad/script.js | 8 +++++++-
 1 file changed, 7 insertions(+), 1 deletion(-)
```

```diff
diff --git a/games/crossyroad/script.js b/games/crossyroad/script.js
index 1a93a4a..313ed5f 100644
--- a/games/crossyroad/script.js
+++ b/games/crossyroad/script.js
@@ -1,2 +1,5 @@
-const counterDOM = document.getElementById('counter');  
+// three r152+ turns color management on by default; r99 had none. Must run before any material is created.
+THREE.ColorManagement.enabled = false;
+
+const counterDOM = document.getElementById('counter');
 const endDOM = document.getElementById('end');  
@@ -129,2 +132,5 @@ const renderer = new THREE.WebGLRenderer({
 });
+// Restore r99 defaults: linear output (gammaOutput = false) and non-physical light intensities.
+renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
+renderer.useLegacyLights = true;
 renderer.shadowMap.enabled = true;
```
