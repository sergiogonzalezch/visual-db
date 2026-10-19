import { diferencias, proyectarPropuesta } from '../domain/comparacion'
import { Proyecto } from '../domain/modelo'
import { Propuesta } from '../domain/propuestas'

export function ComparacionPropuesta({ proyecto, propuesta }: { proyecto: Proyecto; propuesta: Propuesta }): JSX.Element {
  const resultado = proyectarPropuesta(proyecto, propuesta)
  if (!resultado.estado) return <p className="estado-contextual error" role="status">{resultado.error}</p>
  const nombres = new Map<string, string>()
  for (const estado of [{ diseno: proyecto.diseno, reglas: proyecto.reglas }, resultado.estado]) {
    for (const e of estado.diseno.entidades) {
      nombres.set(e.id, e.nombre)
      e.atributos.forEach(a => nombres.set(a.id, `${e.nombre}.${a.nombre}`))
      e.claves.forEach(c => nombres.set(c.id, `${e.nombre}.${c.nombre}`))
    }
  }
  const legible = (texto: string) => {
    if (nombres.has(texto)) return nombres.get(texto)
    if (texto.startsWith('[')) { try { const valores = JSON.parse(texto); return valores.map((v: unknown) => typeof v === 'string' ? nombres.get(v) ?? v : JSON.stringify(v)).join(', ') } catch { return texto } }
    return texto
  }
  const cambios = diferencias({ diseno: proyecto.diseno, reglas: proyecto.reglas }, resultado.estado)
  return <section className="comparacion-detalle" aria-label="Cambios antes y después">
    <h3>Cambios · {cambios.length}</h3>
    <p className="descripcion-panel">Actual → Propuesto. Revisa también las reglas y restricciones que no aparecen en el lienzo.</p>
    {cambios.length ? cambios.map((c, i) => <div className="cambio-campo" key={i}>
      <strong>{c.campo}</strong><dl><dt>Actual</dt><dd>{legible(c.antes)}</dd><dt>Propuesto</dt><dd>{legible(c.despues)}</dd></dl>
    </div>) : <p>Las operaciones no producen diferencias respecto al diseño actual.</p>}
  </section>
}
