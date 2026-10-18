import { contextBridge, ipcRenderer } from 'electron'
import type {
  BorradorImportacionIA,
  CapacidadesProveedor,
  Configuracion,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResultadoPruebaConexion,
  SolicitudChat,
  SolicitudRevision
} from '../shared/ai'

const api = {
  guardarProyecto: (ruta: string, archivo: unknown): Promise<string> =>
    ipcRenderer.invoke('proyecto:guardar', ruta, archivo),
  abrirProyectoDialogo: (): Promise<{ ruta: string; archivo: unknown } | null> =>
    ipcRenderer.invoke('proyecto:abrir-dialogo'),
  abrirProyectoRuta: (ruta: string): Promise<{ ruta?: string; archivo?: unknown; error?: string }> =>
    ipcRenderer.invoke('proyecto:abrir-ruta', ruta),
  guardarComoDialogo: (archivo: unknown, nombreSugerido: string): Promise<string | null> =>
    ipcRenderer.invoke('proyecto:guardar-como-dialogo', archivo, nombreSugerido),
  rutaActual: (): Promise<string | null> => ipcRenderer.invoke('proyecto:ruta-actual'),
  escribirRecuperacion: (idProyecto: string, archivo: unknown): Promise<void> =>
    ipcRenderer.invoke('recuperacion:escribir', idProyecto, archivo),
  leerRecuperacion: (idProyecto: string): Promise<{
    disponible: boolean
    ruta: string | null
    proyecto: unknown
    historial: unknown
    fecha: string | null
  }> => ipcRenderer.invoke('recuperacion:leer', idProyecto),
  borrarRecuperacion: (idProyecto: string): Promise<void> =>
    ipcRenderer.invoke('recuperacion:borrar', idProyecto),
  obtenerAjustes: (): Promise<Configuracion> => ipcRenderer.invoke('ajustes:obtener'),
  guardarAjustes: (config: Configuracion, claveNueva: string | null): Promise<Configuracion> =>
    ipcRenderer.invoke('ajustes:guardar', config, claveNueva),
  capacidades: (): Promise<CapacidadesProveedor> => ipcRenderer.invoke('ajustes:capacidades'),
  probarConexion: (): Promise<ResultadoPruebaConexion> => ipcRenderer.invoke('ia:probar-conexion'),
  revisar: (solicitud: SolicitudRevision): Promise<RespuestaRevisionIA> =>
    ipcRenderer.invoke('ia:revisar', solicitud),
  chatear: (solicitud: SolicitudChat): Promise<RespuestaChatIA> =>
    ipcRenderer.invoke('ia:chat', solicitud),
  interpretarImagen: (imagenBase64: string, mime: string): Promise<BorradorImportacionIA> =>
    ipcRenderer.invoke('ia:interpretar-imagen', imagenBase64, mime),
  interpretarTexto: (texto: string, nombreArchivo: string): Promise<BorradorImportacionIA> =>
    ipcRenderer.invoke('ia:interpretar-texto', texto, nombreArchivo),
  importarDrawio: (): Promise<{ ruta: string; borrador: unknown } | null> =>
    ipcRenderer.invoke('importar:drawio-archivo'),
  importarImagen: (): Promise<{ ruta: string; base64: string; mime: string } | null> =>
    ipcRenderer.invoke('importar:imagen-archivo'),
  importarMarkdown: (): Promise<{ ruta: string; contenido: string } | null> =>
    ipcRenderer.invoke('importar:markdown-archivo'),
  log: (mensaje: string): Promise<void> => ipcRenderer.invoke('diagnostico:log', mensaje),
  onMenu: (evento: string, callback: () => void): (() => void) => {
    const manejador = () => callback()
    ipcRenderer.on(evento, manejador)
    return () => ipcRenderer.removeListener(evento, manejador)
  }
}

export type ApiPreload = typeof api

contextBridge.exposeInMainWorld('api', api)
