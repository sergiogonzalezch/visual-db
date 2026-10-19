import { afterEach, describe, expect, it, vi } from 'vitest'
import { EJEMPLOS_OPERACIONES, ESQUEMA_REVISION, OPERACIONES_REVISION } from './contrato-revision'
import { operacionIAValida } from './operaciones-validas'
import { SISTEMA_REVISION } from './adaptador'
import { adaptadorOllama } from './ollama'

vi.mock('./consumo', () => ({ registrarConsumo: vi.fn(), estimarTokens: () => 1 }))
afterEach(() => vi.unstubAllGlobals())

describe('contrato de generación de revisiones', () => {
  it.each(EJEMPLOS_OPERACIONES)('el ejemplo $op es una operación real válida', op => {
    expect(operacionIAValida(op)).toBe(true)
    expect(SISTEMA_REVISION).toContain(JSON.stringify(op))
  })
  it('no enseña llamadas de pseudocódigo como operaciones', () => {
    expect(SISTEMA_REVISION).not.toMatch(/updateAtributo\{/)
    expect(SISTEMA_REVISION).toContain('La unicidad no implica obligatoriedad')
    expect(OPERACIONES_REVISION).toHaveLength(23)
  })
  it('envía el esquema completo únicamente en revisiones de Ollama', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: '{"resumen":"Falta evidencia","propuestas":[]}' } })))
    vi.stubGlobal('fetch', fetch)
    const config = { proveedor: 'ollama' as const, endpoint: 'http://localhost:11434', modelo: 'qa', claveApiEstablecida: false }
    const solicitud = { proyecto: { nombre: 'QA', versionDiseno: 0, diseno: { entidades: [], relaciones: [], notas: [] }, reglas: [] }, historialResumen: '' }
    expect((await adaptadorOllama.revisar(solicitud, config, null, AbortSignal.timeout(1000))).propuestas).toEqual([])
    const cuerpo = JSON.parse(fetch.mock.calls[0][1].body)
    expect(cuerpo.format).toEqual(ESQUEMA_REVISION)
    expect(cuerpo.options).toEqual({ num_ctx: 8192, temperature: 0.2 })
    expect(cuerpo.format.properties.propuestas.items.properties.operaciones.items.anyOf).toHaveLength(23)
    expect(cuerpo.format.properties.propuestas.items.properties.operaciones.items.anyOf.every((s: { required: string[]; additionalProperties: boolean }) => s.required.includes('op') && s.additionalProperties === false)).toBe(true)
  })
})
