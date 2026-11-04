import * as THREE from 'three';
import { Block } from './Blocks/Block.js';
import { PiramidkaGeneration } from './PiramidkaGeneration.js';
import { PCreate } from './PCreate.js';
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
    this.type = ['base', 'wide', 'spiral', 'random'].includes(storedType) ? storedType : 'spiral';
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
      this.pCreate.clear();
      for (const block of arrBlock) block.delete();
      arrBlock.length = 0;
      this.arrPiramidka.length = 0;
    };

    this.piramidkaGeneration = new PiramidkaGeneration(this, addBlock);
    this.restartPiramidka = (levels = this.levels, type = this.type) => {
      this.piramidkaGeneration.restart(levels, type);
    };

    this.pCreate = new PCreate(this, addBlock);
    this.initialize = () => {
      this.pCreate.initialize();
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
