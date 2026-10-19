import { describe, expect, it } from 'vitest'
import { importarMarkdown } from './markdown'
import { borradorAProyecto } from './borrador'

const MUESTRA = `# Modelo de tienda

## Cliente
- id (PK)
- nombre
- codigo_postal

## Pedido
- codigo (PK)
- id_cliente (FK)
- total

## Contiene
- codigo_pedido
- producto
- cantidad

Relación: Cliente 1..N Pedido
Relación: Pedido 1..N Contiene

Regla: Cada código postal determina una única ciudad.
`

describe('importador de markdown', () => {
  it('conserva extremos y cardinalidades entre paréntesis y agrupa la PK compuesta', () => {
    const entrada = `## Pedido\n- pedido_id (PK)\n## Producto\n- producto_id (PK)\n## LineaPedido\n- pedido_id (PK)\n- producto_id (PK)\nRelación: Pedido -> (1, 1..n) LineaPedido\nRelación: Producto -> (1, 0..n) LineaPedido`
    const { proyecto } = borradorAProyecto(importarMarkdown(entrada, 'prueba.md'), 'Tienda QA')
    const lineas = proyecto.diseno.entidades.find(e => e.nombre === 'LineaPedido')!
    expect(lineas.claves.filter(c => c.tipo === 'primaria')).toHaveLength(1)
    expect(lineas.claves[0].atributoIds).toHaveLength(2)
    expect(proyecto.diseno.relaciones).toHaveLength(2)
    expect(proyecto.diseno.relaciones.every(r => r.fin.entidadId === lineas.id)).toBe(true)
    expect(proyecto.diseno.relaciones.map(r => r.fin.cardinalidad)).toEqual([{ minimo: 1, maximo: 'n' }, { minimo: 0, maximo: 'n' }])
  })

  it('no adivina entidades por una coincidencia parcial', () => {
    const borrador = importarMarkdown('## Pedido\n- id (PK)\n## LineaPedido\n- id (PK)', 'prueba.md')
    borrador.relaciones.push({ origenNombre: 'Pedido', destinoNombre: '0..n) LineaPedido', etiqueta: null, cardOrigen: null, cardDestino: null })
    const { proyecto } = borradorAProyecto(borrador, 'QA')
    expect(proyecto.diseno.relaciones).toHaveLength(0)
    expect(proyecto.revision.ambiguidades).toHaveLength(1)
  })
  it('reconoce entidades, claves y relaciones de listas y prosa', () => {
    const borrador = importarMarkdown(MUESTRA, 'modelo.md')
    expect(borrador.entidades.length).toBeGreaterThanOrEqual(3)
    const cliente = borrador.entidades.find((e) => e.nombre === 'Cliente')
    expect(cliente).toBeTruthy()
    expect(cliente!.atributos.find((a) => a.clave === 'primaria')?.nombre).toBe('id')
    expect(borrador.relaciones.length).toBeGreaterThanOrEqual(2)
    expect(borrador.reglas.length).toBeGreaterThanOrEqual(1)
  })

  it('interpreta tablas con columna PK', () => {
    const tabla = `# Facturas

## Factura

| Campo | Tipo | Notas |
|---|---|---|
| id | entero | PK |
| fecha | fecha | |
| cliente_id | entero | FK |
`
    const borrador = importarMarkdown(tabla, 'tabla.md')
    const factura = borrador.entidades.find((e) => e.nombre === 'Factura')
    expect(factura).toBeTruthy()
    expect(factura!.atributos.map((a) => a.nombre)).toContain('id')
    expect(factura!.atributos.find((a) => a.nombre === 'id')?.clave).toBe('primaria')
    expect(factura!.atributos.find((a) => a.nombre === 'cliente_id')?.clave).toBe('foranea')
  })

  it('convierte el borrador en un proyecto con interpretación pendiente cuando hay prosa', () => {
    const borrador = importarMarkdown(MUESTRA, 'modelo.md')
    const { proyecto } = borradorAProyecto(borrador, 'Tienda')
    expect(proyecto.diseno.entidades.length).toBeGreaterThanOrEqual(3)
    expect(proyecto.diseno.relaciones.length).toBeGreaterThanOrEqual(2)
    expect(proyecto.procedencia?.importador).toBe('markdown')
  })
})
