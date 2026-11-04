import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as OIMO from '../node_modules/oimo/build/oimo.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Piramidka } from '../src/pirDiv/piramidka/Piramidka.js';
import { Block } from '../src/pirDiv/piramidka/Blocks/Block.js';

const storage = new Map();
globalThis.window = {
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  managerMaterial: { getBeautifulColor: () => new THREE.MeshStandardMaterial() },
  visi3D: { addChildMouse() {}, removeChildMouse() {}, addEvent() {} }
};
const arrRequests = [];
GLTFLoader.prototype.loadAsync = () => {
  const request = Promise.withResolvers();
  arrRequests.push(request);
  return request.promise;
};
const model = () => {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  return { scene };
};
const world = new OIMO.World({ worldscale: 1 });
const scan = { content3d: new THREE.Group(), mirrorMaterial: new THREE.MeshStandardMaterial(), visi3D: window.visi3D };
const arrProgress = [];
const pyramid = new Piramidka({ managerPhysik: { world }, managerScan: scan }, (name, event) => {
  if (name === 'loadProgress') arrProgress.push(event);
});
try {
  const firstFox = pyramid.arrBlock.find((block) => block.source);
  assert.equal(pyramid.loading, true);
  assert.equal(firstFox.boolLoad, false);
  assert(pyramid.arrPiramidka.every((block) => block.boolLoad));
  const pending = pyramid.checkLoading();
  const arrModels = pyramid.arrBlock.filter((block) => block.source);
  assert.equal(arrModels.length, 3);
  assert.equal(pending.total, 3, 'Instant primitives must not count toward loading progress');
  assert.equal(pending.loaded, 0);
  assert.equal(pending.percent, 0);
  const initialRequests = arrRequests.length;
  const started = performance.now();
  for (const request of arrRequests) request.resolve(model());
  await Promise.resolve();
  assert.equal(firstFox.boolLoad, false, 'Simulated loading must remain pending during the delay');
  await Promise.all(arrModels.map((block) => block.modelReady));
  assert(performance.now() - started >= 490, 'Temporary delay must be at least half a second');
  assert.equal(firstFox.boolLoad, true);
  firstFox.content3D.traverse((object) => {
    if (object.isMesh) assert.equal(object.userData.block, firstFox);
  });
  assert.equal(pyramid.checkLoading().percent, 100);
  assert.equal(pyramid.loading, false);
  pyramid.restartPiramidka(6, 'base');
  assert.equal(pyramid.loading, true);
  assert.equal(arrProgress.at(-1).percent, 0);
  assert.equal(pyramid.checkLoading().active, false);

  const block = new Block(pyramid);
  const options = { color: null, array: [{ type: 'box', size: [1, 1, 1] }], move: true };
  assert.equal(block.boolLoad, false);
  block.initialize(options);
  assert.equal(block.boolLoad, false);
  block.addPrimitive();
  assert.equal(block.boolLoad, true);
  block.initialize({ ...options, object3D: { src: 'first.glb' } });
  block.addPrimitive();
  const oldReady = block.modelReady;
  block.initialize({ ...options, object3D: { src: 'second.glb' } });
  block.addPrimitive();
  arrRequests[initialRequests].resolve(model());
  await oldReady;
  assert.equal(block.boolLoad, false, 'Old responses must not finish the current load');
  arrRequests[initialRequests + 1].resolve(model());
  await block.modelReady;
  assert.equal(block.boolLoad, true);
  block.delete();
  assert.equal(block.boolLoad, false);
} finally {
  pyramid.clear();
  scan.mirrorMaterial.dispose();
}
assert.equal(world.numRigidBodies, 0);
console.log('PASS: primitive/model readiness, real progress, restarts, stale responses and deletion');
