---
type: lesson
title: "three r99 to r162: three r145 removed the BoxBufferGeometry and PlaneBufferGeometry aliases"
engine: three
from: r99
to: r162
game: crossyroad
symptom: "THREE.BoxBufferGeometry is not a constructor; frames step 1 no frame, step 60 no frame, step 120 no frame, step 180 no frame"
cause: "three r145 removed the BoxBufferGeometry and PlaneBufferGeometry aliases"
fix: "144 → 145: The `BufferGeometry` alias for geometry generators has been deprecated. Use e.g. `BoxGeometry` instead of `BoxBufferGeometry`.. Commit 86354b4e5a74 on PR #5: 1 file changed, 12 insertions(+), 12 deletions(-)"
result: "COGGS Auto after this fix: FAIL, frames step 1 92.83%, step 60 90.79%, step 120 87.01%, step 180 86.90%"
tags: [three, crossyroad, r162, hit, three, r145, removed, boxbuffergeometry, planebuffergeometry, aliases]
---

# three r145 removed the BoxBufferGeometry and PlaneBufferGeometry aliases

Evidence: THREE.BoxBufferGeometry is not a constructor

Source: 144 → 145: The `BufferGeometry` alias for geometry generators has been deprecated. Use e.g. `BoxGeometry` instead of `BoxBufferGeometry`.

Written by COGGS Hit after PR #5 reached PASS. Fix 2 of 4, commit 86354b4e5a740af0c6da0e27aff79074d166bdfc.

```text
games/crossyroad/script.js | 24 ++++++++++++------------
 1 file changed, 12 insertions(+), 12 deletions(-)
```

```diff
diff --git a/games/crossyroad/script.js b/games/crossyroad/script.js
index c808220..1a93a4a 100644
--- a/games/crossyroad/script.js
+++ b/games/crossyroad/script.js
@@ -150,3 +150,3 @@ function Wheel() {
   const wheel = new THREE.Mesh( 
-    new THREE.BoxBufferGeometry( 12*zoom, 33*zoom, 12*zoom ), 
+    new THREE.BoxGeometry( 12*zoom, 33*zoom, 12*zoom ), 
     new THREE.MeshLambertMaterial( { color: 0x333333, flatShading: true } ) 
@@ -162,3 +162,3 @@ function Car() {
   const main = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 60*zoom, 30*zoom, 15*zoom ), 
+    new THREE.BoxGeometry( 60*zoom, 30*zoom, 15*zoom ), 
     new THREE.MeshPhongMaterial( { color, flatShading: true } )
@@ -171,3 +171,3 @@ function Car() {
   const cabin = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 33*zoom, 24*zoom, 12*zoom ), 
+    new THREE.BoxGeometry( 33*zoom, 24*zoom, 12*zoom ), 
     [
@@ -207,3 +207,3 @@ function Truck() {
   const base = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 100*zoom, 25*zoom, 5*zoom ), 
+    new THREE.BoxGeometry( 100*zoom, 25*zoom, 5*zoom ), 
     new THREE.MeshLambertMaterial( { color: 0xb4c6fc, flatShading: true } )
@@ -214,3 +214,3 @@ function Truck() {
   const cargo = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 75*zoom, 35*zoom, 40*zoom ), 
+    new THREE.BoxGeometry( 75*zoom, 35*zoom, 40*zoom ), 
     new THREE.MeshPhongMaterial( { color: 0xb4c6fc, flatShading: true } )
@@ -224,3 +224,3 @@ function Truck() {
   const cabin = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 25*zoom, 30*zoom, 30*zoom ), 
+    new THREE.BoxGeometry( 25*zoom, 30*zoom, 30*zoom ), 
     [
@@ -259,3 +259,3 @@ function Three() {
   const trunk = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 15*zoom, 15*zoom, 20*zoom ), 
+    new THREE.BoxGeometry( 15*zoom, 15*zoom, 20*zoom ), 
     new THREE.MeshPhongMaterial( { color: 0x4d2926, flatShading: true } )
@@ -270,3 +270,3 @@ function Three() {
   const crown = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 30*zoom, 30*zoom, height*zoom ), 
+    new THREE.BoxGeometry( 30*zoom, 30*zoom, height*zoom ), 
     new THREE.MeshLambertMaterial( { color: 0x7aa21d, flatShading: true } )
@@ -285,3 +285,3 @@ function Chicken() {
   const body = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( chickenSize*zoom, chickenSize*zoom, 20*zoom ), 
+    new THREE.BoxGeometry( chickenSize*zoom, chickenSize*zoom, 20*zoom ), 
     new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } )
@@ -294,3 +294,3 @@ function Chicken() {
   const rowel = new THREE.Mesh(
-    new THREE.BoxBufferGeometry( 2*zoom, 4*zoom, 2*zoom ), 
+    new THREE.BoxGeometry( 2*zoom, 4*zoom, 2*zoom ), 
     new THREE.MeshLambertMaterial( { color: 0xF0619A, flatShading: true } )
@@ -309,3 +309,3 @@ function Road() {
   const createSection = color => new THREE.Mesh(
-    new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ), 
+    new THREE.PlaneGeometry( boardWidth*zoom, positionWidth*zoom ), 
     new THREE.MeshPhongMaterial( { color } )
@@ -332,3 +332,3 @@ function Grass() {
   const createSection = color => new THREE.Mesh(
-    new THREE.BoxBufferGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ), 
+    new THREE.BoxGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ), 
     new THREE.MeshPhongMaterial( { color } )
```
