import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import type { BrowserWindow } from 'electron'
import { rename } from 'fs/promises'
import { exportarArchivos, validarSolicitudExportacion, escribirExportacion } from './exportacion'

const puertos = vi.hoisted(() => ({ guardar: vi.fn(), carpeta: vi.fn() }))
vi.mock('electron', () => ({ app: { getPath: () => process.cwd() }, dialog: { showSaveDialog: puertos.guardar, showOpenDialog: puertos.carpeta }, shell: { openPath: vi.fn() } }))
vi.mock('fs/promises', async (original) => {
  const fs = await original<typeof import('fs/promises')>()
  return { ...fs, rename: vi.fn(fs.rename) }
})
let raiz: string
const ventana = {} as BrowserWindow
beforeEach(async () => {
  raiz = mkdtempSync(join(process.cwd(), '.test-export-'))
  vi.resetAllMocks()
  vi.mocked(rename).mockImplementation((await vi.importActual<typeof import('fs/promises')>('fs/promises')).rename)
})
afterEach(() => { rmSync(raiz, { recursive: true, force: true }) })
const archivos = [{ tipo: 'markdown' as const, contenido: '# Reporte áéí\n' }, { tipo: 'json' as const, contenido: '{"formato":"visual-bd-export"}' }]

describe('guardado de exportación', () => {
  it('rechaza formatos, duplicados y contenidos fuera de límite', () => {
    expect(() => validarSolicitudExportacion({ nombre: 'x', archivos: [{ tipo: 'exe', contenido: '' }] })).toThrow()
    expect(() => validarSolicitudExportacion({ nombre: 'x', archivos: [archivos[0], archivos[0]] })).toThrow()
    expect(() => validarSolicitudExportacion({ nombre: 'x', archivos: [{ tipo: 'json', contenido: 'x'.repeat(21 * 1024 * 1024) }] })).toThrow('20 MB')
  })
  it('cancelar no crea archivos', async () => {
    puertos.guardar.mockResolvedValue({ canceled: true })
    expect((await exportarArchivos(ventana, { nombre: 'x', archivos: [archivos[0]] })).estado).toBe('cancelada')
    expect(readdirSync(raiz)).toEqual([])
  })
  it('escribe UTF-8 y reemplaza atómicamente sin temporales sobrantes', async () => {
    const ruta = join(raiz, 'reporte.md')
    await escribirExportacion(ruta, 'Anterior')
    puertos.guardar.mockResolvedValue({ canceled: false, filePath: ruta })
    expect((await exportarArchivos(ventana, { nombre: 'x', archivos: [archivos[0]] })).estado).toBe('completa')
    expect(readFileSync(ruta, 'utf8')).toBe(archivos[0].contenido)
    expect(readdirSync(raiz)).toEqual(['reporte.md'])
  })
  it('crea un paquete nuevo sin sobrescribir paquetes anteriores', async () => {
    puertos.carpeta.mockResolvedValue({ canceled: false, filePaths: [raiz] })
    const a = await exportarArchivos(ventana, { nombre: 'Ventas', archivos })
    const b = await exportarArchivos(ventana, { nombre: 'Ventas', archivos })
    expect(a.estado).toBe('completa')
    expect(a.archivos).toHaveLength(2)
    expect(a.archivos).not.toEqual(b.archivos)
    expect(JSON.parse(readFileSync(a.archivos[1], 'utf8')).formato).toBe('visual-bd-export')
  })
  it('no cambia la ruta confirmada para corregir una extensión', async () => {
    puertos.guardar.mockResolvedValue({ canceled: false, filePath: join(raiz, 'otro.exe') })
    const r = await exportarArchivos(ventana, { nombre: 'x', archivos: [archivos[0]] })
    expect(r.estado).toBe('error')
    expect(r.mensaje).toContain('.md')
    expect(readdirSync(raiz)).toEqual([])
  })
  it('informa un paquete parcial y limpia temporales al fallar el segundo archivo', async () => {
    puertos.carpeta.mockResolvedValue({ canceled: false, filePaths: [raiz] })
    const real = (await vi.importActual<typeof import('fs/promises')>('fs/promises')).rename
    vi.mocked(rename).mockImplementationOnce(real).mockRejectedValueOnce(Object.assign(new Error('Disco lleno'), { code: 'ENOSPC' }))
    const r = await exportarArchivos(ventana, { nombre: 'Ventas', archivos })
    expect(r.estado).toBe('parcial')
    expect(r.archivos).toHaveLength(1)
    expect(r.mensaje).toContain('espacio')
    expect(readdirSync(join(raiz, readdirSync(raiz)[0]))).toEqual(['Ventas-reporte.md'])
  })
  it.each([['svg', 'svg'], ['mermaid', 'mmd'], ['drawio', 'drawio']] as const)('guarda %s con la extensión correspondiente', async (tipo, extension) => {
    const ruta = join(raiz, `diagrama.${extension}`)
    puertos.guardar.mockResolvedValue({ canceled: false, filePath: ruta })
    const r = await exportarArchivos(ventana, { nombre: 'x', archivos: [{ tipo, contenido: 'Contenido de prueba' }] })
    expect(r.estado).toBe('completa')
    expect(readFileSync(ruta, 'utf8')).toBe('Contenido de prueba')
  })
  it('escribe PNG binario y rechaza base64 sin cabecera PNG', async () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJAAAAABJRU5ErkJggg=='
    const ruta = join(raiz, 'imagen.png')
    puertos.guardar.mockResolvedValue({ canceled: false, filePath: ruta })
    expect((await exportarArchivos(ventana, { nombre: 'x', archivos: [{ tipo: 'png', contenido: png }] })).estado).toBe('completa')
    expect(readFileSync(ruta)).toEqual(Buffer.from(png, 'base64'))
    expect(() => validarSolicitudExportacion({ nombre: 'x', archivos: [{ tipo: 'png', contenido: 'eA==' }] })).toThrow('PNG')
  })
})
