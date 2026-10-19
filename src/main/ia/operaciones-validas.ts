/** Valida el contrato de operaciones antes de cruzar IPC. No corrige ni recorta
 * una respuesta del modelo: la propuesta conserva su significado o se rechaza. */
type Objeto = Record<string, unknown>
const objeto = (v: unknown): v is Objeto => !!v && typeof v === 'object' && !Array.isArray(v)
const texto = (v: unknown): v is string => typeof v === 'string'
const id = (v: unknown) => texto(v) && v.trim().length > 0
const nullable = (v: unknown) => v === null || texto(v)
const numero = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const ids = (v: unknown) => Array.isArray(v) && v.every(id) && new Set(v).size === v.length
const booleano = (v: unknown) => typeof v === 'boolean' || v === 'desconocido'
type Esquema = Record<string, (v: unknown) => boolean>
function campos(v: unknown, esquema: Esquema, parcial = false): boolean {
  return objeto(v) && Object.keys(v).every(k => Object.hasOwn(esquema, k) && esquema[k](v[k])) &&
    (parcial || Object.keys(esquema).every(k => Object.hasOwn(v, k)))
}
const atributo: Esquema = { id, nombre: texto, descripcion: nullable, tipoDato: texto, nulable: booleano, unico: booleano, multivalorado: booleano }
const foranea = (v: unknown) => v === null || campos(v, { entidadDestinoId: id, claveDestinoIds: ids, relacionId: v => v === null || id(v) })
const clave: Esquema = { id, nombre: texto, tipo: v => ['primaria', 'candidata', 'foranea'].includes(String(v)), atributoIds: ids, foranea }
const extremo = (v: unknown) => campos(v, { entidadId: id,
  cardinalidad: v => campos(v, { minimo: v => [0, 1, 'desconocido'].includes(v as string | number), maximo: v => [1, 'n', 'desconocido'].includes(v as string | number) }),
  participacion: v => ['total', 'parcial', 'desconocido'].includes(String(v)) })
const geometria: Esquema = { x: numero, y: numero, ancho: numero, alto: numero }
const entidad: Esquema = { id, nombre: texto, descripcion: nullable, ...geometria,
  atributos: v => Array.isArray(v) && v.every(a => campos(a, atributo)), claves: v => Array.isArray(v) && v.every(c => campos(c, clave)) }
const relacion: Esquema = { id, nombre: nullable, inicio: extremo, fin: extremo, atributos: v => Array.isArray(v) && v.every(a => campos(a, atributo)) }
const nota: Esquema = { id, texto, ...geometria }
const regla: Esquema = { id, texto, tipo: v => ['negocio', 'dependencia', 'supuesto'].includes(String(v)), fragmentoOrigen: nullable,
  dependencia: v => v === null || campos(v, { entidadId: id, determinanteIds: ids, dependientesIds: ids }) }
const sinId = ({ id: _id, ...resto }: Esquema): Esquema => resto
const parche = (esquema: Esquema) => (v: unknown) => campos(v, esquema, true)
const contrato: Record<string, Esquema> = {
  addEntidad: { entidad: v => campos(v, entidad) }, updateEntidad: { id, parche: parche({ nombre: texto, descripcion: nullable }) },
  moverEntidad: { id, x: numero, y: numero }, redimensionarEntidad: { id, ancho: numero, alto: numero }, removeEntidad: { id },
  addAtributo: { entidadId: id, atributo: v => campos(v, atributo) }, updateAtributo: { entidadId: id, id, parche: parche(sinId(atributo)) }, removeAtributo: { entidadId: id, id },
  addClave: { entidadId: id, clave: v => campos(v, clave) }, updateClave: { entidadId: id, id, parche: parche(sinId(clave)) }, removeClave: { entidadId: id, id },
  addRelacion: { relacion: v => campos(v, relacion) }, updateRelacion: { id, parche: parche({ nombre: nullable, inicio: extremo, fin: extremo }) }, removeRelacion: { id },
  addAtributoRelacion: { relacionId: id, atributo: v => campos(v, atributo) }, updateAtributoRelacion: { relacionId: id, id, parche: parche(sinId(atributo)) }, removeAtributoRelacion: { relacionId: id, id },
  addNota: { nota: v => campos(v, nota) }, updateNota: { id, parche: parche(sinId(nota)) }, removeNota: { id },
  addRegla: { regla: v => campos(v, regla) }, updateRegla: { id, parche: parche(sinId(regla)) }, removeRegla: { id }
}

export function operacionIAValida(v: unknown): boolean {
  if (!objeto(v) || !texto(v.op) || !Object.hasOwn(contrato, v.op)) return false
  return campos(v, { op: texto, ...contrato[v.op] })
}
