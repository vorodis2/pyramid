import { EventBlocks } from '../Blocks/EventBlocks.js';
import { Dragger } from './Dragger.js';

export class Manager {
  constructor(par, fun) {
    this.par = par;
    this.fun = fun;
    this._blockEventActive = null;
    this.dragger = new Dragger(this);
    this.visi3D = this.par.par.managerScan.visi3D;
    this.down = (event) => {
        
        const blockE = this.getEventBlock(event);
        
        if ((this._blockEventActive?.block ?? null) !== blockE.block) {            
            
            this.fun('blockEventActive', blockE);
        } else {
            this.blockEventActive = blockE;
        }
        return blockE;
    };
    this.visi3D.addEvent('down', this.down);
    this.over = (event) => {
      const blockEvent = this.getEventBlock(event);
      this.fun('blockEventOver', blockEvent);
      return blockEvent;
    };
    this.out = (event) => {
      const blockEvent = this.getEventBlock(event);
      this.fun('blockEventOut', blockEvent);
      return blockEvent;
    };
    this.visi3D.addEvent('over', this.over);
    this.visi3D.addEvent('out', this.out);
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

  get blockEventActive() {
    return this._blockEventActive;
  }

  set blockEventActive(value) {
    if (this._blockEventActive === value) return;
    this._blockEventActive = value;
    this.dragger.blockEventActive = value;
  }
}
