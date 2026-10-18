import { useTienda } from '../estado/tienda'
import { PanelPropiedades } from './PanelPropiedades'
import { PanelRevision } from './PanelRevision'
import { PanelChat } from './PanelChat'

export function PanelDerecho(): JSX.Element {
  const tienda = useTienda()

  return (
    <aside className="panel-derecho">
      <div className="pestanas">
        <button
          className={tienda.pestana === 'propiedades' ? 'activa' : ''}
          onClick={() => tienda.setPestana('propiedades')}
        >
          Propiedades
        </button>
        <button
          className={tienda.pestana === 'revision' ? 'activa' : ''}
          onClick={() => tienda.setPestana('revision')}
        >
          Revisión
        </button>
        <button
          className={tienda.pestana === 'chat' ? 'activa' : ''}
          onClick={() => tienda.setPestana('chat')}
        >
          Chat
        </button>
      </div>
      <div className="contenido-panel">
        {tienda.pestana === 'propiedades' && <PanelPropiedades />}
        {tienda.pestana === 'revision' && <PanelRevision />}
        {tienda.pestana === 'chat' && <PanelChat />}
      </div>
    </aside>
  )
}
