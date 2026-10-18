export const DESCONOCIDO = 'desconocido' as const

export type Desconocible<T> = T | typeof DESCONOCIDO

export type Id = string

import type { Propuesta } from './propuestas'

let contador = 0
export function nuevoId(prefijo = 'x'): Id {
  contador += 1
  return `${prefijo}-${Date.now().toString(36)}-${contador}-${Math.random().toString(36).slice(2, 7)}`
}

export interface Atributo {
  id: Id
  nombre: string
  descripcion: string | null
  tipoDato: Desconocible<string>
  nulable: Desconocible<boolean>
  unico: Desconocible<boolean>
  multivalorado: Desconocible<boolean>
}

export type TipoClave = 'primaria' | 'candidata' | 'foranea'

export interface ClaveForanea {
  entidadDestinoId: Id
  claveDestinoIds: Id[]
  relacionId: Id | null
}

export interface Clave {
  id: Id
  nombre: string
  tipo: TipoClave
  atributoIds: Id[]
  foranea: ClaveForanea | null
}

export interface Entidad {
  id: Id
  nombre: string
  descripcion: string | null
  atributos: Atributo[]
  claves: Clave[]
  x: number
  y: number
  ancho: number
  alto: number
}

export interface Cardinalidad {
  minimo: Desconocible<0 | 1>
  maximo: Desconocible<1 | 'n'>
}

export interface ExtremoRelacion {
  entidadId: Id
  cardinalidad: Cardinalidad
  participacion: Desconocible<'total' | 'parcial'>
}

export interface Relacion {
  id: Id
  nombre: string | null
  inicio: ExtremoRelacion
  fin: ExtremoRelacion
  atributos: Atributo[]
}

export interface Nota {
  id: Id
  texto: string
  x: number
  y: number
  ancho: number
  alto: number
}

export type TipoRegla = 'negocio' | 'dependencia' | 'supuesto'

export interface DependenciaFuncional {
  entidadId: Id
  determinanteIds: Id[]
  dependientesIds: Id[]
}

export interface ReglaNegocio {
  id: Id
  tipo: TipoRegla
  texto: string
  dependencia: DependenciaFuncional | null
  fragmentoOrigen: string | null
}

export interface Diseno {
  entidades: Entidad[]
  relaciones: Relacion[]
  notas: Nota[]
}

export type TipoAmbiguedad = 'lectura' | 'semantica' | 'ausencia'

export interface AccionAmbiguedad {
  accion: string
  etiqueta: string
}

export interface Ambiguedad {
  id: Id
  tipo: TipoAmbiguedad
  pregunta: string
  destino: { tipo: 'entidad' | 'atributo' | 'relacion' | 'figura' | 'regla'; id: Id | null }
  acciones: AccionAmbiguedad[]
  resolucion: { accion: string; valor?: unknown } | null
}

export type Importador = 'drawio' | 'imagen' | 'markdown' | 'manual'

export interface Procedencia {
  importador: Importador
  archivo: string | null
  pagina: string | null
  fragmentos?: { referencia: string; contenido: string }[]
  regiones?: { elementoId: Id; descripcion: string }[]
}

export type EstadoInterpretacion = 'pendiente' | 'confirmada'

export interface EstadoRevision {
  interpretacion: EstadoInterpretacion
  ambiguidades: Ambiguedad[]
  figurasSinClasificar: { id: Id; texto: string; tipoSugerido: string | null }[]
}

export const FORMATO_VERSION = 1

export interface Proyecto {
  formatoVersion: number
  id: Id
  nombre: string
  versionDiseno: number
  diseno: Diseno
  reglas: ReglaNegocio[]
  desconocidos: string[]
  revision: EstadoRevision
  procedencia: Procedencia | null
  propuestas: Propuesta[]
  actualizadoEn: string
}

export function crearEntidad(nombre: string, x: number, y: number): Entidad {
  return {
    id: nuevoId('e'),
    nombre,
    descripcion: null,
    atributos: [],
    claves: [],
    x,
    y,
    ancho: 220,
    alto: 90
  }
}

export function crearAtributo(nombre: string): Atributo {
  return {
    id: nuevoId('a'),
    nombre,
    descripcion: null,
    tipoDato: DESCONOCIDO,
    nulable: DESCONOCIDO,
    unico: DESCONOCIDO,
    multivalorado: DESCONOCIDO
  }
}

export function crearRelacion(entidadA: Id, entidadB: Id): Relacion {
  return {
    id: nuevoId('r'),
    nombre: null,
    inicio: {
      entidadId: entidadA,
      cardinalidad: { minimo: DESCONOCIDO, maximo: DESCONOCIDO },
      participacion: DESCONOCIDO
    },
    fin: {
      entidadId: entidadB,
      cardinalidad: { minimo: DESCONOCIDO, maximo: DESCONOCIDO },
      participacion: DESCONOCIDO
    },
    atributos: []
  }
}

export function crearNota(texto: string, x: number, y: number): Nota {
  return { id: nuevoId('n'), texto, x, y, ancho: 180, alto: 80 }
}

export function crearProyectoVacio(nombre: string): Proyecto {
  return {
    formatoVersion: FORMATO_VERSION,
    id: nuevoId('p'),
    nombre,
    versionDiseno: 0,
    diseno: { entidades: [], relaciones: [], notas: [] },
    reglas: [],
    desconocidos: [],
    revision: { interpretacion: 'confirmada', ambiguidades: [], figurasSinClasificar: [] },
    procedencia: null,
    propuestas: [],
    actualizadoEn: new Date().toISOString()
  }
}

export function esDesconocido<T>(valor: Desconocible<T>): boolean {
  return valor === DESCONOCIDO
}

export function hallarEntidad(diseno: Diseno, id: Id): Entidad | undefined {
  return diseno.entidades.find((e) => e.id === id)
}

export function hallarRelacion(diseno: Diseno, id: Id): Relacion | undefined {
  return diseno.relaciones.find((r) => r.id === id)
}

export function clavesPrimarias(entidad: Entidad): Clave[] {
  return entidad.claves.filter((c) => c.tipo === 'primaria')
}

export function clavesCandidatas(entidad: Entidad): Clave[] {
  return entidad.claves.filter((c) => c.tipo === 'primaria' || c.tipo === 'candidata')
}

export function atributosDeClave(entidad: Entidad, clave: Clave): Atributo[] {
  return clave.atributoIds
    .map((id) => entidad.atributos.find((a) => a.id === id))
    .filter((a): a is Atributo => a !== undefined)
}

export function atributosPrimos(entidad: Entidad): Set<Id> {
  const primos = new Set<Id>()
  for (const clave of clavesCandidatas(entidad)) {
    for (const id of clave.atributoIds) primos.add(id)
  }
  return primos
}

export function clonarDiseno(diseno: Diseno): Diseno {
  return structuredClone(diseno)
}
