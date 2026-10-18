import { describe, expect, it } from 'vitest'
import { crearEntidad, crearProyectoVacio } from './modelo'
import { deshacer, editar, historialVacio, rehacer } from './historial'

describe('historial', () => {
  it('deshace y rehace ediciones manuales', () => {
    const proyecto = crearProyectoVacio('t')
    const entidad = crearEntidad('Cliente', 10, 10)
    let estado = { diseno: proyecto.diseno, reglas: proyecto.reglas }
    let historial = historialVacio()

    const r1 = editar(estado, historial, [{ op: 'addEntidad', entidad }], { etiqueta: 'Crear' })
    estado = r1.estado
    historial = r1.historial
    expect(estado.diseno.entidades).toHaveLength(1)

    const r2 = editar(
      estado,
      historial,
      [{ op: 'updateEntidad', id: entidad.id, parche: { nombre: 'Cliente final' } }],
      { etiqueta: 'Renombrar' }
    )
    estado = r2.estado
    historial = r2.historial
    expect(estado.diseno.entidades[0].nombre).toBe('Cliente final')

    const u1 = deshacer(estado, historial)!
    expect(u1.estado.diseno.entidades[0].nombre).toBe('Cliente')
    const u2 = deshacer(u1.estado, u1.historial)!
    expect(u2.estado.diseno.entidades).toHaveLength(0)

    const g1 = rehacer(u2.estado, u2.historial)!
    expect(g1.estado.diseno.entidades).toHaveLength(1)
    const g2 = rehacer(g1.estado, g1.historial)!
    expect(g2.estado.diseno.entidades[0].nombre).toBe('Cliente final')
  })
})
