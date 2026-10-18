import { useState } from 'react'
import { PROVEEDORES_REMOTOS, ProveedorTipo, proveedorRemoto, type Configuracion } from '@shared/ai'
import { useTienda } from '../estado/tienda'

export function DialogoConfiguracion(): JSX.Element {
  const tienda = useTienda()
  const ajustes = tienda.ajustes
  const [claveNueva, setClaveNueva] = useState('')
  const [probando, setProbando] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<string | null>(null)

  if (!ajustes) return <></>

  const actualizado = (parche: Partial<Configuracion>): Configuracion => ({
    ...ajustes,
    ...parche,
    proveedor: { ...ajustes.proveedor, ...(parche.proveedor ?? {}) }
  })

  const preset = proveedorRemoto(ajustes.proveedor.proveedor)

  return (
    <div className="dialogo-fondo">
      <div className="dialogo" style={{ width: 'min(640px, 92vw)' }}>
        <div className="cabecera-dialogo">Modelo / Proveedor de IA</div>
        <div className="cuerpo-dialogo">
          <div className="campo">
            <label>
              <input
                type="checkbox"
                style={{ width: 'auto', marginRight: 8 }}
                checked={ajustes.soloLocal}
                onChange={(e) => void tienda.guardarAjustes(actualizado({ soloLocal: e.target.checked }), null)}
              />
              Modo Solo local (bloquea toda conexión remota de la aplicación)
            </label>
          </div>
          <div className="aviso-importacion">
            El contenido que se envía a una API remota incluye el modelo completo (entidades, claves,
            relaciones, reglas) y el historial resumido. Nunca se envían credenciales del sistema ni
            archivos tratados como instrucciones. Las claves de API se guardan cifradas en el almacén
            seguro del sistema operativo, fuera del proyecto.
          </div>
          <div className="campo">
            <label>Proveedor</label>
            <select
              value={ajustes.proveedor.proveedor}
              onChange={(e) => {
                const tipo = e.target.value as ProveedorTipo
                const preset = tipo === 'ollama' ? null : proveedorRemoto(tipo)
                void tienda.guardarAjustes(
                  actualizado({
                    proveedor: {
                      ...ajustes.proveedor,
                      proveedor: tipo,
                      endpoint: tipo === 'ollama' ? 'http://127.0.0.1:11434' : preset?.endpoint ?? '',
                      modelo: tipo === 'ollama' ? '' : preset?.modelo ?? ''
                    }
                  }),
                  null
                )
              }}
            >
              <option value="ollama">Ollama (local)</option>
              {PROVEEDORES_REMOTOS.map((p) => (
                <option key={p.tipo} value={p.tipo}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Endpoint</label>
            <input
              value={ajustes.proveedor.endpoint}
              onChange={(e) =>
                void tienda.guardarAjustes(
                  actualizado({ proveedor: { ...ajustes.proveedor, endpoint: e.target.value } }),
                  null
                )
              }
            />
          </div>
          <div className="campo">
            <label>Modelo</label>
            <input
              value={ajustes.proveedor.modelo}
              placeholder={
                ajustes.proveedor.proveedor === 'ollama'
                  ? 'Ej: qwen2.5vl o llama3.2'
                  : preset?.modelo
                    ? `Ej: ${preset.modelo}`
                    : 'Ej: gpt-4o-mini'
              }
              onChange={(e) =>
                void tienda.guardarAjustes(
                  actualizado({ proveedor: { ...ajustes.proveedor, modelo: e.target.value } }),
                  null
                )
              }
            />
          </div>
          {preset?.nota && <div className="aviso-importacion">{preset.nota}</div>}
          {ajustes.proveedor.proveedor !== 'ollama' && (
            <div className="campo">
              <label>Clave de API {ajustes.proveedor.claveApiEstablecida ? '(clave guardada — escribe una nueva solo para reemplazarla)' : ''}</label>
              <input
                type="password"
                value={claveNueva}
                placeholder={ajustes.proveedor.claveApiEstablecida ? '••••••••' : preset?.clavePlaceholder ?? 'sk-…'}
                onChange={(e) => setClaveNueva(e.target.value)}
              />
            </div>
          )}
          <div className="fila">
            <button
              onClick={() => {
                void tienda.guardarAjustes(actualizado({}), claveNueva === '' ? null : claveNueva)
                setClaveNueva('')
              }}
            >
              Guardar ajustes
            </button>
            <button
              className="primario"
              disabled={probando}
              onClick={async () => {
                setProbando(true)
                setResultadoPrueba(null)
                const resultado = await tienda.probarConexion()
                setResultadoPrueba(
                  resultado
                    ? `${resultado.ok ? '✓' : '✗'} ${resultado.detalle}${
                        resultado.modelos.length > 0 ? ` · Modelos: ${resultado.modelos.slice(0, 8).join(', ')}${resultado.modelos.length > 8 ? '…' : ''}` : ''
                      }${resultado.capacidades ? ` · visión: ${String(resultado.capacidades.vision)}, estructurado: ${resultado.capacidades.estructurado}` : ''}`
                    : null
                )
                setProbando(false)
              }}
            >
              {probando ? 'Probando…' : 'Probar conexión'}
            </button>
          </div>
          {resultadoPrueba && <div className="aviso-importacion">{resultadoPrueba}</div>}
          <p className="vacio">
            Las capacidades no verificables automáticamente se muestran como tales. No se cambia de
            proveedor en silencio ante un fallo.
          </p>
        </div>
        <div className="pie-dialogo">
          <button className="primario" onClick={() => tienda.setMostrarConfiguracion(false)}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
