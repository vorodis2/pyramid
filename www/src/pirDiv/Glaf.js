import { ManagerScan } from './ManagerScan.js';
import { ManagerPhysik } from './ManagerPhysik.js';
import { ManagerMaterials } from './ManagerMaterials.js';
import { Piramidka } from './piramidka/Piramidka.js';
import { Menu } from './menu/Menu.js';
import { ObjectDragging } from './piramidka/ObjectDragging.js';

export class Glaf {
  constructor(par) {
    this.par = par;

    this.managerMaterials = new ManagerMaterials(this);
    this.managerScan = new ManagerScan(this);
    this.managerPhysik = new ManagerPhysik(this);
    this.piramidka = new Piramidka(this);
    this.objectDragging = new ObjectDragging(this);
    this.menu = new Menu(this);

    let previousTime = performance.now();

    this.tick = () => {
      requestAnimationFrame(this.tick);
      const time = performance.now();
      this.managerPhysik.update((time - previousTime) / 1000);
      previousTime = time;
      this.piramidka.update();
      this.managerScan.update();
      this.menu.menuFPV.update(time);
    };

    this.tick();
 
  }

}
