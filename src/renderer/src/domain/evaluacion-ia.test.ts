import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearProyectoVacio } from './modelo'
import { crearPropuesta, aplicarPropuesta } from './aprobacion'
import { historialVacio } from './historial'
import { evaluarPropuestaIA } from './evaluacion-ia'
import type { Operacion } from './operaciones'

function caso(operaciones?: Operacion[]) {
  const p = crearProyectoVacio('Evidencia QA'), e = crearEntidad('Cliente', 0, 0), a = crearAtributo('email')
  e.atributos.push(a); p.diseno.entidades.push(e)
  const propuesta = crearPropuesta(p, { origenIA: { proveedor: 'ollama', modelo: 'qa' }, titulo: 'Revisar email', categoria: 'integridad', prioridad: 'media', explicacion: '', fundamento: '', resultado: '', supuestos: [], preguntas: [], contrapartidas: [], dependeDe: [], operaciones: operaciones ?? [{ op: 'updateAtributo', entidadId: e.id, id: a.id, parche: { nulable: false } }] })
  p.propuestas.push(propuesta)
  return { p, e, a, propuesta }
}
describe('evidencia y decisiones semánticas de IA', () => {
  it('no convierte una declaración desconocida en obligatoria sin revisión explícita', () => {
    const { p, a, propuesta } = caso(), h = historialVacio()
    expect(evaluarPropuestaIA(p, propuesta).requiereConfirmacion).toBe(true)
    expect(aplicarPropuesta(p, h, propuesta).ok).toBe(false)
    expect(a.nulable).toBe('desconocido')
    const r = aplicarPropuesta(p, h, propuesta, true)
    expect(r.ok).toBe(true)
    expect(r.proyecto.propuestas[0].notaDecision).toContain('Puntos revisados')
    expect(JSON.parse(JSON.stringify(r.proyecto)).propuestas[0].origenIA).toEqual({ proveedor: 'ollama', modelo: 'qa' })
  })
  it.each(['nulable', 'unico', 'multivalorado', 'tipoDato'] as const)('señala evidencia pendiente de %s', campo => {
    const { p, propuesta } = caso()
    const op = propuesta.operaciones[0]
    if (op.op === 'updateAtributo') op.parche = { [campo]: campo === 'tipoDato' ? 'texto' : true }
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('Cliente.email')
  })
  it('no certifica 3FN/BCNF a partir del texto del modelo', () => {
    const { p, propuesta } = caso([])
    propuesta.resultado = 'Cumple 3FN y BCNF'
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('no están certificadas')
    expect(evaluarPropuestaIA(p, propuesta).requiereConfirmacion).toBe(false)
  })
  it('no confunde email único con email obligatorio', () => {
    const { p, propuesta, a } = caso()
    a.unico = true
    expect(aplicarPropuesta(p, historialVacio(), propuesta).ok).toBe(false)
    expect(a.nulable).toBe('desconocido')
  })
  it('bloquea referencias inexistentes incluso cuando se confirma la revisión', () => {
    const { p, propuesta } = caso([{ op: 'updateEntidad', id: 'producto-inexistente', parche: { descripcion: 'SKU' } }])
    expect(evaluarPropuestaIA(p, propuesta).bloqueos).not.toHaveLength(0)
    expect(aplicarPropuesta(p, historialVacio(), propuesta, true).ok).toBe(false)
  })
  it('señala reglas duplicadas sin modificarlas ni borrarlas', () => {
    const regla = { id: 'r1', texto: 'Cada pedido tiene un cliente.', tipo: 'negocio' as const, dependencia: null, fragmentoOrigen: null }
    const { p, propuesta } = caso([{ op: 'addRegla', regla: { ...regla, id: 'r2', texto: 'Cada pedido tiene un cliente' } }])
    p.reglas.push(regla)
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('repite una regla')
    expect(p.reglas).toHaveLength(1)
  })
  it('exige comprobar nuevas claves compuestas y sus mapeos', () => {
    const { p, e, a, propuesta } = caso()
    propuesta.operaciones = [{ op: 'addClave', entidadId: e.id, clave: { id: 'uk', nombre: 'Email', tipo: 'candidata', atributoIds: [a.id], foranea: null } }]
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('destino compuesto')
  })
  it('mantiene las propuestas anteriores sin atribuirles un origen inventado', () => {
    const { p, propuesta } = caso()
    delete propuesta.origenIA
    expect(evaluarPropuestaIA(p, propuesta).requiereConfirmacion).toBe(false)
    expect(propuesta.origenIA).toBeUndefined()
  })
  it('detecta el par contradictorio observado en Mistral sin escoger una alternativa', () => {
    const { p, propuesta } = caso()
    propuesta.supuestos = ['El email es multivalorado.', 'El email no es multivalorado.']
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('potencialmente contradictorios')
    expect(evaluarPropuestaIA(p, propuesta).requiereConfirmacion).toBe(true)
  })
  it('advierte cambios de precio histórico sin inventar una política de precios', () => {
    const { p, propuesta } = caso([{ op: 'addRegla', regla: { id: 'precio', texto: 'El precio de la línea cambia con el catálogo', tipo: 'negocio', dependencia: null, fragmentoOrigen: null } }])
    expect(evaluarPropuestaIA(p, propuesta).advertencias.join()).toContain('precios históricos')
    expect(aplicarPropuesta(p, historialVacio(), propuesta).ok).toBe(false)
    expect(p.reglas).toEqual([])
  })
  it('rechaza una FK que pierde parte del mapeo compuesto', () => {
    const { p, e, a, propuesta } = caso()
    const destino = crearEntidad('Destino', 300, 0)
    destino.atributos = [crearAtributo('id'), crearAtributo('cuenta')]
    destino.claves = [{ id: 'pk', nombre: 'PK compuesta', tipo: 'primaria', atributoIds: destino.atributos.map(a => a.id), foranea: null }]
    p.diseno.entidades.push(destino)
    propuesta.operaciones = [{ op: 'addClave', entidadId: e.id, clave: { id: 'fk', nombre: 'Destino', tipo: 'foranea', atributoIds: [a.id], foranea: { entidadDestinoId: destino.id, claveDestinoIds: ['pk'], relacionId: null } } }]
    expect(evaluarPropuestaIA(p, propuesta).bloqueos.join()).toContain('mismo número de columnas')
    expect(aplicarPropuesta(p, historialVacio(), propuesta, true).ok).toBe(false)
  })
})
