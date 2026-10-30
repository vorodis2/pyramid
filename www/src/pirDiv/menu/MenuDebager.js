import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

export class MenuDebager {
  constructor(par) {
    this.par = par;
    this.element = document.createElement('div');
    document.body.append(this.element);

    this.root = createRoot(this.element);
    this.root.render(createElement(
      'div',
      {
        style: {
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 10,
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          font: '14px sans-serif',
          color: '#243244'
        }
      },
      createElement(
        'label',
        { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
        createElement('input', { type: 'checkbox' }),
        'Отладка'
      )
    ));
  }
}
