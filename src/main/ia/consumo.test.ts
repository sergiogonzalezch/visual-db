import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' }
}))

import { agregarRegistro, construirResumen, estimarTokens, fechaLocalHoy, podarDias } from './consumo'
import { ConsumoDia, RegistroConsumo } from '@shared/ai'

function registro(parcial: Partial<RegistroConsumo> = {}): RegistroConsumo {
  return {
    fecha: '2026-10-18',
    proveedor: 'openai',
    modelo: 'gpt-4o-mini',
    operacion: 'revision',
    entrada: 100,
    salida: 50,
    estimado: false,
    ...parcial
  }
}

describe('fechaLocalHoy', () => {
  it('devuelve la fecha local en formato AAAA-MM-DD', () => {
    expect(fechaLocalHoy(new Date(2026, 9, 18, 23, 59))).toBe('2026-10-18')
    expect(fechaLocalHoy(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
  })
})

describe('agregarRegistro', () => {
  it('crea una entrada nueva cuando no existe el agregado', () => {
    const dias = agregarRegistro([], registro())
    expect(dias).toHaveLength(1)
    expect(dias[0]).toMatchObject({ fecha: '2026-10-18', proveedor: 'openai', modelo: 'gpt-4o-mini', peticiones: 1, entrada: 100, salida: 50 })
  })

  it('acumula peticiones y tokens en el agregado del mismo día/proveedor/modelo', () => {
    let dias = agregarRegistro([], registro())
    dias = agregarRegistro(dias, registro({ entrada: 30, salida: 20, operacion: 'chat' }))
    expect(dias).toHaveLength(1)
    expect(dias[0]).toMatchObject({ peticiones: 2, entrada: 130, salida: 70 })
  })

  it('separa proveedores y modelos distintos en el mismo día', () => {
    let dias = agregarRegistro([], registro())
    dias = agregarRegistro(dias, registro({ proveedor: 'anthropic', modelo: 'claude' }))
    expect(dias).toHaveLength(2)
  })

  it('marca estimado solo si todas las peticiones lo fueron', () => {
    let dias = agregarRegistro([], registro({ estimado: true }))
    dias = agregarRegistro(dias, registro({ estimado: false }))
    expect(dias[0].estimado).toBe(false)
  })
})

describe('podarDias', () => {
  it('conserva los últimos N días naturales y elimina el resto', () => {
    const dias: ConsumoDia[] = ['2026-10-18', '2026-10-17', '2026-10-12', '2026-09-01'].map((fecha) => ({
      fecha,
      proveedor: 'openai',
      modelo: 'm',
      peticiones: 1,
      entrada: 1,
      salida: 1,
      estimado: false
    }))
    const podados = podarDias(dias, '2026-10-18', 7)
    expect(podados.map((d) => d.fecha)).toEqual(['2026-10-18', '2026-10-17', '2026-10-12'])
  })
})

describe('construirResumen', () => {
  it('suma el día de hoy y calcula el restante respecto al límite', () => {
    const dias: ConsumoDia[] = [
      { fecha: '2026-10-18', proveedor: 'openai', modelo: 'm', peticiones: 2, entrada: 400, salida: 100, estimado: false },
      { fecha: '2026-10-17', proveedor: 'openai', modelo: 'm', peticiones: 1, entrada: 50, salida: 50, estimado: false }
    ]
    const resumen = construirResumen(dias, 1000, '2026-10-18')
    expect(resumen.hoy).toMatchObject({ peticiones: 2, entrada: 400, salida: 100, total: 500 })
    expect(resumen.restanteHoy).toBe(500)
    expect(resumen.dias[0].fecha).toBe('2026-10-18')
  })

  it('devuelve restante negativo al superar el límite', () => {
    const dias: ConsumoDia[] = [
      { fecha: '2026-10-18', proveedor: 'openai', modelo: 'm', peticiones: 1, entrada: 900, salida: 400, estimado: false }
    ]
    const resumen = construirResumen(dias, 1000, '2026-10-18')
    expect(resumen.restanteHoy).toBe(-300)
  })

  it('sin límite el restante es null', () => {
    const resumen = construirResumen([], null, '2026-10-18')
    expect(resumen.restanteHoy).toBeNull()
    expect(resumen.hoy.total).toBe(0)
  })
})

describe('estimarTokens', () => {
  it('estima aproximadamente un token por cada cuatro caracteres', () => {
    expect(estimarTokens('')).toBe(1)
    expect(estimarTokens('abcd')).toBe(1)
    expect(estimarTokens('a'.repeat(400))).toBe(100)
  })
})
