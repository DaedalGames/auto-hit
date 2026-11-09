---
type: lesson
title: "three r118 to r162: r152 replaced Texture.encoding with colorSpace; monster textures lost sRGB"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "frame mean luma 168.92 against 168.9, 0.13% of pixels differ; frames step 1 0.09%, step 60 0.11%, step 120 0.13%, step 180 0.12%"
cause: "r152 replaced Texture.encoding with colorSpace; monster textures lost sRGB"
fix: "r151 → r152: `Texture.encoding` has been replaced with `Texture.colorSpace` with `THREE.NoColorSpace` as the default value.. Commit d19533e4f015 on PR #3: 3 files changed, 4 insertions(+), 4 deletions(-)"
result: "COGGS Auto after this fix: PASS, frames step 1 0.01%, step 60 0.02%, step 120 0.04%, step 180 0.02%"
tags: [three, quick3drpg, r162, hit, r152, replaced, texture, encoding, with, colorspace, monster, textures, lost, srgb]
---

# r152 replaced Texture.encoding with colorSpace; monster textures lost sRGB

Evidence: step 120: colors differ slightly at the same brightness on a few pixels, edges and small details, 0.13% of pixels differ, mean luma 168.92 against 168.9

Source: r151 → r152: `Texture.encoding` has been replaced with `Texture.colorSpace` with `THREE.NoColorSpace` as the default value.

Written by COGGS Hit after PR #3 reached PASS. Fix 7 of 7, commit d19533e4f015b2b02e6a9615b4e576058ca91179.

```text
games/quick3drpg/src/gltf-component.js | 4 ++--
 games/quick3drpg/src/npc-entity.js     | 2 +-
 games/quick3drpg/src/player-entity.js  | 2 +-
 3 files changed, 4 insertions(+), 4 deletions(-)
```

```diff
diff --git a/games/quick3drpg/src/gltf-component.js b/games/quick3drpg/src/gltf-component.js
index b0dee0a..d79401c 100644
--- a/games/quick3drpg/src/gltf-component.js
+++ b/games/quick3drpg/src/gltf-component.js
@@ -82,3 +82,3 @@ export const gltf_component = (() => {
         texture = texLoader.load(this._params.resourceTexture);
-        texture.encoding = THREE.sRGBEncoding;
+        texture.colorSpace = THREE.SRGBColorSpace;
       }
@@ -185,3 +185,3 @@ export const gltf_component = (() => {
         texture = texLoader.load(this._params.resourceTexture);
-        texture.encoding = THREE.sRGBEncoding;
+        texture.colorSpace = THREE.SRGBColorSpace;
       }
diff --git a/games/quick3drpg/src/npc-entity.js b/games/quick3drpg/src/npc-entity.js
index 2a10d01..c33711e 100644
--- a/games/quick3drpg/src/npc-entity.js
+++ b/games/quick3drpg/src/npc-entity.js
@@ -97,3 +97,3 @@ export const npc_entity = (() => {
             './resources/monsters/Textures/' + this._params.resourceTexture);
-        texture.encoding = THREE.sRGBEncoding;
+        texture.colorSpace = THREE.SRGBColorSpace;
         texture.flipY = true;
diff --git a/games/quick3drpg/src/player-entity.js b/games/quick3drpg/src/player-entity.js
index 6e04d9e..6a0ad01 100644
--- a/games/quick3drpg/src/player-entity.js
+++ b/games/quick3drpg/src/player-entity.js
@@ -86,3 +86,3 @@ export const player_entity = (() => {
           if (c.material && c.material.map) {
-            c.material.map.encoding = THREE.sRGBEncoding;
+            c.material.map.colorSpace = THREE.SRGBColorSpace;
           }
```
