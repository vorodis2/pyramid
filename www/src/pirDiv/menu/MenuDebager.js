import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MenuD1 } from './MenuD1.js';
import { MenuD2 } from './MenuD2.js';

export class MenuDebager {
  constructor(par) {
    this.par = par;
    this.param = window.param;
    this.menuD1 = new MenuD1(this);
    this.menuD2 = new MenuD2(this);
    const otstup = this.param.otstup;
    const collapsedSize = this.param.wh + otstup * 2;
    const contentWidth = 160 + otstup * 2;
    const expandedWidth = contentWidth + otstup * 2;
    const menuDebug = window.localStorage.getItem('menuDebug');
    this._active = menuDebug !== 'false';
    window.localStorage.setItem('menuDebug', String(this._active));
    console.log('menuDebug:', this._active);
    this.dragActive = () => {
      if (this.icon) {
        this.icon.style.transform = this.active ? 'rotate(0deg)' : 'rotate(90deg)';
        this.icon.style.color = this.active ? this.param.colorActive : this.param.color;
      }
      if (this.title) {
        this.title.style.color = this.active ? this.param.colorActive : this.param.color;
      }
      if (this.button) {
        this.button.setAttribute('aria-pressed', String(this.active));
        this.button.setAttribute('aria-expanded', String(this.active));
      }
      if (this.panel) {
        this.panel.style.height = this.active
          ? `${this.param.wh + otstup * 3 + this.content.scrollHeight}px`
          : `${collapsedSize}px`;
        this.panel.style.width = `${this.active ? expandedWidth : collapsedSize}px`;
      }
      if (this.content) {
        this.content.style.opacity = this.active ? '1' : '0';
        this.content.style.transform = this.active ? 'translateY(0)' : `translateY(-${otstup * 2}px)`;
        this.content.inert = !this.active;
        this.content.setAttribute('aria-hidden', String(!this.active));
      }
    };
    this.element = document.createElement('div');
    document.body.append(this.element);

    this.root = createRoot(this.element);
    this.root.render(createElement(
      'div',
      {
        ref: (element) => { this.panel = element; },
        style: {
          position: 'fixed',
          top: otstup,
          left: otstup,
          zIndex: 10,
          padding: otstup,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: otstup,
          height: this.active ? 'auto' : collapsedSize,
          maxHeight: `calc(100dvh - ${otstup * 2}px)`,
          width: this.active ? expandedWidth : collapsedSize,
          maxWidth: `calc(100vw - ${otstup * 2}px)`,
          overflow: 'hidden',
          transition: `height ${this.param.timeAnimation}s ease-in-out, width ${this.param.timeAnimation}s ease-in-out`,
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          font: '14px sans-serif',
          color: this.param.colorFont
        }
      },
      createElement(
        'div',
        {
          ref: (element) => { this.title = element; },
          style: {
            position: 'absolute',
            top: otstup,
            left: otstup,
            right: this.param.wh + otstup * 2,
            height: this.param.wh,
            lineHeight: `${this.param.wh}px`,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            color: this.active ? this.param.colorActive : this.param.color,
            transition: `color ${this.param.timeAnimation}s ease-in-out`
          }
        },
        'Debug'
      ),
      createElement(
        'button',
        {
          type: 'button',
          'aria-label': 'Меню отладки',
          title: 'Меню отладки',
          'aria-pressed': this.active,
          'aria-expanded': this.active,
          ref: (element) => { this.button = element; },
          onClick: () => { this.active = !this.active; },
          style: {
            alignSelf: 'flex-end',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: otstup,
            width: this.param.wh,
            height: this.param.wh,
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: otstup,
            border: '1px solid #c9d3df',
            borderRadius: '5px',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer'
          }
        },
        createElement('span', {
          'aria-hidden': true,
          ref: (element) => {
            this.icon = element;
            if (element) element.style.transform = this.active ? 'rotate(0deg)' : 'rotate(90deg)';
          },
          style: {
            display: 'block',
            width: '18px',
            height: '14px',
            backgroundColor: 'currentColor',
            color: this.active ? this.param.colorActive : this.param.color,
            mask: `url("${new URL('../../../resources/menu.svg', import.meta.url).href}") center / contain no-repeat`,
            transformOrigin: 'center',
            transition: `transform ${this.param.timeAnimation}s ease-in-out, color ${this.param.timeAnimation}s ease-in-out`
          }
        })
      ),
      createElement(
        'div',
        {
          ref: (element) => {
            this.content = element;
            if (element) element.inert = !this.active;
          },
          'aria-hidden': !this.active,
          style: {
            flex: '0 1 auto',
            minHeight: 0,
            width: contentWidth,
            overflow: 'hidden',
            opacity: this.active ? 1 : 0,
            transform: this.active ? 'translateY(0)' : `translateY(-${otstup * 2}px)`,
            transition: `opacity ${this.param.timeAnimation}s ease-in-out, transform ${this.param.timeAnimation}s ease-in-out`
          }
        },
        this.menuD2.render(),
        this.menuD1.render()
      )
    ));
  }

  get active() {
    return this._active;
  }

  set active(value) {
    this._active = Boolean(value);
    window.localStorage.setItem('menuDebug', String(this._active));
    this.dragActive();
  }
}
