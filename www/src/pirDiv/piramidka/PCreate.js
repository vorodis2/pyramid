import { createSpiderShapes } from './Spider.js';
import * as THREE from 'three';
import { createAssistantCharacter } from './AssistantCharacter.js';

export class PCreate {
  constructor(par, addBlock) {
    this.par = par;
    this.addBlock = addBlock;
    this.dropTimeout = null;
  }

  clear() {
    clearTimeout(this.dropTimeout);
    this.dropTimeout = null;
  }

  initialize() {
    this.par.clear();
    this.par.beginLoading();
    // Lower ground catches blocks that fall off the podium.
    this.addBlock({
      color: 0x241e19,
      array: [
        { type: 'box', size: [200, 2, 200] }
      ],
      pos: [0, -1.66, 0],
      move: false, friction: 0.6, restitution: 0.05
    });
    this.addBlock({
      color: 0x625446,
      array: [
        { type: 'cylinder', size: [7.875, 0.6, 7.875], segments: 128, bevel: 0.08 }
      ],
      pos: [0, -0.3, 0],
      move: false, friction: 0.5, restitution: 0.05
    });
    this.addBlock({
      color: 0x655c50,
      array: [
        { type: 'box', size: [18, 18, 6] }
      ],
      // Keep the lower end of the upper surface embedded in the ground.
      pos: [-16, -0.6 + 9 * Math.sin(20 * Math.PI / 180) - Math.cos(20 * Math.PI / 180)-7, 0],
      rot: [0, 0, -18], move: false, friction: 0.6, restitution: 0.05
    });



    // Four separate dynamic cylinders stacked on the lower ground beside the ramp.
    for (let i = 0; i < 4; i++) {
      this.addBlock({
        color: i % 2 === 0 ? 0x625446 : 0x53473c,
        array: [
          { type: 'cylinder', size: [0.8, 0.8, 0.8], segments: 64, bevel: 0.05 }
        ],
        pos: [-7, -0.66 + 0.4 + i * 0.8, -6],
        move: true, density: 1, friction: 0.6, restitution: 0.05
      });
    }

    const spiderX = -1;
    const spiderZ = -10.5;
    const spiderScale = 0.7;
    const cylinderHeight = 0.8;
    const cylinderCount = 4;
    const groundY = -0.66;
    for (let i = 0; i < cylinderCount; i++) {
      this.addBlock({
        color: i % 2 === 0 ? 0x625446 : 0x53473c,
        array: [
          { type: 'cylinder', size: [1.8, cylinderHeight, 1.8], segments: 64, bevel: 0.05 }
        ],
        pos: [spiderX, groundY + cylinderHeight * (i + 0.5), spiderZ],
        move: true, density: 1, friction: 0.6, restitution: 0.05
      });
    }
    const assistantX = 5.5;
    const assistantZ = -9.5;
    for (let i = 0; i < cylinderCount; i++) {
      this.addBlock({
        color: i % 2 === 0 ? 0x625446 : 0x53473c,
        array: [{ type: 'cylinder', size: [1.3, cylinderHeight, 1.3], segments: 64, bevel: 0.05 }],
        pos: [assistantX, groundY + cylinderHeight * (i + 0.5), assistantZ],
        rot: [0, 40, 0],
        move: true, density: 1, friction: 0.6, restitution: 0.05
      });
    }
    const assistant = createAssistantCharacter();
    const assistantPosition = assistant.center.clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(310))
      .add(new THREE.Vector3(assistantX, groundY + cylinderCount * cylinderHeight + 0.02, assistantZ));
    this.addBlock({
      bTitle: {
        position: new THREE.Vector3(0, 2.62, 0).sub(assistant.center).toArray(),
        title: 'GPT • Coding Assistant',
        text: 'GPT helped me build this scene: write and debug code, set up compound physics, create characters, and refine menus, tooltips and layout.',
        src: new URL('../../../resources/assistant-character-transparent.png', import.meta.url).href
      },
      color: 0x287c78,
      array: assistant.arrShapes,
      pos: assistantPosition.toArray(),
      rot: [0, 310, 0],
      move: true, density: 1, friction: 0.6, restitution: 0.05
    });
    const dinosaurX = 10;
    const dinosaurZ = -5.5;
    for (let i = 0; i < cylinderCount; i++) {
      this.addBlock({
        color: i % 2 === 0 ? 0x625446 : 0x53473c,
        array: [{ type: 'cylinder', size: [1.8, cylinderHeight, 1.8], segments: 64, bevel: 0.05 }],
        pos: [dinosaurX, groundY + cylinderHeight * (i + 0.5), dinosaurZ],
        rot: [0, 40, 0],
        move: true, density: 1, friction: 0.6, restitution: 0.05
      });
    }
    this.addBlock({
      object3D: {
        src: new URL('../../../resources/models/indoraptor-10k-512.glb', import.meta.url).href
      },
      color: 0x657991,
      // Center the feet over the pedestal and place the balance point at the soles.
      array: [{ type: 'model', size: [3.4, 2, 3.4], parts: 5, pos: [-0.444, 1, 0] }],
      pos: [dinosaurX, groundY + cylinderCount * cylinderHeight + 0.02, dinosaurZ],
      rot: [0, 40, 0],
      move: true, density: 1, friction: 0.6, restitution: 0.05
    });
    this.par.restartPiramidka(this.par.levels, this.par.type);
    this.addBlock({
      bTitle: {
        position: [0, 0.43, 0],
        title: '3D Developer • Vibe Coder',
        text: 'I build interactive 3D worlds, physics simulations, and web apps with Three.js, WebGL, and JavaScript. Over 10 years of experience turning ideas into engaging experiences, from robots to virtual spaces.',
        src: new URL('../../../resources/Screenshot_49.png', import.meta.url).href
      },
      object3D: {
        src: new URL('../../../resources/models/chess_512_half_vertices.glb', import.meta.url).href
      },
      color: 0xffc857,
      array: [
        { type: 'model', size: [1, 1, 1], parts: 5 }
      ],
      pos: [-7, 3.04, -6],
      rot: [0, 40, 0],
      move: true, density: 1, friction: 0.5, restitution: 0.05
    });

    const radius = 0.6;
    this.par.ball = this.addBlock({
      color: 0xf4f6fa,
      mirror: true,
      array: [
        { type: 'sphere', size: [radius] }
      ],
      pos: [-20.4, 6.7, 0],
      move: true, density: 25, friction: 0.6, restitution: 0.05
    }).content3D;

    const dropObject = () => {
      this.par.beginLoading();
      this.addBlock({
        bTitle: {
          position: [0, 0.97 * spiderScale + 0.08, 0],
          title: 'OimoPhysics.js',
          text: 'Build physical objects from simple shapes: spheres, boxes and cylinders. This spider combines 60 shapes into one rigid body with gravity and collisions.',
          src: new URL('../../../resources/oimophysics-shapes.svg', import.meta.url).href
        },
        color: 0x8c9baf,
        array: createSpiderShapes(spiderScale),
        pos: [spiderX, groundY + cylinderCount * cylinderHeight + 0.71 * spiderScale + 0.02, spiderZ],
        move: true, density: 1, friction: 0.6, restitution: 0.05
      });
    };

    this.dropTimeout = setTimeout(dropObject, 1500);
  }
}
