import * as THREE from 'three';

export class ObjectDragging {
  constructor(par) {
    this.par = par;
    this.obj = null;
    this._active = true;

    const scan = this.par.managerScan;
    const canvas = scan.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    this.cancel = () => {
      this.obj = null;
    };

    this.setObj = (block) => {
      if (!this.active) return;
      this.obj = block;
      console.log(block);
    };

    canvas.addEventListener('pointerdown', (event) => {
      if (!this.active || event.button !== 0) return;

      const rect = canvas.getBoundingClientRect();
      pointer.set(
        (event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1
      );
      scan.scene.updateMatrixWorld(true);
      scan.camera.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, scan.camera);
      const arrHits = raycaster.intersectObjects(scan.scene.children, true);
      const hit = arrHits[0];
      const block = hit?.object.userData.block;
      if (hit?.object.userData.type === 'box' && block?.body?.isDynamic) {
        this.setObj(block);
      }
    });
  }

  get active() {
    return this._active;
  }

  set active(value) {
    this._active = Boolean(value);
    if (!this._active) this.cancel();
    this.par.menu?.menuDebager.menuD1.updateDraggingButton(this._active);
  }
}
