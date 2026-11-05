import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

export class MenuFPV {
  constructor(par) {
    this.par = par;
    this.param = window.param;
    this._active = window.localStorage.getItem('menuFPV.v2') === 'true';
    window.localStorage.setItem('menuFPV.v2', String(this._active));
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
        color: this.param.colorFont,
        font: `${this.param.fontSizeLittel}px/1.2 monospace`,
        pointerEvents: 'none',
        whiteSpace: 'pre-line'
      }
    }, this.getCounterText()));
  }

  getCounterText(fps = '—') {
    const bytes = performance.memory?.usedJSHeapSize;
    const memory = Number.isFinite(bytes) ? (bytes / 1024 ** 2).toFixed(1) + ' MB' : 'N/A';
    return `FPS: ${fps}\nMemory: ${memory}\nBlocks: ${this.par.par.piramidka.getBlockCount()}`;
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
    if (this.counter) this.counter.textContent = this.getCounterText(Math.round(this.frames * 1000 / elapsed));
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
    window.localStorage.setItem('menuFPV.v2', String(active));
    this.par.menuDebager.menuD1.updateFPVButton(active);
    this.element.hidden = !active;
    this.frames = 0;
    this.previousTime = performance.now();
    if (this.counter) this.counter.textContent = this.getCounterText();
  }
}
