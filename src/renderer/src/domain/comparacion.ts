import { Proyecto } from './modelo'
import { aplicarOperaciones } from './operaciones'
import { comprobarPropuesta, Propuesta } from './propuestas'

export function proyectarPropuesta(proyecto: Proyecto, propuesta?: Propuesta) {
  if (!propuesta || propuesta.estado !== 'pendiente' || !propuesta.operaciones.length) {
    return { estado: null, error: 'Selecciona una propuesta pendiente con cambios para comparar.' }
  }
  const comprobacion = comprobarPropuesta(proyecto, propuesta)
  if (!comprobacion.aplicable) return { estado: null, error: comprobacion.motivos.join(' ') }
  try {
    return { estado: aplicarOperaciones({ diseno: proyecto.diseno, reglas: proyecto.reglas }, propuesta.operaciones), error: null }
  } catch (error) {
    return { estado: null, error: `No se puede previsualizar: ${(error as Error).message}` }
  }
}

export interface Diferencia { campo: string; antes: string; despues: string }
const etiquetas: Record<string, string> = {
  diseno: 'Diseño', entidades: 'Entidades', atributos: 'Atributos', relaciones: 'Relaciones',
  reglas: 'Reglas', notas: 'Notas', claves: 'Claves', nombre: 'Nombre', texto: 'Texto',
  nulable: 'Permite nulos', unico: 'Único', multivalorado: 'Multivalorado', tipoDato: 'Tipo de dato',
  descripcion: 'Descripción', dependencia: 'Dependencia', determinantes: 'Determinantes',
  dependientes: 'Dependientes', entidadId: 'Entidad', atributoIds: 'Atributos de la clave', determinanteIds: 'Determinantes', dependientesIds: 'Dependientes', claveDestinoIds: 'Clave destino', entidadDestinoId: 'Entidad destino', inicio: 'Inicio', fin: 'Fin', cardinalidad: 'Cardinalidad'
}

// Compara también reglas y restricciones que no producen cambios en el gráfico.
export function diferencias(antes: unknown, despues: unknown, ruta = ''): Diferencia[] {
  if (JSON.stringify(antes) === JSON.stringify(despues)) return []
  if (Array.isArray(antes) && Array.isArray(despues) && [...antes, ...despues].every(v => v && typeof v === 'object' && 'id' in v)) {
    const ids = new Set([...antes, ...despues].map(v => v.id))
    return [...ids].flatMap(id => {
      const a = antes.find(v => v.id === id), d = despues.find(v => v.id === id)
      const nombre = d?.nombre || a?.nombre || d?.texto || a?.texto || 'Elemento'
      return diferencias(a, d, `${ruta} / ${nombre}`)
    })
  }
  if (antes === undefined && despues && typeof despues === 'object' && !Array.isArray(despues)) {
    return Object.entries(despues).filter(([k]) => k !== 'id').flatMap(([k, v]) => diferencias(undefined, v, `${ruta} / ${etiquetas[k] ?? k}`))
  }
  if (despues === undefined && antes && typeof antes === 'object' && !Array.isArray(antes)) {
    return Object.entries(antes).filter(([k]) => k !== 'id').flatMap(([k, v]) => diferencias(v, undefined, `${ruta} / ${etiquetas[k] ?? k}`))
  }
  if (antes && despues && !Array.isArray(antes) && !Array.isArray(despues) && typeof antes === 'object' && typeof despues === 'object') {
    const a = antes as Record<string, unknown>, d = despues as Record<string, unknown>
    return [...new Set([...Object.keys(a), ...Object.keys(d)])].filter(k => k !== 'id').flatMap(k => diferencias(a[k], d[k], `${ruta}${ruta ? ' / ' : ''}${etiquetas[k] ?? k}`))
  }
  const valor = (v: unknown): string => v === undefined ? 'No existe' : v === true ? 'Sí' : v === false ? 'No' : typeof v === 'object' ? JSON.stringify(v) : String(v ?? 'Sin valor')
  return [{ campo: ruta, antes: valor(antes), despues: valor(despues) }]
}
