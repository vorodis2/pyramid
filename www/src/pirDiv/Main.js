import { Glaf } from './Glaf.js';
import { LocalStorage } from './components/LocalStorage.js';
import { Param } from './components/Param.js';

export class Main {
  constructor() {
    this.param = new Param().param;
    document.title = `Pyramid V${this.param.version_reliz}.${this.param.version_dev}`;
    window.param = this.param;
    this.param.otstup=4
    this.localStorage = new LocalStorage(null, 'pirDiv');
    window.localStorageApp = this.localStorage;
    this.glaf = new Glaf(this);
  }
}
