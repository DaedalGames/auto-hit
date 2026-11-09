---
type: lesson
title: "three r99 to r162: three r161 removed build/three.min.js so the THREE global is gone"
engine: three
from: r99
to: r162
game: crossyroad
symptom: "THREE is not defined; frames step 1 no frame, step 60 no frame, step 120 no frame, step 180 no frame"
cause: "three r161 removed build/three.min.js so the THREE global is gone"
fix: "r160 → r161: The build files `build/three.js` and `build/three.min.js` have been removed. Commit 4944940aac29 on PR #5: 1 file changed, 7 insertions(+), 2 deletions(-)"
result: "COGGS Auto after this fix: FAIL, frames step 1 no frame, step 60 no frame, step 120 no frame, step 180 no frame"
tags: [three, crossyroad, r162, hit, three, r161, removed, build, three, three, global, gone]
---

# three r161 removed build/three.min.js so the THREE global is gone

Evidence: THREE is not defined

Source: r160 → r161: The build files `build/three.js` and `build/three.min.js` have been removed

Written by COGGS Hit after PR #5 reached PASS. Fix 1 of 4, commit 4944940aac2967fb25110e54c3d3a3ad7af407ff.

```text
games/crossyroad/index.html | 9 +++++++--
 1 file changed, 7 insertions(+), 2 deletions(-)
```

```diff
diff --git a/games/crossyroad/index.html b/games/crossyroad/index.html
index 7cc198f..0ee94ca 100644
--- a/games/crossyroad/index.html
+++ b/games/crossyroad/index.html
@@ -55,4 +55,9 @@
 
-  <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/162/three.min.js'></script>
-  <script  src="./script.js"></script>
+  <script type="module">
+    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
+    window.THREE = THREE;
+    const game = document.createElement('script');
+    game.src = './script.js';
+    document.body.appendChild(game);
+  </script>
```
