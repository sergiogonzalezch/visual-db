import { useEffect, useRef, useState } from 'react'
import { useTienda } from '../estado/tienda'
import { Icono } from './Icono'

export function NombreProyecto(): JSX.Element {
  const tienda = useTienda()
  const [proyectoEnEdicion, setProyectoEnEdicion] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const editando = proyectoEnEdicion === tienda.proyecto.id

  useEffect(() => {
    if (editando) { entrada.current?.focus(); entrada.current?.select() }
  }, [editando])

  const confirmar = (devolverFoco = false) => {
    const nombre = entrada.current?.value.trim() ?? ''
    if (!nombre) { entrada.current?.setCustomValidity('Escribe un nombre para el proyecto.'); entrada.current?.reportValidity(); return }
    tienda.renombrarProyecto(nombre)
    setProyectoEnEdicion(null)
    if (devolverFoco) boton.current?.focus()
  }

  return <div className="identidad-proyecto">
    <div className={`editor-nombre-proyecto${editando ? ' editando' : ''}`}>
      <input ref={entrada} className="nombre-proyecto" aria-label="Nombre del proyecto"
        placeholder="Nombre del proyecto" maxLength={120} required
        readOnly={!editando} tabIndex={editando ? 0 : -1}
        title={editando ? 'Enter para confirmar' : tienda.proyecto.nombre}
        value={tienda.proyecto.nombre}
        onChange={e => { e.target.setCustomValidity(''); tienda.renombrarProyecto(e.target.value) }}
        onBlur={() => { if (editando) confirmar() }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmar(true) } }} />
      <button ref={boton} type="button" className="editar-nombre-proyecto"
        aria-label={editando ? 'Confirmar nombre del proyecto' : 'Editar nombre del proyecto'}
        title={editando ? 'Confirmar nombre · Enter' : 'Editar nombre del proyecto'}
        onMouseDown={e => { if (editando) e.preventDefault() }}
        onClick={() => editando ? confirmar(true) : setProyectoEnEdicion(tienda.proyecto.id)}>
        <Icono nombre={editando ? 'confirmar' : 'editar'} />
      </button>
    </div>
    <span className="guardado">{tienda.sucio ? 'Cambios sin guardar' : tienda.ruta ? 'Guardado' : 'Sin ruta de guardado'}</span>
  </div>
}
