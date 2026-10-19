import { DESCONOCIDO, type Entidad } from '../domain/modelo'
export interface Punto { x: number; y: number }
export function altoEntidad(entidad: Entidad): number { return 30 + Math.max(entidad.atributos.length, 1) * 15 + 10 }
export function anchoEntidad(entidad: Entidad): number {
  return Math.max(180, entidad.nombre.length * 7.5 + 40, entidad.atributos.reduce((max, a) => Math.max(max, a.nombre.length * 6.8 + 70), 0))
}
export function interseccionBorde(entidad: Entidad, hacia: Punto): Punto {
  return bordeRectangulo({ x: entidad.x, y: entidad.y, ancho: anchoEntidad(entidad), alto: altoEntidad(entidad) }, hacia)
}
export function bordeRectangulo(r: { x: number; y: number; ancho: number; alto: number }, hacia: Punto): Punto {
  const cx = r.x + r.ancho / 2, cy = r.y + r.alto / 2
  const dx = hacia.x - cx, dy = hacia.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const escala = Math.min(dx === 0 ? Infinity : r.ancho / 2 / Math.abs(dx), dy === 0 ? Infinity : r.alto / 2 / Math.abs(dy))
  return { x: cx + dx * escala, y: cy + dy * escala }
}
export function etiquetaCardinalidad(min: unknown, max: unknown): string {
  if (min === DESCONOCIDO || max === DESCONOCIDO) return '?'
  return min === 1 && max === 1 ? '1' : `${String(min)}..${String(max)}`
}
