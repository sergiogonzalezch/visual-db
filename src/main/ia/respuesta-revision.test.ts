import { describe, expect, it } from 'vitest'
import { normalizarRevision } from './adaptador'

describe('respuesta de revisión completa', () => {
  it.each(['{}', 'null', '{"propuestas":[null]}', '{"propuestas":[{"titulo":"Incompleta","operaciones":[]}]}', '{"propuestas": [secreto-no-mostrar}'])('rechaza JSON incompleto de forma segura: %s', texto => {
    expect(() => normalizarRevision(texto)).toThrow(/JSON/)
    try { normalizarRevision(texto) } catch (e) { expect((e as Error).message).not.toContain('secreto-no-mostrar') }
  })
  it('permite una revisión válida sin recomendaciones', () => {
    expect(normalizarRevision('{"resumen":"No hay cambios justificados","propuestas":[]}')).toEqual({ resumen: 'No hay cambios justificados', propuestas: [] })
  })
})
