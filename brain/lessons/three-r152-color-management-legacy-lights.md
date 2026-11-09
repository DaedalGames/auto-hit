---
type: lesson
title: "three r152+ color management and r155 physically correct lights darken an r118 scene; turn both off"
engine: three
from: r118
to: r162
game: simondevyoutube/Quick_3D_RPG
symptom: "whole scene much darker after the three.js upgrade, colors dim and washed out, frame mean luma 87.5 against 152.6 on r118, 75.6% of pixels differ"
cause: "THREE.ColorManagement.enabled defaults to true from r152, and physically correct lighting (useLegacyLights false) is the default from r155, so lights tuned for r118 come out far dimmer"
fix: "Set THREE.ColorManagement.enabled = false before creating materials, and renderer.useLegacyLights = true on the WebGLRenderer"
result: "pixel diff at frame 1 fell from 75.6% to 24.9% and mean luma rose from 87.5 to 141.9; the remaining gap is the FBXLoader color lesson"
tags: [three, color-management, colormanagement, uselegacylights, lights, lighting, darker, dim, washed-out, srgb, upgrade, r152, r155, r162]
---

# three r152+ color management and r155 physically correct lights darken an r118 scene; turn both off

**Symptom.** After moving from three r118 to r162 and making only the API renames, the whole scene is much darker and its colors are dim. On Quick_3D_RPG the frame mean luma was 87.5 against 152.6, and 75.6% of pixels differed at frame 1.

**Cause.** From r152 `THREE.ColorManagement.enabled` defaults to `true`, and from r155 the renderer uses physically correct light intensities (`useLegacyLights = false`). Light values tuned for r118 come out far dimmer.

**Fix.**

```js
THREE.ColorManagement.enabled = false;   // before any material or renderer is created
this._threejs = new THREE.WebGLRenderer({ antialias: true });
this._threejs.outputColorSpace = THREE.SRGBColorSpace;
this._threejs.useLegacyLights = true;
```

**Result.** Build b162-fix2 against r118: 24.9% of pixels differ at frame 1 (it was 75.6%) and about 8% at frames 60 to 180, with mean luma at 141.9 (it was 87.5). It still fails. The remaining gap is [three-r162-fbxloader-srgb](three-r162-fbxloader-srgb.md). `useLegacyLights` prints a deprecation warning in r162, so a later upgrade has to retune the light intensities.

**Source.** wow-probe run on 2026-11-09, patch-fix2-over-fix1.diff, results.json pairs `r118-a vs r162-fix1g-a` and `r118-a vs r162-fix2-a`.

