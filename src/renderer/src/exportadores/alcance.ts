import type { Proyecto } from '../domain/modelo'
import type { Seleccion } from '../estado/tienda'
import { aplicarOperaciones } from '../domain/operaciones'
import { comprobarPropuesta } from '../domain/propuestas'

export interface ContextoExportacion {
  origen: 'actual' | 'propuesto'
  alcance: 'completo' | 'seleccion'
  propuesta: { id: string; titulo: string; versionOrigen: number; version: number } | null
  advertencias: string[]
}
export function prepararAlcance(original: Proyecto, alcance: 'completo' | 'seleccion', seleccion: Seleccion, propuestaId: string | null) {
  const proyecto = structuredClone(original)
  const contexto: ContextoExportacion = { origen: propuestaId ? 'propuesto' : 'actual', alcance, propuesta: null, advertencias: [] }
  if (propuestaId) {
    const p = proyecto.propuestas.find(p => p.id === propuestaId)
    if (!p || !['pendiente', 'aceptada'].includes(p.estado) || !comprobarPropuesta(proyecto, p).aplicable) throw new Error('La propuesta no está disponible o está desactualizada. Vuelve a la vista actual.')
    const resultado = aplicarOperaciones({ diseno: proyecto.diseno, reglas: proyecto.reglas }, p.operaciones)
    proyecto.diseno = resultado.diseno; proyecto.reglas = resultado.reglas
    contexto.propuesta = { id: p.id, titulo: p.titulo, versionOrigen: p.versionOrigen, version: p.version }
    contexto.advertencias.push('Propuesta no aplicada: esta salida es una vista previa, no el diseño confirmado.')
  }
  if (alcance === 'seleccion') {
    if (!seleccion) throw new Error('Selecciona una entidad, relación o nota en el lienzo antes de exportar una selección.')
    const entidades = new Set<string>()
    if (seleccion.tipo === 'entidad') entidades.add(seleccion.id)
    if (seleccion.tipo === 'relacion') {
      const r = proyecto.diseno.relaciones.find(r => r.id === seleccion.id)
      if (!r) throw new Error('La relación seleccionada no existe en esta vista.')
      entidades.add(r.inicio.entidadId); entidades.add(r.fin.entidadId)
    }
    proyecto.diseno.entidades = proyecto.diseno.entidades.filter(e => entidades.has(e.id))
    proyecto.diseno.relaciones = proyecto.diseno.relaciones.filter(r => seleccion.tipo === 'relacion' ? r.id === seleccion.id : entidades.has(r.inicio.entidadId) && entidades.has(r.fin.entidadId))
    proyecto.diseno.notas = proyecto.diseno.notas.filter(n => seleccion.tipo === 'nota' && n.id === seleccion.id)
    if (!proyecto.diseno.entidades.length && !proyecto.diseno.notas.length) throw new Error('La selección no está disponible en esta vista.')
    contexto.advertencias.push('Exportación parcial. Las relaciones externas quedan fuera; las claves foráneas conservan referencias externas. Las reglas y pendientes son contexto global del proyecto.')
  }
  return { proyecto, contexto }
}
