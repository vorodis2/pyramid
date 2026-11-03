export class Menu {
  constructor(par) {
    this.par = par;
    this.menuDebager = new MenuDebager(this);
    this.menuLogo = new MenuLogo(this);
    this.menuFPV = new MenuFPV(this);
  }
}
import { MenuDebager } from './MenuDebager.js';
import { MenuLogo } from './MenuLogo.js';
import { MenuFPV } from './MenuFPV.js';

