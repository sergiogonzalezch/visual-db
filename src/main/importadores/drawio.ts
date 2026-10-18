import { inflateRawSync } from 'zlib'
import { XMLParser } from 'fast-xml-parser'

export interface FiguraDrawio {
  id: string
  tipo: 'vertex' | 'edge'
  texto: string
  estilo: Record<string, string | boolean>
  geometria: { x: number; y: number; ancho: number; alto: number } | null
  origenId: string | null
  destinoId: string | null
  pagina: string
}

export interface ResultadoDrawio {
  paginas: string[]
  paginaSeleccionada: string
  figuras: FiguraDrawio[]
  noClasificadas: { id: string; texto: string }[]
  advertencias: string[]
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: true
})

export function extraerPaginas(xml: string): { nombre: string; contenido: string }[] {
  const bloques = [...xml.matchAll(/<diagram\b([^>]*)>([\s\S]*?)<\/diagram>/g)]
  if (bloques.length > 0) {
    const paginas: { nombre: string; contenido: string }[] = []
    bloques.forEach((bloque, i) => {
      const atributos = bloque[1] ?? ''
      const cuerpo = (bloque[2] ?? '').trim()
      if (!cuerpo) return
      const nombre = atributos.match(/name="([^"]*)"/)?.[1] ?? `Página ${i + 1}`
      const comprimido = !/compressed="false"/.test(atributos)
      paginas.push({
        nombre,
        contenido: comprimido ? descomprimirDrawio(cuerpo) : desescaparXml(cuerpo)
      })
    })
    if (paginas.length > 0) return paginas
  }

  if (/<mxGraphModel[\s>]/.test(xml)) {
    return [{ nombre: 'Página 1', contenido: xml }]
  }

  throw new Error('El archivo no parece un diagrama draw.io (falta mxfile o mxGraphModel).')
}

function desescaparXml(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n')
    .replace(/&#xa;/gi, '\n')
    .replace(/&amp;/g, '&')
}

export function descomprimirDrawio(base64: string): string {
  const buffer = Buffer.from(base64, 'base64')
  try {
    return inflateRawSync(buffer, { maxOutputLength: 64 * 1024 * 1024 }).toString('utf-8')
  } catch {
    return buffer.toString('utf-8')
  }
}

function parsearEstilo(estilo: string | undefined): Record<string, string | boolean> {
  const resultado: Record<string, string | boolean> = {}
  if (!estilo) return resultado
  for (const parte of estilo.split(';')) {
    if (!parte) continue
    const igual = parte.indexOf('=')
    if (igual === -1) resultado[parte] = true
    else resultado[parte.slice(0, igual)] = parte.slice(igual + 1)
  }
  return resultado
}

function textoDeNodo(nodo: Record<string, unknown>): string {
  const valor = nodo.value ?? nodo['@_value'] ?? nodo['#text']
  if (typeof valor === 'string') return valor.trim()
  if (Array.isArray(valor)) {
    return valor
      .map((v) => (typeof v === 'string' ? v : String((v as { '#text'?: string })?.['#text'] ?? '')))
      .join(' ')
      .trim()
  }
  return ''
}

export function extraerPagina(xmlPagina: string, nombrePagina: string): ResultadoDrawio {
  const doc = parser.parse(xmlPagina) as {
    mxGraphModel?: { root?: { mxCell?: Record<string, unknown>[] | Record<string, unknown> } }
  }
  const raiz = doc.mxGraphModel?.root
  if (!raiz) throw new Error('La página del diagrama no tiene estructura mxGraphModel.')

  const celdas = Array.isArray(raiz.mxCell) ? raiz.mxCell : raiz.mxCell ? [raiz.mxCell] : []
  const figuras: FiguraDrawio[] = []
  const advertencias: string[] = []

  for (const celda of celdas) {
    const attrs = celda as Record<string, string | undefined>
    const id = attrs['@_id'] ?? ''
    if (id === '0' || id === '1') continue
    const esEdge = attrs['@_edge'] === '1'
    const estilo = parsearEstilo(attrs['@_style'])
    const texto = textoDeNodo(celda as Record<string, unknown>)
    const geo = (celda as { mxGeometry?: { '@_x'?: string; '@_y'?: string; '@_width'?: string; '@_height'?: string; as?: string } }).mxGeometry

    if (esEdge) {
      figuras.push({
        id,
        tipo: 'edge',
        texto,
        estilo,
        geometria: null,
        origenId: attrs['@_source'] ?? null,
        destinoId: attrs['@_target'] ?? null,
        pagina: nombrePagina
      })
    } else {
      const x = Number(geo?.['@_x'] ?? 0)
      const y = Number(geo?.['@_y'] ?? 0)
      const ancho = Number(geo?.['@_width'] ?? 0)
      const alto = Number(geo?.['@_height'] ?? 0)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        advertencias.push(`La figura ${id} no tiene geometría legible.`)
      }
      figuras.push({
        id,
        tipo: 'vertex',
        texto,
        estilo,
        geometria: { x, y, ancho, alto },
        origenId: null,
        destinoId: null,
        pagina: nombrePagina
      })
    }
  }

  const vertices = figuras.filter((f) => f.tipo === 'vertex')
  for (const edge of figuras.filter((f) => f.tipo === 'edge')) {
    if (!edge.origenId || !edge.destinoId) {
      advertencias.push(`La conexión «${edge.texto || edge.id}» no tiene ambos extremos identificados.`)
    } else {
      if (!vertices.some((v) => v.id === edge.origenId)) {
        advertencias.push(`La conexión «${edge.texto || edge.id}» tiene un origen que no se encontró.`)
      }
      if (!vertices.some((v) => v.id === edge.destinoId)) {
        advertencias.push(`La conexión «${edge.texto || edge.id}» tiene un destino que no se encontró.`)
      }
    }
  }

  const noClasificadas = vertices
    .filter((v) => !pareceEntidad(v) && !pareceAtributo(v))
    .map((v) => ({ id: v.id, texto: v.texto || '(sin texto)' }))

  return {
    paginas: [nombrePagina],
    paginaSeleccionada: nombrePagina,
    figuras,
    noClasificadas,
    advertencias
  }
}

export function pareceEntidad(figura: FiguraDrawio): boolean {
  const shape = String(figura.estilo.shape ?? '')
  const estilo = String(figura.estilo.shape ?? '') + String(figura.estilo.strokeWidth ?? '')
  if (shape === 'table' || shape === 'swimlane' || estilo.includes('table')) return true
  if (figura.texto.includes('PK') || figura.texto.includes('FK')) return true
  const lineas = figura.texto.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lineas.length >= 2 && lineas.length <= 30 && !figura.estilo.edgeStyle) return true
  return false
}

export function pareceAtributo(figura: FiguraDrawio): boolean {
  const lineas = figura.texto.split('\n').map((l) => l.trim()).filter(Boolean)
  return lineas.length === 1 && lineas[0].length < 60 && !figura.estilo.edgeStyle
}

export function clasificarFiguras(resultado: ResultadoDrawio): {
  entidades: FiguraDrawio[]
  atributosSueltos: FiguraDrawio[]
  bordes: FiguraDrawio[]
  otras: FiguraDrawio[]
} {
  const entidades: FiguraDrawio[] = []
  const atributosSueltos: FiguraDrawio[] = []
  const bordes: FiguraDrawio[] = []
  const otras: FiguraDrawio[] = []
  for (const figura of resultado.figuras) {
    if (figura.tipo === 'edge') bordes.push(figura)
    else if (pareceEntidad(figura)) entidades.push(figura)
    else if (pareceAtributo(figura)) atributosSueltos.push(figura)
    else otras.push(figura)
  }
  return { entidades, atributosSueltos, bordes, otras }
}
