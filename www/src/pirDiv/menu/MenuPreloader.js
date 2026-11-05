export class MenuPreloader {
  constructor(par) {
    this.par = par;
    this._active = true;
    this.progress = 0;
    this.element = document.createElement('div');
    Object.assign(this.element.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '5',
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(16, 13, 11, 0.15)'
    });

    this.slider = document.createElement('div');
    this.slider.setAttribute('role', 'progressbar');
    this.slider.setAttribute('aria-label', 'Loading');
    this.slider.setAttribute('aria-valuemin', '0');
    this.slider.setAttribute('aria-valuemax', '100');
    this.slider.setAttribute('aria-valuenow', '0');
    Object.assign(this.slider.style, {
      width: 'min(280px, 70vw)',
      height: `${window.param.fontSizeLittel * 1.2 + window.param.otstup * 2}px`,
      border: '1px solid #53473c',
      borderRadius: '9px',
      overflow: 'hidden',
      background: '#241e19'
    });
    this.slider.style.position = 'relative';
    this.fill = document.createElement('div');
    Object.assign(this.fill.style, {
      width: '100%',
      height: '100%',
      background: '#53473c',
      transformOrigin: 'left',
      transform: 'scaleX(0)'
    });
    this.slider.append(this.fill);
    this.label = document.createElement('span');
    Object.assign(this.label.style, {
      position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
      font: `${window.param.fontSizeLittel}px sans-serif`, color: window.param.colorFont,
      pointerEvents: 'none'
    });
    this.slider.append(this.label);
    this.element.append(this.slider);
    document.body.append(this.element);

    this.setProgress(0);
  }

  setProgress(percent) {
    this.progress = Math.max(0, Math.min(100, percent));
    this.fill.style.transform = `scaleX(${this.progress / 100})`;
    this.label.textContent = `${Math.round(this.progress)}%`;
    this.slider.setAttribute('aria-valuenow', String(Math.round(this.progress)));
  }

  get active() {
    return this._active;
  }

  set active(value) {
    this._active = Boolean(value);
    this.element.style.display = this._active ? 'grid' : 'none';
  }
}
