---
type: lesson
title: "three r118 to r162: r162 jsm loaders import bare 'three' with no import map to resolve it"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "Failed to resolve module specifier 'three'. Relative references must start with either '/', './', or '../'.; frames step 1 no frame, step 60 no frame, step 120 no frame, step 180 no frame"
cause: "r162 jsm loaders import bare 'three' with no import map to resolve it"
fix: "136 → 137: The ES6 import of `three.js` and `examples/jsm` modules in web sites now requires the usage of an import map to resolve the `three` bare import specifier.. Commit e9d871413edf on PR #3: 1 file changed, 7 insertions(+)"
result: "COGGS Auto after this fix: FAIL, frames step 1 99.71%, step 60 99.49%, step 120 99.62%, step 180 99.54%"
tags: [three, quick3drpg, r162, hit, r162, loaders, import, bare, three, with, import, resolve]
---

# r162 jsm loaders import bare "three" with no import map to resolve it

Evidence: Failed to resolve module specifier "three". Relative references must start with either "/", "./", or "../".

Source: 136 → 137: The ES6 import of `three.js` and `examples/jsm` modules in web sites now requires the usage of an import map to resolve the `three` bare import specifier.

Written by COGGS Hit after PR #3 reached PASS. Fix 1 of 7, commit e9d871413edfcbfbbf5a78472c7f956b8f98c05e.

```text
games/quick3drpg/index.html | 7 +++++++
 1 file changed, 7 insertions(+)
```

```diff
diff --git a/games/quick3drpg/index.html b/games/quick3drpg/index.html
index 237ca39..2c3494e 100644
--- a/games/quick3drpg/index.html
+++ b/games/quick3drpg/index.html
@@ -11,2 +11,9 @@
 <body>
+  <script type="importmap">
+    {
+      "imports": {
+        "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js"
+      }
+    }
+  </script>
   <script src="./src/main.js" type="module">
```
