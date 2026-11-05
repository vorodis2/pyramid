import * as THREE from 'three';

// A solid compound body made of interwoven hexagonal loops and simple limbs.
export function createAssistantCharacter() {
  const teal = 0x287c78;
  const cream = 0xf1eee5;
  const arrShapes = [];
  const addSphere = (point, radius, color) => {
    arrShapes.push({ type: 'sphere', size: [radius], pos: point.toArray(), color });
  };
  const addSegment = (start, end, radius, color) => {
    const direction = end.clone().sub(start);
    const rotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), 'XYZ'
    );
    arrShapes.push({
      type: 'cylinder', size: [radius, direction.length()],
      pos: start.clone().add(end).multiplyScalar(0.5).toArray(),
      rot: [rotation.x, rotation.y, rotation.z].map(THREE.MathUtils.radToDeg), color
    });
  };
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const color = i % 2 === 0 ? teal : cream;
    const arrPoints = [];
    for (let j = 0; j < 6; j++) {
      const corner = angle + Math.PI / 6 + j * Math.PI / 3;
      arrPoints.push(new THREE.Vector3(
        Math.cos(angle) * 0.37 + Math.cos(corner) * 0.57,
        1.6 + Math.sin(angle) * 0.37 + Math.sin(corner) * 0.57,
        Math.sin(j * Math.PI / 3 + angle) * 0.16
      ));
    }
    for (let j = 0; j < 6; j++) {
      addSphere(arrPoints[j], 0.105, color);
      addSegment(arrPoints[j], arrPoints[(j + 1) % 6], 0.095, color);
    }
  }
  for (const side of [-1, 1]) {
    const hip = new THREE.Vector3(side * 0.3, 0.85, 0);
    const knee = new THREE.Vector3(side * 0.36, 0.49, 0.03);
    const ankle = new THREE.Vector3(side * 0.43, 0.2, 0.08);
    addSegment(hip, knee, 0.09, teal);
    addSphere(knee, 0.12, cream);
    addSegment(knee, ankle, 0.09, teal);
    arrShapes.push({ type: 'box', size: [0.39, 0.18, 0.46], pos: [side * 0.43, 0.09, 0.16], color: cream });
    const shoulder = new THREE.Vector3(side * 0.75, 1.55, 0);
    const elbow = new THREE.Vector3(side * 1.05, 1.18, 0.02);
    const hand = new THREE.Vector3(side * 0.8, 0.92, 0.22);
    addSegment(shoulder, elbow, 0.085, teal);
    addSphere(elbow, 0.1, teal);
    addSegment(elbow, hand, 0.085, teal);
    addSphere(hand, 0.15, cream);
    addSphere(new THREE.Vector3(side * 0.16, 1.97, 0.32), 0.14, cream);
    addSphere(new THREE.Vector3(side * 0.14, 1.98, 0.445), 0.065, 0x252b2b);
    addSphere(new THREE.Vector3(side * 0.14 - 0.018, 2.005, 0.495), 0.021, 0xffffff);
    arrShapes.push({ type: 'box', size: [0.32, 0.075, 0.12], pos: [side * 0.19, 2.17, 0.4], rot: [0, 0, side * 14], color: teal });
  }
  // Oimo treats the body origin as its center of mass. Weight each primitive
  // by volume (all shapes use the same density), then center both mesh and collider.
  const center = new THREE.Vector3();
  let volume = 0;
  for (const shape of arrShapes) {
    const [radius, height, depth] = shape.size;
    const weight = shape.type === 'sphere' ? 4 / 3 * Math.PI * radius ** 3
      : shape.type === 'cylinder' ? Math.PI * radius ** 2 * height
        : radius * height * depth;
    center.addScaledVector(new THREE.Vector3().fromArray(shape.pos), weight);
    volume += weight;
  }
  center.divideScalar(volume);
  // Lower the balance point toward the soles without placing it at the feet.
  center.y *= 0.7;
  center.z += 0.08;
  for (const shape of arrShapes) {
    shape.pos = new THREE.Vector3().fromArray(shape.pos).sub(center).toArray();
  }
  return { arrShapes, center };
}
