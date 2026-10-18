export interface PosicionPanel { x: number; y: number }
export interface TamanoPanel { ancho: number; alto: number }

export function limitarPanel(posicion: PosicionPanel, area: TamanoPanel, panel: TamanoPanel): PosicionPanel {
  const limitar = (valor: number, disponible: number) => {
    const espacio = Math.max(0, disponible)
    const margen = Math.min(8, espacio / 2)
    return Math.min(espacio - margen, Math.max(margen, valor))
  }
  return { x: limitar(posicion.x, area.ancho - panel.ancho), y: limitar(posicion.y, area.alto - panel.alto) }
}
