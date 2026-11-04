import * as THREE from 'three';
import * as TWEEN from 'three/addons/libs/tween.module.js';
import { MVisi3D } from '../visi3D/MVisi3D.js';

export class ManagerScan {
  constructor(par) {
    this.par = par;

    this.contHTML = document.createElement('div');
    document.body.append(this.contHTML);
    const mobile = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
    this.visi3D = new MVisi3D(this.contHTML, null, mobile, true, false, true, false);
    this.visi3D.yes3d = true;
    this.content3d = new THREE.Object3D();
    this.content3d.rotation.x = -Math.PI / 2;
    this.visi3D.groupObject.add(this.content3d);
    window.visi3D = this.visi3D;
    this.visi3D.position3d.boolMouseRight = false;
    this.visi3D.isDragPan = true;
    this.visi3D.position3d.minZum = 0.2;
    this.visi3D.position3d.maxZum = 100;
    this.visi3D.position3d.powerZum = 15;
    this.visi3D.position3d.pScane.active = true;
    this.visi3D.fov = 55;
    this.visi3D.zume = Math.hypot(8, 7, 15);
    this.visi3D.rotationX = Math.acos(7 / this.visi3D.zume);
    this.visi3D.rotationZ = Math.atan2(8, 15);
    const sceneStorageKey = 'visi3DScene';
    try {
      const savedScene = JSON.parse(window.localStorage.getItem(sceneStorageKey));
      const arrSceneFields = ['xVerh', 'yVerh', 'zVerh', 'rotationX', 'rotationZ', 'zume', 'fov'];
      if (savedScene && arrSceneFields.every((field) => Number.isFinite(savedScene[field]))
        && savedScene.zume >= this.visi3D.position3d.minZum
        && savedScene.zume <= this.visi3D.position3d.maxZum
        && savedScene.fov > 0 && savedScene.fov < 180) {
        this.visi3D.setObj(savedScene);
      }
    } catch (error) {
      console.warn('[ManagerScan] Could not restore scene', error);
    }
    let sceneChangeTimer;
    this.traceSceneChange = () => {
      clearTimeout(sceneChangeTimer);
      sceneChangeTimer = setTimeout(() => {
        const sceneState = this.visi3D.getObj();
        window.localStorage.setItem(sceneStorageKey, JSON.stringify(sceneState));
        
      }, 1000);
    };
    this.visi3D.arrFunDrag.push(this.traceSceneChange);
    this.scene = this.visi3D.scene;
    this.camera = this.visi3D.camera;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();
    this.scene.background = new THREE.Color(0xdce7f2);
    this.renderer = this.visi3D.renderer;
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    this.reflectionBackground = null;
    new THREE.TextureLoader().load(
      new URL('../../resources/material/studio.svg', import.meta.url).href,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.reflectionBackground = texture;
      }
    );
    this.mirrorTarget = new THREE.WebGLCubeRenderTarget(128, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    this.mirrorCamera = new THREE.CubeCamera(0.05, 100, this.mirrorTarget);
    this.mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0,
      envMap: this.mirrorTarget.texture
    });
    this.mirrorObject = null;

    const pointControls = this.visi3D.position3d.pScane;
    this.clickMarker = pointControls.meshSphere;
    this.clickMarker.material.opacity = 0.4;
    this.clickMarker.material.depthWrite = false;
    this.clickMarker.raycast = () => {};
    const markerCameraPosition = new THREE.Vector3();
    const updateClickMarkerScale = () => {
      this.scene.updateMatrixWorld(true);
      this.clickMarker.getWorldPosition(markerCameraPosition);
      markerCameraPosition.applyMatrix4(this.camera.matrixWorldInverse);
      const worldUnitsPerPixel = 2 * Math.max(-markerCameraPosition.z, this.camera.near)
        / (this.camera.projectionMatrix.elements[5] * this.renderer.domElement.clientHeight);
      this.clickMarker.scale.setScalar(3.2 * worldUnitsPerPixel);
    };
    let wheelMarkerTimer;
    this.renderer.domElement.addEventListener('wheel', () => {
      clearTimeout(wheelMarkerTimer);
      wheelMarkerTimer = setTimeout(() => {
        if (!this.visi3D.position3d.boolDrag) pointControls.stopMause();
      }, 600);
    }, { passive: true });
    window.addEventListener('blur', () => {
      clearTimeout(wheelMarkerTimer);
      this.visi3D.position3d.stageUpNew();
    });

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 2));

    this.resize = () => {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.visi3D.sizeWindow(0, 0, window.innerWidth, window.innerHeight);
    };

    this.update = () => {
      TWEEN.update();
      this.visi3D.position3d.doRender();
      updateClickMarkerScale();
      if (this.mirrorObject) {
        const background = this.scene.background;
        const visible = this.mirrorObject.visible;
        this.mirrorObject.getWorldPosition(this.mirrorCamera.position);
        this.mirrorObject.visible = false;
        if (this.reflectionBackground) this.scene.background = this.reflectionBackground;
        try {
          this.mirrorCamera.update(this.renderer, this.scene);
        } finally {
          this.mirrorObject.visible = visible;
          this.scene.background = background;
        }
      }
      this.visi3D.render();
    };

    window.addEventListener('resize', this.resize);
    this.resize();
  }
}
