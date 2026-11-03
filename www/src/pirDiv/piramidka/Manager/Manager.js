import { EventBlocks } from '../Blocks/EventBlocks.js';

export class Manager {
  constructor(par, fun) {
    this.par = par;
    this.fun = fun;
    this._blockActive = null;
    this.visi3D = this.par.par.managerScan.visi3D;
    this.down = (event) => {
      //console.log('----',event );
      const blockEvent = this.getEventBlock(event);
      this.blockActive = blockEvent.block;
      
      return blockEvent;
    };
    this.visi3D.addEvent('down', this.down);
  }

  getEventBlock(event) {
    const blockEvent = new EventBlocks();
    if (!event) return blockEvent;
    for (const key of Object.keys(event)) {
      if (typeof event[key] !== 'function') blockEvent[key] = event[key];
    }
    blockEvent.point = event.point?.clone() ?? null;
    if (event.uv) blockEvent.uv = event.uv.clone();
    let object = event.target;
    while (object) {
      const block = object.userData?.block;
      if (block?.body) {
        blockEvent.block = block;
        blockEvent.physic = block.body;
        break;
      }
      object = object.parent;
    }
    return blockEvent;
  }

  get blockActive() {
    return this._blockActive;
  }

  set blockActive(value) {
    if (this._blockActive === value) return;
    this._blockActive = value;
    this.fun('blockActive', this._blockActive);
    
  }
}
