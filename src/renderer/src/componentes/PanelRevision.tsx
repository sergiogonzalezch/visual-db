import { ComparacionPropuesta } from './ComparacionPropuesta'
import { comprobarPropuesta, type Propuesta } from '../domain/propuestas'
import { evaluarPropuestaIA } from '../domain/evaluacion-ia'
import { mensajeErrorVisible } from '../presentacion/errores'
import { useMemo, useState } from 'react'
import { useTienda } from '../estado/tienda'
import { Pestanas } from './Pestanas'
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
  const [filtro, setFiltro] = useState('todos')
  const [revisionConfirmada, setRevisionConfirmada] = useState<{ propuesta: Propuesta; versionDiseno: number } | null>(null)

  const ambiguidadesPendientes = proyecto.revision.ambiguidades.filter((a) => !a.resolucion)
  const propuestas = proyecto.propuestas
  const evaluaciones = useMemo(() => new Map(proyecto.propuestas.map(p => [p.id, evaluarPropuestaIA(proyecto, p)])), [proyecto])

  return (
    <div>
      <h2>Revisión del modelo</h2>
      <p className="descripcion-panel">Comprueba las reglas o evalúa propuestas antes de aplicarlas.</p>
      <Pestanas id="revision-tipo" etiqueta="Resultados de revisión" opciones={[{ valor: 'reglas', etiqueta: 'Reglas' }, { valor: 'propuestas', etiqueta: `Propuestas · ${propuestas.length}` }]} valor={tienda.seccionRevision} cambiar={tienda.setSeccionRevision} />
      <section role="tabpanel" id="revision-tipo-panel-reglas" aria-labelledby="revision-tipo-tab-reglas" hidden={tienda.seccionRevision !== 'reglas'}>
      <div className="cabecera-seccion"><h3>Revisar reglas</h3><button onClick={tienda.analizar}>Revisar ahora</button></div>
      <p className="descripcion-panel">Estructura y normalización en este equipo. Sin IA ni consumo de tokens.</p>

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
              aria-label={ambiguedad.pregunta}
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
        <p className="vacio">{tienda.resultadoNormalizacion ? 'No se encontraron problemas estructurales con la información declarada.' : 'Aún no has revisado las reglas. Elige Revisar → Revisar reglas para empezar.'}</p>
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
          Pulsa «Revisar reglas» para analizar la normalización con la información declarada (claves y
          dependencias funcionales). Sin reglas suficientes los resultados quedan limitados.
        </p>
      ) : (
        <>
          <div className="niveles-normalizacion">
            {tienda.resultadoNormalizacion.niveles.map((nivel) => (
              <div key={nivel.nivel} className="nivel-normalizacion">
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

      </section>
      <section role="tabpanel" id="revision-tipo-panel-propuestas" aria-labelledby="revision-tipo-tab-propuestas" hidden={tienda.seccionRevision !== 'propuestas'}>
      <h3>Propuestas</h3><p className="descripcion-panel">{propuestas.filter(p => p.estado === 'pendiente').length} pendientes · {propuestas.filter(p => p.estado === 'aplicada').length} aplicadas · {propuestas.filter(p => p.estado === 'aceptada').length} aclaraciones revisadas</p><p className="descripcion-panel">Las conclusiones de IA son recomendaciones sujetas a sus supuestos. La verificación de normalización corresponde a Revisar reglas.</p>
      {tienda.estadoIA.revisando && <div className="estado-contextual" role="status"><strong>Revisando con IA…</strong><button onClick={tienda.cancelarRevision}>Descartar respuesta pendiente</button><p>El modelo está preparando su análisis. El diseño actual se conserva.</p></div>}
      {tienda.estadoIA.error && <div className="estado-contextual error" role="alert"><strong>No se pudo completar la revisión</strong><p>{mensajeErrorVisible(tienda.estadoIA.error)}</p><button disabled={tienda.estadoIA.revisando} onClick={() => void tienda.solicitarRevision()}>Reintentar revisión</button><button onClick={() => tienda.setMostrarConfiguracion(true)}>Revisar proveedor y modelo</button></div>}
      {propuestas.length === 0 && (
        <p className="vacio">
          Sin propuestas. Usa «Revisar → Revisar con IA» para pedirle al agente que analice el modelo; nunca modifica el
          diseño sin tu aprobación.
        </p>
      )}
      <label className="campo">Filtrar propuestas<select value={filtro} onChange={e => setFiltro(e.target.value)}><option value="todos">Todos los estados</option><option value="pendiente">Pendientes</option><option value="aplicada">Aplicadas</option><option value="aceptada">Aclaraciones revisadas</option><option value="rechazada">Rechazadas</option><option value="desactualizada">Desactualizadas</option></select></label>
      {propuestas.length > 0 && !propuestas.some(p => filtro === 'todos' || p.estado === filtro) && <p className="vacio">No hay propuestas en este estado.</p>}
      {propuestas.filter(p => filtro === 'todos' || p.estado === filtro).map((propuesta) => {
        const abierta = propuestaAbierta === propuesta.id
        const comprobacion = comprobarPropuesta(proyecto, propuesta)
        const evaluacion = evaluaciones.get(propuesta.id)!
        const riesgosRevisados = revisionConfirmada?.propuesta === propuesta && revisionConfirmada?.versionDiseno === proyecto.versionDiseno
        const ejecutable = propuesta.operaciones.length > 0
        const comparable = ejecutable && propuesta.estado === 'pendiente' && comprobacion.aplicable
        return (
          <div key={propuesta.id} className={`tarjeta-propuesta ${abierta ? 'abierta' : ''}`}>
            <div className="fila">
              <button className="titulo-propuesta" aria-expanded={abierta} onClick={() => setPropuestaAbierta(abierta ? null : propuesta.id)}>
                {propuesta.titulo}
              </button>
              <span className={`marcador ${propuesta.estado === 'aceptada' || propuesta.estado === 'aplicada' ? 'ok' : propuesta.estado === 'rechazada' ? 'error' : propuesta.estado === 'desactualizada' ? 'aviso' : 'info'}`}>
                {propuesta.estado === 'aceptada' ? 'revisada' : propuesta.estado}
              </span>
            </div>
            <div className="chips" style={{ marginTop: 4 }}><span className="chip">{propuesta.origenIA ? `${propuesta.origenIA.proveedor} · ${propuesta.origenIA.modelo} · ` : 'Origen no registrado · '}Diseño v{propuesta.versionOrigen} · {new Date(propuesta.creadaEn).toLocaleString()}</span><span className="chip">{ejecutable ? 'Cambio propuesto' : 'Pregunta / aclaración'}</span>
              <span className="chip">{propuesta.categoria}</span>
              <span className="chip">prioridad {propuesta.prioridad}</span>
              <span className="chip">v{propuesta.version}</span>
              {propuesta.dependeDe.length > 0 && <span className="chip">depende de {propuesta.dependeDe.length}</span>}
            </div>
            {abierta && (
              <>
                <div className="acciones acciones-propuesta">
                  <button
                    disabled={!comparable}
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
                    disabled={propuesta.estado !== 'pendiente' || !comprobacion.aplicable || evaluacion.bloqueos.length > 0 || (evaluacion.requiereConfirmacion && !riesgosRevisados)}
                    onClick={() => tienda.aceptarPropuesta(propuesta.id, riesgosRevisados)}
                  >
                    {ejecutable ? 'Aceptar cambios' : 'Marcar como revisada'}
                  </button>
                  <button
                    className="peligro"
                    disabled={propuesta.estado !== 'pendiente'}
                    onClick={() => tienda.rechazarPropuesta(propuesta.id, null)}
                  >
                    Rechazar
                  </button>
                </div>
                {!!evaluacion.bloqueos.length && <div className="estado-contextual error" role="alert"><strong>Referencias por corregir</strong><ul>{evaluacion.bloqueos.map(m => <li key={m}>{m}</li>)}</ul></div>}
                {!!evaluacion.advertencias.length && <div className="estado-contextual"><strong>Revisión semántica pendiente</strong><ul>{evaluacion.advertencias.map(m => <li key={m}>{m}</li>)}</ul>{evaluacion.requiereConfirmacion && propuesta.estado === 'pendiente' && <label><input type="checkbox" checked={riesgosRevisados} onChange={e => setRevisionConfirmada(e.target.checked ? { propuesta, versionDiseno: proyecto.versionDiseno } : null)} /> Revisé estos puntos y confirmo que los cambios corresponden a las reglas de mi proyecto.</label>}</div>}
                <div className="explicacion">{propuesta.explicacion}</div>
                {propuesta.notaDecision && <p className="descripcion-panel"><strong>Decisión registrada:</strong> {propuesta.notaDecision}</p>}
                {comparable && <ComparacionPropuesta proyecto={proyecto} propuesta={propuesta} />}
                {(propuesta.estado === 'pendiente' || propuesta.estado === 'desactualizada') && !comprobacion.aplicable && <div className="estado-contextual error" role="status"><strong>No se puede aplicar</strong><ul>{comprobacion.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
                {!ejecutable && <p className="estado-contextual">Esta aclaración no modifica el diseño. Discútela o márcala como revisada.</p>}
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
                <div className="campo" style={{ marginTop: 8 }}>
                  <label htmlFor={`discusion-${propuesta.id}`}>Discutir esta propuesta (discutir no la aprueba)</label>
                  <textarea id={`discusion-${propuesta.id}`}
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
      </section>
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
