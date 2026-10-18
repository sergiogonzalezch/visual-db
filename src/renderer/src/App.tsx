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
        <main className="zona-trabajo" aria-label="Editor del modelo">
          <Herramientas />
          <div className="zona-lienzo">
            <Lienzo />
            {tienda.proyecto.diseno.entidades.length === 0 && tienda.proyecto.diseno.notas.length === 0 && tienda.herramienta === 'seleccion' && (
              <div className="bienvenida-lienzo"><section>
                <span className="sobre-titulo">TU ESPACIO DE DISEÑO</span>
                <h1>Tu modelo empieza aquí</h1>
                <p>Crea tu primera entidad o importa un diseño existente. Puedes configurar la IA cuando la necesites.</p>
                <div className="acciones-bienvenida"><button className="primario" onClick={() => tienda.setHerramienta('entidad')}>Crear entidad</button><button onClick={tienda.importarDrawio}>Importar draw.io</button></div>
                <small>Imagen y Markdown disponibles en Importar</small>
              </section></div>
            )}
          </div>
        </main>
        <PanelDerecho />
      </div>
      <BarraEstado />
      {tienda.borradorImportacion && <DialogoImportacion />}
      {tienda.mostrarConfiguracion && <DialogoConfiguracion />}
      {tienda.mostrarHistorial && <DialogoHistorial />}
      {tienda.recuperacionPendiente && <DialogoRecuperacion />}
      {tienda.aviso && (
        <div
          className="aviso-flotante"
          role="status"
        >
          <span>{tienda.aviso}</span>
          <button onClick={() => tienda.setAviso(null)}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
