import {
  BorradorImportacionIA,
  CapacidadesProveedor,
  ConfigProveedor,
  OperacionConsumo,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResultadoPruebaConexion
} from '@shared/ai'
import {
  AdaptadorProveedor,
  MensajeProveedor,
  SISTEMA_CHAT,
  SISTEMA_REVISION,
  aMensajesProveedor,
  capacidadesPorDefecto,
  extraerJson
} from './adaptador'
import { estimarTokens, registrarConsumo } from './consumo'

function urlBase(config: ConfigProveedor): string {
  return config.endpoint.replace(/\/+$/, '')
}

async function chatOllama(
  config: ConfigProveedor,
  mensajes: MensajeProveedor[],
  opciones: { formatoJson: boolean; signal: AbortSignal; imagenes?: string[]; operacion: OperacionConsumo }
): Promise<string> {
  const mensajesFinal = opciones.imagenes
    ? mensajes.map((m, i) =>
        i === mensajes.length - 1 && m.role === 'user'
          ? { ...m, images: opciones.imagenes }
          : m
      )
    : mensajes
  const cuerpo: Record<string, unknown> = {
    model: config.modelo,
    messages: mensajesFinal,
    stream: false
  }
  if (opciones.formatoJson) cuerpo.format = 'json'
  const respuesta = await fetch(`${urlBase(config)}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    signal: opciones.signal
  })
  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => '')
    throw new Error(`Ollama respondió ${respuesta.status}: ${texto.slice(0, 200)}`)
  }
  const datos = (await respuesta.json()) as {
    message?: { content?: string }
    prompt_eval_count?: number
    eval_count?: number
  }
  const contenido = datos.message?.content ?? ''
  if (typeof datos.prompt_eval_count === 'number' || typeof datos.eval_count === 'number') {
    registrarConsumo({
      proveedor: 'ollama',
      modelo: config.modelo,
      operacion: opciones.operacion,
      entrada: datos.prompt_eval_count ?? 0,
      salida: datos.eval_count ?? 0,
      estimado: false
    })
  } else {
    registrarConsumo({
      proveedor: 'ollama',
      modelo: config.modelo,
      operacion: opciones.operacion,
      entrada: estimarTokens(JSON.stringify(mensajesFinal)),
      salida: estimarTokens(contenido),
      estimado: true
    })
  }
  return contenido
}

function normalizarRevision(texto: string): RespuestaRevisionIA {
  const json = extraerJson(texto)
  if (!json) throw new Error('La respuesta no contiene JSON de revisión.')
  const datos = JSON.parse(json) as Partial<RespuestaRevisionIA>
  return {
    resumen: typeof datos.resumen === 'string' ? datos.resumen : '',
    propuestas: Array.isArray(datos.propuestas) ? datos.propuestas : []
  }
}

export const adaptadorOllama: AdaptadorProveedor = {
  nombre: 'ollama',

  async probarConexion(config, _claveApi): Promise<ResultadoPruebaConexion> {
    try {
      const control = AbortSignal.timeout(8000)
      const respuesta = await fetch(`${urlBase(config)}/api/tags`, { signal: control })
      if (!respuesta.ok) {
        return { ok: false, detalle: `El servidor respondió ${respuesta.status}.`, capacidades: null, modelos: [] }
      }
      const datos = (await respuesta.json()) as { models?: { name: string }[] }
      const modelos = (datos.models ?? []).map((m) => m.name)
      const coincide = !config.modelo || modelos.some((m) => m === config.modelo || m.startsWith(`${config.modelo}:`))
      const capacidades: CapacidadesProveedor = capacidadesPorDefecto({
        estructurado: true,
        vision: 'no-verificable'
      })
      if (!coincide) {
        return {
          ok: false,
          detalle: `Conectado, pero el modelo «${config.modelo}» no está instalado en el servidor.`,
          capacidades,
          modelos
        }
      }
      return {
        ok: true,
        detalle: `Conectado a Ollama. ${modelos.length} modelo(s) disponible(s). La capacidad de visión del modelo no es verificable automáticamente.`,
        capacidades,
        modelos
      }
    } catch (error) {
      return {
        ok: false,
        detalle: `No se pudo contactar con Ollama en ${config.endpoint}: ${(error as Error).message}`,
        capacidades: null,
        modelos: []
      }
    }
  },

  async revisar(solicitud, config, _claveApi, signal): Promise<RespuestaRevisionIA> {
    const contenido = JSON.stringify(solicitud, null, 1)
    const texto = await chatOllama(
      config,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content: `Modelo y contexto:\n${contenido}\n\nDevuelve el JSON de la revisión.`
        }
      ],
      { formatoJson: true, signal, operacion: 'revision' }
    )
    return normalizarRevision(texto)
  },

  async chatear(solicitud, config, _claveApi, signal): Promise<RespuestaChatIA> {
    const texto = await chatOllama(
      config,
      [
        { role: 'system', content: SISTEMA_CHAT },
        ...aMensajesProveedor(solicitud.mensajes),
        {
          role: 'user',
          content: `Contexto del modelo actual:\n${JSON.stringify(solicitud.proyecto, null, 1)}${
            solicitud.propuestaContexto
              ? `\n\nPropuesta en discusión:\n${JSON.stringify(solicitud.propuestaContexto, null, 1)}`
              : ''
          }`
        }
      ],
      { formatoJson: false, signal, operacion: 'chat' }
    )
    return { contenido: texto, propuestas: [] }
  },

  async interpretarImagen(imagenBase64, _mime, config, _claveApi, signal): Promise<BorradorImportacionIA> {
    const texto = await chatOllama(
      config,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content:
            'Esta imagen es un diagrama entidad-relación. Extrae entidades, atributos, claves (PK/FK), relaciones y cardinalidades. ' +
            'Marca como ambigüedad todo lo que no puedas leer con certeza. Devuelve JSON con forma ' +
            '{"resumen":string,"entidades":[],"relaciones":[],"reglas":[],"ambiguedades":[]}. No inventes contenido ilegible.'
        }
      ],
      { formatoJson: true, signal, imagenes: [imagenBase64], operacion: 'imagen' }
    )
    const json = extraerJson(texto)
    if (!json) throw new Error('La respuesta del modelo de visión no contiene JSON.')
    const datos = JSON.parse(json) as Partial<BorradorImportacionIA>
    return {
      resumen: typeof datos.resumen === 'string' ? datos.resumen : '',
      entidades: Array.isArray(datos.entidades) ? datos.entidades : [],
      relaciones: Array.isArray(datos.relaciones) ? datos.relaciones : [],
      reglas: Array.isArray(datos.reglas) ? datos.reglas : [],
      ambiguedades: Array.isArray(datos.ambiguedades) ? datos.ambiguedades : []
    }
  },

  async interpretarTexto(texto, _nombreArchivo, config, _claveApi, signal): Promise<BorradorImportacionIA> {
    const respuesta = await chatOllama(
      config,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content:
            'El usuario importó un documento que describe una base de datos. Interpreta la prosa y las reglas de negocio. ' +
            'Devuelve JSON {"resumen":string,"entidades":[],"relaciones":[],"reglas":[],"ambiguedades":[]}. ' +
            'Distingue información explícita de inferencias (marca inferencias como ambigüedades semánticas).\n\nDocumento:\n' +
            texto.slice(0, 12000)
        }
      ],
      { formatoJson: true, signal, operacion: 'texto' }
    )
    const json = extraerJson(respuesta)
    if (!json) throw new Error('La respuesta no contiene JSON.')
    const datos = JSON.parse(json) as Partial<BorradorImportacionIA>
    return {
      resumen: typeof datos.resumen === 'string' ? datos.resumen : '',
      entidades: Array.isArray(datos.entidades) ? datos.entidades : [],
      relaciones: Array.isArray(datos.relaciones) ? datos.relaciones : [],
      reglas: Array.isArray(datos.reglas) ? datos.reglas : [],
      ambiguedades: Array.isArray(datos.ambiguedades) ? datos.ambiguedades : []
    }
  },

  capacidades(config): CapacidadesProveedor {
    const familia = config.modelo.toLowerCase()
    const posibleVision = /(vision|llava|qwen.*vl|moondream|bakllava|minicpm-v|granite.*vision)/.test(familia)
    return capacidadesPorDefecto({
      estructurado: true,
      vision: posibleVision ? 'no-verificable' : false
    })
  }
}
