import { Proyecto, hallarEntidad, Cardinalidad } from './modelo'

export type Severidad = 'error' | 'aviso' | 'info'

export interface HallazgoLocal {
  id: string
  severidad: Severidad
  codigo: string
  mensaje: string
  explicacion: string
  elementos: { tipo: 'entidad' | 'atributo' | 'relacion' | 'clave' | 'regla'; id: string }[]
}

let contadorHallazgo = 0
function idHallazgo(codigo: string): string {
  contadorHallazgo += 1
  return `${codigo}-${contadorHallazgo}`
}

export function validarProyecto(proyecto: Proyecto): HallazgoLocal[] {
  const hallazgos: HallazgoLocal[] = []
  const { diseno } = proyecto
  const idsEntidades = new Set(diseno.entidades.map((e) => e.id))

  for (const entidad of diseno.entidades) {
    const nombresAtributos = new Map<string, string[]>()
    for (const atributo of entidad.atributos) {
      const clave = atributo.nombre.trim().toLowerCase()
      if (!nombresAtributos.has(clave)) nombresAtributos.set(clave, [])
      nombresAtributos.get(clave)!.push(atributo.id)
    }
    for (const [, ids] of nombresAtributos) {
      if (ids.length > 1) {
        hallazgos.push({
          id: idHallazgo('dup-attr'),
          severidad: 'aviso',
          codigo: 'atributo-duplicado',
          mensaje: `«${entidad.nombre}» tiene atributos con el mismo nombre`,
          explicacion: 'Los nombres de atributos deben ser únicos dentro de una entidad para evitar ambigüedad.',
          elementos: ids.map((id) => ({ tipo: 'atributo' as const, id }))
        })
      }
    }

    if (entidad.atributos.length > 0 && entidad.claves.filter((c) => c.tipo === 'primaria').length === 0) {
      hallazgos.push({
        id: idHallazgo('sin-pk'),
        severidad: 'aviso',
        codigo: 'sin-clave-primaria',
        mensaje: `«${entidad.nombre}» no tiene clave primaria`,
        explicacion: 'Sin clave primaria no se puede identificar de forma única cada fila de la entidad.',
        elementos: [{ tipo: 'entidad', id: entidad.id }]
      })
    }

    if (entidad.claves.filter(c => c.tipo === 'primaria').length > 1) {
      hallazgos.push({ id: idHallazgo('pk-multiple'), severidad: 'error', codigo: 'primarias-multiples', mensaje: `«${entidad.nombre}» tiene varias claves primarias`, explicacion: 'Una clave primaria compuesta debe ser una sola restricción con varios atributos. Revisa las claves importadas.', elementos: [{ tipo: 'entidad', id: entidad.id }] })
    }
    for (const clave of entidad.claves) {
      for (const atributoId of clave.atributoIds) {
        if (!entidad.atributos.some((a) => a.id === atributoId)) {
          hallazgos.push({
            id: idHallazgo('clave-rota'),
            severidad: 'error',
            codigo: 'clave-atributo-inexistente',
            mensaje: `La clave «${clave.nombre || clave.tipo}» de «${entidad.nombre}» referencia un atributo inexistente`,
            explicacion: 'La estructura de la clave quedó rota. Restaura la clave o corrige sus atributos.',
            elementos: [
              { tipo: 'clave', id: clave.id },
              { tipo: 'entidad', id: entidad.id }
            ]
          })
        }
      }
      if (clave.tipo === 'foranea') {
        if (!clave.atributoIds.length || !clave.foranea?.claveDestinoIds.length) {
          hallazgos.push({ id: idHallazgo('fk-incompleta'), severidad: 'error', codigo: 'foranea-incompleta', mensaje: `La clave foránea de «${entidad.nombre}» está incompleta`, explicacion: 'Selecciona las columnas origen y una clave destino antes de usar esta restricción.', elementos: [{ tipo: 'clave', id: clave.id }] })
        }
        if (!clave.foranea) {
          hallazgos.push({
            id: idHallazgo('fk-sin-destino'),
            severidad: 'error',
            codigo: 'foranea-sin-destino',
            mensaje: `La clave foránea de «${entidad.nombre}» no tiene entidad destino`,
            explicacion: 'Una clave foránea debe indicar la entidad y la clave destino de la relación.',
            elementos: [{ tipo: 'clave', id: clave.id }]
          })
        } else {
          if (!idsEntidades.has(clave.foranea.entidadDestinoId)) {
            hallazgos.push({
              id: idHallazgo('fk-destino-rota'),
              severidad: 'error',
              codigo: 'foranea-destino-inexistente',
              mensaje: `La clave foránea de «${entidad.nombre}» apunta a una entidad que ya no existe`,
              explicacion: 'La referencia quedó rota tras un cambio en el diseño.',
              elementos: [{ tipo: 'clave', id: clave.id }]
            })
          } else {
            const destino = hallarEntidad(diseno, clave.foranea.entidadDestinoId)!
            for (const claveDestinoId of clave.foranea.claveDestinoIds) {
              if (!destino.claves.some((c) => c.id === claveDestinoId)) {
                hallazgos.push({
                  id: idHallazgo('fk-clave-rota'),
                  severidad: 'error',
                  codigo: 'foranea-clave-inexistente',
                  mensaje: `La clave foránea de «${entidad.nombre}» referencia una clave inexistente en «${destino.nombre}»`,
                  explicacion: 'Se perdió la clave destino de la referencia.',
                  elementos: [{ tipo: 'clave', id: clave.id }]
                })
              }
            }
          }
        }
      }
    }
  }

  for (const relacion of diseno.relaciones) {
    const extremos = [relacion.inicio, relacion.fin]
    for (const extremo of extremos) {
      if (!idsEntidades.has(extremo.entidadId)) {
        hallazgos.push({
          id: idHallazgo('rel-extremo'),
          severidad: 'error',
          codigo: 'relacion-extremo-inexistente',
          mensaje: 'Una relación tiene un extremo cuya entidad ya no existe',
          explicacion: 'La relación quedó incompleta y debe corregirse o eliminarse.',
          elementos: [{ tipo: 'relacion', id: relacion.id }]
        })
      }
    }
    if (relacion.inicio.entidadId === relacion.fin.entidadId && cardinalidadDesconocida(relacion.inicio.cardinalidad)) {
      hallazgos.push({
        id: idHallazgo('rel-auto-des'),
        severidad: 'aviso',
        codigo: 'relacion-autoreferencia-desconocida',
        mensaje: 'Relación de auto-referencia con cardinalidades sin definir',
        explicacion: 'Define las cardinalidades para que la relación de auto-referencia sea interpretable.',
        elementos: [{ tipo: 'relacion', id: relacion.id }]
      })
    }
    const extremosDesconocidos = extremos.filter((extremo) =>
      cardinalidadDesconocida(extremo.cardinalidad)
    )
    if (extremosDesconocidos.length === 2) {
      hallazgos.push({
        id: idHallazgo('rel-sin-card'),
        severidad: 'info',
        codigo: 'relacion-sin-cardinalidad',
        mensaje: 'Relación sin cardinalidades definidas',
        explicacion: 'Completa la cardinalidad mínima y máxima en ambos extremos para poder revisar la estructura.',
        elementos: [{ tipo: 'relacion', id: relacion.id }]
      })
    }
    const a = hallarEntidad(diseno, relacion.inicio.entidadId)
    const b = hallarEntidad(diseno, relacion.fin.entidadId)
    if (a && b && a.id !== b.id) {
      const duplicada = diseno.relaciones.some(
        (r) =>
          r.id !== relacion.id &&
          ((r.inicio.entidadId === a.id && r.fin.entidadId === b.id) ||
            (r.inicio.entidadId === b.id && r.fin.entidadId === a.id))
      )
      if (duplicada) {
        hallazgos.push({
          id: idHallazgo('rel-dup'),
          severidad: 'aviso',
          codigo: 'relacion-duplicada',
          mensaje: `Hay más de una relación entre «${a.nombre}» y «${b.nombre}»`,
          explicacion: 'Verifica si son relaciones distintas o una duplicación accidental.',
          elementos: [{ tipo: 'relacion', id: relacion.id }]
        })
      }
    }
  }

  for (const regla of proyecto.reglas) {
    if (regla.dependencia) {
      const entidad = hallarEntidad(diseno, regla.dependencia.entidadId)
      if (!entidad) {
        hallazgos.push({
          id: idHallazgo('dep-entidad'),
          severidad: 'error',
          codigo: 'dependencia-entidad-inexistente',
          mensaje: 'Una dependencia funcional apunta a una entidad inexistente',
          explicacion: 'La regla quedó huérfana tras cambios en el diseño.',
          elementos: [{ tipo: 'regla', id: regla.id }]
        })
        continue
      }
      const idsValidos = new Set(entidad.atributos.map((a) => a.id))
      const rotos = [
        ...regla.dependencia.determinanteIds,
        ...regla.dependencia.dependientesIds
      ].filter((id) => !idsValidos.has(id))
      if (rotos.length > 0) {
        hallazgos.push({
          id: idHallazgo('dep-attr'),
          severidad: 'error',
          codigo: 'dependencia-atributo-inexistente',
          mensaje: `La dependencia funcional sobre «${entidad.nombre}» referencia atributos inexistentes`,
          explicacion: 'Corrige o elimina la dependencia para que el análisis sea fiable.',
          elementos: [{ tipo: 'regla', id: regla.id }]
        })
      }
    }
  }

  const desconc = contarDesconocidos(proyecto)
  if (desconc.total > 0) {
    hallazgos.push({
      id: idHallazgo('desconocidos'),
      severidad: 'info',
      codigo: 'informacion-desconocida',
      mensaje: `${desconc.total} elemento(s) con información desconocida`,
      explicacion:
        'La revisión queda limitada por estos valores desconocidos: ' +
        (desconc.detalles.slice(0, 6).join(', ') || '—'),
      elementos: []
    })
  }

  return hallazgos
}

function cardinalidadDesconocida(c: Cardinalidad): boolean {
  return c.minimo === 'desconocido' || c.maximo === 'desconocido'
}

function contarDesconocidos(proyecto: Proyecto): { total: number; detalles: string[] } {
  let total = 0
  const detalles: string[] = []
  for (const entidad of proyecto.diseno.entidades) {
    for (const atributo of entidad.atributos) {
      for (const [campo, valor] of Object.entries({
        tipo: atributo.tipoDato,
        nulable: atributo.nulable,
        único: atributo.unico,
        multivalorado: atributo.multivalorado
      })) {
        if (valor === 'desconocido') {
          total += 1
          if (detalles.length < 12) detalles.push(`${entidad.nombre}.${atributo.nombre} (${campo})`)
        }
      }
    }
  }
  for (const relacion of proyecto.diseno.relaciones) {
    for (const extremo of [relacion.inicio, relacion.fin]) {
      const c = extremo.cardinalidad
      if (c.minimo === 'desconocido' || c.maximo === 'desconocido' || extremo.participacion === 'desconocido') {
        total += 1
        if (detalles.length < 12) {
          const nombre = hallarEntidad(proyecto.diseno, extremo.entidadId)?.nombre ?? extremo.entidadId
          detalles.push(`relación → ${nombre} (cardinalidad)`)
        }
      }
    }
  }
  return { total, detalles }
}
