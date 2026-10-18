import { mensajeErrorVisible } from '../presentacion/errores'
import { useEffect, useRef, useState } from 'react'
import { useTienda } from '../estado/tienda'

export function PanelChat(): JSX.Element {
  const tienda = useTienda()
  const [texto, setTexto] = useState('')
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [tienda.mensajesChat])

  return (
    <div className="chat-contenedor">
      <h2>Chat con el agente</h2>
      <div className="contexto-chat"><span className="chip">{tienda.ajustes?.proveedor.modelo || 'Sin modelo seleccionado'}</span><p className="descripcion-panel">El asistente ve el diseño y la selección actual. Conversar no aplica cambios.</p></div>
      <div className="mensajes-chat" role="log" aria-label="Conversación con el asistente">
        {tienda.mensajesChat.map((mensaje, i) => (
          <div key={i} className={`mensaje ${mensaje.rol}`}>
            {mensaje.contenido}
            {mensaje.propuestaId && (
              <div className="chips" style={{ marginTop: 4 }}>
                <span className="chip">referencia a propuesta</span>
              </div>
            )}
          </div>
        ))}
        {tienda.estadoIA.error && (
          <div className="mensaje sistema" role="alert">Error: {mensajeErrorVisible(tienda.estadoIA.error)}</div>
        )}
        <div ref={finRef} />
      </div>
      <div className="entrada-chat" style={{ marginTop: 'auto' }}>
        <textarea aria-label="Mensaje al asistente"
          value={texto}
          placeholder="Pregunta sobre el diseño o pide una propuesta…"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (texto.trim() && !tienda.estadoIA.chateando) {
                void tienda.chatear(texto.trim())
                setTexto('')
              }
            }
          }}
        />
        <button
          className="primario"
          disabled={!texto.trim() || tienda.estadoIA.chateando}
          onClick={() => {
            void tienda.chatear(texto.trim())
            setTexto('')
          }}
        >
          {tienda.estadoIA.chateando ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
      <p className="pie-chat">Enter envía · Shift+Enter añade una línea</p>
    </div>
  )
}
