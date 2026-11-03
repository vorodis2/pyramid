import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

export class MenuLogo {
  constructor(par) {
    this.par = par;
    this.param = window.param;
    this.element = document.createElement('div');
    document.body.append(this.element);

    const contact = (label, href, text) => createElement(
      'div',
      { style: { display: 'grid', gridTemplateColumns: '45px minmax(0, 1fr)', columnGap: this.param.otstup } },
      createElement('span', null, `${label}:`),
      createElement('a', {
        href,
        style: { color: this.param.color, overflowWrap: 'anywhere' }
      }, text)
    );

    this.root = createRoot(this.element);
    this.root.render(createElement(
      'aside',
      {
        'aria-label': 'Контактная информация',
        style: {
          position: 'fixed',
          bottom: this.param.otstup,
          left: this.param.otstup,
          zIndex: 10,
          maxWidth: `calc(100vw - ${this.param.otstup * 2}px)`,
          boxSizing: 'border-box',
          font: '12px/1.2 sans-serif',
          textAlign: 'left',
          color: this.param.color
        }
      },
      contact('website', 'https://vorodis2.com', 'vorodis2.com'),
      contact('email', 'mailto:vorodis2@gmail.com', 'vorodis2@gmail.com'),
      contact('phone', 'tel:+380951026557', '+380951026557')
    ));
  }
}
