import { createElement, useState } from 'react';

function pyramidColumns({ param, onChange }) {
  const [columns, setColumns] = useState(4);

  return createElement(
    'label',
    { style: { display: 'flex', flexDirection: 'column', gap: param.otstup, marginTop: param.otstup } },
    createElement('span', null, `Pyramid columns: ${columns}`),
    createElement('input', {
      type: 'range',
      min: 1,
      max: 20,
      step: 1,
      value: columns,
      onChange: (event) => {
        const levels = Number(event.target.value);
        setColumns(levels);
        onChange(levels);
      },
      style: { width: '100%', margin: 0, cursor: 'pointer' }
    })
  );
}

export class MenuD2 {
  constructor(par) {
    this.par = par;
    this.param = par.param;
    this._expanded = window.localStorage.getItem('menuD2') !== 'false';
    window.localStorage.setItem('menuD2', String(this._expanded));
  }

  toggle() {
    const startHeight = this.content.getBoundingClientRect().height;
    this.content.style.height = `${startHeight}px`;
    const expandedHeight = this.body.getBoundingClientRect().height + this.param.otstup * 2;
    void this.content.offsetHeight;
    const parentHeight = this.par.content.scrollHeight;
    this._expanded = !this._expanded;
    window.localStorage.setItem('menuD2', String(this._expanded));
    const targetHeight = this._expanded ? expandedHeight : 0;
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

  render() {
    return createElement(
      'section',
      {
        'aria-label': 'Pyramid Controls',
        style: {
          marginTop: this.param.otstup,
          border: '1px solid #c9d3df',
          borderRadius: '5px',
          overflow: 'hidden',
          color: this.param.colorFont
        }
      },
      createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: this.param.otstup,
          padding: this.param.otstup,
          borderBottom: '1px solid #c9d3df',
          fontWeight: 600
        }
      }, createElement('span', null, 'Pyramid Controls'),
      createElement('button', {
        type: 'button',
        'aria-label': 'Свернуть или развернуть управление пирамидой',
        'aria-expanded': this._expanded,
        ref: (element) => { this.toggleButton = element; },
        onClick: () => this.toggle(),
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, width: 20, height: 20, padding: 0,
          border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer'
        }
      }, createElement('svg', {
        ref: (element) => { this.triangle = element; },
        viewBox: '0 0 12 12', width: 12, height: 12,
        fill: 'currentColor', 'aria-hidden': true,
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
          boxSizing: 'border-box', overflow: 'hidden',
          transition: `height ${this.param.timeAnimation}s ease-in-out, padding ${this.param.timeAnimation}s ease-in-out`
        }
      },
      createElement('div', { ref: (element) => { this.body = element; } },
      createElement(
        'label',
        { style: { display: 'flex', alignItems: 'center', gap: this.param.otstup, cursor: 'pointer' } },
        createElement('input', { type: 'checkbox', style: { margin: 0 } }),
        'Отладка'
      ),
      createElement(pyramidColumns, {
        param: this.param,
        onChange: (levels) => this.par.par.par.piramidka.restartPiramidka(levels, '')
      })))
    );
  }
}
