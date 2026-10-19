import { clasificarFiguras, extraerPagina, extraerPaginas, FiguraDrawio, ResultadoDrawio } from './drawio'
export interface BorradorAtributoDrawio {
  ref: string
  nombre: string
  clave: 'primaria' | 'candidata' | 'foranea' | 'ninguna'
}
export interface BorradorEntidadDrawio {
  ref: string
  nombre: string
  x: number
  y: number
  ancho: number
  alto: number
  atributos: BorradorAtributoDrawio[]
}
export interface BorradorRelacionDrawio {
  ref: string
  origenRef: string | null
  destinoRef: string | null
  etiqueta: string
  cardinalidadOrigen: string | null
  cardinalidadDestino: string | null
}
export interface BorradorDrawio {
  resumen: string
  pagina: string
  paginas: string[]
  entidades: BorradorEntidadDrawio[]
  relaciones: BorradorRelacionDrawio[]
  atributosSueltos: { ref: string; nombre: string; entidadCercanaRef: string | null }[]
  figurasSinClasificar: { ref: string; texto: string }[]
  advertencias: string[]
}
export function importarDrawio(xml: string, paginaIndex = 0): BorradorDrawio {
  const paginas = extraerPaginas(xml)
  if (paginas.length === 0) throw new Error('El archivo no contiene páginas importables.')
  const seleccionada = paginas[Math.min(paginaIndex, paginas.length - 1)]
  const resultado = extraerPagina(seleccionada.contenido, seleccionada.nombre)
  return construirBorrador(resultado, paginas.map((p) => p.nombre))
}
function parsearEntidad(figura: FiguraDrawio): BorradorEntidadDrawio {
  const lineas = figura.texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const nombre = lineas[0]?.replace(/\*/g, '').trim() || 'Entidad sin nombre'
  const atributos: BorradorAtributoDrawio[] = []
  for (const linea of lineas.slice(1)) {
    let clave: BorradorAtributoDrawio['clave'] = 'ninguna'
    let texto = linea
    if (/\bPK\b/i.test(linea)) {
      clave = 'primaria'
      texto = texto.replace(/\bPK\b/gi, '')
    } else if (/\bFK\b/i.test(linea)) {
      clave = 'foranea'
      texto = texto.replace(/\bFK\b/gi, '')
    } else if (/\bUK\b/i.test(linea) || /\bAK\b/i.test(linea)) {
      clave = 'candidata'
      texto = texto.replace(/\b(UK|AK)\b/gi, '')
    }
    texto = texto.replace(/[:*()\[\]]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!texto) continue
    atributos.push({
      ref: `${figura.id}|${atributos.length}`,
      nombre: texto.split(' ').slice(0, 2).join(' ').trim() || texto,
      clave
    })
  }
  return {
    ref: figura.id,
    nombre,
    x: figura.geometria?.x ?? 0,
    y: figura.geometria?.y ?? 0,
    ancho: Math.max(180, figura.geometria?.ancho ?? 200),
    alto: Math.max(70, figura.geometria?.alto ?? 90),
    atributos
  }
}
function cardinalidadDeEtiqueta(lado: 'inicio' | 'fin', etiqueta: string): string | null {
  const partes = etiqueta.split(/[\s|,·-]+/).filter(Boolean)
  if (partes.length === 0) return null
  const candidato = lado === 'inicio' ? partes[0] : partes[partes.length - 1]
  if (/^1$/.test(candidato)) return '1'
  if (/^0\.\.1$/.test(candidato) || /^0\?$/i.test(candidato)) return '0..1'
  if (/^n$|^N$|^m$|^M$|\*/.test(candidato)) return 'n'
  if (/^0\.\.n$/i.test(candidato) || /^0\.\.\*$/i.test(candidato)) return '0..n'
  if (/^1\.\.(n|\*)$/i.test(candidato)) return '1..n'
  return null
}
export function construirBorrador(resultado: ResultadoDrawio, paginas: string[]): BorradorDrawio {
  const { entidades: entidadesFig, atributosSueltos: sueltosFig, bordes, otras } = clasificarFiguras(resultado)
  const entidades = entidadesFig.map(parsearEntidad)
  const atributosSueltos = sueltosFig.map((fig) => {
    const centro = { x: (fig.geometria?.x ?? 0) + (fig.geometria?.ancho ?? 0) / 2, y: (fig.geometria?.y ?? 0) + (fig.geometria?.alto ?? 0) / 2 }
    let cercana: { ref: string; dist: number } | null = null
    for (const entidad of entidades) {
      const cx = entidad.x + entidad.ancho / 2
      const cy = entidad.y + entidad.alto / 2
      const dist = Math.hypot(cx - centro.x, cy - centro.y)
      if (!cercana || dist < cercana.dist) cercana = { ref: entidad.ref, dist }
    }
    return {
      ref: fig.id,
      nombre: fig.texto || '(sin texto)',
      entidadCercanaRef: cercana && cercana.dist < 220 ? cercana.ref : null
    }
  })
  for (const suelto of atributosSueltos) {
    const entidad = entidades.find((e) => e.ref === suelto.entidadCercanaRef)
    if (!entidad) continue
    entidad.atributos.push({ ref: `${suelto.ref}|auto`, nombre: suelto.nombre, clave: 'ninguna' })
  }
  const relaciones: BorradorRelacionDrawio[] = []
  for (const borde of bordes) {
    const etiqueta = borde.texto.replace(/\s+/g, ' ').trim()
    relaciones.push({
      ref: borde.id,
      origenRef: borde.origenId,
      destinoRef: borde.destinoId,
      etiqueta,
      cardinalidadOrigen: cardinalidadDeEtiqueta('inicio', etiqueta),
      cardinalidadDestino: cardinalidadDeEtiqueta('fin', etiqueta)
    })
  }
  const figurasSinClasificar = [
    ...resultado.noClasificadas.filter((f) => !atributosSueltos.some((s) => s.ref === f.id && sueltosFig.some((x) => x.id === f.id))),
    ...otras.map((f) => ({ id: f.id, texto: f.texto || '(sin texto)' }))
  ].filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
  const resumenParts = [
    `${entidades.length} entidad(es) reconocida(s)`,
    `${relaciones.length} conexión(es)`,
    `${atributosSueltos.length} texto(s) suelto(s) cercano(s) a entidades`,
    `${figurasSinClasificar.length} figura(s) sin clasificar`
  ]
  if (resultado.advertencias.length > 0) {
    resumenParts.push(`${resultado.advertencias.length} advertencia(s)`)
  }
  return {
    resumen: resumenParts.join('; ') + '.',
    pagina: resultado.paginaSeleccionada,
    paginas,
    entidades,
    relaciones,
    atributosSueltos,
    figurasSinClasificar: figurasSinClasificar.map((f) => ({ ref: f.id, texto: f.texto })),
    advertencias: resultado.advertencias
  }
}
