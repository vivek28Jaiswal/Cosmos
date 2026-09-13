import * as THREE from 'three'
import { PendantLamp } from './PendantLamp.js'
import { ShaderTypography } from './ShaderTypography.js'

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.scene = new THREE.Scene()
    // Transparent background allowing DOM elements at z-index 1 behind WebGL canvas
    this.scene.background = null

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100)
    this.camera.position.set(0, 0.35, 5.8)
    this.camera.lookAt(0, 0.2, 0)
    this.scene.add(this.camera)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25

    // Environment Lighting
    this._setupStudioLights()

    // Instantiate 3D Scene Components
    this.pendantLamp = new PendantLamp(this.scene)
    this.shaderTypography = new ShaderTypography(this.scene)

    // Clock
    this.clock = new THREE.Clock()
    this.previousTime = 0

    // Global reference for DOM interaction
    window.sceneManager = this

    // Bind event listeners & start loop
    this._bindEvents()
    this._animate = this._animate.bind(this)
    requestAnimationFrame(this._animate)
  }

  toggleLight(isOn) {
    if (!this.pendantLamp || !this.shaderTypography) return true
    const newState = this.pendantLamp.toggleLight(isOn)
    const factor = newState ? 1.0 : 0.0
    this.shaderTypography.setLightPower(factor)
    return newState
  }

  _setupStudioLights() {
    // Crisp neutral ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.50)
    this.scene.add(ambientLight)

    // Neutral white key light
    const keyLight = new THREE.DirectionalLight(0xf4f4f6, 1.0)
    keyLight.position.set(-3, 6, 4)
    this.scene.add(keyLight)

    // Strong neutral top-back rim light for sharp edge definition against black background
    const topRimLight = new THREE.DirectionalLight(0xffffff, 2.2)
    topRimLight.position.set(0, 7, -3.5)
    this.scene.add(topRimLight)

    // Side rim contour light
    const sideRimLight = new THREE.DirectionalLight(0xe0e0eb, 0.75)
    sideRimLight.position.set(4, 3, -1)
    this.scene.add(sideRimLight)
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this.sizes.width = window.innerWidth
      this.sizes.height = window.innerHeight

      this.camera.aspect = this.sizes.width / this.sizes.height
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(this.sizes.width, this.sizes.height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    // Cursor air breeze interaction
    let lastX = 0
    let lastY = 0
    let lastTime = performance.now()

    const handlePointerMove = (clientX, clientY) => {
      const now = performance.now()
      const dt = Math.max((now - lastTime) / 1000, 0.008)
      lastTime = now

      const normX = (clientX / this.sizes.width) * 2 - 1
      const normY = -(clientY / this.sizes.height) * 2 + 1

      const deltaX = (clientX - lastX) / this.sizes.width
      const deltaY = (clientY - lastY) / this.sizes.height

      lastX = clientX
      lastY = clientY

      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / dt

      if (this.pendantLamp && speed > 0.04) {
        this.pendantLamp.applyAirImpulse(normX, normY, deltaX, deltaY, speed)
      }
    }

    window.addEventListener('pointermove', (e) => {
      handlePointerMove(e.clientX, e.clientY)
    })

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }, { passive: true })
  }

  onFontsLoaded() {
    if (this.shaderTypography) {
      this.shaderTypography.updateTextures()
    }
  }

  _animate() {
    requestAnimationFrame(this._animate)

    const elapsedTime = this.clock.getElapsedTime()
    const dt = Math.min(elapsedTime - this.previousTime, 0.05) || 0.016
    this.previousTime = elapsedTime

    // Update 3D Lamp & Cord
    this.pendantLamp.update(dt)

    // Update Shader Typography Uniforms
    this.shaderTypography.update(
      this.pendantLamp.lampDiffuserWorld,
      this.pendantLamp.spotDirWorld,
      elapsedTime,
      dt
    )

    this.renderer.render(this.scene, this.camera)
  }
}
