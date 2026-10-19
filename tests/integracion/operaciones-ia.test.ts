import { describe, expect, it } from 'vitest'
import { operacionIAValida } from '../../src/main/ia/operaciones-validas'
import { crearAtributo, crearEntidad, crearNota, crearRelacion } from '../../src/renderer/src/domain/modelo'

describe('contrato de operaciones de IA', () => {
  it.each([
    { op: 'updateEntidad', id: 'e1', parche: { descripcion: 'Confirmado' } },
    { op: 'addEntidad', entidad: crearEntidad('Cliente', 0, 0) },
    { op: 'addAtributo', entidadId: 'e1', atributo: crearAtributo('id') },
    { op: 'addRelacion', relacion: crearRelacion('e1', 'e2') },
    { op: 'addNota', nota: crearNota('QA', 0, 0) },
    { op: 'updateClave', entidadId: 'e1', id: 'pk', parche: { atributoIds: ['a', 'b'] } }
  ])('acepta el contrato completo de $op', op => expect(operacionIAValida(op)).toBe(true))
  it.each([
    null, {}, { op: 'borrarTabla' }, { op: 'removeEntidad' },
    { op: 'updateEntidad', id: 'e1', parche: { id: 'suplantado' } },
    { op: 'updateAtributo', entidadId: 'e1', id: 'a1', parche: { nulable: 'no' } },
    { op: 'addEntidad', entidad: { id: 'e1', nombre: 'Incompleta' } },
    { op: 'updateClave', entidadId: 'e1', id: 'pk', parche: { atributoIds: ['a', 'a'] } },
    { op: 'moverEntidad', id: 'e1', x: Infinity, y: 0 }
  ])('rechaza operaciones incompletas o incompatibles: %j', op => expect(operacionIAValida(op)).toBe(false))
})
