const { spawn } = require('node:child_process')
const { resolve } = require('node:path')
const { readFileSync, writeFileSync } = require('node:fs')
const entorno = { ...process.env }
delete entorno.ELECTRON_RUN_AS_NODE
const manifiesto = resolve(__dirname, '../../artefactos-locales', `reinicio-${process.pid}.json`)
function lanzar(extra = {}, args = []) {
  return new Promise((resolver, rechazar) => {
    const proceso = spawn(require('electron'), [...args, resolve(__dirname, 'electron.cjs')], {
      stdio: 'inherit', windowsHide: true, env: { ...entorno, VISUAL_BD_QA_MANIFIESTO: manifiesto, ...extra }
    })
    proceso.on('error', rechazar)
    proceso.on('exit', codigo => codigo === 0 ? resolver() : rechazar(new Error(`Electron de prueba terminó con código ${codigo}`)))
  })
}
;(async () => {
  await lanzar()
  if (!entorno.VISUAL_BD_QA_PROVEEDOR) {
    for (const escala of ['1.25', '1.5']) {
      await lanzar({ VISUAL_BD_QA_REINICIO: manifiesto, VISUAL_BD_QA_ESCALA: escala }, [`--force-device-scale-factor=${escala}`])
      // El siguiente proceso debe verificar la posición que dejó el anterior.
      const datos = JSON.parse(readFileSync(manifiesto, 'utf8'))
      datos.posicion = { x: 16, y: 48 }
      writeFileSync(manifiesto, JSON.stringify(datos))
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1 })
