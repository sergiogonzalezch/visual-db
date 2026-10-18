import { beforeEach, describe, expect, it, vi } from 'vitest'
const almacen = vi.hoisted(() => ({ archivo: '', cifrado: true }))
vi.mock('electron', () => ({
  app: { getPath: () => '/virtual' },
  safeStorage: { isEncryptionAvailable: () => almacen.cifrado,
    encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() }
}))
vi.mock('fs', () => ({ existsSync: () => !!almacen.archivo, mkdirSync: vi.fn(), renameSync: vi.fn(),
  readFileSync: () => almacen.archivo, writeFileSync: (_ruta: string, datos: string) => { almacen.archivo = datos } }))
import { guardarClaveApi, obtenerClaveApi } from '../almacen-credenciales'
beforeEach(() => { almacen.archivo = ''; almacen.cifrado = true })
describe('credenciales por proveedor', () => {
  it('conserva otras claves al reemplazar y eliminar una', () => {
    guardarClaveApi('openai', 'primera')
    guardarClaveApi('gemini', 'segunda')
    guardarClaveApi('openai', 'nueva')
    expect(obtenerClaveApi('gemini')).toBe('segunda')
    expect(obtenerClaveApi('openai')).toBe('nueva')
    guardarClaveApi('openai', null)
    expect(obtenerClaveApi('openai')).toBeNull()
    expect(obtenerClaveApi('gemini')).toBe('segunda')
  })
  it('no escribe secretos si no hay cifrado', () => {
    almacen.cifrado = false
    expect(() => guardarClaveApi('openai', 'secreto')).toThrow('almacén seguro')
    expect(almacen.archivo).toBe('')
  })
})
