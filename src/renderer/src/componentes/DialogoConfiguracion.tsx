import { useEffect, useRef, useState } from 'react'
import { PROVEEDORES_REMOTOS, EstadoConexion, perfilProveedor, proveedorRemoto } from '@shared/ai'
import { useTienda } from '../estado/tienda'
import { useProveedores } from '../estado/useProveedores'

const etiquetas: Record<EstadoConexion, string> = { 'sin-configurar': 'Sin configurar', desconectado: 'Sin verificar', conectando: 'Conectando', conectado: 'Conectado', error: 'Error' }
const proveedores = [{ tipo: 'ollama' as const, etiqueta: 'Ollama · local' }, ...PROVEEDORES_REMOTOS]

export function DialogoConfiguracion(): JSX.Element {
  const tienda = useTienda()
  const gestor = useProveedores(tienda.ajustes, tienda.recargarAjustes)
  const dialogo = useRef<HTMLDialogElement>(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarBorrador, setMostrarBorrador] = useState(false)
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    dialogo.current?.showModal()
    return () => anterior?.focus()
  }, [])
  const { config, perfil, tipo, conexion, ocupado } = gestor
  const conectando = ocupado || conexion?.estado === 'conectando'
  const conectado = conexion?.estado === 'conectado'
  const modelos = conexion?.modelos ?? []
  const filtrados = modelos.filter((m) => m.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase()))
  const estado = conexion?.estado ?? (perfil?.claveApiEstablecida || tipo === 'ollama' ? 'desconectado' : 'sin-configurar')
  const cerrar = () => { if (!conectando) tienda.setMostrarConfiguracion(false) }
  return (
    <dialog ref={dialogo} className="dialogo configuracion" aria-labelledby="titulo-configuracion" onCancel={(e) => { e.preventDefault(); cerrar() }}>
      <header className="cabecera-dialogo gestor-cabecera"><div><p className="sobre-titulo">CONFIGURACIÓN DE IA</p><h2 id="titulo-configuracion">Tus proveedores</h2><p>Conecta una cuenta y elige el modelo que usará el editor.</p></div><button type="button" aria-label="Cerrar configuración" disabled={conectando} onClick={cerrar}>Cerrar</button></header>
      {!config || !perfil ? <p className="gestor-cargando" role="status">{gestor.aviso || 'Cargando configuración…'}</p> : <div className="gestor-distribucion">
        <nav className="lista-proveedores" aria-label="Proveedores de IA">
          {proveedores.map((p) => {
            const guardado = perfilProveedor(config, p.tipo)
            const estadoFila = gestor.estados[p.tipo]?.estado ?? (guardado.claveApiEstablecida || p.tipo === 'ollama' ? 'desconectado' : 'sin-configurar')
            return <button key={p.tipo} type="button" className={tipo === p.tipo ? 'proveedor-fila seleccionado' : 'proveedor-fila'} aria-current={tipo === p.tipo ? 'true' : undefined} disabled={conectando} onClick={() => { gestor.seleccionarProveedor(p.tipo); setBusqueda(''); setMostrarBorrador(false) }}><span>{p.etiqueta}</span><small className={`indicador indicador-${estadoFila}`}>{etiquetas[estadoFila]}{config.proveedor.proveedor === p.tipo ? ' · Activo' : ''}</small></button>
          })}
          <p className="ayuda-proveedores">Cada proveedor conserva su URL, credencial y último modelo por separado.</p>
        </nav>
        <section className="proveedor-detalle" aria-label="Configuración del proveedor" aria-busy={conectando}>
          <div className="privacidad-proveedor"><label><input type="checkbox" checked={config.soloLocal} disabled={conectando} onChange={(e) => void gestor.privacidad(e.target.checked)} />Solo local</label><small>Bloquea las API remotas.</small></div>
          <div className="proveedor-titulo"><h3>{proveedores.find((p) => p.tipo === tipo)?.etiqueta}</h3><span className={`indicador indicador-${estado}`}>{etiquetas[estado]}</span></div>
          <form onSubmit={(e) => { e.preventDefault(); void gestor.conectar() }}>
            <fieldset disabled={conectando} className="paso-proveedor">
              <legend>1. Conectar proveedor</legend>
              <div className="campo"><label htmlFor="endpoint">URL base</label><input id="endpoint" type="url" required value={perfil.endpoint} onChange={(e) => gestor.editar({ endpoint: e.target.value })} spellCheck={false} /></div>
              {tipo !== 'ollama' && <div className="campo"><label htmlFor="clave">Clave API <span className="texto-secundario">{perfil.claveApiEstablecida ? '· Guardada y cifrada' : '· Sin guardar'}</span></label><div className="entrada-credencial"><input id="clave" type={mostrarBorrador || gestor.revelada !== null ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={gestor.revelada ?? gestor.clave} placeholder={perfil.claveApiEstablecida ? '••••••••••••••••' : proveedorRemoto(tipo)?.clavePlaceholder} onChange={(e) => gestor.editarClave(e.target.value)} aria-describedby="ayuda-clave" /><button type="button" aria-pressed={mostrarBorrador || gestor.revelada !== null} onClick={() => { if (gestor.clave) setMostrarBorrador(!mostrarBorrador); else void gestor.revelar() }}>{mostrarBorrador || gestor.revelada !== null ? 'Ocultar' : 'Revelar'}</button></div><small id="ayuda-clave">{perfil.claveApiEstablecida ? 'Deja el campo vacío para conservar la clave. Escribe para reemplazarla.' : 'La clave solo se guarda en el almacén cifrado del sistema.'}</small></div>}
              <div className="acciones-proveedor"><button type="submit" className="primario" disabled={config.soloLocal && tipo !== 'ollama'}>{conectando ? 'Conectando…' : perfil.claveApiEstablecida ? 'Probar conexión' : 'Conectar'}</button>{tipo !== 'ollama' && perfil.claveApiEstablecida && <button type="button" className="peligro" onClick={() => void gestor.borrar()}>Borrar credencial</button>}</div>
            </fieldset>
          </form>
          <div className={`estado-proveedor ${gestor.fallo || estado === 'error' ? 'error' : conectado ? 'exito' : ''}`} role={gestor.fallo || estado === 'error' ? 'alert' : 'status'}>{gestor.aviso || conexion?.detalle || (config.soloLocal && tipo !== 'ollama' ? 'Desactiva Solo local para conectar esta API.' : 'Conecta para consultar los modelos disponibles.')}</div>
          <fieldset className="paso-proveedor" disabled={!conectado || conectando}>
            <legend>2. Seleccionar modelo</legend>
            <div className="campo"><label htmlFor="buscar-modelo">Buscar modelos</label><input id="buscar-modelo" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Filtrar por nombre…" /></div>
            <div className="campo"><label htmlFor="modelo">Modelo disponible</label><select id="modelo" value={modelos.includes(perfil.modelo) ? perfil.modelo : ''} onChange={(e) => { if (e.target.value) void gestor.guardarModelo(e.target.value) }}><option value="">{conectado ? 'Selecciona un modelo' : 'Primero conecta el proveedor'}</option>{[...new Set([...filtrados, ...(modelos.includes(perfil.modelo) ? [perfil.modelo] : [])])].map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <p className="texto-secundario">{conectado ? `${filtrados.length} modelos coinciden. La selección se guarda automáticamente.` : 'La lista se habilita después de validar la conexión.'}</p>
            {conectado && <p className="texto-secundario">El catálogo puede incluir modelos con acceso restringido. Conectar no ejecuta una generación ni verifica permisos de uso de cada modelo.</p>}
            {conectado && !modelos.length && <p>No hay modelos disponibles. Instala o habilita uno y vuelve a conectar.</p>}
            {conectado && modelos.length > 0 && !filtrados.length && <p>No hay resultados para esta búsqueda.</p>}
          </fieldset>
          {perfil.modelo && <p className="modelo-guardado">Último modelo: <strong>{perfil.modelo}</strong></p>}
          <p className="ayuda-proveedores">Las API remotas reciben el modelo de datos y el historial resumido. Las credenciales permanecen fuera del proyecto.</p>
        </section>
      </div>}
    </dialog>
  )
}
