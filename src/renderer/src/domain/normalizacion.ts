import {
  Atributo,
  DESCONOCIDO,
  Entidad,
  Proyecto,
  atributosPrimos,
  clavesCandidatas,
  crearAtributo,
  crearEntidad,
  crearRelacion,
  nuevoId
} from './modelo'
import { Operacion } from './operaciones'

export type NivelNormalizacion = '1FN' | '2FN' | '3FN' | 'BCNF'

export type EstadoNivel = 'verificado' | 'problema-posible' | 'informacion-insuficiente'

export interface HallazgoNormalizacion {
  id: string
  nivel: NivelNormalizacion
  estado: EstadoNivel
  entidadId: string | null
  titulo: string
  explicacion: string
  preguntas: string[]
  operacionesSugeridas: Operacion[] | null
  contrapartidas: string[]
}

export interface ResultadoNormalizacion {
  niveles: { nivel: NivelNormalizacion; estado: EstadoNivel }[]
  hallazgos: HallazgoNormalizacion[]
}

interface FD {
  determinante: string[]
  dependientes: string[]
}

function fdsDeEntidad(proyecto: Proyecto, entidad: Entidad): { fds: FD[]; incompletas: boolean } {
  const fds: FD[] = []
  let incompletas = false
  for (const regla of proyecto.reglas) {
    if (regla.dependencia?.entidadId !== entidad.id) continue
    if (
      regla.dependencia.determinanteIds.length === 0 ||
      regla.dependencia.dependientesIds.length === 0
    ) {
      incompletas = true
      continue
    }
    fds.push({
      determinante: [...regla.dependencia.determinanteIds],
      dependientes: [...regla.dependencia.dependientesIds]
    })
  }
  return { fds, incompletas }
}

function cierre(atributos: string[], fds: FD[]): Set<string> {
  const c = new Set(atributos)
  let cambio = true
  while (cambio) {
    cambio = false
    for (const fd of fds) {
      if (fd.determinante.every((a) => c.has(a))) {
        for (const d of fd.dependientes) {
          if (!c.has(d)) {
            c.add(d)
            cambio = true
          }
        }
      }
    }
  }
  return c
}

function esSuperclave(atributos: string[], claveIds: string[], fds: FD[]): boolean {
  const c = cierre(atributos, fds)
  return claveIds.every((k) => c.has(k))
}

function nombreAtributo(entidad: Entidad, id: string): string {
  return entidad.atributos.find((a) => a.id === id)?.nombre ?? id
}

function nombres(entidad: Entidad, ids: string[]): string {
  return ids.map((id) => nombreAtributo(entidad, id)).join(', ')
}

export function analizarNormalizacion(proyecto: Proyecto): ResultadoNormalizacion {
  const hallazgos: HallazgoNormalizacion[] = []
  const estados: Record<NivelNormalizacion, EstadoNivel> = {
    '1FN': 'verificado',
    '2FN': 'verificado',
    '3FN': 'verificado',
    BCNF: 'verificado'
  }

  const marcar = (nivel: NivelNormalizacion, estado: EstadoNivel) => {
    const orden: EstadoNivel[] = ['verificado', 'informacion-insuficiente', 'problema-posible']
    if (orden.indexOf(estado) > orden.indexOf(estados[nivel])) estados[nivel] = estado
  }

  for (const entidad of proyecto.diseno.entidades) {
    if (entidad.atributos.length === 0) continue

    // ── 1FN ──
    const multivalorados = entidad.atributos.filter((a) => a.multivalorado === true)
    const multivaloradosDesconocidos = entidad.atributos.filter((a) => a.multivalorado === DESCONOCIDO)
    const tiposDesconocidos = entidad.atributos.filter((a) => a.tipoDato === DESCONOCIDO)

    if (multivalorados.length > 0) {
      marcar('1FN', 'problema-posible')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '1FN',
        estado: 'problema-posible',
        entidadId: entidad.id,
        titulo: `«${entidad.nombre}» tiene atributos multivalorados`,
        explicacion: `1FN exige valores atómicos. Estos atributos pueden contener varios valores: ${nombres(entidad, multivalorados.map((a) => a.id))}.`,
        preguntas: [],
        operacionesSugeridas: descomponerMultivalorados(entidad, multivalorados),
        contrapartidas: [
          'La descomposición crea entidades nuevas y una relación adicional que debes revisar.',
          'Consulta y modificación pasan a requerir unión de tablas.'
        ]
      })
    } else if (multivaloradosDesconocidos.length > 0) {
      marcar('1FN', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '1FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `No se sabe si «${entidad.nombre}» tiene grupos repetitivos`,
        explicacion: 'El estado multivalorado de algunos atributos es desconocido, por lo que 1FN no puede verificarse por completo.',
        preguntas: multivaloradosDesconocidos.map(
          (a) => `¿El campo «${a.nombre}» de «${entidad.nombre}» puede contener varios valores a la vez?`
        ),
        operacionesSugeridas: null,
        contrapartidas: []
      })
    }

    if (tiposDesconocidos.length > 0) {
      marcar('1FN', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '1FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `Tipo de dato desconocido en «${entidad.nombre}»`,
        explicacion: 'Sin el tipo de dato no puede confirmarse la atomicidad de los valores.',
        preguntas: tiposDesconocidos.map(
          (a) => `¿Qué tipo de dato almacena «${a.nombre}» de «${entidad.nombre}» (texto, entero, fecha…)?`
        ),
        operacionesSugeridas: null,
        contrapartidas: []
      })
    }

    // ── claves candidatas ──
    const candidatas = clavesCandidatas(entidad)
    if (candidatas.length === 0) {
      marcar('2FN', 'informacion-insuficiente')
      marcar('3FN', 'informacion-insuficiente')
      marcar('BCNF', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '2FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `«${entidad.nombre}» no tiene clave declarada`,
        explicacion: 'Sin clave primaria o candidata no es posible evaluar 2FN, 3FN ni BCNF.',
        preguntas: [`¿Qué atributo o combinación de atributos identifica de forma única a cada fila de «${entidad.nombre}»?`],
        operacionesSugeridas: null,
        contrapartidas: []
      })
      continue
    }

    const { fds, incompletas } = fdsDeEntidad(proyecto, entidad)
    const primos = atributosPrimos(entidad)
    const noPrimos = entidad.atributos.filter((a) => !primos.has(a.id))

    // ── 2FN ──
    const compuestas = candidatas.filter((c) => c.atributoIds.length > 1)
    let problema2FN = false
    for (const clave of compuestas) {
      for (const noPrimo of noPrimos) {
        const dependeDeParte = fds.some(
          (fd) =>
            fd.dependientes.includes(noPrimo.id) &&
            fd.determinante.length > 0 &&
            fd.determinante.every((d) => clave.atributoIds.includes(d)) &&
            fd.determinante.length < clave.atributoIds.length
        )
        if (dependeDeParte) {
          problema2FN = true
          hallazgos.push({
            id: nuevoId('n'),
            nivel: '2FN',
            estado: 'problema-posible',
            entidadId: entidad.id,
            titulo: `«${noPrimo.nombre}» depende solo de una parte de la clave en «${entidad.nombre}»`,
            explicacion: `2FN exige que todo atributo no primo dependa de la clave completa. Existe una dependencia declarada hacia un subconjunto de la clave (${nombres(entidad, clave.atributoIds)}).`,
            preguntas: [],
            operacionesSugeridas: descomponer2FN(entidad, clave.atributoIds, noPrimo),
            contrapartidas: [
              'Se crea una entidad nueva para la parte dependiente y se mantiene una relación.',
              'Las consultas que unían todo en una tabla ahora necesitan unir dos.'
            ]
          })
        }
      }
    }
    if (problema2FN) marcar('2FN', 'problema-posible')
    else if (compuestas.length > 0 && (fds.length === 0 || incompletas)) {
      marcar('2FN', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '2FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `Dependencias sin declarar en «${entidad.nombre}»`,
        explicacion: `«${entidad.nombre}» tiene clave compuesta pero no se declararon dependencias funcionales, por lo que 2FN no puede verificarse.`,
        preguntas: compuestas.map((clave) => {
          const partes = clave.atributoIds.map((id) => `«${nombreAtributo(entidad, id)}»`).join(' y ')
          return `¿Hay algún atributo de «${entidad.nombre}» que dependa solo de ${partes} y no de la clave completa?`
        }),
        operacionesSugeridas: null,
        contrapartidas: []
      })
    }

    // ── 3FN y BCNF ──
    if (fds.length > 0) {
      for (const fd of fds) {
        const determinanteEsSuperclave = esSuperclave(fd.determinante, candidatas[0].atributoIds, fds)
        const dependientesPrimos = fd.dependientes.every((d) => primos.has(d))
        const noTrivial = !fd.dependientes.every((d) => fd.determinante.includes(d))
        if (!noTrivial) continue

        if (!determinanteEsSuperclave && !dependientesPrimos) {
          marcar('3FN', 'problema-posible')
          hallazgos.push({
            id: nuevoId('n'),
            nivel: '3FN',
            estado: 'problema-posible',
            entidadId: entidad.id,
            titulo: `Determinante que no es superclave en «${entidad.nombre}»`,
            explicacion: `La dependencia ${nombres(entidad, fd.determinante)} → ${nombres(entidad, fd.dependientes)} tiene un determinante que no es superclave y dependientes no primos (violación de 3FN).`,
            preguntas: [],
            operacionesSugeridas: descomponerTransitiva(entidad, fd.determinante, fd.dependientes),
            contrapartidas: [
              'La información del determinante se separa en su propia entidad.',
              'Puede perderse la preservación de dependencias si hay otras FD que cruzan la división.'
            ]
          })
        } else if (!determinanteEsSuperclave && dependientesPrimos) {
          marcar('BCNF', 'problema-posible')
          hallazgos.push({
            id: nuevoId('n'),
            nivel: 'BCNF',
            estado: 'problema-posible',
            entidadId: entidad.id,
            titulo: `Posible violación de BCNF en «${entidad.nombre}»`,
            explicacion: `La dependencia ${nombres(entidad, fd.determinante)} → ${nombres(entidad, fd.dependientes)} cumple 3FN (dependientes primos) pero su determinante no es superclave, por lo que BCNF no se cumple.`,
            preguntas: [],
            operacionesSugeridas: descomponerTransitiva(entidad, fd.determinante, fd.dependientes),
            contrapartidas: [
              'BCNF puede requerir una descomposición que no preserve dependencias.',
              'Consulta con más uniones.'
            ]
          })
        } else if (!determinanteEsSuperclave) {
          marcar('BCNF', 'problema-posible')
        }
      }
    } else if (noPrimos.length > 0 && incompletas) {
      marcar('3FN', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '3FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `Dependencias incompletas en «${entidad.nombre}»`,
        explicacion: 'Hay dependencias funcionales declaradas de forma incompleta; 3FN y BCNF quedan limitadas.',
        preguntas: noPrimos.slice(0, 5).map(
          (a) => `¿Qué determina exactamente a «${a.nombre}» en «${entidad.nombre}»?`
        ),
        operacionesSugeridas: null,
        contrapartidas: []
      })
    } else if (noPrimos.length > 0 && fds.length === 0 && candidatas.some((c) => c.atributoIds.length > 0)) {
      marcar('3FN', 'informacion-insuficiente')
      marcar('BCNF', 'informacion-insuficiente')
      hallazgos.push({
        id: nuevoId('n'),
        nivel: '3FN',
        estado: 'informacion-insuficiente',
        entidadId: entidad.id,
        titulo: `Sin dependencias declaradas en «${entidad.nombre}»`,
        explicacion: `Hay ${noPrimos.length} atributo(s) no primo(s) pero no se declararon dependencias funcionales; no es posible verificar 3FN ni BCNF.`,
        preguntas: [
          `¿Qué atributos determinan a ${noPrimos.slice(0, 3).map((a) => `«${a.nombre}»`).join(', ')} en «${entidad.nombre}»?`
        ],
        operacionesSugeridas: null,
        contrapartidas: []
      })
    }
  }

  return {
    niveles: (['1FN', '2FN', '3FN', 'BCNF'] as NivelNormalizacion[]).map((nivel) => ({
      nivel,
      estado: estados[nivel]
    })),
    hallazgos
  }
}

function descomponerMultivalorados(entidad: Entidad, multivalorados: Atributo[]): Operacion[] {
  const ops: Operacion[] = []
  let posicionDerecha = entidad.x + entidad.ancho + 80
  for (const atributo of multivalorados) {
    const nueva = crearEntidad(`${entidad.nombre}_${atributo.nombre}`, posicionDerecha, entidad.y)
    const attrId = nuevoId('a')
    ops.push({
      op: 'addEntidad',
      entidad: {
        ...nueva,
        atributos: [
          { ...crearAtributo(atributo.nombre), id: attrId },
          { ...crearAtributo(`${entidad.nombre}_id`), id: nuevoId('a') }
        ],
        claves: [
          {
            id: nuevoId('k'),
            nombre: `pk_${nueva.nombre}`,
            tipo: 'primaria',
            atributoIds: [attrId],
            foranea: null
          }
        ]
      }
    })
    const relacion = crearRelacion(entidad.id, nueva.id)
    relacion.nombre = `tiene_${atributo.nombre}`
    ops.push({ op: 'addRelacion', relacion })
    ops.push({ op: 'removeAtributo', entidadId: entidad.id, id: atributo.id })
    posicionDerecha += 260
  }
  return ops
}

function descomponer2FN(entidad: Entidad, claveParteIds: string[], dependiente: Atributo): Operacion[] {
  const nueva = crearEntidad(dependiente.nombre, entidad.x + entidad.ancho + 80, entidad.y + 40)
  const attrParte = { ...crearAtributo(nombreAtributo(entidad, claveParteIds[0])), id: nuevoId('a') }
  const attrValor = { ...crearAtributo(dependiente.nombre), id: nuevoId('a') }
  return [
    {
      op: 'addEntidad',
      entidad: {
        ...nueva,
        atributos: [attrParte, attrValor],
        claves: [
          {
            id: nuevoId('k'),
            nombre: `pk_${nueva.nombre}`,
            tipo: 'primaria',
            atributoIds: [attrParte.id, attrValor.id],
            foranea: null
          }
        ]
      }
    },
    { op: 'addRelacion', relacion: crearRelacion(entidad.id, nueva.id) },
    { op: 'removeAtributo', entidadId: entidad.id, id: dependiente.id }
  ]
}

function descomponerTransitiva(entidad: Entidad, determinanteIds: string[], dependientesIds: string[]): Operacion[] {
  const nueva = crearEntidad(
    nombreAtributo(entidad, determinanteIds[0]),
    entidad.x + entidad.ancho + 80,
    entidad.y + 120
  )
  const attrs = determinanteIds.map((id) => ({
    ...crearAtributo(nombreAtributo(entidad, id)),
    id: nuevoId('a')
  }))
  const attrsDep = dependientesIds.map((id) => ({
    ...crearAtributo(nombreAtributo(entidad, id)),
    id: nuevoId('a')
  }))
  return [
    {
      op: 'addEntidad',
      entidad: {
        ...nueva,
        atributos: [...attrs, ...attrsDep],
        claves: [
          {
            id: nuevoId('k'),
            nombre: `pk_${nueva.nombre}`,
            tipo: 'primaria',
            atributoIds: attrs.map((a) => a.id),
            foranea: null
          }
        ]
      }
    },
    { op: 'addRelacion', relacion: crearRelacion(entidad.id, nueva.id) },
    ...dependientesIds.map((id) => ({ op: 'removeAtributo' as const, entidadId: entidad.id, id }))
  ]
}
