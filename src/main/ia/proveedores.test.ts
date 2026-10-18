import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Configuracion } from '@shared/ai'
const memoria = vi.hoisted(() => ({ config: null as Configuracion | null, prueba: vi.fn(), clave: 'guardada' }))
vi.mock('./configuracion', () => ({
  cargarConfiguracion: () => structuredClone(memoria.config),
  guardarConfiguracion: (c: Configuracion, clave: string | null, activar = true) => {
    if (clave !== null) memoria.clave = clave
    memoria.config = { ...c, proveedor: activar || memoria.config?.proveedor.proveedor === c.proveedor.proveedor ? c.proveedor : memoria.config!.proveedor, proveedores: { ...memoria.config?.proveedores, [c.proveedor.proveedor]: c.proveedor } }
    return memoria.config
  }
}))
vi.mock('./coordinador', () => ({ probarConexion: memoria.prueba }))
vi.mock('../almacen-credenciales', () => ({ guardarClaveApi: (_p: string, c: string) => { memoria.clave = c }, obtenerClaveApi: () => memoria.clave }))
import { borrarCredencial, conectarProveedor, estadosProveedores, reconectarActivo, seleccionarModelo } from './proveedores'
beforeEach(() => {
  memoria.config = { soloLocal: false, proveedor: { proveedor: 'gemini', endpoint: 'https://example.com/google', modelo: 'modelo-previo', claveApiEstablecida: true }, limiteDiarioTokens: null, ultimoProyecto: null }
  memoria.clave = 'guardada'
  memoria.prueba.mockReset().mockResolvedValue({ ok: true, detalle: 'Conectado', modelos: ['modelo-nuevo'], capacidades: null })
})
describe('gestión de conexiones', () => {
  it('conectar conserva el modelo previo y activa solo la selección validada', async () => {
    await conectarProveedor(memoria.config!.proveedor, null)
    expect(memoria.clave).toBe('guardada')
    expect(memoria.config!.proveedor.modelo).toBe('modelo-previo')
    seleccionarModelo('gemini', 'modelo-nuevo')
    expect(memoria.config!.proveedor.modelo).toBe('modelo-nuevo')
    expect(() => seleccionarModelo('gemini', 'inventado')).toThrow()
  })
  it('otro proveedor no sustituye al activo durante la prueba', async () => {
    await conectarProveedor({ proveedor: 'openai', endpoint: 'https://example.com/openai', modelo: 'otro', claveApiEstablecida: true }, 'otra-clave')
    expect(memoria.config!.proveedor.proveedor).toBe('gemini')
    expect(memoria.config!.proveedores?.openai?.modelo).toBe('otro')
  })
  it('un error no borra credencial ni modelo', async () => {
    memoria.prueba.mockResolvedValue({ ok: false, detalle: 'Autenticación rechazada', modelos: [] })
    const resultado = await conectarProveedor(memoria.config!.proveedor, null)
    expect(resultado.estado).toBe('error')
    expect(memoria.clave).toBe('guardada')
    expect(memoria.config!.proveedor.modelo).toBe('modelo-previo')
  })
  it('borrar invalida la conexión sin borrar la configuración', async () => {
    await conectarProveedor(memoria.config!.proveedor, null)
    borrarCredencial('gemini')
    expect(memoria.clave).toBeNull()
    expect(estadosProveedores().gemini).toBeUndefined()
    expect(memoria.config!.proveedor.modelo).toBe('modelo-previo')
  })
  it('reconecta el activo y respeta el modo Solo local', async () => {
    await reconectarActivo()
    expect(memoria.prueba).toHaveBeenCalledTimes(1)
    memoria.config!.soloLocal = true
    await reconectarActivo()
    expect(memoria.prueba).toHaveBeenCalledTimes(1)
    expect(() => seleccionarModelo('gemini', 'modelo-nuevo')).toThrow()
  })
})
