import { describe, expect, it } from 'vitest'
import { crearEntidad, crearProyectoVacio } from './modelo'
import { historialVacio } from './historial'
import { aplicarPropuesta, crearPropuesta, rechazarPropuesta } from './aprobacion'
import { Operacion } from './operaciones'

function proyectoConEntidad() {
  const proyecto = crearProyectoVacio('t')
  const entidad = crearEntidad('Cliente', 0, 0)
  proyecto.diseno.entidades.push(entidad)
  return { proyecto, entidad }
}

describe('servicio de aprobación', () => {
  it('aplica una propuesta de forma atómica y la marca como aplicada', () => {
    const { proyecto, entidad } = proyectoConEntidad()
    const operaciones: Operacion[] = [
      { op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Cliente actualizado' } }
    ]
    const propuesta = crearPropuesta(proyecto, {
      categoria: 'modelado',
      prioridad: 'media',
      titulo: 'Renombrar',
      explicacion: 'e',
      fundamento: 'f',
      supuestos: [],
      preguntas: [],
      operaciones,
      resultado: 'r',
      contrapartidas: [],
      dependeDe: []
    })
    const proyectoConPropuesta = { ...proyecto, propuestas: [propuesta] }
    const resultado = aplicarPropuesta(proyectoConPropuesta, historialVacio(), propuesta)
    expect(resultado.ok).toBe(true)
    expect(resultado.proyecto.diseno.entidades[0].nombre).toBe('Cliente actualizado')
    expect(resultado.proyecto.versionDiseno).toBe(proyecto.versionDiseno + 1)
    expect(resultado.proyecto.propuestas[0].estado).toBe('aplicada')
    expect(resultado.historial.deshacer).toHaveLength(1)
  })

  it('detecta propuestas desactualizadas cuando el diseño cambia', () => {
    const { proyecto, entidad } = proyectoConEntidad()
    const operaciones: Operacion[] = [
      { op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Nuevo nombre' } }
    ]
    const propuesta = crearPropuesta(proyecto, {
      categoria: 'modelado',
      prioridad: 'media',
      titulo: 'Renombrar',
      explicacion: 'e',
      fundamento: 'f',
      supuestos: [],
      preguntas: [],
      operaciones,
      resultado: 'r',
      contrapartidas: [],
      dependeDe: []
    })
    const modificado = {
      ...proyecto,
      diseno: {
        ...proyecto.diseno,
        entidades: proyecto.diseno.entidades.map((e) =>
          e.id === entidad.id ? { ...e, nombre: 'Editado a mano' } : e
        )
      }
    }
    const resultado = aplicarPropuesta(modificado, historialVacio(), propuesta)
    expect(resultado.ok).toBe(false)
    expect(resultado.motivos.join(' ')).toContain('cambió')
  })

  it('rechazar conserva el diseño intacto y registra la decisión', () => {
    const { proyecto, entidad } = proyectoConEntidad()
    const propuesta = crearPropuesta(proyecto, {
      categoria: 'modelado',
      prioridad: 'baja',
      titulo: 'X',
      explicacion: 'e',
      fundamento: 'f',
      supuestos: [],
      preguntas: [],
      operaciones: [{ op: 'removeEntidad', id: entidad.id }],
      resultado: 'r',
      contrapartidas: [],
      dependeDe: []
    })
    const conPropuesta = { ...proyecto, propuestas: [propuesta] }
    const rechazado = rechazarPropuesta(conPropuesta, propuesta.id, 'no aplica')
    expect(rechazado.propuestas[0].estado).toBe('rechazada')
    expect(rechazado.diseno.entidades).toHaveLength(1)
  })
})
