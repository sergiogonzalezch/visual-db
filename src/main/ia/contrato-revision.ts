/** Contrato enviado al modelo. La validación local sigue siendo obligatoria. */
type Esquema = Record<string, unknown>
const texto = { type: 'string' }
const numero = { type: 'number' }
const nullable = { type: ['string', 'null'] }
const lista = (items: Esquema): Esquema => ({ type: 'array', items })
const opciones = (...valores: (string | number | boolean)[]): Esquema => ({ enum: valores })
const objeto = (properties: Record<string, Esquema>, parcial = false): Esquema => ({ type: 'object', properties, required: parcial ? [] : Object.keys(properties), additionalProperties: false })
const ids = lista(texto)
const atributo = { id: texto, nombre: texto, descripcion: nullable, tipoDato: texto, nulable: opciones(true, false, 'desconocido'), unico: opciones(true, false, 'desconocido'), multivalorado: opciones(true, false, 'desconocido') }
const geometria = { x: numero, y: numero, ancho: numero, alto: numero }
const clave = { id: texto, nombre: texto, tipo: opciones('primaria', 'candidata', 'foranea'), atributoIds: ids, foranea: { anyOf: [{ type: 'null' }, objeto({ entidadDestinoId: texto, claveDestinoIds: ids, relacionId: nullable })] } }
const extremo = objeto({ entidadId: texto, cardinalidad: objeto({ minimo: opciones(0, 1, 'desconocido'), maximo: opciones(1, 'n', 'desconocido') }), participacion: opciones('total', 'parcial', 'desconocido') })
const relacion = { id: texto, nombre: nullable, inicio: extremo, fin: extremo, atributos: lista(objeto(atributo)) }
const entidad = { id: texto, nombre: texto, descripcion: nullable, ...geometria, atributos: lista(objeto(atributo)), claves: lista(objeto(clave)) }
const nota = { id: texto, texto, ...geometria }
const regla = { id: texto, texto, tipo: opciones('negocio', 'dependencia', 'supuesto'), fragmentoOrigen: nullable, dependencia: { anyOf: [{ type: 'null' }, objeto({ entidadId: texto, determinanteIds: ids, dependientesIds: ids })] } }
const sinId = ({ id: _id, ...campos }: Record<string, Esquema>) => campos
const parche = (campos: Record<string, Esquema>) => objeto(campos, true)
const contratos: Record<string, Record<string, Esquema>> = {
  addEntidad: { entidad: objeto(entidad) }, updateEntidad: { id: texto, parche: parche({ nombre: texto, descripcion: nullable }) },
  moverEntidad: { id: texto, x: numero, y: numero }, redimensionarEntidad: { id: texto, ancho: numero, alto: numero }, removeEntidad: { id: texto },
  addAtributo: { entidadId: texto, atributo: objeto(atributo) }, updateAtributo: { entidadId: texto, id: texto, parche: parche(sinId(atributo)) }, removeAtributo: { entidadId: texto, id: texto },
  addClave: { entidadId: texto, clave: objeto(clave) }, updateClave: { entidadId: texto, id: texto, parche: parche(sinId(clave)) }, removeClave: { entidadId: texto, id: texto },
  addRelacion: { relacion: objeto(relacion) }, updateRelacion: { id: texto, parche: parche({ nombre: nullable, inicio: extremo, fin: extremo }) }, removeRelacion: { id: texto },
  addAtributoRelacion: { relacionId: texto, atributo: objeto(atributo) }, updateAtributoRelacion: { relacionId: texto, id: texto, parche: parche(sinId(atributo)) }, removeAtributoRelacion: { relacionId: texto, id: texto },
  addNota: { nota: objeto(nota) }, updateNota: { id: texto, parche: parche(sinId(nota)) }, removeNota: { id: texto },
  addRegla: { regla: objeto(regla) }, updateRegla: { id: texto, parche: parche(sinId(regla)) }, removeRegla: { id: texto }
}
export const OPERACIONES_REVISION = Object.keys(contratos)
export const ESQUEMA_REVISION = objeto({ resumen: texto, propuestas: { ...lista(objeto({
  titulo: texto, categoria: opciones('normalizacion', 'integridad', 'modelado', 'ambiguedad', 'otro'), prioridad: opciones('alta', 'media', 'baja'),
  explicacion: texto, fundamento: texto, supuestos: ids, preguntas: ids,
  operaciones: lista({ anyOf: Object.entries(contratos).map(([op, campos]) => objeto({ op: { const: op }, ...campos })) }),
  resultado: texto, contrapartidas: ids, dependeDe: ids
})), maxItems: 3 } })

/** Ejemplos sintácticos, nunca instrucciones para imponer restricciones. */
export const EJEMPLOS_OPERACIONES = [
  { op: 'updateEntidad', id: 'ID_EXISTENTE', parche: { descripcion: 'Descripción confirmada' } },
  { op: 'updateAtributo', entidadId: 'ID_ENTIDAD_EXISTENTE', id: 'ID_ATRIBUTO_EXISTENTE', parche: { tipoDato: 'texto', nulable: false, unico: true, multivalorado: false } },
  { op: 'addClave', entidadId: 'ID_ENTIDAD_EXISTENTE', clave: { id: 'nuevas-clave', nombre: 'Clave confirmada', tipo: 'candidata', atributoIds: ['ID_ATRIBUTO_EXISTENTE'], foranea: null } }
]
