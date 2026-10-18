import { ConfigProveedor, ConexionProveedor, ProveedorTipo, perfilProveedor } from '@shared/ai'
import { cargarConfiguracion, guardarConfiguracion } from './configuracion'
import { probarConexion } from './coordinador'
import { guardarClaveApi, obtenerClaveApi } from '../almacen-credenciales'

const conexiones = new Map<ProveedorTipo, ConexionProveedor>()
const pendientes = new Map<ProveedorTipo, Promise<ConexionProveedor>>()

export function estadosProveedores(): Partial<Record<ProveedorTipo, ConexionProveedor>> {
  return Object.fromEntries(conexiones)
}

export function invalidarConexiones(): void {
  conexiones.clear()
}

export async function conectarProveedor(perfil: ConfigProveedor, clave: string | null): Promise<ConexionProveedor> {
  if (pendientes.has(perfil.proveedor)) throw new Error('Este proveedor ya se está conectando.')
  const tarea = (async (): Promise<ConexionProveedor> => {
    conexiones.set(perfil.proveedor, { estado: 'conectando', detalle: 'Validando conexión…', modelos: [] })
    try {
      const config = cargarConfiguracion()
      const url = new URL(perfil.endpoint)
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error('URL base inválida. Usa HTTP o HTTPS sin credenciales ni parámetros.')
      }
      if (config.soloLocal && (perfil.proveedor !== 'ollama' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
        throw new Error('Desactiva Solo local para conectar un proveedor remoto.')
      }
      // Conectar no modifica el proveedor activo ni borra el último modelo.
      const guardado = guardarConfiguracion({ ...config, proveedor: perfil }, clave, false)
      const resultado = await probarConexion({ ...guardado, proveedor: perfil })
      const conexion: ConexionProveedor = { estado: resultado.ok ? 'conectado' : 'error', detalle: resultado.detalle, modelos: resultado.ok ? resultado.modelos : [] }
      conexiones.set(perfil.proveedor, conexion)
      return conexion
    } catch (error) {
      const conexion: ConexionProveedor = { estado: 'error', detalle: error instanceof Error ? error.message : 'No se pudo conectar.', modelos: [] }
      conexiones.set(perfil.proveedor, conexion)
      return conexion
    }
  })()
  pendientes.set(perfil.proveedor, tarea)
  try { return await tarea } finally { pendientes.delete(perfil.proveedor) }
}

export function seleccionarModelo(tipo: ProveedorTipo, modelo: string) {
  const conexion = conexiones.get(tipo)
  if (conexion?.estado !== 'conectado' || !conexion.modelos.includes(modelo)) throw new Error('Conecta el proveedor y elige un modelo disponible.')
  const config = cargarConfiguracion()
  if (config.soloLocal && tipo !== 'ollama') throw new Error('Solo local bloquea la activación de API remotas.')
  return guardarConfiguracion({ ...config, proveedor: { ...perfilProveedor(config, tipo), modelo } }, null)
}

export function borrarCredencial(tipo: ProveedorTipo) {
  if (pendientes.has(tipo)) throw new Error('Espera a que termine la conexión.')
  guardarClaveApi(tipo, null)
  conexiones.delete(tipo)
  return cargarConfiguracion()
}

// Solo se invoca por una acción explícita de Revelar; nunca se incluye en los ajustes.
export function revelarCredencial(tipo: ProveedorTipo): string | null {
  return obtenerClaveApi(tipo)
}

export async function reconectarActivo(): Promise<void> {
  const config = cargarConfiguracion()
  if (config.proveedor.endpoint && (config.proveedor.proveedor === 'ollama' || config.proveedor.claveApiEstablecida) && (!config.soloLocal || config.proveedor.proveedor === 'ollama')) {
    await conectarProveedor(config.proveedor, null)
  }
}
