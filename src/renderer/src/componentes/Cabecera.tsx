import { usePuedeDeshacer, usePuedeRehacer, useTienda } from '../estado/tienda'

export function Cabecera(): JSX.Element {
  const tienda = useTienda()
  const puedeDeshacer = usePuedeDeshacer()
  const puedeRehacer = usePuedeRehacer()

  return (
    <header className="cabecera">
      <span className="titulo-proyecto">{tienda.proyecto.nombre}</span>
      <span className="guardado">
        {tienda.sucio ? 'Cambios sin guardar' : tienda.ruta ? 'Guardado' : 'Sin ruta de guardado'}
      </span>
      <span className="separador" />
      <button onClick={() => tienda.nuevo()}>Nuevo</button>
      <button onClick={() => void tienda.abrir()}>Abrir</button>
      <button className="primario" onClick={() => void tienda.guardar()}>
        Guardar
      </button>
      <button onClick={() => void tienda.guardarComo()}>Guardar como</button>
      <span className="separador" />
      <button onClick={() => tienda.importarDrawio()}>Importar draw.io</button>
      <button onClick={() => tienda.importarImagen()}>Importar imagen</button>
      <button onClick={() => tienda.importarMarkdown()}>Importar Markdown</button>
      <span className="separador" />
      <button disabled={!puedeDeshacer} onClick={tienda.deshacer} title="Ctrl+Z">
        Deshacer
      </button>
      <button disabled={!puedeRehacer} onClick={tienda.rehacer} title="Ctrl+Y">
        Rehacer
      </button>
      <span className="separador" />
      <button
        className="primario"
        disabled={tienda.estadoIA.revisando}
        onClick={() => void tienda.solicitarRevision()}
        title="El agente analiza el modelo y prepara propuestas; tú apruebas cada cambio"
      >
        {tienda.estadoIA.revisando ? 'Revisando…' : 'Revisar'}
      </button>
      <button onClick={tienda.analizar}>Validar local</button>
      <button onClick={() => tienda.setMostrarConfiguracion(true)}>Modelo / IA</button>
    </header>
  )
}
