import * as THREE from 'three';
import { Shape } from './Shape.js';
import { Model } from './Model.js';
import { disposeObject } from './disposeObject.js';
import { BStatus } from './BStatus.js';
import { VisuPhysics } from './VisuPhysics.js';

export class Block {
  constructor(par) {
    this.par = par;
    this.boolLoad = false;
    this.loadError = null;
    this.bStatus = new BStatus(this);
    this.visuPhysics = new VisuPhysics(this);
    this.shape = new Shape(this);
    this.model = new Model(this);

    this.initialize = (options) => {
      this.delete();
      this.boolLoad = false;
      this.loadError = null;
      this.modelReady = null;
      const { object3D = null, ...shapeOptions } = options;
      this.source = object3D?.src ?? null;
      this.content3D = new THREE.Object3D();
      this.par.content3D.add(this.content3D);
      this.body = this.shape.initialize(shapeOptions);
      this.update();
      window.visi3D.addChildMouse(this.content3D);
      this.visuPhysics.active = this.par.debugPhysics;
    };

    this.addPrimitive = () => {
      this.shape.create();
      this.bStatus.refresh();
      if (this.source) this.modelReady = this.model.load();
      else this.boolLoad = true;
    };

    this.update = () => {
      if (!this.body) return;
      this.content3D.position.copy(this.body.getPosition());
      this.content3D.quaternion.copy(this.body.getQuaternion());
    };

    this.delete = () => {
      this.boolLoad = false;
      if (!this.content3D) return;
      this.bStatus.dispose();
      this.visuPhysics.dispose();
      if (this.par.manager?.dragger.body === this.body) this.par.manager.dragger.stop();
      window.visi3D.removeChildMouse(this.content3D);
      if (this.shape.mirror && this.par.par.managerScan.mirrorObject === this.content3D) {
        this.par.par.managerScan.mirrorObject = null;
      }
      this.content3D.removeFromParent();
      disposeObject(this.content3D);
      // Oimo removes the body's proxies but leaves overlapping contacts alive.
      // Detach them first so old bodies cannot remain in the solver's islands.
      while (this.body.contactLink) {
        this.par.world.removeContact(this.body.contactLink.contact);
      }
      this.body.remove();
      this.body = null;
      this.content3D = null;
    };
  }
}
