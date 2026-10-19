import { describe, expect, it, vi } from 'vitest'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { crearProyectoVacio, crearEntidad, crearAtributo, crearRelacion } from '../domain/modelo'
import { crearPropuesta } from '../domain/aprobacion'
import { crearInstantanea } from './instantanea'
import { prepararAlcance } from './alcance'
import { exportarSvg, prepararGrafico } from './graficos'
import { exportarMermaid } from './mermaid'
import { exportarDrawio } from './drawio'
import { dimensionesPng } from './png'

function proyecto() {
  const p = crearProyectoVacio('Clientes & pedidos')
  const a = crearEntidad('Cliente & <VIP>', -300, -180), b = crearEntidad('Pedido', 200, 50)
  a.atributos.push(crearAtributo('identificador'))
  a.claves.push({ id: 'pk', nombre: 'PK', tipo: 'primaria', atributoIds: [a.atributos[0].id], foranea: null })
  const r = crearRelacion(a.id, b.id)
  r.inicio.cardinalidad = { minimo: 1, maximo: 1 }; r.fin.cardinalidad = { minimo: 0, maximo: 'n' }
  p.diseno.entidades.push(a, b); p.diseno.relaciones.push(r)
  return p
}
function captura(p = proyecto()) { return crearInstantanea(p, { notas: true, revisionLocal: false, geometria: true }, '0.1.0') }

describe('diagramas exportados', () => {
  it('separa tablas anchas y enruta conexiones que atraviesan otra tabla', () => {
    const p = crearProyectoVacio('Tienda QA')
    const entidades = ['Cliente', 'Pedido', 'Producto', 'LineaPedido'].map((nombre, i) => crearEntidad(nombre, i * 280, 60))
    entidades.forEach(e => e.atributos.push(crearAtributo('identificador_extenso_sin_tipo')))
    p.diseno.entidades = entidades
    p.diseno.relaciones.push(crearRelacion(entidades[1].id, entidades[3].id))
    const g = prepararGrafico(captura(p))
    for (let i = 1; i < g.cajas.length; i++) expect(g.cajas[i].x).toBeGreaterThan(g.cajas[i - 1].x + g.cajas[i - 1].ancho)
    expect(g.conexiones[0].puntos).toHaveLength(4)
    expect(p.diseno.entidades[1].x).toBe(280)
  })
  it('SVG incluye coordenadas negativas, escapa contenido y omite controles de interfaz', () => {
    const s = captura()
    s.modelo.entidades[0].nombre = '<script>alert(1)</script>'
    const g = prepararGrafico(s), svg = exportarSvg(s, 'claro')
    expect(g.x).toBeLessThan(-300)
    expect(XMLValidator.validate(svg.contenido)).toBe(true)
    expect(svg.contenido).not.toContain('<script>')
    expect(svg.contenido).toContain('&lt;script&gt;')
    expect(svg.contenido).not.toContain('herramientas-flotantes')
    expect(svg.contenido).not.toContain('foreignObject')
    expect(svg.contenido).not.toContain('href=')
  })
  it('admite autorrelaciones y notas extensas sin cortar sus líneas', () => {
    const p = proyecto()
    p.diseno.relaciones.push(crearRelacion(p.diseno.entidades[0].id, p.diseno.entidades[0].id))
    p.diseno.notas.push({ id: 'nota', texto: 'x'.repeat(500), x: -500, y: -300, ancho: 160, alto: 50 })
    const g = prepararGrafico(captura(p))
    expect(g.conexiones[1].puntos).toHaveLength(5)
    expect(g.notas[0].lineas.join('')).toBe('x'.repeat(500))
    expect(g.notas[0].alto).toBeGreaterThan(50)
  })
  it('rechaza gráficos vacíos o relaciones rotas y controla escala de PNG', () => {
    expect(() => prepararGrafico(captura(crearProyectoVacio('Vacío')))).toThrow('vacío')
    const p = proyecto(); p.diseno.entidades.pop()
    expect(() => prepararGrafico(captura(p))).toThrow('inexistentes')
    expect(dimensionesPng(400, 300, 2)).toEqual({ ancho: 800, alto: 600 })
    expect(() => dimensionesPng(10000, 10000, 1)).toThrow('megapíxeles')
    expect(() => dimensionesPng(NaN, 300, 1)).toThrow()
  })
  it('Mermaid representa cardinalidades conocidas y advierte las desconocidas', () => {
    const p = proyecto()
    const m = exportarMermaid(captura(p))
    expect(m.contenido).toContain('E0 ||..o{ E1')
    expect(m.contenido).toContain('PK')
    expect(m.contenido).not.toContain('<VIP>')
    p.diseno.relaciones[0].fin.cardinalidad.minimo = 'desconocido'
    const incompleto = exportarMermaid(captura(p))
    expect(incompleto.contenido).not.toContain('E0 ||..o{ E1')
    expect(incompleto.advertencias.some(a => a.includes('omitida'))).toBe(true)
  })
  it('draw.io es XML editable y reimporta tablas vacías, caracteres especiales y conectores', async () => {
    // Contrato de integración cargado por Vitest; el renderer no depende del módulo Node.
    const { importarDrawio } = await vi.importActual<{ importarDrawio: (xml: string) => {
      entidades: { nombre: string; x: number; atributos: { clave: string }[] }[]
      relaciones: { cardinalidadDestino: string | null }[]
    } }>('../../../main/importadores/drawio-borrador')
    const original = proyecto()
    const salida = exportarDrawio(captura(original))
    expect(XMLValidator.validate(salida.contenido)).toBe(true)
    const doc = new XMLParser({ ignoreAttributes: false }).parse(salida.contenido)
    expect(doc.mxfile.diagram.mxGraphModel.root.mxCell.some((c: Record<string, string>) => c['@_edge'] === '1')).toBe(true)
    const importado = importarDrawio(salida.contenido)
    expect(importado.entidades).toHaveLength(2)
    expect(importado.entidades[0].nombre).toBe('Cliente & <VIP>')
    expect(importado.entidades[0].x).toBe(-300)
    expect(importado.entidades[0].atributos[0].clave).toBe('primaria')
    expect(importado.relaciones[0].cardinalidadDestino).toBe('0..n')
  })
})

describe('alcances avanzados sin modificar el proyecto', () => {
  it('seleccionar una relación incluye sus extremos y marca alcance parcial', () => {
    const p = proyecto(), antes = structuredClone(p)
    const r = prepararAlcance(p, 'seleccion', { tipo: 'relacion', id: p.diseno.relaciones[0].id }, null)
    expect(r.proyecto.diseno.entidades).toHaveLength(2)
    expect(r.contexto.alcance).toBe('seleccion')
    expect(p).toEqual(antes)
  })
  it('una entidad no arrastra todas las relaciones externas y exige una selección existente', () => {
    const p = proyecto()
    const r = prepararAlcance(p, 'seleccion', { tipo: 'entidad', id: p.diseno.entidades[0].id }, null)
    expect(r.proyecto.diseno.relaciones).toEqual([])
    expect(r.contexto.advertencias).toHaveLength(1)
    expect(() => prepararAlcance(p, 'seleccion', null, null)).toThrow('Selecciona')
  })
  it('exporta la propuesta sin aplicarla y rechaza propuestas desactualizadas', () => {
    const p = proyecto(), e = p.diseno.entidades[0]
    const propuesta = crearPropuesta(p, { categoria: 'otro', prioridad: 'baja', titulo: 'Renombrar', explicacion: '', fundamento: '', supuestos: [], preguntas: [], operaciones: [{ op: 'updateEntidad', id: e.id, parche: { nombre: 'Nuevo nombre' } }], resultado: '', contrapartidas: [], dependeDe: [] })
    p.propuestas.push(propuesta)
    const r = prepararAlcance(p, 'completo', null, propuesta.id)
    expect(r.proyecto.diseno.entidades[0].nombre).toBe('Nuevo nombre')
    expect(p.diseno.entidades[0].nombre).toBe('Cliente & <VIP>')
    expect(r.contexto.origen).toBe('propuesto')
    const s = crearInstantanea(r.proyecto, { notas: true, revisionLocal: false, geometria: true }, '0.1.0', undefined, r.contexto)
    expect(exportarSvg(s, 'claro').contenido).toContain('PROPUESTA NO APLICADA')
    propuesta.estado = 'desactualizada'
    expect(() => prepararAlcance(p, 'completo', null, propuesta.id)).toThrow('desactualizada')
  })
})
