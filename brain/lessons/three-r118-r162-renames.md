---
type: lesson
title: "three r118 to r162 renames: the bare 'three' import needs an import map, SphereBufferGeometry and encoding are gone"
engine: three
from: r118
to: r162
game: simondevyoutube/Quick_3D_RPG
symptom: "game does not start after the three.js upgrade: Failed to resolve module specifier three, or THREE.SphereBufferGeometry is not a constructor"
cause: "r162 example loaders import the bare specifier 'three', and r162 removed the *BufferGeometry aliases and the texture.encoding and renderer.outputEncoding API"
fix: "Add an import map for 'three', rename SphereBufferGeometry to SphereGeometry, texture.encoding = sRGBEncoding to texture.colorSpace = SRGBColorSpace, and renderer.outputEncoding to renderer.outputColorSpace"
result: "build b162-fix1 loads and renders with no page error; colors still differ (see the color management lesson)"
tags: [three, importmap, module-specifier, spherebuffergeometry, buffergeometry, encoding, srgbencoding, colorspace, outputencoding, rename, upgrade, r162]
---

# three r118 to r162 renames: the bare 'three' import needs an import map, SphereBufferGeometry and encoding are gone

**Symptom.** A version bump alone fails at load with `Failed to resolve module specifier "three"`. With an import map added, it fails with `THREE.SphereBufferGeometry is not a constructor`.

**Fix.**

```html
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js"}}</script>
```

- `new THREE.SphereBufferGeometry(...)` becomes `new THREE.SphereGeometry(...)`
- `texture.encoding = THREE.sRGBEncoding` becomes `texture.colorSpace = THREE.SRGBColorSpace`
- `renderer.outputEncoding = THREE.sRGBEncoding` becomes `renderer.outputColorSpace = THREE.SRGBColorSpace`

**Result.** Build b162-fix1 loads with no page error. 75.6% of pixels still differ, which is [three-r152-color-management-legacy-lights](three-r152-color-management-legacy-lights.md).

**Source.** wow-probe run on 2026-11-09, page errors of runs r162-bump and r162-map, patch-fix1.diff.

