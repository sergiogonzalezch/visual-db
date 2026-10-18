import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs'
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

function leerMapa(): Record<string, string> {
  const ruta = rutaCredenciales()
  if (!existsSync(ruta)) return {}
  const contenido = JSON.parse(readFileSync(ruta, 'utf-8')) as ArchivoCredenciales & { mapa?: Record<string, string> }
  const datos = contenido.cifrado
    ? safeStorage.decryptString(Buffer.from(contenido.datos, 'base64'))
    : contenido.datos
  return contenido.mapa ?? JSON.parse(datos) as Record<string, string>
}

export function guardarClaveApi(proveedor: string, clave: string | null): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('El almacén seguro del sistema no está disponible. No se guardó la clave.')
  }
  const mapa = leerMapa()
  if (clave) mapa[proveedor] = clave
  else delete mapa[proveedor]
  const datos = safeStorage.encryptString(JSON.stringify(mapa)).toString('base64')
  const ruta = rutaCredenciales()
  writeFileSync(`${ruta}.tmp`, JSON.stringify({ cifrado: true, datos }), { mode: 0o600 })
  renameSync(`${ruta}.tmp`, ruta)
}

export function obtenerClaveApi(proveedor: string): string | null {
  const ruta = rutaCredenciales()
  if (!existsSync(ruta)) return null
  try {
    return leerMapa()[proveedor] ?? null
  } catch {
    return null
  }
}

export function hayClaveApi(proveedor: string): boolean {
  return obtenerClaveApi(proveedor) !== null
}
