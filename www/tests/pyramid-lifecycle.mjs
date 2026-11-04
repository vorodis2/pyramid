import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as OIMO from '../src/physics/PhysicsWorld.js';
import { Piramidka } from '../src/pirDiv/piramidka/Piramidka.js';

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  },
  managerMaterial: { getBeautifulColor: () => new THREE.MeshStandardMaterial() }
};
const world = new OIMO.World({ worldscale: 1, gravity: [0, -9.81, 0], random: false });
// Keep this synchronous lifecycle check independent of browser texture loading.
GLTFLoader.prototype.loadAsync = async () => ({ scene: new THREE.Object3D() });
const mouseObjects = new Set();
const scan = {
  content3d: new THREE.Object3D(), mirrorMaterial: new THREE.MeshStandardMaterial(),
  visi3D: {
    addEvent() {},
    addChildMouse: (object) => mouseObjects.add(object),
    removeChildMouse: (object) => mouseObjects.delete(object)
  }
};
window.visi3D = scan.visi3D;
const arrEvents = [];
const pyramid = new Piramidka({ managerPhysik: { world }, managerScan: scan },
  (name, event) => {
    if (name !== 'blockEventActive') return;
    pyramid.manager.blockEventActive = event;
    arrEvents.push({ name, event });
  });
let geometries = 0;
let materials = 0;
const trackDisposal = () => {
  pyramid.content3D.traverse((object) => {
    if (!object.isMesh) return;
    geometries++;
    materials++;
    object.geometry.addEventListener('dispose', () => geometries--);
    object.material.addEventListener('dispose', () => materials--);
  });
};
trackDisposal();

try {
  const selected = pyramid.arrPiramidka[0];
  const selectedContent = selected.content3D;
  const previousCount = pyramid.getBlockCount();
  for (let body = world.rigidBodies; body; body = body.next) {
    if (body.isDynamic) body.sleep();
  }
  pyramid.manager.blockEventActive = pyramid.manager.getEventBlock({target: selected.content3D.children[0]});
  pyramid.removeBlock(selected);
  for (let body = world.rigidBodies; body; body = body.next) {
    if (body.isDynamic) assert.equal(body.sleeping, false, 'Remaining bodies must wake after deletion');
  }
  assert.equal(pyramid.getBlockCount(), previousCount - 1);
  assert(!pyramid.arrPiramidka.includes(selected));
  assert(!mouseObjects.has(selectedContent));
  assert.equal(selected.body, null);
  assert.equal(pyramid.manager.blockEventActive.block, null);
  assert.equal(arrEvents.length, 1);
  assert.equal(arrEvents[0].name, 'blockEventActive');
  assert.equal(arrEvents[0].event.block, null);
  pyramid.removeBlock(selected);
  assert.equal(arrEvents.length, 1);
  for (const type of ['base', 'wide', 'spiral']) {
    for (let cycle = 0; cycle < 8; cycle++) {
      pyramid.restartPiramidka(5, type);
      // Only newly created pyramid meshes need new disposal listeners.
      for (const block of pyramid.arrPiramidka) {
        block.content3D.traverse((object) => {
          if (!object.isMesh) return;
          geometries++;
          materials++;
          object.geometry.addEventListener('dispose', () => geometries--);
          object.material.addEventListener('dispose', () => materials--);
        });
      }
      for (let frame = 0; frame < 40; frame++) world.step();
      const liveBodies = new Set();
      for (let body = world.rigidBodies; body; body = body.next) liveBodies.add(body);
      for (let contact = world.contacts; contact; contact = contact.next) {
        assert(liveBodies.has(contact.body1), 'Contact retains deleted body1');
        assert(liveBodies.has(contact.body2), 'Contact retains deleted body2');
      }
      assert.equal(world.numRigidBodies, pyramid.getBlockCount());
      assert.equal(mouseObjects.size, pyramid.getBlockCount());
      assert.equal(geometries, pyramid.getBlockCount());
      assert.equal(materials, pyramid.getBlockCount());
    }
  }
} finally {
  pyramid.clear();
  scan.mirrorMaterial.dispose();
}
assert.equal(world.numRigidBodies, 0);
assert.equal(world.numContacts, 0);
assert.equal(mouseObjects.size, 0);
assert.equal(geometries, 0);
assert.equal(materials, 0);
console.log('PASS: 24 rebuilds; no stale contacts; all bodies, geometries and materials released.');
