import { useTienda } from './estado/tienda'
import { Cabecera } from './componentes/Cabecera'
import { Herramientas } from './componentes/Herramientas'
import { Lienzo } from './componentes/Lienzo'
import { PanelDerecho } from './componentes/PanelDerecho'
import { BarraEstado } from './componentes/BarraEstado'
import { DialogoImportacion } from './componentes/DialogoImportacion'
import { DialogoConfiguracion } from './componentes/DialogoConfiguracion'
import { DialogoHistorial } from './componentes/DialogoHistorial'
import { DialogoRecuperacion } from './componentes/DialogoRecuperacion'

export function App(): JSX.Element {
  const tienda = useTienda()

  return (
    <div className="aplicacion">
      <Cabecera />
      <div className="cuerpo">
        <Herramientas />
        <div className="zona-lienzo">
          <Lienzo />
        </div>
        <PanelDerecho />
      </div>
      <BarraEstado />
      {tienda.borradorImportacion && <DialogoImportacion />}
      {tienda.mostrarConfiguracion && <DialogoConfiguracion />}
      {tienda.mostrarHistorial && <DialogoHistorial />}
      {tienda.recuperacionPendiente && <DialogoRecuperacion />}
      {tienda.aviso && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#232b3a',
            border: '1px solid #3a465c',
            borderRadius: 8,
            padding: '10px 14px',
            zIndex: 60,
            maxWidth: 640,
            display: 'flex',
            gap: 10,
            alignItems: 'center'
          }}
          role="status"
        >
          <span>{tienda.aviso}</span>
          <button onClick={() => tienda.setAviso(null)}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
