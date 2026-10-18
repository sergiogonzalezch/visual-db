export type ProveedorTipo = 'ollama' | 'openai'

export interface ConfigProveedor {
  proveedor: ProveedorTipo
  endpoint: string
  modelo: string
  claveApiEstablecida: boolean
}

export interface Configuracion {
  soloLocal: boolean
  proveedor: ConfigProveedor
  ultimoProyecto: { ruta: string | null; id: string } | null
}

export interface CapacidadesProveedor {
  vision: boolean | 'no-verificable'
  estructurado: boolean
  cancelacion: boolean
  conversacionProgresiva: boolean
}

export interface ResultadoPruebaConexion {
  ok: boolean
  detalle: string
  capacidades: CapacidadesProveedor | null
  modelos: string[]
}

export interface ElementoRef {
  tipo: 'entidad' | 'atributo' | 'relacion' | 'regla' | 'nota' | 'propuesta'
  id: string
}

export interface MensajeChat {
  rol: 'usuario' | 'asistente' | 'sistema'
  contenido: string
  referencias?: ElementoRef[]
  propuestaId?: string
  fecha: string
}

export interface PropuestaEntradaIA {
  titulo: string
  categoria: 'normalizacion' | 'integridad' | 'modelado' | 'ambiguedad' | 'otro'
  prioridad: 'alta' | 'media' | 'baja'
  explicacion: string
  fundamento: string
  supuestos: string[]
  preguntas: string[]
  operaciones: unknown[]
  resultado: string
  contrapartidas: string[]
  dependeDe: string[]
}

export interface RespuestaRevisionIA {
  resumen: string
  propuestas: PropuestaEntradaIA[]
}

export interface SolicitudRevision {
  proyecto: unknown
  historialResumen: string
  contexto?: { seleccion?: ElementoRef[]; pregunta?: string }
}

export interface SolicitudChat {
  mensajes: { rol: 'usuario' | 'asistente' | 'sistema'; contenido: string }[]
  proyecto: unknown
  propuestaContexto?: unknown
  contextoSeleccion?: ElementoRef[]
}

export interface RespuestaChatIA {
  contenido: string
  propuestas: PropuestaEntradaIA[]
}

export interface BorradorImportacionIA {
  entidades: unknown[]
  relaciones: unknown[]
  reglas: unknown[]
  ambiguedades: unknown[]
  resumen: string
}

export type CanalPrincipal =
  | 'proyecto:nuevo'
  | 'proyecto:abrir'
  | 'proyecto:guardar'
  | 'proyecto:guardar-como'
  | 'proyecto:ruta-actual'
  | 'recuperacion:info'
  | 'recuperacion:restaurar'
  | 'ajustes:obtener'
  | 'ajustes:guardar'
  | 'ia:probar-conexion'
  | 'ia:revisar'
  | 'ia:chat'
  | 'ia:interpretar-imagen'
  | 'ia:interpretar-texto'
  | 'importar:drawio'
  | 'diagnostico:log'
