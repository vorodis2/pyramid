import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/physics/PhysicsWorld.js';
import { Shape } from '../src/pirDiv/piramidka/Blocks/Shape.js';
import { VisuPhysics } from '../src/pirDiv/piramidka/Blocks/VisuPhysics.js';

for (const worldscale of [1, 10]) {
  const world = new World({ worldscale });
  const block = { par: { world }, content3D: new THREE.Group() };
  const shape = new Shape(block);
  block.body = shape.initialize({
    color: 0xffffff, move: true, pos: [3, 4, -2], rot: [10, 25, 5],
    array: [
      { type: 'sphere', size: [0.6], pos: [0, 0, 0] },
      { type: 'box', size: [0.8, 0.9, 1.1], pos: [1, 0.3, 0.2], rot: [0, 0, 35] },
      { type: 'cylinder', size: [0.4, 1.2], pos: [-2, 0.5, 1], rot: [25, -10, 5] }
    ]
  });
  shape.create();
  block.content3D.position.copy(block.body.getPosition());
  block.content3D.quaternion.copy(block.body.getQuaternion());
  block.content3D.updateMatrixWorld(true);
  const arrMeshes = [...block.content3D.children];
  const debug = new VisuPhysics(block);
  debug.active = true;
  const arrTypes = ['SphereGeometry', 'RoundedBoxGeometry', 'CylinderGeometry'];
  for (let i = 0; i < arrMeshes.length; i++) {
    const mesh = arrMeshes[i];
    const physical = block.body.arrShapes[i];
    assert.equal(mesh.geometry.type, arrTypes[i]);
    const local = physical.native.getLocalTransform();
    const worldPoint = block.body.native.getWorldPoint(local.getPosition());
    assert(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3().copy(worldPoint)) < 1e-6);
    const r = local.getRotation();
    const expectedRotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(
      r.e00, r.e01, r.e02, 0, r.e10, r.e11, r.e12, 0, r.e20, r.e21, r.e22, 0, 0, 0, 0, 1
    ));
    assert(mesh.quaternion.angleTo(expectedRotation) < 1e-6);
    assert(mesh.position.distanceTo(debug.content3D.children[i].position) < 1e-6);
    assert(mesh.quaternion.angleTo(debug.content3D.children[i].quaternion) < 1e-6);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  debug.dispose();
  block.body.remove();
}
console.log('PASS: compound shape order, offsets, rotations, native transforms and debug meshes at both scales');
