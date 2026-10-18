import { useTienda } from '../estado/tienda'
import type { Historial } from '../domain/historial'
import type { Proyecto } from '../domain/modelo'

export function DialogoRecuperacion(): JSX.Element {
  const tienda = useTienda()
  const pendiente = tienda.recuperacionPendiente
  if (!pendiente) return <></>

  return (
    <div className="dialogo-fondo">
      <div className="dialogo" style={{ width: 'min(560px, 92vw)' }}>
        <div className="cabecera-dialogo">Recuperación disponible</div>
        <div className="cuerpo-dialogo">
          <p>
            Se encontró una copia de recuperación de «{pendiente.proyecto.nombre}»
            {pendiente.fecha ? ` del ${new Date(pendiente.fecha).toLocaleString('es-ES')}` : ''}, guardada
            tras un cierre inesperado o cambios sin guardar.
          </p>
          <p className="vacio">¿Quieres restaurarla o descartarla?</p>
        </div>
        <div className="pie-dialogo">
          <button
            className="peligro"
            onClick={() => void tienda.descartarRecuperacion()}
          >
            Descartar copia
          </button>
          <button
            className="primario"
            onClick={() =>
              tienda.restaurarRecuperacion(
                pendiente.proyecto as Proyecto,
                pendiente.historial as Historial
              )
            }
          >
            Restaurar copia
          </button>
        </div>
      </div>
    </div>
  )
}
