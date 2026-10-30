import * as OIMO from 'oimo';

export class ManagerPhysik {
  constructor(par) {
    this.par = par;
    console.warn('Glaf срабоaaaaЙЙЙЙЙЙЙЙЙЙaт1ал');
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
      accumulator += Math.min(delta, 0.1);
      while (accumulator >= fixedStep) {
        this.world.step();
        accumulator -= fixedStep;
      }
    };

  }
}
