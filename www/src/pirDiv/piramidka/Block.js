import * as THREE from 'three';

export class Block {
  constructor(par) {
    this.par = par;
    let arrShapes;
    let arrShapePositions;
    let color;
    let mirror;

    this.initialize = (options) => {
      this.delete();
      const { array, color: blockColor, mirror: blockMirror = false, ...bodyOptions } = options;
      arrShapes = array;
      color = blockColor;
      mirror = blockMirror;
      bodyOptions.type = arrShapes.map((shape) => shape.type);
      bodyOptions.size = arrShapes.flatMap((shape) => [
        shape.size[0], shape.size[1] ?? shape.size[0], shape.size[2] ?? shape.size[0]
      ]);
      bodyOptions.posShape = arrShapes.flatMap((shape) => shape.pos ?? [0, 0, 0]);
      this.content3D = new THREE.Object3D();
      this.par.content3D.add(this.content3D);
      this.body = this.par.world.add(bodyOptions);
      arrShapePositions = [];
      for (let shape = this.body.shapes; shape; shape = shape.next) {
        arrShapePositions.unshift(new THREE.Vector3().copy(shape.relativePosition));
      }
      this.update();
    };

    this.addPrimitive = () => {
      for (let i = 0; i < arrShapes.length; i++) {
        const shape = arrShapes[i];
        const geometry = shape.type === 'sphere'
          ? new THREE.SphereGeometry(shape.size[0], 32, 24)
          : new THREE.BoxGeometry(...shape.size);
        const material = mirror
          ? this.par.par.managerScan.mirrorMaterial.clone()
          : color === null
            ? window.managerMaterial.getBeautifulColor()
            : new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.block = this;
        mesh.userData.type = shape.type;
        mesh.position.copy(arrShapePositions[i]);
        this.content3D.add(mesh);
      }
      if (mirror) this.par.par.managerScan.mirrorObject = this.content3D;
    };

    this.update = () => {
      if (!this.body) return;
      this.content3D.position.copy(this.body.getPosition());
      this.content3D.quaternion.copy(this.body.getQuaternion());
    };

    this.delete = () => {
      if (!this.content3D) return;
      if (mirror && this.par.par.managerScan.mirrorObject === this.content3D) {
        this.par.par.managerScan.mirrorObject = null;
      }
      this.content3D.removeFromParent();
      this.content3D.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      this.body.remove();
      this.body = null;
      this.content3D = null;
    };
  }
}
