// Обёртка для хранения данных в localStorage.
export class LocalStorage {
  constructor(fun, key) {
    this.fun = fun;
    this.key = key || 'shirt';
    this.object = undefined;

    this.getStartObj = () => {
      return {};
    };

    this.initLoad = () => {
      const value = window.localStorage.getItem(this.key);
      this.object = value === null || value === 'undefined'
        ? this.getStartObj()
        : JSON.parse(value);

      if (this.fun) this.fun();
    };

    this.save = () => {
      window.localStorage.setItem(this.key, JSON.stringify(this.object));
    };

    this.clear = () => {
      window.localStorage.removeItem(this.key);
    };

    this.initLoad();
  }
}
