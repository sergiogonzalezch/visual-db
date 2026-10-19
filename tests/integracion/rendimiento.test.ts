import { describe, expect, it, vi } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { performance } from 'perf_hooks'
import { crearAtributo, crearEntidad, crearProyectoVacio, crearRelacion } from '../../src/renderer/src/domain/modelo'
import { crearInstantanea } from '../../src/renderer/src/exportadores/instantanea'
import { exportarSvg } from '../../src/renderer/src/exportadores/graficos'
import { crearPropuesta, aplicarPropuesta } from '../../src/renderer/src/domain/aprobacion'
import { diferencias, proyectarPropuesta } from '../../src/renderer/src/domain/comparacion'
import { historialVacio } from '../../src/renderer/src/domain/historial'
import { abrirProyecto, guardarProyecto } from '../../src/main/persistencia'

vi.mock('electron', () => ({ app: { getPath: () => process.cwd() } }))

describe.skipIf(process.env.VISUAL_BD_QA_RENDIMIENTO !== '1')('rendimiento con modelos sintéticos grandes', () => {
  it.each([50, 200, 500])('%i entidades: abrir, guardar, comparar, aprobar y exportar sin pérdida', n => {
    const p = crearProyectoVacio(`QA ${n} entidades`)
    for (let i = 0; i < n; i++) {
      const e = crearEntidad(`Entidad ${i}`, (i % 20) * 280, Math.floor(i / 20) * 340)
      e.atributos = Array.from({ length: 12 }, (_, j) => crearAtributo(`campo_${j}`))
      e.claves.push({ id: `pk-${i}`, nombre: 'PK', tipo: 'primaria', atributoIds: [e.atributos[0].id], foranea: null })
      p.diseno.entidades.push(e)
      if (i > 0) p.diseno.relaciones.push(crearRelacion(p.diseno.entidades[i - 1].id, e.id))
    }
    const dir = join(process.cwd(), 'artefactos-locales', 'pruebas', 'rendimiento')
    mkdirSync(dir, { recursive: true })
    const tiempos: Record<string, number> = {}
    const medir = <T>(etiqueta: string, f: () => T): T => { const inicio = performance.now(); const r = f(); tiempos[etiqueta] = Math.round((performance.now() - inicio) * 100) / 100; return r }
    const ruta = join(dir, `modelo-${n}.vbdproj`)
    medir('guardarMs', () => guardarProyecto(ruta, { formatoVersion: 1, proyecto: p, historial: historialVacio() }))
    const abierto = medir('abrirMs', () => abrirProyecto(ruta))
    expect(abierto.proyecto).toEqual(p)
    const propuesta = crearPropuesta(p, { categoria: 'modelado', prioridad: 'baja', titulo: 'QA', explicacion: '', fundamento: '', supuestos: [], preguntas: [], contrapartidas: [], resultado: '', dependeDe: [], operaciones: [{ op: 'updateEntidad', id: p.diseno.entidades[n - 1].id, parche: { descripcion: 'Modificada' } }] })
    p.propuestas.push(propuesta)
    const vista = medir('proyectarMs', () => proyectarPropuesta(p, propuesta))
    const cambios = medir('compararMs', () => diferencias({ diseno: p.diseno, reglas: p.reglas }, vista.estado))
    expect(cambios).toHaveLength(1)
    const aplicado = medir('aprobarMs', () => aplicarPropuesta(p, historialVacio(), propuesta))
    expect(aplicado.ok).toBe(true)
    const captura = medir('instantaneaMs', () => crearInstantanea(aplicado.proyecto, { notas: true, revisionLocal: false, geometria: true }, 'QA'))
    const svg = medir('svgMs', () => exportarSvg(captura, 'claro'))
    expect(captura.modelo.entidades).toHaveLength(n)
    expect(captura.modelo.relaciones).toHaveLength(n - 1)
    expect(svg.contenido).toContain('Entidad ' + (n - 1))
    expect(readFileSync(ruta).length).toBeGreaterThan(n * 100)
    writeFileSync(join(dir, `metricas-${n}.json`), JSON.stringify({ entidades: n, atributos: n * 12, relaciones: n - 1, tiempos, heapMB: Math.round(process.memoryUsage().heapUsed / 1048576), alcance: 'Dominio, disco y exportador; no mide latencia del renderer ni de IA.' }, null, 2))
  }, 30000)
})
