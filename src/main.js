import './style.css'
import { renderNavigation } from './components/Navigation.js'
import { renderProductShowcase } from './components/ProductShowcase.js'
import { renderTypographyCTA } from './components/TypographyCTA.js'
import { SceneManager } from './scene/SceneManager.js'
import { loadCustomFonts } from './utils/fontLoader.js'

// ========================================================
// 1. MOUNT BACKGROUND COMPONENTS (BEHIND 3D WEBGL CANVAS & WIRE)
// ========================================================
renderProductShowcase(document.body)

// ========================================================
// 2. MOUNT FOREGROUND INTERACTIVE COMPONENTS
// ========================================================
const appContainer = document.querySelector('#app')
renderNavigation(appContainer)
renderTypographyCTA(appContainer)

// ========================================================
// 3. INITIALIZE 3D WEBGL SCENE MANAGER
// ========================================================
const canvas = document.querySelector('#webgl')
const sceneManager = new SceneManager(canvas)

// ========================================================
// 4. PRELOAD FONTS & RE-BIND TYPOGRAPHY TEXTURE
// ========================================================
loadCustomFonts().then(() => {
  sceneManager.onFontsLoaded()
})
