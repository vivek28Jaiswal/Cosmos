import * as THREE from 'three'
import { typographyVertexShader, typographyFragmentShader } from '../shaders/typographyShader.js'
import { generateTypographyTextures } from '../utils/textTextureGenerator.js'

export class ShaderTypography {
  constructor(scene) {
    this.scene = scene

    const { textTexture, normalTexture } = generateTypographyTextures()

    this.planeGeo = new THREE.PlaneGeometry(10.8, 5.4, 64, 32)

    this.uniforms = {
      uTextTexture: { value: textTexture },
      uNormalTexture: { value: normalTexture },
      uLampPos: { value: new THREE.Vector3(0, 0.22, 0.48) },
      uLampDir: { value: new THREE.Vector3(0, -1, 0) },
      uSpotAngle: { value: Math.cos(THREE.MathUtils.degToRad(48)) },
      uSpotPenumbra: { value: 0.28 },
      uSpotIntensity: { value: 3.8 },
      uSpotColor: { value: new THREE.Color(0xffedd3) },
      uBaseColor: { value: new THREE.Color(0xffffff) },
      uLitColor: { value: new THREE.Color(0xfff5e4) },
      uTime: { value: 0 },
    }

    this.targetSpotIntensity = 3.8

    this.material = new THREE.ShaderMaterial({
      vertexShader: typographyVertexShader,
      fragmentShader: typographyFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    this.mesh = new THREE.Mesh(this.planeGeo, this.material)
    this.mesh.position.set(0, -0.62, -0.2)
    this.scene.add(this.mesh)
  }

  setLightPower(factor) {
    this.targetSpotIntensity = 3.8 * factor
  }

  updateTextures() {
    const updated = generateTypographyTextures()

    this.uniforms.uTextTexture.value.dispose()
    this.uniforms.uNormalTexture.value.dispose()

    this.uniforms.uTextTexture.value = updated.textTexture
    this.uniforms.uNormalTexture.value = updated.normalTexture

    this.uniforms.uTextTexture.value.needsUpdate = true
    this.uniforms.uNormalTexture.value.needsUpdate = true
    this.material.needsUpdate = true
  }

  update(lampDiffuserWorld, spotDirWorld, elapsedTime, dt = 0.016) {
    this.uniforms.uSpotIntensity.value = THREE.MathUtils.lerp(
      this.uniforms.uSpotIntensity.value,
      this.targetSpotIntensity,
      dt * 7.0
    )
    this.uniforms.uLampPos.value.copy(lampDiffuserWorld)
    this.uniforms.uLampDir.value.copy(spotDirWorld)
    this.uniforms.uTime.value = elapsedTime
  }
}
