import * as THREE from 'three';
import { Block, type PhysicsBody } from './Block';

type AddPhysicsBody = (options: Record<string, unknown>) => PhysicsBody;
type RegisterObject = (object: THREE.Object3D) => void;
type RegisterDynamicObject = (object: THREE.Object3D, body: PhysicsBody) => void;

export class Piramidka {
  public readonly content3D = new THREE.Object3D();
  private readonly size = 0.8;
  private readonly colors = [0x2d72df, 0xe34e50, 0xf5bb39, 0x35a979];
  private readonly rotationY = Math.PI / 2;
  private blocks: Block[] = [];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly addPhysicsBody: AddPhysicsBody,
    private readonly registerMesh: RegisterObject,
    private readonly unregisterMesh: RegisterObject,
    private readonly registerDynamicObject: RegisterDynamicObject,
    private readonly unregisterDynamicObject: RegisterDynamicObject
  ) {
    this.scene.add(this.content3D);
  }

  initialize(kol: number) {
    if (!Number.isInteger(kol) || kol < 1) {
      throw new RangeError('Pyramid row count must be a positive integer.');
    }

    this.clear();

    for (let row = 0; row < kol; row++) {
      const count = kol - row;
      for (let i = 0; i < count; i++) {
        const x = 2 + (i - (count - 1) / 2) * this.size;
        const localY = row * this.size;
        const position = new THREE.Vector3(x, localY, 0)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        position.y += this.size / 2;
        const color = this.colors[(row + i) % this.colors.length];

        this.addBlock(this.size, color, position, this.rotationY);
      }
    }
  }

  clear() {
    for (const block of this.blocks) block.delete();
    this.blocks = [];
  }

  private addBlock(
    size: number,
    color: number,
    position: THREE.Vector3,
    rotationY: number
  ) {
    const block = new Block(
      this.content3D,
      this.addPhysicsBody,
      this.registerMesh,
      this.unregisterMesh,
      this.registerDynamicObject,
      this.unregisterDynamicObject
    );
    block.initialize(size, position, rotationY);
    block.addPrimitive(size, color);
    this.blocks.push(block);
  }
}
