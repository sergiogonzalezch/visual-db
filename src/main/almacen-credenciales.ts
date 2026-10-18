import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface ArchivoCredenciales {
  cifrado: boolean
  datos: string
}

function rutaCredenciales(): string {
  const dir = join(app.getPath('userData'), 'credenciales')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'proveedor.json')
}

export function guardarClaveApi(proveedor: string, clave: string | null): void {
  const ruta = rutaCredenciales()
  if (!clave || clave === '') {
    if (existsSync(ruta)) {
      const previo = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoCredenciales & { mapa: Record<string, string> }
      if (previo.mapa) {
        delete previo.mapa[proveedor]
        writeFileSync(ruta, JSON.stringify(previo))
      }
    }
    return
  }
  let mapa: Record<string, string> = {}
  if (existsSync(ruta)) {
    try {
      const previo = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoCredenciales & { mapa?: Record<string, string> }
      if (previo.cifrado && previo.mapa) mapa = previo.mapa
      else if (!previo.cifrado && previo.datos) {
        const viejo = JSON.parse(previo.datos) as Record<string, string>
        mapa = { ...viejo }
      }
    } catch {
      mapa = {}
    }
  }
  mapa[proveedor] = clave
  if (safeStorage.isEncryptionAvailable()) {
    const cifrado = safeStorage.encryptString(JSON.stringify(mapa)).toString('base64')
    writeFileSync(ruta, JSON.stringify({ cifrado: true, datos: cifrado }))
  } else {
    writeFileSync(ruta, JSON.stringify({ cifrado: false, datos: JSON.stringify(mapa) }))
  }
}

export function obtenerClaveApi(proveedor: string): string | null {
  const ruta = rutaCredenciales()
  if (!existsSync(ruta)) return null
  try {
    const contenido = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoCredenciales & { mapa?: Record<string, string> }
    let mapa: Record<string, string>
    if (contenido.cifrado) {
      mapa = JSON.parse(safeStorage.decryptString(Buffer.from(contenido.datos, 'base64'))) as Record<string, string>
    } else {
      mapa = (contenido.mapa ?? JSON.parse(contenido.datos)) as Record<string, string>
    }
    return mapa[proveedor] ?? null
  } catch {
    return null
  }
}

export function hayClaveApi(proveedor: string): boolean {
  return obtenerClaveApi(proveedor) !== null
}
