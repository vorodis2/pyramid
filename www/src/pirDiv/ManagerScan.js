import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ManagerScan {
  constructor(par) {
    this.par = par;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdce7f2);

    this.camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 100
    );
    this.camera.position.set(8, 7, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.display = 'block';
    document.body.append(this.renderer.domElement);

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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.update();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 2));

    this.resize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    this.update = () => {
      this.controls.update();
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
      this.renderer.render(this.scene, this.camera);
    };

    window.addEventListener('resize', this.resize);
  }
}
