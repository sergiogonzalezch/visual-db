import { proyectarPropuesta } from '../domain/comparacion'
import type { Proyecto } from '../domain/modelo'
import type { Seleccion } from '../estado/tienda'
import { etiquetaCardinalidad } from '../presentacion/geometria'

const campos = { tipoDato: 'Tipo de dato', nulable: 'Permite nulos', unico: 'Único', multivalorado: 'Multivalorado' } as const
const legible = (valor: unknown): string => valor === true ? 'Sí' : valor === false ? 'No' : valor === 'desconocido' ? 'Desconocido' : String(valor ?? 'Sin valor')

export function PropiedadesPropuestas({ proyecto, seleccion, propuestaId, volver }: {
  proyecto: Proyecto
  seleccion: Seleccion
  propuestaId: string | null
  volver: () => void
}): JSX.Element {
  const resultado = proyectarPropuesta(proyecto, proyecto.propuestas.find(p => p.id === propuestaId))
  const diseno = resultado.estado?.diseno
  const entidad = diseno?.entidades.find(e => seleccion?.tipo === 'entidad' && e.id === seleccion.id)
  const relacion = diseno?.relaciones.find(r => seleccion?.tipo === 'relacion' && r.id === seleccion.id)
  const nota = diseno?.notas.find(n => seleccion?.tipo === 'nota' && n.id === seleccion.id)
  return <section>
    <h2>Propiedades propuestas</h2>
    <p className="estado-contextual">Vista de solo lectura. Vuelve a Actual para editar.</p>
    <button onClick={volver}>Volver a Actual</button>
    {resultado.error ? <p role="alert">{resultado.error}</p> : entidad ? <>
      <h3>{entidad.nombre}</h3><p>{entidad.descripcion}</p>
      {entidad.atributos.map(atributo => <div className="cambio-campo" key={atributo.id}>
        <strong>{atributo.nombre}</strong>
        <dl>{(Object.keys(campos) as (keyof typeof campos)[]).map(campo => <div key={campo}>
          <dt>{campos[campo]}</dt><dd>{legible(atributo[campo])}</dd>
        </div>)}</dl>
      </div>)}
      <h3>Claves propuestas</h3>
      {entidad.claves.length ? entidad.claves.map(clave => <div className="cambio-campo" key={clave.id}>
        <strong>{clave.nombre}</strong><p>{clave.tipo} · {clave.atributoIds.map(id => entidad.atributos.find(a => a.id === id)?.nombre ?? id).join(', ')}</p>
        {clave.foranea && <p>Destino: {diseno?.entidades.find(e => e.id === clave.foranea?.entidadDestinoId)?.nombre ?? 'Entidad no disponible'}</p>}
      </div>) : <p>Sin claves declaradas.</p>}
    </> : relacion ? <>
      <h3>{relacion.nombre || 'Relación sin nombre'}</h3>
      {(['inicio', 'fin'] as const).map(extremo => <p key={extremo}>
        {extremo === 'inicio' ? 'Inicio' : 'Fin'}: {diseno?.entidades.find(e => e.id === relacion[extremo].entidadId)?.nombre} · {etiquetaCardinalidad(relacion[extremo].cardinalidad.minimo, relacion[extremo].cardinalidad.maximo)}
      </p>)}
    </> : nota ? <p>{nota.texto}</p> : <p>Selecciona un elemento del lienzo. Los elementos eliminados se describen en el detalle de cambios.</p>}
  </section>
}
