import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { limitarPanel, PosicionPanel } from '../presentacion/posicion-panel'

const INICIAL = { x: 16, y: 48 }

export function usePanelArrastrable() {
  const panel = useRef<HTMLDivElement>(null)
  const asa = useRef<HTMLButtonElement>(null)
  const arrastre = useRef<{ id: number; clientX: number; clientY: number; origen: PosicionPanel } | null>(null)
  const [posicion, setPosicion] = useState(INICIAL)
  const [moviendo, setMoviendo] = useState(false)
  const mover = useCallback((destino: PosicionPanel) => {
    const nodo = panel.current, area = nodo?.parentElement
    if (!nodo || !area) return
    const limitada = limitarPanel(destino, { ancho: area.clientWidth, alto: area.clientHeight }, { ancho: nodo.offsetWidth, alto: nodo.offsetHeight })
    setPosicion((prev) => prev.x === limitada.x && prev.y === limitada.y ? prev : limitada)
  }, [])
  useEffect(() => {
    const nodo = panel.current, area = nodo?.parentElement
    if (!nodo || !area) return
    const observar = new ResizeObserver(() => {
      setPosicion((prev) => limitarPanel(prev, { ancho: area.clientWidth, alto: area.clientHeight }, { ancho: nodo.offsetWidth, alto: nodo.offsetHeight }))
    })
    observar.observe(area); observar.observe(nodo)
    return () => observar.disconnect()
  }, [])
  const terminar = (cancelar = false) => {
    const actual = arrastre.current
    if (!actual) return
    arrastre.current = null
    if (cancelar) mover(actual.origen)
    setMoviendo(false)
    if (asa.current?.hasPointerCapture(actual.id)) asa.current.releasePointerCapture(actual.id)
  }
  return { panel, asa, posicion, moviendo, restablecer: () => mover(INICIAL),
    empezar: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      e.preventDefault(); e.stopPropagation(); e.currentTarget.focus()
      arrastre.current = { id: e.pointerId, clientX: e.clientX, clientY: e.clientY, origen: posicion }
      e.currentTarget.setPointerCapture(e.pointerId); setMoviendo(true)
    },
    desplazar: (e: PointerEvent<HTMLButtonElement>) => {
      const actual = arrastre.current
      if (!actual || actual.id !== e.pointerId) return
      mover({ x: actual.origen.x + e.clientX - actual.clientX, y: actual.origen.y + e.clientY - actual.clientY })
    },
    soltar: () => terminar(), cancelar: () => terminar(true),
    teclado: (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Escape' && arrastre.current) { e.preventDefault(); e.stopPropagation(); terminar(true); return }
      const desplazamientos: Record<string, PosicionPanel> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
      const delta = desplazamientos[e.key]
      if (!delta) return
      e.preventDefault(); e.stopPropagation()
      const paso = e.shiftKey ? 24 : 8
      mover({ x: posicion.x + delta.x * paso, y: posicion.y + delta.y * paso })
    }
  }
}
