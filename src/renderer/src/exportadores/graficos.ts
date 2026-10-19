import type { InstantaneaExportacion } from './instantanea'
import { bordeRectangulo, etiquetaCardinalidad } from '../presentacion/geometria'

export type TemaDiagrama = 'claro' | 'oscuro' | 'transparente'
export function xml(texto: unknown): string {
  return String(texto).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\r?\n/g, '&#10;')
}
export function envolver(texto: string, columnas: number): string[] {
  return texto.split(/\r?\n/).flatMap(linea => {
    const caracteres = Array.from(linea)
    return caracteres.length ? Array.from({ length: Math.ceil(caracteres.length / columnas) }, (_, i) => caracteres.slice(i * columnas, (i + 1) * columnas).join('')) : ['']
  })
}
export function marcas(e: InstantaneaExportacion['modelo']['entidades'][number], atributoId: string): string {
  const etiquetas = e.claves.filter(c => c.atributoIds.includes(atributoId)).map(c => c.tipo === 'primaria' ? 'PK' : c.tipo === 'foranea' ? 'FK' : 'UK')
  if (e.atributos.find(a => a.id === atributoId)?.unico === true) etiquetas.push('UK')
  return [...new Set(etiquetas)].join(',')
}
export function prepararGrafico(s: InstantaneaExportacion) {
  if (!s.presentacion) throw new Error('La exportación gráfica requiere geometría.')
  const cajas = s.modelo.entidades.map(e => {
    const g = s.presentacion!.entidades.find(g => g.id === e.id)
    if (!g) throw new Error('Falta la posición de una entidad.')
    const lineas = e.atributos.map(a => `${a.nombre} : ${a.tipoDato}${a.nulable === false ? ' *' : a.nulable === 'desconocido' ? ' ?' : ''}${marcas(e, a.id) ? ` [${marcas(e, a.id)}]` : ''}`)
    return { id: e.id, nombre: e.nombre, x: g.x, y: g.y, ancho: Math.max(180, ...[e.nombre, ...lineas].map(l => Array.from(l).length * 9 + 28)), alto: 38 + Math.max(1, lineas.length) * 20, lineas }
  })
  // Las etiquetas exportadas incluyen tipos y claves y pueden crecer respecto al lienzo.
  // Separar únicamente la copia gráfica; nunca modificar las posiciones del proyecto.
  const colocadas: typeof cajas = []
  for (const caja of [...cajas].sort((a, b) => a.x - b.x || a.y - b.y)) {
    let colision: typeof caja | undefined
    while ((colision = colocadas.find(c => caja.x < c.x + c.ancho + 80 && caja.x + caja.ancho + 80 > c.x && caja.y < c.y + c.alto + 30 && caja.y + caja.alto + 30 > c.y))) caja.x = colision.x + colision.ancho + 80
    colocadas.push(caja)
  }
  const notas = s.notas.map(n => {
    const g = s.presentacion!.notas.find(g => g.id === n.id)
    if (!g) throw new Error('Falta la posición de una nota.')
    const lineas = envolver(n.texto, Math.max(10, Math.floor(g.ancho / 8)))
    return { ...g, ancho: Math.max(100, g.ancho), alto: Math.max(g.alto, lineas.length * 18 + 20), lineas }
  })
  if (!cajas.length && !notas.length) throw new Error('El diagrama está vacío. Añade entidades o incluye las notas antes de exportar.')
  const conexiones = s.modelo.relaciones.map((r, indice) => {
    const a = cajas.find(e => e.id === r.inicio.entidadId), b = cajas.find(e => e.id === r.fin.entidadId)
    if (!a || !b) throw new Error('Hay relaciones con entidades inexistentes. Corrígelas antes de exportar el diagrama.')
    if (a === b) {
      const x = a.x + a.ancho, y = a.y + a.alto / 2
      return { r, puntos: [{ x, y }, { x: x + 80, y }, { x: x + 80, y: a.y - 35 }, { x: a.x + a.ancho / 2, y: a.y - 35 }, { x: a.x + a.ancho / 2, y: a.y }], etiqueta: { x: x + 80, y: a.y - 45 } }
    }
    const p = bordeRectangulo(a, { x: b.x + b.ancho / 2, y: b.y + b.alto / 2 })
    const q = bordeRectangulo(b, { x: a.x + a.ancho / 2, y: a.y + a.alto / 2 })
    if (Math.abs(p.y - q.y) < 1 && cajas.some(c => c !== a && c !== b && c.x < Math.max(p.x, q.x) && c.x + c.ancho > Math.min(p.x, q.x) && p.y >= c.y && p.y <= c.y + c.alto)) {
      const y = Math.min(...cajas.map(c => c.y)) - 45 - indice * 25
      const inicio = { x: a.x + a.ancho / 2, y: a.y }, fin = { x: b.x + b.ancho / 2, y: b.y }
      return { r, puntos: [inicio, { x: inicio.x, y }, { x: fin.x, y }, fin], etiqueta: { x: (inicio.x + fin.x) / 2, y: y - 14 } }
    }
    return { r, puntos: [p, q], etiqueta: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 - 14 } }
  })
  const rectangulos = [...cajas, ...notas]
  for (const r of rectangulos) if (![r.x, r.y, r.ancho, r.alto].every(Number.isFinite)) throw new Error('La geometría contiene valores inválidos.')
  const puntos = conexiones.flatMap(c => [...c.puntos, { x: c.etiqueta.x - (c.r.nombre?.length ?? 0) * 5, y: c.etiqueta.y - 18 }, { x: c.etiqueta.x + (c.r.nombre?.length ?? 0) * 5, y: c.etiqueta.y + 18 }])
  const x = Math.floor(Math.min(...rectangulos.map(r => r.x), ...puntos.map(p => p.x)) - 90)
  const y = Math.floor(Math.min(...rectangulos.map(r => r.y), ...puntos.map(p => p.y)) - 90)
  const ancho = Math.ceil(Math.max(...rectangulos.map(r => r.x + r.ancho), ...puntos.map(p => p.x)) - x + 90)
  const alto = Math.ceil(Math.max(...rectangulos.map(r => r.y + r.alto), ...puntos.map(p => p.y)) - y + 90)
  return { cajas, notas, conexiones, x, y, ancho, alto }
}
export function exportarSvg(s: InstantaneaExportacion, tema: TemaDiagrama) {
  const g = prepararGrafico(s)
  const titulo = `${s.exportacion.origen === 'propuesto' ? 'PROPUESTA NO APLICADA · ' : ''}${s.exportacion.alcance === 'seleccion' ? 'SELECCIÓN PARCIAL · ' : ''}${s.proyecto.nombre}`
  const ancho = Math.max(g.ancho, Array.from(titulo).length * 9 + 40)
  const colores = tema === 'oscuro' ? { fondo: '#11151c', panel: '#191f29', cabecera: '#263755', texto: '#e6edf7', borde: '#8294ae', nota: '#3c3520' } : { fondo: '#ffffff', panel: '#f7f9fc', cabecera: '#e8efff', texto: '#17243a', borde: '#52627b', nota: '#fff5cf' }
  const partes: string[] = []
  const texto = (x: number, y: number, contenido: string, extra = '') => `<text x="${x}" y="${y}" ${extra}>${xml(contenido)}</text>`
  if (tema !== 'transparente') partes.push(`<rect x="${g.x}" y="${g.y}" width="${ancho}" height="${g.alto}" fill="${colores.fondo}"/>`)
  partes.push(texto(g.x + 18, g.y + 24, `${s.exportacion.origen === 'propuesto' ? 'PROPUESTA NO APLICADA · ' : ''}${s.exportacion.alcance === 'seleccion' ? 'SELECCIÓN PARCIAL · ' : ''}${s.proyecto.nombre}`))
  for (const c of g.conexiones) {
    partes.push(`<polyline points="${c.puntos.map(p => `${p.x},${p.y}`).join(' ')}" stroke="${colores.borde}" stroke-width="1.5" fill="none"/>`)
    const p = c.puntos[0], q = c.puntos[c.puntos.length - 1]
    const juntoInicio = c.puntos[1], juntoFin = c.puntos[c.puntos.length - 2]
    const etiqueta = (extremo: typeof p, hacia: typeof p, valor: string) => {
      const largo = Math.hypot(hacia.x - extremo.x, hacia.y - extremo.y) || 1
      const ux = (hacia.x - extremo.x) / largo, uy = (hacia.y - extremo.y) / largo
      return texto(extremo.x + ux * 28 - uy * 14, extremo.y + uy * 28 + ux * 14, valor, 'text-anchor="middle"')
    }
    partes.push(etiqueta(p, juntoInicio, etiquetaCardinalidad(c.r.inicio.cardinalidad.minimo, c.r.inicio.cardinalidad.maximo)))
    partes.push(etiqueta(q, juntoFin, etiquetaCardinalidad(c.r.fin.cardinalidad.minimo, c.r.fin.cardinalidad.maximo)))
    if (c.r.nombre) partes.push(texto(c.etiqueta.x, c.etiqueta.y, c.r.nombre, 'text-anchor="middle"'))
  }
  for (const e of g.cajas) {
    partes.push(`<rect x="${e.x}" y="${e.y}" width="${e.ancho}" height="${e.alto}" rx="8" fill="${colores.panel}" stroke="${colores.borde}"/>`, `<rect x="${e.x + 1}" y="${e.y + 1}" width="${e.ancho - 2}" height="28" rx="7" fill="${colores.cabecera}"/>`, texto(e.x + 12, e.y + 20, e.nombre))
    e.lineas.forEach((l, i) => partes.push(texto(e.x + 12, e.y + 48 + i * 20, l)))
  }
  for (const n of g.notas) {
    partes.push(`<rect x="${n.x}" y="${n.y}" width="${n.ancho}" height="${n.alto}" rx="6" fill="${colores.nota}" stroke="${colores.borde}"/>`)
    n.lineas.forEach((l, i) => partes.push(texto(n.x + 8, n.y + 20 + i * 18, l)))
  }
  // La leyenda completa no debe ampliar silenciosamente el diagrama ni recortarse.
  return { contenido: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${g.alto}" viewBox="${g.x} ${g.y} ${ancho} ${g.alto}" role="img"><title>${xml(s.proyecto.nombre)}</title><desc>${xml(titulo)}. Las restricciones completas están en el reporte Markdown/JSON.</desc><g fill="${colores.texto}" font-family="Segoe UI, Arial, sans-serif" font-size="13">${partes.join('')}</g></svg>`, ancho, alto: g.alto }
}
