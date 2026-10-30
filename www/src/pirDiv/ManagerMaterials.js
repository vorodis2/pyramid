import * as THREE from 'three';

export class ManagerMaterials {
  constructor(par) {
    this.par = par;
    window.managerMaterial = this;

    const arrVariants = [
      { color: 0xff0000, metalness: 0.35, roughness: 0.25 },
      { color: 0xff6b8a, metalness: 0.15, roughness: 0.4 },
      { color: 0xffc857, metalness: 0.55, roughness: 0.3 }
    ];
    let index = 0;

    this.getBeautifulColor = () => {
      const material = new THREE.MeshStandardMaterial(arrVariants[index]);
      index = (index + 1) % arrVariants.length;
      return material;
    };
  }
}
