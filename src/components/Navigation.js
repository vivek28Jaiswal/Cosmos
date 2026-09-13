/**
 * Editorial Header Navigation Component
 * Renders top nav links and Phosphor cart button in front of WebGL canvas.
 */
export function renderNavigation(container = document.body) {
  const header = document.createElement('header')
  header.className = 'editorial-nav'
  header.innerHTML = `
    <nav class="nav-group left">
      <a href="#shop" class="nav-link">Shop</a>
      <a href="#lamps" class="nav-link">Lamps</a>
      <a href="#lights" class="nav-link">Lights</a>
    </nav>

    <div class="nav-group right">
      <button id="light-toggle-btn" class="light-toggle-btn active" aria-label="Toggle Light Power">
        <span class="toggle-dot"></span>
        <span class="toggle-text">LIGHT ON</span>
      </button>

      <a href="#search" class="nav-link">Search</a>
      <a href="#login" class="nav-link">Login</a>
      <button class="cart-btn" aria-label="Cart">
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
          <path d="M222.14,105.85,195.68,178.67A16,16,0,0,1,180.59,192H83.41a16,16,0,0,1-15.09-13.33L41.6,40H16a8,8,0,0,1,0-16H48a8,8,0,0,1,7.8,6.22L62.7,64H216a8,8,0,0,1,7.42,11.02l-1.28,3.83ZM77.09,176h103.5l23.27-64H65.81ZM96,216a16,16,0,1,1-16-16A16,16,0,0,1,96,216Zm104,0a16,16,0,1,1-16-16A16,16,0,0,1,200,216Z"/>
        </svg>
      </button>
    </div>
  `

  const toggleBtn = header.querySelector('#light-toggle-btn')
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.sceneManager) {
        const isOn = window.sceneManager.toggleLight()
        toggleBtn.classList.toggle('active', isOn)
        toggleBtn.classList.toggle('off', !isOn)
        const textSpan = toggleBtn.querySelector('.toggle-text')
        if (textSpan) {
          textSpan.textContent = isOn ? 'LIGHT ON' : 'LIGHT OFF'
        }
      }
    })
  }

  container.appendChild(header)
  return header
}
