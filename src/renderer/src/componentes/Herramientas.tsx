import { useTienda } from '../estado/tienda'

export function Herramientas(): JSX.Element {
  const tienda = useTienda()
  return <div className="herramientas" role="toolbar" aria-label="Herramientas del lienzo">
    <div className="grupo-herramientas" aria-label="Crear y seleccionar">
      {([{ tipo: 'seleccion', etiqueta: 'Seleccionar', ayuda: 'Selecciona y mueve elementos' }, { tipo: 'entidad', etiqueta: '+ Entidad', ayuda: 'Haz clic en el lienzo para colocar una entidad' }, { tipo: 'relacion', etiqueta: 'Relación', ayuda: 'Elige la entidad de origen y después la de destino' }, { tipo: 'nota', etiqueta: 'Nota', ayuda: 'Haz clic en el lienzo para colocar una nota' }] as const).map((h) => <button key={h.tipo} className={tienda.herramienta === h.tipo ? 'activa' : ''} aria-pressed={tienda.herramienta === h.tipo} title={h.ayuda} onClick={() => tienda.setHerramienta(h.tipo)}>{h.etiqueta}</button>)}
    </div>
    <div className="grupo-herramientas vista-diseno" aria-label="Vista del diseño">
      <button className={tienda.vista === 'actual' ? 'activa' : ''} aria-pressed={tienda.vista === 'actual'} onClick={() => { tienda.setVista('actual'); tienda.setPropuestaEnComparacion(null) }}>Actual</button>
      <button className={tienda.vista === 'propuesto' ? 'activa' : ''} aria-pressed={tienda.vista === 'propuesto'} disabled={!tienda.propuestaEnComparacion} onClick={() => tienda.setVista('propuesto')} title="Abre una propuesta y elige Ver antes/después">Propuesto</button>
    </div>
    {tienda.entidadOrigenRelacion && <p className="instruccion-herramienta" role="status">Elige la entidad destino · Esc para cancelar</p>}
    <span className="notacion-modelo" title="Modelo relacional lógico · notación pata de cuervo">Modelo lógico</span>
  </div>
}
