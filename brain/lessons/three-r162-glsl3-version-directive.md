---
type: lesson
title: "three r162 ShaderMaterial: move '#version 300 es' out of the shader source into glslVersion: THREE.GLSL3"
engine: three
from: r118
to: r162
game: simondevyoutube/Quick_3D_RPG
symptom: "custom shader fails to compile after the three.js upgrade: THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false, '#version directive must occur before anything else', useProgram: program not valid; health bars or other ShaderMaterial meshes disappear"
cause: "r162 prepends its own prefix to ShaderMaterial source, so a '#version 300 es' line written into the source is no longer the first line"
fix: "Delete the '#version 300 es' line from vertexShader and fragmentShader and pass glslVersion: THREE.GLSL3 to the ShaderMaterial"
result: "the shader error and the invalid program warning are gone in build b162-fix1g"
tags: [three, glsl, glsl3, shadermaterial, shader, version, webglprogram, validate_status, compile, upgrade, r162]
---

# three r162 ShaderMaterial: move '#version 300 es' out of the shader source into glslVersion: THREE.GLSL3

**Symptom.** After the upgrade the console shows `THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false`, `'version' : #version directive must occur before anything else` and `useProgram: program not valid`. The meshes drawn with that ShaderMaterial (in Quick_3D_RPG, the health bars) disappear.

**Cause.** r162 prepends its own prefix to `ShaderMaterial` source, so a `#version 300 es` line written into the source is no longer the first line.

**Fix.**

```js
const _VS = `varying vec2 vUV; ...`;   // no '#version 300 es' line
const _PS = `uniform vec3 colour; ...`;
new THREE.ShaderMaterial({ vertexShader: _VS, fragmentShader: _PS, glslVersion: THREE.GLSL3 });
```

**Result.** In build b162-fix1g the shader error and the invalid program warning are gone. The pixel diff barely moves (75.63% to 75.59%), since the large gap is [three-r152-color-management-legacy-lights](three-r152-color-management-legacy-lights.md).

**Source.** wow-probe run on 2026-11-09, console of run r162-fix1-a against r162-fix1g-a.

