import { DialogoBase } from './DialogoBase'
import { useTienda } from '../estado/tienda'
import type { Historial } from '../domain/historial'
import type { Proyecto } from '../domain/modelo'

export function DialogoRecuperacion(): JSX.Element {
  const tienda = useTienda()
  const pendiente = tienda.recuperacionPendiente
  if (!pendiente) return <></>

  return (
    <DialogoBase titulo="Recuperación disponible" ancho="min(560px, 92vw)" acciones={<>

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

    </>}>

          <p>
            Se encontró una copia de recuperación de «{pendiente.proyecto.nombre}»
            {pendiente.fecha ? ` del ${new Date(pendiente.fecha).toLocaleString('es-ES')}` : ''}, guardada
            tras un cierre inesperado o cambios sin guardar.
          </p>
          <p className="vacio">¿Quieres restaurarla o descartarla?</p>

    </DialogoBase>
  )
}
