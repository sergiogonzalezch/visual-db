import { describe, expect, it, vi } from 'vitest'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { adaptadorOllama } from '../../src/main/ia/ollama'
import { crearAtributo, crearEntidad, crearProyectoVacio } from '../../src/renderer/src/domain/modelo'

// Ensayo optativo de red real: no escribe en ajustes, credenciales ni consumo personal.
vi.mock('../../src/main/ia/consumo', () => ({ registrarConsumo: vi.fn(), estimarTokens: (s: string) => Math.ceil(s.length / 4) }))

describe.skipIf(process.env.VISUAL_BD_QA_LOCAL !== '1')('Ollama real, caso reducido', () => {
  it('conecta y genera una revisión estructurada sin cambiar el proveedor activo', async () => {
    const ahora = new Date()
    const fechaLocal = [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, '0'), String(ahora.getDate()).padStart(2, '0')].join('-')
    const carpetaEvidencias = join(process.cwd(), 'artefactos-locales', 'pruebas', fechaLocal)
    mkdirSync(carpetaEvidencias, { recursive: true })
    const evidencia = join(carpetaEvidencias, 'ollama-revision-real.json')
    const config = { proveedor: 'ollama' as const, endpoint: 'http://127.0.0.1:11434', modelo: 'mistral:latest', claveApiEstablecida: false }
    const conexion = await adaptadorOllama.probarConexion(config, null)
    expect(conexion.ok).toBe(true)
    const proyecto = crearProyectoVacio('QA local mínima')
    const entidad = crearEntidad('Cliente', 0, 0)
    const id = crearAtributo('cliente_id'), correo = crearAtributo('email')
    id.nulable = false; id.unico = true; id.tipoDato = 'entero'; id.multivalorado = false
    entidad.atributos.push(id, correo)
    entidad.claves.push({ id: 'pk-cliente', nombre: 'PK Cliente', tipo: 'primaria', atributoIds: [id.id], foranea: null })
    proyecto.diseno.entidades.push(entidad)
    const inicio = Date.now()
    try {
      const respuesta = await adaptadorOllama.revisar({ proyecto: { nombre: proyecto.nombre, versionDiseno: 0, diseno: proyecto.diseno, reglas: [] }, historialResumen: '', contexto: { pregunta: 'Evalúa este caso mínimo. No se conoce si email es obligatorio o único; pregunta antes de imponer esas restricciones. Devuelve como máximo una propuesta breve.' } }, config, null, AbortSignal.timeout(180000))
      writeFileSync(evidencia, JSON.stringify({ fecha: new Date().toISOString(), modelo: config.modelo, duracionMs: Date.now() - inicio, respuesta }, null, 2))
      expect(typeof respuesta.resumen).toBe('string')
      expect(Array.isArray(respuesta.propuestas)).toBe(true)
      respuesta.propuestas.forEach(p => { expect(typeof p.titulo).toBe('string'); expect(Array.isArray(p.operaciones)).toBe(true) })
    } catch (error) {
      writeFileSync(evidencia, JSON.stringify({ fecha: new Date().toISOString(), modelo: config.modelo, duracionMs: Date.now() - inicio, error: (error as Error).message }, null, 2))
      throw error
    }
  }, 190000)
})
