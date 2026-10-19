import { crearAtributo, nuevoId, type Entidad } from './modelo'
import type { Operacion } from './operaciones'

/** Construye un mapeo completo; nunca guarda una FK vacía. */
export function crearForanea(origen: Entidad, destino: Entidad, claveId?: string, relacionId: string | null = null): Operacion[] {
  const clave = destino.claves.find(c => claveId ? c.id === claveId && c.tipo !== 'foranea' : c.tipo === 'primaria')
  if (!clave?.atributoIds.length) throw new Error('La entidad destino necesita una clave primaria o candidata completa.')
  const operaciones: Operacion[] = []
  const atributos = clave.atributoIds.map(id => {
    const referencia = destino.atributos.find(a => a.id === id)
    if (!referencia) throw new Error('La clave destino contiene atributos inexistentes.')
    const nombre = origen.id === destino.id ? `${destino.nombre}_${referencia.nombre}` : referencia.nombre
    const existente = origen.atributos.find(a => a.nombre.toLowerCase() === nombre.toLowerCase())
    if (existente) {
      if (existente.tipoDato !== 'desconocido' && referencia.tipoDato !== 'desconocido' && existente.tipoDato !== referencia.tipoDato) throw new Error(`El tipo de «${nombre}» no coincide con la clave destino.`)
      return existente.id
    }
    const atributo = { ...crearAtributo(nombre), tipoDato: referencia.tipoDato }
    operaciones.push({ op: 'addAtributo', entidadId: origen.id, atributo })
    return atributo.id
  })
  if (origen.claves.some(c => c.tipo === 'foranea' && c.foranea?.entidadDestinoId === destino.id && c.foranea.claveDestinoIds.includes(clave.id) && c.atributoIds.join() === atributos.join())) throw new Error('Esta clave foránea ya existe.')
  operaciones.push({ op: 'addClave', entidadId: origen.id, clave: {
    id: nuevoId('k'), nombre: `fk_${destino.nombre.toLowerCase()}`, tipo: 'foranea', atributoIds: atributos,
    foranea: { entidadDestinoId: destino.id, claveDestinoIds: [clave.id], relacionId }
  } })
  return operaciones
}
