import { beforeEach, describe, expect, it, vi } from 'vitest'
const memoria = vi.hoisted(() => ({ archivos: new Map<string, string>(), claves: new Map<string, string>() }))
vi.mock('electron', () => ({ app: { getPath: () => '/virtual' } }))
vi.mock('fs', () => ({
  mkdirSync: vi.fn(), existsSync: (p: string) => memoria.archivos.has(p),
  readFileSync: (p: string) => memoria.archivos.get(p),
  writeFileSync: (p: string, texto: string) => memoria.archivos.set(p, texto),
  renameSync: (a: string, b: string) => { memoria.archivos.set(b, memoria.archivos.get(a)!); memoria.archivos.delete(a) }
}))
vi.mock('../almacen-credenciales', () => ({
  hayClaveApi: (p: string) => memoria.claves.has(p),
  guardarClaveApi: (p: string, c: string) => { if (c) memoria.claves.set(p, c); else memoria.claves.delete(p) }
}))
import { cargarConfiguracion, guardarConfiguracion } from './configuracion'
beforeEach(() => { memoria.archivos.clear(); memoria.claves.clear() })
describe('perfiles persistentes', () => {
  it('restaura URL, modelo y credencial de cada proveedor después de alternarlos', () => {
    const inicial = cargarConfiguracion()
    const gemini = { proveedor: 'gemini' as const, endpoint: 'https://example.com/google', modelo: 'models/gemini-2.5-flash', claveApiEstablecida: false }
    const openai = { proveedor: 'openai' as const, endpoint: 'https://example.com/openai', modelo: 'modelo-prueba', claveApiEstablecida: false }
    guardarConfiguracion({ ...inicial, proveedor: gemini }, 'secreto-google')
    // Un renderer con una copia anterior tampoco borra los otros perfiles.
    guardarConfiguracion({ ...inicial, proveedor: openai }, 'secreto-openai')
    const restaurada = cargarConfiguracion()
    expect(restaurada.proveedores?.gemini).toMatchObject({ endpoint: gemini.endpoint, modelo: 'gemini-2.5-flash', claveApiEstablecida: true })
    expect(restaurada.proveedores?.openai).toMatchObject({ endpoint: openai.endpoint, modelo: openai.modelo, claveApiEstablecida: true })
    expect(JSON.stringify([...memoria.archivos.values()])).not.toContain('secreto-')
  })
  it('migra el formato anterior y descubre credenciales de otros proveedores', () => {
    const inicial = guardarConfiguracion(cargarConfiguracion(), null)
    const ruta = [...memoria.archivos.keys()][0]
    memoria.claves.set('gemini', 'secreto')
    memoria.archivos.set(ruta, JSON.stringify({ ...inicial, proveedores: undefined }))
    const migrada = cargarConfiguracion()
    expect(migrada.proveedores?.ollama).toEqual(migrada.proveedor)
    expect(migrada.proveedores?.gemini?.claveApiEstablecida).toBe(true)
  })
  it('un archivo dañado no se reemplaza silenciosamente', () => {
    guardarConfiguracion(cargarConfiguracion(), null)
    const ruta = [...memoria.archivos.keys()][0]
    memoria.archivos.set(ruta, '{ roto')
    expect(() => guardarConfiguracion(cargarConfiguracion(), null)).toThrow()
    expect(memoria.archivos.get(ruta)).toBe('{ roto')
  })
  it('guardar un perfil inactivo no cambia el proveedor activo', () => {
    const inicial = cargarConfiguracion()
    const otro = { proveedor: 'gemini' as const, endpoint: 'https://example.com', modelo: 'ultimo', claveApiEstablecida: false }
    const guardada = guardarConfiguracion({ ...inicial, proveedor: otro }, 'secreto', false)
    expect(guardada.proveedor.proveedor).toBe('ollama')
    expect(cargarConfiguracion().proveedores?.gemini?.modelo).toBe('ultimo')
  })
})
