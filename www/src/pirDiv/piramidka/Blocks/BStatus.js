import * as THREE from 'three';

export class BStatus {
  constructor(par) {
    this.par = par;
    this._active = false;
    this._over = false;
    this.arrOverlays = [];
    this.material = null;
  }

  create() {
    if (this.arrOverlays.length || !this.par.content3D) return;
    const arrMeshes = [];
    this.par.content3D.traverse((object) => {
      if (object.isMesh && !object.userData.bStatusOverlay && !object.userData.visuPhysics) arrMeshes.push(object);
    });
    if (!arrMeshes.length) return;
    this.material = new THREE.MeshBasicMaterial({
      color: window.param.color, wireframe: true, transparent: true, opacity: 0.15,
      //depthTest: false, 
      depthWrite: false
    });
    for (const mesh of arrMeshes) {
      let overlay;
      if (mesh.isSkinnedMesh) {
        overlay = new THREE.SkinnedMesh(mesh.geometry, this.material);
        overlay.skeleton = mesh.skeleton;
        overlay.bindMode = mesh.bindMode;
        overlay.bindMatrix.copy(mesh.bindMatrix);
        overlay.bindMatrixInverse.copy(mesh.bindMatrixInverse);
      } else if (mesh.isInstancedMesh) {
        overlay = new THREE.InstancedMesh(mesh.geometry, this.material, mesh.count);
        overlay.instanceMatrix = mesh.instanceMatrix;
      } else {
        overlay = new THREE.Mesh(mesh.geometry, this.material);
      }
      if (mesh.morphTargetInfluences) overlay.morphTargetInfluences = mesh.morphTargetInfluences;
      overlay.name = 'BStatus wireframe';
      overlay.userData.bStatusOverlay = true;
      overlay.renderOrder = 10;
      overlay.raycast = () => {};
      mesh.add(overlay);
      this.arrOverlays.push(overlay);
    }
  }

  clear() {
    // Geometry and skeletons belong to the original meshes, only the material is ours.
    for (const overlay of this.arrOverlays) overlay.removeFromParent();
    this.arrOverlays.length = 0;
    this.material?.dispose();
    this.material = null;
  }

  refresh() {
    this.clear();
    this.update();
  }

  update() {
    const visible = this._active || this._over;
    if (visible) this.create();
    if (this.material) {
      this.material.color.set(this._active ? window.param.colorActive : window.param.color);
    }
    for (const overlay of this.arrOverlays) overlay.visible = visible;
  }

  dispose() {
    this.clear();
    this._active = false;
    this._over = false;
  }

  get active() {
    return this._active;
  }

  set active(value) {
    const active = Boolean(value);
    if (this._active === active) return;
    this._active = active;
    this.update();
  }

  get over() {
    return this._over;
  }

  set over(value) {
    const over = Boolean(value);
    if (this._over === over) return;
    this._over = over;
    this.update();
  }
}
