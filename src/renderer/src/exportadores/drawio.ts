import type { InstantaneaExportacion } from './instantanea'
import { prepararGrafico, xml, marcas } from './graficos'
import { etiquetaCardinalidad } from '../presentacion/geometria'

export function exportarDrawio(s: InstantaneaExportacion) {
  const g = prepararGrafico(s)
  const ids = new Map(g.cajas.map((e, i) => [e.id, `entidad-${i}`]))
  const celdas = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
  for (const e of g.cajas) {
    const entidad = s.modelo.entidades.find(x => x.id === e.id)!
    const valor = [e.nombre, ...entidad.atributos.map(a => `${a.nombre}${marcas(entidad, a.id) ? ` ${marcas(entidad, a.id).replace(/,/g, ' ')}` : ''}`)].join('\n')
    celdas.push(`<mxCell id="${ids.get(e.id)}" value="${xml(valor)}" style="shape=swimlane;startSize=28;horizontal=1;whiteSpace=wrap;html=0;fillColor=#e8efff;strokeColor=#52627b;fontColor=#17243a;align=left;spacingLeft=10;" vertex="1" parent="1"><mxGeometry x="${e.x}" y="${e.y}" width="${e.ancho}" height="${e.alto}" as="geometry"/></mxCell>`)
  }
  g.conexiones.forEach((c, i) => {
    const r = c.r
    const etiqueta = `${etiquetaCardinalidad(r.inicio.cardinalidad.minimo, r.inicio.cardinalidad.maximo)} ${r.nombre ?? ''} ${etiquetaCardinalidad(r.fin.cardinalidad.minimo, r.fin.cardinalidad.maximo)}`.trim()
    celdas.push(`<mxCell id="relacion-${i}" value="${xml(etiqueta)}" style="edgeStyle=orthogonalEdgeStyle;html=0;endArrow=none;startArrow=none;fontSize=12;" edge="1" parent="1" source="${ids.get(r.inicio.entidadId)}" target="${ids.get(r.fin.entidadId)}"><mxGeometry relative="1" as="geometry"/></mxCell>`)
  })
  g.notas.forEach((n, i) => celdas.push(`<mxCell id="nota-${i}" value="${xml(s.notas.find(x => x.id === n.id)!.texto)}" style="shape=note;edgeStyle=none;html=0;whiteSpace=wrap;fillColor=#fff5cf;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.ancho}" height="${n.alto}" as="geometry"/></mxCell>`))
  const advertencias = ['draw.io conserva tablas, atributos, conectores y notas editables. La reimportación no recupera todos los tipos, reglas, nulabilidad, composición de claves ni notas como notas; revisa la interpretación antes de confirmar.']
  if (s.exportacion.origen === 'propuesto') advertencias.unshift('PROPUESTA NO APLICADA')
  if (s.exportacion.alcance === 'seleccion') advertencias.unshift('SELECCIÓN PARCIAL')
  const leyenda = `${s.proyecto.nombre}\n${advertencias.join('\n')}`
  celdas.push(`<mxCell id="leyenda" value="${xml(leyenda)}" style="text;edgeStyle=none;html=0;whiteSpace=wrap;align=left;" vertex="1" parent="1"><mxGeometry x="${g.x}" y="${g.y - 130}" width="${Math.max(g.ancho, 500)}" height="120" as="geometry"/></mxCell>`)
  return { contenido: `<?xml version="1.0" encoding="UTF-8"?><mxfile host="Visual BD"><diagram id="visual-bd" name="${xml(s.proyecto.nombre)}" compressed="false"><mxGraphModel grid="0" page="0"><root>${celdas.join('')}</root></mxGraphModel></diagram></mxfile>`, advertencias }
}
