import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as OIMO from 'oimo';
import { Piramidka } from './piramidka/Piramidka';
import type { PhysicsBody } from './piramidka/Block';
import { Menu } from './menu/Menu';

type PhysicsWorld = {
  add(options: Record<string, unknown>): PhysicsBody;
  step(): void;
};

export class Glaf {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(
    55, innerWidth / innerHeight, 0.1, 100
  );
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly controls: OrbitControls;
  private readonly floorMat = this.material(0x8c9baf);
  private readonly rampMat = this.material(0x6b788d);
  private readonly piramidka: Piramidka;
  private readonly menu: Menu;
  private world!: PhysicsWorld;
  private objects: THREE.Object3D[] = [];
  private dynamicObjects: { object: THREE.Object3D; body: PhysicsBody }[] = [];
  private readonly clock = new THREE.Clock();
  private accumulator = 0;
  private readonly fixedStep = 1 / 60;

  constructor() {
    this.scene.background = new THREE.Color(0xdce7f2);

    this.camera.position.set(8, 7, 15);

    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    const app = document.querySelector<HTMLElement>('#app');
    if (!app) {
      throw new Error('Application mount element "#app" was not found.');
    }
    app.append(this.renderer.domElement);
    this.menu = new Menu(app);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.5, 0);
    this.controls.update();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 2));

    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.position.set(-4, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);

    this.piramidka = new Piramidka(
      this.scene,
      (options) => this.world.add(options),
      (object) => this.objects.push(object),
      (object) => {
        this.objects = this.objects.filter((registered) => registered !== object);
      },
      (object, body) => this.dynamicObjects.push({ object, body }),
      (object, body) => {
        this.dynamicObjects = this.dynamicObjects.filter(
          (registered) => registered.object !== object || registered.body !== body
        );
      }
    );

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);

    this.regenerate();
    this.animate();
  }

  private material(color: number) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
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

    this.scene.add(mesh);
    this.objects.push(mesh);

    const body = this.world.add({
      type: 'box',
      size: [w, h, d],
      pos: [x, y, z],
      rot: [0, 0, angle * 180 / Math.PI],
      move: mass > 0,
      density: mass > 0 ? mass / (w * h * d) : 1,
      friction: 0.6,
      restitution: 0.1
    });

    if (mass > 0) this.dynamicObjects.push({ object: mesh, body });

    return mesh;
  }

  private regenerate() {
    this.piramidka.clear();

    for (const object of this.objects) {
      this.scene.remove(object);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const material of materials) {
            if (material !== this.floorMat && material !== this.rampMat) {
              material.dispose();
            }
          }
        }
      });
    }

    this.objects = [];
    this.dynamicObjects = [];

    this.world = new OIMO.World({
      timestep: 1 / 60,
      iterations: 8,
      broadphase: 2,
      worldscale: 1,
      random: false,
      gravity: [0, -9.81, 0]
    }) as PhysicsWorld;

    this.box(24, 0.5, 8, this.floorMat, 0, -0.25);
    this.box(5, 0.3, 1.8, this.rampMat, -5, 1.15, 0, -Math.PI / 8);

    this.piramidka.initialize(4);

    const radius = 0.55;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 24),
      this.material(0xb8c7d9)
    );

    ball.position.set(-7.1, 2.35, 0);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this.scene.add(ball);
    this.objects.push(ball);

    const body = this.world.add({
      type: 'sphere',
      size: [radius, radius, radius],
      pos: [-7.1, 2.35, 0],
      move: true,
      density: 33,
      friction: 0.7,
      restitution: 0.1
    });

    this.dynamicObjects.push({ object: ball, body });
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyR') this.regenerate();
  };

  private readonly onResize = () => {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  };

  private readonly animate = () => {
    requestAnimationFrame(this.animate);

    this.accumulator += Math.min(this.clock.getDelta(), 0.1);

    while (this.accumulator >= this.fixedStep) {
      this.world.step();
      this.accumulator -= this.fixedStep;
    }

    for (const { object, body } of this.dynamicObjects) {
      const p = body.getPosition();
      const q = body.getQuaternion();

      object.position.set(p.x, p.y, p.z);
      object.quaternion.set(q.x, q.y, q.z, q.w);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
