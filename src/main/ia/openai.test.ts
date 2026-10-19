import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConfigProveedor } from '@shared/ai'
vi.mock('./consumo', () => ({ estimarTokens: () => 1, registrarConsumo: vi.fn() }))
import { adaptadorOpenAI } from './openai'
const config: ConfigProveedor = {
  proveedor: 'gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
  modelo: 'models/gemini-2.5-flash', claveApiEstablecida: true
}
afterEach(() => vi.unstubAllGlobals())
describe('modelos Gemini', () => {
  it('rechaza una clave inválida de OpenRouter antes de consultar su catálogo público', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 401 }))
    vi.stubGlobal('fetch', fetch)
    const resultado = await adaptadorOpenAI.probarConexion({ ...config, proveedor: 'openrouter', endpoint: 'https://openrouter.ai/api/v1' }, 'prueba')
    expect(resultado.ok).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/key')
  })
  it('normaliza el catalogo y acepta configuraciones existentes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'models/gemini-2.5-flash' }] }))))
    const resultado = await adaptadorOpenAI.probarConexion(config, 'prueba')
    expect(resultado.ok).toBe(true)
    expect(resultado.modelos).toEqual(['gemini-2.5-flash'])
  })
  it.each(['models/gemini-2.5-flash', 'gemini-2.5-flash'])('normaliza la peticion de revision: %s', async (modelo) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"resumen":"ok","propuestas":[]}' } }] })))
    vi.stubGlobal('fetch', fetch)
    await adaptadorOpenAI.revisar({ proyecto: {}, historialResumen: '' }, { ...config, modelo }, 'prueba', AbortSignal.timeout(1000))
    expect(fetch.mock.calls[0][0]).toBe(config.endpoint + '/chat/completions')
    expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe('gemini-2.5-flash')
    expect(JSON.parse(fetch.mock.calls[0][1].body).response_format).toEqual({ type: 'json_object' })
    expect(JSON.parse(fetch.mock.calls[0][1].body).messages[0].content).toContain('Contrato JSON Schema')
  })
  it('conserva los identificadores de OpenRouter', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"resumen":"ok","propuestas":[]}' } }] })))
    vi.stubGlobal('fetch', fetch)
    await adaptadorOpenAI.revisar({ proyecto: {}, historialResumen: '' }, { ...config, proveedor: 'openrouter', modelo: 'google/gemini-2.5-flash' }, 'prueba', AbortSignal.timeout(1000))
    expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe('google/gemini-2.5-flash')
  })
})
