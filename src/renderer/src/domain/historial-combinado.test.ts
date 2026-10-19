import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearProyectoVacio, crearRelacion } from './modelo'
import { deshacer, editar, historialVacio, rehacer } from './historial'

describe('historial de operaciones combinadas', () => {
  it('deshace una entidad creada y modificada en el mismo grupo', () => {
    const p = crearProyectoVacio('QA')
    const entidad = crearEntidad('Cliente', 0, 0)
    const estado = { diseno: p.diseno, reglas: p.reglas }
    const r = editar(estado, historialVacio(), [
      { op: 'addEntidad', entidad },
      { op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Persona' } }
    ])
    const vuelto = deshacer(r.estado, r.historial)!
    expect(vuelto.estado).toEqual(estado)
    expect(rehacer(vuelto.estado, vuelto.historial)?.estado).toEqual(r.estado)
  })

  it('recupera el valor original tras dos cambios sucesivos del mismo campo', () => {
    const entidad = crearEntidad('Original', 0, 0)
    const estado = { diseno: { entidades: [entidad], relaciones: [], notas: [] }, reglas: [] }
    const r = editar(estado, historialVacio(), [
      { op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Intermedio' } },
      { op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Final' } }
    ])
    expect(deshacer(r.estado, r.historial)?.estado).toEqual(estado)
  })

  it('restaura primero la entidad y después sus relaciones al deshacer una eliminación', () => {
    const a = crearEntidad('Cliente', 0, 0)
    const b = crearEntidad('Pedido', 300, 0)
    const relacion = crearRelacion(a.id, b.id)
    const estado = { diseno: { entidades: [a, b], relaciones: [relacion], notas: [] }, reglas: [] }
    const r = editar(estado, historialVacio(), [{ op: 'removeEntidad', id: b.id }])
    expect(deshacer(r.estado, r.historial)?.estado).toEqual(estado)
  })

  it('restaura el atributo antes que la clave y conserva la entrada si falla un grupo', () => {
    const e = crearEntidad('Cliente', 0, 0)
    const a = crearAtributo('id')
    e.atributos.push(a)
    e.claves.push({ id: 'pk', nombre: 'PK', tipo: 'primaria', atributoIds: [a.id], foranea: null })
    const estado = { diseno: { entidades: [e], relaciones: [], notas: [] }, reglas: [] }
    const h = historialVacio()
    const r = editar(estado, h, [{ op: 'removeAtributo', entidadId: e.id, id: a.id }])
    expect(deshacer(r.estado, r.historial)?.estado).toEqual(estado)
    expect(() => editar(estado, h, [
      { op: 'updateEntidad', id: e.id, parche: { nombre: 'Cambiado' } },
      { op: 'updateEntidad', id: 'ausente', parche: { nombre: 'Error' } }
    ])).toThrow()
    expect(e.nombre).toBe('Cliente')
    expect(h.entradas).toEqual([])
  })
})
