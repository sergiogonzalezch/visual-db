import { EJEMPLOS_OPERACIONES, OPERACIONES_REVISION } from './contrato-revision'
import {
  BorradorImportacionIA,
  CapacidadesProveedor,
  ConfigProveedor,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResultadoPruebaConexion,
  SolicitudChat,
  SolicitudRevision
} from '@shared/ai'

export interface AdaptadorProveedor {
  nombre: string
  probarConexion(config: ConfigProveedor, claveApi: string | null): Promise<ResultadoPruebaConexion>
  revisar(
    solicitud: SolicitudRevision,
    config: ConfigProveedor,
    claveApi: string | null,
    signal: AbortSignal
  ): Promise<RespuestaRevisionIA>
  chatear(
    solicitud: SolicitudChat,
    config: ConfigProveedor,
    claveApi: string | null,
    signal: AbortSignal
  ): Promise<RespuestaChatIA>
  interpretarImagen(
    imagenBase64: string,
    mime: string,
    config: ConfigProveedor,
    claveApi: string | null,
    signal: AbortSignal
  ): Promise<BorradorImportacionIA>
  interpretarTexto(
    texto: string,
    nombreArchivo: string,
    config: ConfigProveedor,
    claveApi: string | null,
    signal: AbortSignal
  ): Promise<BorradorImportacionIA>
  capacidades(config: ConfigProveedor): CapacidadesProveedor
}

export function capacidadesPorDefecto(
  parcial: Partial<CapacidadesProveedor> = {}
): CapacidadesProveedor {
  return {
    vision: 'no-verificable',
    estructurado: true,
    cancelacion: true,
    conversacionProgresiva: false,
    ...parcial
  }
}

export type MensajeProveedor = { role: 'system' | 'user' | 'assistant'; content: unknown }

export function aMensajesProveedor(
  mensajes: { rol: 'usuario' | 'asistente' | 'sistema'; contenido: string }[]
): MensajeProveedor[] {
  return mensajes.map((m) => ({
    role: m.rol === 'usuario' ? 'user' : m.rol === 'asistente' ? 'assistant' : 'system',
    content: m.contenido
  }))
}

export const SISTEMA_REVISION = `Eres un asistente de revisión de modelos de bases de datos relacionales.
Recibirás el modelo lógico actual (entidades, atributos, claves, relaciones, reglas de negocio, dependencias funcionales declaradas e información desconocida).
Devolverás ÚNICAMENTE JSON válido con esta forma:
{"resumen": string, "propuestas": [{"titulo": string, "categoria": "normalizacion"|"integridad"|"modelado"|"ambiguedad"|"otro", "prioridad": "alta"|"media"|"baja", "explicacion": string, "fundamento": string, "supuestos": string[], "preguntas": string[], "operaciones": [], "resultado": string, "contrapartidas": string[], "dependeDe": string[]}]}
Cada elemento de operaciones debe ser un OBJETO JSON con discriminante "op", nunca una cadena, pseudocódigo ni una llamada a función.
Catálogo cerrado de op: ${OPERACIONES_REVISION.join(', ')}.
Ejemplos sintácticos válidos (sustituye los IDs por IDs reales del contexto; no son cambios que debas proponer):
${JSON.stringify(EJEMPLOS_OPERACIONES)}
Para updateEntidad usa id y parche con nombre/descripcion; moverEntidad usa id,x,y; redimensionarEntidad usa id,ancho,alto.
Para updateAtributo/removeAtributo/updateClave/removeClave incluye entidadId e id. update usa parche con solo los campos a cambiar.
Para addEntidad/addAtributo/addClave/addRelacion/addNota/addRegla incluye respectivamente entidad/atributo/clave/relacion/nota/regla como objeto completo de la misma forma que en el modelo recibido. addAtributo/addClave también requiere entidadId.
Para atributos de relación incluye relacionId; addAtributoRelacion requiere atributo, updateAtributoRelacion requiere id y parche, removeAtributoRelacion requiere id.
Las otras bajas usan id; updateRelacion/updateNota/updateRegla usan id y parche. No añadas campos ajenos a la operación.
Los booleanos son true, false o "desconocido", nunca "verdadero" ni "falso". Los enums son exactamente los indicados, sin acentos añadidos.
En cada extremo de relación: participacion solo admite "total", "parcial" o "desconocido" (nunca "obligatoria"/"opcional"); cardinalidad.minimo admite 0,1,"desconocido" y maximo admite 1,"n","desconocido". Conserva entidadId al actualizar un extremo completo.
Las claves usan tipo "primaria", "candidata" o "foranea" y atributoIds como lista de IDs de atributos. foranea es null o un objeto con entidadDestinoId, claveDestinoIds (IDs de claves del destino) y relacionId (ID o null).
Una pregunta sobre un tipo, obligatoriedad, unicidad o cardinalidad aún no confirmados debe llevar operaciones: []; no incluyas la restricción como cambio mientras la preguntas.
Si falta evidencia, devuelve preguntas y operaciones: []. Es válido devolver {"resumen":"Información insuficiente", "propuestas":[]}.
Sé conciso: prioriza hasta tres propuestas relevantes, sin repetir el esquema ni listar todas las operaciones disponibles.
Usa ids nuevos con prefijos "nuevas-" cuando crees elementos; referencias a existentes deben usar sus ids reales.
NO inventes información no observada: separa hechos de supuestos y deja preguntas cuando falte evidencia.
No afirmes que una entidad cumple 3FN o BCNF sin dependencias y claves suficientes para demostrarlo; indica información insuficiente. No conviertas supuestos en restricciones obligatorias: si una regla no está confirmada, plantea una pregunta sin operaciones.
Una aclaración sin cambios debe tener operaciones: []. Reutiliza únicamente IDs existentes o creados dentro de la misma propuesta y no dupliques reglas ya declaradas.
dependeDe contiene solo IDs de propuestas existentes facilitadas explícitamente en el contexto, nunca IDs de reglas, entidades ni atributos. Si no recibes propuestas existentes, usa dependeDe: [].
La unicidad no implica obligatoriedad. Un precio histórico de línea de pedido no debe sustituirse por el precio actual del producto si las reglas lo preservan. Respeta las reglas explícitas antes de formular preguntas que ya están contestadas.
Nunca generes SQL, DDL ni código.`

export const SISTEMA_CHAT = `Eres el asistente de un editor visual de modelos de bases de datos.
Respondes en español, con claridad, sin generar SQL ni código.
Puedes proponer cambios describiéndolos; solo se aplican si el usuario los aprueba en la aplicación.
Cuando propongas cambios, devuelve también un objeto JSON dentro de una etiqueta <propuestas>...</propuestas> con el mismo formato de propuesta del revisor (titulo, categoria, prioridad, explicacion, fundamento, supuestos, preguntas, operaciones, resultado, contrapartidas, dependeDe).`

export function esJsonBloque(texto: string): boolean {
  const limpio = texto.trim()
  return limpio.startsWith('{') && limpio.endsWith('}')
}

export function extraerJson(texto: string): string | null {
  const limpio = texto.trim()
  if (esJsonBloque(limpio)) return limpio
  const inicio = limpio.indexOf('{')
  const fin = limpio.lastIndexOf('}')
  if (inicio >= 0 && fin > inicio) return limpio.slice(inicio, fin + 1)
  const etiqueta = limpio.match(/<propuestas>([\s\S]*?)<\/propuestas>/)
  if (etiqueta) return etiqueta[1].trim()
  return null
}

export function normalizarRevision(texto: string): RespuestaRevisionIA {
  const json = extraerJson(texto)
  if (!json) throw new Error('La respuesta no contiene JSON de revisión.')
  let datos: Partial<RespuestaRevisionIA> | null
  try { datos = JSON.parse(json) } catch { throw new Error('JSON de revisión inválido. El modelo devolvió un formato incompleto; reintenta o elige otro modelo.') }
  if (!datos || typeof datos !== 'object' || !Array.isArray(datos.propuestas)) {
    throw new Error('JSON inválido: falta la lista de propuestas de revisión.')
  }
  for (const p of datos.propuestas) {
    if (!p || typeof p !== 'object' ||
      !['titulo', 'explicacion', 'fundamento', 'resultado'].every(k => typeof p[k as keyof typeof p] === 'string') ||
      !['supuestos', 'preguntas', 'contrapartidas', 'dependeDe'].every(k => {
        const lista = p[k as keyof typeof p]
        return Array.isArray(lista) && lista.every(v => typeof v === 'string')
      }) || !Array.isArray(p.operaciones) ||
      !['normalizacion', 'integridad', 'modelado', 'ambiguedad', 'otro'].includes(p.categoria) ||
      !['alta', 'media', 'baja'].includes(p.prioridad)) {
      throw new Error('JSON inválido: propuesta incompleta. No se incorporó la revisión; reintenta o elige otro modelo.')
    }
  }
  return {
    resumen: typeof datos.resumen === 'string' ? datos.resumen : '',
    propuestas: datos.propuestas
  }
}

export function normalizarBorrador(texto: string): BorradorImportacionIA {
  const json = extraerJson(texto)
  if (!json) throw new Error('La respuesta no contiene JSON.')
  const datos = JSON.parse(json) as Partial<BorradorImportacionIA>
  return {
    resumen: typeof datos.resumen === 'string' ? datos.resumen : '',
    entidades: Array.isArray(datos.entidades) ? datos.entidades : [],
    relaciones: Array.isArray(datos.relaciones) ? datos.relaciones : [],
    reglas: Array.isArray(datos.reglas) ? datos.reglas : [],
    ambiguedades: Array.isArray(datos.ambiguedades) ? datos.ambiguedades : []
  }
}
