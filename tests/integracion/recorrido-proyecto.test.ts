import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { guardarProyecto, abrirProyecto } from '../../src/main/persistencia'
import { importarDrawio } from '../../src/main/importadores/drawio-borrador'
import { importarMarkdown } from '../../src/renderer/src/importadores/markdown'
import { borradorAProyecto } from '../../src/renderer/src/importadores/borrador'
import { Proyecto } from '../../src/renderer/src/domain/modelo'
import { crearPropuesta, aplicarPropuesta } from '../../src/renderer/src/domain/aprobacion'
import { historialVacio } from '../../src/renderer/src/domain/historial'
import { proyectarPropuesta } from '../../src/renderer/src/domain/comparacion'
import { crearInstantanea } from '../../src/renderer/src/exportadores/instantanea'
import { exportarDrawio } from '../../src/renderer/src/exportadores/drawio'
import { exportarMermaid } from '../../src/renderer/src/exportadores/mermaid'

vi.mock('electron', () => ({ app: { getPath: () => process.cwd() } }))
const directorios: string[] = []
afterEach(() => directorios.splice(0).forEach(d => {
  if (!d.startsWith(join(process.cwd(), '.test-recorrido-'))) throw new Error('Directorio de prueba fuera del proyecto')
  rmSync(d, { recursive: true, force: true })
}))

describe('recorrido integrado del proyecto sin servicios externos', () => {
  it('importa, guarda, reabre, compara, aprueba, vuelve a abrir y exporta a draw.io reimportable', () => {
    const dir = mkdtempSync(join(process.cwd(), '.test-recorrido-')); directorios.push(dir)
    const ruta = join(dir, 'tienda.vbdproj')
    const { proyecto } = borradorAProyecto(importarMarkdown('## Cliente\n- id (PK)\n- email\n## Pedido\n- id (PK)\nRelación: Cliente -> (1, 0..n) Pedido', 'caso.md'), 'Tienda de regresión')
    guardarProyecto(ruta, { formatoVersion: 1, proyecto, historial: historialVacio() })
    const abierto = abrirProyecto(ruta).proyecto as Proyecto
    expect(abierto.nombre).toBe('Tienda de regresión')
    const entidad = abierto.diseno.entidades.find(e => e.nombre === 'Cliente')!
    const atributo = entidad.atributos.find(a => a.nombre === 'email')!
    const propuesta = crearPropuesta(abierto, { titulo: 'Correo obligatorio', categoria: 'integridad', prioridad: 'alta', explicacion: 'Regla confirmada por el caso', fundamento: '', supuestos: [], preguntas: [], resultado: '', contrapartidas: [], dependeDe: [], operaciones: [{ op: 'updateAtributo', entidadId: entidad.id, id: atributo.id, parche: { nulable: false } }] })
    abierto.propuestas.push(propuesta)
    expect(proyectarPropuesta(abierto, propuesta).estado).not.toBeNull()
    const aplicado = aplicarPropuesta(abierto, historialVacio(), propuesta)
    expect(aplicado.ok).toBe(true)
    guardarProyecto(ruta, { formatoVersion: 1, proyecto: aplicado.proyecto, historial: aplicado.historial })
    const final = abrirProyecto(ruta).proyecto as Proyecto
    expect(final.diseno.entidades[0].atributos.find(a => a.id === atributo.id)?.nulable).toBe(false)
    expect(final.propuestas[0].estado).toBe('aplicada')
    const captura = crearInstantanea(final, { notas: true, revisionLocal: true, geometria: true }, '0.1.0')
    const drawio = exportarDrawio(captura)
    const reimportado = importarDrawio(drawio.contenido)
    expect(reimportado.entidades.map(e => e.nombre).sort()).toEqual(['Cliente', 'Pedido'])
    expect(reimportado.relaciones).toHaveLength(1)
    expect(exportarMermaid(captura).contenido).toContain('erDiagram')
  })
})
