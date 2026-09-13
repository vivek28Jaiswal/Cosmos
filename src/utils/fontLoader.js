import crostanBoldUrl from '../assets/fonts/Crostan-Bold.otf'
import crostanSemiBoldUrl from '../assets/fonts/Crostan-SemiBold.ttf'
import ppNeueMontrealUrl from '../assets/fonts/PPNeueMontreal-Medium.ttf'

/**
 * Asynchronously loads and verifies all custom font assets
 * (Crostan Bold, Crostan SemiBold, and PP Neue Montreal).
 */
export async function loadCustomFonts() {
  try {
    const f1 = new FontFace('Crostan', `url("${crostanBoldUrl}")`, { weight: '700' })
    const f2 = new FontFace('Crostan', `url("${crostanSemiBoldUrl}")`, { weight: '600' })
    const f3 = new FontFace('Crostan-SemiBold', `url("${crostanSemiBoldUrl}")`, { weight: '400' })
    const f4 = new FontFace('Crostan-Bold', `url("${crostanBoldUrl}")`, { weight: '400' })
    const f5 = new FontFace('PP Neue Montreal', `url("${ppNeueMontrealUrl}")`, { weight: '500' })
    const f6 = new FontFace('Crostan-Medium', `url("${crostanSemiBoldUrl}")`, { weight: '500' })

    const loadedFonts = await Promise.all([f1.load(), f2.load(), f3.load(), f4.load(), f5.load(), f6.load()])
    loadedFonts.forEach(font => document.fonts.add(font))
    
    await document.fonts.ready
    await document.fonts.load('360px Crostan-Bold')
    console.log('[FontLoader] All custom typography loaded and verified!')
  } catch (err) {
    console.error('[FontLoader] Error preloading custom fonts:', err)
  }
}
