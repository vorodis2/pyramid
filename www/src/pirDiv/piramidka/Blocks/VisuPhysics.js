import * as THREE from 'three';

export class VisuPhysics {
  constructor(par) {
    this.par = par;
    this._active = false;
    this.content3D = null;
    this.material = null;
  }

  create() {
    if (this.content3D || !this.par.body) return;
    this.content3D = new THREE.Group();
    this.content3D.name = 'VisuPhysics';
    this.material = new THREE.MeshBasicMaterial({
      color: this.par.body.isDynamic ? 0x39ff74 : 0xffa340,
      wireframe: true, transparent: true, opacity: 0.7,
      //depthTest: false, 
      depthWrite: false
    });
    const scale = this.par.body.scale;
    const rotation = new THREE.Matrix4();
    for (let shape = this.par.body.shapes; shape; shape = shape.next) {
      let geometry;
      if (shape.width !== undefined) {
        geometry = new THREE.BoxGeometry(shape.width * scale, shape.height * scale, shape.depth * scale);
      } else if (shape.radius !== undefined && shape.height !== undefined) {
        geometry = new THREE.CylinderGeometry(shape.radius * scale, shape.radius * scale, shape.height * scale, 16);
      } else if (shape.radius !== undefined) {
        geometry = new THREE.SphereGeometry(shape.radius * scale, 16, 12);
      } else continue;
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.position.copy(shape.relativePosition).multiplyScalar(scale);
      const e = shape.relativeRotation.elements;
      rotation.set(e[0], e[1], e[2], 0, e[3], e[4], e[5], 0, e[6], e[7], e[8], 0, 0, 0, 0, 1);
      mesh.quaternion.setFromRotationMatrix(rotation);
      mesh.userData.visuPhysics = true;
      mesh.renderOrder = 11;
      mesh.raycast = () => {};
      this.content3D.add(mesh);
    }
    this.attach();
  }

  attach() {
    if (this.content3D && this.par.content3D) this.par.content3D.add(this.content3D);
  }

  dispose() {
    this.content3D?.removeFromParent();
    this.content3D?.traverse((object) => object.geometry?.dispose());
    this.material?.dispose();
    this.content3D = null;
    this.material = null;
    this._active = false;
  }

  get active() {
    return this._active;
  }

  set active(value) {
    const active = Boolean(value);
    if (this._active === active) return;
    this._active = active;
    if (active) this.create();
    if (this.content3D) this.content3D.visible = active;
  }
}
