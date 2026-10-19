/* Diagnóstico optativo real. Perfil aislado; credencial Gemini solo en memoria.
 * node tests/e2e/diagnostico-proveedores.cjs prepara el bundle y lanza Electron. */
const fs = require('node:fs')
const path = require('node:path')
const raiz = path.resolve(__dirname, '../..')
if (!process.versions.electron) {
  const salida = path.join(raiz, 'artefactos-locales/pruebas/diagnostico-' + Date.now())
  fs.mkdirSync(salida, { recursive: true })
  require('esbuild').buildSync({ stdin: { contents: `export { importarMarkdown } from './src/renderer/src/importadores/markdown'; export { borradorAProyecto } from './src/renderer/src/importadores/borrador'; export { ESQUEMA_REVISION } from './src/main/ia/contrato-revision'; export { SISTEMA_REVISION, normalizarRevision } from './src/main/ia/adaptador'; export { operacionIAValida } from './src/main/ia/operaciones-validas'; export { evaluarPropuestaIA } from './src/renderer/src/domain/evaluacion-ia'; export { crearProyectoVacio, crearEntidad, crearAtributo } from './src/renderer/src/domain/modelo';`, resolveDir: raiz }, bundle: true, platform: 'node', format: 'cjs', outfile: path.join(salida, 'helpers.cjs'), alias: { '@shared': path.join(raiz, 'src/shared') } })
  const entorno = { ...process.env, QA_DIAGNOSTICO: salida }; delete entorno.ELECTRON_RUN_AS_NODE
  const hijo = require('node:child_process').spawn(require('electron'), [__filename], { env: entorno, stdio: 'inherit', windowsHide: true })
  hijo.on('exit', codigo => { process.exitCode = codigo ?? 1 })
} else {
  const { app, safeStorage } = require('electron')
  const salida = process.env.QA_DIAGNOSTICO
  const personal = path.join(app.getPath('appData'), 'Visual BD')
  const perfil = path.join(salida, 'perfil')
  fs.mkdirSync(perfil, { recursive: true })
  const localState = path.join(perfil, 'Local State')
  if (fs.existsSync(path.join(personal, 'Local State'))) fs.copyFileSync(path.join(personal, 'Local State'), localState)
  app.setPath('userData', perfil)
  const h = require(path.join(salida, 'helpers.cjs'))
  const resultados = []
  const guardar = () => fs.writeFileSync(path.join(salida, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2))
  async function pedir(nombre, url, opciones, procesar) {
    const inicio = Date.now(), resultado = { nombre }
    try {
      const r = await fetch(url, { ...opciones, redirect: 'error', signal: AbortSignal.timeout(180000) })
      resultado.http = r.status
      resultado.cabeceras = Object.fromEntries(['retry-after', 'content-type', 'server'].map(k => [k, r.headers.get(k)]))
      const datos = await r.json()
      if (r.ok) Object.assign(resultado, procesar(datos))
      else {
        const error = (Array.isArray(datos) ? datos[0] : datos)?.error
        const mensaje = typeof error?.message === 'string' ? error.message : ''
        resultado.errorServicio = { code: error?.code, status: error?.status, clasificacion: /no longer available to new users/i.test(mensaje) ? 'modelo-no-disponible-nuevos-usuarios' : /overload|high demand|capacity/i.test(mensaje) ? 'capacidad-saturacion' : /unavailable/i.test(mensaje) ? 'servicio-no-disponible' : 'sin-clasificar' }
      }
    } catch (e) { resultado.error = { nombre: e.name, codigoRed: e.cause?.code }; }
    resultado.duracionMs = Date.now() - inicio
    resultados.push(resultado); guardar(); console.log(JSON.stringify(resultado))
    return resultado
  }
  async function ejecutar() {
    await app.whenReady()
    const minimo = h.crearProyectoVacio('Diagnóstico mínimo')
    const entidad = h.crearEntidad('Cliente', 0, 0), id = h.crearAtributo('cliente_id')
    Object.assign(id, { nulable: false, unico: true, tipoDato: 'entero', multivalorado: false })
    entidad.atributos.push(id, h.crearAtributo('email'))
    entidad.claves.push({ id: 'pk-cliente', nombre: 'PK Cliente', tipo: 'primaria', atributoIds: [id.id], foranea: null })
    minimo.diseno.entidades.push(entidad)
    const completo = h.borradorAProyecto(h.importarMarkdown(fs.readFileSync(path.join(raiz, 'tests/fixtures/tienda-prueba.md'), 'utf8'), 'tienda-prueba.md'), 'Tienda QA').proyecto
    completo.propuestas = []; completo.historial = []
    const analizar = (contenido, proyecto, proveedor, modelo) => {
      fs.writeFileSync(path.join(salida, proveedor + '-' + modelo.replace(/[^a-z0-9]/gi, '_') + '-' + (proyecto === minimo ? 'minimo' : 'completo') + '.txt'), contenido)
      try {
        const respuesta = h.normalizarRevision(contenido)
        return { estructuraValida: true, resumen: respuesta.resumen, propuestas: respuesta.propuestas.map((p, i) => ({ titulo: p.titulo, operaciones: p.operaciones.length, operacionesInvalidas: p.operaciones.filter(op => !h.operacionIAValida(op)).length, evaluacion: h.evaluarPropuestaIA(proyecto, { ...p, id: 'qa-' + i, estado: 'pendiente', origenIA: { proveedor, modelo } }) })) }
      } catch (e) { return { estructuraValida: false, errorFormato: e.message } }
    }
    let config, clave
    try {
      const ajustes = JSON.parse(fs.readFileSync(path.join(personal, 'ajustes/configuracion.json'), 'utf8'))
      config = ajustes.proveedores?.gemini ?? (ajustes.proveedor.proveedor === 'gemini' ? ajustes.proveedor : null)
      const cifrada = JSON.parse(fs.readFileSync(path.join(personal, 'credenciales/proveedor.json'), 'utf8'))
      if (cifrada.cifrado) clave = JSON.parse(safeStorage.decryptString(Buffer.from(cifrada.datos, 'base64'))).gemini
    } catch { resultados.push({ nombre: 'Gemini credencial', disponible: false }); guardar() }
    const proveedores = []
    if (config && clave) {
      if (process.env.QA_SOLO_SONDA === '1') {
        for (const modelo of [config.modelo.replace(/^models\//, ''), 'gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
          await pedir('Gemini sonda ' + modelo, config.endpoint.replace(/\/+$/, '') + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + clave }, body: JSON.stringify({ model: modelo, messages: [{ role: 'user', content: 'Responde únicamente OK.' }], stream: false, max_tokens: 8 }) }, d => ({ respuestaRecibida: !!d.choices?.[0]?.message?.content, uso: d.usage }))
        }
        return
      }
      const catalogo = await pedir('Gemini catálogo', config.endpoint.replace(/\/+$/, '') + '/models', { headers: { Authorization: 'Bearer ' + clave } }, d => ({ modelos: (d.data ?? []).map(m => m.id) }))
      proveedores.push({ proveedor: 'gemini', modelo: process.env.QA_SOLO_LITE === '1' ? 'gemini-2.5-flash-lite' : config.modelo.replace(/^models\//, ''), endpoint: config.endpoint, clave })
      const alternativo = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'].find(m => m !== config.modelo && catalogo.modelos?.some(id => id.replace(/^models\//, '') === m))
      if (alternativo && process.env.QA_SOLO_LITE !== '1') proveedores.push({ proveedor: 'gemini', modelo: alternativo, endpoint: config.endpoint, clave, soloMinimo: true })
    }
    const tags = process.env.QA_SOLO_LITE === '1' ? {} : await pedir('Ollama catálogo', 'http://127.0.0.1:11434/api/tags', {}, d => ({ modelos: (d.models ?? []).map(m => m.name) }))
    for (const modelo of ['mistral:latest', 'llama3.2:latest']) if (tags.modelos?.includes(modelo)) proveedores.push({ proveedor: 'ollama', modelo, endpoint: 'http://127.0.0.1:11434' })
    for (const p of proveedores) for (const proyecto of (p.soloMinimo ? [minimo] : [minimo, completo])) {
      const solicitud = { proyecto: { nombre: proyecto.nombre, versionDiseno: proyecto.versionDiseno, diseno: proyecto.diseno, reglas: proyecto.reglas }, historialResumen: '' }
      const mensajes = [{ role: 'system', content: h.SISTEMA_REVISION + (p.proveedor === 'gemini' ? '\nContrato JSON Schema de la respuesta (respeta tipos y enums; no lo copies como respuesta):\n' + JSON.stringify(h.ESQUEMA_REVISION) : '') }, { role: 'user', content: `Modelo y contexto:\n${JSON.stringify(solicitud, null, 1)}\n\nDevuelve el JSON de la revisión.` }]
      const ollama = p.proveedor === 'ollama'
      console.log('INICIO ' + p.proveedor + ' ' + p.modelo + ' ' + (proyecto === minimo ? 'mínimo' : 'completo'))
      await pedir(p.proveedor + ' ' + p.modelo + ' ' + (proyecto === minimo ? 'mínimo' : 'completo'), p.endpoint.replace(/\/+$/, '') + (ollama ? '/api/chat' : '/chat/completions'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(ollama ? {} : { Authorization: 'Bearer ' + p.clave }) }, body: JSON.stringify({ model: p.modelo, messages: mensajes, stream: false, ...(ollama ? { format: h.ESQUEMA_REVISION, options: { num_ctx: 8192, temperature: 0.2 } } : { temperature: 0.2, response_format: { type: 'json_object' } }) }) }, d => ({ caracteresEntrada: JSON.stringify(mensajes).length, uso: d.usage, metricasOllama: ollama ? { totalMs: d.total_duration / 1e6, cargaMs: d.load_duration / 1e6, entradaTokens: d.prompt_eval_count, entradaMs: d.prompt_eval_duration / 1e6, salidaTokens: d.eval_count, salidaMs: d.eval_duration / 1e6, motivoFin: d.done_reason } : undefined, ...analizar(ollama ? d.message?.content ?? '' : d.choices?.[0]?.message?.content ?? '', proyecto, p.proveedor, p.modelo) }))
    }
  }
  ejecutar().catch(e => { console.log('Diagnóstico interrumpido: ' + e.name); process.exitCode = 1 }).finally(() => { guardar(); try { fs.unlinkSync(localState) } catch {} app.quit() })
}
