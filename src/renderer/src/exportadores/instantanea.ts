import type { Proyecto } from '../domain/modelo'
import { validarProyecto } from '../domain/validacion'
import { analizarNormalizacion } from '../domain/normalizacion'
import type { ContextoExportacion } from './alcance'

export interface OpcionesExportacion { notas: boolean; revisionLocal: boolean; geometria?: boolean; propuestas?: boolean }

/** Proyección explícita: no serializar el proyecto completo ni su estado de sesión. */
export function crearInstantanea(proyecto: Proyecto, opciones: OpcionesExportacion, versionAplicacion: string, fecha = new Date().toISOString(), contexto?: ContextoExportacion) {
  const atributo = ({ id, nombre, descripcion, tipoDato, nulable, unico, multivalorado }: Proyecto['diseno']['entidades'][number]['atributos'][number]) =>
    ({ id, nombre, descripcion, tipoDato, nulable, unico, multivalorado })
  const hallazgos = validarProyecto(proyecto).map(({ severidad, codigo, mensaje, explicacion, elementos }) => ({ severidad, codigo, mensaje, explicacion, elementos }))
  for (const regla of proyecto.reglas) {
    const d = regla.dependencia
    if (!d) continue
    const entidad = proyecto.diseno.entidades.find(e => e.id === d.entidadId)
    if (!entidad || [...d.determinanteIds, ...d.dependientesIds].some(id => !entidad.atributos.some(a => a.id === id))) {
      hallazgos.push({ severidad: 'error', codigo: 'dependencia-referencia-inexistente', mensaje: `La dependencia «${regla.id}» contiene referencias inexistentes.`, explicacion: 'Revisa la entidad y los atributos de la dependencia funcional.', elementos: [{ tipo: 'regla', id: regla.id }] })
    }
  }
  const normalizacion = opciones.revisionLocal ? analizarNormalizacion(proyecto) : null
  const resultado = {
    formato: 'visual-bd-export' as const,
    versionFormato: 1,
    exportacion: { fecha, versionAplicacion, origen: contexto?.origen ?? 'actual', alcance: contexto?.alcance ?? 'completo', propuesta: contexto?.propuesta ?? null, opciones: { ...opciones } },
    proyecto: { id: proyecto.id, nombre: proyecto.nombre, versionDiseno: proyecto.versionDiseno, actualizadoEn: proyecto.actualizadoEn, interpretacion: proyecto.revision.interpretacion },
    modelo: {
      entidades: proyecto.diseno.entidades.map(({ id, nombre, descripcion, atributos, claves }) => ({
        id, nombre, descripcion, atributos: atributos.map(atributo),
        claves: claves.map(({ id, nombre, tipo, atributoIds, foranea }) => ({ id, nombre, tipo, atributoIds,
          foranea: foranea ? { entidadDestinoId: foranea.entidadDestinoId, claveDestinoIds: foranea.claveDestinoIds, relacionId: foranea.relacionId } : null }))
      })),
      relaciones: proyecto.diseno.relaciones.map(({ id, nombre, inicio, fin, atributos }) => ({ id, nombre,
        inicio: { entidadId: inicio.entidadId, cardinalidad: inicio.cardinalidad, participacion: inicio.participacion },
        fin: { entidadId: fin.entidadId, cardinalidad: fin.cardinalidad, participacion: fin.participacion }, atributos: atributos.map(atributo) })),
      reglas: proyecto.reglas.map(({ id, tipo, texto, dependencia }) => ({ id, tipo, texto, dependencia }))
    },
    notas: opciones.notas ? proyecto.diseno.notas.map(({ id, texto }) => ({ id, texto })) : [],
    presentacion: opciones.geometria ? {
      entidades: proyecto.diseno.entidades.map(({ id, x, y, ancho, alto }) => ({ id, x, y, ancho, alto })),
      notas: opciones.notas ? proyecto.diseno.notas.map(({ id, x, y, ancho, alto }) => ({ id, x, y, ancho, alto })) : []
    } : null,
    anexoPropuestas: opciones.propuestas ? proyecto.propuestas.filter(p => p.estado === 'pendiente').map(({ id, titulo, explicacion, estado, versionOrigen, preguntas, supuestos }) => ({ id, titulo, explicacion, estado, versionOrigen, preguntas, supuestos })) : [],
    pendientes: {
      desconocidos: proyecto.desconocidos,
      figurasSinClasificar: proyecto.revision.figurasSinClasificar.map(({ id, texto, tipoSugerido }) => ({ id, texto, tipoSugerido })),
      ambiguedades: proyecto.revision.ambiguidades.filter(a => !a.resolucion).map(({ id, tipo, pregunta, destino }) => ({ id, tipo, pregunta, destino }))
    },
    revisionLocal: normalizacion ? { estructura: hallazgos, normalizacion: {
      niveles: normalizacion.niveles,
      hallazgos: normalizacion.hallazgos.map(({ nivel, estado, entidadId, titulo, explicacion, preguntas, contrapartidas }) => ({ nivel, estado, entidadId, titulo, explicacion, preguntas, contrapartidas }))
    } } : null,
    advertencias: [
      ...hallazgos.filter(h => h.severidad === 'error').map(h => ({ codigo: h.codigo, mensaje: h.mensaje, elementos: h.elementos })),
      ...(contexto?.advertencias ?? []).map(mensaje => ({ codigo: 'alcance-exportacion', mensaje, elementos: [] }))
    ]
  }
  // Romper referencias con el estado de React y con los argumentos del llamador.
  return structuredClone(resultado)
}
export type InstantaneaExportacion = ReturnType<typeof crearInstantanea>
