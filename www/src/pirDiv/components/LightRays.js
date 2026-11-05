import * as THREE from 'three';

export class LightRays {
  constructor(scene, light) {
    this.content3D = new THREE.Group();
    this.content3D.name = 'Light rays';
    scene.add(this.content3D);
    const direction = light.target.position.clone().sub(light.position).normalize();
    const length = 24 * 1.5;
    const radius = 3.2 * 0.8;
    const offset = light.position.clone().sub(light.target.position);
    offset.y = 0;
    offset.normalize().multiplyScalar(radius);
    const geometry = new THREE.CylinderGeometry(1, 1, 2, 24);
    const arrBeams = [
      { end: light.target.position.clone().add(offset).toArray(), radius }
    ];
    for (const beam of arrBeams) {
      const uniforms = {
        localCamera: { value: new THREE.Vector3() },
        beamScale: { value: new THREE.Vector3(beam.radius, length / 2, beam.radius) },
        beamWorld: { value: new THREE.Matrix4() },
        shadowMatrix: { value: light.shadow.matrix },
        shadowMap: { value: null },
        hasShadow: { value: 0 },
        lightColor: { value: new THREE.Color(0xffca80) }
      };
      const material = new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec3 localPosition;
          void main() {
            localPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          #include <packing>
          varying vec3 localPosition;
          uniform vec3 localCamera;
          uniform vec3 beamScale;
          uniform mat4 beamWorld;
          uniform mat4 shadowMatrix;
          uniform sampler2D shadowMap;
          uniform float hasShadow;
          uniform vec3 lightColor;

          float illumination(vec3 p) {
            if (hasShadow < 0.5) return 1.0;
            vec4 shadow = shadowMatrix * beamWorld * vec4(p, 1.0);
            vec3 coord = shadow.xyz / shadow.w;
            if (any(lessThan(coord, vec3(0.0))) || any(greaterThan(coord, vec3(1.0)))) return 1.0;
            float depth = unpackRGBAToDepth(texture2D(shadowMap, coord.xy));
            return coord.z <= depth + 0.001 ? 1.0 : 0.05;
          }

          void main() {
            vec3 ray = normalize(localPosition - localCamera);
            float a = dot(ray.xz, ray.xz);
            float b = dot(localCamera.xz, ray.xz);
            float c = dot(localCamera.xz, localCamera.xz) - 1.0;
            float enter = -1.0e6;
            float leave = 1.0e6;
            if (a < 0.000001) {
              if (c > 0.0) discard;
            } else {
              float d = b * b - a * c;
              if (d < 0.0) discard;
              enter = (-b - sqrt(d)) / a;
              leave = (-b + sqrt(d)) / a;
            }
            if (abs(ray.y) < 0.000001) {
              if (abs(localCamera.y) > 1.0) discard;
            } else {
              float cap1 = (-1.0 - localCamera.y) / ray.y;
              float cap2 = (1.0 - localCamera.y) / ray.y;
              enter = max(enter, min(cap1, cap2));
              leave = min(leave, max(cap1, cap2));
            }
            enter = max(enter, 0.0);
            if (leave <= enter) discard;
            float stepSize = (leave - enter) / 24.0;
            float density = 0.0;
            for (int i = 0; i < 24; i++) {
              vec3 p = localCamera + ray * (enter + (float(i) + 0.5) * stepSize);
              float radial = pow(max(0.0, 1.0 - dot(p.xz, p.xz)), 3.0);
              float ends = smoothstep(-1.0, -0.45, p.y) * (1.0 - smoothstep(0.45, 1.0, p.y));
              // Fade out above the podium instead of exposing the cylinder's cut.
              float heightFade = smoothstep(0.25, 3.5, (beamWorld * vec4(p, 1.0)).y);
              density += radial * ends * heightFade * illumination(p);
            }
            float alpha = 1.0 - exp(-density * stepSize * length(ray * beamScale) * 0.13);
            if (alpha < 0.002) discard;
            gl_FragColor = vec4(lightColor, min(alpha, 0.18) * 0.7);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.position.fromArray(beam.end).addScaledVector(direction, -length / 2);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      mesh.scale.copy(uniforms.beamScale.value);
      mesh.renderOrder = 20;
      mesh.raycast = () => {};
      mesh.onBeforeRender = (_renderer, _scene, camera) => {
        camera.getWorldPosition(uniforms.localCamera.value);
        mesh.worldToLocal(uniforms.localCamera.value);
        uniforms.beamWorld.value.copy(mesh.matrixWorld);
        uniforms.shadowMap.value = light.shadow.map?.texture ?? null;
        uniforms.hasShadow.value = light.shadow.map ? 1 : 0;
      };
      this.content3D.add(mesh);
    }
  }
}
