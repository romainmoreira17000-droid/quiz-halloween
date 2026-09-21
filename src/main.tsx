/** @file Application entry point: mounts <App> into #root. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled (not Google Fonts) so the game works when the wifi drops.
import '@fontsource/alegreya/latin-500.css'
import '@fontsource/alegreya/latin-700.css'
import '@fontsource/im-fell-english-sc/latin-400.css'
import './styles/base.css'
import './styles/controls.css'
import './styles/screens.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
