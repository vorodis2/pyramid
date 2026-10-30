export class Menu {
  constructor(par) {
    this.par = par;
    this.menuDebager = new MenuDebager(this);
  }
}
import { MenuDebager } from './MenuDebager.js';

