import * as THREE from 'three'

export const volumetricVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const volumetricFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    // Soft longitudinal fade: smooth entrance below the lamp and soft dissipation at base
    float heightFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.4, vUv.y);

    // View-dependent grazing rim scatter for subtle soft volumetric feel
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);

    // Micro-fluctuation simulating atmospheric particles in the beam
    float noise = sin(vWorldPosition.y * 4.0 + uTime * 0.7) * cos(vWorldPosition.x * 3.5 - uTime * 0.5) * 0.04;

    float alpha = (rim * 0.75 + 0.25) * heightFade * (uIntensity + noise);
    alpha = clamp(alpha, 0.0, 0.18); // Kept ultra-soft and restrained

    vec3 warmScatter = mix(uColor, vec3(1.0, 0.94, 0.84), rim * 0.6);

    gl_FragColor = vec4(warmScatter, alpha);
  }
`
