import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HanaProvider } from './store/HanaContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HanaProvider>
      <App />
    </HanaProvider>
  </StrictMode>,
)
