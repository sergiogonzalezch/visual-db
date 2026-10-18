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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>Chat con el agente</h2>
      <p className="explicacion" style={{ color: 'var(--texto-suave)', fontSize: 12, marginBottom: 8 }}>
        El agente ve el modelo confirmado, tus reglas de negocio y la selección actual. Discutir nunca
        equivale a aprobar; cualquier propuesta derivada requiere aprobación explícita.
        {tienda.ajustes?.soloLocal && ' Modo Solo local activo: no hay conexión remota.'}
      </p>
      <div className="mensajes-chat">
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
          <div className="mensaje sistema">Error: {tienda.estadoIA.error}</div>
        )}
        <div ref={finRef} />
      </div>
      <div className="entrada-chat" style={{ marginTop: 'auto' }}>
        <textarea
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
          Enviar
        </button>
      </div>
    </div>
  )
}
