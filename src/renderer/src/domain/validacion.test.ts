import { expect, it } from 'vitest'
import { crearEntidad, crearProyectoVacio } from './modelo'
import { validarProyecto } from './validacion'

it('identifica las FK incompletas de archivos existentes sin inventar columnas', () => {
  const p = crearProyectoVacio('Anterior')
  const origen = crearEntidad('Pedido', 0, 0), destino = crearEntidad('Cliente', 200, 0)
  origen.claves.push({ id: 'fk', nombre: 'fk', tipo: 'foranea', atributoIds: [], foranea: { entidadDestinoId: destino.id, claveDestinoIds: [], relacionId: null } })
  p.diseno.entidades.push(origen, destino)
  expect(validarProyecto(p).some(h => h.codigo === 'foranea-incompleta')).toBe(true)
  expect(origen.atributos).toHaveLength(0)
})
