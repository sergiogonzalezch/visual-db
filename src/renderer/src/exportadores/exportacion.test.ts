import { describe, expect, it } from 'vitest'
import { crearProyectoVacio, crearEntidad, crearAtributo, crearRelacion } from '../domain/modelo'
import { crearInstantanea } from './instantanea'
import { exportarMarkdown } from './markdown'
import { nombreExportacion } from '@shared/exportacion'

function ejemplo() {
  const p = crearProyectoVacio('Ventas | <script>alert(1)</script>')
  const e = crearEntidad('Pedido', -200, 10)
  e.atributos.push(crearAtributo('id'), crearAtributo('tenant_id'))
  e.claves.push({ id: 'pk', nombre: 'PK compuesta', tipo: 'primaria', atributoIds: e.atributos.map(a => a.id), foranea: null })
  p.diseno.entidades.push(e)
  p.diseno.relaciones.push(crearRelacion(e.id, e.id))
  p.reglas.push({ id: 'regla', tipo: 'negocio', texto: 'No inventar\n|restricciones|', dependencia: null, fragmentoOrigen: '/ruta/privada' })
  p.diseno.notas.push({ id: 'nota', texto: 'Nota interna', x: 0, y: 0, ancho: 10, alto: 10 })
  p.procedencia = { importador: 'markdown', archivo: '/ruta/privada', pagina: null }
  return p
}
const opciones = { notas: true, revisionLocal: false }

describe('exportación semántica', () => {
  it('preserva claves compuestas, IDs y desconocidos en una copia independiente', () => {
    const p = ejemplo()
    const antes = structuredClone(p)
    const s = crearInstantanea(p, opciones, '0.1.0', '2026-10-18T12:00:00Z')
    expect(s.modelo.entidades[0].claves[0].atributoIds).toEqual(p.diseno.entidades[0].claves[0].atributoIds)
    expect(s.modelo.entidades[0].atributos[0].nulable).toBe('desconocido')
    expect(s.modelo.relaciones[0].fin.entidadId).toBe(s.modelo.entidades[0].id)
    s.modelo.entidades[0].claves[0].atributoIds.reverse()
    expect(p).toEqual(antes)
  })

  it('excluye procedencia, chat, propuestas y notas desactivadas', () => {
    const p = { ...ejemplo(), mensajesChat: [{ contenido: 'CHAT_SECRETO' }], ajustes: { clave: 'CLAVE_SECRETA' } }
    const s = crearInstantanea(p, { notas: false, revisionLocal: false }, '0.1.0')
    const json = JSON.stringify(s)
    for (const excluido of ['CHAT_SECRETO', 'CLAVE_SECRETA', '/ruta/privada', 'Nota interna', 'propuestas', 'historial']) expect(json).not.toContain(excluido)
    expect(s.notas).toEqual([])
  })

  it('reporta estructura rota sin corregir el proyecto y sin mutarlo al revisar', () => {
    const p = ejemplo()
    p.diseno.entidades[0].claves[0].atributoIds.push('inexistente')
    const antes = structuredClone(p)
    const s = crearInstantanea(p, { notas: true, revisionLocal: true }, '0.1.0')
    expect(s.advertencias.some(a => a.codigo === 'clave-atributo-inexistente')).toBe(true)
    expect(s.revisionLocal?.normalizacion.niveles).toHaveLength(4)
    expect(p).toEqual(antes)
  })

  it('genera resultados estables y escapa texto que rompe Markdown o HTML', () => {
    const p = ejemplo()
    const a = crearInstantanea(p, { notas: true, revisionLocal: true }, '0.1.0', '2026-10-18')
    const b = crearInstantanea(p, { notas: true, revisionLocal: true }, '0.1.0', '2026-10-18')
    expect(a).toEqual(b)
    const md = exportarMarkdown(a)
    expect(md).not.toContain('<script>')
    expect(md).toContain('\\|')
    expect(md).toContain('&lt;script&gt;')
    expect(md).toContain('desconocido')
    expect(md).toContain('NoSQL')
    expect(md).toContain('PK compuesta')
  })

  it('admite un modelo vacío y sanea nombres de archivo peligrosos', () => {
    const s = crearInstantanea(crearProyectoVacio('Vacío'), opciones, '0.1.0')
    expect(exportarMarkdown(s)).toContain('0 entidades')
    expect(nombreExportacion('../../CON')).not.toContain('/')
    expect(nombreExportacion('CON')).toBe('modelo')
    expect(nombreExportacion('Pedidos: 2026')).toBe('Pedidos- 2026')
  })
})
