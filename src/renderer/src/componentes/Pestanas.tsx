import { useRef } from 'react'

export function Pestanas<T extends string>({ id, etiqueta, opciones, valor, cambiar }: {
  id: string; etiqueta: string; opciones: readonly { valor: T; etiqueta: string }[]; valor: T; cambiar: (valor: T) => void
}): JSX.Element {
  const grupo = useRef<HTMLDivElement>(null)
  return <div ref={grupo} className="pestanas" role="tablist" aria-label={etiqueta} onKeyDown={(e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const actual = opciones.findIndex((o) => o.valor === valor)
    const indice = e.key === 'Home' ? 0 : e.key === 'End' ? opciones.length - 1 : (actual + (e.key === 'ArrowRight' ? 1 : -1) + opciones.length) % opciones.length
    cambiar(opciones[indice].valor)
    grupo.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[indice]?.focus()
  }}>{opciones.map((o) => <button key={o.valor} type="button" id={`${id}-tab-${o.valor}`} role="tab" aria-selected={valor === o.valor}
    aria-controls={`${id}-panel-${o.valor}`} tabIndex={valor === o.valor ? 0 : -1} className={valor === o.valor ? 'activa' : ''} onClick={() => cambiar(o.valor)}>{o.etiqueta}</button>)}</div>
}
