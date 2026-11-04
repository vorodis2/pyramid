export class Menu {
  constructor(par) {
    this.par = par;
    this.menuPreloader = new MenuPreloader(this);
    this.menuDebager = new MenuDebager(this);
    this.menuLogo = new MenuLogo(this);
    this.menuFPV = new MenuFPV(this);
    this.menuBlock = new MenuBlock(this);
  }

  setBlockEvent(blockEvent) {
    this.blockEvent = blockEvent;
    this.menuBlock.setBlock(blockEvent?.block ?? null);
  }
}
import { MenuDebager } from './MenuDebager.js';
import { MenuLogo } from './MenuLogo.js';
import { MenuFPV } from './MenuFPV.js';
import { MenuPreloader } from './MenuPreloader.js';
import { MenuBlock } from './MenuBlock.js';

