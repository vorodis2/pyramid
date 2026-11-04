import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as OIMO from '../physics/PhysicsWorld.js';
import { Piramidka } from './Piramidka';
import type { PhysicsBody } from './Block';
import { Menu } from './menu/Menu';

type PhysicsWorld = {
  add(options: Record<string, unknown>): PhysicsBody;
  step(): void;
  clear(): void;
};

export class Glaf {
  private readonly _scene = new THREE.Scene();
  private readonly _camera = new THREE.PerspectiveCamera(
    55, innerWidth / innerHeight, 0.1, 100
  );
  private readonly _renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly _controls: OrbitControls;
  private readonly _floorMat = this.material(0x8c9baf);
  private readonly _rampMat = this.material(0x6b788d);
  private readonly _piramidka: Piramidka;
  private readonly _menu: Menu;
  private _world!: PhysicsWorld;
  private arrObjects: THREE.Object3D[] = [];
  private arrDynamicObjects: { object: THREE.Object3D; body: PhysicsBody }[] = [];
  private readonly _clock = new THREE.Clock();
  private _accumulator = 0;
  private readonly _fixedStep = 1 / 60;

  private _animationId = 0;
  private _destroyed = false;

  constructor() {
    this._scene.background = new THREE.Color(0xdce7f2);

    this._camera.position.set(8, 7, 15);

    this._renderer.setSize(innerWidth, innerHeight);
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this._renderer.shadowMap.enabled = true;

    const app = document.querySelector<HTMLElement>('#app');
    if (!app) {
      throw new Error('Application mount element "#app" was not found.');
    }
    app.append(this._renderer.domElement);
    this._menu = new Menu(app);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.target.set(0, 1.5, 0);
    this._controls.update();

    this._scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 2));

    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.position.set(-4, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this._scene.add(sun);

    this._piramidka = new Piramidka(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);

    this.regenerate();
    this.animate();
  }

  private material(color: number) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
  }

  addToScene(object: THREE.Object3D) {
    this._scene.add(object);
  }

  addPhysicsBody(options: Record<string, unknown>) {
    return this._world.add(options);
  }

  registerMesh(object: THREE.Object3D) {
    this.arrObjects.push(object);
  }

  unregisterMesh(object: THREE.Object3D) {
    this.arrObjects = this.arrObjects.filter((registered) => registered !== object);
  }

  registerDynamicObject(object: THREE.Object3D, body: PhysicsBody) {
    this.arrDynamicObjects.push({ object, body });
  }

  unregisterDynamicObject(object: THREE.Object3D, body: PhysicsBody) {
    this.arrDynamicObjects = this.arrDynamicObjects.filter(
      (registered) => registered.object !== object || registered.body !== body
    );
  }

  private box(
    w: number, h: number, d: number,
    mat: THREE.Material,
    x: number, y: number, z = 0,
    angle = 0,
    mass = 0
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

    mesh.position.set(x, y, z);
    mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this._scene.add(mesh);
    this.arrObjects.push(mesh);

    const body = this._world.add({
      type: 'box',
      size: [w, h, d],
      pos: [x, y, z],
      rot: [0, 0, angle * 180 / Math.PI],
      move: mass > 0,
      density: mass > 0 ? mass / (w * h * d) : 1,
      friction: 0.6,
      restitution: 0.1
    });

    if (mass > 0) this.arrDynamicObjects.push({ object: mesh, body });

    return mesh;
  }

  private clear() {
    this._piramidka.clear();

    for (const object of this.arrObjects) {
      this._scene.remove(object);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const arrMaterials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const material of arrMaterials) {
            if (material !== this._floorMat && material !== this._rampMat) {
              material.dispose();
            }
          }
        }
      });
    }

    this.arrObjects = [];
    this.arrDynamicObjects = [];

    this._world?.clear();
  }

  private regenerate() {
    this.clear();
    this._accumulator = 0;
    this._clock.start();

    this._world = new OIMO.World({
      timestep: 1 / 60,
      iterations: 8,
      broadphase: 2,
      worldscale: 1,
      random: false,
      gravity: [0, -9.81, 0]
    }) as PhysicsWorld;

    this.box(24, 0.5, 8, this._floorMat, 0, -0.25);
    this.box(5, 0.3, 1.8, this._rampMat, -5, 1.15, 0, -Math.PI / 8);

    this._piramidka.initialize(4);

    const radius = 0.55;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 24),
      this.material(0xb8c7d9)
    );

    ball.position.set(-7.1, 2.35, 0);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this._scene.add(ball);
    this.arrObjects.push(ball);

    const body = this._world.add({
      type: 'sphere',
      size: [radius, radius, radius],
      pos: [-7.1, 2.35, 0],
      move: true,
      density: 33,
      friction: 0.7,
      restitution: 0.1
    });

    this.arrDynamicObjects.push({ object: ball, body });
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    cancelAnimationFrame(this._animationId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    this._clock.stop();
    this.clear();
    this._controls.dispose();
    this._menu.destroy();
    this._floorMat.dispose();
    this._rampMat.dispose();
    this._scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    this._scene.clear();
    this._renderer.dispose();
    this._renderer.domElement.remove();
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyR') this.regenerate();
  };

  private readonly onResize = () => {
    this._camera.aspect = innerWidth / innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(innerWidth, innerHeight);
  };

  private readonly animate = () => {
    if (this._destroyed) return;
    this._animationId = requestAnimationFrame(this.animate);

    this._accumulator += Math.min(this._clock.getDelta(), 0.1);

    while (this._accumulator >= this._fixedStep) {
      this._world.step();
      this._accumulator -= this._fixedStep;
    }

    for (const { object, body } of this.arrDynamicObjects) {
      const p = body.getPosition();
      const q = body.getQuaternion();

      object.position.set(p.x, p.y, p.z);
      object.quaternion.set(q.x, q.y, q.z, q.w);
    }

    this._controls.update();
    this._renderer.render(this._scene, this._camera);
  };
}
