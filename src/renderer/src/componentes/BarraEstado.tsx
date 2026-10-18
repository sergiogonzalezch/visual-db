import { useTienda } from '../estado/tienda'

export function BarraEstado(): JSX.Element {
  const tienda = useTienda()
  const pendientes = tienda.proyecto.revision.ambiguidades.filter((a) => !a.resolucion).length
  const propuestasPendientes = tienda.proyecto.propuestas.filter((p) => p.estado === 'pendiente').length

  return (
    <footer className="barra-estado">
      <span className="item">
        Interpretación:{' '}
        <strong>
          {tienda.proyecto.revision.interpretacion === 'confirmada' ? 'confirmada' : 'pendiente'}
        </strong>
      </span>
      <span className="item">
        Ambigüedades pendientes: <strong>{pendientes}</strong>
      </span>
      <span className="item">
        Propuestas por aprobar: <strong>{propuestasPendientes}</strong>
      </span>
      <span className="item">Versión de diseño: v{tienda.proyecto.versionDiseno}</span>
      <span className="item">Historial: {tienda.historial.deshacer.length} pasos</span>
      <span className="item" style={{ marginLeft: 'auto' }}>
        <button onClick={() => tienda.setMostrarHistorial(true)}>Ver historial</button>
      </span>
      {tienda.estadoIA.revisando && <span className="item">El agente está revisando…</span>}
    </footer>
  )
}
