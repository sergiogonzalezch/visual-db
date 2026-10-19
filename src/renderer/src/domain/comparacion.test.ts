import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearProyectoVacio } from './modelo'
import { aplicarPropuesta, crearPropuesta } from './aprobacion'
import { historialVacio } from './historial'
import { comprobarPropuesta } from './propuestas'
import { diferencias, proyectarPropuesta } from './comparacion'
import { Operacion } from './operaciones'

function caso(operaciones?: Operacion[]) {
  const proyecto = crearProyectoVacio('QA')
  const entidad = crearEntidad('Cliente', 0, 0)
  const atributo = crearAtributo('email')
  entidad.atributos.push(atributo)
  proyecto.diseno.entidades.push(entidad)
  const propuesta = crearPropuesta(proyecto, {
    categoria: 'integridad', prioridad: 'alta', titulo: 'Nulabilidad', explicacion: '', fundamento: '',
    supuestos: [], preguntas: [], contrapartidas: [], resultado: '', dependeDe: [],
    operaciones: operaciones ?? [{ op: 'updateAtributo', entidadId: entidad.id, id: atributo.id, parche: { nulable: false } }]
  })
  proyecto.propuestas.push(propuesta)
  return { proyecto, entidad, atributo, propuesta }
}

describe('comparación y aprobación de atributos', () => {
  it.each([false, true])('aplica atributos existentes; representación heredada=%s', heredada => {
    const { proyecto, propuesta } = caso()
    if (heredada) propuesta.afectados.forEach(a => delete a.entidadId)
    const r = aplicarPropuesta(proyecto, historialVacio(), propuesta)
    expect(r.ok).toBe(true)
    expect(r.proyecto.diseno.entidades[0].atributos[0].nulable).toBe(false)
    expect(proyecto.diseno.entidades[0].atributos[0].nulable).toBe('desconocido')
  })
  it('bloquea conflictos reales sin modificar el historial ni el diseño', () => {
    const { proyecto, atributo, propuesta } = caso()
    atributo.nombre = 'correo'
    const historial = historialVacio()
    const r = aplicarPropuesta(proyecto, historial, propuesta)
    expect(r.ok).toBe(false)
    expect(r.proyecto).toBe(proyecto)
    expect(r.historial).toBe(historial)
    expect(r.motivos.join()).toContain('cambió')
  })
  it('no confunde el mismo ID en entidades distintas', () => {
    const { proyecto, atributo, propuesta } = caso()
    const otra = crearEntidad('Proveedor', 0, 0)
    otra.atributos.push({ ...atributo, nombre: 'distinto' })
    proyecto.diseno.entidades.unshift(otra)
    expect(comprobarPropuesta(proyecto, propuesta).aplicable).toBe(true)
  })
  it('rechaza un atributo eliminado y una identidad heredada ambigua', () => {
    const { proyecto, entidad, atributo, propuesta } = caso()
    entidad.atributos = []
    expect(comprobarPropuesta(proyecto, propuesta).aplicable).toBe(false)
    entidad.atributos.push(atributo)
    propuesta.operaciones.push({ op: 'updateAtributo', entidadId: 'otra', id: atributo.id, parche: { unico: true } })
    propuesta.afectados.forEach(a => delete a.entidadId)
    expect(comprobarPropuesta(proyecto, propuesta).aplicable).toBe(false)
  })
  it('previsualizar no muta el proyecto y muestra los valores de campos', () => {
    const { proyecto, propuesta } = caso()
    const antes = JSON.stringify(proyecto)
    const r = proyectarPropuesta(proyecto, propuesta)
    expect(r.estado?.diseno.entidades[0].atributos[0].nulable).toBe(false)
    expect(JSON.stringify(proyecto)).toBe(antes)
    expect(diferencias({ diseno: proyecto.diseno, reglas: proyecto.reglas }, r.estado)).toContainEqual(expect.objectContaining({ antes: 'desconocido', despues: 'No' }))
  })
  it('incluye reglas nuevas y no reinterpreta propuestas aplicadas como borradores', () => {
    const { proyecto, propuesta } = caso([{ op: 'addRegla', regla: { id: 'r1', texto: 'Cada cliente tiene correo', tipo: 'negocio', dependencia: null, fragmentoOrigen: null } }])
    const r = proyectarPropuesta(proyecto, propuesta)
    expect(diferencias({ diseno: proyecto.diseno, reglas: proyecto.reglas }, r.estado).some(d => d.campo.includes('Cada cliente'))).toBe(true)
    propuesta.estado = 'aplicada'
    expect(proyectarPropuesta(proyecto, propuesta).estado).toBeNull()
  })
  it('marca aclaraciones revisadas sin tocar versión, diseño ni historial', () => {
    const { proyecto, propuesta } = caso([])
    const historial = historialVacio()
    const r = aplicarPropuesta(proyecto, historial, propuesta)
    expect(r.proyecto.propuestas[0].estado).toBe('aceptada')
    expect(r.proyecto.diseno).toBe(proyecto.diseno)
    expect(r.proyecto.versionDiseno).toBe(proyecto.versionDiseno)
    expect(r.historial).toBe(historial)
    expect(aplicarPropuesta(r.proyecto, historial, r.proyecto.propuestas[0]).ok).toBe(false)
  })
  it('revierte todo el grupo cuando una operación posterior no se puede ejecutar', () => {
    const { proyecto, entidad, atributo, propuesta } = caso()
    propuesta.operaciones.push({ op: 'updateAtributo', entidadId: entidad.id, id: 'ausente', parche: { nulable: false } })
    const antes = JSON.stringify(proyecto)
    const r = aplicarPropuesta(proyecto, historialVacio(), propuesta)
    expect(r.ok).toBe(false)
    expect(JSON.stringify(proyecto)).toBe(antes)
    expect(atributo.nulable).toBe('desconocido')
    expect(r.historial.deshacer).toHaveLength(0)
  })
})
