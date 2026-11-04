import * as THREE from 'three';

export class Dragger {
  constructor(par) {
    this.par = par;
    this.world = this.par.par.world;
    this._blockEventActive = null;
    this.joint = null;
    this.anchor = null;
    this.body = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.plane = new THREE.Plane();
    this.point = new THREE.Vector3();
    this.localAnchor = new THREE.Vector3();
    this.bodyRotation = new THREE.Quaternion();
    this.markerCameraPosition = new THREE.Vector3();
    this.visual = null;
    this.springSegments = 128;
    this.springDirection = new THREE.Vector3();
    this.springSide = new THREE.Vector3();
    this.springUp = new THREE.Vector3();
    this.springVertex = new THREE.Vector3();
    this.move = (event) => {
      if (!this.body) return;
      if (this.body.parent !== this.world) {
        this.stop();
        return;
      }
      const cursor = event.touches?.[0] ?? event;
      if (!Number.isFinite(cursor.clientX) || !Number.isFinite(cursor.clientY)) return;
      const rect = this.scan.renderer.domElement.getBoundingClientRect();
      this.pointer.set(
        (cursor.clientX - rect.left) / rect.width * 2 - 1,
        -(cursor.clientY - rect.top) / rect.height * 2 + 1
      );
      this.scan.scene.updateMatrixWorld(true);
      this.raycaster.setFromCamera(this.pointer, this.scan.camera);
      if (!this.raycaster.ray.intersectPlane(this.plane, this.point)) return;
      this.par.par.content3D.worldToLocal(this.point);
      this.anchor.resetPosition(this.point.x, this.point.y, this.point.z);
      this.body.awake();
      this.update();
      event.preventDefault();
    };
    this.up = () => this.stop();
  }

  drawObject() {
    this.stop();
    const event = this._blockEventActive;
    const body = event?.block?.body;
    const mouse = event?.originalEvent;
    if (!body?.isDynamic || !event.point || !mouse) return;
    if (mouse.button !== undefined && mouse.button !== 0) return;

    this.scan = this.par.par.par.managerScan;
    this.world = this.par.par.world;
    this.scan.scene.updateMatrixWorld(true);
    const normal = this.scan.camera.getWorldDirection(new THREE.Vector3());
    this.plane.setFromNormalAndCoplanarPoint(normal, event.point);
    const physicsPoint = this.par.par.content3D.worldToLocal(event.point.clone());
    const rotation = new THREE.Quaternion().copy(body.getQuaternion()).invert();
    const localPoint = physicsPoint.clone().sub(body.getPosition()).applyQuaternion(rotation);
    this.localAnchor.copy(localPoint);
    this.anchor = this.world.add({
      type: 'sphere', size: [0.01], pos: physicsPoint.toArray(),
      move: false, belongsTo: 0, collidesWith: 0
    });
    this.body = body;
    this.joint = this.world.add({
      type: 'jointBall', body1: this.anchor, body2: body,
      pos1: [0, 0, 0], pos2: localPoint.toArray(), collision: false
    });
    this.createVisual();
    this.update();
    body.awake();
    this.controls = this.scan.visi3D.position3d;
    this.previousPause = this.controls.pause;
    this.controls.pause = true;
    this.controls.boolDrag = false;
    window.addEventListener('pointermove', this.move, { passive: false });
    window.addEventListener('touchmove', this.move, { passive: false });
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
    window.addEventListener('touchend', this.up);
    window.addEventListener('touchcancel', this.up);
    window.addEventListener('blur', this.up);
  }

  createVisual() {
    this.visual = new THREE.Group();
    const marker = (color) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 8),
        new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false })
      );
      mesh.renderOrder = 1001;
      mesh.raycast = () => {};
      this.visual.add(mesh);
      return mesh;
    };
    this.blockPoint = marker(0xffc857);
    this.worldPoint = marker(0x00aadd);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((this.springSegments + 1) * 3), 3));
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: 0xffffff, depthTest: false, depthWrite: false
    }));
    this.line.renderOrder = 1000;
    this.line.frustumCulled = false;
    this.line.raycast = () => {};
    this.visual.add(this.line);
    this.par.par.content3D.add(this.visual);
  }

  update() {
    if (!this.visual) return;
    if (this.body?.parent !== this.world || this.joint?.parent !== this.world) {
      this.stop();
      return;
    }
    this.bodyRotation.copy(this.body.getQuaternion());
    this.blockPoint.position.copy(this.localAnchor)
      .applyQuaternion(this.bodyRotation).add(this.body.getPosition());
    this.worldPoint.position.copy(this.anchor.position).multiplyScalar(this.world.scale);
    const positions = this.line.geometry.attributes.position;
    this.springDirection.subVectors(this.worldPoint.position, this.blockPoint.position);
    const length = this.springDirection.length();
    if (length > 1e-8) this.springDirection.divideScalar(length);
    else this.springDirection.set(0, 1, 0);
    this.springUp.set(Math.abs(this.springDirection.y) < 0.9 ? 0 : 1,
      Math.abs(this.springDirection.y) < 0.9 ? 1 : 0, 0);
    this.springSide.crossVectors(this.springDirection, this.springUp).normalize();
    this.springUp.crossVectors(this.springSide, this.springDirection).normalize();
    const radius = Math.min(0.07, length * 0.18);
    for (let i = 0; i <= this.springSegments; i++) {
      const t = i / this.springSegments;
      const angle = t * Math.PI * 2 * 8;
      const taper = Math.min(1, t * 8, (1 - t) * 8);
      this.springVertex.lerpVectors(this.blockPoint.position, this.worldPoint.position, t)
        .addScaledVector(this.springSide, Math.cos(angle) * radius * taper)
        .addScaledVector(this.springUp, Math.sin(angle) * radius * taper);
      positions.setXYZ(i, this.springVertex.x, this.springVertex.y, this.springVertex.z);
    }
    positions.needsUpdate = true;
    this.scan.camera.updateWorldMatrix(true, false);
    for (const marker of [this.blockPoint, this.worldPoint]) {
      marker.getWorldPosition(this.markerCameraPosition);
      this.markerCameraPosition.applyMatrix4(this.scan.camera.matrixWorldInverse);
      const unitsPerPixel = 2 * Math.max(-this.markerCameraPosition.z, this.scan.camera.near)
        / (this.scan.camera.projectionMatrix.elements[5] * this.scan.renderer.domElement.getBoundingClientRect().height);
      marker.scale.setScalar(3 * unitsPerPixel);
    }
  }

  stop() {
    if (this.visual) {
      this.visual.removeFromParent();
      this.visual.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      this.visual = null;
      this.blockPoint = null;
      this.worldPoint = null;
      this.line = null;
    }
    if (this.world && this.joint && this.joint.parent === this.world) {
      this.world.removeJoint(this.joint);
    }
    this.joint = null;
    if (this.world && this.anchor && this.anchor.parent === this.world) this.anchor.remove();
    this.anchor = null;
    this.body = null;
    if (this.controls) {
      this.controls.pause = this.previousPause;
      this.controls = null;
    }
    window.removeEventListener?.('pointermove', this.move);
    window.removeEventListener?.('touchmove', this.move);
    window.removeEventListener?.('pointerup', this.up);
    window.removeEventListener?.('pointercancel', this.up);
    window.removeEventListener?.('touchend', this.up);
    window.removeEventListener?.('touchcancel', this.up);
    window.removeEventListener?.('blur', this.up);
  }

  get blockEventActive() {
    return this._blockEventActive;
  }

  set blockEventActive(value) {
    if (this._blockEventActive === value) return;
    this._blockEventActive = value;
    this.drawObject();
  }
}
