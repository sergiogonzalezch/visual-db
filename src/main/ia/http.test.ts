import { afterEach, describe, expect, it, vi } from 'vitest'
import { solicitar } from './http'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
describe('transporte seguro de proveedores', () => {
  it.each([false, true])('explica saturación sin propagar secretos ni repetir generación: array=%s', async array => {
    const error = { error: { status: 'UNAVAILABLE', message: 'overloaded secreto-no-mostrar' } }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(array ? [error] : error), { status: 503 }))
    vi.stubGlobal('fetch', fetch)
    const fallo = await solicitar('https://example.com', { method: 'POST' }).catch((e: Error) => e)
    expect((fallo as Error).message).toContain('saturado')
    expect((fallo as Error).message).not.toContain('secreto-no-mostrar')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('no acorta una espera larga solicitada por el proveedor', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': '60' } }))
    vi.stubGlobal('fetch', fetch)
    await expect(solicitar('https://example.com')).rejects.toThrow('60 segundos')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('respeta Retry-After expresado como fecha HTTP', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const fetch = vi.fn().mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': 'Thu, 01 Jan 2026 00:00:02 GMT' } })).mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const promesa = solicitar('https://example.com')
    await vi.advanceTimersByTimeAsync(1999); expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1); expect((await promesa).ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it.each([false, true])('identifica modelos restringidos sin exponer el cuerpo del proveedor: array=%s', async (array) => {
    const error = { error: { status: 'NOT_FOUND', message: 'This model models/gemini-2.5-flash is no longer available to new users. secreto-no-mostrar' } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(array ? [error] : error), { status: 404 })))
    const fallo = await solicitar('https://example.com', { method: 'POST' }).catch((e: Error) => e)
    expect(fallo).toBeInstanceOf(Error)
    expect((fallo as Error).message).toContain('ya no está disponible para nuevos usuarios')
    expect((fallo as Error).message).not.toContain('secreto-no-mostrar')
  })
  it('rechaza URLs con credenciales antes de enviar', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(solicitar('https://usuario:secreto@example.com/v1')).rejects.toThrow('sin credenciales')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('no expone cuerpos de error ni reintenta autenticación', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('clave-secreta', { status: 401 }))
    vi.stubGlobal('fetch', fetch)
    await expect(solicitar('https://example.com')).rejects.toThrow('Autenticación rechazada')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('reintenta una consulta limitada por tasa', async () => {
    vi.useFakeTimers()
    const fetch = vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const promesa = solicitar('https://example.com')
    await vi.runAllTimersAsync()
    expect((await promesa).ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('no repite generaciones para evitar cargos duplicados', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 503 }))
    vi.stubGlobal('fetch', fetch)
    await expect(solicitar('https://example.com', { method: 'POST' })).rejects.toThrow('503')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('traduce los timeouts sin exponer datos de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('datos internos')))
    await expect(solicitar('https://example.com', { signal: AbortSignal.abort() })).rejects.toThrow('tiempo de espera')
  })
})
