import { app } from 'electron'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  statSync
} from 'fs'
import { join, dirname } from 'path'

export const EXTENSION_PROYECTO = '.vbdproj'

export interface ArchivoProyecto {
  formatoVersion: number
  proyecto: unknown
  historial: unknown
}

export interface InfoRecuperacion {
  disponible: boolean
  ruta: string | null
  proyecto: unknown
  historial: unknown
  fecha: string | null
}

function dirRecuperacion(): string {
  const dir = join(app.getPath('userData'), 'recuperacion')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function escribirAtomico(ruta: string, contenido: string): void {
  const tmp = `${ruta}.tmp`
  writeFileSync(tmp, contenido, 'utf-8')
  renameSync(tmp, ruta)
}

export function guardarProyecto(ruta: string, archivo: ArchivoProyecto): void {
  const dir = dirname(ruta)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  escribirAtomico(ruta, JSON.stringify(archivo, null, 2))
}

export function abrirProyecto(ruta: string): ArchivoProyecto {
  const contenido = readFileSync(ruta, 'utf-8')
  const archivo = JSON.parse(contenido) as ArchivoProyecto
  if (!archivo || typeof archivo !== 'object' || !archivo.proyecto) {
    throw new Error('El archivo no tiene el formato de proyecto esperado.')
  }
  return archivo
}

export function escribirRecuperacion(idProyecto: string, archivo: ArchivoProyecto): void {
  try {
    const ruta = join(dirRecuperacion(), `${idProyecto}.json`)
    escribirAtomico(ruta, JSON.stringify(archivo))
  } catch {
    // la recuperación nunca interrumpe el trabajo
  }
}

export function leerRecuperacion(idProyecto: string): InfoRecuperacion {
  const ruta = join(dirRecuperacion(), `${idProyecto}.json`)
  if (!existsSync(ruta)) return { disponible: false, ruta: null, proyecto: null, historial: null, fecha: null }
  try {
    const archivo = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoProyecto
    return {
      disponible: true,
      ruta,
      proyecto: archivo.proyecto,
      historial: archivo.historial,
      fecha: statSync(ruta).mtime.toISOString()
    }
  } catch {
    return { disponible: false, ruta: null, proyecto: null, historial: null, fecha: null }
  }
}

export function borrarRecuperacion(idProyecto: string): void {
  const ruta = join(dirRecuperacion(), `${idProyecto}.json`)
  if (existsSync(ruta)) rmSync(ruta, { force: true })
}

export function listarRecuperaciones(): { id: string; fecha: string }[] {
  const dir = dirRecuperacion()
  const resultados: { id: string; fecha: string }[] = []
  for (const archivo of readdirSync(dir)) {
    if (!archivo.endsWith('.json')) continue
    const ruta = join(dir, archivo)
    try {
      const contenido = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoProyecto
      resultados.push({
        id: (contenido.proyecto as { id?: string })?.id ?? archivo,
        fecha: statSync(ruta).mtime.toISOString()
      })
    } catch {
      // archivos de recuperación dañados se ignoran
    }
  }
  return resultados
}

export function copiaSeguridad(ruta: string): string | null {
  try {
    if (!existsSync(ruta)) return null
    const copia = `${ruta}.copia`
    copyFileSync(ruta, copia)
    return copia
  } catch {
    return null
  }
}
