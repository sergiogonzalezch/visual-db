import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  BorradorImportacionIA,
  Configuracion,
  ConfigProveedor,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResultadoPruebaConexion,
  SolicitudChat,
  SolicitudRevision
} from '@shared/ai'
import { AdaptadorProveedor } from './adaptador'
import { adaptadorOllama } from './ollama'
import { adaptadorOpenAI } from './openai'
import { hayClaveApi, obtenerClaveApi, guardarClaveApi } from '../almacen-credenciales'

const CONFIG_DEFECTO: Configuracion = {
  soloLocal: true,
  proveedor: {
    proveedor: 'ollama',
    endpoint: 'http://127.0.0.1:11434',
    modelo: '',
    claveApiEstablecida: false
  },
  ultimoProyecto: null
}

function rutaConfig(): string {
  const dir = join(app.getPath('userData'), 'ajustes')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'configuracion.json')
}

export function cargarConfiguracion(): Configuracion {
  try {
    if (!existsSync(rutaConfig())) return structuredClone(CONFIG_DEFECTO)
    const guardada = JSON.parse(readFileSync(rutaConfig(), 'utf-8')) as Partial<Configuracion>
    return {
      soloLocal: guardada.soloLocal ?? true,
      proveedor: { ...CONFIG_DEFECTO.proveedor, ...guardada.proveedor },
      ultimoProyecto: guardada.ultimoProyecto ?? null
    }
  } catch {
    return structuredClone(CONFIG_DEFECTO)
  }
}

export function guardarConfiguracion(config: Configuracion, claveNueva: string | null): Configuracion {
  const paraGuardar: Configuracion = {
    soloLocal: config.soloLocal,
    proveedor: {
      proveedor: config.proveedor.proveedor,
      endpoint: config.proveedor.endpoint,
      modelo: config.proveedor.modelo,
      claveApiEstablecida: false
    },
    ultimoProyecto: config.ultimoProyecto ?? null
  }
  if (claveNueva !== null) {
    guardarClaveApi(config.proveedor.proveedor, claveNueva)
  }
  paraGuardar.proveedor.claveApiEstablecida = hayClaveApi(config.proveedor.proveedor)
  writeFileSync(rutaConfig(), JSON.stringify(paraGuardar, null, 2))
  return paraGuardar
}

function adaptadorDe(config: ConfigProveedor): AdaptadorProveedor {
  return config.proveedor === 'ollama' ? adaptadorOllama : adaptadorOpenAI
}

class ErrorProveedoria extends Error {
  constructor(mensaje: string, readonly codigo: 'solo-local' | 'sin-modelo' | 'proveedor') {
    super(mensaje)
  }
}

function exigirProveeduria(config: Configuracion): { adaptador: AdaptadorProveedor; clave: string | null } {
  if (config.soloLocal) {
    throw new ErrorProveedoria(
      'La aplicación está en modo Solo local: se bloquean las conexiones remotas. Desactívalo en Modelo → Configuración para usar un proveedor.',
      'solo-local'
    )
  }
  if (!config.proveedor.modelo) {
    throw new ErrorProveedoria('No hay un modelo configurado. Elige uno en Modelo → Configuración.', 'sin-modelo')
  }
  const clave = config.proveedor.proveedor === 'openai' ? obtenerClaveApi('openai') : null
  return { adaptador: adaptadorDe(config.proveedor), clave }
}

export async function probarConexion(config: Configuracion): Promise<ResultadoPruebaConexion> {
  if (config.soloLocal && config.proveedor.proveedor !== 'ollama') {
    return {
      ok: false,
      detalle:
        'En modo Solo local solo se permite probar Ollama en tu equipo. Las API remotas permanecen bloqueadas hasta desactivar el modo.',
      capacidades: null,
      modelos: []
    }
  }
  if (config.proveedor.proveedor === 'ollama') {
    return adaptadorOllama.probarConexion(config.proveedor, null)
  }
  return adaptadorOpenAI.probarConexion(config.proveedor, obtenerClaveApi('openai'))
}

const MAX_INTENTOS = 2

export async function revisar(
  config: Configuracion,
  solicitud: SolicitudRevision
): Promise<RespuestaRevisionIA> {
  const { adaptador, clave } = exigirProveeduria(config)
  let ultimoError: Error | null = null
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const signal = AbortSignal.timeout(180000)
    try {
      const respuesta = await adaptador.revisar(solicitud, config.proveedor, clave, signal)
      validarRespuestaRevision(respuesta)
      return respuesta
    } catch (error) {
      ultimoError = error as Error
      if (intento === 0 && ultimoError.message.includes('JSON')) {
        continue
      }
      break
    }
  }
  throw ultimoError ?? new Error('Fallo desconocido del proveedor.')
}

export async function chatear(config: Configuracion, solicitud: SolicitudChat): Promise<RespuestaChatIA> {
  const { adaptador, clave } = exigirProveeduria(config)
  const signal = AbortSignal.timeout(120000)
  return adaptador.chatear(solicitud, config.proveedor, clave, signal)
}

export async function interpretarImagen(
  config: Configuracion,
  imagenBase64: string,
  mime: string
): Promise<BorradorImportacionIA> {
  const { adaptador, clave } = exigirProveeduria(config)
  const capacidades = adaptador.capacidades(config.proveedor)
  if (capacidades.vision === false) {
    throw new Error(
      `El modelo «${config.proveedor.modelo}» no tiene capacidades de visión. Elige un modelo con visión local o remota, o importa draw.io / Markdown.`
    )
  }
  const signal = AbortSignal.timeout(180000)
  return adaptador.interpretarImagen(imagenBase64, mime, config.proveedor, clave, signal)
}

export async function interpretarTexto(
  config: Configuracion,
  texto: string,
  nombreArchivo: string
): Promise<BorradorImportacionIA> {
  const { adaptador, clave } = exigirProveeduria(config)
  const signal = AbortSignal.timeout(120000)
  return adaptador.interpretarTexto(texto, nombreArchivo, config.proveedor, clave, signal)
}

export function capacidadesActuales(config: Configuracion) {
  return adaptadorDe(config.proveedor).capacidades(config.proveedor)
}

const OPS_CONOCIDOS = new Set([
  'addEntidad',
  'updateEntidad',
  'moverEntidad',
  'redimensionarEntidad',
  'removeEntidad',
  'addAtributo',
  'updateAtributo',
  'removeAtributo',
  'addClave',
  'updateClave',
  'removeClave',
  'addRelacion',
  'updateRelacion',
  'removeRelacion',
  'addAtributoRelacion',
  'updateAtributoRelacion',
  'removeAtributoRelacion',
  'addNota',
  'updateNota',
  'removeNota',
  'addRegla',
  'updateRegla',
  'removeRegla'
])

export function filtrarOperacionesIA(operaciones: unknown): { validas: unknown[]; invalidas: number } {
  if (!Array.isArray(operaciones)) return { validas: [], invalidas: 0 }
  const validas: unknown[] = []
  let invalidas = 0
  for (const op of operaciones) {
    if (op && typeof op === 'object' && typeof (op as { op?: unknown }).op === 'string' && OPS_CONOCIDOS.has((op as { op: string }).op)) {
      validas.push(op)
    } else {
      invalidas++
    }
  }
  return { validas, invalidas }
}

function validarRespuestaRevision(respuesta: RespuestaRevisionIA): void {
  if (!Array.isArray(respuesta.propuestas)) {
    throw new Error('JSON inválido: falta la lista de propuestas.')
  }
  for (const propuesta of respuesta.propuestas) {
    if (typeof propuesta.titulo !== 'string' || !Array.isArray(propuesta.operaciones)) {
      throw new Error('JSON inválido: propuesta con forma incorrecta.')
    }
  }
}
