import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import * as OIMO from '../src/physics/PhysicsWorld.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Shape } from '../src/pirDiv/piramidka/Blocks/Shape.js';
import { VisuPhysics } from '../src/pirDiv/piramidka/Blocks/VisuPhysics.js';

// Keep the real Fox skeleton and mesh; omit textures for a browser-independent test.
const file = fs.readFileSync(new URL('../resources/models/Fox.glb', import.meta.url));
const length = file.readUInt32LE(12);
const json = JSON.parse(file.toString('utf8', 20, 20 + length));
for (const key of ['images', 'textures', 'materials', 'samplers']) delete json[key];
for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
const text = Buffer.from(JSON.stringify(json));
const jsonChunk = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 32)]);
const binaryChunk = file.subarray(20 + length);
const glb = Buffer.alloc(20 + jsonChunk.length + binaryChunk.length);
glb.write('glTF');
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(glb.length, 8);
glb.writeUInt32LE(jsonChunk.length, 12);
glb.writeUInt32LE(0x4e4f534a, 16);
jsonChunk.copy(glb, 20);
binaryChunk.copy(glb, 20 + jsonChunk.length);
const { scene: model } = await new GLTFLoader().parseAsync(glb.buffer, '');
const originalBounds = new THREE.Box3().setFromObject(model);
const originalSize = originalBounds.getSize(new THREE.Vector3());
const scale = 1 / Math.max(originalSize.x, originalSize.y, originalSize.z);
model.scale.setScalar(scale);
model.position.copy(originalBounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);

const world = new OIMO.World({ worldscale: 1 });
const block = { par: { world }, content3D: new THREE.Group() };
block.shape = new Shape(block);
block.visuPhysics = new VisuPhysics(block);
block.body = block.shape.initialize({ array: [{ type: 'model', size: [1, 1, 1] }], move: true });
block.content3D.add(model);
block.shape.createModelPhysics(model);
const physicsBounds = new THREE.Box3();
for (let shape = block.body.shapes; shape; shape = shape.next) {
  assert.equal(shape.type, 'convex');
  for (const vertex of shape.vertices) physicsBounds.expandByPoint(vertex);
}
const physicalSize = physicsBounds.getSize(new THREE.Vector3());
const visualSize = new THREE.Box3().setFromObject(model, true).getSize(new THREE.Vector3());
assert(Math.abs(Math.max(visualSize.x, visualSize.y, visualSize.z) - 1) < 1e-4);
for (const axis of ['x', 'y', 'z']) {
  assert(physicalSize[axis] >= visualSize[axis] * 0.95, 'Physics must cover the visible Fox');
  assert(Math.abs(physicalSize[axis] - visualSize[axis]) < 1e-4, 'Hull bounds must match the visible geometry');
}
assert.equal(block.body.numShapes, 1);
block.shape.arrShapes[0].parts = 1;
block.shape.createModelPhysics(model);
assert.equal(block.body.numShapes, 1, 'Explicit parts: 1 must keep a single hull');
block.shape.arrShapes[0].parts = 5;
const started = performance.now();
block.shape.createModelPhysics(model);
assert.equal(block.body.numShapes, 5, 'Fox must split into five convex shapes');
assert.equal(world.numRigidBodies, 1, 'Parts must remain one physical body');
for (let frame = 0; frame < 20; frame++) world.step();
assert(Number.isFinite(block.body.getPosition().y));
console.log('PASS: Fox decomposition into five convex parts in', Math.round(performance.now() - started), 'ms');
block.shape.arrShapes[0].primitiveParts = 10;
block.visuPhysics.active = true;
block.shape.createModelPhysics(model);
assert.equal(block.body.numShapes, 10, 'Primitive mode must fit ten simple shapes to the Fox');
assert.equal(world.numRigidBodies, 1);
const primitiveBounds = new THREE.Box3();
for (const shape of block.body.arrShapes) {
  assert.equal(shape.type, 'box');
  assert.equal(shape.vertices, null, 'Primitive mode must not use convex mesh colliders');
  assert(shape.native.getGeometry().constructor.name.includes('BoxGeometry'));
  const center = new THREE.Vector3().copy(shape.relativePosition);
  const half = new THREE.Vector3(shape.halfWidth, shape.halfHeight, shape.halfDepth);
  primitiveBounds.expandByPoint(center.clone().sub(half));
  primitiveBounds.expandByPoint(center.clone().add(half));
}
assert(primitiveBounds.getSize(new THREE.Vector3()).distanceTo(visualSize) < 1e-4);
assert.equal(block.visuPhysics.content3D.children.length, 10);
for (const mesh of block.visuPhysics.content3D.children) assert.equal(mesh.geometry.type, 'BoxGeometry');
for (let frame = 0; frame < 20; frame++) world.step();
assert(Number.isFinite(block.body.getPosition().y));
block.visuPhysics.dispose();
console.log('PASS: Fox fitted with ten native box shapes, matching bounds and debug primitives');
block.body.remove();
console.log('PASS: actual skinned Fox visual and collider scales match:', physicalSize.toArray());
