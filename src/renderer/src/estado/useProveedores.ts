import { useEffect, useState } from 'react'
import { ConfigProveedor, Configuracion, ConexionProveedor, ProveedorTipo, perfilProveedor } from '@shared/ai'
import { api } from '../ipc'

export function useProveedores(inicial: Configuracion | null, recargar: () => Promise<Configuracion>) {
  const [config, setConfig] = useState(inicial)
  const [tipo, setTipo] = useState<ProveedorTipo>(inicial?.proveedor.proveedor ?? 'ollama')
  const [borradores, setBorradores] = useState<Partial<Record<ProveedorTipo, ConfigProveedor>>>({})
  const [claves, setClaves] = useState<Partial<Record<ProveedorTipo, string>>>({})
  const [estados, setEstados] = useState<Partial<Record<ProveedorTipo, ConexionProveedor>>>({})
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState('')
  const [fallo, setFallo] = useState(false)
  const [revelada, setRevelada] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void Promise.all([api().obtenerAjustes(), api().estadosProveedores()]).then(([c, e]) => {
      if (vivo) { setConfig(c); setEstados(e) }
    }).catch(() => { if (vivo) { setFallo(true); setAviso('No se pudieron cargar los proveedores.') } })
    const desuscribir = api().onProveedores(() => {
      void api().estadosProveedores().then((e) => { if (vivo) setEstados((prev) => ({ ...e, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v.estado === 'desconectado')) })) }).catch(() => {})
    })
    return () => { vivo = false; desuscribir() }
  }, [])
  const perfil = config ? borradores[tipo] ?? perfilProveedor(config, tipo) : null
  const conexion = estados[tipo]
  const clave = claves[tipo] ?? ''
  function editar(parche: Partial<ConfigProveedor>): void {
    if (!perfil) return
    setBorradores((p) => ({ ...p, [tipo]: { ...perfil, ...parche } }))
    setEstados((e) => ({ ...e, [tipo]: { estado: 'desconectado', detalle: 'Cambios pendientes. Vuelve a conectar.', modelos: [] } }))
    setAviso('')
  }
  async function ejecutar(tarea: () => Promise<void>): Promise<void> {
    setOcupado(true); setFallo(false); setAviso('')
    try { await tarea() }
    catch (error) {
      const detalle = error instanceof Error ? error.message : 'No se pudo completar la operación.'
      setFallo(true); setAviso(detalle)
      setEstados((e) => e[tipo]?.estado === 'conectando' ? { ...e, [tipo]: { estado: 'error', detalle, modelos: [] } } : e)
    }
    finally { setOcupado(false) }
  }
  async function refrescar(): Promise<void> {
    setConfig(await recargar())
  }
  const limpiarBorrador = () => {
    setBorradores((b) => { const copia = { ...b }; delete copia[tipo]; return copia })
    setClaves((c) => ({ ...c, [tipo]: '' }))
  }
  return { config, tipo, perfil, clave, estados, conexion, ocupado, aviso, fallo, revelada,
    seleccionarProveedor: (nuevo: ProveedorTipo) => { setRevelada(null); setAviso(''); setFallo(false); setTipo(nuevo) },
    editar,
    editarClave: (valor: string) => { setClaves((c) => ({ ...c, [tipo]: valor })); setRevelada(null); editar({}) },
    conectar: () => ejecutar(async () => {
      if (!perfil) return
      setRevelada(null)
      setEstados((e) => ({ ...e, [tipo]: { estado: 'conectando', detalle: 'Validando credenciales y consultando modelos…', modelos: [] } }))
      const resultado = await api().conectarProveedor(perfil, clave.trim() || null)
      setEstados((e) => ({ ...e, [tipo]: resultado }))
      await refrescar()
      if (resultado.estado !== 'conectado') throw new Error(resultado.detalle)
      limpiarBorrador()
      setAviso('Conexión validada. Selecciona un modelo para usar este proveedor.')
    }),
    guardarModelo: (modelo: string) => ejecutar(async () => {
      const guardada = await api().seleccionarModelo(tipo, modelo)
      setConfig(guardada); await recargar()
      setAviso('Modelo guardado. Este es ahora el proveedor activo.')
    }),
    borrar: () => ejecutar(async () => {
      setRevelada(null); await api().borrarCredencial(tipo); limpiarBorrador()
      setEstados((e) => ({ ...e, [tipo]: { estado: 'sin-configurar', detalle: 'Credencial eliminada. La URL y el modelo se conservan.', modelos: [] } }))
      await refrescar(); setAviso('Credencial eliminada del almacén seguro.')
    }),
    revelar: () => ejecutar(async () => { setRevelada(revelada === null ? clave || await api().revelarCredencial(tipo) || '' : null) }),
    privacidad: (soloLocal: boolean) => ejecutar(async () => {
      if (!config) return
      await api().guardarAjustes({ ...config, soloLocal }, null)
      setConfig(await recargar()); setEstados({})
      setAviso(soloLocal ? 'Solo local activado.' : 'Conexiones remotas permitidas.')
    })
  }
}
