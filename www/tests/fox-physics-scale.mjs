import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import * as OIMO from '../node_modules/oimo/build/oimo.module.js';
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
  const centre = new THREE.Vector3().copy(shape.relativePosition);
  const half = new THREE.Vector3(shape.halfWidth, shape.halfHeight, shape.halfDepth);
  physicsBounds.expandByPoint(centre.clone().sub(half));
  physicsBounds.expandByPoint(centre.clone().add(half));
}
const physicalSize = physicsBounds.getSize(new THREE.Vector3());
const visualSize = new THREE.Box3().setFromObject(model, true).getSize(new THREE.Vector3());
assert(Math.abs(Math.max(visualSize.x, visualSize.y, visualSize.z) - 1) < 1e-4);
for (const axis of ['x', 'y', 'z']) {
  assert(physicalSize[axis] >= visualSize[axis] * 0.95, 'Physics must cover the visible Fox');
  assert(physicalSize[axis] <= visualSize[axis] + 0.21, 'Voxel expansion must remain bounded');
}
block.body.remove();
console.log('PASS: actual skinned Fox visual and collider scales match:', physicalSize.toArray());
