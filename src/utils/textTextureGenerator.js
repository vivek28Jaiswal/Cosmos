import * as THREE from 'three'

/**
 * Generates high-resolution typography texture and matching normal map
 * for the giant "COSMOS" wordmark using the Crostan font and gold vertical gradient.
 */
export function generateTypographyTextures() {
  const width = 2048
  const height = 1024

  // --- 1. Base Text Canvas ---
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Clear transparent
  ctx.clearRect(0, 0, width, height)

  const text = 'COSMOS'
  const textY = height * 0.62

  const fontSpec = '360px "Crostan-Bold", "Crostan-SemiBold", "Crostan", sans-serif'

  // Configure Crostan SemiBold typography
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = fontSpec
  console.log('Applied canvas font spec:', fontSpec, '| active canvas font:', ctx.font)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-14px'

  // Vertical linear gradient for the letters matching the reference design:
  // Golden amber top -> Champagne mid -> Crisp white bottom
  const grad = ctx.createLinearGradient(0, height * 0.28, 0, height * 0.90)
  grad.addColorStop(0.00, '#b8813a')
  grad.addColorStop(0.35, '#da9d4f')
  grad.addColorStop(0.68, '#f4d69b')
  grad.addColorStop(1.00, '#ffffff')

  ctx.fillStyle = grad
  ctx.fillText(text, width * 0.5, textY)

  const textTexture = new THREE.CanvasTexture(canvas)
  textTexture.minFilter = THREE.LinearFilter
  textTexture.magFilter = THREE.LinearFilter
  textTexture.generateMipmaps = false
  textTexture.needsUpdate = true

  // --- 2. Normal Map Generation via Sobel Edge Filter ---
  // Create a height-blurred canvas for smooth bevel calculations
  const heightCanvas = document.createElement('canvas')
  heightCanvas.width = width
  heightCanvas.height = height
  const hCtx = heightCanvas.getContext('2d')

  // Draw solid white mask for heightmap calculations
  hCtx.clearRect(0, 0, width, height)
  hCtx.textAlign = 'center'
  hCtx.textBaseline = 'middle'
  hCtx.font = fontSpec
  if ('letterSpacing' in hCtx) hCtx.letterSpacing = '-14px'
  hCtx.fillStyle = '#ffffff'
  hCtx.fillText(text, width * 0.5, textY)


  // Blur mask to simulate curved bevel elevation
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bCtx = blurCanvas.getContext('2d')
  bCtx.filter = 'blur(10px)'
  bCtx.drawImage(heightCanvas, 0, 0)
  bCtx.filter = 'none'

  const imgData = bCtx.getImageData(0, 0, width, height)
  const pixels = imgData.data

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = width
  normalCanvas.height = height
  const nCtx = normalCanvas.getContext('2d')
  const normalImgData = nCtx.createImageData(width, height)
  const nPixels = normalImgData.data

  const getIntensity = (x, y) => {
    x = Math.max(0, Math.min(width - 1, x))
    y = Math.max(0, Math.min(height - 1, y))
    return pixels[(y * width + x) * 4 + 3] / 255.0
  }

  // Compute Sobel normal map
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      const alpha = pixels[idx + 3]
      if (alpha === 0) {
        nPixels[idx] = 128     // Neutral normal (0, 0, 1)
        nPixels[idx + 1] = 128
        nPixels[idx + 2] = 255
        nPixels[idx + 3] = 0
        continue
      }

      // Sobel gradient kernels
      const tl = getIntensity(x - 1, y - 1)
      const t  = getIntensity(x,     y - 1)
      const tr = getIntensity(x + 1, y - 1)
      const l  = getIntensity(x - 1, y)
      const r  = getIntensity(x + 1, y)
      const bl = getIntensity(x - 1, y + 1)
      const b  = getIntensity(x,     y + 1)
      const br = getIntensity(x + 1, y + 1)

      const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl)
      const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr)
      const dz = 0.35 // Bevel height factor

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const nx = -dx / len
      const ny = -dy / len
      const nz = dz / len

      nPixels[idx]     = Math.floor((nx * 0.5 + 0.5) * 255)
      nPixels[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255)
      nPixels[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255)
      nPixels[idx + 3] = 255
    }
  }

  nCtx.putImageData(normalImgData, 0, 0)
  const normalTexture = new THREE.CanvasTexture(normalCanvas)
  normalTexture.minFilter = THREE.LinearFilter
  normalTexture.magFilter = THREE.LinearFilter
  normalTexture.generateMipmaps = false
  normalTexture.needsUpdate = true

  return { textTexture, normalTexture }
}

/**
 * Creates a glowing circular optical diffuser texture for the lamp opening
 * matching the exact warm golden illumination profile from reference image.
 */
export function generateDiffuserTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const center = size * 0.5
  const radius = size * 0.48

  // Radial gradient: warm frosted white opal center -> soft champagne -> smooth shadow falloff at rim
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius)
  grad.addColorStop(0.00, '#ffffff')
  grad.addColorStop(0.30, '#fffbf2')
  grad.addColorStop(0.65, '#fde8c8')
  grad.addColorStop(0.85, '#e5b875')
  grad.addColorStop(0.94, '#7a5220')
  grad.addColorStop(1.00, '#000000')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture

}

/**
 * Creates a soft neutral studio backdrop texture (pure white to transparent black falloff)
 * to create realistic shadow separation behind the 3D pendant lamp without any color tint.
 */
export function generateStudioBackdropTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const center = size * 0.5
  const radius = size * 0.5

  const grad = ctx.createRadialGradient(center, center * 0.4, 0, center, center * 0.4, radius)
  grad.addColorStop(0.00, 'rgba(255, 255, 255, 0.22)')
  grad.addColorStop(0.35, 'rgba(180, 180, 180, 0.10)')
  grad.addColorStop(0.70, 'rgba(60, 60, 60, 0.02)')
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

/**
 * Generates a fine brushed metal normal map texture (anodized aluminum micro-grain)
 * to give the 3D pendant shade photorealistic brushed metallic surface details.
 */
export function generateBrushedMetalTextures() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base neutral normal map color (RGB: 128, 128, 255)
  ctx.fillStyle = '#8080ff'
  ctx.fillRect(0, 0, size, size)

  // Generate fine directional brushed metallic noise grain
  const imgData = ctx.getImageData(0, 0, size, size)
  const data = imgData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      // Fine brushed directional micro-grain
      const grain = (Math.sin(x * 16.0) * 0.6 + Math.sin(x * 48.0 + y * 1.5) * 0.4) * 16.0
      const nx = 128 + Math.max(-35, Math.min(35, grain))
      const ny = 128 + (Math.random() - 0.5) * 10
      data[idx] = nx     // Red (X normal tilt)
      data[idx + 1] = ny // Green (Y normal tilt)
      data[idx + 2] = 255 // Blue (Z normal facing out)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)

  const normalTexture = new THREE.CanvasTexture(canvas)
  normalTexture.wrapS = THREE.RepeatWrapping
  normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.repeat.set(6, 6)
  normalTexture.minFilter = THREE.LinearFilter
  normalTexture.magFilter = THREE.LinearFilter

  return normalTexture
}
