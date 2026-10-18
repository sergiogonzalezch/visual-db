import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { TiendaProvider } from './estado/tienda'
import './estilos.css'

const raiz = document.getElementById('raiz')
if (raiz) {
  createRoot(raiz).render(
    <React.StrictMode>
      <TiendaProvider>
        <App />
      </TiendaProvider>
    </React.StrictMode>
  )
}
