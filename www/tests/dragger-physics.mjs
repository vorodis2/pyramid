import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as OIMO from '../src/physics/PhysicsWorld.js';
import { Dragger } from '../src/pirDiv/piramidka/Manager/Dragger.js';

const listeners = new Map();
globalThis.window = {
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener: (name) => listeners.delete(name)
};
const world = new OIMO.World({ worldscale: 1, gravity: [0, 0, 0], random: false });
const scene = new THREE.Scene();
const content3D = new THREE.Object3D();
scene.add(content3D);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 1, 8);
camera.lookAt(0, 1, 0);
scene.add(camera);
const controls = { pause: false, boolDrag: false };
const scan = {
  scene, camera, visi3D: { position3d: controls },
  renderer: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }) } }
};
const pyramid = { world, content3D, par: { managerScan: scan } };
const dragger = new Dragger({ par: pyramid });
assert.doesNotThrow(() => dragger.stop(), 'Cleanup before the first drag must be safe');
const uninitialized = new Dragger({ par: {} });
assert.doesNotThrow(() => uninitialized.drawObject(), 'Empty selection without a physics world must be safe');
const body = world.add({ type: 'box', size: [1, 1, 1], pos: [0, 1, 0], rot: [0, 30, 0], move: true });
const localPoint = new THREE.Vector3(0.3, 0.2, 0.1);
const clickPoint = localPoint.clone().applyQuaternion(body.getQuaternion()).add(body.getPosition());

for (let cycle = 0; cycle < 8; cycle++) {
  const point = localPoint.clone().applyQuaternion(body.getQuaternion()).add(body.getPosition());
  dragger.blockEventActive = { block: { body }, point, originalEvent: { button: 0 } };
  assert.equal(world.numJoints, 1);
  assert.equal(world.numRigidBodies, 2);
  assert.equal(controls.pause, true);
  assert.equal(dragger.visual.parent, content3D);
  let liveResources = 0;
  dragger.visual.traverse((object) => {
    for (const resource of [object.geometry, object.material]) {
      if (!resource) continue;
      liveResources++;
      resource.addEventListener('dispose', () => liveResources--);
    }
  });
  assert(new THREE.Vector3().copy(dragger.joint.localAnchorPoint2).distanceTo(localPoint) < 1e-6);
  const destination = point.clone().add(new THREE.Vector3(0.15, 0.1, 0));
  const screen = destination.clone().project(camera);
  dragger.move({ clientX: (screen.x + 1) * 400, clientY: (1 - screen.y) * 400, preventDefault() {} });
  assert(dragger.blockPoint.position.distanceTo(dragger.worldPoint.position) > 0.1);
  for (let frame = 0; frame < 90; frame++) world.step();
  const actual = localPoint.clone().applyQuaternion(body.getQuaternion()).add(body.getPosition());
  dragger.update();
  const positions = dragger.line.geometry.attributes.position;
  assert(new THREE.Vector3().fromBufferAttribute(positions, 0).distanceTo(actual) < 1e-5);
  assert(new THREE.Vector3().fromBufferAttribute(positions, positions.count - 1).distanceTo(destination) < 1e-5);
  assert([...positions.array].every(Number.isFinite), 'Spring vertices must remain finite');
  assert(actual.distanceTo(destination) < 0.05, 'Joint must pull the clicked point toward the cursor');
  dragger.stop();
  dragger.stop();
  assert.equal(world.numJoints, 0);
  assert.equal(world.numRigidBodies, 1);
  assert.equal(controls.pause, false);
  assert.equal(listeners.size, 0);
  assert.equal(liveResources, 0);
  assert.equal(content3D.children.length, 0);
}
dragger.blockEventActive = { block: { body }, point: clickPoint, originalEvent: { button: 2 } };
assert.equal(world.numJoints, 0, 'Right click must not start dragging');
dragger.blockEventActive = { block: { body }, point: clickPoint, originalEvent: { button: 0 } };
body.remove();
dragger.stop();
assert.equal(world.numJoints, 0, 'Deleting a grabbed body must not double-remove its joint');
assert.equal(world.numRigidBodies, 0);
console.log('PASS: cursor joint, local anchor, repeated drags, controls, release and deleted-body cleanup');
