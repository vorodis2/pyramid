import * as THREE from 'three';

// One compound body: every visible primitive also participates in collisions.
export function createSpiderShapes(scale = 1) {
  const bodyColor = 0x657991;
  const jointColor = 0xefa64f;
  const arrShapes = [
    { type: 'sphere', size: [0.72], pos: [0, 0.25, -0.55], color: bodyColor },
    { type: 'sphere', size: [0.46], pos: [0, 0.05, 0.42], color: bodyColor }
  ];
  for (const side of [-1, 1]) {
    arrShapes.push({ type: 'sphere', size: [0.085], pos: [side * 0.16, 0.1, 0.85], color: 0x26394d });
    for (let i = 0; i < 4; i++) {
      const z = -0.65 + i * 0.4;
      const spread = (i - 1.5) * 0.45;
      const arrPoints = [
        new THREE.Vector3(side * 0.4, 0.05, z),
        new THREE.Vector3(side * 1.1, 0.45, z + spread),
        new THREE.Vector3(side * 1.55, -0.05, z + spread * 1.5),
        new THREE.Vector3(side * 1.7, -0.65, z + spread * 1.7)
      ];
      for (let j = 0; j < arrPoints.length; j++) {
        const point = arrPoints[j];
        if (j < 3) {
          arrShapes.push({ type: 'sphere', size: [0.105], pos: point.toArray(), color: jointColor });
          const next = arrPoints[j + 1];
          const direction = next.clone().sub(point);
          const rotation = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), 'XYZ'
          );
          arrShapes.push({
            type: 'cylinder', size: [0.07, direction.length()],
            pos: point.clone().add(next).multiplyScalar(0.5).toArray(),
            rot: [rotation.x, rotation.y, rotation.z].map(THREE.MathUtils.radToDeg), color: 0x91a0b5
          });
        } else {
          arrShapes.push({ type: 'box', size: [0.25, 0.12, 0.3], pos: point.toArray(), color: bodyColor });
        }
      }
    }
  }
  return arrShapes.map((shape) => ({
    ...shape,
    size: shape.size.map((value) => value * scale),
    pos: shape.pos.map((value) => value * scale)
  }));
}
