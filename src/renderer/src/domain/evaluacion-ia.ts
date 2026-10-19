import type { Proyecto } from './modelo'
import type { Propuesta } from './propuestas'
import { aplicarOperaciones } from './operaciones'
import { validarProyecto } from './validacion'

export interface EvaluacionIA {
  bloqueos: string[]
  advertencias: string[]
  requiereConfirmacion: boolean
}

/** Comprueba evidencia estructural y señala decisiones de negocio. No pretende
 * demostrar la veracidad del texto libre ni resolver supuestos automáticamente. */
export function evaluarPropuestaIA(proyecto: Proyecto, propuesta: Propuesta): EvaluacionIA {
  const bloqueos: string[] = [], advertencias = new Set<string>()
  if (!propuesta.origenIA || !['pendiente', 'desactualizada'].includes(propuesta.estado)) return { bloqueos, advertencias: [], requiereConfirmacion: false }
  if (propuesta.supuestos.length || propuesta.preguntas.length) {
    advertencias.add('Hay supuestos o preguntas pendientes: revisa su relación con los cambios antes de aprobar.')
  }
  const texto = [propuesta.titulo, propuesta.explicacion, propuesta.fundamento, propuesta.resultado].join(' ')
  if (/\b(?:[123]\s*FN|BCNF|Boyce.Codd)\b/i.test(texto)) {
    advertencias.add('Las afirmaciones de normalización de la IA no están certificadas. Contrástalas con Revisar reglas y las dependencias declaradas.')
  }
  const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  const supuestos = new Set(propuesta.supuestos.map(normalizar))
  if ([...supuestos].some(s => /\bno\b/.test(s) && supuestos.has(s.replace(/\bno\s+/g, '')))) {
    advertencias.add('Hay supuestos potencialmente contradictorios. Aclara las alternativas antes de confirmar cambios.')
  }
  const reglas = new Set(proyecto.reglas.map(r => normalizar(r.texto)))
  for (const op of propuesta.operaciones) {
    if (op.op === 'updateAtributo') {
      const e = proyecto.diseno.entidades.find(e => e.id === op.entidadId)
      const a = e?.atributos.find(a => a.id === op.id)
      if (a && ['nulable', 'unico', 'multivalorado', 'tipoDato'].some(campo => {
        const k = campo as 'nulable' | 'unico' | 'multivalorado' | 'tipoDato'
        return op.parche[k] !== undefined && op.parche[k] !== a[k]
      })) advertencias.add(`Confirma tipo y restricciones de «${e!.nombre}.${a.nombre}» con evidencia del negocio; unicidad no implica obligatoriedad.`)
    }
    if (op.op === 'addClave' || op.op === 'updateClave') {
      advertencias.add('La IA cambia una clave: confirma columnas, orden, unicidad y correspondencia del destino compuesto.')
    }
    if (op.op === 'addRegla') {
      const textoRegla = normalizar(op.regla.texto)
      if (reglas.has(textoRegla)) advertencias.add('La propuesta repite una regla ya declarada. Comprueba si hace falta incorporarla.')
      reglas.add(textoRegla)
      if (op.regla.tipo === 'supuesto' || op.regla.dependencia) advertencias.add('Confirma las nuevas suposiciones o dependencias funcionales con evidencia explícita.')
    }
    if (['addRegla', 'updateRegla', 'removeRegla'].includes(op.op)) advertencias.add('La IA cambia reglas declaradas: comprueba que conserva la lógica de negocio, incluidos precios históricos y excepciones.')
    if (['removeEntidad', 'removeAtributo', 'removeClave', 'removeRelacion'].includes(op.op)) advertencias.add('La propuesta elimina elementos o restricciones. Revisa la información que se perdería y sus referencias.')
  }
  if (propuesta.operaciones.length) {
    try {
      const estado = aplicarOperaciones({ diseno: proyecto.diseno, reglas: proyecto.reglas }, propuesta.operaciones)
      bloqueos.push(...validarProyecto({ ...proyecto, ...estado }).filter(h => h.severidad === 'error').map(h => h.mensaje))
      for (const entidad of estado.diseno.entidades) for (const clave of entidad.claves) {
        if (clave.tipo !== 'foranea' || !clave.foranea) continue
        const destino = estado.diseno.entidades.find(e => e.id === clave.foranea!.entidadDestinoId)
        const claves = clave.foranea.claveDestinoIds.map(id => destino?.claves.find(c => c.id === id))
        if (claves.some(c => !c || c.tipo === 'foranea') || claves.reduce((n, c) => n + (c?.atributoIds.length ?? 0), 0) !== clave.atributoIds.length) {
          bloqueos.push(`La clave foránea «${entidad.nombre}.${clave.nombre}» necesita una clave destino primaria/candidata y el mismo número de columnas, en orden.`)
        }
      }
    } catch {
      bloqueos.push('Las operaciones contienen referencias inexistentes o incompatibles. No se puede aplicar la propuesta.')
    }
  }
  return { bloqueos, advertencias: [...advertencias], requiereConfirmacion: propuesta.operaciones.length > 0 && advertencias.size > 0 }
}
