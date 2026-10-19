import type { InstantaneaExportacion } from './instantanea'
import { marcas } from './graficos'

const seguro = (texto: string) => texto.replace(/[\r\n\x00-\x1f]/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '”')
function cardinalidad(min: unknown, max: unknown, izquierda: boolean) {
  if (min === 'desconocido' || max === 'desconocido') return null
  if (max === 1) return min === 1 ? '||' : izquierda ? '|o' : 'o|'
  return min === 1 ? izquierda ? '}|' : '|{' : izquierda ? '}o' : 'o{'
}
export function exportarMermaid(s: InstantaneaExportacion) {
  const advertencias = [
    'Mermaid ER requiere identificación de relaciones. La línea punteada es solo una convención de esta salida; el modelo no declara identificación.',
    'Mermaid no conserva geometría, participación, nulabilidad, composición de claves, reglas, notas ni atributos de relaciones. Usa Markdown/JSON para la semántica completa.'
  ]
  const lineas = ['erDiagram', `    %% ${seguro(s.proyecto.nombre)} · ${s.exportacion.origen} · ${s.exportacion.alcance}`]
  const ids = new Map(s.modelo.entidades.map((e, i) => [e.id, `E${i}`]))
  for (const e of s.modelo.entidades) {
    lineas.push(`    %% entidad ${seguro(e.id)}`, `    ${ids.get(e.id)}["${seguro(e.nombre)}"] {`)
    e.atributos.forEach((a, i) => {
      const tipo = /^[A-Za-z][A-Za-z0-9_()[\]-]*$/.test(a.tipoDato) ? a.tipoDato : 'tipo_pendiente'
      const nombre = /^[A-Za-z][A-Za-z0-9_()[\]-]*$/.test(a.nombre) && e.atributos.filter(x => x.nombre === a.nombre).length === 1 ? a.nombre : `atributo_${i}`
      const keys = marcas(e, a.id)
      lineas.push(`        ${tipo} ${nombre}${keys ? ` ${keys}` : ''} "${seguro(`${a.nombre} [${a.id}]; tipo: ${a.tipoDato}; nulable: ${a.nulable}; multivalorado: ${a.multivalorado}`)}"`)
    })
    lineas.push('    }')
  }
  for (const r of s.modelo.relaciones) {
    const a = cardinalidad(r.inicio.cardinalidad.minimo, r.inicio.cardinalidad.maximo, true)
    const b = cardinalidad(r.fin.cardinalidad.minimo, r.fin.cardinalidad.maximo, false)
    if (!a || !b || !ids.has(r.inicio.entidadId) || !ids.has(r.fin.entidadId)) {
      advertencias.push(`Relación ${r.id} omitida: cardinalidad desconocida o referencia externa/inexistente.`)
      continue
    }
    lineas.push(`    ${ids.get(r.inicio.entidadId)} ${a}..${b} ${ids.get(r.fin.entidadId)} : "${seguro(r.nombre ?? r.id)}"`)
  }
  if (s.exportacion.origen === 'propuesto') advertencias.unshift('PROPUESTA NO APLICADA: esta salida no es un diseño confirmado.')
  if (s.exportacion.alcance === 'seleccion') advertencias.unshift('SELECCIÓN PARCIAL: no es el modelo completo.')
  lineas.push(...advertencias.map(a => `    %% ADVERTENCIA: ${seguro(a)}`))
  return { contenido: lineas.join('\n') + '\n', advertencias }
}
