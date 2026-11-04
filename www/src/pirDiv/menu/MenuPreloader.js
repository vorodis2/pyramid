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
      background: 'rgba(220, 231, 242, 0.85)'
    });

    this.slider = document.createElement('div');
    this.slider.setAttribute('role', 'progressbar');
    this.slider.setAttribute('aria-label', 'Loading');
    this.slider.setAttribute('aria-valuemin', '0');
    this.slider.setAttribute('aria-valuemax', '100');
    this.slider.setAttribute('aria-valuenow', '0');
    Object.assign(this.slider.style, {
      width: 'min(280px, 70vw)',
      height: '18px',
      border: '1px solid #c9d3df',
      borderRadius: '9px',
      overflow: 'hidden',
      background: '#e2e8ef'
    });
    this.slider.style.position = 'relative';
    this.fill = document.createElement('div');
    Object.assign(this.fill.style, {
      width: '100%',
      height: '100%',
      background: window.param.color,
      transformOrigin: 'left',
      transform: 'scaleX(0)'
    });
    this.slider.append(this.fill);
    this.label = document.createElement('span');
    Object.assign(this.label.style, {
      position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
      font: '12px sans-serif', color: '#243244', textShadow: '0 0 2px white',
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
