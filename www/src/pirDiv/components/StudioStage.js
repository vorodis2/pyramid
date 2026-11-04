import * as THREE from 'three';

export class StudioStage {
  constructor(scene) {
    this.content3D = new THREE.Group();
    scene.add(this.content3D);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({
      color: 0x241e19, roughness: 0.46, metalness: 0.3
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.64;
    floor.receiveShadow = true;
    this.content3D.add(floor);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(7.8225, 0.025, 8, 192),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb84d).multiplyScalar(5) }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.5;
    this.content3D.add(ring);
    const glow = new THREE.Mesh(new THREE.RingGeometry(7.7625, 9.75, 160), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying float radius; void main() {
        radius = length(position.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
      fragmentShader: `varying float radius; void main() {
        float glow = exp(-max(radius - 7.8, 0.0) * 3.4667) * (1.0 - smoothstep(9.0, 9.75, radius));
        gl_FragColor = vec4(1.0, 0.38, 0.06, glow * 0.4);
      }`
    }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.63;
    this.content3D.add(glow);
    const rim = new THREE.DirectionalLight(0xbac9e0, 0.65);
    rim.position.set(6, 8, -8);
    rim.target.position.set(2, 3, 0);
    this.content3D.add(rim, rim.target);
    const warmFill = new THREE.PointLight(0xffb05a, 45, 30, 2);
    warmFill.position.set(-5, 3, 5);
    this.content3D.add(warmFill);
  }
}
