import { useState } from 'react'
import { useTienda } from '../estado/tienda'
import { EstadoNivel } from '../domain/normalizacion'

const ETIQUETA_ESTADO: Record<EstadoNivel, { texto: string; clase: string }> = {
  verificado: { texto: 'Verificado con la información declarada', clase: 'ok' },
  'problema-posible': { texto: 'Posible problema', clase: 'aviso' },
  'informacion-insuficiente': { texto: 'Información insuficiente', clase: 'info' }
}

export function PanelRevision(): JSX.Element {
  const tienda = useTienda()
  const { proyecto } = tienda
  const [propuestaAbierta, setPropuestaAbierta] = useState<string | null>(null)
  const [discusion, setDiscusion] = useState('')

  const ambiguidadesPendientes = proyecto.revision.ambiguidades.filter((a) => !a.resolucion)
  const propuestas = proyecto.propuestas

  return (
    <div>
      <h2>Revisión</h2>

      <h3>Interpretación</h3>
      <div className="fila" style={{ marginBottom: 8 }}>
        <span className={`marcador ${proyecto.revision.interpretacion === 'confirmada' ? 'ok' : 'aviso'}`}>
          {proyecto.revision.interpretacion === 'confirmada' ? 'Confirmada' : 'Pendiente de confirmar'}
        </span>
        {proyecto.revision.interpretacion === 'pendiente' && (
          <button className="auto primario" onClick={tienda.confirmarInterpretacion}>
            Confirmar interpretación
          </button>
        )}
      </div>
      {procedenciaTexto(tienda)}
      {ambiguidadesPendientes.length > 0 && (
        <div className="aviso-importacion">
          Hay {ambiguidadesPendientes.length} ambigüedad(es) sin resolver. La revisión queda limitada por
          esta información desconocida.
        </div>
      )}
      {proyecto.revision.ambiguidades.map((ambiguedad) => (
        <div key={ambiguedad.id} className="tarjeta-hallazgo aviso">
          <strong>
            <span className={`marcador ${ambiguedad.tipo === 'lectura' ? 'info' : ambiguedad.tipo === 'ausencia' ? 'info' : 'aviso'}`}>
              {ambiguedad.tipo === 'lectura' ? 'Incertidumbre de lectura' : ambiguedad.tipo === 'ausencia' ? 'Sin información' : 'Ambigüedad semántica'}
            </span>
          </strong>
          <div className="explicacion">{ambiguedad.pregunta}</div>
          <div className="fila">
            <select
              value={ambiguedad.resolucion?.accion ?? ''}
              onChange={(e) => tienda.resolverAmbiguedad(ambiguedad.id, e.target.value ? { accion: e.target.value } : null)}
            >
              <option value="">Elige una acción…</option>
              {ambiguedad.acciones.map((accion) => (
                <option key={accion.accion} value={accion.accion}>
                  {accion.etiqueta}
                </option>
              ))}
            </select>
            {ambiguedad.resolucion && (
              <button className="auto" onClick={() => tienda.resolverAmbiguedad(ambiguedad.id, null)}>
                Cambiar
              </button>
            )}
          </div>
        </div>
      ))}
      {proyecto.revision.figurasSinClasificar.length > 0 && (
        <>
          <h3>Figuras sin clasificar</h3>
          {proyecto.revision.figurasSinClasificar.map((figura) => (
            <div key={figura.id} className="tarjeta-hallazgo info">
              <span>{figura.texto}</span>
              <div className="explicacion">
                Figura no reconocida por el importador. Puedes darle significado manualmente en el diseño.
              </div>
            </div>
          ))}
        </>
      )}

      <h3>Estructura local</h3>
      {tienda.hallazgos.length === 0 ? (
        <p className="vacio">Sin hallazgos locales. Pulsa «Validar local» en la barra superior.</p>
      ) : (
        tienda.hallazgos.map((hallazgo) => (
          <div key={hallazgo.id} className={`tarjeta-hallazgo ${hallazgo.severidad}`}>
            <strong>
              <span className={`marcador ${hallazgo.severidad}`}>{hallazgo.severidad}</span> {hallazgo.mensaje}
            </strong>
            <div className="explicacion">{hallazgo.explicacion}</div>
          </div>
        ))
      )}

      <h3>Normalización (1FN–BCNF)</h3>
      {!tienda.resultadoNormalizacion ? (
        <p className="vacio">
          Pulsa «Validar local» para analizar la normalización con la información declarada (claves y
          dependencias funcionales). Sin reglas suficientes los resultados quedan limitados.
        </p>
      ) : (
        <>
          <div className="fila" style={{ marginBottom: 8 }}>
            {tienda.resultadoNormalizacion.niveles.map((nivel) => (
              <div key={nivel.nivel} className="campo" style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700 }}>{nivel.nivel}</div>
                <span className={`marcador ${ETIQUETA_ESTADO[nivel.estado].clase}`}>
                  {ETIQUETA_ESTADO[nivel.estado].texto}
                </span>
              </div>
            ))}
          </div>
          {tienda.resultadoNormalizacion.hallazgos.map((hallazgo) => (
            <div key={hallazgo.id} className={`tarjeta-hallazgo ${hallazgo.estado === 'problema-posible' ? 'aviso' : 'info'}`}>
              <strong>
                <span className="marcador info">{hallazgo.nivel}</span> {hallazgo.titulo}
              </strong>
              <div className="explicacion">{hallazgo.explicacion}</div>
              {hallazgo.preguntas.length > 0 && (
                <ul style={{ paddingLeft: 18, margin: '4px 0' }}>
                  {hallazgo.preguntas.map((pregunta, i) => (
                    <li key={i}>{pregunta}</li>
                  ))}
                </ul>
              )}
              {hallazgo.contrapartidas.length > 0 && (
                <div className="explicacion">Contras: {hallazgo.contrapartidas.join(' · ')}</div>
              )}
              {hallazgo.operacionesSugeridas && (
                <button
                  className="primario"
                  style={{ marginTop: 6 }}
                  onClick={() =>
                    tienda.agregarPropuestaLocal({
                      categoria: 'normalizacion',
                      prioridad: 'media',
                      titulo: hallazgo.titulo,
                      explicacion: hallazgo.explicacion,
                      fundamento: 'Generada por el analizador local de normalización con la información declarada.',
                      supuestos: [],
                      preguntas: hallazgo.preguntas,
                        operaciones: hallazgo.operacionesSugeridas ?? [],
                        resultado: 'Descomposición propuesta; revisa el antes/después antes de aceptar.',
                        contrapartidas: hallazgo.contrapartidas,
                      dependeDe: []
                    })
                  }
                >
                  Convertir en propuesta para aprobar
                </button>
              )}
            </div>
          ))}
        </>
      )}

      <h3>Propuestas del agente</h3>
      {propuestas.length === 0 && (
        <p className="vacio">
          Sin propuestas. Usa «Revisar» para pedirle al agente que analice el modelo; nunca modifica el
          diseño sin tu aprobación.
        </p>
      )}
      {propuestas.map((propuesta) => {
        const abierta = propuestaAbierta === propuesta.id
        return (
          <div key={propuesta.id} className={`tarjeta-propuesta ${abierta ? 'abierta' : ''}`}>
            <div className="fila">
              <strong style={{ flex: 1, cursor: 'pointer' }} onClick={() => setPropuestaAbierta(abierta ? null : propuesta.id)}>
                {propuesta.titulo}
              </strong>
              <span className={`marcador ${propuesta.estado === 'aceptada' || propuesta.estado === 'aplicada' ? 'ok' : propuesta.estado === 'rechazada' ? 'error' : propuesta.estado === 'desactualizada' ? 'aviso' : 'info'}`}>
                {propuesta.estado}
              </span>
            </div>
            <div className="chips" style={{ marginTop: 4 }}>
              <span className="chip">{propuesta.categoria}</span>
              <span className="chip">prioridad {propuesta.prioridad}</span>
              <span className="chip">v{propuesta.version}</span>
              {propuesta.dependeDe.length > 0 && <span className="chip">depende de {propuesta.dependeDe.length}</span>}
            </div>
            {abierta && (
              <>
                <div className="explicacion">{propuesta.explicacion}</div>
                <h3>Fundamento</h3>
                <div className="explicacion">{propuesta.fundamento}</div>
                {propuesta.supuestos.length > 0 && (
                  <>
                    <h3>Supuestos</h3>
                    <ul style={{ paddingLeft: 18 }}>
                      {propuesta.supuestos.map((supuesto, i) => (
                        <li key={i}>{supuesto}</li>
                      ))}
                    </ul>
                  </>
                )}
                {propuesta.preguntas.length > 0 && (
                  <>
                    <h3>Preguntas para ti</h3>
                    <ul style={{ paddingLeft: 18 }}>
                      {propuesta.preguntas.map((pregunta, i) => (
                        <li key={i}>{pregunta}</li>
                      ))}
                    </ul>
                  </>
                )}
                <h3>Resultado y contrapartidas</h3>
                <div className="explicacion">{propuesta.resultado}</div>
                {propuesta.contrapartidas.length > 0 && (
                  <ul style={{ paddingLeft: 18 }}>
                    {propuesta.contrapartidas.map((contrapartida, i) => (
                      <li key={i}>{contrapartida}</li>
                    ))}
                  </ul>
                )}
                <h3>Operaciones ({propuesta.operaciones.length})</h3>
                <div className="explicacion">
                  {propuesta.operaciones.length === 0
                    ? 'Sin operaciones estructuradas.'
                    : propuesta.operaciones.map((op) => op.op).join(', ')}
                </div>
                <div className="acciones">
                  <button
                    onClick={() => {
                      tienda.setPropuestaEnComparacion(propuesta.id)
                      tienda.setVista('propuesto')
                    }}
                  >
                    Ver antes/después
                  </button>
                  <button
                    onClick={() => {
                      tienda.setVista('actual')
                      tienda.setPropuestaEnComparacion(null)
                    }}
                  >
                    Volver a actual
                  </button>
                  <button
                    className="primario"
                    disabled={propuesta.estado !== 'pendiente'}
                    onClick={() => tienda.aceptarPropuesta(propuesta.id)}
                  >
                    Aceptar
                  </button>
                  <button
                    className="peligro"
                    disabled={propuesta.estado !== 'pendiente'}
                    onClick={() => tienda.rechazarPropuesta(propuesta.id, null)}
                  >
                    Rechazar
                  </button>
                </div>
                <div className="campo" style={{ marginTop: 8 }}>
                  <label>Discutir esta propuesta (discutir no la aprueba)</label>
                  <textarea
                    value={discusion}
                    placeholder="Ej: ¿Qué pasa si en lugar de separar la entidad modificamos la cardinalidad?"
                    onChange={(e) => setDiscusion(e.target.value)}
                  />
                </div>
                <button
                  disabled={!discusion.trim() || tienda.estadoIA.chateando}
                  onClick={() => {
                    void tienda.discutirPropuesta(propuesta.id, discusion.trim())
                    setDiscusion('')
                    tienda.setPestana('chat')
                  }}
                >
                  {tienda.estadoIA.chateando ? 'Enviando…' : 'Discutir en el chat'}
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function procedenciaTexto(tiendaRef: ReturnType<typeof useTienda>): JSX.Element | null {
  const { proyecto } = tiendaRef
  if (!proyecto.procedencia) return null
  return (
    <div className="explicacion" style={{ color: 'var(--texto-suave)', fontSize: 12, marginBottom: 8 }}>
      Importado con {proyecto.procedencia.importador}
      {proyecto.procedencia.archivo ? ` · ${proyecto.procedencia.archivo}` : ''}
      {proyecto.procedencia.pagina ? ` · página ${proyecto.procedencia.pagina}` : ''}
    </div>
  )
}
