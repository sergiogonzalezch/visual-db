import { useTienda } from '../estado/tienda'

export function DialogoHistorial(): JSX.Element {
  const tienda = useTienda()
  const { historial } = tienda
  const inverso = [...historial.entradas].reverse()

  return (
    <div className="dialogo-fondo">
      <div className="dialogo">
        <div className="cabecera-dialogo">Historial de cambios</div>
        <div className="cuerpo-dialogo">
          <p className="vacio" style={{ padding: 0, marginBottom: 10 }}>
            Cambios manuales y aceptados. El deshacer funciona sobre la pila actual; los cambios
            aceptados desde propuestas se aplican como una sola operación reversible.
          </p>
          {inverso.length === 0 && <p className="vacio">Sin cambios registrados todavía.</p>}
          {inverso.map((entrada) => (
            <div key={entrada.id} className="historial-item">
              <span>{entrada.etiqueta}</span>
              <span className="fuente">
                {entrada.fuente} · {new Date(entrada.fecha).toLocaleString('es-ES')}
              </span>
            </div>
          ))}
        </div>
        <div className="pie-dialogo">
          <button disabled={!tienda.historial.deshacer.length} onClick={tienda.deshacer}>
            Deshacer último
          </button>
          <button className="primario" onClick={() => tienda.setMostrarHistorial(false)}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
