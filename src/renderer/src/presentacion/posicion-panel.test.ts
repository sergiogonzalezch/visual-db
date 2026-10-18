import { describe, expect, it } from 'vitest'
import { limitarPanel } from './posicion-panel'

describe('posición de herramientas flotantes', () => {
  it('conserva una posición interior', () => {
    expect(limitarPanel({ x: 120, y: 80 }, { ancho: 800, alto: 600 }, { ancho: 132, alto: 270 })).toEqual({ x: 120, y: 80 })
  })
  it('limita el arrastre a los cuatro bordes', () => {
    const area = { ancho: 800, alto: 600 }, panel = { ancho: 132, alto: 270 }
    expect(limitarPanel({ x: -500, y: -200 }, area, panel)).toEqual({ x: 8, y: 8 })
    expect(limitarPanel({ x: 2000, y: 2000 }, area, panel)).toEqual({ x: 660, y: 322 })
  })
  it('reubica el panel al reducir el lienzo', () => {
    expect(limitarPanel({ x: 660, y: 322 }, { ancho: 400, alto: 350 }, { ancho: 132, alto: 270 })).toEqual({ x: 260, y: 72 })
  })
  it('evita coordenadas negativas cuando apenas hay espacio', () => {
    expect(limitarPanel({ x: 16, y: 48 }, { ancho: 100, alto: 90 }, { ancho: 100, alto: 90 })).toEqual({ x: 0, y: 0 })
  })
})
