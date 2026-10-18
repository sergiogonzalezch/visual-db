import { useTienda } from '../estado/tienda'

export function Herramientas(): JSX.Element {
  const tienda = useTienda()

  return (
    <aside className="herramientas">
      <h3>Herramientas</h3>
      <button
        className={tienda.herramienta === 'seleccion' ? 'activa' : ''}
        onClick={() => tienda.setHerramienta('seleccion')}
      >
        Seleccionar
      </button>
      <button
        className={tienda.herramienta === 'entidad' ? 'activa' : ''}
        onClick={() => tienda.setHerramienta('entidad')}
        title="Haz clic en el lienzo para colocar la entidad"
      >
        Entidad
      </button>
      <button
        className={tienda.herramienta === 'relacion' ? 'activa' : ''}
        onClick={() => tienda.setHerramienta('relacion')}
        title="Haz clic en la entidad origen y después en el destino"
      >
        Relación
      </button>
      <button
        className={tienda.herramienta === 'nota' ? 'activa' : ''}
        onClick={() => tienda.setHerramienta('nota')}
      >
        Nota
      </button>
      {tienda.entidadOrigenRelacion && (
        <div className="aviso-importacion">
          Elige la entidad destino de la relación o pulsa Esc para cancelar.
        </div>
      )}
      <h3>Vista</h3>
      <button
        className={tienda.vista === 'actual' ? 'activa' : ''}
        onClick={() => {
          tienda.setVista('actual')
          tienda.setPropuestaEnComparacion(null)
        }}
      >
        Actual
      </button>
      <button
        className={tienda.vista === 'propuesto' ? 'activa' : ''}
        disabled={!tienda.propuestaEnComparacion}
        onClick={() => tienda.setVista('propuesto')}
        title="Selecciona una propuesta y usa «Ver antes/después»"
      >
        Propuesto
      </button>
      <h3>Modelo</h3>
      <div className="chips">
        <span className="chip">Pata de cuervo</span>
        <span className="chip">Relacional lógico</span>
      </div>
    </aside>
  )
}
