import {
  BorradorImportacionIA,
  CapacidadesProveedor,
  ConfigProveedor,
  OperacionConsumo,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResultadoPruebaConexion,
  SolicitudChat,
  SolicitudRevision,
  soportaJsonEstructurado
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
  let base = config.endpoint.replace(/\/+$/, '')
  if (!/\/(v\d+[a-z]*|openai)$/i.test(base)) base = `${base}/v1`
  return base
}

function cabeceras(claveApi: string | null): Record<string, string> {
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' }
  if (claveApi) cabeceras.Authorization = `Bearer ${claveApi}`
  return cabeceras
}

async function chatCompletions(
  config: ConfigProveedor,
  claveApi: string | null,
  mensajes: MensajeProveedor[],
  opciones: { json: boolean; signal: AbortSignal; operacion: OperacionConsumo }
): Promise<string> {
  const cuerpo: Record<string, unknown> = {
    model: config.modelo,
    messages: mensajes,
    stream: false,
    temperature: 0.2
  }
  if (opciones.json && soportaJsonEstructurado(config.proveedor)) {
    cuerpo.response_format = { type: 'json_object' }
  }
  const respuesta = await fetch(`${urlBase(config)}/chat/completions`, {
    method: 'POST',
    headers: cabeceras(claveApi),
    body: JSON.stringify(cuerpo),
    signal: opciones.signal
  })
  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => '')
    throw new Error(`El proveedor respondió ${respuesta.status}: ${texto.slice(0, 200)}`)
  }
  const datos = (await respuesta.json()) as {
    choices?: { message?: { content?: string | null } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const contenido = datos.choices?.[0]?.message?.content ?? ''
  const uso = datos.usage
  if (uso && typeof uso.prompt_tokens === 'number') {
    registrarConsumo({
      proveedor: config.proveedor,
      modelo: config.modelo,
      operacion: opciones.operacion,
      entrada: uso.prompt_tokens ?? 0,
      salida: uso.completion_tokens ?? 0,
      estimado: false
    })
  } else {
    registrarConsumo({
      proveedor: config.proveedor,
      modelo: config.modelo,
      operacion: opciones.operacion,
      entrada: estimarTokens(JSON.stringify(mensajes)),
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

function normalizarBorrador(texto: string): BorradorImportacionIA {
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

async function probarConChat(
  config: ConfigProveedor,
  claveApi: string | null
): Promise<ResultadoPruebaConexion> {
  try {
    const control = AbortSignal.timeout(10000)
    const respuesta = await fetch(`${urlBase(config)}/chat/completions`, {
      method: 'POST',
      headers: cabeceras(claveApi),
      body: JSON.stringify({
        model: config.modelo,
        messages: [{ role: 'user', content: 'Responde solo con la palabra ok' }],
        max_tokens: 5,
        stream: false
      }),
      signal: control
    })
    if (respuesta.status === 401 || respuesta.status === 403) {
      return {
        ok: false,
        detalle: 'Autenticación rechazada. Revisa la clave de API.',
        capacidades: null,
        modelos: []
      }
    }
    if (!respuesta.ok) {
      const cuerpo = await respuesta.text().catch(() => '')
      return {
        ok: false,
        detalle: `El proveedor respondió ${respuesta.status}: ${cuerpo.slice(0, 300) || '(sin cuerpo)'}`,
        capacidades: null,
        modelos: []
      }
    }
    return {
      ok: true,
      detalle: `Conectado vía chat. El proveedor no expone la lista de modelos, así que la disponibilidad de «${config.modelo}» no pudo verificarse automáticamente.`,
      capacidades: capacidadesPorDefecto({ estructurado: true, vision: 'no-verificable' }),
      modelos: []
    }
  } catch (error) {
    return {
      ok: false,
      detalle: `No se pudo contactar con el proveedor en ${config.endpoint}: ${(error as Error).message}`,
      capacidades: null,
      modelos: []
    }
  }
}

export const adaptadorOpenAI: AdaptadorProveedor = {
  nombre: 'openai',

  async probarConexion(config, claveApi): Promise<ResultadoPruebaConexion> {
    try {
      const control = AbortSignal.timeout(8000)
      const respuesta = await fetch(`${urlBase(config)}/models`, {
        headers: cabeceras(claveApi),
        signal: control
      })
      if (respuesta.status === 401 || respuesta.status === 403) {
        return {
          ok: false,
          detalle: 'Autenticación rechazada. Revisa la clave de API.',
          capacidades: null,
          modelos: []
        }
      }
      if (respuesta.status === 404) {
        return probarConChat(config, claveApi)
      }
      if (!respuesta.ok) {
        const cuerpo = await respuesta.text().catch(() => '')
        return {
          ok: false,
          detalle: `El proveedor respondió ${respuesta.status}: ${cuerpo.slice(0, 300) || '(sin cuerpo)'}`,
          capacidades: null,
          modelos: []
        }
      }
      const datos = (await respuesta.json()) as { data?: { id: string }[] }
      const modelos = (datos.data ?? []).map((m) => m.id)
      const coincide = !config.modelo || modelos.includes(config.modelo)
      return {
        ok: coincide,
        detalle: coincide
          ? `Conectado. El modelo «${config.modelo}» está disponible. La capacidad de visión no es verificable automáticamente.`
          : `Conectado, pero el modelo «${config.modelo}» no figura en la lista del proveedor.`,
        capacidades: capacidadesPorDefecto({ estructurado: true, vision: 'no-verificable' }),
        modelos: modelos.slice(0, 100)
      }
    } catch (error) {
      return {
        ok: false,
        detalle: `No se pudo contactar con el proveedor en ${config.endpoint}: ${(error as Error).message}`,
        capacidades: null,
        modelos: []
      }
    }
  },

  async revisar(solicitud: SolicitudRevision, config, claveApi, signal): Promise<RespuestaRevisionIA> {
    const texto = await chatCompletions(
      config,
      claveApi,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content: `Modelo y contexto:\n${JSON.stringify(solicitud, null, 1)}\n\nDevuelve el JSON de la revisión.`
        }
      ],
      { json: true, signal, operacion: 'revision' }
    )
    return normalizarRevision(texto)
  },

  async chatear(solicitud: SolicitudChat, config, claveApi, signal): Promise<RespuestaChatIA> {
    const texto = await chatCompletions(
      config,
      claveApi,
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
      { json: false, signal, operacion: 'chat' }
    )
    return { contenido: texto, propuestas: [] }
  },

  async interpretarImagen(imagenBase64, mime, config, claveApi, signal): Promise<BorradorImportacionIA> {
    const texto = await chatCompletions(
      config,
      claveApi,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Esta imagen es un diagrama entidad-relación. Extrae entidades, atributos, claves (PK/FK), relaciones y cardinalidades. ' +
                'Marca como ambigüedad todo lo que no puedas leer con certeza. Devuelve JSON con forma ' +
                '{"resumen":string,"entidades":[],"relaciones":[],"reglas":[],"ambiguedades":[]}. No inventes contenido ilegible.'
            },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${imagenBase64}` } }
          ]
        }
      ],
      { json: true, signal, operacion: 'imagen' }
    )
    return normalizarBorrador(texto)
  },

  async interpretarTexto(texto, _nombreArchivo, config, claveApi, signal): Promise<BorradorImportacionIA> {
    const respuesta = await chatCompletions(
      config,
      claveApi,
      [
        { role: 'system', content: SISTEMA_REVISION },
        {
          role: 'user',
          content:
            'El usuario importó un documento que describe una base de datos. Interpreta la prosa y las reglas de negocio. ' +
            'Devuelve JSON {"resumen":string,"entidades":[],"relaciones":[],"reglas":[],"ambiguedades":[]}. ' +
            'Distingue información explícita de inferencias.\n\nDocumento:\n' +
            texto.slice(0, 12000)
        }
      ],
      { json: true, signal, operacion: 'texto' }
    )
    return normalizarBorrador(respuesta)
  },

  capacidades(_config): CapacidadesProveedor {
    return capacidadesPorDefecto({ estructurado: true, vision: 'no-verificable' })
  }
}
