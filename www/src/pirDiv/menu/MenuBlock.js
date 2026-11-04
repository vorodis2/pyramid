import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import './MenuBlock.css';

export class MenuBlock {
  constructor(par) {
    this.par = par;
    this.param = window.param;
    this.block = null;
    this._active = false;
    this.element = document.createElement('div');
    this.element.hidden = true;
    document.body.append(this.element);
    this.root = createRoot(this.element);
    this.root.render(createElement('div', {
      'aria-label': 'Block controls',
      style: {
        position: 'fixed',
        bottom: this.param.otstup,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        padding: this.param.otstup,
        borderRadius: '5px',
        background: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        font: '14px sans-serif'
      }
    }, createElement('button', {
      type: 'button',
      className: 'menu-block-delete',
      onClick: () => {
        if (this.block) this.par.par.piramidka.removeBlock(this.block);
      },
      title: 'Удалить',
      'aria-label': 'Удалить',
      style: {
        width: this.param.wh,
        height: this.param.wh,
        padding: this.param.otstup,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '5px',
        '--button-color': this.param.color,
        font: 'inherit',
        cursor: 'pointer'
      }
    }, createElement('svg', {
      viewBox: '0 0 24 24', width: 20, height: 20,
      fill: 'none', stroke: 'currentColor', strokeWidth: 2,
      strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true
    }, createElement('path', {
      d: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'
    })))));
  }

  setBlock(block) {
    this.block = block;
    this.active = block !== null;
  }

  get active() {
    return this._active;
  }

  set active(value) {
    const active = Boolean(value);
    if (this._active === active) return;
    this._active = active;
    this.element.hidden = !active;
  }
}
