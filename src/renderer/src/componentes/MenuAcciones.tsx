import { useEffect, useId, useRef, useState } from 'react'
import { Icono } from './Icono'

export interface AccionMenu {
  etiqueta: string
  detalle?: string
  ejecutar: () => void
  deshabilitada?: boolean
}

export function MenuAcciones({ etiqueta, acciones, primario = false }: {
  etiqueta: string; acciones: AccionMenu[]; primario?: boolean
}): JSX.Element {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const disparador = useRef<HTMLButtonElement>(null)
  const id = useId()
  const elementos = () => Array.from(contenedor.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
  useEffect(() => {
    if (!abierto) return
    elementos()[0]?.focus()
    const cerrarFuera = (e: PointerEvent) => { if (!contenedor.current?.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('pointerdown', cerrarFuera)
    return () => document.removeEventListener('pointerdown', cerrarFuera)
  }, [abierto])
  return <div className="menu-acciones" ref={contenedor} onBlur={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false)
  }} onKeyDown={(e) => {
    if (e.key === 'Escape' && abierto) { e.preventDefault(); e.stopPropagation(); setAbierto(false); disparador.current?.focus() }
    if (!abierto || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const items = elementos()
    const actual = items.indexOf(document.activeElement as HTMLButtonElement)
    const indice = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (actual + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[indice]?.focus()
  }}>
    <button ref={disparador} type="button" className={primario ? 'primario' : ''} aria-haspopup="menu" aria-expanded={abierto} aria-controls={id}
      onClick={() => setAbierto(!abierto)} onKeyDown={(e) => {
        if (!abierto && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setAbierto(true) }
      }}>{etiqueta}<Icono nombre="desplegar" /></button>
    {abierto && <div id={id} className="menu-opciones" role="menu" aria-label={etiqueta}>
      {acciones.map((accion) => <button key={accion.etiqueta} type="button" role="menuitem" disabled={accion.deshabilitada} onClick={() => {
        setAbierto(false); disparador.current?.focus(); accion.ejecutar()
      }}><span>{accion.etiqueta}</span>{accion.detalle && <small>{accion.detalle}</small>}</button>)}
    </div>}
  </div>
}
