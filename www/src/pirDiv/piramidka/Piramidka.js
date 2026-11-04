import * as THREE from 'three';
import { Block } from './Blocks/Block.js';
import { Manager } from './Manager/Manager.js';

export class Piramidka {
  constructor(par, fun) {
    this.par = par;
    this.fun = fun;
    this._blockEventActive = null;
    this._blockActive = null;
    this._blockOver = null;
    this._debugPhysics = window.localStorage.getItem('debugPhysics') === 'true';
    this.world = this.par.managerPhysik.world;
    this.content3D = new THREE.Object3D();
    this.par.managerScan.content3d.add(this.content3D);
    const arrBlock = [];
    this.arrBlock = arrBlock;
    this.arrPiramidka = [];
    const storedType = window.localStorage.getItem('pyramidType');
    this.type = ['base', 'wide', 'spiral'].includes(storedType) ? storedType : 'base';
    const storedLevels = Number(window.localStorage.getItem('pyramidLevels'));
    this.levels = Number.isInteger(storedLevels) && storedLevels >= 5
      ? Math.min(storedLevels, 13) : 5;
    this.getBlockCount = () => arrBlock.length;
    this.manager = new Manager(this, (s, p, p1) => {
      this.fun(s, p, p1);
    });
    let dropTimeout;
    this.loading = false;
    this.lastLoadCheck = 0;
    this.beginLoading = () => {
      this.loading = true;
      this.lastLoadCheck = 0;
      this.fun?.('loadProgress', { percent: 0, active: true });
    };
    this.checkLoading = () => {
      const arrLoadingBlocks = arrBlock.filter((block) => block.source);
      const total = arrLoadingBlocks.length;
      const loaded = arrLoadingBlocks.reduce((count, block) => count + Number(block.boolLoad), 0);
      const percent = total ? loaded / total * 100 : 100;
      this.loading = loaded < total;
      const progress = { loaded, total, percent, active: this.loading };
      this.fun?.('loadProgress', progress);
      return progress;
    };

    const addBlock = (options) => {
      const block = new Block(this);
      block.initialize(options);
      block.addPrimitive();
      arrBlock.push(block);
      return block;
    };

    this.removeBlock = (block) => {
      const index = arrBlock.indexOf(block);
      if (index === -1) return;
      if (this.blockOver === block) this.blockOver = null;
      arrBlock.splice(index, 1);
      const pyramidIndex = this.arrPiramidka.indexOf(block);
      if (pyramidIndex !== -1) this.arrPiramidka.splice(pyramidIndex, 1);
      block.delete();
      for (let body = this.world.rigidBodies; body; body = body.next) {
        if (body.isDynamic) body.awake();
      }
      if (this.manager.blockEventActive?.block === block) this.manager.down(null);
    };

    this.clear = () => {
      this.loading = false;
      clearTimeout(dropTimeout);
      for (const block of arrBlock) block.delete();
      arrBlock.length = 0;
      this.arrPiramidka.length = 0;
    };

    this.restartPiramidka = (levels = this.levels, type = this.type) => {
      this.beginLoading();
      levels = Math.max(5, Math.min(13, Math.round(levels)));
      this.levels = levels;
      window.localStorage.setItem('pyramidLevels', String(levels));
      this.type = type;
      window.localStorage.setItem('pyramidType', type);
      console.log('restartPiramidka type:', type);
      for (const block of this.arrPiramidka) {
        block.delete();
        const index = arrBlock.indexOf(block);
        if (index !== -1) arrBlock.splice(index, 1);
      }
      this.arrPiramidka.length = 0;

      const size = 0.8;
      for (let row = 0; row < levels; row++) {
        const count = levels - row;
        const arrPositions = [];
        if (type === 'wide') {
          for (let x = 0; x < count; x++) {
            for (let z = 0; z < count; z++) {
              arrPositions.push([2 + (x - (count - 1) / 2) * size,
                row * size + size / 2, (z - (count - 1) / 2) * size]);
            }
          }
        } else if (type === 'spiral') {
          const segments = levels;
          const radius = segments === 1 ? 0 : size / (2 * Math.tan(Math.PI / segments)) + size / 2;
          for (let i = 0; i < segments; i++) {
            const angle = (i + (row % 2) * 0.5) * Math.PI * 2 / segments;
            arrPositions.push([2 + Math.cos(angle) * radius,
              row * size + size / 2, Math.sin(angle) * radius]);
          }
        } else {
          for (let i = 0; i < count; i++) {
            arrPositions.push([2, row * size + size / 2, (i - (count - 1) / 2) * size]);
          }
        }
        for (const position of arrPositions) {
          const block = addBlock({
            color: null,
            array: [
              { type: 'box', size: [size, size, size] }
            ],
            pos: position,
            rot: type === 'spiral'
              ? [0, -Math.atan2(position[2], position[0] - 2) * 180 / Math.PI, 0]
              : [0, 0, 0],
            move: true, density: 1 / size ** 3, friction: 0.5, restitution: 0.05
          });
          this.arrPiramidka.push(block);
        }
      }
    };

    this.initialize = () => {
      this.clear();
      this.beginLoading();
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
      this.restartPiramidka(this.levels, this.type);
      ///1
      addBlock({
        object3D: {
          src: new URL('../../../resources/models/Fox.glb', import.meta.url).href
        },
        color: 0xffc857,
        array: [
          { type: 'model', size: [1, 1, 1] }
        ],
        pos: [9, 0.5, -3],
        move: true, density: 1, friction: 0.5, restitution: 0.05
      });

      //2
      addBlock({
        object3D: {
          src: new URL('../../../resources/models/Fox.glb', import.meta.url).href
        },
        color: 0xffc857,
        array: [
          { type: 'box', size: [1, 1, 1] }
        ],
        pos: [9, 0.5, 0],
        move: true, density: 1, friction: 0.5, restitution: 0.05
      });

      //3
      addBlock({
        object3D: {
          src: new URL('../../../resources/models/Fox.glb', import.meta.url).href
        },
        color: 0xffc857,
        array: [
          { type: 'box', size: [1, 1, 1] }
        ],
        pos: [9, 0.5, 3],
        move: true, density: 1, friction: 0.5, restitution: 0.05
      });

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
        this.beginLoading();
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
      this.manager.dragger.update();
      const time = performance.now();
      if (this.loading && time - this.lastLoadCheck >= 100) {
        this.lastLoadCheck = time;
        this.checkLoading();
      }
    };

    this.initialize();
  }

  get blockEventActive() {
    return this._blockEventActive;
  }

  get debugPhysics() {
    return this._debugPhysics;
  }

  set debugPhysics(value) {
    const active = Boolean(value);
    if (this._debugPhysics === active) return;
    this._debugPhysics = active;
    window.localStorage.setItem('debugPhysics', String(active));
    for (const block of this.arrBlock) block.visuPhysics.active = active;
    this.par.menu?.menuDebager.menuD1.updateDebugPhysicsButton(active);
  }

  set blockEventActive(value) {
    if (this._blockEventActive === value) return;
    this._blockEventActive = value;
    this.blockActive = value?.block ?? null;
    this.manager.blockEventActive = value;
  }

  get blockActive() {
    return this._blockActive;
  }

  get blockOver() {
    return this._blockOver;
  }

  set blockOver(value) {
    if (this._blockOver === value) return;
    this._blockOver = value;
    for (const block of this.arrBlock) {
      block.bStatus.over = block === value;
    }
  }

  set blockActive(value) {
    if (this._blockActive === value) return;
    this._blockActive = value;
    for (const block of this.arrBlock) {
      block.bStatus.active = block === value;
    }
  }
}
