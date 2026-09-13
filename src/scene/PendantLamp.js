import * as THREE from 'three'
import { generateDiffuserTexture, generateStudioBackdropTexture, generateBrushedMetalTextures } from '../utils/textTextureGenerator.js'

export class PendantLamp {
  constructor(scene) {
    this.scene = scene

    // Generate procedural brushed metal normal map for photorealistic surface grain
    this.brushedNormalMap = generateBrushedMetalTextures()

    // Master Group for 3D Lamp Body
    this.group = new THREE.Group()
    this.scene.add(this.group)

    // Anchor point at top ceiling
    this.CEILING_Y = 4.4
    this.anchorPoint = new THREE.Vector3(0, this.CEILING_Y, 0)

    // Resting Position & Physics State
    this.RESTING_Y = 0.22
    this.RESTING_Z = 0.48
    this.RESTING_TILT_X = 0.08 // Match reference image gentle front tilt

    this.pos = new THREE.Vector3(0, this.RESTING_Y, this.RESTING_Z)
    this.vel = new THREE.Vector3(0, 0, 0)
    this.target = new THREE.Vector3(0, this.RESTING_Y, this.RESTING_Z)
    this.rot = new THREE.Vector3(this.RESTING_TILT_X, 0, 0)
    this.angVel = new THREE.Vector3(0, 0, 0)

    this.mass = 1.4
    this.stiffness = 22.0
    this.damping = 4.8
    this.rotStiffness = 32.0
    this.rotDamping = 5.4

    this.cordMesh = null
    this.lampDown = new THREE.Vector3(0, -1, 0)
    this.lampTopWorld = new THREE.Vector3()
    this.lampDiffuserWorld = new THREE.Vector3()
    this.spotDirWorld = new THREE.Vector3()

    this.lampEmitterOffset = new THREE.Vector3(0, 0.0, 0)
    this.lampTopOffset = new THREE.Vector3(0, 0.74, 0)

    // Interactive Light Power State (Demo ON/OFF)
    this.isLightOn = true
    this.targetLightFactor = 1.0
    this.currentLightFactor = 1.0

    this._buildStudioBackdrop()
    this._buildCeilingCap()
    this._buildLampBody()
    this._buildLights()
  }

  toggleLight(isOn) {
    this.isLightOn = isOn !== undefined ? isOn : !this.isLightOn
    this.targetLightFactor = this.isLightOn ? 1.0 : 0.0
    return this.isLightOn
  }

  _buildStudioBackdrop() {
    const bgTexture = generateStudioBackdropTexture()
    const bgGeo = new THREE.PlaneGeometry(6.5, 6.5)
    const bgMat = new THREE.MeshBasicMaterial({
      map: bgTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const bgMesh = new THREE.Mesh(bgGeo, bgMat)
    bgMesh.position.set(0, 1.2, -0.4)
    this.scene.add(bgMesh)
  }

  applyAirImpulse(normX, normY, deltaX, deltaY, speed) {
    // Proximity to the central lamp height (normY ~ 0.1 to 0.4, normX ~ 0)
    const distToLamp = Math.sqrt(normX * normX + (normY - 0.25) * (normY - 0.25))
    
    // Proximity factor: strongest near the lamp shade (1.0), gentle breeze when further away (0.25)
    const proximity = Math.max(0.20, 1.0 - Math.min(distToLamp * 0.85, 1.0))
    
    // Air impulse magnitude based on cursor swipe velocity & proximity
    const impulseMag = Math.min(speed * 0.95, 2.2) * proximity

    // Push physical position & rotational angular velocity (wind breeze push)
    this.vel.x += deltaX * impulseMag * 6.5
    this.vel.z += deltaY * impulseMag * 3.5
    
    this.angVel.z += -deltaX * impulseMag * 14.0
    this.angVel.x += deltaY * impulseMag * 9.0
  }

  _buildCeilingCap() {
    const capGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.05, 32)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x24242c,
      roughness: 0.28,
      metalness: 0.75,
      normalMap: this.brushedNormalMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
    })
    const capMesh = new THREE.Mesh(capGeo, capMat)
    capMesh.position.copy(this.anchorPoint)
    this.scene.add(capMesh)
  }

  _buildLampBody() {
    // 1. Shallow Saucer Dome Shade (Brushed Anodized Dark Metallic finish)
    const domeGeo = new THREE.SphereGeometry(0.88, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.38)
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x26262e,
      roughness: 0.28,
      metalness: 0.82,
      normalMap: this.brushedNormalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      side: THREE.DoubleSide,
    })
    const domeMesh = new THREE.Mesh(domeGeo, domeMat)
    domeMesh.scale.set(1.0, 0.65, 1.0)
    // Translate dome down so bottom rim opening sits EXACTLY flush at Y = 0
    const domeBottomY = 0.88 * Math.cos(Math.PI * 0.38) * 0.65 // ~0.2105
    domeMesh.position.set(0, -domeBottomY, 0)
    this.group.add(domeMesh)

    const domeCrownY = (0.88 - 0.88 * Math.cos(Math.PI * 0.38)) * 0.65 // ~0.3615

    // 2. Machined Stepped Crown Collar Joint at top of dome
    const collarGeo = new THREE.CylinderGeometry(0.076, 0.092, 0.045, 32)
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a46,
      roughness: 0.24,
      metalness: 0.85,
      normalMap: this.brushedNormalMap,
      normalScale: new THREE.Vector2(0.15, 0.15),
    })
    const collarMesh = new THREE.Mesh(collarGeo, collarMat)
    collarMesh.position.set(0, domeCrownY + 0.02, 0)
    this.group.add(collarMesh)

    // 3. Tapered Cone Stem extending from crown collar
    const stemGeo = new THREE.CylinderGeometry(0.024, 0.068, 0.38, 32)
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a34,
      roughness: 0.25,
      metalness: 0.85,
      normalMap: this.brushedNormalMap,
      normalScale: new THREE.Vector2(0.18, 0.18),
    })
    const stemMesh = new THREE.Mesh(stemGeo, stemMat)
    stemMesh.position.set(0, domeCrownY + 0.19, 0)
    this.group.add(stemMesh)

    // 4. Polished Brass Strain-Relief Cable Clamp Nut at top of stem
    const clampGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.07, 32)
    const clampMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished architectural brass accent
      roughness: 0.20,
      metalness: 0.92,
    })
    const clampMesh = new THREE.Mesh(clampGeo, clampMat)
    clampMesh.position.set(0, domeCrownY + 0.38, 0)
    this.group.add(clampMesh)

    // 5. Front Knurled Metallic Ring Button & Bezel
    const buttonGroup = new THREE.Group()
    buttonGroup.position.set(0, 0.08, 0.66)
    buttonGroup.rotation.x = -0.35

    const buttonRingGeo = new THREE.RingGeometry(0.030, 0.048, 32)
    const buttonRingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished brass outer bezel
      roughness: 0.22,
      metalness: 0.90,
      side: THREE.DoubleSide,
    })
    buttonGroup.add(new THREE.Mesh(buttonRingGeo, buttonRingMat))

    const buttonCoreGeo = new THREE.CircleGeometry(0.030, 32)
    const buttonCoreMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c24,
      roughness: 0.35,
      metalness: 0.70,
      side: THREE.DoubleSide,
    })
    const buttonCoreMesh = new THREE.Mesh(buttonCoreGeo, buttonCoreMat)
    buttonCoreMesh.position.z = 0.002
    buttonGroup.add(buttonCoreMesh)

    this.group.add(buttonGroup)

    // 6. Multi-tiered Precision Metallic Opening Rim (Outer Dark Steel + Inner Gold Trim Line)
    const outerRimGeo = new THREE.RingGeometry(0.795, 0.818, 64)
    const outerRimMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a46,
      roughness: 0.22,
      metalness: 0.88,
      side: THREE.DoubleSide,
    })
    const outerRimMesh = new THREE.Mesh(outerRimGeo, outerRimMat)
    outerRimMesh.rotation.x = Math.PI * 0.5
    outerRimMesh.position.set(0, 0.001, 0)
    this.group.add(outerRimMesh)

    const innerTrimGeo = new THREE.RingGeometry(0.78, 0.795, 64)
    const innerTrimMat = new THREE.MeshStandardMaterial({
      color: 0xc8a261, // Subtle polished champagne gold inner chamfer line
      roughness: 0.25,
      metalness: 0.90,
      side: THREE.DoubleSide,
    })
    const innerTrimMesh = new THREE.Mesh(innerTrimGeo, innerTrimMat)
    innerTrimMesh.rotation.x = Math.PI * 0.5
    innerTrimMesh.position.set(0, 0.002, 0)
    this.group.add(innerTrimMesh)

    // 7. Frosted Opal Diffuser Disc (Flush inside metallic rim border)
    const diffuserTexture = generateDiffuserTexture()
    const diffuserGeo = new THREE.CircleGeometry(0.78, 64)
    this.diffuserMat = new THREE.MeshBasicMaterial({
      map: diffuserTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
    const diffuserMesh = new THREE.Mesh(diffuserGeo, this.diffuserMat)
    diffuserMesh.rotation.x = Math.PI * 0.5
    diffuserMesh.position.set(0, 0.003, 0)
    this.group.add(diffuserMesh)

    // Cord Material (Metalic suspension wire)
    this.cordMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a6a,
      roughness: 0.30,
      metalness: 0.60,
    })
  }

  _buildLights() {
    this.spotLight = new THREE.SpotLight(0xffeedb, 14)
    this.spotLight.angle = THREE.MathUtils.degToRad(50)
    this.spotLight.penumbra = 0.85
    this.spotLight.decay = 1.6
    this.spotLight.distance = 12
    this.scene.add(this.spotLight)

    this.spotTarget = new THREE.Object3D()
    this.scene.add(this.spotTarget)
    this.spotLight.target = this.spotTarget

    this.glowLight = new THREE.PointLight(0xffeedb, 1.2, 3.0, 2.0)
    this.scene.add(this.glowLight)
  }

  updateCordGeometry(lampTopPoint) {
    const midPoint = new THREE.Vector3()
      .addVectors(this.anchorPoint, lampTopPoint)
      .multiplyScalar(0.5)

    midPoint.x += (this.anchorPoint.x - lampTopPoint.x) * 0.02

    const curve = new THREE.CatmullRomCurve3([
      this.anchorPoint,
      midPoint,
      lampTopPoint,
    ])

    const newGeo = new THREE.TubeGeometry(curve, 32, 0.015, 8, false)
    if (!this.cordMesh) {
      this.cordMesh = new THREE.Mesh(newGeo, this.cordMaterial)
      this.scene.add(this.cordMesh)
    } else {
      this.cordMesh.geometry.dispose()
      this.cordMesh.geometry = newGeo
    }
  }

  update(dt) {
    // Lerp light power factor for smooth dimming transition
    this.currentLightFactor = THREE.MathUtils.lerp(this.currentLightFactor, this.targetLightFactor, dt * 7.0)

    // Keep target at resting position (static light)
    this.target.set(0, this.RESTING_Y, this.RESTING_Z)

    // Spring ODE calculations
    const springForceX = (this.target.x - this.pos.x) * this.stiffness
    const springForceY = (this.target.y - this.pos.y) * this.stiffness
    const springForceZ = (this.target.z - this.pos.z) * this.stiffness

    const accelX = (springForceX - this.vel.x * this.damping) / this.mass
    const accelY = (springForceY - this.vel.y * this.damping) / this.mass
    const accelZ = (springForceZ - this.vel.z * this.damping) / this.mass

    this.vel.x += accelX * dt
    this.vel.y += accelY * dt
    this.vel.z += accelZ * dt

    this.pos.x += this.vel.x * dt
    this.pos.y += this.vel.y * dt
    this.pos.z += this.vel.z * dt

    this.group.position.copy(this.pos)

    // Rotational pendulum roll & tilt angles matching physical sway displacement & velocity
    const pendulumAngleZ = -(this.pos.x - this.anchorPoint.x) * 0.22 - this.vel.x * 0.12
    const pendulumAngleX = this.RESTING_TILT_X + (this.pos.z - this.anchorPoint.z) * 0.18 + this.vel.z * 0.10

    this.angVel.z += ((pendulumAngleZ - this.rot.z) * this.rotStiffness - this.angVel.z * this.rotDamping) * dt
    this.angVel.x += ((pendulumAngleX - this.rot.x) * this.rotStiffness - this.angVel.x * this.rotDamping) * dt

    this.rot.z += this.angVel.z * dt
    this.rot.x += this.angVel.x * dt
    this.rot.y = -this.vel.x * 0.04

    this.group.rotation.set(this.rot.x, this.rot.y, this.rot.z)

    // Update World Positions
    this.lampTopWorld.copy(this.pos).add(
      this.lampTopOffset.clone().applyEuler(this.group.rotation)
    )
    this.updateCordGeometry(this.lampTopWorld)

    this.lampDiffuserWorld.copy(this.pos).add(
      this.lampEmitterOffset.clone().applyEuler(this.group.rotation)
    )

    this.spotDirWorld.copy(this.lampDown).applyEuler(this.group.rotation).normalize()

    // Update Lights
    this.spotLight.position.copy(this.lampDiffuserWorld)
    this.spotTarget.position.copy(this.lampDiffuserWorld).add(this.spotDirWorld.clone().multiplyScalar(6.0))
    this.spotLight.target.updateMatrixWorld()

    this.spotLight.intensity = 14.0 * this.currentLightFactor
    this.glowLight.intensity = 1.2 * this.currentLightFactor
    if (this.diffuserMat) {
      this.diffuserMat.opacity = 0.05 + 0.95 * this.currentLightFactor
    }

    this.glowLight.position.copy(this.lampDiffuserWorld)
  }
}
