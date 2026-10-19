import { useCallback, useEffect, useRef } from 'react'
import { useTienda } from '../estado/tienda'
import { PanelPropiedades } from './PanelPropiedades'
import { PanelRevision } from './PanelRevision'
import { PanelChat } from './PanelChat'
import { PanelConsumo } from './PanelConsumo'
import { Pestanas } from './Pestanas'
import { Icono } from './Icono'
const opciones = [{ valor: 'propiedades', etiqueta: 'Propiedades' }, { valor: 'revision', etiqueta: 'Revisión' }, { valor: 'chat', etiqueta: 'Chat' }, { valor: 'consumo', etiqueta: 'Consumo' }] as const

export function PanelDerecho(): JSX.Element {
  const tienda = useTienda()
  const { panelAbierto, setPanelAbierto } = tienda
  const panel = useRef<HTMLElement>(null)
  const tirador = useRef<HTMLButtonElement>(null)
  const enfocarAlAbrir = useRef(false)
  const cerrar = useCallback(() => { setPanelAbierto(false); tirador.current?.focus({ preventScroll: true }) }, [setPanelAbierto])
  useEffect(() => {
    if (panel.current) panel.current.inert = !panelAbierto
    if (!panelAbierto || !enfocarAlAbrir.current) return
    enfocarAlAbrir.current = false
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [panelAbierto])
  useEffect(() => {
    if (!panelAbierto) return
    const manejar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]')) return
      e.preventDefault(); e.stopPropagation(); cerrar()
    }
    document.addEventListener('keydown', manejar)
    return () => document.removeEventListener('keydown', manejar)
  }, [panelAbierto, cerrar])
  return <div className={`panel-deslizable${panelAbierto ? ' abierto' : ''}`}>
    <button ref={tirador} type="button" className="tirador-panel" aria-label={panelAbierto ? 'Ocultar panel del proyecto' : 'Abrir panel del proyecto'} aria-expanded={panelAbierto} aria-controls="panel-proyecto" title={panelAbierto ? 'Ocultar panel · Esc' : 'Abrir panel del proyecto'} onClick={() => {
      if (panelAbierto) cerrar()
      else { enfocarAlAbrir.current = true; setPanelAbierto(true) }
    }}><Icono nombre="lateral" /></button>
    <aside ref={panel} id="panel-proyecto" className="panel-derecho" aria-label="Inspector del proyecto" aria-hidden={!panelAbierto}>
      <header className="cabecera-inspector"><strong>Panel del proyecto</strong><button type="button" aria-label="Cerrar panel del proyecto" title="Cerrar panel · Esc" onClick={cerrar}><Icono nombre="cerrar" /></button></header>
      <Pestanas id="inspector" etiqueta="Paneles del proyecto" opciones={opciones} valor={tienda.pestana} cambiar={tienda.setPestana} />
      {opciones.map(opcion => <div key={`${tienda.proyecto.id}-${opcion.valor}`} hidden={tienda.pestana !== opcion.valor} className={`contenido-panel panel-${opcion.valor}`} role="tabpanel" id={`inspector-panel-${opcion.valor}`} aria-labelledby={`inspector-tab-${opcion.valor}`} tabIndex={0}>
        {opcion.valor === 'propiedades' && <PanelPropiedades />}
        {opcion.valor === 'revision' && <PanelRevision />}
        {opcion.valor === 'chat' && <PanelChat />}
        {opcion.valor === 'consumo' && <PanelConsumo />}
      </div>)}
    </aside>
  </div>
}
