import { useEffect, useState } from 'react'
import { useTienda } from '../estado/tienda'

function formatearTokens(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(2)} M`
  if (valor >= 10_000) return `${(valor / 1_000).toFixed(1)} k`
  return String(valor)
}

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function PanelConsumo(): JSX.Element {
  const tienda = useTienda()
  const consumo = tienda.consumo
  const ajustes = tienda.ajustes
  const limiteActual = ajustes?.limiteDiarioTokens ?? null
  const [limiteTexto, setLimiteTexto] = useState(limiteActual === null ? '' : String(limiteActual))

  useEffect(() => {
    void tienda.refrescarConsumo()
    const temporizador = setInterval(() => void tienda.refrescarConsumo(), 15000)
    return () => clearInterval(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLimiteTexto(limiteActual === null ? '' : String(limiteActual))
  }, [limiteActual])

  if (!ajustes) return <p className="vacio">Cargando ajustes…</p>
  if (!consumo) return <p className="vacio">Sin datos de consumo todavía.</p>

  const totalHoy = consumo.hoy.total
  const porcentaje =
    consumo.limiteDiario && consumo.limiteDiario > 0
      ? Math.min(100, (totalHoy / consumo.limiteDiario) * 100)
      : null
  const excedido = consumo.restanteHoy !== null && consumo.restanteHoy < 0
  const cercaLimite = porcentaje !== null && porcentaje >= 80 && !excedido

  const guardarLimite = () => {
    const valor = limiteTexto.trim() === '' ? null : Number(limiteTexto)
    if (valor !== null && (!Number.isFinite(valor) || valor <= 0)) {
      tienda.setAviso('El límite diario debe ser un número positivo de tokens, o vacío para no poner límite.')
      return
    }
    void tienda.guardarAjustes({ ...ajustes, limiteDiarioTokens: valor }, null)
  }

  const diasSinHoy = consumo.dias.filter((d) => d.fecha !== consumo.hoy.fecha).slice(0, 10)
  const deHoy = consumo.dias.filter((d) => d.fecha === consumo.hoy.fecha)

  return (
    <div>
      <h2>Consumo de IA</h2>
      <p className="vacio">
        Registro local de peticiones y tokens. Los límites diarios son orientativos: la cuenta y el
        momento de reinicio los controla cada proveedor.
      </p>

      <h3>Hoy ({fechaLegible(consumo.hoy.fecha)})</h3>
      <div className="resumen-consumo">
        <div className="dato-consumo">
          <span className="etiqueta">Peticiones</span>
          <span className="valor">{consumo.hoy.peticiones}</span>
        </div>
        <div className="dato-consumo">
          <span className="etiqueta">Entrada</span>
          <span className="valor">{formatearTokens(consumo.hoy.entrada)}</span>
        </div>
        <div className="dato-consumo">
          <span className="etiqueta">Salida</span>
          <span className="valor">{formatearTokens(consumo.hoy.salida)}</span>
        </div>
        <div className="dato-consumo">
          <span className="etiqueta">Total</span>
          <span className="valor">{formatearTokens(totalHoy)}</span>
        </div>
      </div>

      {porcentaje !== null && (
        <div className="barra-consumo-container">
          <div className="barra-consumo-texto">
            {excedido
              ? `Límite diario superado en ${formatearTokens(Math.abs(consumo.restanteHoy ?? 0))} tokens`
              : cercaLimite
                ? `Cerca del límite: ${formatearTokens(consumo.restanteHoy ?? 0)} tokens restantes`
                : `Restantes hoy: ${formatearTokens(consumo.restanteHoy ?? 0)} de ${formatearTokens(consumo.limiteDiario ?? 0)}`}
          </div>
          <div className={`barra-consumo${excedido ? ' excedida' : cercaLimite ? ' cerca' : ''}`}>
            <div style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      )}

      <div className="campo">
        <label htmlFor="limite-tokens">Límite diario de tokens (opcional)</label>
        <div className="fila">
          <input
            id="limite-tokens"
            type="number"
            min={0}
            value={limiteTexto}
            placeholder="Ej: 100000"
            onChange={(e) => setLimiteTexto(e.target.value)}
          />
          <button className="auto" onClick={guardarLimite}>
            Guardar
          </button>
        </div>
      </div>

      {deHoy.length > 0 && (
        <>
          <h3>Por proveedor (hoy)</h3>
          <div className="lista-elementos">
            {deHoy.map((dia) => (
              <div className="elemento" key={`${dia.fecha}-${dia.proveedor}-${dia.modelo}`}>
                <div className="titulo-elemento">
                  {dia.proveedor} · {dia.modelo || '(sin modelo)'}
                  {dia.estimado && <span className="marca-estimado"> ≈ estimado</span>}
                </div>
                <div className="detalle-elemento">
                  {dia.peticiones} pet. · ↑{formatearTokens(dia.entrada)} ↓{formatearTokens(dia.salida)} ·{' '}
                  {formatearTokens(dia.entrada + dia.salida)} tokens
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {diasSinHoy.length > 0 && (
        <>
          <h3>Días anteriores</h3>
          <div className="lista-elementos">
            {diasSinHoy.map((dia) => (
              <div className="elemento" key={`${dia.fecha}-${dia.proveedor}-${dia.modelo}`}>
                <div className="titulo-elemento">
                  {fechaLegible(dia.fecha)} · {dia.proveedor} · {dia.modelo || '(sin modelo)'}
                  {dia.estimado && <span className="marca-estimado"> ≈ estimado</span>}
                </div>
                <div className="detalle-elemento">
                  {dia.peticiones} pet. · {formatearTokens(dia.entrada + dia.salida)} tokens
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="fila" style={{ marginTop: 12 }}>
        <button
          className="auto"
          onClick={() => {
            void tienda.refrescarConsumo()
          }}
        >
          Actualizar
        </button>
        <details className="gestion-registro"><summary>Gestionar registro local</summary><button
          className="peligro auto"
          onClick={() => {
            if (window.confirm('¿Borrar el historial de consumo de tokens registrado?')) {
              void tienda.limpiarConsumo()
            }
          }}
        >
          Limpiar historial
        </button></details>
      </div>
    </div>
  )
}
