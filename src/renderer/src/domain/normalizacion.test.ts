import { describe, expect, it } from 'vitest'
import { crearAtributo, crearEntidad, crearProyectoVacio, nuevoId } from './modelo'
import { analizarNormalizacion } from './normalizacion'

describe('análisis de normalización', () => {
  it('informa información insuficiente sin dependencias declaradas', () => {
    const proyecto = crearProyectoVacio('t')
    const entidad = crearEntidad('Pedido', 0, 0)
    const codigo = crearAtributo('codigo')
    const cliente = crearAtributo('cliente_id')
    const total = crearAtributo('total')
    entidad.atributos.push(codigo, cliente, total)
    entidad.claves.push({
      id: nuevoId('k'),
      nombre: 'pk',
      tipo: 'primaria',
      atributoIds: [codigo.id],
      foranea: null
    })
    proyecto.diseno.entidades.push(entidad)
    const resultado = analizarNormalizacion(proyecto)
    expect(resultado.hallazgos.some((h) => h.estado === 'informacion-insuficiente')).toBe(true)
    expect(resultado.niveles.find(n => n.nivel === '2FN')?.estado).not.toBe('verificado')
  })

  it('detecta posible violación de 3FN con dependencia declarada', () => {
    const proyecto = crearProyectoVacio('t')
    const entidad = crearEntidad('Pedido', 0, 0)
    const codigo = crearAtributo('codigo')
    const cp = crearAtributo('codigo_postal')
    const ciudad = crearAtributo('ciudad')
    entidad.atributos.push(codigo, cp, ciudad)
    entidad.claves.push({
      id: 'k1',
      nombre: 'pk',
      tipo: 'primaria',
      atributoIds: [codigo.id],
      foranea: null
    })
    proyecto.diseno.entidades.push(entidad)
    proyecto.reglas.push({
      id: nuevaRegla(),
      tipo: 'dependencia',
      texto: 'codigo_postal → ciudad',
      dependencia: { entidadId: entidad.id, determinanteIds: [cp.id], dependientesIds: [ciudad.id] },
      fragmentoOrigen: null
    })
    const resultado = analizarNormalizacion(proyecto)
    const hallazgo3fn = resultado.hallazgos.find((h) => h.nivel === '3FN' && h.estado === 'problema-posible')
    expect(hallazgo3fn).toBeTruthy()
    expect(hallazgo3fn!.titulo).toContain('Determinante')
  })

  it('marca atributo multivalorado como problema de 1FN', () => {
    const proyecto = crearProyectoVacio('t')
    const entidad = crearEntidad('Cliente', 0, 0)
    const telefono = crearAtributo('telefono')
    telefono.multivalorado = true
    entidad.atributos.push(telefono)
    proyecto.diseno.entidades.push(entidad)
    const resultado = analizarNormalizacion(proyecto)
    const hallazgo = resultado.hallazgos.find((h) => h.nivel === '1FN' && h.estado === 'problema-posible')
    expect(hallazgo).toBeTruthy()
    expect(hallazgo!.operacionesSugeridas?.length).toBeGreaterThan(0)
  })
})

function nuevaRegla(): string {
  return nuevoId('reg')
}
