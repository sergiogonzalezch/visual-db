import { usePuedeDeshacer, usePuedeRehacer, useTienda } from '../estado/tienda'
import { MenuAcciones } from './MenuAcciones'

export function Cabecera(): JSX.Element {
  const tienda = useTienda()
  const puedeDeshacer = usePuedeDeshacer()
  const puedeRehacer = usePuedeRehacer()
  return <header className="cabecera">
    <div className="identidad-aplicacion"><span className="marca-aplicacion">Visual BD</span><div className="identidad-proyecto"><strong className="titulo-proyecto" title={tienda.proyecto.nombre}>{tienda.proyecto.nombre}</strong><span className="guardado">{tienda.sucio ? 'Cambios sin guardar' : tienda.ruta ? 'Guardado' : 'Sin ruta de guardado'}</span></div></div>
    <nav className="acciones-cabecera" aria-label="Acciones del proyecto">
      <MenuAcciones etiqueta="Archivo" acciones={[
        { etiqueta: 'Nuevo proyecto', ejecutar: tienda.nuevo },
        { etiqueta: 'Abrir proyecto…', ejecutar: () => void tienda.abrir() },
        { etiqueta: 'Guardar como…', ejecutar: () => void tienda.guardarComo() }
      ]} />
      <button onClick={() => void tienda.guardar()} title="Ctrl+S">Guardar</button>
      <MenuAcciones etiqueta="Importar" acciones={[
        { etiqueta: 'Archivo draw.io…', detalle: 'Leer la estructura del diagrama', ejecutar: tienda.importarDrawio },
        { etiqueta: 'Imagen…', detalle: 'Interpretar con el modelo configurado', ejecutar: tienda.importarImagen },
        { etiqueta: 'Markdown…', ejecutar: tienda.importarMarkdown }
      ]} />
      <div className="grupo-deshacer" aria-label="Historial de edición"><button disabled={!puedeDeshacer} onClick={tienda.deshacer} title="Deshacer · Ctrl+Z" aria-label="Deshacer">↶</button><button disabled={!puedeRehacer} onClick={tienda.rehacer} title="Rehacer · Ctrl+Y" aria-label="Rehacer">↷</button></div>
      <MenuAcciones etiqueta={tienda.estadoIA.revisando ? 'Revisando con IA…' : 'Revisar'} primario acciones={[
        { etiqueta: 'Revisar reglas', detalle: 'Estructura y normalización · sin IA ni tokens', ejecutar: tienda.analizar },
        { etiqueta: 'Revisar con IA', detalle: 'Análisis y propuestas del modelo seleccionado', deshabilitada: tienda.estadoIA.revisando, ejecutar: () => void tienda.solicitarRevision() }
      ]} />
      <button className="boton-proveedores" onClick={() => tienda.setMostrarConfiguracion(true)} title="Gestionar proveedores y seleccionar modelo">Modelo / IA</button>
    </nav>
  </header>
}
