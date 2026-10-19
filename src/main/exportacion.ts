import { app, BrowserWindow, dialog, shell } from 'electron'
import { mkdir, open, rename, unlink } from 'fs/promises'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { formatosExportacion, nombreExportacion, type ResultadoExportacion, type SolicitudExportacion } from '../shared/exportacion'

let carpetaUltimaExportacion: string | null = null
const LIMITE_BYTES = 20 * 1024 * 1024

export function validarSolicitudExportacion(valor: unknown): asserts valor is SolicitudExportacion {
  if (!valor || typeof valor !== 'object') throw new Error('Solicitud de exportación inválida.')
  const s = valor as SolicitudExportacion
  if (typeof s.nombre !== 'string' || s.nombre.length > 500 || !Array.isArray(s.archivos) || s.archivos.length < 1 || s.archivos.length > 2) throw new Error('Formato de exportación inválido.')
  const tipos = new Set<string>()
  let bytes = 0
  for (const a of s.archivos) {
    if (!a || !Object.hasOwn(formatosExportacion, a.tipo) || tipos.has(a.tipo) || typeof a.contenido !== 'string') throw new Error('Archivos de exportación inválidos.')
    tipos.add(a.tipo)
    if (a.contenido.length > Math.ceil(LIMITE_BYTES * 4 / 3)) throw new Error('La exportación supera el límite de 20 MB. Reduce el contenido del proyecto.')
    if (a.tipo === 'png') {
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(a.contenido) || a.contenido.length % 4 !== 0) throw new Error('Imagen PNG inválida.')
      const imagen = Buffer.from(a.contenido, 'base64')
      if (imagen.length < 24 || imagen.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || imagen.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Imagen PNG inválida.')
      const ancho = imagen.readUInt32BE(16), alto = imagen.readUInt32BE(20)
      if (!ancho || !alto || ancho > 16384 || alto > 16384 || ancho * alto > 32_000_000) throw new Error('La imagen supera el límite de dimensiones permitido.')
      bytes += imagen.length
    } else bytes += Buffer.byteLength(a.contenido, 'utf8')
  }
  if (bytes > LIMITE_BYTES) throw new Error('La exportación supera el límite de 20 MB. Reduce el contenido del proyecto.')
}

export async function escribirExportacion(ruta: string, contenido: string | Uint8Array): Promise<void> {
  const temporal = `${ruta}.${randomUUID()}.tmp`
  try {
    const archivo = await open(temporal, 'wx', 0o600)
    try { await archivo.writeFile(contenido, typeof contenido === 'string' ? 'utf8' : undefined) } finally { await archivo.close() }
    await rename(temporal, ruta)
  } finally {
    await unlink(temporal).catch(() => {})
  }
}

export async function exportarArchivos(ventana: BrowserWindow, solicitud: unknown): Promise<ResultadoExportacion> {
  const escritos: string[] = []
  try { validarSolicitudExportacion(solicitud) } catch (error) {
    return { estado: 'error', archivos: [], mensaje: (error as Error).message }
  }
  try {
    const base = nombreExportacion(solicitud.nombre)
    let carpeta: string
    let rutaUnica: string | undefined
    if (solicitud.archivos.length === 1) {
      const formato = formatosExportacion[solicitud.archivos[0].tipo]
      const extension = formato.extension
      const destino = await dialog.showSaveDialog(ventana, {
        title: 'Exportar diseño', defaultPath: join(app.getPath('documents'), `${base}-${formato.sufijo}.${extension}`),
        filters: [{ name: formato.nombre, extensions: [extension] }], properties: ['showOverwriteConfirmation']
      })
      if (destino.canceled || !destino.filePath) return { estado: 'cancelada', archivos: [] }
      rutaUnica = destino.filePath.toLowerCase().endsWith(`.${extension}`) ? destino.filePath : `${destino.filePath}.${extension}`
      // No escribir en una ruta distinta a la confirmada por el diálogo.
      if (rutaUnica !== destino.filePath) return { estado: 'error', archivos: [], mensaje: `El nombre debe terminar en .${extension}. Vuelve a exportar con esa extensión.` }
      carpeta = dirname(rutaUnica)
    } else {
      const destino = await dialog.showOpenDialog(ventana, { title: 'Elegir carpeta para el paquete de exportación', properties: ['openDirectory', 'createDirectory'] })
      if (destino.canceled || !destino.filePaths[0]) return { estado: 'cancelada', archivos: [] }
      carpeta = join(destino.filePaths[0], `${base}-export-${randomUUID().slice(0, 8)}`)
      await mkdir(carpeta) // Carpeta nueva: nunca sobrescribir un paquete existente.
    }
    for (const archivo of solicitud.archivos) {
      const formato = formatosExportacion[archivo.tipo]
      const ruta = rutaUnica ?? join(carpeta, `${base}-${formato.sufijo}.${formato.extension}`)
      await escribirExportacion(ruta, archivo.tipo === 'png' ? Buffer.from(archivo.contenido, 'base64') : archivo.contenido)
      escritos.push(ruta)
      carpetaUltimaExportacion = carpeta
    }
    return { estado: 'completa', archivos: escritos }
  } catch (error) {
    const codigo = (error as NodeJS.ErrnoException).code
    const detalle = codigo === 'ENOSPC' ? 'No hay espacio disponible en el destino.' : codigo === 'EACCES' || codigo === 'EPERM' ? 'No hay permisos para escribir en el destino.' : 'Comprueba el nombre, los permisos y el espacio disponible.'
    return { estado: escritos.length ? 'parcial' : 'error', archivos: escritos,
      mensaje: escritos.length ? `Solo se guardó parte del paquete. ${detalle} Los archivos indicados se conservan; puedes volver a exportar.` : `No se pudo exportar. ${detalle} Vuelve a intentarlo.` }
  }
}

export async function abrirCarpetaExportacion(): Promise<string> {
  if (!carpetaUltimaExportacion) return 'No hay una exportación guardada en esta sesión.'
  return shell.openPath(carpetaUltimaExportacion)
}
