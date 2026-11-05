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
      { style: { display: 'contents' } },
      createElement('span', { style: { lineHeight: `${this.param.fontSizeLittel * 1.2}px` } }, `${label}:`),
      createElement('a', {
        href,
        style: {
          color: label === 'website' ? this.param.color : this.param.colorFont,
          textDecoration: label === 'website' ? 'underline' : 'none',
          overflowWrap: 'anywhere',
          lineHeight: `${this.param.fontSizeLittel * 1.2}px`
        }
      }, text)
    );

    this.root = createRoot(this.element);
    this.root.render(createElement(
      'aside',
      {
        'aria-label': 'Contact information',
        style: {
          position: 'fixed',
          bottom: this.param.otstup,
          left: this.param.otstup,
          zIndex: 10,
          maxWidth: `calc(100vw - ${this.param.otstup * 2}px)`,
          boxSizing: 'border-box',
          font: `${this.param.fontSizeLittel}px/1.2 sans-serif`,
          display: 'grid',
          gridTemplateColumns: 'max-content minmax(0, 1fr)',
          gridAutoRows: `minmax(${this.param.fontSizeLittel * 1.2}px, auto)`,
          alignItems: 'start',
          columnGap: this.param.otstup,
          rowGap: 0,
          textAlign: 'left',
          color: this.param.colorFont
        }
      },
      contact('website', 'https://vorodis2.com', 'vorodis2.com'),
      contact('email', 'mailto:vorodis2@gmail.com', 'vorodis2@gmail.com'),
      contact('phone', 'tel:+380951026557', '+380951026557')
    ));
  }
}
