import { createElement, useState, type ChangeEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';

function MenuView() {
  const [value1, setValue1] = useState(50);
  const [value2, setValue2] = useState(50);

  const createSlider = (
    label: string,
    value: number,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
  ) => createElement(
    'label',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '190px'
      }
    },
    createElement('span', { style: { width: '12px' } }, label),
    createElement('input', {
      type: 'range',
      min: 0,
      max: 100,
      value,
      'aria-label': label,
      onChange,
      style: {
        width: '160px',
        margin: 0,
        cursor: 'pointer'
      }
    })
  );

  return createElement(
    'div',
    {
      style: {
        position: 'fixed',
        top: '6px',
        left: '6px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        font: '14px sans-serif',
        color: '#243244'
      }
    },
    createSlider('1', value1, (event) => setValue1(Number(event.target.value))),
    createSlider('2', value2, (event) => setValue2(Number(event.target.value)))
  );
}

export class Menu {
  private readonly element = document.createElement('div');
  private readonly root: Root;

  constructor(parent: HTMLElement) {
    parent.append(this.element);
    this.root = createRoot(this.element);
    this.root.render(createElement(MenuView));
  }

  destroy() {
    this.root.unmount();
    this.element.remove();
  }
}
