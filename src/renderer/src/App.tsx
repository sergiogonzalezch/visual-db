import { useTienda } from './estado/tienda'
import { useEffect, useState } from 'react'
import { api } from './ipc'
import { DialogoExportacion } from './componentes/DialogoExportacion'
import { Cabecera } from './componentes/Cabecera'
import { ControlesVista, Herramientas } from './componentes/Herramientas'
import { Lienzo } from './componentes/Lienzo'
import { PanelDerecho } from './componentes/PanelDerecho'
import { BarraEstado } from './componentes/BarraEstado'
import { DialogoImportacion } from './componentes/DialogoImportacion'
import { DialogoConfiguracion } from './componentes/DialogoConfiguracion'
import { DialogoHistorial } from './componentes/DialogoHistorial'
import { DialogoRecuperacion } from './componentes/DialogoRecuperacion'

export function App(): JSX.Element {
  const tienda = useTienda()
  const [exportacionAbierta, setExportacionAbierta] = useState(false)
  useEffect(() => api().onMenu('menu:exportar', () => setExportacionAbierta(true)), [])

  return (
    <div className="aplicacion">
      <Cabecera exportar={() => setExportacionAbierta(true)} />
      <div className="cuerpo">
        <main className="zona-trabajo" aria-label="Editor del modelo">
          <div className="zona-lienzo">
            <Lienzo />
            <ControlesVista />
            {tienda.proyecto.diseno.entidades.length === 0 && tienda.proyecto.diseno.notas.length === 0 && tienda.herramienta === 'seleccion' && (
              <div className="bienvenida-lienzo"><section>
                <span className="sobre-titulo">TU ESPACIO DE DISEÑO</span>
                <h1>Tu modelo empieza aquí</h1>
                <p>Crea tu primera entidad o importa un diseño existente. Puedes configurar la IA cuando la necesites.</p>
                <div className="acciones-bienvenida"><button className="primario" onClick={() => tienda.setHerramienta('entidad')}>Crear entidad</button><button onClick={tienda.importarDrawio}>Importar draw.io</button></div>
                <small>Imagen y Markdown disponibles en Importar</small>
              </section></div>
            )}
            <Herramientas />
          </div>
        </main>
        <PanelDerecho />
      </div>
      <BarraEstado />
      {tienda.borradorImportacion && <DialogoImportacion />}
      {tienda.mostrarConfiguracion && <DialogoConfiguracion />}
      {tienda.mostrarHistorial && <DialogoHistorial />}
      {tienda.recuperacionPendiente && <DialogoRecuperacion />}
      {exportacionAbierta && <DialogoExportacion proyecto={tienda.proyecto} seleccion={tienda.seleccion} propuestaId={tienda.propuestaEnComparacion} cerrar={() => setExportacionAbierta(false)} />}
      {tienda.aviso && (
        <div
          className={`aviso-flotante ${/error|no se pudo|fallo/i.test(tienda.aviso) ? 'error' : 'info'}`}
          role={/error|no se pudo|fallo/i.test(tienda.aviso) ? 'alert' : 'status'}
        >
          <div className="aviso-contenido">{tienda.aviso.length > 240 ? <><strong>{tienda.aviso.split(':')[0]}</strong><details><summary>Ver detalles</summary><p>{tienda.aviso}</p></details></> : <span>{tienda.aviso}</span>}</div>
          <button onClick={() => tienda.setAviso(null)}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
