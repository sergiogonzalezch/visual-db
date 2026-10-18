import { useTienda } from '../estado/tienda'

export function DialogoImportacion(): JSX.Element {
  const tienda = useTienda()
  const borrador = tienda.borradorImportacion
  if (!borrador) return <></>

  return (
    <div className="dialogo-fondo">
      <div className="dialogo">
        <div className="cabecera-dialogo">Confirmar interpretación importada</div>
        <div className="cuerpo-dialogo">
          <p style={{ marginBottom: 10 }}>{borrador.resumen}</p>
          <p style={{ color: 'var(--texto-suave)', fontSize: 12, marginBottom: 12 }}>
            Fuente: {borrador.procedenciaArchivo}
            {borrador.pagina ? ` · página ${borrador.pagina}` : ''} · importador {borrador.procedenciaImportador}.
            La lectura estructural es determinista; la semántica depende de las convenciones del dibujo.
            Nada no reconocido se descarta en silencio.
          </p>

          {borrador.imagenBase64 && (
            <div style={{ marginBottom: 12 }}>
              <h3>Imagen original (referencia)</h3>
              <img className="imagen-importada" src={`data:image/png;base64,${borrador.imagenBase64}`} alt="Diagrama importado" />
            </div>
          )}

          {borrador.advertencias.length > 0 && (
            <div className="aviso-importacion">
              {borrador.advertencias.map((advertencia, i) => (
                <div key={i}>⚠ {advertencia}</div>
              ))}
            </div>
          )}

          <h3>Entidades reconocidas ({borrador.entidades.length})</h3>
          <div className="lista-elementos" style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
            {borrador.entidades.length === 0 && <p className="vacio">Ninguna entidad reconocida.</p>}
            {borrador.entidades.map((entidad, i) => (
              <div key={i} className="elemento">
                <span>{entidad.nombre}</span>
                <span className="chips">
                  {entidad.atributos.map((atributo, j) => (
                    <span key={j} className="chip">
                      {atributo.clave === 'primaria' ? 'PK ' : atributo.clave === 'foranea' ? 'FK ' : ''}
                      {atributo.nombre}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>

          <h3>Conexiones reconocidas ({borrador.relaciones.length})</h3>
          {borrador.relaciones.length === 0 && <p className="vacio">Ninguna conexión reconocida.</p>}
          {borrador.relaciones.map((relacion, i) => (
            <div key={i} className="elemento" style={{ marginBottom: 4 }}>
              <span>
                {relacion.origenNombre} → {relacion.destinoNombre}
              </span>
              <span className="chips">
                <span className="chip">{relacion.cardOrigen ?? '?'}</span>
                <span className="chip">{relacion.cardDestino ?? '?'}</span>
              </span>
            </div>
          ))}

          <h3>Reglas detectadas ({borrador.reglas.length})</h3>
          {borrador.reglas.map((regla, i) => (
            <div key={i} className="elemento" style={{ marginBottom: 4 }}>
              <span>{regla.texto}</span>
            </div>
          ))}

          <h3>Ambigüedades a resolver ({tienda.ambiguidadesBorrador.length})</h3>
          {tienda.ambiguidadesBorrador.length === 0 && (
            <p className="vacio">Sin ambigüedades: la interpretación puede confirmarse directamente.</p>
          )}
          <ListaAmbiguedades />
        </div>
        <div className="pie-dialogo">
          <button onClick={tienda.descartarBorrador}>Descartar importación</button>
          <button
            className="primario"
            onClick={tienda.confirmarBorrador}
            title="Conserva la interpretación; las ambigüedades sin resolver quedan como desconocidas visibles"
          >
            Confirmar e incorporar al lienzo
          </button>
        </div>
      </div>
    </div>
  )
}

function ListaAmbiguedades(): JSX.Element {
  const tienda = useTienda()
  const borrador = tienda.borradorImportacion
  const ambiguidades = tienda.ambiguidadesBorrador
  if (!borrador) return <></>
  return (
    <div>
      <p className="vacio" style={{ padding: 0 }}>
        Resuelve cada ambigüedad aquí o déjala pendiente: al confirmar, las pendientes quedarán registradas en el
        panel Revisión como desconocidas explícitas. Podrás corregirlas visualmente después.
      </p>
      {ambiguidades.map((ambiguedad, i) => (
        <div key={ambiguedad.id} className="tarjeta-hallazgo aviso">
          <span className="marcador aviso">{ambiguedad.tipo}</span>
          <div className="explicacion">{ambiguedad.pregunta}</div>
          <div className="acciones-ambiguedad" style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {ambiguedad.acciones.map((accion) => (
              <button
                key={accion.accion}
                className={ambiguedad.resolucion?.accion === accion.accion ? 'primario' : 'auto'}
                onClick={() => tienda.resolverAmbiguedadBorrador(i, { accion: accion.accion })}
              >
                {ambiguedad.resolucion?.accion === accion.accion ? '✓ ' : ''}
                {accion.etiqueta}
              </button>
            ))}
            {ambiguedad.resolucion && (
              <button className="auto" onClick={() => tienda.resolverAmbiguedadBorrador(i, null)}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      ))}
      {borrador.figurasSinClasificar.map((figura, i) => (
        <div key={`f${i}`} className="tarjeta-hallazgo info">
          <span className="marcador info">figura sin clasificar</span>
          <div className="explicacion">{figura.texto}</div>
        </div>
      ))}
    </div>
  )
}
