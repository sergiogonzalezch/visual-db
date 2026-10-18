import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { abrirProyecto, guardarProyecto, escribirRecuperacion, leerRecuperacion } from './persistencia'

let directorio: string
vi.mock('electron', () => ({ app: { getPath: () => directorio } }))

beforeEach(() => { directorio = mkdtempSync(join(process.cwd(), '.test-chat-')) })
afterEach(() => { rmSync(directorio, { recursive: true, force: true }) })

const archivo = (id: string, contenido: string) => ({
  formatoVersion: 1, proyecto: { id }, historial: {},
  mensajesChat: [{ rol: 'usuario' as const, contenido, fecha: '2026-10-18T12:00:00Z' }]
})

describe('persistencia de conversaciones', () => {
  it('guarda y abre la conversación de cada proyecto sin mezclarlas', () => {
    const a = archivo('a', 'Chat A')
    const b = archivo('b', 'Chat B')
    guardarProyecto(join(directorio, 'a.vbdproj'), a)
    guardarProyecto(join(directorio, 'b.vbdproj'), b)
    expect(abrirProyecto(join(directorio, 'a.vbdproj'))).toEqual(a)
    expect(abrirProyecto(join(directorio, 'b.vbdproj'))).toEqual(b)
  })

  it('incluye el chat en la recuperación por proyecto', () => {
    const a = archivo('a', 'Pendiente de guardar')
    escribirRecuperacion('a', a)
    expect(leerRecuperacion('a').mensajesChat).toEqual(a.mensajesChat)
    expect(leerRecuperacion('b').disponible).toBe(false)
  })

  it('abre y recupera archivos antiguos sin chat', () => {
    const antiguo = { formatoVersion: 1, proyecto: { id: 'antiguo' }, historial: {} }
    guardarProyecto(join(directorio, 'antiguo.vbdproj'), antiguo)
    escribirRecuperacion('antiguo', antiguo)
    expect(abrirProyecto(join(directorio, 'antiguo.vbdproj')).mensajesChat).toBeUndefined()
    expect(leerRecuperacion('antiguo').mensajesChat).toBeUndefined()
  })
})
