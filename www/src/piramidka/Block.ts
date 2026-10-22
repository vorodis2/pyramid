import * as THREE from 'three';

export type PhysicsBody = {
  getPosition(): { x: number; y: number; z: number };
  getQuaternion(): { x: number; y: number; z: number; w: number };
  remove(): void;
};

type AddPhysicsBody = (options: Record<string, unknown>) => PhysicsBody;

export class Block {
  private object3D: THREE.Object3D | null = null;
  private body: PhysicsBody | null = null;
  private enabled = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly addPhysicsBody: AddPhysicsBody,
    private readonly registerObject: (object: THREE.Object3D) => void,
    private readonly unregisterObject: (object: THREE.Object3D) => void,
    private readonly registerDynamicObject: (object: THREE.Object3D, body: PhysicsBody) => void,
    private readonly unregisterDynamicObject: (object: THREE.Object3D, body: PhysicsBody) => void
  ) {}

  initialize(
    size: number,
    position: THREE.Vector3,
    rotationY: number
  ) {
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError('Block size must be a positive number.');
    }
    if (this.object3D || this.body) {
      throw new Error('Block is already initialized.');
    }

    const object3D = new THREE.Object3D();
    object3D.position.copy(position);
    object3D.rotation.y = rotationY;
    this.scene.add(object3D);
    this.object3D = object3D;
    this.registerObject(object3D);

    const body = this.addPhysicsBody({
      type: 'box',
      size: [size, size, size],
      pos: [position.x, position.y, position.z],
      rot: [0, rotationY * 180 / Math.PI, 0],
      move: true,
      density: 1 / (size * size * size),
      friction: 0.6,
      restitution: 0.1
    });

    this.body = body;
    this.registerDynamicObject(object3D, body);
  }

  addPrimitive(size: number, color: number) {
    if (!this.object3D) {
      throw new Error('Initialize the block before adding a primitive.');
    }
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError('Primitive size must be a positive number.');
    }

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.object3D.add(mesh);
  }

  Set(value: boolean) {
    this.enabled = value;
  }

  Get() {
    return this.enabled;
  }

  Debug() {
    console.log('Block debug:', {
      enabled: this.enabled,
      initialized: this.object3D !== null && this.body !== null,
      position: this.object3D?.position.toArray() ?? null
    });
  }

  delete() {
    const object3D = this.object3D;
    const body = this.body;

    if (object3D) {
      this.scene.remove(object3D);
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
      this.unregisterObject(object3D);
      this.object3D = null;
    }

    if (this.body) {
      this.body.remove();
      if (object3D && body) this.unregisterDynamicObject(object3D, body);
      this.body = null;
    }
  }
}
