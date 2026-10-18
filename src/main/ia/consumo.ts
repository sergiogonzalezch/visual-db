import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ConsumoDia, RegistroConsumo, ResumenConsumo } from '@shared/ai'

const MAX_DIAS = 90

export function fechaLocalHoy(momento: Date = new Date()): string {
  const anio = momento.getFullYear()
  const mes = String(momento.getMonth() + 1).padStart(2, '0')
  const dia = String(momento.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function agregarRegistro(dias: ConsumoDia[], registro: RegistroConsumo): ConsumoDia[] {
  const indice = dias.findIndex(
    (d) => d.fecha === registro.fecha && d.proveedor === registro.proveedor && d.modelo === registro.modelo
  )
  if (indice < 0) {
    return [
      ...dias,
      {
        fecha: registro.fecha,
        proveedor: registro.proveedor,
        modelo: registro.modelo,
        peticiones: 1,
        entrada: registro.entrada,
        salida: registro.salida,
        estimado: registro.estimado
      }
    ]
  }
  const previo = dias[indice]
  const copia = [...dias]
  copia[indice] = {
    ...previo,
    peticiones: previo.peticiones + 1,
    entrada: previo.entrada + registro.entrada,
    salida: previo.salida + registro.salida,
    estimado: previo.estimado && registro.estimado
  }
  return copia
}

export function podarDias(dias: ConsumoDia[], hoy: string, maxDias: number = MAX_DIAS): ConsumoDia[] {
  const permitidas = new Set<string>()
  const base = new Date(`${hoy}T12:00:00`)
  for (let i = 0; i < maxDias; i++) {
    const fecha = new Date(base)
    fecha.setDate(base.getDate() - i)
    permitidas.add(fechaLocalHoy(fecha))
  }
  return dias.filter((d) => permitidas.has(d.fecha))
}

export function construirResumen(
  dias: ConsumoDia[],
  limiteDiario: number | null,
  hoy: string
): ResumenConsumo {
  const deHoy = dias.filter((d) => d.fecha === hoy)
  const totalHoy = deHoy.reduce((suma, d) => suma + d.entrada + d.salida, 0)
  const ordenados = [...dias].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
  return {
    hoy: {
      fecha: hoy,
      peticiones: deHoy.reduce((suma, d) => suma + d.peticiones, 0),
      entrada: deHoy.reduce((suma, d) => suma + d.entrada, 0),
      salida: deHoy.reduce((suma, d) => suma + d.salida, 0),
      total: totalHoy
    },
    limiteDiario,
    restanteHoy: limiteDiario === null ? null : limiteDiario - totalHoy,
    dias: ordenados
  }
}

function rutaConsumo(): string {
  const dir = join(app.getPath('userData'), 'consumo')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'uso.json')
}

function leerDias(): ConsumoDia[] {
  try {
    const ruta = rutaConsumo()
    if (!existsSync(ruta)) return []
    const datos = JSON.parse(readFileSync(ruta, 'utf-8')) as { dias?: ConsumoDia[] }
    return Array.isArray(datos.dias) ? datos.dias : []
  } catch {
    return []
  }
}

function escribirDias(dias: ConsumoDia[]): void {
  const ruta = rutaConsumo()
  const tmp = `${ruta}.tmp`
  writeFileSync(tmp, JSON.stringify({ dias }, null, 2), 'utf-8')
  renameSync(tmp, ruta)
}

export function registrarConsumo(registro: Omit<RegistroConsumo, 'fecha'>, hoy?: string): void {
  const fecha = hoy ?? fechaLocalHoy()
  const dias = podarDias(agregarRegistro(leerDias(), { ...registro, fecha }), fecha)
  escribirDias(dias)
}

export function resumenConsumo(limiteDiario: number | null, hoy?: string): ResumenConsumo {
  return construirResumen(leerDias(), limiteDiario, hoy ?? fechaLocalHoy())
}

export function limpiarConsumo(): void {
  escribirDias([])
}

export function estimarTokens(texto: string): number {
  return Math.max(1, Math.round(texto.length / 4))
}
