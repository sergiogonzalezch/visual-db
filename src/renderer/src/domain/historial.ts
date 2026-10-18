import { DisenoConReglas, Operacion, aplicarOperaciones, descripcionOperacion, invertirOperacion } from './operaciones'

export interface EntradaHistorial {
  id: string
  etiqueta: string
  adelante: Operacion[]
  atras: Operacion[]
  fuente: EntradaHistorialFuente
  propuestaId: string | null
  fecha: string
}

type EntradaHistorialFuente = 'manual' | 'propuesta' | 'importacion'

export interface Historial {
  entradas: EntradaHistorial[]
  deshacer: EntradaHistorial[]
  rehacer: EntradaHistorial[]
}

export function historialVacio(): Historial {
  return { entradas: [], deshacer: [], rehacer: [] }
}

export interface ResultadoEdicion {
  estado: DisenoConReglas
  historial: Historial
  entrada: EntradaHistorial
}

let contadorHistorial = 0
function idEntrada(): string {
  contadorHistorial += 1
  return `h-${Date.now().toString(36)}-${contadorHistorial}`
}

export function editar(
  estado: DisenoConReglas,
  historial: Historial,
  operaciones: Operacion[],
  opciones: { etiqueta?: string; fuente?: EntradaHistorial['fuente']; propuestaId?: string | null } = {}
): ResultadoEdicion {
  if (operaciones.length === 0) throw new Error('No hay operaciones que aplicar')
  const atras = operaciones.flatMap((op) => invertirOperacion(estado.diseno, estado.reglas, op)).reverse()
  const estadoPosterior = aplicarOperaciones(estado, operaciones)
  const entrada: EntradaHistorial = {
    id: idEntrada(),
    etiqueta: opciones.etiqueta ?? operaciones.map(descripcionOperacion).join('; '),
    adelante: structuredClone(operaciones),
    atras,
    fuente: opciones.fuente ?? 'manual',
    propuestaId: opciones.propuestaId ?? null,
    fecha: new Date().toISOString()
  }
  return {
    estado: estadoPosterior,
    historial: {
      entradas: [...historial.entradas, entrada],
      deshacer: [...historial.deshacer, entrada],
      rehacer: []
    },
    entrada
  }
}

export function deshacer(
  estado: DisenoConReglas,
  historial: Historial
): { estado: DisenoConReglas; historial: Historial } | null {
  const ultimo = historial.deshacer[historial.deshacer.length - 1]
  if (!ultimo) return null
  const estadoPosterior = aplicarOperaciones(estado, ultimo.atras)
  return {
    estado: estadoPosterior,
    historial: {
      ...historial,
      deshacer: historial.deshacer.slice(0, -1),
      rehacer: [...historial.rehacer, ultimo]
    }
  }
}

export function rehacer(
  estado: DisenoConReglas,
  historial: Historial
): { estado: DisenoConReglas; historial: Historial } | null {
  const ultimo = historial.rehacer[historial.rehacer.length - 1]
  if (!ultimo) return null
  const estadoPosterior = aplicarOperaciones(estado, ultimo.adelante)
  return {
    estado: estadoPosterior,
    historial: {
      ...historial,
      deshacer: [...historial.deshacer, ultimo],
      rehacer: historial.rehacer.slice(0, -1)
    }
  }
}

export function puedeDeshacer(historial: Historial): boolean {
  return historial.deshacer.length > 0
}

export function puedeRehacer(historial: Historial): boolean {
  return historial.rehacer.length > 0
}
