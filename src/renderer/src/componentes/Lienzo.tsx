import { useCallback, useMemo, useRef, useState } from 'react'
import { DESCONOCIDO, Entidad, hallarEntidad } from '../domain/modelo'
import { aplicarOperaciones } from '../domain/operaciones'
import { useTienda } from '../estado/tienda'

interface Punto {
  x: number
  y: number
}

interface Arrastre {
  tipo: 'entidad' | 'paneo'
  id?: string
  inicioPantalla: Punto
  inicioMundo: Punto
  posicionInicial?: Punto
  movido: boolean
}

function altoEntidad(entidad: Entidad): number {
  return 30 + Math.max(entidad.atributos.length, 1) * 15 + 10
}

function anchoEntidad(entidad: Entidad): number {
  const porNombre = entidad.nombre.length * 7.5 + 40
  const porAtributo = entidad.atributos.reduce((max, a) => Math.max(max, a.nombre.length * 6.8 + 70), 0)
  return Math.max(180, porNombre, porAtributo)
}

function interseccionBorde(entidad: Entidad, hacia: Punto): Punto {
  const ancho = anchoEntidad(entidad)
  const alto = altoEntidad(entidad)
  const cx = entidad.x + ancho / 2
  const cy = entidad.y + alto / 2
  const dx = hacia.x - cx
  const dy = hacia.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const escalaX = dx === 0 ? Infinity : ancho / 2 / Math.abs(dx)
  const escalaY = dy === 0 ? Infinity : alto / 2 / Math.abs(dy)
  const escala = Math.min(escalaX, escalaY)
  return { x: cx + dx * escala, y: cy + dy * escala }
}

function etiquetaCardinalidad(min: unknown, max: unknown): string {
  if (min === DESCONOCIDO || max === DESCONOCIDO) return '?'
  const parteMin = String(min)
  const parteMax = String(max)
  if (parteMin === '1' && parteMax === '1') return '1'
  if (parteMin === '0' && parteMax === '1') return '0..1'
  if (parteMax === 'n') return parteMin === '0' ? '0..n' : '1..n'
  return `${parteMin}..${parteMax}`
}

function textoEnvolvente(texto: string, maximo: number): string[] {
  const palabras = texto.split(/\s+/)
  const lineas: string[] = []
  let actual = ''
  for (const palabra of palabras) {
    if ((actual + ' ' + palabra).trim().length > maximo) {
      if (actual) lineas.push(actual)
      actual = palabra
    } else {
      actual = (actual + ' ' + palabra).trim()
    }
  }
  if (actual) lineas.push(actual)
  return lineas.slice(0, 4)
}

export function Lienzo(): JSX.Element {
  const tienda = useTienda()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [paneo, setPaneo] = useState<Punto>({ x: 40, y: 40 })
  const [zoom, setZoom] = useState(1)
  const [arrastre, setArrastre] = useState<Arrastre | null>(null)
  const [posiciones, setPosiciones] = useState<Record<string, Punto>>({})

  const puntoMundo = useCallback(
    (evento: { clientX: number; clientY: number }): Punto => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (evento.clientX - rect.left - paneo.x) / zoom,
        y: (evento.clientY - rect.top - paneo.y) / zoom
      }
    },
    [paneo, zoom]
  )

  const propuestaActual = useMemo(() => {
    if (tienda.vista !== 'propuesto' || !tienda.propuestaEnComparacion) return null
    const propuesta = tienda.proyecto.propuestas.find((p) => p.id === tienda.propuestaEnComparacion)
    if (!propuesta) return null
    try {
      const resultado = aplicarOperaciones(
        { diseno: tienda.proyecto.diseno, reglas: tienda.proyecto.reglas },
        propuesta.operaciones
      )
      return { propuesta, diseno: resultado.diseno }
    } catch {
      return { propuesta, diseno: null }
    }
  }, [tienda.vista, tienda.propuestaEnComparacion, tienda.proyecto])

  const disenoVisible = propuestaActual?.diseno ?? tienda.proyecto.diseno

  const idsAñadidos = useMemo(() => {
    const ids = new Set<string>()
    if (!propuestaActual) return ids
    for (const op of propuestaActual.propuesta.operaciones) {
      if (op.op === 'addEntidad') ids.add(op.entidad.id)
      if (op.op === 'addRelacion') ids.add(op.relacion.id)
      if (op.op === 'addNota') ids.add(op.nota.id)
    }
    return ids
  }, [propuestaActual])

  const idsEliminados = useMemo(() => {
    const ids = new Set<string>()
    if (!propuestaActual) return ids
    for (const op of propuestaActual.propuesta.operaciones) {
      if (op.op === 'removeEntidad') ids.add(op.id)
      if (op.op === 'removeRelacion') ids.add(op.id)
      if (op.op === 'removeNota') ids.add(op.id)
    }
    return ids
  }, [propuestaActual])

  const idsAfectados = useMemo(() => {
    const ids = new Set<string>()
    if (propuestaActual) {
      for (const afectado of propuestaActual.propuesta.afectados) {
        if (afectado.tipo === 'entidad' || afectado.tipo === 'relacion' || afectado.tipo === 'nota') {
          ids.add(afectado.id)
        }
      }
    }
    for (const hallazgo of tienda.hallazgos) {
      if (hallazgo.severidad === 'error') {
        for (const elemento of hallazgo.elementos) ids.add(elemento.id)
      }
    }
    return ids
  }, [propuestaActual, tienda.hallazgos])

  const marcasPorElemento = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const hallazgo of tienda.hallazgos) {
      for (const elemento of hallazgo.elementos) {
        mapa.set(elemento.id, (mapa.get(elemento.id) ?? 0) + 1)
      }
    }
    return mapa
  }, [tienda.hallazgos])

  const posicionDe = (entidad: Entidad): Punto => posiciones[entidad.id] ?? { x: entidad.x, y: entidad.y }

  const finalizarArrastre = useCallback(() => {
    if (!arrastre) return
    if (arrastre.tipo === 'entidad' && arrastre.id && arrastre.movido) {
      const destino = posiciones[arrastre.id]
      if (destino) {
        tienda.aplicar([{ op: 'moverEntidad', id: arrastre.id, x: Math.round(destino.x), y: Math.round(destino.y) }])
      }
    }
    setArrastre(null)
    setPosiciones({})
  }, [arrastre, posiciones, tienda])

  const manejarAbajo = (evento: React.MouseEvent<SVGSVGElement>) => {
    const entidadObjetivo = (evento.target as Element).closest('[data-entidad-id]') as SVGElement | null
    const relacionObjetivo = (evento.target as Element).closest('[data-relacion-id]') as SVGElement | null
    const notaObjetivo = (evento.target as Element).closest('[data-nota-id]') as SVGElement | null
    const punto = puntoMundo(evento)

    if (evento.button === 1 || (!entidadObjetivo && !relacionObjetivo && !notaObjetivo)) {
      if (tienda.herramienta === 'entidad' && evento.button === 0) {
        tienda.crearEntidadEn(Math.round(punto.x), Math.round(punto.y))
        return
      }
      if (tienda.herramienta === 'nota' && evento.button === 0) {
        tienda.crearNotaEn(Math.round(punto.x), Math.round(punto.y))
        return
      }
      if (evento.button === 0) {
        setArrastre({
          tipo: 'paneo',
          inicioPantalla: { x: evento.clientX, y: evento.clientY },
          inicioMundo: { x: paneo.x, y: paneo.y },
          movido: false
        })
      }
      return
    }

    if (evento.button !== 0) return

    if (entidadObjetivo) {
      const id = entidadObjetivo.dataset.entidadId!
      if (tienda.herramienta === 'relacion') {
        if (!tienda.entidadOrigenRelacion) {
          tienda.seleccionar({ tipo: 'entidad', id })
          tienda.setEntidadOrigenRelacion(id)
        } else if (tienda.entidadOrigenRelacion !== id) {
          tienda.conectarEntidades(tienda.entidadOrigenRelacion, id)
        } else {
          tienda.setEntidadOrigenRelacion(null)
        }
        return
      }
      tienda.seleccionar({ tipo: 'entidad', id })
      const entidad = hallarEntidad(tienda.proyecto.diseno, id)
      if (entidad) {
        const posicion = posicionDe(entidad)
        setArrastre({
          tipo: 'entidad',
          id,
          inicioPantalla: { x: evento.clientX, y: evento.clientY },
          inicioMundo: posicion,
          posicionInicial: posicion,
          movido: false
        })
      }
      return
    }

    if (relacionObjetivo) {
      tienda.seleccionar({ tipo: 'relacion', id: relacionObjetivo.dataset.relacionId! })
      return
    }

    if (notaObjetivo) {
      tienda.seleccionar({ tipo: 'nota', id: notaObjetivo.dataset.notaId! })
    }
  }

  const manejarMover = useCallback(
    (evento: React.MouseEvent<SVGSVGElement>) => {
      if (!arrastre) return
      if (arrastre.tipo === 'paneo') {
        const dx = evento.clientX - arrastre.inicioPantalla.x
        const dy = evento.clientY - arrastre.inicioPantalla.y
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          setArrastre({ ...arrastre, movido: true })
          setPaneo({ x: arrastre.inicioMundo.x + dx, y: arrastre.inicioMundo.y + dy })
        }
        return
      }
      if (arrastre.tipo === 'entidad' && arrastre.id) {
        const dx = (evento.clientX - arrastre.inicioPantalla.x) / zoom
        const dy = (evento.clientY - arrastre.inicioPantalla.y) / zoom
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          setArrastre({ ...arrastre, movido: true })
          setPosiciones({
            [arrastre.id]: {
              x: arrastre.inicioMundo.x + dx,
              y: arrastre.inicioMundo.y + dy
            }
          })
        }
      }
    },
    [arrastre, zoom]
  )

  const manejarRueda = (evento: React.WheelEvent<SVGSVGElement>) => {
    evento.preventDefault()
    const factor = evento.deltaY < 0 ? 1.1 : 0.9
    const siguiente = Math.min(2.5, Math.max(0.25, zoom * factor))
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) {
      setZoom(siguiente)
      return
    }
    const px = evento.clientX - rect.left
    const py = evento.clientY - rect.top
    const mundoX = (px - paneo.x) / zoom
    const mundoY = (py - paneo.y) / zoom
    setPaneo({ x: px - mundoX * siguiente, y: py - mundoY * siguiente })
    setZoom(siguiente)
  }

  const entidades = disenoVisible.entidades
  const centroDe = (id: string): Punto => {
    const entidad = hallarEntidad(disenoVisible, id) ?? hallarEntidad(tienda.proyecto.diseno, id)
    if (!entidad) return { x: 0, y: 0 }
    const p = posicionDe(entidad)
    return { x: p.x + anchoEntidad(entidad) / 2, y: p.y + altoEntidad(entidad) / 2 }
  }

  return (
    <svg
      ref={svgRef}
      className={`${tienda.herramienta === 'entidad' ? 'mover-entidad' : ''} ${tienda.herramienta === 'relacion' ? 'relation' : ''}`}
      onMouseDown={manejarAbajo}
      onMouseMove={manejarMover}
      onMouseUp={finalizarArrastre}
      onMouseLeave={finalizarArrastre}
      onWheel={manejarRueda}
      data-zoom={zoom}
    >
      <g transform={`translate(${paneo.x},${paneo.y}) scale(${zoom})`}>
        {disenoVisible.relaciones.map((relacion: any) => {
          const centroOrigen = centroDe(relacion.inicio.entidadId)
          const centroDestino = centroDe(relacion.fin.entidadId)
          const origenEntidad =
            hallarEntidad(disenoVisible, relacion.inicio.entidadId) ??
            hallarEntidad(tienda.proyecto.diseno, relacion.inicio.entidadId)
          const destinoEntidad =
            hallarEntidad(disenoVisible, relacion.fin.entidadId) ??
            hallarEntidad(tienda.proyecto.diseno, relacion.fin.entidadId)
          if (!origenEntidad || !destinoEntidad) return null
          const origen = interseccionBorde(origenEntidad, centroDestino)
          const destino = interseccionBorde(destinoEntidad, centroOrigen)
          const seleccionada = tienda.seleccion?.tipo === 'relacion' && tienda.seleccion.id === relacion.id
          const etiquetaInicio = etiquetaCardinalidad(
            relacion.inicio.cardinalidad.minimo,
            relacion.inicio.cardinalidad.maximo
          )
          const etiquetaFin = etiquetaCardinalidad(relacion.fin.cardinalidad.minimo, relacion.fin.cardinalidad.maximo)
          const dirX = destino.x - origen.x
          const dirY = destino.y - origen.y
          const largo = Math.hypot(dirX, dirY) || 1
          const ux = dirX / largo
          const uy = dirY / largo
          return (
            <g
              key={relacion.id}
              className={`relacion-linea ${seleccionada ? 'seleccionada' : ''} ${idsAfectados.has(relacion.id) ? 'afectada' : ''}`}
              data-relacion-id={relacion.id}
            >
              <line x1={origen.x} y1={origen.y} x2={destino.x} y2={destino.y} />
              <line
                x1={origen.x}
                y1={origen.y}
                x2={destino.x}
                y2={destino.y}
                stroke="transparent"
                strokeWidth={14 / zoom}
              />
              <text x={origen.x + ux * 28 - uy * 12} y={origen.y + uy * 28 + ux * 14}>
                {etiquetaInicio}
              </text>
              <text x={destino.x - ux * 28 - uy * 12} y={destino.y - uy * 28 + ux * 14}>
                {etiquetaFin}
              </text>
              {idsEliminados.has(relacion.id) && (
                <text x={(origen.x + destino.x) / 2 - 10} y={(origen.y + destino.y) / 2 - 8} fill="#ff6b6b">
                  ✕ eliminar
                </text>
              )}
            </g>
          )
        })}

        {entidades.map((entidad: any) => {
          const posicion = posicionDe(entidad)
          const ancho = anchoEntidad(entidad)
          const alto = altoEntidad(entidad)
          const seleccionada = tienda.seleccion?.tipo === 'entidad' && tienda.seleccion.id === entidad.id
          const fantasmas = idsAñadidos.has(entidad.id)
          const afectada = idsAfectados.has(entidad.id)
          const marcadas = marcasPorElemento.get(entidad.id) ?? 0
          const eliminada = idsEliminados.has(entidad.id)
          return (
            <g
              key={entidad.id}
              className={`entidad-carta ${seleccionada ? 'seleccionada' : ''} ${fantasmas ? 'fantasma' : ''} ${afectada ? 'afectada' : ''}`}
              data-entidad-id={entidad.id}
              transform={`translate(${posicion.x},${posicion.y})`}
              opacity={eliminada ? 0.55 : 1}
            >
              <rect className="cuerpo" width={ancho} height={alto} rx={8} />
              <rect className="titulo" width={ancho} height={26} rx={8} />
              <rect className="titulo" y={12} width={ancho} height={14} />
              <text className="nombre" x={10} y={18}>
                {eliminada ? `✕ ${entidad.nombre}` : entidad.nombre}
              </text>
              {entidad.atributos.map((atributo: any, indice: number) => {
                const clave = entidad.claves.find((c: any) => c.atributoIds.includes(atributo.id))
                const etiqueta =
                  clave?.tipo === 'primaria' ? 'PK' : clave?.tipo === 'candidata' ? 'UK' : clave?.tipo === 'foranea' ? 'FK' : ''
                return (
                  <g key={atributo.id}>
                    <text
                      className="atributo"
                      x={10}
                      y={42 + indice * 15}
                      textDecoration={clave?.tipo === 'primaria' ? 'underline' : undefined}
                    >
                      {atributo.multivalorado === true ? '{…} ' : ''}
                      {atributo.nombre}
                      {atributo.nulable === false ? ' *' : ''}
                      {atributo.nulable === DESCONOCIDO || atributo.tipoDato === DESCONOCIDO ? ' ?' : ''}
                    </text>
                    {etiqueta && (
                      <text className="clave" x={ancho - 30} y={42 + indice * 15}>
                        {etiqueta}
                      </text>
                    )}
                  </g>
                )
              })}
              {marcadas > 0 && (
                <g className="marcador-marca" transform={`translate(${ancho - 12}, 6)`} onClick={() => tienda.setPestana('revision')}>
                  <circle r={9} />
                  <text textAnchor="middle" y={4}>
                    {marcadas}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {disenoVisible.notas.map((nota: any) => (
          <g
            key={nota.id}
            className="nota-carta"
            data-nota-id={nota.id}
            transform={`translate(${nota.x},${nota.y})`}
          >
            <rect width={nota.ancho} height={nota.alto} rx={6} />
            {textoEnvolvente(nota.texto, 24).map((linea, i) => (
              <text key={i} x={8} y={20 + i * 14}>
                {linea}
              </text>
            ))}
          </g>
        ))}
      </g>
      <text x={10} y={20} fill="#9aa5b8" fontSize={11}>
        {tienda.vista === 'propuesto'
          ? 'Vista propuesta (borrador de la propuesta seleccionada)'
          : `${entidades.length} entidades · ${disenoVisible.relaciones.length} relaciones · zoom ${Math.round(zoom * 100)}%`}
      </text>
    </svg>
  )
}
