---
type: lesson
title: "three r99 to r162: three r99 shrank non-power-of-two textures, r162 on WebGL2 does not"
engine: three
from: r99
to: r162
game: crossyroad
symptom: "frame mean luma 151.29 against 151.61, 0.12% of pixels differ; frames step 1 0.08%, step 60 0.11%, step 120 0.12%, step 180 0.11%"
cause: "three r99 shrank non-power-of-two textures, r162 on WebGL2 does not"
fix: "not in the guide; src/renderers/webgl/WebGLTextures.js differs between versions. Commit 4a6bf9095ff3 on PR #5: 1 file changed, 10 insertions(+)"
result: "COGGS Auto after this fix: PASS, frames step 1 0.07%, step 60 0.10%, step 120 0.09%, step 180 0.09%"
tags: [three, crossyroad, r162, hit, three, shrank, power, textures, r162, webgl2, does]
---

# three r99 shrank non-power-of-two textures, r162 on WebGL2 does not

Evidence: "0.12% of pixels differ"

Source: not in the guide; src/renderers/webgl/WebGLTextures.js differs between versions

Written by COGGS Hit after PR #5 reached PASS. Fix 4 of 4, commit 4a6bf9095ff358c3bd277c5b321251bb67b1c9de.

```text
games/crossyroad/script.js | 10 ++++++++++
 1 file changed, 10 insertions(+)
```

```diff
diff --git a/games/crossyroad/script.js b/games/crossyroad/script.js
index 313ed5f..eccd422 100644
--- a/games/crossyroad/script.js
+++ b/games/crossyroad/script.js
@@ -151,2 +151,12 @@ function Texture(width, height, rects) {
   });
+  // r99 (WebGL1) resized non-power-of-two mipmapped textures down to the floor power of two; WebGL2 in r162 does not.
+  const potWidth = THREE.MathUtils.floorPowerOfTwo(width);
+  const potHeight = THREE.MathUtils.floorPowerOfTwo(height);
+  if (potWidth !== width || potHeight !== height) {
+    const potCanvas = document.createElement( "canvas" );
+    potCanvas.width = potWidth;
+    potCanvas.height = potHeight;
+    potCanvas.getContext( "2d" ).drawImage( canvas, 0, 0, potWidth, potHeight );
+    return new THREE.CanvasTexture(potCanvas);
+  }
   return new THREE.CanvasTexture(canvas);
```
