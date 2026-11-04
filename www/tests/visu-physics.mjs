import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as OIMO from '../src/physics/PhysicsWorld.js';
import { VisuPhysics } from '../src/pirDiv/piramidka/Blocks/VisuPhysics.js';
import { BStatus } from '../src/pirDiv/piramidka/Blocks/BStatus.js';

const world = new OIMO.World({ worldscale: 10 });
const body = world.add({
  type: ['box', 'sphere', 'cylinder'], size: [2, 3, 4, 1, 1, 1, 0.5, 2, 0.5],
  posShape: [1, 2, 0, -2, 0, 0, 0, 1, 2], move: true
});
const block = { body, content3D: new THREE.Group() };
const original = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
block.content3D.add(original);
const debug = new VisuPhysics(block);
assert.equal(debug.content3D, null);
debug.active = true;
assert.equal(debug.content3D.children.length, 3);
let shape = body.shapes;
let resources = 1;
debug.material.addEventListener('dispose', () => resources--);
for (const mesh of debug.content3D.children) {
  assert(mesh.position.distanceTo(new THREE.Vector3().copy(shape.relativePosition).multiplyScalar(10)) < 1e-6);
  if (shape.width !== undefined) {
    assert.equal(mesh.geometry.parameters.width, shape.width * 10);
    assert.equal(mesh.geometry.parameters.depth, shape.depth * 10);
  } else assert.equal(mesh.geometry.parameters.radius ?? mesh.geometry.parameters.radiusTop, shape.radius * 10);
  const arrHits = [];
  mesh.raycast({}, arrHits);
  assert.equal(arrHits.length, 0);
  resources++;
  mesh.geometry.addEventListener('dispose', () => resources--);
  shape = shape.next;
}
const status = new BStatus(block);
status.active = true;
assert.equal(status.arrOverlays.length, 1, 'Selection must ignore physics debug meshes');
status.dispose();
const group = debug.content3D;
debug.active = false;
assert.equal(group.visible, false);
debug.active = true;
assert.equal(debug.content3D, group, 'Toggling must reuse debug geometry');
debug.dispose();
assert.equal(resources, 0);
assert.equal(block.content3D.children.length, 1);
original.geometry.dispose();
original.material.dispose();
body.remove();
console.log('PASS: compound shapes, world scale, selection isolation, lazy reuse and disposal');
