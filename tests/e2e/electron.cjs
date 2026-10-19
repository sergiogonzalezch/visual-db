/* Electron real + renderer/preload/IPC de producción. Solo los diálogos nativos
 * y el servidor de IA son controlados; nunca se usa el perfil personal. */
const { app, BrowserWindow, dialog, nativeTheme, safeStorage } = require('electron')
const { mkdirSync, writeFileSync, readFileSync, copyFileSync, unlinkSync } = require('node:fs')
const { join, resolve } = require('node:path')
const { createServer } = require('node:http')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const auditarAccesibilidad = require('./accesibilidad.cjs')

const raiz = resolve(__dirname, '../..')
const real = process.env.VISUAL_BD_QA_PROVEEDOR
if (real && !['ollama', 'gemini'].includes(real)) throw new Error('Proveedor de QA no admitido')
const reinicio = process.env.VISUAL_BD_QA_REINICIO ? JSON.parse(readFileSync(process.env.VISUAL_BD_QA_REINICIO, 'utf8')) : null
const evidencia = reinicio?.evidencia ?? join(raiz, 'artefactos-locales', 'pruebas', 'electron-' + Date.now())
mkdirSync(join(evidencia, 'perfil', 'ajustes'), { recursive: true })
app.setPath('userData', join(evidencia, 'perfil'))
if (real === 'gemini') {
  // OSCrypt necesita su clave de sistema cifrada antes de inicializar Chromium.
  copyFileSync(join(app.getPath('appData'), 'Visual BD', 'Local State'), join(evidencia, 'perfil', 'Local State'))
}
const resultados = [], erroresRenderer = []
let ventana, pendiente, modo = 'exito', solicitudes = 0, ultimaSolicitud
const timeoutReal = AbortSignal.timeout.bind(AbortSignal)
AbortSignal.timeout = ms => timeoutReal(modo === 'timeout' && ms === 180000 ? 150 : ms)
const esperar = ms => new Promise(r => setTimeout(r, ms))
async function hasta(f, nombre, timeout = 10000) {
  const inicio = Date.now()
  while (Date.now() - inicio < timeout) { if (await f()) return; await esperar(40) }
  throw new Error('Tiempo agotado: ' + nombre)
}
const js = codigo => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('El renderer no respondió al paso de prueba en 15 s')), 15000)
  ventana.webContents.executeJavaScript(codigo, true).then(resolve, reject).finally(() => clearTimeout(timer))
})
const texto = () => js(`document.body.innerText + '\\n' + [...document.querySelectorAll('input')].map(e => e.value).join('\\n')`)
async function ver(t) { await hasta(async () => (await texto()).includes(t), t) }
async function pulsar(etiqueta) {
  await hasta(() => js(`(() => { const nombre = ${JSON.stringify(etiqueta)}; const b = [...document.querySelectorAll('button')].find(b => b.getClientRects().length && !b.closest('[inert]') && !b.disabled && (b.getAttribute('aria-label') === nombre || b.textContent.trim() === nombre || (b.getAttribute('role') === 'menuitem' && b.querySelector('span')?.textContent === nombre))); if (!b) return false; if (b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))) b.focus(); b.click(); return true })()`), 'botón ' + etiqueta)
  await esperar(60)
}
async function menu(nombre, accion) { ventana.focus(); await esperar(80); await pulsar(nombre); await pulsar(accion) }
async function revisar() { await menu('Revisar', 'Revisar con IA') }
async function guardar() { await pulsar('Guardar'); await hasta(() => js(`document.querySelector('.guardado').textContent === 'Guardado'`), 'guardado') }
const archivo = join(evidencia, 'tienda.vbdproj')
let rutaAbrir = archivo
const leer = () => JSON.parse(readFileSync(archivo, 'utf8'))
dialog.showOpenDialog = async (_w, opciones) => ({ canceled: false, filePaths: [opciones.title.includes('Markdown') ? join(raiz, 'tests/fixtures/tienda-prueba.md') : opciones.properties.includes('openDirectory') ? evidencia : rutaAbrir] })
dialog.showSaveDialog = async (_w, opciones) => ({ canceled: false, filePath: opciones.title.includes('Exportar') ? join(evidencia, 'reporte.' + opciones.filters[0].extensions[0]) : archivo })

function responder(res, cuerpo, solicitud = ultimaSolicitud) {
  const modelo = solicitud?.proyecto?.diseno
  const entidad = modelo?.entidades[0]
  const propuesta = { categoria: 'integridad', prioridad: 'media', titulo: 'QA: describir entidad', explicacion: 'Cambio controlado de descripción, sin inferir restricciones.', fundamento: 'Caso sintético', supuestos: [], preguntas: [], resultado: 'Descripción visible', contrapartidas: [], dependeDe: [], operaciones: entidad ? [{ op: 'updateEntidad', id: entidad.id, parche: { descripcion: 'Descripción confirmada en QA' } }] : [] }
  if (modo === 'operacion') propuesta.operaciones.push({ op: 'operacionFueraDelCatalogo' })
  if (modo === 'riesgo') {
    propuesta.titulo = 'QA: confirmar nulabilidad'
    propuesta.supuestos = ['El correo sería obligatorio; necesita confirmación.']
    propuesta.operaciones = [{ op: 'updateAtributo', entidadId: entidad.id, id: entidad.atributos.find(a => a.nombre === 'email').id, parche: { nulable: false } }]
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: { content: cuerpo ?? JSON.stringify({ resumen: 'Análisis controlado', propuestas: [propuesta] }) }, prompt_eval_count: 10, eval_count: 10 }))
}
const servidor = createServer(async (req, res) => {
  if (req.url === '/api/tags') { res.end(JSON.stringify({ models: [{ name: 'qa:latest' }] })); return }
  let datos = ''; for await (const parte of req) datos += parte
  solicitudes++
  try {
    const user = JSON.parse(datos).messages.find(m => m.role === 'user').content
    ultimaSolicitud = JSON.parse(user.slice(user.indexOf('{'), user.lastIndexOf('}') + 1))
  } catch { ultimaSolicitud = null }
  if (modo === 'demora') { const solicitud = ultimaSolicitud; pendiente = () => responder(res, undefined, solicitud); return }
  if (modo === 'timeout') return
  if (typeof modo === 'number') { res.writeHead(modo); res.end(JSON.stringify({ error: { message: 'secreto-no-propagar' } })); return }
  if (modo === 'red') { req.socket.destroy(); return }
  responder(res, modo === 'json' ? 'contenido sin JSON' : undefined)
})

async function caso(nombre, ejecutar) {
  const inicio = Date.now()
  await ejecutar()
  resultados.push({ nombre, ok: true, duracionMs: Date.now() - inicio })
  console.log('OK ' + nombre)
}

async function ejecutar() {
  if (reinicio) {
    require(join(raiz, 'out/main/index.js'))
    await app.whenReady()
    await hasta(() => { ventana = BrowserWindow.getAllWindows()[0]; return !!ventana }, 'ventana relanzada')
    ventana.webContents.setBackgroundThrottling(false)
    await ver('QA 500 entidades')
    await caso('Barra persistida después de cerrar y relanzar el proceso Electron', async () => {
      await hasta(() => js(`!!localStorage.getItem('visual-bd:herramientas')`), 'preferencia restaurada')
      assert.deepEqual(await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`), reinicio.posicion)
      ventana.setSize(1024, 640); await esperar(150)
      const audit = await js(`(${auditarAccesibilidad.toString()})()`)
      assert.ok(!audit.desborde)
      assert.equal(audit.dpr, Number(process.env.VISUAL_BD_QA_ESCALA))
      assert.deepEqual(audit.sinNombre, [])
      assert.deepEqual(audit.contraste, [])
      assert.deepEqual(audit.desbordesInternos, [])
      assert.ok(await js(`(() => { const b = document.querySelector('.herramientas-flotantes').getBoundingClientRect(); return b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight })()`))
      writeFileSync(join(evidencia, `escala-dispositivo-${audit.dpr}.json`), JSON.stringify(audit, null, 2))
      writeFileSync(join(evidencia, `escala-dispositivo-${audit.dpr}.png`), (await ventana.webContents.capturePage()).toPNG())
      await pulsar('Restablecer posición de herramientas')
      assert.equal((await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`)).x, 16)
    })
    return true
  }
  let modeloReal
  let perfil
  if (!real) {
    await new Promise(r => servidor.listen(0, '127.0.0.1', r))
    perfil = { proveedor: 'ollama', endpoint: `http://127.0.0.1:${servidor.address().port}`, modelo: 'qa:latest', claveApiEstablecida: false }
  } else if (real === 'ollama') {
    modeloReal = process.env.VISUAL_BD_QA_MODELO || 'llama3.2:latest'
    perfil = { proveedor: 'ollama', endpoint: 'http://127.0.0.1:11434', modelo: '', claveApiEstablecida: false }
  } else {
    // Lee la configuración existente; no la modifica. Solo la clave de Gemini
    // se vuelve a cifrar en el perfil aislado, nunca se imprime ni llega al DOM.
    const personal = join(app.getPath('appData'), 'Visual BD')
    const config = JSON.parse(readFileSync(join(personal, 'ajustes/configuracion.json'), 'utf8'))
    const origen = config.proveedores?.gemini ?? (config.proveedor.proveedor === 'gemini' ? config.proveedor : null)
    if (!origen?.modelo) throw new Error('No hay modelo Gemini configurado en el perfil personal')
    modeloReal = process.env.VISUAL_BD_QA_MODELO || origen.modelo
    perfil = { ...origen, modelo: '' }
    await app.whenReady()
    const cifrada = JSON.parse(readFileSync(join(personal, 'credenciales/proveedor.json'), 'utf8'))
    if (!cifrada.cifrado) throw new Error('QA requiere credenciales cifradas')
    const clave = JSON.parse(safeStorage.decryptString(Buffer.from(cifrada.datos, 'base64'))).gemini
    if (!clave) throw new Error('No hay credencial Gemini guardada')
    mkdirSync(join(evidencia, 'perfil/credenciales'), { recursive: true })
    writeFileSync(join(evidencia, 'perfil/credenciales/proveedor.json'), JSON.stringify({ cifrado: true, datos: safeStorage.encryptString(JSON.stringify({ gemini: clave })).toString('base64') }))
  }
  writeFileSync(join(evidencia, 'perfil/ajustes/configuracion.json'), JSON.stringify({ soloLocal: real !== 'gemini', proveedor: perfil, proveedores: { [perfil.proveedor]: perfil }, ultimoProyecto: null, limiteDiarioTokens: null }))
  require(join(raiz, 'out/main/index.js'))
  await app.whenReady()
  await hasta(() => { ventana = BrowserWindow.getAllWindows()[0]; return !!ventana }, 'ventana')
  ventana.webContents.setBackgroundThrottling(false)
  ventana.webContents.on('console-message', (_e, nivel, mensaje) => { if (nivel >= 3) erroresRenderer.push(mensaje) })
  await ver('Tu modelo empieza aquí')
  await caso('Nombre, importación Markdown, reglas y guardado por IPC', async () => {
    await pulsar('Editar nombre del proyecto')
    await js(`(() => { const e = document.querySelector('[aria-label="Nombre del proyecto"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, 'Tienda QA automatizada'); e.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    await pulsar('Confirmar nombre del proyecto')
    await menu('Importar', 'Markdown…'); await ver('Confirmar interpretación importada')
    await pulsar('Confirmar e incorporar al lienzo')
    await menu('Revisar', 'Revisar reglas'); await ver('Normalización')
    await guardar()
    assert.equal(leer().proyecto.nombre, 'Tienda QA automatizada')
    assert.equal(leer().proyecto.diseno.entidades.length, 4)
  })
  if (real) {
    await caso('Conexión y selección de modelo real desde UI: ' + real, async () => {
      await pulsar('Modelo / IA')
      await ver('Tus proveedores')
      await pulsar(real === 'gemini' ? 'Probar conexión' : 'Conectar')
      await hasta(() => js(`!document.querySelector('#modelo').disabled && document.querySelector('#modelo').options.length > 1`), 'catálogo real', 20000)
      await js(`(() => { const s = document.querySelector('#modelo'); const modelo = ${JSON.stringify(modeloReal)}; if (![...s.options].some(o => o.value === modelo)) throw new Error('Modelo configurado fuera del catálogo'); s.value = modelo; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
      await ver('Último modelo:'); await esperar(150); await pulsar('Cerrar configuración')
    })
    await caso('Generación real de tienda completa, persistencia y reapertura: ' + real, async () => {
      await revisar()
      await hasta(async () => { const t = await texto(); if (t.includes('No se pudo completar la revisión')) throw new Error('El proveedor real no completó la revisión: ' + await js(`document.querySelector('.estado-contextual.error')?.innerText`)); return t.includes('Revisión terminada:') }, 'revisión real', 200000)
      await guardar()
      const recibido = leer()
      writeFileSync(join(evidencia, 'respuesta-real.json'), JSON.stringify({ proveedor: real, modelo: modeloReal, propuestas: recibido.proyecto.propuestas, mensajes: recibido.mensajesChat }, null, 2))
      assert.ok(recibido.proyecto.propuestas.length > 0)
      assert.ok(recibido.proyecto.propuestas.every(p => p.origenIA?.proveedor === real && p.origenIA.modelo === modeloReal))
      const aclaracion = recibido.proyecto.propuestas.find(p => p.operaciones.length === 0 && p.estado === 'pendiente')
      const candidato = recibido.proyecto.propuestas.find(p => p.operaciones.length > 0 && p.estado === 'pendiente')
      if (aclaracion) {
        await pulsar(aclaracion.titulo)
        await pulsar('Marcar como revisada'); await guardar()
        assert.equal(leer().proyecto.propuestas.find(p => p.id === aclaracion.id).estado, 'aceptada')
      } else if (candidato) {
        await pulsar(candidato.titulo)
        await pulsar('Ver antes/después')
        // Una prueba no debe confirmar decisiones de negocio inventadas por IA.
        // La aprobación de cambios se cubre con el proveedor controlado y su caso conocido.
        const controles = await js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.getClientRects().length && b.textContent.trim() === 'Aceptar cambios'); return { existe: !!b, bloqueado: b?.disabled, riesgo: document.body.innerText.includes('Revisión semántica pendiente') } })()`)
        assert.ok(controles.existe)
        if (controles.riesgo) assert.ok(controles.bloqueado)
        await pulsar('Rechazar')
        await guardar()
        assert.equal(leer().proyecto.propuestas.find(p => p.id === candidato.id).estado, 'rechazada')
      }
      ventana.webContents.reload(); await ver('Tienda QA automatizada')
      assert.ok(leer().proyecto.propuestas.every(p => p.origenIA?.proveedor === real))
    })
    return true
  }
  await caso('Single flight, carga, cambio de pestaña y respuesta sin robar foco', async () => {
    modo = 'demora'; const antes = solicitudes
    await revisar(); await hasta(() => !!pendiente, 'solicitud recibida')
    ventana.webContents.send('menu:revisar'); ventana.webContents.send('menu:revisar')
    await pulsar('Chat'); await js(`document.querySelector('textarea').focus()`)
    await esperar(150); assert.equal(solicitudes, antes + 1)
    pendiente(); pendiente = null
    await ver('Revisión terminada:')
    assert.equal(await js('document.activeElement.tagName'), 'TEXTAREA')
    await pulsar('Revisión')
  })
  await caso('Comparar, aprobar, deshacer/rehacer, guardar y recargar', async () => {
    await pulsar('QA: describir entidad'); await pulsar('Ver antes/después')
    assert.equal(await js(`document.querySelector('.vista-diseno button:last-child').getAttribute('aria-pressed')`), 'true')
    await pulsar('Aceptar cambios'); await guardar()
    const p = leer().proyecto
    assert.equal(p.diseno.entidades[0].descripcion, 'Descripción confirmada en QA')
    assert.equal(p.propuestas[0].origenIA.modelo, 'qa:latest')
    await pulsar('Deshacer'); await guardar()
    assert.notEqual(leer().proyecto.diseno.entidades[0].descripcion, 'Descripción confirmada en QA')
    await pulsar('Rehacer'); await guardar()
    ventana.webContents.reload(); await ver('Tienda QA automatizada')
    await hasta(() => js(`document.querySelector('.guardado').textContent === 'Guardado'`), 'reapertura')
    assert.equal(leer().proyecto.diseno.entidades[0].descripcion, 'Descripción confirmada en QA')
  })
  await caso('Respuesta de A no se incorpora en nuevo proyecto B', async () => {
    modo = 'demora'; await revisar(); await hasta(() => !!pendiente, 'solicitud A')
    await menu('Archivo', 'Nuevo proyecto'); pendiente(); pendiente = null
    await esperar(200); assert.ok(!(await texto()).includes('Revisión terminada:'))
    assert.ok((await texto()).includes('Tu modelo empieza aquí'))
    await menu('Archivo', 'Abrir proyecto…'); await ver('Tienda QA automatizada')
  })
  await caso('Riesgos semánticos: confirmación explícita, origen y decisión persistidos', async () => {
    modo = 'riesgo'; await revisar(); await ver('Revisión terminada:')
    await pulsar('QA: confirmar nulabilidad'); await ver('Revisión semántica pendiente')
    assert.ok(await js(`document.querySelector('.tarjeta-propuesta.abierta .acciones-propuesta .primario').disabled`))
    await js(`document.querySelector('.tarjeta-propuesta.abierta input[type="checkbox"]').click()`)
    await pulsar('Aceptar cambios'); await guardar()
    const p = leer().proyecto.propuestas.at(-1)
    assert.ok(p.notaDecision.includes('Puntos revisados'))
    assert.deepEqual(p.origenIA, { proveedor: 'ollama', modelo: 'qa:latest' })
    ventana.webContents.reload(); await ver('Tienda QA automatizada')
    await pulsar('Abrir panel del proyecto'); await pulsar('Revisión')
    await pulsar('Propuestas · ' + leer().proyecto.propuestas.length)
    await pulsar('QA: confirmar nulabilidad'); await ver('Decisión registrada:')
    modo = 'exito'
  })
  await caso('Descartar e invertir orden de respuestas sin sobrescribir nuevo intento', async () => {
    modo = 'demora'; await revisar(); await hasta(() => !!pendiente, 'primer intento')
    const vieja = pendiente; pendiente = null
    await pulsar('Descartar respuesta pendiente'); await revisar(); await hasta(() => !!pendiente, 'segundo intento')
    vieja(); await esperar(150); await ver('Revisando con IA…')
    pendiente(); pendiente = null; await ver('Revisión terminada:')
  })
  await caso('Respuesta vieja posterior a la nueva y descarte sin nuevo intento', async () => {
    modo = 'demora'; await revisar(); await hasta(() => !!pendiente, 'respuesta vieja')
    const vieja = pendiente; pendiente = null
    await pulsar('Descartar respuesta pendiente'); await revisar(); await hasta(() => !!pendiente, 'respuesta nueva')
    pendiente(); pendiente = null; await ver('Revisión terminada:')
    const numero = await js(`document.querySelectorAll('.titulo-propuesta').length`)
    vieja(); await esperar(150)
    assert.equal(await js(`document.querySelectorAll('.titulo-propuesta').length`), numero)
    await revisar(); await hasta(() => !!pendiente, 'respuesta a descartar')
    await pulsar('Descartar respuesta pendiente'); pendiente(); pendiente = null; await esperar(150)
    assert.equal(await js(`document.querySelectorAll('.titulo-propuesta').length`), numero)
    await ver('Revisión descartada.')
  })
  await caso('Edición durante revisión conserva versión de origen y bloquea el conflicto', async () => {
    await guardar(); const version = leer().proyecto.versionDiseno
    modo = 'demora'; await revisar(); await hasta(() => !!pendiente, 'revisión antes de editar')
    await js(`document.querySelector('.entidad-carta').focus()`)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
    await hasta(() => js(`!!document.querySelector('#descripcion-entidad')`), 'inspector por teclado')
    await js(`(() => { const e = document.querySelector('#descripcion-entidad'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(e, 'Editada durante revisión'); e.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    pendiente(); pendiente = null; await ver('Revisión terminada:'); await guardar()
    const ultima = leer().proyecto.propuestas.at(-1)
    assert.equal(ultima.versionOrigen, version)
    assert.equal(ultima.estado, 'desactualizada')
    assert.equal(leer().proyecto.diseno.entidades[0].descripcion, 'Editada durante revisión')
    await pulsar('Revisión')
  })
  await caso('Errores HTTP/red/JSON, recuperación y ausencia de secretos', async () => {
    for (const error of [401, 403, 404, 429, 503, 'red', 'json', 'timeout', 'operacion']) {
      modo = error; const antes = solicitudes
      const propuestasAntes = await js(`document.querySelectorAll('.titulo-propuesta').length`)
      await revisar(); await ver('No se pudo completar la revisión')
      assert.ok(!(await texto()).includes('secreto-no-propagar'))
      assert.equal(solicitudes - antes, error === 'json' ? 2 : 1)
      assert.equal(await js(`document.querySelectorAll('.titulo-propuesta').length`), propuestasAntes)
      modo = 'exito'; await pulsar('Reintentar revisión'); await ver('Revisión terminada:')
    }
  })
  await caso('Barra: teclado, encuadre, persistencia y ventana pequeña; temas', async () => {
    await pulsar('Ajustar al contenido')
    const antes = await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`)
    await js(`document.querySelector('[aria-label="Mover herramientas"]').focus()`)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Right' })
    await esperar(100)
    const despues = await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`)
    assert.ok(despues.x > antes.x)
    ventana.webContents.reload(); await ver('Tienda QA automatizada')
    assert.deepEqual(await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`), despues)
    ventana.setSize(1024, 640)
    for (const tema of ['light', 'dark']) {
      nativeTheme.themeSource = tema; await esperar(200)
      const medidas = await js(`(() => { const b = document.querySelector('.herramientas-flotantes').getBoundingClientRect(); return { dentro: b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight, desborde: document.documentElement.scrollWidth > innerWidth } })()`)
      assert.ok(medidas.dentro); assert.ok(!medidas.desborde)
      writeFileSync(join(evidencia, tema + '.png'), (await ventana.webContents.capturePage()).toPNG())
    }
    await pulsar('Restablecer posición de herramientas')
  })
  await caso('Teclado: pestañas, Escape, foco de diálogos y escala ampliada', async () => {
    ventana.focus()
    await pulsar('Abrir panel del proyecto')
    await js(`document.querySelector('#inspector-tab-propiedades').focus()`)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Right' })
    await hasta(() => js(`document.querySelector('#inspector-tab-revision').getAttribute('aria-selected') === 'true'`), 'flechas en pestañas')
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    await hasta(() => js(`document.activeElement.getAttribute('aria-label') === 'Abrir panel del proyecto'`), 'retorno de foco del panel')
    await pulsar('Modelo / IA'); await ver('Tus proveedores')
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    await hasta(() => js(`!document.querySelector('dialog[open]')`), 'Escape del diálogo')
    assert.equal(await js(`document.activeElement.textContent`), 'Modelo / IA')
    ventana.webContents.setZoomFactor(1.5); await esperar(150)
    assert.ok(await js(`document.documentElement.scrollWidth <= innerWidth`))
    writeFileSync(join(evidencia, 'escala-150.png'), (await ventana.webContents.capturePage()).toPNG())
    ventana.webContents.setZoomFactor(1)
  })
  await caso('Exportación Markdown real desde diálogo', async () => {
    await menu('Archivo', 'Exportar…'); await ver('Exportar diseño')
    await js(`(() => { const s = document.querySelector('dialog select'); s.value = 'markdown'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
    await pulsar('Exportar…'); await ver('Exportación completada.')
    assert.ok(readFileSync(join(evidencia, 'reporte.md'), 'utf8').includes('Tienda QA automatizada'))
    await pulsar('Cerrar')
  })
  await caso('Accesibilidad: nombres, contraste y árbol AX en claro/oscuro', async () => {
    app.setAccessibilitySupportEnabled(true)
    ventana.webContents.debugger.attach('1.3')
    const muestras = []
    for (const tema of ['light', 'dark']) {
      nativeTheme.themeSource = tema; await esperar(250)
      for (const contexto of ['editor', 'propiedades', 'revision', 'chat', 'consumo', 'proveedores', 'exportacion']) {
        if (['propiedades', 'revision', 'chat', 'consumo'].includes(contexto)) {
          if (await js(`document.querySelector('.tirador-panel').getAttribute('aria-expanded') !== 'true'`)) await pulsar('Abrir panel del proyecto')
          await pulsar({ propiedades: 'Propiedades', revision: 'Revisión', chat: 'Chat', consumo: 'Consumo' }[contexto])
          if (contexto === 'propiedades') {
            await js(`document.querySelector('.entidad-carta').focus()`)
            ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); await esperar(100)
          }
        }
        if (contexto === 'proveedores') await pulsar('Modelo / IA')
        if (contexto === 'exportacion') await menu('Archivo', 'Exportar…')
        const auditoria = await js(`(${auditarAccesibilidad.toString()})()`)
        muestras.push({ tema, contexto, ...auditoria })
        writeFileSync(join(evidencia, 'accesibilidad.json'), JSON.stringify(muestras, null, 2))
        assert.deepEqual(auditoria.sinNombre, [], `${tema}/${contexto}: controles sin nombre`)
        assert.deepEqual(auditoria.contraste, [], `${tema}/${contexto}: contraste insuficiente`)
        assert.deepEqual(auditoria.desbordesInternos, [], `${tema}/${contexto}: desborde interno`)
        assert.ok(!auditoria.desborde)
        const ax = await ventana.webContents.debugger.sendCommand('Accessibility.getFullAXTree')
        const controles = ax.nodes.filter(n => !n.ignored && ['button', 'textbox', 'combobox', 'tab', 'checkbox'].includes(n.role?.value))
        assert.ok(controles.length > 0)
        assert.ok(controles.every(n => !!n.name?.value?.trim()), `${contexto}: nombre en árbol AX`)
        writeFileSync(join(evidencia, `ax-${tema}-${contexto}.json`), JSON.stringify(controles.map(n => ({ rol: n.role.value, nombre: n.name.value })), null, 2))
        if (contexto === 'proveedores') await pulsar('Cerrar configuración')
        if (contexto === 'exportacion') await pulsar('Cerrar')
        if (['propiedades', 'revision', 'chat', 'consumo'].includes(contexto)) await pulsar('Ocultar panel del proyecto')
      }
    }
    ventana.webContents.debugger.detach()
    app.setAccessibilitySupportEnabled(false)
  })
  await caso('500 entidades: apertura por IPC, encuadre completo y renderizado', async () => {
    const grande = structuredClone(leer())
    const base = grande.proyecto.diseno.entidades[0]
    const relacionBase = grande.proyecto.diseno.relaciones[0]
    grande.proyecto.id = 'qa-grande'; grande.proyecto.nombre = 'QA 500 entidades'
    grande.proyecto.propuestas = []; grande.proyecto.reglas = []
    grande.historial = { entradas: [], deshacer: [], rehacer: [] }; grande.mensajesChat = []
    grande.proyecto.diseno.entidades = Array.from({ length: 500 }, (_, i) => {
      const e = structuredClone(base); e.id = 'grande-' + i; e.nombre = 'Entidad ' + i; e.x = (i % 20) * 280; e.y = Math.floor(i / 20) * 300
      const mapa = new Map(e.atributos.map((a, j) => [a.id, `a-${i}-${j}`]))
      e.atributos.forEach(a => { a.id = mapa.get(a.id) })
      while (e.atributos.length < 12) e.atributos.push({ ...structuredClone(base.atributos[0]), id: `extra-${i}-${e.atributos.length}`, nombre: `campo_${e.atributos.length}` })
      e.claves.forEach((c, j) => { c.id = `k-${i}-${j}`; c.atributoIds = c.atributoIds.map(id => mapa.get(id)); c.foranea = null })
      return e
    })
    grande.proyecto.diseno.relaciones = Array.from({ length: 499 }, (_, i) => ({ ...structuredClone(relacionBase), id: `r-grande-${i}`, atributos: [], inicio: { ...relacionBase.inicio, entidadId: `grande-${i}` }, fin: { ...relacionBase.fin, entidadId: `grande-${i + 1}` } }))
    rutaAbrir = join(evidencia, 'grande.vbdproj'); writeFileSync(rutaAbrir, JSON.stringify(grande))
    const inicio = Date.now()
    await menu('Archivo', 'Abrir proyecto…')
    await hasta(() => js(`document.querySelectorAll('.entidad-carta').length === 500`), '500 entidades dibujadas')
    const aperturaMs = Date.now() - inicio
    if (await js(`document.querySelector('.tirador-panel').getAttribute('aria-expanded') === 'true'`)) await pulsar('Ocultar panel del proyecto')
    await pulsar('Ajustar al contenido'); await esperar(150)
    assert.ok(await js(`(() => { const s = document.querySelector('.zona-lienzo > svg').getBoundingClientRect(); return [...document.querySelectorAll('.entidad-carta')].every(e => { const r = e.getBoundingClientRect(); return r.left >= s.left && r.top >= s.top && r.right <= s.right && r.bottom <= s.bottom }) })()`), 'El encuadre debe incluir las 500 entidades')
    const frames = await js(`new Promise(resolve => { const tiempos = []; let anterior; function frame(ahora) { if (anterior !== undefined) tiempos.push(ahora - anterior); anterior = ahora; if (tiempos.length === 20) resolve(tiempos); else requestAnimationFrame(frame) } requestAnimationFrame(frame) })`)
    const zoomAntes = await js(`document.querySelector('.zona-lienzo > svg').dataset.zoom`)
    const inicioZoom = Date.now()
    ventana.webContents.sendInputEvent({ type: 'mouseWheel', x: 500, y: 300, deltaX: 0, deltaY: -80 })
    await hasta(async () => (await js(`document.querySelector('.zona-lienzo > svg').dataset.zoom`)) !== zoomAntes, 'zoom con 500 entidades')
    const zoomMs = Date.now() - inicioZoom
    assert.ok(await js(`(() => { const e = document.querySelector('.zona-impacto'), s = getComputedStyle(e); return s.strokeWidth === '14px' && s.stroke === 'rgba(0, 0, 0, 0)' && e.getAttribute('vector-effect') === 'non-scaling-stroke' })()`))
    await pulsar('Ajustar al contenido')
    // Comparar con el inspector ya inicializado evita contar sus controles como
    // nodos filtrados por la sesión de carga.
    await js(`document.querySelector('.entidad-carta').focus()`)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
    await hasta(() => js(`!!document.querySelector('#descripcion-entidad')`), 'calentamiento del inspector')
    await pulsar('Ocultar panel del proyecto'); await pulsar('Ajustar al contenido')
    const memoriaRenderer = () => JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Get-Process -Id ${ventana.webContents.getOSProcessId()} | Select-Object Id,PrivateMemorySize64,WorkingSet64 | ConvertTo-Json -Compress`], { encoding: 'utf8', windowsHide: true, timeout: 10000 }))
    const memoriaRetenida = async () => {
      ventana.webContents.debugger.attach('1.3')
      try {
        await ventana.webContents.debugger.sendCommand('HeapProfiler.collectGarbage')
        return { heap: await ventana.webContents.debugger.sendCommand('Runtime.getHeapUsage'), dom: await ventana.webContents.debugger.sendCommand('Memory.getDOMCounters') }
      } finally { ventana.webContents.debugger.detach() }
    }
    const retenidaAntes = await memoriaRetenida()
    const memoriaAntes = memoriaRenderer()
    const metricasAntes = { unidadMemoria: 'bytes', pidRenderer: ventana.webContents.getOSProcessId() }
    const punto = await js(`(() => { const s = document.querySelector('.zona-lienzo > svg').getBoundingClientRect(); return { x: 250, y: Math.floor(s.bottom - 12) } })()`)
    const tiemposPaneo = [], tiemposSeleccion = [], tiemposZoom = []
    const inicioCarga = Date.now()
    for (let vuelta = 0; vuelta < 3 || Date.now() - inicioCarga < 30000; vuelta++) {
      await js(`document.querySelector('.zona-lienzo > svg').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: ${punto.x}, clientY: ${punto.y} }))`)
      for (let i = 1; i <= 20; i++) {
        const inicio = Date.now()
        await js(`document.querySelector('.zona-lienzo > svg').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: ${punto.x + i * 5}, clientY: ${punto.y} }))`)
        await esperar(16)
        assert.ok(await js(`document.querySelector('.zona-lienzo > svg > g').getAttribute('transform').includes('translate')`))
        tiemposPaneo.push(Date.now() - inicio)
      }
      await js(`document.querySelector('.zona-lienzo > svg').dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: ${punto.x + 100}, clientY: ${punto.y} }))`)
      for (let i = 0; i < 5; i++) {
        const inicio = Date.now(), previo = await js(`document.querySelector('.zona-lienzo > svg').dataset.zoom`)
        ventana.webContents.sendInputEvent({ type: 'mouseWheel', x: 500, y: 300, deltaX: 0, deltaY: i % 2 ? 80 : -80 })
        await hasta(async () => await js(`document.querySelector('.zona-lienzo > svg').dataset.zoom`) !== previo, 'zoom repetido')
        tiemposZoom.push(Date.now() - inicio)
      }
      const inicioSeleccion = Date.now()
      await js(`document.querySelectorAll('.entidad-carta')[${(vuelta * 100) % 500}].focus()`)
      ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
      await hasta(() => js(`document.querySelector('.entidad-carta[aria-pressed="true"]')?.getAttribute('data-entidad-id') === 'grande-${(vuelta * 100) % 500}'`), 'selección en diagrama grande')
      tiemposSeleccion.push(Date.now() - inicioSeleccion)
      await pulsar('Ocultar panel del proyecto'); await pulsar('Ajustar al contenido')
    }
    const retenidaDespues = await memoriaRetenida()
    const memoriaDespues = memoriaRenderer()
    const percentil95 = valores => [...valores].sort((a, b) => a - b)[Math.ceil(valores.length * .95) - 1]
    const rendimiento = { aperturaMs, zoomMs, framesMs: frames, entidades: 500, relaciones: 499, atributos: grande.proyecto.diseno.entidades.reduce((n, e) => n + e.atributos.length, 0), duracionCargaMs: Date.now() - inicioCarga, tiemposPaneo, tiemposZoom, tiemposSeleccion, p95PaneoMs: percentil95(tiemposPaneo), p95ZoomMs: percentil95(tiemposZoom), memoriaAntes, memoriaDespues, retenidaAntes, retenidaDespues, metricasAntes }
    writeFileSync(join(evidencia, 'rendimiento-ui.json'), JSON.stringify(rendimiento, null, 2))
    assert.ok(rendimiento.p95PaneoMs < 250, 'Paneo p95 inferior a 250 ms en este equipo')
    assert.ok(rendimiento.p95ZoomMs < 500, 'Zoom p95 inferior a 500 ms en este equipo')
    assert.ok(Number.isFinite(memoriaAntes.PrivateMemorySize64) && Number.isFinite(memoriaDespues.PrivateMemorySize64))
    assert.ok(retenidaDespues.heap.usedSize - retenidaAntes.heap.usedSize < 32 * 1024 * 1024, 'Crecimiento de heap retenido inferior a 32 MB después de GC')
    assert.ok(retenidaDespues.dom.nodes - retenidaAntes.dom.nodes < 2000, 'Sin acumulación de 2000 nodos DOM tras repetir interacciones')
    assert.equal(await js(`document.querySelectorAll('.entidad-carta').length`), 500)
    writeFileSync(join(evidencia, 'grande.png'), (await ventana.webContents.capturePage()).toPNG())
    modo = 'exito'
    await revisar(); await ver('Revisión terminada:'); await pulsar('QA: describir entidad')
    await pulsar('Ver antes/después'); await pulsar('Aceptar cambios'); await pulsar('Guardar')
    await hasta(() => JSON.parse(readFileSync(rutaAbrir, 'utf8')).proyecto.diseno.entidades[0].descripcion === 'Descripción confirmada en QA', 'guardar modelo grande')
    await menu('Archivo', 'Exportar…')
    await js(`(() => { const s = document.querySelector('dialog select'); s.value = 'json'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
    await pulsar('Exportar…'); await ver('Exportación completada.')
    assert.equal(JSON.parse(readFileSync(join(evidencia, 'reporte.json'), 'utf8')).modelo.entidades.length, 500)
    await pulsar('Cerrar')
  })
  await caso('Barra: arrastre con ratón, cancelación y preparación del reinicio', async () => {
    const versionAntes = JSON.parse(readFileSync(rutaAbrir, 'utf8')).proyecto.versionDiseno
    const asa = await js(`(() => { const r = document.querySelector('[aria-label="Mover herramientas"]').getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
    const antes = await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`)
    ventana.webContents.sendInputEvent({ type: 'mouseDown', ...asa, button: 'left', clickCount: 1 })
    ventana.webContents.sendInputEvent({ type: 'mouseMove', x: asa.x + 40, y: asa.y + 5, button: 'left' })
    await esperar(80)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    ventana.webContents.sendInputEvent({ type: 'mouseUp', x: asa.x + 40, y: asa.y + 5, button: 'left', clickCount: 1 })
    await esperar(80)
    assert.deepEqual(await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`), antes)
    await js(`document.querySelector('[aria-label="Mover herramientas"]').focus()`)
    ventana.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Right' })
    await esperar(100)
    assert.equal(JSON.parse(readFileSync(rutaAbrir, 'utf8')).proyecto.versionDiseno, versionAntes)
    const posicion = await js(`JSON.parse(localStorage.getItem('visual-bd:herramientas'))`)
    if (process.env.VISUAL_BD_QA_MANIFIESTO) writeFileSync(process.env.VISUAL_BD_QA_MANIFIESTO, JSON.stringify({ evidencia, posicion }))
  })
  assert.deepEqual(erroresRenderer, [])
  return true
}

ejecutar().then(() => {
  writeFileSync(join(evidencia, reinicio ? `resultado-reinicio-${process.env.VISUAL_BD_QA_ESCALA}.json` : 'resultado.json'), JSON.stringify({ ok: true, resultados, erroresRenderer }, null, 2))
  console.log('Evidencia: ' + evidencia)
  if (real === 'gemini') unlinkSync(join(evidencia, 'perfil/credenciales/proveedor.json'))
  ventana?.webContents.session.flushStorageData()
  servidor.closeAllConnections(); servidor.close(); app.quit()
}).catch(async error => {
  console.error(error)
  writeFileSync(join(evidencia, 'resultado.json'), JSON.stringify({ ok: false, resultados, error: error.message, erroresRenderer }, null, 2))
  if (ventana) writeFileSync(join(evidencia, 'fallo.png'), (await ventana.webContents.capturePage()).toPNG())
  if (real === 'gemini') { try { unlinkSync(join(evidencia, 'perfil/credenciales/proveedor.json')) } catch { /* Puede fallar antes de crear la copia cifrada. */ } }
  servidor.closeAllConnections(); servidor.close(); app.exit(1)
})
