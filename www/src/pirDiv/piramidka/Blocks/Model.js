import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from './disposeObject.js';

export class Model {
  constructor(par) {
    this.par = par;
  }

  load() {
    const block = this.par;
    const container = block.content3D;
    const shape = block.shape.arrShapes[0];
    const targetSize = new THREE.Vector3(shape.size[0], shape.size[1] ?? shape.size[0], shape.size[2] ?? shape.size[0]);
    return new GLTFLoader().loadAsync(block.source).then((gltf) => {
      const model = gltf.scene;
      // A removed/reinitialized block must not receive a late model response.
      if (block.content3D !== container) {
        disposeObject(model);
        return;
      }
      const bounds = new THREE.Box3().setFromObject(model);
      const modelSize = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(targetSize.x / modelSize.x, targetSize.y / modelSize.y, targetSize.z / modelSize.z);
      model.scale.setScalar(scale);
      model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
      model.position.y += (modelSize.y * scale - targetSize.y) / 2;
      model.position.add(block.shape.arrShapePositions[0]);
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData.block = block;
        object.userData.type = shape.type;
      });
      block.bStatus.clear();
      block.visuPhysics.content3D?.removeFromParent();
      disposeObject(container);
      container.clear();
      container.add(model);
      block.shape.createModelPhysics(model);
      block.visuPhysics.attach();
      block.bStatus.refresh();
      block.boolLoad = true;
    }).catch((error) => {
      if (block.content3D !== container) return;
      block.loadError = error;
      // The primitive remains a usable fallback if the model cannot load.
      block.boolLoad = true;
      console.error('[Block] Could not load model', block.source, error);
    });
  }
}
