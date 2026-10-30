import * as THREE from 'three';

export type PhysicsBody = {
  getPosition(): { x: number; y: number; z: number };
  getQuaternion(): { x: number; y: number; z: number; w: number };
  remove(): void;
};

type AddPhysicsBody = (options: Record<string, unknown>) => PhysicsBody;

export class Block {
  private _object3D?: THREE.Object3D;
  private _body?: PhysicsBody;
  private _x = 0;
  private _y = 0;
  private _z = 0;

  constructor(
    readonly par: THREE.Object3D,
    private readonly _addPhysicsBody: AddPhysicsBody,
    private readonly _registerObject: (object: THREE.Object3D) => void,
    private readonly _unregisterObject: (object: THREE.Object3D) => void,
    private readonly _registerDynamicObject: (object: THREE.Object3D, body: PhysicsBody) => void,
    private readonly _unregisterDynamicObject: (object: THREE.Object3D, body: PhysicsBody) => void
  ) {}

  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }

  set(x: number, y: number, z: number) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  initialize(
    size: number,
    rotationY: number
  ) {
    this.delete();
    const object3D = new THREE.Object3D();
    object3D.position.set(this._x, this._y, this._z);
    object3D.rotation.y = rotationY;
    this.par.add(object3D);
    this._object3D = object3D;
    this._registerObject(object3D);

    const body = this._addPhysicsBody({
      type: 'box',
      size: [size, size, size],
      pos: [this._x, this._y, this._z],
      rot: [0, rotationY * 180 / Math.PI, 0],
      move: true,
      density: 1 / (size * size * size),
      friction: 0.6,
      restitution: 0.1
    });

    this._body = body;
    this._registerDynamicObject(object3D, body);
  }

  addPrimitive(size: number, color: number) {
    if (!this._object3D) {
      throw new Error('Перед добавлением примитива вызовите Block.initialize().');
    }
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this._object3D.add(mesh);
  }

  delete() {
    const object3D = this._object3D;
    const body = this._body;
    if (!object3D) return;

    this.par.remove(object3D);
    object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          for (const material of child.material) material.dispose();
        } else {
          child.material.dispose();
        }
      }
    });
    this._unregisterObject(object3D);
    if (body) {
      body.remove();
      this._unregisterDynamicObject(object3D, body);
    }
    this._object3D = undefined;
    this._body = undefined;
  }
}
