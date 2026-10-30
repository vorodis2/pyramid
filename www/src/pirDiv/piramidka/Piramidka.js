import * as THREE from 'three';
import { Block } from './Block.js';

export class Piramidka {
  constructor(par) {
    this.par = par;
    this.world = this.par.managerPhysik.world;
    this.content3D = new THREE.Object3D();
    this.par.managerScan.scene.add(this.content3D);
    const arrBlock = [];
    let dropTimeout;

    const addBlock = (options) => {
      const block = new Block(this);
      block.initialize(options);
      block.addPrimitive();
      arrBlock.push(block);
      return block;
    };

    this.clear = () => {
      clearTimeout(dropTimeout);
      for (const block of arrBlock) block.delete();
      arrBlock.length = 0;
    };

    this.initialize = () => {
      this.clear();
      addBlock({
        color: 0x8c9baf,
        array: [
          { type: 'box', size: [28, 0.5, 12], pos: [0, -0.25, 0] }
        ],
        move: false, friction: 0.5, restitution: 0.05
      });
      addBlock({
        color: 0x6b788d,
        array: [
          { type: 'box', size: [5, 0.3, 2] }
        ],
        pos: [-5, 1.15, 0],
        rot: [0, 0, -22.5], move: false, friction: 0.6, restitution: 0.05
      });

      const size = 0.8;
      for (let row = 0; row < 4; row++) {
        const count = 4 - row;
        for (let i = 0; i < count; i++) {
          addBlock({
            color: null,
            array: [
              { type: 'box', size: [size, size, size] }
            ],
            pos: [2, row * size + size / 2, (i - (count - 1) / 2) * size],
            move: true, density: 1 / size ** 3, friction: 0.5, restitution: 0.05
          });
        }
      }

      const radius = 0.6;
      this.ball = addBlock({
        color: 0xf4f6fa,
        mirror: true,
        array: [
          { type: 'sphere', size: [radius] }
        ],
        pos: [-7.1, 2.8, 0],
        move: true, density: 25, friction: 0.6, restitution: 0.05
      }).content3D;

      const dropObject = () => {
        addBlock({
          color: 0x8c9baf,
          array: [
            { type: 'sphere', size: [radius], pos: [0, 0, 0] },
            { type: 'box', size: [size, size, size], pos: [radius + size / 2, 0, 0] }
          ],
          pos: [2, 4 * size * 2.5, 0],
          move: true, density: 25, friction: 0.6, restitution: 0.05
        });
      };

      dropTimeout = setTimeout(dropObject, 1500);
    };

    this.update = () => {
      for (const block of arrBlock) block.update();
    };

    this.initialize();
  }
}
