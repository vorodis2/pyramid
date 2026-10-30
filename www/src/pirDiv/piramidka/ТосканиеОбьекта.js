import * as THREE from 'three';

export class ТосканиеОбьекта {
  constructor(par) {
    this.par = par;
    this.obj = null;

    const scan = this.par.managerScan;
    const canvas = scan.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let press = null;

    this.setObj = (block) => {
      this.obj = block;
      console.log(block);
    };

    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!press || press.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) {
        press.moved = true;
      }
    });

    canvas.addEventListener('pointercancel', () => { press = null; });

    canvas.addEventListener('pointerup', (event) => {
      if (!press || press.id !== event.pointerId) return;
      const moved = press.moved || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5;
      press = null;
      if (moved || event.button !== 0) return;

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
}
