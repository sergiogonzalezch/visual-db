import { Diseno, Entidad, Proyecto, ReglaNegocio, Relacion, Nota } from './modelo'
import { Operacion } from './operaciones'

export type CategoriaPropuesta =
  | 'normalizacion'
  | 'integridad'
  | 'modelado'
  | 'ambiguedad'
  | 'otro'

export type PrioridadPropuesta = 'alta' | 'media' | 'baja'

export type EstadoPropuesta = 'pendiente' | 'aceptada' | 'rechazada' | 'desactualizada' | 'aplicada'

export interface Afectado {
  tipo: 'entidad' | 'atributo' | 'relacion' | 'regla' | 'nota'
  id: string
  huella: string
  entidadId?: string
}

export interface Propuesta {
  id: string
  versionOrigen: number
  afectados: Afectado[]
  categoria: CategoriaPropuesta
  prioridad: PrioridadPropuesta
  titulo: string
  explicacion: string
  fundamento: string
  supuestos: string[]
  preguntas: string[]
  operaciones: Operacion[]
  resultado: string
  contrapartidas: string[]
  dependeDe: string[]
  version: number
  estado: EstadoPropuesta
  creadaEn: string
  decididaEn: string | null
  notaDecision: string | null
  origenIA?: { proveedor: string; modelo: string }
}

export function huellaEntidad(entidad: Entidad): string {
  return JSON.stringify({
    n: entidad.nombre,
    d: entidad.descripcion,
    a: entidad.atributos.map((a) => [
      a.id,
      a.nombre,
      a.descripcion,
      a.tipoDato,
      a.nulable,
      a.unico,
      a.multivalorado
    ]),
    k: entidad.claves.map((c) => [c.id, c.nombre, c.tipo, c.atributoIds, c.foranea])
  })
}

export function huellaRelacion(relacion: Relacion): string {
  return JSON.stringify({
    n: relacion.nombre,
    i: [relacion.inicio.entidadId, relacion.inicio.cardinalidad, relacion.inicio.participacion],
    f: [relacion.fin.entidadId, relacion.fin.cardinalidad, relacion.fin.participacion],
    a: relacion.atributos.map((a) => [a.id, a.nombre, a.tipoDato, a.nulable, a.multivalorado])
  })
}

export function huellaRegla(regla: ReglaNegocio): string {
  return JSON.stringify([regla.tipo, regla.texto, regla.dependencia])
}

export function huellaNota(nota: Nota): string {
  return JSON.stringify([nota.texto, nota.x, nota.y])
}

export function huellasDiseno(diseno: Diseno, reglas: ReglaNegocio[]): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const entidad of diseno.entidades) {
    mapa.set(`entidad:${entidad.id}`, huellaEntidad(entidad))
    for (const atributo of entidad.atributos) {
      mapa.set(
        `atributo:${entidad.id}:${atributo.id}`,
        JSON.stringify([
          atributo.nombre,
          atributo.descripcion,
          atributo.tipoDato,
          atributo.nulable,
          atributo.unico,
          atributo.multivalorado
        ])
      )
    }
  }
  for (const relacion of diseno.relaciones) {
    mapa.set(`relacion:${relacion.id}`, huellaRelacion(relacion))
  }
  for (const regla of reglas) {
    mapa.set(`regla:${regla.id}`, huellaRegla(regla))
  }
  for (const nota of diseno.notas) {
    mapa.set(`nota:${nota.id}`, huellaNota(nota))
  }
  return mapa
}

export function afectadosDeOperaciones(operaciones: Operacion[], diseno: Diseno, reglas: ReglaNegocio[]): Afectado[] {
  const mapa = huellasDiseno(diseno, reglas)
  const claves = new Set<string>()
  for (const op of operaciones) {
    switch (op.op) {
      case 'addEntidad':
        claves.add(`entidad:${op.entidad.id}`)
        break
      case 'updateEntidad':
      case 'moverEntidad':
      case 'redimensionarEntidad':
      case 'removeEntidad':
        claves.add(`entidad:${op.id}`)
        break
      case 'addAtributo':
        claves.add(`entidad:${op.entidadId}`)
        claves.add(`atributo:${op.entidadId}:${op.atributo.id}`)
        break
      case 'updateAtributo':
      case 'removeAtributo':
        claves.add(`entidad:${op.entidadId}`)
        claves.add(`atributo:${op.entidadId}:${op.id}`)
        break
      case 'addClave':
        claves.add(`entidad:${op.entidadId}`)
        break
      case 'updateClave':
      case 'removeClave':
        claves.add(`entidad:${op.entidadId}`)
        break
      case 'addRelacion':
        claves.add(`relacion:${op.relacion.id}`)
        break
      case 'updateRelacion':
      case 'removeRelacion':
        claves.add(`relacion:${op.id}`)
        break
      case 'addAtributoRelacion':
        claves.add(`relacion:${op.relacionId}`)
        break
      case 'updateAtributoRelacion':
      case 'removeAtributoRelacion':
        claves.add(`relacion:${op.relacionId}`)
        break
      case 'addNota':
        claves.add(`nota:${op.nota.id}`)
        break
      case 'updateNota':
      case 'removeNota':
        claves.add(`nota:${op.id}`)
        break
      case 'addRegla':
        claves.add(`regla:${op.regla.id}`)
        break
      case 'updateRegla':
      case 'removeRegla':
        claves.add(`regla:${op.id}`)
        break
    }
  }
  const afectados: Afectado[] = []
  for (const clave of [...claves].sort()) {
    const separada = clave.split(':')
    const tipo = separada[0]
    const id = separada[separada.length - 1]
    if (tipo === 'entidad' && !mapa.has(clave)) {
      if (!diseno.entidades.some((e) => e.id === id)) continue
    }
    afectados.push({
      tipo: tipo as Afectado['tipo'],
      id,
      ...(tipo === 'atributo' ? { entidadId: separada.slice(1, -1).join(':') } : {}),
      huella: mapa.get(clave) ?? ''
    })
  }
  return afectados
}

export interface ComprobacionPropuesta {
  aplicable: boolean
  motivos: string[]
  dependenciasIncumplidas: string[]
}

export function comprobarPropuesta(proyecto: Proyecto, propuesta: Propuesta): ComprobacionPropuesta {
  const motivos: string[] = []
  const mapa = huellasDiseno(proyecto.diseno, proyecto.reglas)

  if (propuesta.estado === 'aplicada' || propuesta.estado === 'aceptada') {
    motivos.push('La propuesta ya fue aplicada.')
  }
  if (propuesta.estado === 'rechazada') {
    motivos.push('La propuesta fue rechazada.')
  }

  for (const afectado of propuesta.afectados) {
    const clave = claveAfectado(afectado, propuesta)
    const actual = mapa.get(clave)
    if (actual === undefined) {
      if (afectado.huella === '') continue
      motivos.push(`El elemento afectado ya no existe (${afectado.tipo} «${nombreElemento(proyecto, afectado)}»).`)
      continue
    }
    if (actual !== afectado.huella) {
      motivos.push(`El ${afectado.tipo} «${nombreElemento(proyecto, afectado)}» cambió desde que se creó la propuesta.`)
    }
  }

  const dependenciasIncumplidas = propuesta.dependeDe.filter((id) => {
    const dep = proyecto.propuestas?.find((p) => p.id === id)
    return !dep || dep.estado !== 'aplicada'
  })
  if (dependenciasIncumplidas.length > 0) {
    motivos.push(
      `Depende de ${dependenciasIncumplidas.length} propuesta(s) aún no aplicada(s).`
    )
  }

  return { aplicable: motivos.length === 0, motivos, dependenciasIncumplidas }
}

function claveAfectado(afectado: Afectado, propuesta: Propuesta): string {
  if (afectado.tipo === 'atributo') {
    // Archivos anteriores: recuperar el propietario desde las operaciones, nunca por coincidencia global.
    const propietarios = new Set(propuesta.operaciones.flatMap(op =>
      (op.op === 'updateAtributo' || op.op === 'removeAtributo') && op.id === afectado.id
        ? [op.entidadId]
        : op.op === 'addAtributo' && op.atributo.id === afectado.id ? [op.entidadId] : []))
    const entidadId = afectado.entidadId ?? (propietarios.size === 1 ? [...propietarios][0] : undefined)
    return `atributo:${entidadId ?? 'identidad-ambigua'}:${afectado.id}`
  }
  return `${afectado.tipo}:${afectado.id}`
}

function nombreElemento(proyecto: Proyecto, afectado: Afectado): string {
  if (afectado.tipo === 'atributo') {
    const entidad = proyecto.diseno.entidades.find(e => (!afectado.entidadId || e.id === afectado.entidadId) && e.atributos.some(a => a.id === afectado.id))
    return entidad ? `${entidad.nombre}.${entidad.atributos.find(a => a.id === afectado.id)!.nombre}` : afectado.id
  }
  if (afectado.tipo === 'entidad') {
    return proyecto.diseno.entidades.find((e) => e.id === afectado.id)?.nombre ?? afectado.id
  }
  if (afectado.tipo === 'relacion') {
    const r = proyecto.diseno.relaciones.find((x) => x.id === afectado.id)
    if (!r) return afectado.id
    const a = proyecto.diseno.entidades.find((e) => e.id === r.inicio.entidadId)?.nombre ?? '?'
    const b = proyecto.diseno.entidades.find((e) => e.id === r.fin.entidadId)?.nombre ?? '?'
    return `${a}–${b}`
  }
  return afectado.id
}
