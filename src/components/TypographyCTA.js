/**
 * Typography CTA Component
 * Renders bottom golden pill CTA button over the COSMOS wordmark.
 */
export function renderTypographyCTA(container = document.body) {
  const ctaContainer = document.createElement('div')
  ctaContainer.className = 'cta-container'
  ctaContainer.innerHTML = `
    <a href="#shop" class="gold-pill-btn">
      <span>(SHOP NOW)</span>
    </a>
  `
  container.appendChild(ctaContainer)
  return ctaContainer
}
