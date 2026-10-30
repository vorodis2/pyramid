import * as THREE from 'three';
import type { Glaf } from './Glaf';
import { Block } from './Block';

export interface Piramidka {
  par: Glaf;
  addBlock: (
    size: number,
    color: number,
    x: number,
    y: number,
    z: number,
    rotationY: number
  ) => void;
  initialize: (kol: number) => void;
  clear: () => void;
}

export class Piramidka {
  constructor(par: Glaf) {
    this.par = par;
    const content3D = new THREE.Object3D();
    const size = 0.8;
    const arrColors = [0x2d72df, 0xe34e50, 0xf5bb39, 0x35a979];
    const rotationY = Math.PI / 2;
    let arrBlock: Block[] = [];

    this.par.addToScene(content3D);

    this.addBlock = (
      size: number,
      color: number,
      x: number,
      y: number,
      z: number,
      rotationY: number
    ) => {
      const block = new Block(
        content3D,
        (options) => this.par.addPhysicsBody(options),
        (object) => this.par.registerMesh(object),
        (object) => this.par.unregisterMesh(object),
        (object, body) => this.par.registerDynamicObject(object, body),
        (object, body) => this.par.unregisterDynamicObject(object, body)
      );
      block.set(x, y, z);
      block.initialize(size, rotationY);
      block.addPrimitive(size, color);
      arrBlock.push(block);
    };

    this.clear = () => {
      for (const block of arrBlock) block.delete();
      arrBlock = [];
    };

    this.initialize = (kol: number) => {
      this.clear();

      for (let row = 0; row < kol; row++) {
        const count = kol - row;
        for (let i = 0; i < count; i++) {
          const x = 2 + (i - (count - 1) / 2) * size;
          const y = row * size + size / 2;
          const x3D = x * Math.cos(rotationY);
          const z3D = -x * Math.sin(rotationY);
          const color = arrColors[(row + i) % arrColors.length];

          this.addBlock(size, color, x3D, y, z3D, rotationY);
        }
      }
    };
  }
}
