import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function disposeObject(object) {
  const arrGeometries = new Set();
  const arrMaterials = new Set();
  const arrTextures = new Set();
  const arrSkeletons = new Set();
  object.traverse((child) => {
    if (!child.isMesh) return;
    arrGeometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      arrMaterials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture && !value.isRenderTargetTexture) arrTextures.add(value);
      }
    }
    if (child.skeleton) arrSkeletons.add(child.skeleton);
    child.userData.block = null;
  });
  for (const geometry of arrGeometries) geometry.dispose();
  for (const material of arrMaterials) material.dispose();
  const arrImages = new Set();
  for (const texture of arrTextures) {
    if (texture.image) arrImages.add(texture.image);
    texture.dispose();
  }
  for (const image of arrImages) image.close?.();
  for (const skeleton of arrSkeletons) skeleton.dispose();
}

export class Block {
  constructor(par) {
    this.par = par;
    let arrShapes;
    let arrShapePositions;
    let color;
    let mirror;

    this.initialize = (options) => {
      this.delete();
      const { array, object3D = null, color: blockColor, mirror: blockMirror = false, ...bodyOptions } = options;
      this.source = object3D?.src ?? null;
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
      window.visi3D.addChildMouse(this.content3D);
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
      if (this.source) {
        const container = this.content3D;
        const shape = arrShapes[0];
        const targetSize = new THREE.Vector3(shape.size[0], shape.size[1] ?? shape.size[0], shape.size[2] ?? shape.size[0]);
        this.modelReady = new GLTFLoader().loadAsync(this.source).then((gltf) => {
          const model = gltf.scene;
          // A removed/reinitialized block must not receive a late model response.
          if (this.content3D !== container) {
            disposeObject(model);
            return;
          }
          const bounds = new THREE.Box3().setFromObject(model);
          const modelSize = bounds.getSize(new THREE.Vector3());
          const scale = Math.min(targetSize.x / modelSize.x, targetSize.y / modelSize.y, targetSize.z / modelSize.z);
          model.scale.setScalar(scale);
          model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
          model.position.y += (modelSize.y * scale - targetSize.y) / 2;
          model.position.add(arrShapePositions[0]);
          model.traverse((object) => {
            if (!object.isMesh) return;
            object.userData.block = this;
            object.userData.type = shape.type;
          });
          disposeObject(container);
          container.clear();
          container.add(model);
        }).catch((error) => {
          console.error('[Block] Could not load model', this.source, error);
        });
      }
    };

    this.update = () => {
      if (!this.body) return;
      this.content3D.position.copy(this.body.getPosition());
      this.content3D.quaternion.copy(this.body.getQuaternion());
    };

    this.delete = () => {
      if (!this.content3D) return;
      window.visi3D.removeChildMouse(this.content3D);
      if (mirror && this.par.par.managerScan.mirrorObject === this.content3D) {
        this.par.par.managerScan.mirrorObject = null;
      }
      this.content3D.removeFromParent();
      disposeObject(this.content3D);
      // Oimo removes the body's proxies but leaves overlapping contacts alive.
      // Detach them first so old bodies cannot remain in the solver's islands.
      while (this.body.contactLink) {
        this.par.world.removeContact(this.body.contactLink.contact);
      }
      this.body.remove();
      this.body = null;
      this.content3D = null;
    };
  }
}
