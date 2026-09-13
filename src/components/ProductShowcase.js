/**
 * Product Showcase Editorial Copy Component
 * Renders floating statements left and right around the 3D pendant lamp.
 */
export function renderProductShowcase(container = document.body) {
  const showcase = document.createElement('div')
  showcase.className = 'editorial-statements'
  showcase.innerHTML = `
    <div class="statement-left">
      <p>a statement of form,<br>warmth, and atmosphere.</p>
    </div>
    <div class="statement-right">
      <p>not just light.</p>
    </div>
  `
  container.appendChild(showcase)
  return showcase
}
