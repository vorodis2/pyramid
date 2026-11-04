import * as THREE from 'three';

export class Shape {
  constructor(par) {
    this.par = par;
    this.arrShapes = [];
    this.arrShapePositions = [];
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
    const body = this.par.par.world.add(bodyOptions);
    this.arrShapePositions = [];
    for (let shape = body.shapes; shape; shape = shape.next) {
      this.arrShapePositions.unshift(new THREE.Vector3().copy(shape.relativePosition));
    }
    return body;
  }

  create() {
    const block = this.par;
    for (let i = 0; i < this.arrShapes.length; i++) {
      const shape = this.arrShapes[i];
      const geometry = shape.type === 'sphere'
        ? new THREE.SphereGeometry(shape.size[0], 32, 24)
        : new THREE.BoxGeometry(...shape.size);
      const material = this.mirror
        ? block.par.par.managerScan.mirrorMaterial.clone()
        : this.color === null
          ? window.managerMaterial.getBeautifulColor()
          : new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.65 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.block = block;
      mesh.userData.type = shape.type;
      mesh.position.copy(this.arrShapePositions[i]);
      block.content3D.add(mesh);
    }
    if (this.mirror) block.par.par.managerScan.mirrorObject = block.content3D;
  }

  createModelPhysics(model) {
    if (!this.arrShapes.some((shape) => shape.type === 'model')) return;
    const block = this.par;
    const body = block.body;
    block.content3D.updateWorldMatrix(true, false);
    // SkinnedMesh updates bindMatrixInverse in updateMatrixWorld, not updateWorldMatrix.
    block.content3D.updateMatrixWorld(true);
    model.traverse((object) => { if (object.isSkinnedMesh) object.skeleton.update(); });
    const inverse = block.content3D.matrixWorld.clone().invert();
    const arrTriangles = [];
    const bounds = new THREE.Box3();
    model.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
      const matrix = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
      const index = mesh.geometry.index;
      const count = index?.count ?? mesh.geometry.attributes.position.count;
      for (let i = 0; i + 2 < count; i += 3) {
        const triangle = new THREE.Triangle();
        for (const [offset, vertex] of [[0, triangle.a], [1, triangle.b], [2, triangle.c]]) {
          mesh.getVertexPosition(index ? index.getX(i + offset) : i + offset, vertex);
          vertex.applyMatrix4(matrix);
          bounds.expandByPoint(vertex);
        }
        arrTriangles.push(triangle);
      }
    });
    if (!arrTriangles.length || bounds.isEmpty()) return;
    const size = bounds.getSize(new THREE.Vector3());
    const cell = Math.max(size.x, size.y, size.z) / 10;
    if (!Number.isFinite(cell) || cell <= 0) return;
    const nx = Math.max(1, Math.ceil(size.x / cell));
    const ny = Math.max(1, Math.ceil(size.y / cell));
    const nz = Math.max(1, Math.ceil(size.z / cell));
    const occupied = new Set();
    const triangleBounds = new THREE.Box3();
    const cellBounds = new THREE.Box3();
    for (const triangle of arrTriangles) {
      triangleBounds.setFromPoints([triangle.a, triangle.b, triangle.c]);
      const x0 = Math.min(nx - 1, Math.max(0, Math.floor((triangleBounds.min.x - bounds.min.x) / cell)));
      const y0 = Math.min(ny - 1, Math.max(0, Math.floor((triangleBounds.min.y - bounds.min.y) / cell)));
      const z0 = Math.min(nz - 1, Math.max(0, Math.floor((triangleBounds.min.z - bounds.min.z) / cell)));
      const x1 = Math.min(nx - 1, Math.floor((triangleBounds.max.x - bounds.min.x) / cell));
      const y1 = Math.min(ny - 1, Math.floor((triangleBounds.max.y - bounds.min.y) / cell));
      const z1 = Math.min(nz - 1, Math.floor((triangleBounds.max.z - bounds.min.z) / cell));
      for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        cellBounds.min.set(bounds.min.x + x * cell, bounds.min.y + y * cell, bounds.min.z + z * cell);
        cellBounds.max.copy(cellBounds.min).addScalar(cell);
        if (cellBounds.intersectsTriangle(triangle)) occupied.add(x + nx * (y + ny * z));
      }
    }
    if (!occupied.size) return;
    const template = body.shapes;
    const BoxShape = template.constructor;
    const arrPhysicsShapes = [];
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (!occupied.has(x + nx * (y + ny * z))) continue;
        const start = x;
        while (x + 1 < nx && occupied.has(x + 1 + nx * (y + ny * z))) x++;
        const width = (x - start + 1) * cell;
        const config = {
          relativePosition: template.relativePosition.clone().set(
            (bounds.min.x + start * cell + width / 2) / body.scale,
            (bounds.min.y + (y + 0.5) * cell) / body.scale,
            (bounds.min.z + (z + 0.5) * cell) / body.scale
          ),
          relativeRotation: template.relativeRotation.clone().identity(),
          density: template.density, friction: template.friction, restitution: template.restitution,
          belongsTo: template.belongsTo, collidesWith: template.collidesWith
        };
        arrPhysicsShapes.push(new BoxShape(config, width / body.scale, cell / body.scale, cell / body.scale));
      }
    }
    if (block.par.manager?.dragger.body === body) block.par.manager.dragger.stop();
    const debugActive = block.visuPhysics.active;
    block.visuPhysics.dispose();
    while (body.contactLink) block.par.world.removeContact(body.contactLink.contact);
    while (body.shapes) body.removeShape(body.shapes);
    for (const shape of arrPhysicsShapes) body.addShape(shape);
    body.setupMass(body.type, false);
    body.awake();
    block.visuPhysics.active = debugActive;
  }
}
