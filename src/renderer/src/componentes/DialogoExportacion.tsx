import { useMemo, useRef, useState } from 'react'
import type { ArchivoExportacion, FormatoExportacion, ResultadoExportacion } from '@shared/exportacion'
import type { Proyecto } from '../domain/modelo'
import { crearInstantanea } from '../exportadores/instantanea'
import { exportarMarkdown } from '../exportadores/markdown'
import { api } from '../ipc'
import { DialogoBase } from './DialogoBase'
import { prepararAlcance } from '../exportadores/alcance'
import type { Seleccion } from '../estado/tienda'
import { exportarSvg, type TemaDiagrama } from '../exportadores/graficos'
import { rasterizarPng } from '../exportadores/png'
import { exportarMermaid } from '../exportadores/mermaid'
import { exportarDrawio } from '../exportadores/drawio'

export function DialogoExportacion({ proyecto, seleccion, propuestaId, cerrar }: { proyecto: Proyecto; seleccion: Seleccion; propuestaId: string | null; cerrar: () => void }): JSX.Element {
  const [captura] = useState(() => structuredClone(proyecto))
  const [seleccionInicial] = useState(() => structuredClone(seleccion))
  const [propuestaInicial] = useState(propuestaId)
  const [alcance, setAlcance] = useState<'completo' | 'seleccion'>('completo')
  const [origenPropuesto, setOrigenPropuesto] = useState(false)
  const [tema, setTema] = useState<TemaDiagrama>('claro')
  const [escala, setEscala] = useState<1 | 2>(1)
  const [anexos, setAnexos] = useState(false)
  const [fecha] = useState(() => new Date().toISOString())
  const [formato, setFormato] = useState<FormatoExportacion>('paquete')
  const [notas, setNotas] = useState(true)
  const [revisionLocal, setRevisionLocal] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const enCurso = useRef(false)
  const [resultado, setResultado] = useState<ResultadoExportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const grafico = ['svg', 'png', 'drawio'].includes(formato)
  const preparado = useMemo(() => {
    try {
      const { proyecto: limitado, contexto } = prepararAlcance(captura, alcance, seleccionInicial, origenPropuesto ? propuestaInicial : null)
      const instantanea = crearInstantanea(limitado, { notas, revisionLocal: !grafico && formato !== 'mermaid' && revisionLocal, geometria: grafico, propuestas: !grafico && formato !== 'mermaid' && anexos }, '', fecha, contexto)
      const svg = formato === 'svg' || formato === 'png' ? exportarSvg(instantanea, tema) : null
      const diagrama = formato === 'mermaid' ? exportarMermaid(instantanea) : formato === 'drawio' ? exportarDrawio(instantanea) : null
      return { instantanea, svg, diagrama, error: null }
    } catch (e) { return { instantanea: null, svg: null, diagrama: null, error: (e as Error).message } }
  }, [captura, alcance, seleccionInicial, origenPropuesto, propuestaInicial, notas, revisionLocal, grafico, formato, anexos, fecha, tema])
  const instantanea = preparado.instantanea
  const exportar = async () => {
    if (enCurso.current || !instantanea || preparado.error) return
    enCurso.current = true
    setOcupado(true); setResultado(null); setError(null)
    try {
      const datos = { ...instantanea, exportacion: { ...instantanea.exportacion, versionAplicacion: await api().versionAplicacion() } }
      const archivos: ArchivoExportacion[] = []
      if (formato === 'markdown' || formato === 'paquete') archivos.push({ tipo: 'markdown', contenido: exportarMarkdown(datos) })
      if (formato === 'json' || formato === 'paquete') archivos.push({ tipo: 'json', contenido: JSON.stringify(datos, null, 2) + '\n' })
      if (formato === 'svg' && preparado.svg) archivos.push({ tipo: 'svg', contenido: preparado.svg.contenido })
      if (formato === 'png' && preparado.svg) archivos.push({ tipo: 'png', contenido: await rasterizarPng(preparado.svg, escala) })
      if ((formato === 'drawio' || formato === 'mermaid') && preparado.diagrama) archivos.push({ tipo: formato, contenido: preparado.diagrama.contenido })
      setResultado(await api().exportarArchivos({ nombre: captura.nombre, archivos }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo preparar la exportación. Vuelve a intentarlo.')
    } finally { enCurso.current = false; setOcupado(false) }
  }
  return <DialogoBase titulo="Exportar diseño" cerrar={ocupado ? undefined : cerrar} ancho="620px" acciones={<>
    <button type="button" disabled={ocupado} onClick={cerrar}>Cerrar</button>
    <button type="button" className="primario" disabled={ocupado || !instantanea} onClick={() => void exportar()}>{ocupado ? 'Exportando…' : 'Exportar…'}</button>
  </>}>
    <p><strong>{captura.nombre}</strong> · {origenPropuesto ? 'Propuesta no aplicada' : 'Diseño actual'} · {alcance === 'completo' ? 'Completo' : 'Selección parcial'} · Versión {captura.versionDiseno}</p>
    <p className="descripcion-panel">Se captura el modelo al abrir este diálogo, incluso con cambios sin guardar. Las propuestas quedan fuera salvo que elijas explícitamente la vista propuesta o el anexo documental.</p>
    <label className="campo">Formato
      <select value={formato} disabled={ocupado} onChange={e => { setFormato(e.target.value as FormatoExportacion); setResultado(null) }}>
        <option value="paquete">Markdown + JSON (carpeta nueva)</option>
        <option value="markdown">Reporte Markdown (.md)</option>
        <option value="json">Modelo estructurado (.json)</option>
        <option value="svg">Diagrama vectorial (.svg)</option>
        <option value="png">Imagen (.png)</option>
        <option value="mermaid">Mermaid ER (.mmd)</option>
        <option value="drawio">Diagrama editable (.drawio)</option>
      </select>
    </label>
    <label className="campo">Alcance<select value={alcance} disabled={ocupado} onChange={e => setAlcance(e.target.value as 'completo' | 'seleccion')}><option value="completo">Diseño completo</option><option value="seleccion" disabled={!seleccionInicial}>Selección del lienzo (una relación incluye ambos extremos)</option></select></label>
    <div className="opciones-exportacion">
      {propuestaInicial && <label><input type="checkbox" checked={origenPropuesto} disabled={ocupado} onChange={e => setOrigenPropuesto(e.target.checked)} /> Exportar propuesta en comparación (no aplicada)</label>}
      {formato !== 'mermaid' && <label><input type="checkbox" checked={notas} disabled={ocupado} onChange={e => setNotas(e.target.checked)} /> Incluir notas del diseño</label>}
      {!grafico && formato !== 'mermaid' && <><label><input type="checkbox" checked={anexos} disabled={ocupado} onChange={e => setAnexos(e.target.checked)} /> Anexar propuestas pendientes (no son reglas confirmadas)</label><label><input type="checkbox" checked={revisionLocal} disabled={ocupado} onChange={e => setRevisionLocal(e.target.checked)} /> Incluir revisión local de estructura y normalización</label></>}
    </div>
    {(formato === 'svg' || formato === 'png') && <div className="opciones-exportacion"><label className="campo">Fondo<select value={tema} disabled={ocupado} onChange={e => setTema(e.target.value as TemaDiagrama)}><option value="claro">Claro</option><option value="oscuro">Oscuro</option><option value="transparente">Transparente (texto oscuro)</option></select></label>{formato === 'png' && <label className="campo">Escala<select value={escala} disabled={ocupado} onChange={e => setEscala(Number(e.target.value) as 1 | 2)}><option value={1}>1×</option><option value={2}>2×</option></select></label>}</div>}
    {preparado.error && <p role="alert">{preparado.error}</p>}
    {preparado.diagrama && <div className="estado-contextual"><strong>Limitaciones del formato</strong><ul>{preparado.diagrama.advertencias.map(a => <li key={a}>{a}</li>)}</ul></div>}
    {grafico && <p className="descripcion-panel">El diagrama no representa todas las reglas ni los atributos propios de relaciones; acompáñalo con Markdown/JSON para conservar su semántica.</p>}
    <p>{instantanea?.modelo.entidades.length ?? 0} entidades · {instantanea?.modelo.relaciones.length ?? 0} relaciones · {instantanea?.modelo.reglas.length ?? 0} reglas</p>
    {captura.diseno.entidades.length === 0 && <p className="mensaje-info">Este diseño no contiene entidades. El reporte conservará las reglas, notas y pendientes disponibles.</p>}
    {!!instantanea?.advertencias.length && <div className="estado-contextual"><strong>Referencias o estructura por revisar</strong><ul>{instantanea.advertencias.map((a, i) => <li key={i}>{a.mensaje}</li>)}</ul><p>Se exportarán como advertencias, sin corregir el modelo.</p></div>}
    <p className="descripcion-panel">Compartirás nombres, descripciones, reglas y las notas elegidas. No se incluyen chat, credenciales, configuración de proveedores, rutas de importación ni historial de edición. No se consulta IA.</p>
    <div aria-live="polite" aria-busy={ocupado}>
      {ocupado && <p role="status">Preparando archivos y esperando el destino…</p>}
      {resultado?.estado === 'cancelada' && <p role="status">Exportación cancelada. No se escribieron archivos.</p>}
      {resultado?.estado === 'completa' && <p role="status">Exportación completada.</p>}
    </div>
    {(error || resultado?.mensaje) && <p role="alert">{error ?? resultado?.mensaje}</p>}
    {!!resultado?.archivos.length && <div className="resultado-exportacion"><ul>{resultado.archivos.map(ruta => <li key={ruta}>{ruta}</li>)}</ul><button type="button" disabled={ocupado} onClick={async () => {
      try { const mensaje = await api().abrirCarpetaExportacion(); if (mensaje) setError('No se pudo abrir la carpeta. Usa las rutas indicadas.') } catch { setError('No se pudo abrir la carpeta.') }
    }}>Abrir carpeta</button></div>}
  </DialogoBase>
}
