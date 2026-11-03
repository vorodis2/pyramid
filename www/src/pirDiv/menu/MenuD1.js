import { createElement } from 'react';

export class MenuD1 {
  constructor(par) {
    this.par = par;
    this.param = par.param;
    this._expanded = window.localStorage.getItem('menuD1') !== 'false';
    window.localStorage.setItem('menuD1', String(this._expanded));
  }

  toggle() {
    const startHeight = this.content.getBoundingClientRect().height;
    this.content.style.height = `${startHeight}px`;
    const expandedHeight = this.content.firstElementChild.getBoundingClientRect().height + this.param.otstup * 2;
    void this.content.offsetHeight;
    this._expanded = !this._expanded;
    window.localStorage.setItem('menuD1', String(this._expanded));
    const targetHeight = this._expanded ? expandedHeight : 0;
    const parentHeight = this.par.content.scrollHeight;
    this.content.style.height = `${targetHeight}px`;
    this.content.style.padding = this._expanded ? `${this.param.otstup}px` : '0px';
    this.content.inert = !this._expanded;
    this.content.setAttribute('aria-hidden', String(!this._expanded));
    this.toggleButton.setAttribute('aria-expanded', String(this._expanded));
    this.triangle.style.transform = this._expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    this.triangle.style.color = this._expanded ? this.param.colorActive : this.param.color;
    if (this.par.active) {
      this.par.panel.style.height = `${this.param.wh + this.param.otstup * 3 + parentHeight + targetHeight - startHeight}px`;
    }
  }

  updateFPVButton(active) {
    if (!this.fpvButton) return;
    this.fpvButton.style.color = active ? this.param.colorActive : this.param.color;
    this.fpvButton.setAttribute('aria-pressed', String(active));
  }

  render() {
    return createElement(
      'section',
      {
        'aria-label': 'Scene Parameters',
        style: {
          marginTop: this.param.otstup,
          border: '1px solid #c9d3df',
          borderRadius: '5px',
          overflow: 'hidden'
        }
      },
      createElement('div', {
        ref: (element) => { this.header = element; },
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: this.param.otstup,
          padding: this.param.otstup,
          borderBottom: '1px solid #c9d3df',
          fontWeight: 600
        }
      }, createElement('span', null, 'Scene Parameters'),
      createElement('button', {
        type: 'button',
        'aria-label': 'Toggle scene parameters',
        'aria-expanded': this._expanded,
        ref: (element) => { this.toggleButton = element; },
        onClick: () => this.toggle(),
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 20,
          height: 20,
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer'
        }
      }, createElement('svg', {
        ref: (element) => { this.triangle = element; },
        viewBox: '0 0 12 12',
        width: 12,
        height: 12,
        fill: 'currentColor',
        'aria-hidden': true,
        style: {
          color: this._expanded ? this.param.colorActive : this.param.color,
          transform: this._expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: `transform ${this.param.timeAnimation}s ease-in-out, color ${this.param.timeAnimation}s ease-in-out`
        }
      }, createElement('path', { d: 'M1 3h10L6 9z' })))),
      createElement('div', {
        ref: (element) => {
          this.content = element;
          if (element) element.inert = !this._expanded;
        },
        'aria-hidden': !this._expanded,
        style: {
          height: this._expanded ? 'auto' : 0,
          padding: this._expanded ? this.param.otstup : 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: `height ${this.param.timeAnimation}s ease-in-out, padding ${this.param.timeAnimation}s ease-in-out`
        }
      },
      createElement('div', {
        style: { display: 'flex', gap: this.param.otstup }
      },
      createElement('button', {
        type: 'button',
        'aria-label': 'Show/hide FPS and block count',
        title: 'Show/hide FPS and block count',
        ref: (element) => {
          this.fpvButton = element;
          this.updateFPVButton(this.par.par.menuFPV.active);
        },
        onClick: () => {
          const menuFPV = this.par.par.menuFPV;
          menuFPV.active = !menuFPV.active;
        },
        style: {
          width: this.param.wh,
          height: this.param.wh,
          flexShrink: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: this.param.otstup,
          cursor: 'pointer',
          transition: `color ${this.param.timeAnimation}s ease-in-out`
        }
      }, createElement('svg', {
        viewBox: '0 0 24 24',
        width: 20,
        height: 20,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true
      },
      createElement('rect', { x: 3, y: 3, width: 18, height: 14, rx: 2 }),
      createElement('path', { d: 'M7 13V10M12 13V7M17 13V9M12 17v4M8 21h8' }))),
      createElement('button', {
        type: 'button',
        title: 'Enable/disable physics',
        'aria-label': 'Enable/disable physics',
        ref: (element) => {
          this.physicsButton = element;
          this.updatePhysicsButton(this.par.par.par.managerPhysik.active);
        },
        onClick: () => {
          const physics = this.par.par.par.managerPhysik;
          physics.active = !physics.active;
        },
        style: {
          width: this.param.wh, height: this.param.wh, flexShrink: 0,
          boxSizing: 'border-box', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: this.param.otstup, cursor: 'pointer',
          transition: `color ${this.param.timeAnimation}s ease-in-out`
        }
      }, createElement('svg', {
        viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none',
        stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true
      }, createElement('path', { d: 'M12 2v8m-4-4 4 4 4-4M4 21h16' }),
      createElement('circle', { cx: 12, cy: 16, r: 3 })))))
    );
  }

  updatePhysicsButton(active) {
    if (!this.physicsButton) return;
    this.physicsButton.style.color = active ? this.param.colorActive : this.param.color;
    this.physicsButton.setAttribute('aria-pressed', String(active));
  }
}
