import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearProyectoVacio, crearRelacion } from './modelo'
import { Operacion, aplicarOperaciones, invertirOperacion } from './operaciones'

function estadoBase() {
  const proyecto = crearProyectoVacio('t')
  const entidadA = crearEntidad('Cliente', 0, 0)
  const entidadB = crearEntidad('Pedido', 300, 0)
  const atributo = crearAtributo('nombre')
  entidadA.atributos.push(atributo)
  proyecto.diseno.entidades.push(entidadA, entidadB)
  proyecto.diseno.relaciones.push(crearRelacion(entidadA.id, entidadB.id))
  return { proyecto, entidadA, entidadB, atributo }
}

describe('operaciones de dominio', () => {
  it('aplica y revierte una eliminación de entidad con sus relaciones', () => {
    const { proyecto, entidadA } = estadoBase()
    const estado = { diseno: proyecto.diseno, reglas: proyecto.reglas }
    const operacion: Operacion = { op: 'removeEntidad', id: entidadA.id }
    const despues = aplicarOperaciones(estado, [operacion])
    expect(despues.diseno.entidades).toHaveLength(1)
    expect(despues.diseno.relaciones).toHaveLength(0)

    const inversas = invertirOperacion(estado.diseno, estado.reglas, operacion)
    const restaurado = aplicarOperaciones(despues, inversas)
    expect(restaurado.diseno.entidades.map((e) => e.nombre).sort()).toEqual(['Cliente', 'Pedido'])
    expect(restaurado.diseno.relaciones).toHaveLength(1)
  })

  it('aplica y revierte la eliminación de un atributo con clave', () => {
    const { proyecto, entidadA, atributo } = estadoBase()
    entidadA.claves.push({
      id: 'k1',
      nombre: 'pk',
      tipo: 'primaria',
      atributoIds: [atributo.id],
      foranea: null
    })
    const estado = { diseno: proyecto.diseno, reglas: proyecto.reglas }
    const operacion: Operacion = { op: 'removeAtributo', entidadId: entidadA.id, id: atributo.id }
    const despues = aplicarOperaciones(estado, [operacion])
    expect(despues.diseno.entidades[0].atributos).toHaveLength(0)
    expect(despues.diseno.entidades[0].claves).toHaveLength(0)

    const inversas = invertirOperacion(estado.diseno, estado.reglas, operacion)
    const restaurado = aplicarOperaciones(despues, inversas)
    expect(restaurado.diseno.entidades[0].atributos).toHaveLength(1)
    expect(restaurado.diseno.entidades[0].claves[0]?.atributoIds).toEqual([atributo.id])
  })

  it('rechaza operaciones con referencias rotas', () => {
    const { proyecto } = estadoBase()
    expect(() =>
      aplicarOperaciones({ diseno: proyecto.diseno, reglas: proyecto.reglas }, [
        { op: 'updateEntidad', id: 'inexistente', parche: { nombre: 'X' } }
      ])
    ).toThrow()
  })
})
