import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import {
  BorradorImportacionIA,
  Configuracion,
  RespuestaChatIA,
  RespuestaRevisionIA,
  ResumenConsumo,
  ResultadoPruebaConexion,
  SolicitudChat,
  SolicitudRevision
} from '@shared/ai'
import {
  ArchivoProyecto,
  EXTENSION_PROYECTO,
  InfoRecuperacion,
  abrirProyecto,
  borrarRecuperacion,
  escribirRecuperacion,
  guardarProyecto,
  leerRecuperacion
} from './persistencia'
import {
  capacidadesActuales,
  cargarConfiguracion,
  chatear,
  filtrarOperacionesIA,
  guardarConfiguracion,
  interpretarImagen,
  interpretarTexto,
  probarConexion,
  revisar
} from './ia/coordinador'
import { importarDrawio } from './importadores/drawio-borrador'
import { limpiarConsumo, resumenConsumo } from './ia/consumo'
import { conectarProveedor, estadosProveedores, seleccionarModelo, borrarCredencial, revelarCredencial, reconectarActivo, invalidarConexiones } from './ia/proveedores'
import type { ConfigProveedor, ProveedorTipo } from '@shared/ai'

let ventana: BrowserWindow | null = null
let rutaAbierta: string | null = null

function crearVentana(): void {
  ventana = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'Visual BD',
    backgroundColor: '#12151c',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    ventana.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    ventana.loadFile(join(__dirname, '../renderer/index.html'))
  }

  ventana.on('closed', () => {
    ventana = null
  })
}

function construirMenu(): void {
  const plantilla: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Proyecto',
      submenu: [
        { label: 'Nuevo', accelerator: 'CmdOrCtrl+N', click: () => ventana?.webContents.send('menu:nuevo') },
        { label: 'Abrir…', accelerator: 'CmdOrCtrl+O', click: () => ventana?.webContents.send('menu:abrir') },
        { label: 'Guardar', accelerator: 'CmdOrCtrl+S', click: () => ventana?.webContents.send('menu:guardar') },
        { label: 'Guardar como…', accelerator: 'CmdOrCtrl+Shift+S', click: () => ventana?.webContents.send('menu:guardar-como') },
        { type: 'separator' },
        {
          label: 'Información de recuperación',
          click: () => ventana?.webContents.send('menu:recuperacion')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', click: () => ventana?.webContents.send('menu:deshacer') },
        { label: 'Rehacer', accelerator: 'CmdOrCtrl+Y', click: () => ventana?.webContents.send('menu:rehacer') },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'delete', label: 'Eliminar' }
      ]
    },
    {
      label: 'Importar',
      submenu: [
        { label: 'Archivo draw.io…', click: () => ventana?.webContents.send('menu:importar-drawio') },
        { label: 'Imagen (diagrama)…', click: () => ventana?.webContents.send('menu:importar-imagen') },
        { label: 'Markdown…', click: () => ventana?.webContents.send('menu:importar-markdown') }
      ]
    },
    {
      label: 'Revisar',
      submenu: [
        { label: 'Revisar reglas', click: () => ventana?.webContents.send('menu:revisar-reglas') },
        { label: 'Revisar con IA', accelerator: 'CmdOrCtrl+R', click: () => ventana?.webContents.send('menu:revisar') }
      ]
    },
    {
      label: 'Modelo',
      submenu: [
        { label: 'Configuración de proveedor…', click: () => ventana?.webContents.send('menu:configuracion') }
      ]
    },
    {
      label: 'Ver',
      submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(plantilla))
}

function registrarIPC(): void {
  ipcMain.handle('proyecto:guardar', async (_e, ruta: string, archivo: ArchivoProyecto) => {
    guardarProyecto(ruta, archivo)
    rutaAbierta = ruta
    borrarRecuperacion(String((archivo.proyecto as { id: string }).id))
    return ruta
  })

  ipcMain.handle('proyecto:abrir-dialogo', async () => {
    if (!ventana) return null
    const resultado = await dialog.showOpenDialog(ventana, {
      title: 'Abrir proyecto',
      filters: [{ name: 'Proyecto Visual BD', extensions: ['vbdproj', 'json'] }],
      properties: ['openFile']
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const ruta = resultado.filePaths[0]
    const archivo = abrirProyecto(ruta)
    rutaAbierta = ruta
    return { ruta, archivo }
  })

  ipcMain.handle('proyecto:abrir-ruta', async (_e, ruta: string) => {
    try {
      const archivo = abrirProyecto(ruta)
      rutaAbierta = ruta
      return { ruta, archivo }
    } catch (error) {
      return { error: (error as Error).message }
    }
  })

  ipcMain.handle('proyecto:guardar-como-dialogo', async (_e, archivo: ArchivoProyecto, nombreSugerido: string) => {
    if (!ventana) return null
    const resultado = await dialog.showSaveDialog(ventana, {
      title: 'Guardar proyecto',
      defaultPath: join(app.getPath('documents'), `${nombreSugerido}${EXTENSION_PROYECTO}`),
      filters: [{ name: 'Proyecto Visual BD', extensions: ['vbdproj'] }]
    })
    if (resultado.canceled || !resultado.filePath) return null
    guardarProyecto(resultado.filePath, archivo)
    rutaAbierta = resultado.filePath
    borrarRecuperacion(String((archivo.proyecto as { id: string }).id))
    return resultado.filePath
  })

  ipcMain.handle('proyecto:ruta-actual', () => rutaAbierta)

  ipcMain.handle('recuperacion:escribir', (_e, idProyecto: string, archivo: ArchivoProyecto) => {
    escribirRecuperacion(idProyecto, archivo)
  })

  ipcMain.handle('recuperacion:leer', (_e, idProyecto: string): InfoRecuperacion => {
    return leerRecuperacion(idProyecto)
  })

  ipcMain.handle('recuperacion:borrar', (_e, idProyecto: string) => {
    borrarRecuperacion(idProyecto)
  })

  ipcMain.handle('ajustes:obtener', (): Configuracion => {
    return cargarConfiguracion()
  })

  ipcMain.handle('proveedores:estados', () => estadosProveedores())
  ipcMain.handle('proveedores:conectar', async (_e, perfil: ConfigProveedor, clave: string | null) => {
    const resultado = await conectarProveedor(perfil, clave)
    ventana?.webContents.send('proveedores:actualizados')
    return resultado
  })
  ipcMain.handle('proveedores:modelo', (_e, tipo: ProveedorTipo, modelo: string) => seleccionarModelo(tipo, modelo))
  ipcMain.handle('proveedores:borrar-clave', (_e, tipo: ProveedorTipo) => borrarCredencial(tipo))
  ipcMain.handle('proveedores:revelar-clave', (_e, tipo: ProveedorTipo) => revelarCredencial(tipo))

  ipcMain.handle('ajustes:guardar', (_e, config: Configuracion, claveNueva: string | null): Configuracion => {
    const privacidadCambiada = cargarConfiguracion().soloLocal !== config.soloLocal
    const guardada = guardarConfiguracion(config, claveNueva)
    if (privacidadCambiada) {
      invalidarConexiones()
      ventana?.webContents.send('proveedores:actualizados')
    }
    return guardada
  })

  ipcMain.handle('ajustes:capacidades', () => {
    return capacidadesActuales(cargarConfiguracion())
  })

  ipcMain.handle('ia:probar-conexion', async (): Promise<ResultadoPruebaConexion> => {
    return probarConexion(cargarConfiguracion())
  })

  ipcMain.handle('ia:revisar', async (_e, solicitud: SolicitudRevision): Promise<RespuestaRevisionIA> => {
    const respuesta = await revisar(cargarConfiguracion(), solicitud)
    return {
      ...respuesta,
      propuestas: respuesta.propuestas.map((p) => {
        const { validas, invalidas } = filtrarOperacionesIA(p.operaciones)
        if (invalidas > 0) {
          return {
            ...p,
            explicacion: `${p.explicacion}\n\n(${invalidas} operación(es) no reconocidas del catálogo fueron descartadas.)`,
            operaciones: validas
          }
        }
        return { ...p, operaciones: validas }
      })
    }
  })

  ipcMain.handle('ia:chat', async (_e, solicitud: SolicitudChat): Promise<RespuestaChatIA> => {
    return chatear(cargarConfiguracion(), solicitud)
  })

  ipcMain.handle('ia:interpretar-imagen', async (_e, imagenBase64: string, mime: string): Promise<BorradorImportacionIA> => {
    return interpretarImagen(cargarConfiguracion(), imagenBase64, mime)
  })

  ipcMain.handle('ia:interpretar-texto', async (_e, texto: string, nombreArchivo: string): Promise<BorradorImportacionIA> => {
    return interpretarTexto(cargarConfiguracion(), texto, nombreArchivo)
  })

  ipcMain.handle('ia:consumo', (): ResumenConsumo => {
    return resumenConsumo(cargarConfiguracion().limiteDiarioTokens)
  })

  ipcMain.handle('ia:consumo-limpiar', (): ResumenConsumo => {
    limpiarConsumo()
    return resumenConsumo(cargarConfiguracion().limiteDiarioTokens)
  })

  ipcMain.handle('importar:drawio-archivo', async () => {
    if (!ventana) return null
    const resultado = await dialog.showOpenDialog(ventana, {
      title: 'Importar diagrama draw.io',
      filters: [{ name: 'draw.io', extensions: ['drawio', 'xml'] }],
      properties: ['openFile']
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const ruta = resultado.filePaths[0]
    const xml = readFileSync(ruta, 'utf-8')
    const borrador = importarDrawio(xml)
    return { ruta, borrador }
  })

  ipcMain.handle('importar:imagen-archivo', async () => {
    if (!ventana) return null
    const resultado = await dialog.showOpenDialog(ventana, {
      title: 'Importar imagen del diagrama',
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }],
      properties: ['openFile']
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const ruta = resultado.filePaths[0]
    const buffer = readFileSync(ruta)
    const extension = ruta.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`
    return { ruta, base64: buffer.toString('base64'), mime }
  })

  ipcMain.handle('importar:markdown-archivo', async () => {
    if (!ventana) return null
    const resultado = await dialog.showOpenDialog(ventana, {
      title: 'Importar Markdown',
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile']
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const ruta = resultado.filePaths[0]
    const contenido = readFileSync(ruta, 'utf-8')
    if (contenido.length > 2_000_000) {
      throw new Error('El archivo supera el límite de 2 MB para importación.')
    }
    return { ruta, contenido }
  })

  ipcMain.handle('diagnostico:log', (_e, mensaje: string) => {
    if (!/api[_-]?key|clave/i.test(mensaje)) {
      console.log(`[renderer] ${mensaje}`)
    }
  })

  ipcMain.on('seguridad:abrir-externo', (_e, url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(() => {
  construirMenu()
  registrarIPC()
  crearVentana()
  void reconectarActivo().catch(() => { /* El diálogo muestra el estado de conexión sin registrar secretos. */ })
    .finally(() => ventana?.webContents.send('proveedores:actualizados'))
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
