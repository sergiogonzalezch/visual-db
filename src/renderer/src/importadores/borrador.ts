import {
  Ambiguedad,
  DESCONOCIDO,
  Desconocible,
  Proyecto,
  crearAtributo,
  crearEntidad,
  crearProyectoVacio,
  crearRelacion,
  nuevoId
} from '../domain/modelo'
import { Operacion } from '../domain/operaciones'

export interface BorradorAtributo {
  nombre: string
  clave: 'primaria' | 'candidata' | 'foranea' | 'ninguna'
}

export interface BorradorEntidad {
  nombre: string
  x: number
  y: number
  atributos: BorradorAtributo[]
}

export interface BorradorRelacion {
  origenNombre: string
  destinoNombre: string
  etiqueta: string | null
  cardOrigen: string | null
  cardDestino: string | null
}

export interface BorradorRegla {
  texto: string
  fragmento: string | null
}

export interface BorradorAmbiguedad {
  pregunta: string
  tipo: Ambiguedad['tipo']
  afectaA: string | null
}

export interface BorradorProyecto {
  resumen: string
  procedenciaArchivo: string
  procedenciaImportador: 'drawio' | 'imagen' | 'markdown'
  pagina: string | null
  entidades: BorradorEntidad[]
  relaciones: BorradorRelacion[]
  reglas: BorradorRegla[]
  ambiguidades: BorradorAmbiguedad[]
  advertencias: string[]
  figurasSinClasificar: { texto: string }[]
  imagenBase64: string | null
}

export interface ConversionBorrador {
  proyecto: Proyecto
  operaciones: Operacion[]
}

function minimoDe(cadena: string | null): Desconocible<0 | 1> {
  if (!cadena) return DESCONOCIDO
  if (cadena.startsWith('0')) return 0
  if (cadena === '1') return 1
  return DESCONOCIDO
}

function maximoDe(cadena: string | null): Desconocible<1 | 'n'> {
  if (!cadena) return DESCONOCIDO
  if (/^n|^\*|m/i.test(cadena)) return 'n'
  if (cadena.includes('1')) return 1
  return DESCONOCIDO
}

export function borradorAProyecto(borrador: BorradorProyecto, nombreProyecto: string): ConversionBorrador {
  const proyecto = crearProyectoVacio(nombreProyecto)
  proyecto.revision = {
    interpretacion: 'confirmada',
    ambiguidades: [],
    figurasSinClasificar: []
  }

  proyecto.procedencia = {
    importador: borrador.procedenciaImportador,
    archivo: borrador.procedenciaArchivo,
    pagina: borrador.pagina,
    fragmentos: borrador.reglas
      .filter((r) => r.fragmento)
      .map((r, i) => ({ referencia: `fragmento-${i + 1}`, contenido: r.fragmento! }))
  }

  const operaciones: Operacion[] = []
  const entidadesCreadas: { nombre: string; id: string }[] = []

  const baseX = borrador.entidades.length > 0 ? Math.min(...borrador.entidades.map((e) => e.x)) : 0
  const baseY = borrador.entidades.length > 0 ? Math.min(...borrador.entidades.map((e) => e.y)) : 0

  borrador.entidades.forEach((borradorEntidad, indice) => {
    const x = Number.isFinite(borradorEntidad.x) ? borradorEntidad.x - baseX + 60 : 60 + (indice % 4) * 280
    const y = Number.isFinite(borradorEntidad.y) ? borradorEntidad.y - baseY + 60 : 60 + Math.floor(indice / 4) * 220
    const entidad = crearEntidad(borradorEntidad.nombre || `Entidad ${indice + 1}`, x, y)
    for (const borradorAtributo of borradorEntidad.atributos) {
      const atributo = crearAtributo(borradorAtributo.nombre || 'atributo')
      entidad.atributos.push(atributo)
      if (borradorAtributo.clave === 'primaria') {
        entidad.claves.push({
          id: nuevoId('k'),
          nombre: `pk_${atributo.nombre}`,
          tipo: 'primaria',
          atributoIds: [atributo.id],
          foranea: null
        })
      } else if (borradorAtributo.clave === 'candidata') {
        entidad.claves.push({
          id: nuevoId('k'),
          nombre: `uk_${atributo.nombre}`,
          tipo: 'candidata',
          atributoIds: [atributo.id],
          foranea: null
        })
      }
    }
    proyecto.diseno.entidades.push(entidad)
    entidadesCreadas.push({ nombre: borradorEntidad.nombre.trim().toLowerCase(), id: entidad.id })
  })

  const buscarEntidad = (nombre: string): string | null => {
    const limpio = nombre.trim().toLowerCase()
    const coincide = entidadesCreadas.find((e) => e.nombre === limpio)
    if (coincide) return coincide.id
    const parcial = entidadesCreadas.find((e) => e.nombre.includes(limpio) || limpio.includes(e.nombre))
    return parcial?.id ?? null
  }

  borrador.relaciones.forEach((borradorRelacion, indice) => {
    const origenId = buscarEntidad(borradorRelacion.origenNombre)
    const destinoId = buscarEntidad(borradorRelacion.destinoNombre)
    if (!origenId || !destinoId) {
      proyecto.revision.ambiguidades.push({
        id: nuevoId('amb'),
        tipo: 'semantica',
        pregunta: `No se pudo ubicar la relación ${borradorRelacion.origenNombre} — ${borradorRelacion.destinoNombre} en el diseño. ¿Qué entidades intervienen?`,
        destino: { tipo: 'relacion', id: null },
        acciones: [
          { accion: 'excluir', etiqueta: 'Excluir del diseño' },
          { accion: 'desconocida', etiqueta: 'Conservar como desconocida' }
        ],
        resolucion: null
      })
      return
    }
    const relacion = crearRelacion(origenId, destinoId)
    relacion.nombre = borradorRelacion.etiqueta || null
    relacion.inicio.cardinalidad = {
      minimo: minimoDe(borradorRelacion.cardOrigen),
      maximo: maximoDe(borradorRelacion.cardOrigen)
    }
    relacion.fin.cardinalidad = {
      minimo: minimoDe(borradorRelacion.cardDestino),
      maximo: maximoDe(borradorRelacion.cardDestino)
    }
    proyecto.diseno.relaciones.push(relacion)
    void indice
  })

  for (const borradorRegla of borrador.reglas) {
    proyecto.reglas.push({
      id: nuevoId('reg'),
      tipo: 'negocio',
      texto: borradorRegla.texto,
      dependencia: null,
      fragmentoOrigen: borradorRegla.fragmento
    })
  }

  for (const ambiguedad of borrador.ambiguidades) {
    proyecto.revision.ambiguidades.push({
      id: nuevoId('amb'),
      tipo: ambiguedad.tipo,
      pregunta: ambiguedad.pregunta,
      destino: { tipo: 'entidad', id: null },
      acciones: [
        { accion: 'desconocida', etiqueta: 'Conservar como desconocida' },
        { accion: 'excluir', etiqueta: 'Excluir del diseño' }
      ],
      resolucion: null
    })
  }

  for (const advertencia of borrador.advertencias) {
    proyecto.revision.ambiguidades.push({
      id: nuevoId('amb'),
      tipo: 'lectura',
      pregunta: advertencia,
      destino: { tipo: 'figura', id: null },
      acciones: [
        { accion: 'desconocida', etiqueta: 'Conservar como desconocida' },
        { accion: 'excluir', etiqueta: 'Excluir del diseño' }
      ],
      resolucion: null
    })
  }

  for (const figura of borrador.figurasSinClasificar) {
    proyecto.revision.figurasSinClasificar.push({
      id: nuevoId('fig'),
      texto: figura.texto,
      tipoSugerido: null
    })
  }

  if (borrador.imagenBase64) {
    proyecto.desconocidos.push('Imagen original disponible como referencia (adjunto no persistente en el MVP).')
  }

  const hayPendientes =
    proyecto.revision.ambiguidades.length > 0 ||
    proyecto.revision.figurasSinClasificar.length > 0 ||
    borrador.advertencias.length > 0 ||
    borrador.ambiguidades.length > 0

  proyecto.revision.interpretacion = hayPendientes ? 'pendiente' : 'confirmada'
  proyecto.versionDiseno = 1

  return { proyecto, operaciones }
}

export function ambiguidadesResueltas(proyecto: Proyecto): boolean {
  return proyecto.revision.ambiguidades.every((a) => a.resolucion !== null)
}

function textoDe(valor: unknown): string {
  return typeof valor === 'string' ? valor : ''
}

function listaDe(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

function claveDe(valor: unknown): BorradorAtributo['clave'] {
  const texto = textoDe(valor).toLowerCase()
  if (texto.includes('prim') || texto === 'pk') return 'primaria'
  if (texto.includes('foran') || texto === 'fk') return 'foranea'
  if (texto.includes('candid') || texto === 'uk' || texto === 'ak') return 'candidata'
  return 'ninguna'
}

export function borradorIABorrador(
  datos: {
    resumen?: string
    entidades?: unknown[]
    relaciones?: unknown[]
    reglas?: unknown[]
    ambiguidades?: unknown[]
  },
  opciones: {
    archivo: string
    importador: 'imagen' | 'markdown'
    imagenBase64: string | null
  }
): BorradorProyecto {
  const entidades: BorradorEntidad[] = listaDe(datos.entidades).map((entidad, i) => {
    const e = (entidad ?? {}) as Record<string, unknown>
    return {
      nombre: textoDe(e.nombre) || textoDe(e.name) || `Entidad ${i + 1}`,
      x: typeof e.x === 'number' ? e.x : 60 + (i % 4) * 280,
      y: typeof e.y === 'number' ? e.y : 60 + Math.floor(i / 4) * 220,
      atributos: listaDe(e.atributos).map((atributo) => {
        const a = (atributo ?? {}) as Record<string, unknown>
        return {
          nombre: textoDe(a.nombre) || textoDe(a.name) || 'atributo',
          clave: claveDe(a.clave ?? a.tipo ?? a.key)
        }
      })
    }
  })

  const relaciones: BorradorRelacion[] = listaDe(datos.relaciones).map((relacion) => {
    const r = (relacion ?? {}) as Record<string, unknown>
    return {
      origenNombre:
        textoDe(r.origenNombre) || textoDe(r.origen) || textoDe(r.entidadOrigen) || textoDe(r.source),
      destinoNombre:
        textoDe(r.destinoNombre) || textoDe(r.destino) || textoDe(r.entidadDestino) || textoDe(r.target),
      etiqueta: textoDe(r.etiqueta) || textoDe(r.nombre) || textoDe(r.label) || null,
      cardOrigen: textoDe(r.cardOrigen) || textoDe(r.cardinalidadOrigen) || null,
      cardDestino: textoDe(r.cardDestino) || textoDe(r.cardinalidadDestino) || null
    }
  }).filter((r) => r.origenNombre !== '' && r.destinoNombre !== '')

  const reglas: BorradorRegla[] = listaDe(datos.reglas).map((regla) => {
    const r = (regla ?? {}) as Record<string, unknown>
    return {
      texto: textoDe(r.texto) || textoDe(r.descripcion) || JSON.stringify(r).slice(0, 200),
      fragmento: textoDe(r.fragmento) || textoDe(r.origen) || null
    }
  })

  const ambiguidades: BorradorAmbiguedad[] = listaDe(datos.ambiguidades).map((ambiguedad) => {
    const a = (ambiguedad ?? {}) as Record<string, unknown>
    const tipoTexto = textoDe(a.tipo).toLowerCase()
    const tipo =
      tipoTexto.includes('lect') ? 'lectura' : tipoTexto.includes('aus') ? 'ausencia' : 'semantica'
    return {
      pregunta: textoDe(a.pregunta) || textoDe(a.texto) || textoDe(a.explicacion) || 'Elemento dudoso en la interpretación.',
      tipo,
      afectaA: textoDe(a.afectaA) || textoDe(a.elemento) || null
    }
  })

  return {
    resumen: textoDe(datos.resumen) || 'Interpretación del proveedor de IA.',
    procedenciaArchivo: opciones.archivo,
    procedenciaImportador: opciones.importador,
    pagina: null,
    entidades,
    relaciones,
    reglas,
    ambiguidades,
    advertencias: [],
    figurasSinClasificar: [],
    imagenBase64: opciones.imagenBase64
  }
}
