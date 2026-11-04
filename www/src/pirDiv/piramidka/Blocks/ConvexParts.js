import * as THREE from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

function makePart(triangles) {
  const unique = new Map();
  for (const triangle of triangles) for (const point of [triangle.a, triangle.b, triangle.c]) {
    unique.set(point.toArray().map((v) => v.toFixed(8)).join(','), point);
  }
  const points = [...unique.values()];
  if (points.length < 4) return null;
  const bounds = new THREE.Box3().setFromPoints(points);
  const extent = bounds.getSize(new THREE.Vector3()).length();
  const epsilon = Math.max(extent * 1e-8, 1e-10);
  const origin = points[0];
  const axis = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (const point of points) {
    delta.subVectors(point, origin);
    if (delta.lengthSq() > axis.lengthSq()) axis.copy(delta);
  }
  for (const point of points) {
    delta.subVectors(point, origin).cross(axis);
    if (delta.lengthSq() > normal.lengthSq()) normal.copy(delta);
  }
  if (normal.length() < epsilon * extent) return null;
  normal.normalize();
  if (!points.some((point) => Math.abs(delta.subVectors(point, origin).dot(normal)) > epsilon)) return null;
  const hull = new ConvexHull().setFromPoints(points);
  const vertices = new Set();
  let signedVolume = 0;
  for (const face of hull.faces) {
    const a = face.edge.head().point;
    const b = face.edge.next.head().point;
    const c = face.edge.next.next.head().point;
    signedVolume += a.dot(delta.crossVectors(b, c)) / 6;
    let edge = face.edge;
    do { vertices.add(edge.head().point); edge = edge.next; } while (edge !== face.edge);
  }
  const volume = Math.abs(signedVolume);
  if (volume < epsilon ** 3) return null;
  return { triangles, vertices: [...vertices], volume, bounds, bestSplit: undefined };
}

function clip(triangle, axis, position, side) {
  const input = [triangle.a, triangle.b, triangle.c];
  const polygon = [];
  for (let i = 0; i < input.length; i++) {
    const a = input[i];
    const b = input[(i + 1) % input.length];
    const da = (a[axis] - position) * side;
    const db = (b[axis] - position) * side;
    if (da <= 0) polygon.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      polygon.push(a.clone().lerp(b, da / (da - db)));
    }
  }
  const triangles = [];
  for (let i = 1; i + 1 < polygon.length; i++) {
    const result = new THREE.Triangle(polygon[0], polygon[i], polygon[i + 1]);
    if (result.getArea() > 1e-14) triangles.push(result);
  }
  return triangles;
}

function bestSplit(part, cost) {
  if (part.bestSplit !== undefined) return part.bestSplit;
  let best = null;
  // Prefer cuts which remove the largest volume of empty space from the hull.
  for (const axis of ['x', 'y', 'z']) for (const fraction of [0.25, 0.5, 0.75]) {
    const position = THREE.MathUtils.lerp(part.bounds.min[axis], part.bounds.max[axis], fraction);
    const left = [];
    const right = [];
    for (const triangle of part.triangles) {
      left.push(...clip(triangle, axis, position, 1));
      right.push(...clip(triangle, axis, position, -1));
    }
    const a = makePart(left);
    const b = makePart(right);
    if (!a || !b) continue;
    const gain = cost(part) - cost(a) - cost(b);
    if (gain > cost(part) * 1e-5 && (!best || gain > best.gain)) best = { gain, parts: [a, b] };
  }
  part.bestSplit = best;
  return best;
}

export function createConvexParts(triangles, count = 1, mode = 'hull') {
  const first = makePart(triangles);
  if (!first) return [];
  const limit = Number.isFinite(Number(count)) ? Math.max(1, Math.floor(Number(count))) : 1;
  const parts = [first];
  const cost = mode === 'box' ? (part) => {
    const size = part.bounds.getSize(new THREE.Vector3());
    return size.x * size.y * size.z;
  } : (part) => part.volume;
  while (parts.length < limit) {
    let index = -1;
    let selected = null;
    for (let i = 0; i < parts.length; i++) {
      const split = bestSplit(parts[i], cost);
      if (split && (!selected || split.gain > selected.gain)) { index = i; selected = split; }
    }
    if (!selected) break;
    parts.splice(index, 1, ...selected.parts);
  }
  return parts.map((part) => part.vertices);
}
