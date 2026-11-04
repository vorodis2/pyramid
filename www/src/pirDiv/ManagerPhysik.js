import * as OIMO from '../physics/PhysicsWorld.js';

export class ManagerPhysik {
  constructor(par) {
    this.par = par;
    this._active = window.localStorage.getItem('physicsActive') !== 'false';
    window.localStorage.setItem('physicsActive', String(this._active));
    this.world = new OIMO.World({
      timestep: 1 / 60,
      iterations: 8,
      broadphase: 2,
      worldscale: 1,
      random: false,
      gravity: [0, -9.81, 0]
    });

    let accumulator = 0;
    const fixedStep = 1 / 60;

    this.update = (delta) => {
      if (!this.active || this.par.piramidka?.loading || this.par.menu?.menuPreloader.active) {
        accumulator = 0;
        return;
      }
      accumulator += Math.min(delta, 0.1);
      while (accumulator >= fixedStep) {
        this.world.step();
        accumulator -= fixedStep;
      }
    };

  }

  get active() {
    return this._active;
  }

  set active(value) {
    this._active = Boolean(value);
    window.localStorage.setItem('physicsActive', String(this._active));
    this.par.menu?.menuDebager.menuD1.updatePhysicsButton(this._active);
  }
}
