import { useTienda } from '../estado/tienda'
import { PanelPropiedades } from './PanelPropiedades'
import { PanelRevision } from './PanelRevision'
import { PanelChat } from './PanelChat'
import { PanelConsumo } from './PanelConsumo'
import { Pestanas } from './Pestanas'
const opciones = [{ valor: 'propiedades', etiqueta: 'Propiedades' }, { valor: 'revision', etiqueta: 'Revisión' }, { valor: 'chat', etiqueta: 'Chat' }, { valor: 'consumo', etiqueta: 'Consumo' }] as const
export function PanelDerecho(): JSX.Element {
  const tienda = useTienda()
  return <aside className="panel-derecho" aria-label="Inspector del proyecto">
    <Pestanas id="inspector" etiqueta="Paneles del proyecto" opciones={opciones} valor={tienda.pestana} cambiar={tienda.setPestana} />
    <div className={`contenido-panel panel-${tienda.pestana}`} role="tabpanel" id={`inspector-panel-${tienda.pestana}`} aria-labelledby={`inspector-tab-${tienda.pestana}`} tabIndex={0}>
      {tienda.pestana === 'propiedades' && <PanelPropiedades />}
      {tienda.pestana === 'revision' && <PanelRevision />}
      {tienda.pestana === 'chat' && <PanelChat />}
      {tienda.pestana === 'consumo' && <PanelConsumo />}
    </div>
  </aside>
}
