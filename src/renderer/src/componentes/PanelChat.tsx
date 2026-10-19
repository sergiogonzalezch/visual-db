import { mensajeErrorVisible } from '../presentacion/errores'
import { useEffect, useRef, useState } from 'react'
import { useTienda } from '../estado/tienda'

export function PanelChat(): JSX.Element {
  const tienda = useTienda()
  const [texto, setTexto] = useState('')
  useEffect(() => { setTexto('') }, [tienda.proyecto.id, tienda.sesionChat])
  const mensajesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!tienda.panelAbierto) return
    mensajesRef.current?.scrollTo({ top: mensajesRef.current.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [tienda.mensajesChat, tienda.panelAbierto])

  return (
    <div className="chat-contenedor">
      <h2>Chat con el agente</h2>
      <div className="contexto-chat"><span className="chip">{tienda.ajustes?.proveedor.modelo || 'Sin modelo seleccionado'}</span><p className="descripcion-panel">El asistente ve el diseño y la selección actual. Conversar no aplica cambios.</p></div>
      <div ref={mensajesRef} className="mensajes-chat" role="log" aria-label="Conversación con el asistente">
        {tienda.mensajesChat.map((mensaje, i) => (
          <div key={i} className={`mensaje ${mensaje.rol}`}>
            {mensaje.rol === 'sistema' ? mensaje.contenido.replace(/Error invoking remote method '[^']+':\s*(?:Error:\s*)?/g, '') : mensaje.rol === 'asistente' && mensaje.contenido.includes('<propuestas>') ? <>{mensaje.contenido.split('<propuestas>')[0]}<details><summary>Contenido estructurado del modelo · no aplicado</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{mensaje.contenido.slice(mensaje.contenido.indexOf('<propuestas>'))}</pre></details></> : mensaje.contenido}
            {mensaje.propuestaId && (
              <div className="chips" style={{ marginTop: 4 }}>
                <span className="chip">referencia a propuesta</span>
              </div>
            )}
          </div>
        ))}
        {tienda.estadoIA.error && (
          <div className="mensaje sistema" role="alert"><span className="solo-lectores">{mensajeErrorVisible(tienda.estadoIA.error)}</span><button disabled={tienda.estadoIA.chateando || !tienda.mensajesChat.some(m => m.rol === 'usuario')} onClick={() => { const ultimo = [...tienda.mensajesChat].reverse().find(m => m.rol === 'usuario'); if (ultimo) void tienda.chatear(ultimo.contenido) }}>Reintentar último mensaje</button></div>
        )}
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
