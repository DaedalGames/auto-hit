---
type: lesson
title: "three r118 to r162: r162 FBXLoader converts FBX colors sRGB to linear, darkening models"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "frame mean luma 159.86 against 166.06, 14.47% of pixels differ; frames step 1 14.47%, step 60 10.64%, step 120 10.02%, step 180 9.20%"
cause: "r162 FBXLoader converts FBX colors sRGB to linear, darkening models"
fix: "not in the guide; examples/jsm/loaders/FBXLoader.js differs between versions. Commit f6ee7d0c3216 on PR #3: 4 files changed, 40 insertions(+)"
result: "COGGS Auto after this fix: FAIL, frames step 1 0.09%, step 60 0.11%, step 120 0.13%, step 180 0.12%"
tags: [three, quick3drpg, r162, hit, r162, fbxloader, converts, colors, srgb, linear, darkening, models]
---

# r162 FBXLoader converts FBX colors sRGB to linear, darkening models

Evidence: step 1: the frame is darker on part of the frame, 14.47% of pixels differ, mean luma 159.86 against 166.06

Source: not in the guide; examples/jsm/loaders/FBXLoader.js differs between versions

Written by COGGS Hit after PR #3 reached PASS. Fix 6 of 7, commit f6ee7d0c3216e42680fd098e009020b1956fb126.

```text
games/quick3drpg/src/equip-weapon-component.js |  2 ++
 games/quick3drpg/src/gltf-component.js         | 34 ++++++++++++++++++++++++++
 games/quick3drpg/src/npc-entity.js             |  2 ++
 games/quick3drpg/src/player-entity.js          |  2 ++
 4 files changed, 40 insertions(+)
```

```diff
diff --git a/games/quick3drpg/src/equip-weapon-component.js b/games/quick3drpg/src/equip-weapon-component.js
index 25a2322..17d3d61 100644
--- a/games/quick3drpg/src/equip-weapon-component.js
+++ b/games/quick3drpg/src/equip-weapon-component.js
@@ -1,2 +1,3 @@
 import {entity} from './entity.js';
+import {gltf_component} from './gltf-component.js';
 
@@ -64,2 +65,3 @@ export const equip_weapon_component = (() => {
       loader.load(item.RenderParams.name + '.fbx', (fbx) => {
+        gltf_component.RestoreFBXColors(fbx);
         this._target = fbx;
diff --git a/games/quick3drpg/src/gltf-component.js b/games/quick3drpg/src/gltf-component.js
index ebe7dca..b0dee0a 100644
--- a/games/quick3drpg/src/gltf-component.js
+++ b/games/quick3drpg/src/gltf-component.js
@@ -10,2 +10,33 @@ export const gltf_component = (() => {
 
+  // r162's FBXLoader converts FBX material and vertex colors sRGB -> linear
+  // (unconditionally); r118's used them as-is. Undo it to keep r118's look.
+  function _RestoreFBXColors(obj) {
+    const seen = new Set();
+    obj.traverse(c => {
+      const materials = c.material instanceof Array ? c.material : [c.material];
+      for (let m of materials) {
+        if (!m || seen.has(m)) {
+          continue;
+        }
+        seen.add(m);
+        for (let k of ['color', 'emissive', 'specular']) {
+          if (m[k] && m[k].isColor) {
+            m[k].convertLinearToSRGB();
+          }
+        }
+      }
+      const colors = c.geometry && c.geometry.attributes && c.geometry.attributes.color;
+      if (colors && !seen.has(colors)) {
+        seen.add(colors);
+        const tmp = new THREE.Color();
+        for (let i = 0; i < colors.count; ++i) {
+          tmp.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i));
+          tmp.convertLinearToSRGB();
+          colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
+        }
+        colors.needsUpdate = true;
+      }
+    });
+  }
+
   class StaticModelComponent extends entity.Component {
@@ -97,2 +128,3 @@ export const gltf_component = (() => {
       loader.load(this._params.resourceName, (fbx) => {
+        _RestoreFBXColors(fbx);
         this._OnLoaded(fbx);
@@ -218,2 +250,3 @@ export const gltf_component = (() => {
       loader.load(this._params.resourceName, (fbx) => {
+        _RestoreFBXColors(fbx);
         this._OnLoaded(fbx);
@@ -233,2 +266,3 @@ export const gltf_component = (() => {
       AnimatedModelComponent: AnimatedModelComponent,
+      RestoreFBXColors: _RestoreFBXColors,
   };
diff --git a/games/quick3drpg/src/npc-entity.js b/games/quick3drpg/src/npc-entity.js
index d816cd2..2a10d01 100644
--- a/games/quick3drpg/src/npc-entity.js
+++ b/games/quick3drpg/src/npc-entity.js
@@ -6,2 +6,3 @@ import {finite_state_machine} from './finite-state-machine.js';
 import {entity} from './entity.js';
+import {gltf_component} from './gltf-component.js';
 import {player_entity} from './player-entity.js'
@@ -86,2 +87,3 @@ export const npc_entity = (() => {
       loader.load(this._params.resourceName, (glb) => {
+        gltf_component.RestoreFBXColors(glb);
         this._target = glb;
diff --git a/games/quick3drpg/src/player-entity.js b/games/quick3drpg/src/player-entity.js
index 8240381..6e04d9e 100644
--- a/games/quick3drpg/src/player-entity.js
+++ b/games/quick3drpg/src/player-entity.js
@@ -5,2 +5,3 @@ import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm
 import {entity} from './entity.js';
```
