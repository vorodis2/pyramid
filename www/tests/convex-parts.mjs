import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { createConvexParts } from '../src/pirDiv/piramidka/Blocks/ConvexParts.js';

function boxTriangles(size, position) {
  const geometry = new THREE.BoxGeometry(...size);
  const triangles = [];
  for (let i = 0; i < geometry.index.count; i += 3) {
    const points = [0, 1, 2].map((offset) => new THREE.Vector3()
      .fromBufferAttribute(geometry.attributes.position, geometry.index.getX(i + offset)).add(position));
    triangles.push(new THREE.Triangle(...points));
  }
  geometry.dispose();
  return triangles;
}

function volume(vertices) {
  const hull = new ConvexHull().setFromPoints(vertices);
  let result = 0;
  for (const face of hull.faces) {
    result += face.edge.head().point.dot(new THREE.Vector3().crossVectors(
      face.edge.next.head().point, face.edge.next.next.head().point
    )) / 6;
  }
  return Math.abs(result);
}

const triangles = [
  ...boxTriangles([3, 1, 1], new THREE.Vector3(0, -1, 0)),
  ...boxTriangles([1, 3, 1], new THREE.Vector3(-1, 0, 0)),
  ...boxTriangles([1, 3, 1], new THREE.Vector3(1, 0, 0))
];
const single = createConvexParts(triangles);
const parts = createConvexParts(triangles, 5);
assert.equal(single.length, 1);
assert(parts.length > 1 && parts.length <= 5);
assert(parts.reduce((sum, points) => sum + volume(points), 0) < volume(single[0]) * 0.9,
  'Decomposition must reduce the empty volume filling the concavity');
const hulls = parts.map((points) => new ConvexHull().setFromPoints(points));
for (const triangle of triangles) {
  for (const point of [triangle.a, triangle.b, triangle.c, triangle.getMidpoint(new THREE.Vector3())]) {
    assert(hulls.some((hull) => hull.containsPoint(point)), 'Parts must cover the original surface');
  }
}
assert.equal(createConvexParts(boxTriangles([1, 1, 1], new THREE.Vector3()), 5).length, 1,
  'A convex box does not need artificial subdivisions');
assert.deepEqual(createConvexParts([], 5), []);
console.log('PASS: part limits, preserved surface and improved concavity approximation');
