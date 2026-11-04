import * as THREE from 'three';
import { createConvexParts } from './ConvexParts.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class Shape {
  constructor(par) {
    this.par = par;
    this.arrShapes = [];
    this.arrShapePositions = [];
    this.arrShapeRotations = [];
    this.mirror = false;
  }

  initialize(options) {
    const { array, color, mirror = false, ...bodyOptions } = options;
    this.arrShapes = array;
    this.color = color;
    this.mirror = mirror;
    bodyOptions.type = array.map((shape) => shape.type === 'model' ? 'box' : shape.type);
    bodyOptions.size = array.flatMap((shape) => [
      shape.size[0], shape.size[1] ?? shape.size[0], shape.size[2] ?? shape.size[0]
    ]);
    bodyOptions.posShape = array.flatMap((shape) => shape.pos ?? [0, 0, 0]);
    bodyOptions.rotShape = array.flatMap((shape) => shape.rot ?? [0, 0, 0]);
    const body = this.par.par.world.add(bodyOptions);
    this.arrShapePositions = [];
    this.arrShapeRotations = [];
    const rotation = new THREE.Matrix4();
    for (let shape = body.shapes; shape; shape = shape.next) {
      this.arrShapePositions.push(new THREE.Vector3().copy(shape.relativePosition).multiplyScalar(body.scale));
      const e = shape.relativeRotation.elements;
      rotation.set(e[0], e[1], e[2], 0, e[3], e[4], e[5], 0, e[6], e[7], e[8], 0, 0, 0, 0, 1);
      this.arrShapeRotations.push(new THREE.Quaternion().setFromRotationMatrix(rotation));
    }
    return body;
  }

  create() {
    const block = this.par;
    for (let i = 0; i < this.arrShapes.length; i++) {
      const shape = this.arrShapes[i];
      const geometry = shape.type === 'sphere'
        ? new THREE.SphereGeometry(shape.size[0], 32, 24)
        : shape.type === 'cylinder'
          ? this.createCylinderGeometry(shape)
          : new RoundedBoxGeometry(shape.size[0], shape.size[1], shape.size[2], 2,
            Math.min(0.045, Math.min(...shape.size) * 0.06));
      const material = this.mirror
        ? block.par.par.managerScan.mirrorMaterial.clone()
          : (shape.color ?? this.color) === null
          ? window.managerMaterial.getBeautifulColor()
          : new THREE.MeshStandardMaterial({ color: shape.color ?? this.color, roughness: 0.65 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.block = block;
      mesh.userData.type = shape.type;
      mesh.position.copy(this.arrShapePositions[i]);
      mesh.quaternion.copy(this.arrShapeRotations[i]);
      block.content3D.add(mesh);
    }
    if (this.mirror) block.par.par.managerScan.mirrorObject = block.content3D;
  }

  createCylinderGeometry(shape) {
    const [radius, height] = shape.size;
    const bevel = Math.min(shape.bevel ?? 0, radius, height / 2);
    if (bevel <= 0) {
      return new THREE.CylinderGeometry(radius, radius, height, shape.segments ?? 32);
    }
    const half = height / 2;
    const points = [new THREE.Vector2(0, -half)];
    for (let i = 0; i <= 4; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 8;
      points.push(new THREE.Vector2(radius - bevel + Math.cos(angle) * bevel,
        -half + bevel + Math.sin(angle) * bevel));
    }
    for (let i = 0; i <= 4; i++) {
      const angle = i * Math.PI / 8;
      points.push(new THREE.Vector2(radius - bevel + Math.cos(angle) * bevel,
        half - bevel + Math.sin(angle) * bevel));
    }
    points.push(new THREE.Vector2(0, half));
    return new THREE.LatheGeometry(points, shape.segments ?? 32);
  }

  createModelPhysics(model) {
    if (!this.arrShapes.some((shape) => shape.type === 'model')) return;
    const block = this.par;
    block.content3D.updateWorldMatrix(true, false);
    block.content3D.updateMatrixWorld(true);
    const inverse = block.content3D.matrixWorld.clone().invert();
    const arrTriangles = [];
    model.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
      const matrix = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
      const index = mesh.geometry.index;
      const count = index?.count ?? mesh.geometry.attributes.position.count;
      const arrVertices = [];
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        arrVertices.push(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(matrix));
      }
      for (let i = 0; i + 2 < count; i += 3) {
        arrTriangles.push(new THREE.Triangle(
          arrVertices[index ? index.getX(i) : i],
          arrVertices[index ? index.getX(i + 1) : i + 1],
          arrVertices[index ? index.getX(i + 2) : i + 2]
        ));
      }
    });
    const modelShape = this.arrShapes.find((shape) => shape.type === 'model');
    const primitiveParts = Number(modelShape.primitiveParts);
    const usePrimitives = Number.isFinite(primitiveParts) && primitiveParts > 0;
    const arrHulls = createConvexParts(arrTriangles,
      usePrimitives ? primitiveParts : modelShape.parts ?? 1, usePrimitives ? 'box' : 'hull');
    if (!arrHulls.length) return;
    if (block.par.manager?.dragger.body === block.body) block.par.manager.dragger.stop();
    const debugActive = block.visuPhysics.active;
    block.visuPhysics.dispose();
    if (usePrimitives) {
      const arrPrimitives = arrHulls.map((points) => {
        const bounds = new THREE.Box3().setFromPoints(points);
        return { type: 'box', size: bounds.getSize(new THREE.Vector3()).toArray(),
          position: bounds.getCenter(new THREE.Vector3()).toArray() };
      });
      block.par.world.setPrimitiveShapes(block.body, arrPrimitives);
    } else block.par.world.setConvexShapes(block.body, arrHulls);
    block.visuPhysics.active = debugActive;
  }
}
