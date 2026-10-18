export type ProveedorTipo =
  | 'ollama'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'xai'
  | 'openrouter'
  | 'personalizado'

export interface ProveedorRemoto {
  tipo: ProveedorTipo
  etiqueta: string
  endpoint: string
  modelo: string
  jsonEstructurado: boolean
  clavePlaceholder: string
  nota: string | null
}

export const PROVEEDORES_REMOTOS: ProveedorRemoto[] = [
  {
    tipo: 'openai',
    etiqueta: 'OpenAI (GPT)',
    endpoint: 'https://api.openai.com/v1',
    modelo: 'gpt-4o-mini',
    jsonEstructurado: true,
    clavePlaceholder: 'sk-…',
    nota: null
  },
  {
    tipo: 'anthropic',
    etiqueta: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1',
    modelo: 'claude-sonnet-4-5',
    jsonEstructurado: false,
    clavePlaceholder: 'sk-ant-…',
    nota: 'Se usa la capa de compatibilidad con OpenAI de Anthropic; el JSON de revisión se interpreta sin respuesta estructurada.'
  },
  {
    tipo: 'gemini',
    etiqueta: 'Google (Gemini)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelo: 'gemini-2.5-flash',
    jsonEstructurado: true,
    clavePlaceholder: 'AIza…',
    nota: 'Se usa el endpoint compatible con OpenAI de la API de Gemini.'
  },
  {
    tipo: 'xai',
    etiqueta: 'xAI (Grok)',
    endpoint: 'https://api.x.ai/v1',
    modelo: 'grok-4',
    jsonEstructurado: true,
    clavePlaceholder: 'xai-…',
    nota: null
  },
  {
    tipo: 'openrouter',
    etiqueta: 'OpenRouter (agregador)',
    endpoint: 'https://openrouter.ai/api/v1',
    modelo: 'openai/gpt-4o-mini',
    jsonEstructurado: true,
    clavePlaceholder: 'sk-or-…',
    nota: 'Accede a cientos de modelos de distintos proveedores mediante una sola clave.'
  },
  {
    tipo: 'personalizado',
    etiqueta: 'Otra API compatible con OpenAI',
    endpoint: '',
    modelo: '',
    jsonEstructurado: true,
    clavePlaceholder: 'Clave del proveedor',
    nota: 'Cualquier servicio que exponga /chat/completions con formato OpenAI (LM Studio, vLLM, LiteLLM, DeepSeek, Mistral, Groq, Together…).'
  }
]

export function proveedorRemoto(tipo: ProveedorTipo): ProveedorRemoto | null {
  return PROVEEDORES_REMOTOS.find((p) => p.tipo === tipo) ?? null
}

export function soportaJsonEstructurado(tipo: ProveedorTipo): boolean {
  return proveedorRemoto(tipo)?.jsonEstructurado ?? true
}

export interface ConfigProveedor {
  proveedor: ProveedorTipo
  endpoint: string
  modelo: string
  claveApiEstablecida: boolean
}

export interface Configuracion {
  soloLocal: boolean
  proveedor: ConfigProveedor
  limiteDiarioTokens: number | null
  ultimoProyecto: { ruta: string | null; id: string } | null
}

export type OperacionConsumo = 'revision' | 'chat' | 'imagen' | 'texto'

export interface RegistroConsumo {
  fecha: string
  proveedor: string
  modelo: string
  operacion: OperacionConsumo
  entrada: number
  salida: number
  estimado: boolean
}

export interface ConsumoDia {
  fecha: string
  proveedor: string
  modelo: string
  peticiones: number
  entrada: number
  salida: number
  estimado: boolean
}

export interface ResumenConsumo {
  hoy: { fecha: string; peticiones: number; entrada: number; salida: number; total: number }
  limiteDiario: number | null
  restanteHoy: number | null
  dias: ConsumoDia[]
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
  | 'ia:consumo'
  | 'ia:consumo-limpiar'
  | 'importar:drawio'
  | 'diagnostico:log'
