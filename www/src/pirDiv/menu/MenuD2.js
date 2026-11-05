import { createElement, useState } from 'react';
import './MenuD2.css';

function pyramidColumns({ param, initialColumns, onChange }) {
  const [columns, setColumns] = useState(initialColumns);

  return createElement(
    'label',
    { className: 'pyramid-columns-control', style: {
      marginTop: param.otstup,
      '--control-height': `${Math.max(param.wh * 0.7, param.fontSizeLittel * 1.2 + param.otstup * 2)}px`,
      fontSize: param.fontSizeLittel,
      color: param.colorFont
    } },
    createElement('span', { className: 'pyramid-columns-label' }, `Pyramid columns: ${columns}`),
    createElement('input', {
      type: 'range',
      className: 'pyramid-columns-slider',
      min: 5,
      max: 13,
      step: 1,
      value: columns,
      onChange: (event) => {
        const levels = Number(event.target.value);
        if (levels === columns) return;
        setColumns(levels);
        onChange(levels);
      },
      style: { '--slider-color': param.color }
    })
  );
}

function pyramidTypes({ param, initialType, onChange }) {
  const [selected, setSelected] = useState(initialType);
  const arrTypes = [
    { type: 'base', label: 'Horizontal pyramid', path: 'M2 16h6v5H2z M9 16h6v5H9z M16 16h6v5h-6z M5.5 9h6v5h-6z M12.5 9h6v5h-6z M9 2h6v5H9z' },
    { type: 'random', label: 'Random pieces pyramid', path: 'M2 16h5v5H2z M8.5 16h8v5h-8z M18 16h4v5h-4z M5 9h8v5H5z M14.5 9H19v5h-4.5z M9 2h6v5H9z' },
    { type: 'wide', label: 'Wide pyramid', path: 'M12 2 22 17 12 22 2 17Z M12 2v20 M2 17l10-5 10 5 M6 10l6-3 6 3' },
    { type: 'spiral', label: 'Spiral pyramid', path: 'M3 18a9 4 0 1 0 18 0 9 4 0 1 0-18 0 M5 13a7 3 0 1 0 14 0 7 3 0 1 0-14 0 M8 8a4 2 0 1 0 8 0 4 2 0 1 0-8 0 M12 2v4' }
  ];
  return createElement('div', {
    role: 'group', 'aria-label': 'Pyramid layout',
    style: { display: 'flex', gap: param.otstup }
  }, arrTypes.map(({ type, label, path }) => createElement('button', {
    key: type, type: 'button', title: label, 'aria-label': label,
    'aria-pressed': selected === type,
    onClick: () => { setSelected(type); onChange(type); },
    style: {
      width: param.wh, height: param.wh, padding: param.otstup,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box', cursor: 'pointer',
      color: selected === type ? param.colorActive : param.color,
      transition: `color ${param.timeAnimation}s ease-in-out`
    }
  }, createElement('svg', {
    viewBox: '0 0 24 24', width: 20, height: 20,
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.3,
    strokeLinejoin: 'round', 'aria-hidden': true
  }, createElement('path', { d: path })))));
}

export class MenuD2 {
  constructor(par) {
    this.par = par;
    this.param = par.param;
    this.columns = this.par.par.par.piramidka.levels;
    this.pyramidType = this.par.par.par.piramidka.type;
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
        'aria-label': 'Controllers',
        style: {
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
      }, createElement('span', null, 'Controllers'),
      createElement('button', {
        type: 'button',
        'aria-label': 'Toggle pyramid controls',
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
      createElement(pyramidTypes, {
        param: this.param,
        initialType: this.pyramidType,
        onChange: (type) => {
          this.pyramidType = type;
          this.par.par.par.piramidka.restartPiramidka(this.columns, type);
        }
      }),
      createElement(pyramidColumns, {
        param: this.param,
        initialColumns: this.columns,
        onChange: (levels) => {
          this.columns = levels;
          this.par.par.par.piramidka.restartPiramidka(levels, this.pyramidType);
        }
      })))
    );
  }
}
