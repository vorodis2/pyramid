export class PiramidkaGeneration {
  constructor(par, addBlock) {
    this.par = par;
    this.addBlock = addBlock;
  }

  restart(levels = this.par.levels, type = this.par.type) {
    this.par.beginLoading();
    levels = Math.max(5, Math.min(13, Math.round(levels)));
    this.par.levels = levels;
    window.localStorage.setItem('pyramidLevels', String(levels));
    this.par.type = type;
    window.localStorage.setItem('pyramidType', type);
    console.log('restartPiramidka type:', type);
    for (const block of this.par.arrPiramidka) {
      block.delete();
      const index = this.par.arrBlock.indexOf(block);
      if (index !== -1) this.par.arrBlock.splice(index, 1);
    }
    this.par.arrPiramidka.length = 0;

    if (type === 'random') {
      this.generateRandom(levels);
      return;
    }
    if (type === 'wide') {
      this.generateWide(levels);
      return;
    }

    const size = 0.8;
    for (let row = 0; row < levels; row++) {
      const count = levels - row;
      const arrPositions = [];
      if (type === 'spiral') {
        const segments = levels;
        const radius = segments === 1 ? 0 : size / (2 * Math.tan(Math.PI / segments)) + size / 2;
        for (let i = 0; i < segments; i++) {
          const angle = (i + (row % 2) * 0.5) * Math.PI * 2 / segments;
          arrPositions.push([Math.cos(angle) * radius,
            row * size + size / 2, Math.sin(angle) * radius]);
        }
      } else {
        for (let i = 0; i < count; i++) {
          arrPositions.push([0, row * size + size / 2, (i - (count - 1) / 2) * size]);
        }
      }
      for (const position of arrPositions) {
        const block = this.addBlock({
          color: null,
          array: [
            { type: 'box', size: [size, size, size] }
          ],
          pos: position,
          rot: type === 'spiral'
            ? [0, -Math.atan2(position[2], position[0]) * 180 / Math.PI, 0]
            : [0, 0, 0],
          move: true, density: 1 / size ** 3, friction: 0.5, restitution: 0.05
        });
        this.par.arrPiramidka.push(block);
      }
    }
  }

  generateWide(levels) {
    const partition = (length, count) => {
      const weights = Array.from({ length: count }, () => 0.7 + Math.random() * 0.6);
      const total = weights.reduce((sum, value) => sum + value, 0);
      return weights.map(value => length * value / total);
    };
    let bottom = 0;
    for (let row = 0; row < levels; row++) {
      // 35% narrower in both horizontal directions than the original wide pyramid.
      const span = (levels - row) * 0.52;
      const count = Math.max(1, Math.ceil((levels - row) * 0.7));
      const height = 0.7 + Math.random() * 0.2;
      let z = -span / 2;
      for (const depth of partition(span, count)) {
        let x = -span / 2;
        for (const width of partition(span, count)) {
          const fraction = 0.35 + Math.random() * 0.3;
          const heights = Math.random() < 0.35
            ? [height * fraction, height * (1 - fraction)] : [height];
          let base = bottom;
          for (const pieceHeight of heights) {
            const block = this.addBlock({
              color: null,
              array: [{ type: 'box', size: [width, pieceHeight, depth] }],
              pos: [x + width / 2, base + pieceHeight / 2, z + depth / 2],
              move: true, density: 1 / (width * pieceHeight * depth),
              friction: 0.5, restitution: 0.05
            });
            this.par.arrPiramidka.push(block);
            base += pieceHeight;
          }
          x += width;
        }
        z += depth;
      }
      bottom += height;
    }
  }

  generateRandom(levels) {
    let bottom = 0;
    for (let row = 0; row < levels; row++) {
      const count = levels - row;
      const width = count * 0.8;
      const height = 0.65 + Math.random() * 0.15;
      const weights = Array.from({ length: count }, () => 0.85 + Math.random() * 0.3);
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      let edge = -width / 2;
      for (const weight of weights) {
        const length = width * weight / total;
        // Some pieces are split vertically, adding irregular seams and extra tiers.
        const split = Math.random() < 0.5 || Math.abs(length - height) < 0.04;
        const fraction = 0.42 + Math.random() * 0.16;
        const heights = split ? [height * fraction, height * (1 - fraction)] : [height];
        let base = bottom;
        for (const pieceHeight of heights) {
          const depth = 0.52 + Math.random() * 0.03;
          const block = this.addBlock({
            color: null,
            array: [{ type: 'box', size: [depth, pieceHeight, length] }],
            pos: [0, base + pieceHeight / 2, edge + length / 2],
            move: true, density: 1 / (depth * pieceHeight * length),
            friction: 0.5, restitution: 0.05
          });
          this.par.arrPiramidka.push(block);
          base += pieceHeight;
        }
        edge += length;
      }
      bottom += height;
    }
  }
}
