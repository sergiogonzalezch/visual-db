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
