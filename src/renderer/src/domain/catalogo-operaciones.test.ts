import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearNota, crearProyectoVacio, crearRelacion } from './modelo'
import { Operacion } from './operaciones'
import { editar, deshacer, rehacer, historialVacio } from './historial'
import { crearPropuesta, aplicarPropuesta } from './aprobacion'
import { proyectarPropuesta } from './comparacion'

function escenario() {
  const p = crearProyectoVacio('Catálogo QA')
  const a = crearEntidad('Cliente', 0, 0), b = crearEntidad('Pedido', 300, 0)
  const id = crearAtributo('id'), correo = crearAtributo('email')
  a.atributos.push(id, correo)
  const pk = { id: 'pk', nombre: 'PK', tipo: 'primaria' as const, atributoIds: [id.id], foranea: null }
  a.claves.push(pk)
  const relacion = crearRelacion(a.id, b.id), ra = crearAtributo('fecha')
  relacion.atributos.push(ra)
  const nota = crearNota('Nota QA', 0, 200)
  const regla = { id: 'regla', tipo: 'negocio' as const, texto: 'Cada pedido pertenece a un cliente', dependencia: null, fragmentoOrigen: null }
  p.diseno = { entidades: [a, b], relaciones: [relacion], notas: [nota] }; p.reglas = [regla]
  const operaciones: Operacion[] = [
    { op: 'addEntidad', entidad: crearEntidad('Producto', 600, 0) },
    { op: 'updateEntidad', id: a.id, parche: { nombre: 'Persona' } },
    { op: 'moverEntidad', id: a.id, x: -100, y: 20 },
    { op: 'redimensionarEntidad', id: a.id, ancho: 360, alto: 140 },
    { op: 'removeEntidad', id: b.id },
    { op: 'addAtributo', entidadId: a.id, atributo: crearAtributo('telefono') },
    { op: 'updateAtributo', entidadId: a.id, id: correo.id, parche: { nulable: false, tipoDato: 'texto' } },
    { op: 'removeAtributo', entidadId: a.id, id: correo.id },
    { op: 'addClave', entidadId: a.id, clave: { id: 'uk', nombre: 'Correo único', tipo: 'candidata', atributoIds: [correo.id], foranea: null } },
    { op: 'updateClave', entidadId: a.id, id: pk.id, parche: { atributoIds: [id.id, correo.id] } },
    { op: 'removeClave', entidadId: a.id, id: pk.id },
    { op: 'addRelacion', relacion: crearRelacion(a.id, a.id) },
    { op: 'updateRelacion', id: relacion.id, parche: { nombre: 'Compra', fin: { ...relacion.fin, cardinalidad: { minimo: 0, maximo: 'n' } } } },
    { op: 'removeRelacion', id: relacion.id },
    { op: 'addAtributoRelacion', relacionId: relacion.id, atributo: crearAtributo('orden') },
    { op: 'updateAtributoRelacion', relacionId: relacion.id, id: ra.id, parche: { tipoDato: 'fecha' } },
    { op: 'removeAtributoRelacion', relacionId: relacion.id, id: ra.id },
    { op: 'addNota', nota: crearNota('Otra', 200, 200) },
    { op: 'updateNota', id: nota.id, parche: { texto: 'Editada', x: 90, ancho: 240 } },
    { op: 'removeNota', id: nota.id },
    { op: 'addRegla', regla: { ...regla, id: 'regla-2', texto: 'La cantidad debe ser positiva' } },
    { op: 'updateRegla', id: regla.id, parche: { texto: 'Todo pedido identifica a su cliente' } },
    { op: 'removeRegla', id: regla.id }
  ]
  return { p, operaciones }
}

describe('catálogo completo de operaciones', () => {
  it.each(escenario().operaciones.map(o => o.op))('%s: misma proyección/aprobación, sin mutación y con deshacer/rehacer', tipo => {
    const { p, operaciones } = escenario()
    const op = operaciones.find(o => o.op === tipo)!
    const antes = structuredClone(p)
    const propuesta = crearPropuesta(p, { titulo: tipo, categoria: 'modelado', prioridad: 'media', explicacion: '', fundamento: '', supuestos: [], preguntas: [], operaciones: [op], resultado: '', contrapartidas: [], dependeDe: [] })
    p.propuestas.push(propuesta)
    const vista = proyectarPropuesta(p, propuesta)
    const aprobado = aplicarPropuesta(p, historialVacio(), propuesta)
    expect(aprobado.ok).toBe(true)
    expect({ diseno: aprobado.proyecto.diseno, reglas: aprobado.proyecto.reglas }).toEqual(vista.estado)
    expect(p.diseno).toEqual(antes.diseno); expect(p.reglas).toEqual(antes.reglas)
    const estado = { diseno: p.diseno, reglas: p.reglas }
    const editado = editar(estado, historialVacio(), [op])
    const vuelto = deshacer(editado.estado, editado.historial)!
    expect(vuelto.estado).toEqual(estado)
    expect(rehacer(vuelto.estado, vuelto.historial)?.estado).toEqual(editado.estado)
  })
  it('rechaza identificadores repetidos sin aplicar el resto del grupo', () => {
    const { p } = escenario(), h = historialVacio()
    expect(() => editar({ diseno: p.diseno, reglas: p.reglas }, h, [
      { op: 'updateEntidad', id: p.diseno.entidades[0].id, parche: { nombre: 'Cambiada' } },
      { op: 'addEntidad', entidad: p.diseno.entidades[0] }
    ])).toThrow('Ya existe')
    expect(p.diseno.entidades[0].nombre).toBe('Cliente'); expect(h.entradas).toHaveLength(0)
  })
})
