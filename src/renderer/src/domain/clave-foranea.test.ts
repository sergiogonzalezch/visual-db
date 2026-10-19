import { describe, expect, it } from 'vitest'
import { crearForanea } from './clave-foranea'
import { crearAtributo, crearEntidad } from './modelo'

describe('mapeo de claves foráneas', () => {
  it('crea todas las columnas y referencia una clave compuesta', () => {
    const destino = crearEntidad('Linea', 0, 0)
    destino.atributos = [crearAtributo('pedido_id'), crearAtributo('producto_id')]
    destino.claves = [{ id: 'pk', nombre: 'pk', tipo: 'primaria', atributoIds: destino.atributos.map(a => a.id), foranea: null }]
    const origen = crearEntidad('Detalle', 0, 0)
    const ops = crearForanea(origen, destino)
    expect(ops.filter(o => o.op === 'addAtributo')).toHaveLength(2)
    const ultima = ops.at(-1)!
    expect(ultima.op === 'addClave' && ultima.clave.atributoIds.length).toBe(2)
    expect(ultima.op === 'addClave' && ultima.clave.foranea?.claveDestinoIds).toEqual(['pk'])
  })
  it('rechaza destinos sin clave y reutiliza columnas existentes', () => {
    const destino = crearEntidad('Cliente', 0, 0)
    const origen = crearEntidad('Pedido', 0, 0)
    expect(() => crearForanea(origen, destino)).toThrow('clave primaria')
    destino.atributos = [crearAtributo('cliente_id')]
    destino.claves = [{ id: 'pk', nombre: 'pk', tipo: 'primaria', atributoIds: [destino.atributos[0].id], foranea: null }]
    origen.atributos = [crearAtributo('cliente_id')]
    expect(crearForanea(origen, destino)).toHaveLength(1)
  })
})
