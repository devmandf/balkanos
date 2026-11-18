import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jura/wght.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './index.css'
import App from './App'

// Protection contre le « détournement de clic » : le site refuse de s'afficher
// s'il est enfermé dans la page d'un autre site (cadre invisible).
if (window.self !== window.top) {
  document.body.textContent = 'Balkanos ne peut pas être affiché dans un autre site.'
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
