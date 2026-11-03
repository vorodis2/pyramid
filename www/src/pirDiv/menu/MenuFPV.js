import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

export class MenuFPV {
  constructor(par) {
    this.par = par;
    this.param = window.param;
    this._active = window.localStorage.getItem('menuFPV') !== 'false';
    window.localStorage.setItem('menuFPV', String(this._active));
    this.frames = 0;
    this.previousTime = performance.now();
    this.element = document.createElement('div');
    this.element.hidden = !this._active;
    document.body.append(this.element);
    this.root = createRoot(this.element);
    this.root.render(createElement('div', {
      ref: (element) => { this.counter = element; },
      style: {
        position: 'fixed',
        bottom: this.param.otstup,
        right: this.param.otstup,
        zIndex: 10,
        padding: this.param.otstup,
        borderRadius: '5px',
        background: 'rgba(255, 255, 255, 0.92)',
        color: this.param.color,
        font: '12px/1.2 monospace',
        pointerEvents: 'none',
        whiteSpace: 'pre-line'
      }
    }, `FPS: —\nBlocks: ${this.par.par.piramidka.getBlockCount()}`));
  }

  update(time) {
    if (!this.active) return;
    if (document.hidden) {
      this.frames = 0;
      this.previousTime = time;
      return;
    }
    this.frames++;
    const elapsed = time - this.previousTime;
    if (elapsed < 1000) return;
    if (this.counter) this.counter.textContent = `FPS: ${Math.round(this.frames * 1000 / elapsed)}\nBlocks: ${this.par.par.piramidka.getBlockCount()}`;
    this.frames = 0;
    this.previousTime = time;
  }

  get active() {
    return this._active;
  }

  set active(value) {
    const active = Boolean(value);
    if (this._active === active) return;
    this._active = active;
    window.localStorage.setItem('menuFPV', String(active));
    this.par.menuDebager.menuD1.updateFPVButton(active);
    this.element.hidden = !active;
    this.frames = 0;
    this.previousTime = performance.now();
    if (this.counter) this.counter.textContent = `FPS: —\nBlocks: ${this.par.par.piramidka.getBlockCount()}`;
  }
}
