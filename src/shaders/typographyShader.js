import * as THREE from 'three'

export const typographyVertexShader = /* glsl */ `
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

export const typographyFragmentShader = /* glsl */ `
  uniform sampler2D uTextTexture;
  uniform sampler2D uNormalTexture;
  uniform vec3 uLampPos;
  uniform vec3 uLampDir;
  uniform float uSpotAngle;     // cos of cone cutoff outer
  uniform float uSpotPenumbra;  // delta to inner cutoff
  uniform float uSpotIntensity;
  uniform vec3 uSpotColor;
  uniform vec3 uBaseColor;
  uniform vec3 uLitColor;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vec4 textSample = texture2D(uTextTexture, vUv);
    float textMask = textSample.a;

    // Discard empty areas outside letter boundaries
    if (textMask < 0.01) {
      discard;
    }

    vec3 baseGradient = textSample.rgb;

    // Sample normal map for rounded beveled 3D letter edges
    vec3 normalMapSample = texture2D(uNormalTexture, vUv).xyz * 2.0 - 1.0;
    vec3 normal = normalize(vNormal + normalMapSample * 0.45);

    // Vector from light emitter to this surface fragment
    vec3 lightVec = uLampPos - vWorldPosition;
    float dist = length(lightVec);
    vec3 lightDir = normalize(lightVec);

    // Spotlight cone calculation (optical diffuser beam)
    vec3 normLampDir = normalize(uLampDir);
    float cosTheta = dot(-lightDir, normLampDir);

    float innerCutoff = uSpotAngle + uSpotPenumbra;
    float spotCone = smoothstep(uSpotAngle, innerCutoff, cosTheta);

    // Physically motivated inverse distance attenuation
    float attenuation = 1.0 / (1.0 + 0.12 * dist + 0.07 * dist * dist);

    // Diffuse lighting on beveled letter geometry
    float NdotL = max(0.0, dot(normal, lightDir));
    float wrappedNdotL = clamp((dot(normal, lightDir) + 0.3) / 1.3, 0.0, 1.0);

    // Blinn-Phong specular glints & metallic rim reflection
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfVec));
    float specular = pow(NdotH, 28.0) * 1.4;
    float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.5);

    // Spotlight reveal factor combining cone angle & distance falloff
    float spotPower = spotCone * attenuation * uSpotIntensity;
    float reveal = smoothstep(0.01, 0.45, spotPower);

    // Completely hide areas outside the spotlight beam in deep shadow
    if (reveal < 0.005) {
      discard;
    }

    // Direct illuminated spotlight pool: rich gold gradient + specular highlights
    vec3 litColor = baseGradient * (0.85 + wrappedNdotL * 0.55) * uSpotColor;
    litColor += (specular + fresnel * 0.4) * vec3(1.0, 0.94, 0.82) * 1.5;

    vec3 finalColor = litColor * (spotPower * 0.45 + 0.55);
    float finalAlpha = textMask * reveal;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`



