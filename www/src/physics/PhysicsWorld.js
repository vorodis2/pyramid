import { oimo } from 'oimophysics';
import * as THREE from 'three';

const { Vec3, Quat } = oimo.common;
const { RigidBody, RigidBodyConfig, RigidBodyType, Shape, ShapeConfig } = oimo.dynamics.rigidbody;
const { BoxGeometry, SphereGeometry, CylinderGeometry, ConvexHullGeometry } = oimo.collision.geometry;
const { SphericalJoint, SphericalJointConfig } = oimo.dynamics.constraint.joint;
const vec = (values = [0, 0, 0]) => new Vec3(...values);

// Application-facing operations shared by the two scene entry points.
// All simulation, contacts and joints are handled by OimoPhysics.
class Body {
  constructor(world, options) {
    this.parent = world;
    this.scale = world.scale;
    this.options = options;
    this.arrShapes = [];
    const config = new RigidBodyConfig();
    config.position = vec(options.pos);
    config.rotation.fromEulerXyz(vec((options.rot ?? [0, 0, 0]).map((v) => v * Math.PI / 180)));
    config.type = options.kinematic ? RigidBodyType.KINEMATIC
      : options.move ? RigidBodyType.DYNAMIC : RigidBodyType.STATIC;
    config.autoSleep = !options.neverSleep && !options.kinematic;
    this.native = new RigidBody(config);
    this.native.userData = this;
    this._position = new Vec3();
    this._quaternion = new Quat();
    const arrTypes = Array.isArray(options.type) ? options.type : [options.type ?? 'box'];
    const sizes = options.size ?? [1, 1, 1];
    arrTypes.forEach((type, i) => {
      const offset = i * 3;
      const size = [sizes[offset] ?? 1, sizes[offset + 1] ?? sizes[offset] ?? 1, sizes[offset + 2] ?? sizes[offset] ?? 1];
      this.addShape(type, size, (options.posShape ?? []).slice(offset, offset + 3),
        (options.rotShape ?? []).slice(offset, offset + 3));
    });
  }

  addShape(type, size, position = [], rotation = [], vertices = null) {
    const config = new ShapeConfig();
    const options = this.options;
    config.position = vec([position[0] ?? 0, position[1] ?? 0, position[2] ?? 0]);
    const angles = [rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0];
    config.rotation.fromEulerXyz(vec(angles.map((v) => v * Math.PI / 180)));
    config.density = options.density ?? 1;
    config.friction = options.friction ?? 0.5;
    config.restitution = options.restitution ?? 0.05;
    config.collisionGroup = options.belongsTo ?? 1;
    config.collisionMask = options.collidesWith ?? -1;
    if (type === 'convex') config.geometry = new ConvexHullGeometry(vertices.map((p) => new Vec3(p.x, p.y, p.z)));
    else if (type === 'sphere') config.geometry = new SphereGeometry(size[0]);
    else if (type === 'cylinder') config.geometry = new CylinderGeometry(size[0], size[1] / 2);
    else config.geometry = new BoxGeometry(vec(size.map((v) => v / 2)));
    if (type === 'convex') config.geometry.setGjkMergin(0.005);
    const native = new Shape(config);
    this.native.addShape(native);
    const r = config.rotation;
    const elements = [r.e00, r.e01, r.e02, r.e10, r.e11, r.e12, r.e20, r.e21, r.e22];
    const shape = {
      native, type, vertices,
      relativePosition: new THREE.Vector3(config.position.x, config.position.y, config.position.z).divideScalar(this.scale),
      relativeRotation: { elements }, next: null,
      ...(type === 'sphere' ? { radius: size[0] / this.scale }
        : type === 'cylinder' ? { radius: size[0] / this.scale, height: size[1] / this.scale }
          : type === 'convex' ? {}
            : { width: size[0] / this.scale, height: size[1] / this.scale, depth: size[2] / this.scale,
              halfWidth: size[0] / (2 * this.scale), halfHeight: size[1] / (2 * this.scale), halfDepth: size[2] / (2 * this.scale) })
    };
    if (this.arrShapes.length) this.arrShapes.at(-1).next = shape;
    this.arrShapes.push(shape);
  }

  get shapes() { return this.arrShapes[0] ?? null; }
  get numShapes() { return this.arrShapes.length; }
  get isDynamic() { return this.native.getType() === RigidBodyType.DYNAMIC; }
  get sleeping() { return this.native.isSleeping(); }
  get next() {
    if (!this.parent) return null;
    return this.parent.bodies[this.parent.bodies.indexOf(this) + 1] ?? null;
  }
  get position() { return new THREE.Vector3().copy(this.getPosition()).divideScalar(this.scale); }
  getPosition() { this.native.getPositionTo(this._position); return this._position; }
  getQuaternion() { this.native.getOrientationTo(this._quaternion); return this._quaternion; }
  resetPosition(x, y, z) { this.native.setPosition(new Vec3(x, y, z)); this.awake(); }
  awake() { this.native.wakeUp(); }
  sleep() { this.native.sleep(); }
  remove() { this.parent?.removeRigidBody(this); }
}

export class World {
  constructor(options = {}) {
    this.scale = options.worldscale ?? 1;
    this.timeStep = options.timestep ?? 1 / 60;
    this.native = new oimo.dynamics.World(2, vec(options.gravity ?? [0, -9.81, 0]));
    this.native.setNumVelocityIterations(options.iterations ?? 8);
    this.native.setNumPositionIterations(3);
    this.bodies = [];
    this.joints = new Set();
  }

  add(options) {
    if (options.type === 'jointBall') {
      const config = new SphericalJointConfig();
      config.rigidBody1 = options.body1.native;
      config.rigidBody2 = options.body2.native;
      config.localAnchor1 = vec(options.pos1);
      config.localAnchor2 = vec(options.pos2);
      config.allowCollision = options.collision ?? false;
      const native = new SphericalJoint(config);
      this.native.addJoint(native);
      const joint = { native, parent: this, body1: options.body1, body2: options.body2,
        localAnchorPoint1: config.localAnchor1, localAnchorPoint2: config.localAnchor2 };
      this.joints.add(joint);
      return joint;
    }
    const body = new Body(this, options);
    this.native.addRigidBody(body.native);
    this.bodies.push(body);
    return body;
  }

  setConvexShapes(body, arrVertices) {
    for (const shape of body.arrShapes) body.native.removeShape(shape.native);
    body.arrShapes.length = 0;
    for (const vertices of arrVertices) body.addShape('convex', [], [], [], vertices);
    body.awake();
  }

  setPrimitiveShapes(body, arrShapes) {
    for (const shape of body.arrShapes) body.native.removeShape(shape.native);
    body.arrShapes.length = 0;
    for (const shape of arrShapes) body.addShape(shape.type, shape.size, shape.position, shape.rotation);
    body.awake();
  }

  removeRigidBody(body) {
    if (body.parent !== this) return;
    for (const joint of this.joints) {
      if (joint.body1 === body || joint.body2 === body) this.removeJoint(joint);
    }
    this.native.removeRigidBody(body.native);
    this.bodies.splice(this.bodies.indexOf(body), 1);
    body.parent = null;
  }

  removeJoint(joint) {
    if (!this.joints.delete(joint)) return;
    this.native.removeJoint(joint.native);
    joint.parent = null;
  }

  step() { this.native.step(this.timeStep); }
  clear() { for (const body of [...this.bodies]) this.removeRigidBody(body); }
  get rigidBodies() { return this.bodies[0] ?? null; }
  get numRigidBodies() { return this.native.getNumRigidBodies(); }
  get numJoints() { return this.native.getNumJoints(); }
  get numContacts() { return this.native.getContactManager().getNumContacts(); }
  get contacts() {
    let first = null;
    let last = null;
    for (let contact = this.native.getContactManager().getContactList(); contact; contact = contact.getNext()) {
      const entry = { body1: contact.getShape1().getRigidBody().userData,
        body2: contact.getShape2().getRigidBody().userData, next: null };
      if (last) last.next = entry; else first = entry;
      last = entry;
    }
    return first;
  }
}
