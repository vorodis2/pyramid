import * as THREE from 'three';

export class BTitle {
  constructor(par, options) {
    this.par = par;
    this.options = options;
    this.bounds = new THREE.Box3();
    this.position = new THREE.Vector3();
    this.disposed = false;
  }

  create() {
    if (typeof document === 'undefined') return;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 2560;
    this.canvas.height = 1280;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.SpriteMaterial({
      map: this.texture, depthTest: true, depthWrite: false, toneMapped: false
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.name = 'BTitle';
    this.sprite.scale.set(2.8, 1.4, 1);
    this.sprite.center.set(96 / 640, (320 - 301) / 320);
    this.sprite.renderOrder = 1000;
    this.sprite.raycast = () => {};
    // Keep the label outside the rotating/model-replaced block hierarchy.
    this.par.par.content3D.add(this.sprite);
    if (this.options.position) {
      this.point = new THREE.Mesh(
        new THREE.SphereGeometry(0.0225, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: true, depthWrite: false, toneMapped: false })
      );
      this.point.name = 'BTitlePoint';
      this.point.renderOrder = 1001;
      this.point.raycast = () => {};
      this.sprite.parent.add(this.point);
    }
    this.draw();
    if (this.options.src) {
      this.image = new Image();
      this.image.crossOrigin = 'anonymous';
      this.image.onload = () => { if (!this.disposed) this.draw(); };
      this.image.src = this.options.src;
    }
  }

  draw() {
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(4, 0, 0, 4, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, 640, 320);
    // A single outline keeps the pointer and rounded panel visually connected.
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(40, 18);
    ctx.arcTo(622, 18, 622, 262, 22);
    ctx.arcTo(622, 262, 114, 262, 22);
    ctx.lineTo(114, 262);
    ctx.lineTo(96, 301);
    ctx.lineTo(78, 262);
    ctx.lineTo(40, 262);
    ctx.arcTo(18, 262, 18, 18, 22);
    ctx.arcTo(18, 18, 40, 18, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f1f1f1';
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(34, 34, 572, 212, 9);
    ctx.fill();
    ctx.stroke();
    const padding = 10;
    const imageX = 34 + padding;
    const imageY = 34 + padding;
    const imageWidth = 150;
    const imageHeight = 212 - padding * 2;
    const hasImage = this.image?.complete && this.image.naturalWidth > 0;
    if (hasImage) {
      const [sourceX, sourceY, sourceWidth, sourceHeight] = this.options.imageCrop
        ?? [0, 0, this.image.naturalWidth, this.image.naturalHeight];
      const scale = Math.min(imageWidth / sourceWidth, imageHeight / sourceHeight);
      const width = sourceWidth * scale;
      const height = sourceHeight * scale;
      ctx.save();
      ctx.filter = 'brightness(65%)';
      ctx.drawImage(this.image, sourceX, sourceY, sourceWidth, sourceHeight, imageX + (imageWidth - width) / 2,
        imageY + (imageHeight - height) / 2, width, height);
      ctx.restore();
    } else {
      ctx.strokeStyle = '#d5d5d5';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(imageX + imageWidth / 2, imageY + imageHeight / 2, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#d5d5d5';
      ctx.font = 'bold 125px Arial';
      ctx.fillText('!', imageX + imageWidth / 2 - 21, imageY + imageHeight / 2 + 45);
    }
    const left = imageX + imageWidth + padding;
    const maxWidth = 606 - padding - left;
    ctx.fillStyle = '#242424';
    ctx.font = '900 30px Arial Black, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(String(this.options.title ?? ''), left, imageY, maxWidth);
    ctx.font = '900 20px Arial Black, Arial, sans-serif';
    ctx.fillStyle = '#555555';
    let line = '', y = imageY + 30 + padding;
    for (const word of String(this.options.text ?? '').split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        ctx.fillText(line, left, y, maxWidth);
        y += 25;
        line = word;
      } else line = next;
      if (y > 211) break;
    }
    ctx.fillText(line, left, Math.min(y, 211), maxWidth);
    ctx.textBaseline = 'alphabetic';
    this.texture.needsUpdate = true;
  }

  update() {
    if (this.disposed) return;
    if (!this.sprite) this.create();
    if (!this.sprite) return;
    if (this.options.position) {
      this.par.content3D.updateWorldMatrix(true, false);
      this.position.fromArray(this.options.position);
      this.par.content3D.localToWorld(this.position);
      this.sprite.parent.worldToLocal(this.position);
      this.sprite.position.copy(this.position);
      this.point.position.copy(this.position);
      return;
    }
    this.bounds.setFromObject(this.par.content3D);
    this.sprite.visible = !this.bounds.isEmpty();
    if (!this.sprite.visible) return;
    this.bounds.getCenter(this.position);
    this.position.y = this.bounds.max.y + 0.2;
    this.sprite.parent.worldToLocal(this.position);
    this.sprite.position.copy(this.position);
  }

  dispose() {
    this.disposed = true;
    if (this.image) this.image.onload = null;
    this.sprite?.removeFromParent();
    this.point?.removeFromParent();
    this.point?.geometry.dispose();
    this.point?.material.dispose();
    this.texture?.dispose();
    this.material?.dispose();
  }
}
