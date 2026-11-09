---
type: lesson
title: "three r118 to r162: r120 forbids #version in ShaderMaterial; health bar needs GLSL3"
engine: three
from: r118
to: r162
game: quick3drpg
symptom: "THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false Material Name: Material Type: ShaderMaterial Program Info Log: Vertex shader is not compiled. VERTEX ERROR: 0:89: 'version' : #version directive must occur before anything else, except for comments and white space 84: #ifdef USE_SKINN; frames step 1 66.81%, step 60 73.55%, step 120 73.32%, step 180 72.35%"
cause: "r120 forbids #version in ShaderMaterial; health bar needs GLSL3"
fix: "r119 → r120, 'When using ShaderMaterial and RawShaderMaterial, it's now necessary to set the new glslVersion property to THREE.GLSL3'. Commit 1d83610e7024 on PR #3: 1 file changed, 3 insertions(+), 2 deletions(-)"
result: "COGGS Auto after this fix: FAIL, frames step 1 66.76%, step 60 73.53%, step 120 73.30%, step 180 72.33%"
tags: [three, quick3drpg, r162, hit, r120, forbids, version, shadermaterial, health, needs, glsl3]
---

# r120 forbids #version in ShaderMaterial; health bar needs GLSL3

Evidence: ERROR: 0:89: 'version' : #version directive must occur before anything else, except for comments and white space

Source: r119 → r120, "When using ShaderMaterial and RawShaderMaterial, it's now necessary to set the new glslVersion property to THREE.GLSL3"

Written by COGGS Hit after PR #3 reached PASS. Fix 3 of 7, commit 1d83610e70242505118903e9ca4c670e484da01c.

```text
games/quick3drpg/src/health-bar.js | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)
```

```diff
diff --git a/games/quick3drpg/src/health-bar.js b/games/quick3drpg/src/health-bar.js
index 9c407ee..a469465 100644
--- a/games/quick3drpg/src/health-bar.js
+++ b/games/quick3drpg/src/health-bar.js
@@ -8,3 +8,3 @@ export const health_bar = (() => {
 
-  const _VS = `#version 300 es
+  const _VS = `
 varying vec2 vUV;
@@ -18,3 +18,3 @@ void main() {
 
-  const _PS = `#version 300 es
+  const _PS = `
 uniform vec3 colour;
@@ -51,2 +51,3 @@ class HealthBar extends entity.Component {
       fragmentShader: _PS,
+      glslVersion: THREE.GLSL3,
       blending: THREE.NormalBlending,
```
