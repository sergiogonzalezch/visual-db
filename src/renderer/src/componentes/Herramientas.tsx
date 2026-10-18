import { useId } from 'react'
import { useTienda } from '../estado/tienda'
import { usePanelArrastrable } from '../estado/usePanelArrastrable'
import { Icono } from './Icono'

export function Herramientas(): JSX.Element {
  const tienda = useTienda()
  const flotante = usePanelArrastrable()
  const ayuda = useId()
  return <div ref={flotante.panel} className={`herramientas-flotantes${flotante.moviendo ? ' arrastrando' : ''}`} style={{ left: flotante.posicion.x, top: flotante.posicion.y }}>
    <button ref={flotante.asa} className="asa-herramientas" type="button" aria-label="Mover herramientas" aria-describedby={ayuda} title="Arrastra para mover · también admite las flechas del teclado"
      onPointerDown={flotante.empezar} onPointerMove={flotante.desplazar} onPointerUp={flotante.soltar} onPointerCancel={flotante.cancelar} onLostPointerCapture={flotante.cancelar} onKeyDown={flotante.teclado}><Icono nombre="asa" /></button>
    <span id={ayuda} className="solo-lectores">Arrastra desde esta asa o usa las flechas del teclado. Shift mueve más rápido. Escape cancela el arrastre.</span>
    <div className="grupo-herramientas" role="group" aria-label="Herramientas del lienzo">
      {([{ tipo: 'seleccion', etiqueta: 'Seleccionar', ayuda: 'Selecciona y mueve elementos' }, { tipo: 'entidad', etiqueta: 'Entidad', ayuda: 'Haz clic en el lienzo para colocar una entidad' }, { tipo: 'relacion', etiqueta: 'Relación', ayuda: 'Elige la entidad de origen y después la de destino' }, { tipo: 'nota', etiqueta: 'Nota', ayuda: 'Haz clic en el lienzo para colocar una nota' }] as const).map((h) => <button type="button" key={h.tipo} className={tienda.herramienta === h.tipo ? 'activa' : ''} aria-pressed={tienda.herramienta === h.tipo} title={h.ayuda} onClick={() => tienda.setHerramienta(h.tipo)}><Icono nombre={h.tipo} /><span>{h.etiqueta}</span></button>)}
    </div>
    <button type="button" className="restablecer-herramientas" onClick={flotante.restablecer} title="Restablecer posición de herramientas" aria-label="Restablecer posición de herramientas"><Icono nombre="restablecer" /><span>Restablecer</span></button>
  </div>
}

export function ControlesVista(): JSX.Element {
  const tienda = useTienda()
  return <div className="controles-vista">
    <div className="capsula-vista">
    <span className="notacion-modelo" title="Modelo relacional lógico · notación pata de cuervo"><Icono nombre="modelo" />Modelo lógico</span>
    <div className="vista-diseno" role="group" aria-label="Vista del diseño">
      <button className={tienda.vista === 'actual' ? 'activa' : ''} aria-pressed={tienda.vista === 'actual'} onClick={() => { tienda.setVista('actual'); tienda.setPropuestaEnComparacion(null) }}>Actual</button>
      <button className={tienda.vista === 'propuesto' ? 'activa' : ''} aria-pressed={tienda.vista === 'propuesto'} disabled={!tienda.propuestaEnComparacion} onClick={() => tienda.setVista('propuesto')} title="Abre una propuesta y elige Ver antes/después">Propuesto</button>
    </div>
    </div>
    {tienda.entidadOrigenRelacion && <p className="instruccion-herramienta" role="status">Elige la entidad destino · Esc para cancelar</p>}
  </div>
}
