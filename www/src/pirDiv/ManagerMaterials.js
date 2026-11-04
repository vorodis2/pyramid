import * as THREE from 'three';

export class ManagerMaterials {
  constructor(par) {
    this.par = par;
    window.managerMaterial = this;

    const arrVariants = [
      { color: 0xb82c16, metalness: 0.04, roughness: 0.38 },
      { color: 0xf2dfb9, metalness: 0.03, roughness: 0.5 },
      { color: 0xc99a52, metalness: 0.3, roughness: 0.36 },
      { color: 0xf8ead2, metalness: 0.02, roughness: 0.48 }
    ];
    let index = 0;

    this.getBeautifulColor = () => {
      const material = new THREE.MeshStandardMaterial(arrVariants[index]);
      index = (index + 1) % arrVariants.length;
      return material;
    };
  }
}
