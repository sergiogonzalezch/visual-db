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
Las operaciones pertenecen a un catálogo cerrado; usa exactamente estos op:
addEntidad{entidad}, updateEntidad{id,parche{nombre,descripcion}}, moverEntidad{id,x,y}, removeEntidad{id},
addAtributo{entidadId,atributo}, updateAtributo{entidadId,id,parche{nombre,descripcion,tipoDato,nulable,unico,multivalorado}}, removeAtributo{entidadId,id},
addClave{entidadId,clave{id,nombre,tipo:"primaria"|"candidata"|"foranea",atributoIds,foranea}}, updateClave{entidadId,id,parche}, removeClave{entidadId,id},
addRelacion{relacion{id,nombre,inicio:{entidadId,cardinalidad:{minimo:0|1|"desconocido",maximo:1|"n"|"desconocido"},participacion:"total"|"parcial"|"desconocido"},fin:{...},atributos:[]}},
updateRelacion{id,parche{nombre,inicio,fin}}, removeRelacion{id}, addNota{nota{id,texto,x,y,ancho,alto}}, removeNota{id},
addRegla{regla{id,tipo:"negocio"|"dependencia"|"supuesto",texto,dependencia:null|{entidadId,determinanteIds,dependientesIds},fragmentoOrigen}}, updateRegla{id,parche}, removeRegla{id}
Usa ids nuevos con prefijos "nuevas-" cuando crees elementos; referencias a existentes deben usar sus ids reales.
NO inventes información no observada: separa hechos de supuestos y deja preguntas cuando falte evidencia.
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
