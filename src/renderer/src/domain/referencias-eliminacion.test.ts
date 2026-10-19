import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearRelacion } from './modelo'
import { Operacion } from './operaciones'
import { editar, deshacer, rehacer, historialVacio } from './historial'

function caso() {
  const a = crearEntidad('Cliente', 0, 0), b = crearEntidad('Pedido', 300, 0)
  const id = crearAtributo('id'), otro = crearAtributo('cuenta'), fk = crearAtributo('cliente_id')
  a.atributos.push(id, otro); b.atributos.push(fk)
  a.claves.push({ id: 'pk', nombre: 'PK compuesta', tipo: 'primaria', atributoIds: [id.id, otro.id], foranea: null })
  const r = crearRelacion(a.id, b.id)
  b.claves.push({ id: 'fk', nombre: 'Cliente', tipo: 'foranea', atributoIds: [fk.id], foranea: { entidadDestinoId: a.id, claveDestinoIds: ['pk'], relacionId: r.id } })
  return { a, b, id, r, estado: { diseno: { entidades: [b, a], relaciones: [r], notas: [] }, reglas: [] } }
}

describe('eliminaciones con referencias externas', () => {
  it.each(['entidad', 'atributo', 'clave'] as const)('limpia la FK al borrar %s y la restaura al deshacer', tipo => {
    const { estado, a, b, id } = caso()
    const op: Operacion = tipo === 'entidad' ? { op: 'removeEntidad', id: a.id }
      : tipo === 'atributo' ? { op: 'removeAtributo', entidadId: a.id, id: id.id }
        : { op: 'removeClave', entidadId: a.id, id: 'pk' }
    const antes = structuredClone(estado)
    const editado = editar(estado, historialVacio(), [op])
    const pedido = editado.estado.diseno.entidades.find(e => e.id === b.id)!
    expect(pedido.claves).toEqual([])
    expect(pedido.atributos).toEqual(b.atributos)
    const vuelto = deshacer(editado.estado, editado.historial)!
    expect(vuelto.estado).toEqual(antes)
    expect(rehacer(vuelto.estado, vuelto.historial)?.estado).toEqual(editado.estado)
    expect(estado).toEqual(antes)
  })

  it('restaura una FK autorreferente sin duplicarla', () => {
    const { estado, a, id } = caso()
    a.claves.push({ id: 'self', nombre: 'Padre', tipo: 'foranea', atributoIds: [a.atributos[1].id], foranea: { entidadDestinoId: a.id, claveDestinoIds: ['pk'], relacionId: null } })
    const r = editar(estado, historialVacio(), [{ op: 'removeAtributo', entidadId: a.id, id: id.id }])
    expect(deshacer(r.estado, r.historial)?.estado).toEqual(estado)
  })
  it('no conserva media FK compuesta cuando se elimina una columna de origen', () => {
    const { estado, b } = caso()
    const segunda = crearAtributo('cuenta_cliente')
    b.atributos.push(segunda); b.claves[0].atributoIds.push(segunda.id)
    const r = editar(estado, historialVacio(), [{ op: 'removeAtributo', entidadId: b.id, id: segunda.id }])
    expect(r.estado.diseno.entidades.find(e => e.id === b.id)!.claves).toEqual([])
    expect(deshacer(r.estado, r.historial)?.estado).toEqual(estado)
  })
})
