import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import { Configuracion, ConfigProveedor, PROVEEDORES_REMOTOS } from '@shared/ai'
import { guardarClaveApi, hayClaveApi } from '../almacen-credenciales'

const defecto: Configuracion = {
  soloLocal: true,
  proveedor: { proveedor: 'ollama', endpoint: 'http://127.0.0.1:11434', modelo: '', claveApiEstablecida: false },
  proveedores: {}, limiteDiarioTokens: null, ultimoProyecto: null
}

function rutaConfig(): string {
  const dir = join(app.getPath('userData'), 'ajustes')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'configuracion.json')
}

function perfilSeguro(perfil: ConfigProveedor): ConfigProveedor {
  return { proveedor: perfil.proveedor, endpoint: perfil.endpoint.trim(), modelo: perfil.proveedor === 'gemini' ? perfil.modelo.replace(/^models\//, '') : perfil.modelo,
    claveApiEstablecida: hayClaveApi(perfil.proveedor) }
}

export function cargarConfiguracion(): Configuracion {
  const ruta = rutaConfig()
  if (!existsSync(ruta)) return structuredClone(defecto)
  // Un archivo dañado se informa; nunca se sobrescriben perfiles con valores vacíos.
  const guardada = JSON.parse(readFileSync(ruta, 'utf-8')) as Configuracion
  const proveedores: NonNullable<Configuracion['proveedores']> = {}
  for (const tipo of ['ollama' as const, ...PROVEEDORES_REMOTOS.map((p) => p.tipo)]) {
    const perfil = guardada.proveedores?.[tipo]
    if (perfil) proveedores[tipo] = perfilSeguro({ ...perfil, proveedor: tipo })
    else if (hayClaveApi(tipo)) proveedores[tipo] = perfilSeguro({ proveedor: tipo,
      endpoint: PROVEEDORES_REMOTOS.find((p) => p.tipo === tipo)?.endpoint ?? defecto.proveedor.endpoint, modelo: '', claveApiEstablecida: true })
  }
  const proveedor = perfilSeguro(guardada.proveedor ?? defecto.proveedor)
  proveedores[proveedor.proveedor] = proveedor
  return { soloLocal: guardada.soloLocal ?? true, proveedor, proveedores,
    limiteDiarioTokens: guardada.limiteDiarioTokens ?? null, ultimoProyecto: guardada.ultimoProyecto ?? null }
}

export function guardarConfiguracion(config: Configuracion, claveNueva: string | null, activar = true): Configuracion {
  const anterior = cargarConfiguracion()
  if (claveNueva !== null) guardarClaveApi(config.proveedor.proveedor, claveNueva)
  const proveedor = perfilSeguro(config.proveedor)
  const salida: Configuracion = { soloLocal: config.soloLocal,
    proveedor: activar || anterior.proveedor.proveedor === proveedor.proveedor ? proveedor : anterior.proveedor,
    proveedores: { ...anterior.proveedores, [proveedor.proveedor]: proveedor },
    limiteDiarioTokens: config.limiteDiarioTokens, ultimoProyecto: config.ultimoProyecto }
  const ruta = rutaConfig()
  writeFileSync(`${ruta}.tmp`, JSON.stringify(salida, null, 2), { mode: 0o600 })
  renameSync(`${ruta}.tmp`, ruta)
  return salida
}
