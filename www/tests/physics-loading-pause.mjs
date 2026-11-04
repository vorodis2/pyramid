import assert from 'node:assert/strict';
import { ManagerPhysik } from '../src/pirDiv/ManagerPhysik.js';

const storage = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value)
} };
const par = { piramidka: { loading: true }, menu: { menuPreloader: { active: true } } };
const physics = new ManagerPhysik(par);
const body = physics.world.add({ type: 'sphere', size: [0.5], pos: [0, 5, 0], move: true });
physics.update(5);
assert.equal(body.getPosition().y, 5);
assert.equal(physics.active, true, 'Loading pause must not alter the user physics setting');
par.piramidka.loading = false;
physics.update(1);
assert.equal(body.getPosition().y, 5, 'Visible preloader must still pause physics');
par.menu.menuPreloader.active = false;
physics.update(1 / 60);
assert(body.getPosition().y < 5 && body.getPosition().y > 4.99, 'Resume must take one step without accumulated loading time');
par.piramidka.loading = true;
const position = body.getPosition().y;
physics.update(1);
assert.equal(body.getPosition().y, position, 'A restart must pause physics again');
physics.world.clear();
console.log('PASS: loading pauses physics without changing user settings or accumulating time');
