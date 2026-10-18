import { ReactNode, useEffect, useId, useRef } from 'react'

export function DialogoBase({ titulo, children, acciones, cerrar, ancho }: {
  titulo: string; children: ReactNode; acciones: ReactNode; cerrar?: () => void; ancho?: string
}): JSX.Element {
  const id = useId()
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    dialogo.current?.showModal()
    return () => anterior?.focus()
  }, [])
  return <dialog ref={dialogo} className="dialogo" style={ancho ? { width: ancho } : undefined} aria-labelledby={id} onCancel={(e) => { e.preventDefault(); e.stopPropagation(); cerrar?.() }}>
    <h2 className="cabecera-dialogo" id={id}>{titulo}</h2>
    <div className="cuerpo-dialogo">{children}</div>
    <div className="pie-dialogo">{acciones}</div>
  </dialog>
}
