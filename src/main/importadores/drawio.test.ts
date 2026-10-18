import { deflateRawSync } from 'zlib'
import { describe, expect, it } from 'vitest'
import { extraerPaginas } from './drawio'
import { importarDrawio } from './drawio-borrador'

const MODELO = `
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="e1" value="Cliente&#xa;* id : PK&#xa;nombre" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="180" height="90" as="geometry"/>
    </mxCell>
    <mxCell id="e2" value="Pedido&#xa;* codigo : PK&#xa;total" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="180" height="90" as="geometry"/>
    </mxCell>
    <mxCell id="l1" value="1,N" style="edgeStyle=none;" edge="1" parent="1" source="e1" target="e2">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`

describe('importador draw.io', () => {
  it('lee un mxfile sin comprimir', () => {
    const xml = `<mxfile><diagram name="Principal" compressed="false">${MODELO}</diagram></mxfile>`
    const paginas = extraerPaginas(xml)
    expect(paginas).toHaveLength(1)
    expect(paginas[0].nombre).toBe('Principal')
  })

  it('descomprime diagramas con deflate raw', () => {
    const comprimido = deflateRawSync(Buffer.from(MODELO.trim(), 'utf-8')).toString('base64')
    const xml = `<mxfile><diagram name="Principal">${comprimido}</diagram></mxfile>`
    const paginas = extraerPaginas(xml)
    expect(paginas[0].contenido).toContain('mxGraphModel')
  })

  it('construye un borrador con entidades, claves y conexiones', () => {
    const xml = `<mxfile><diagram name="Principal" compressed="false">${MODELO}</diagram></mxfile>`
    const borrador = importarDrawio(xml)
    expect(borrador.entidades.map((e) => e.nombre).sort()).toEqual(['Cliente', 'Pedido'])
    const cliente = borrador.entidades.find((e) => e.nombre === 'Cliente')!
    expect(cliente.atributos.some((a) => a.clave === 'primaria')).toBe(true)
    expect(borrador.relaciones).toHaveLength(1)
    expect(borrador.relaciones[0].origenRef).toBe('e1')
    expect(borrador.relaciones[0].destinoRef).toBe('e2')
  })
})
