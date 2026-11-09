---
type: lesson
title: "three r162 FBXLoader converts FBX colors from sRGB to linear; undo it"
engine: three
from: r118
to: r162
game: simondevyoutube/Quick_3D_RPG
symptom: "colors washed out or off after the three.js upgrade: FBX characters and props render darker and in the wrong tone, frame mean luma 141.9 against 152.6 on r118, 24.9% of pixels differ"
cause: "r162 FBXLoader calls convertSRGBToLinear on material color, emissive, specular and vertex colors; r118 did not. With ColorManagement disabled nothing converts them back."
fix: "Wrap FBXLoader.prototype.parse and convert every material color, emissive, specular and the vertex color attribute from linear back to sRGB once."
result: "pixel diff at frame 1 fell from 24.87% to 0.020%; all four frames pass the three.js e2e rule (under 0.1% of pixels differ)"
tags: [three, fbx, fbxloader, srgb, linear, color, colour, washed-out, darker, color-management, upgrade, r162]
---

# three r162 FBXLoader converts FBX colors from sRGB to linear; undo it

**Symptom.** After moving a game from three r118 to r162, colors are washed out or off: FBX characters and props render darker and in the wrong tone. This survives the renames and the renderer color fix. On Quick_3D_RPG the frame mean luma was 141.9 against 152.6 on r118, and 24.9% of pixels differed at frame 1.

**Cause.** r162's `FBXLoader` calls `convertSRGBToLinear()` on every material `color`, `emissive` and `specular`, and on the vertex `color` attribute. r118's loader did not. A game that turned `THREE.ColorManagement.enabled` off to keep its r118 look never converts those values back.

**Fix.** Wrap the loader once, before any model loads:

```js
const _fbxParse = FBXLoader.prototype.parse;
FBXLoader.prototype.parse = function (...args) {
  const root = _fbxParse.apply(this, args);
  root.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of ms) for (const k of ["color", "emissive", "specular"]) if (m[k] && !m[k]._srgbBack) { m[k].convertLinearToSRGB(); m[k]._srgbBack = true; }
    const c = o.geometry && o.geometry.attributes && o.geometry.attributes.color;
    if (c && !c._srgbBack) { const t = new THREE.Color(); for (let i = 0; i < c.count; i++) { t.fromBufferAttribute(c, i).convertLinearToSRGB(); c.setXYZ(i, t.r, t.g, t.b); } c._srgbBack = true; }
  });
  return root;
};
```

**Result.** Under the three.js e2e rule (a pixel differs past a normalized squared RGB distance of 0.01, and a frame fails past 0.1% of pixels), build b162-fix3 against r118 differs on 0.020%, 0.022%, 0.039% and 0.020% of pixels at steps 1, 60, 120 and 180. Every frame passes, on SwiftShader and on the GPU. Two runs of fix3 are byte-identical.

**Applies when.** The game loads FBX assets and the upgrade crosses the release where FBXLoader began converting colors. Apply it after [three-r152-color-management-legacy-lights](three-r152-color-management-legacy-lights.md).

**Source.** wow-probe run on 2026-11-09, builds b162-fix2 and b162-fix3, results.json pairs `r118-a vs r162-fix2-a` and `r118-a vs r162-fix3-a`.

