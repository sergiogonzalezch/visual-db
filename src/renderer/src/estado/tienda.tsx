import { mensajeErrorVisible } from '../presentacion/errores'
import { chatInicial } from '../presentacion/chat-proyecto'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type {
  Configuracion,
  MensajeChat,
  ResumenConsumo,
  ResultadoPruebaConexion
} from '@shared/ai'
import { api } from '../ipc'
import {
  Ambiguedad,
  Proyecto,
  crearEntidad,
  crearNota,
  crearProyectoVacio,
  crearRelacion,
  nuevoId
} from '../domain/modelo'
import { Operacion } from '../domain/operaciones'
import {
  EntradaHistorial,
  Historial,
  deshacer as deshacerHistorial,
  editar,
  historialVacio,
  puedeDeshacer as estadoPuedeDeshacer,
  puedeRehacer as estadoPuedeRehacer,
  rehacer as rehacerHistorial
} from '../domain/historial'
import { Propuesta } from '../domain/propuestas'
import {
  aplicarPropuesta,
  crearPropuesta,
  guardarNuevasPropuestas,
  marcarDesactualizadas,
  rechazarPropuesta
} from '../domain/aprobacion'
import { HallazgoLocal, validarProyecto } from '../domain/validacion'
import { ResultadoNormalizacion, analizarNormalizacion } from '../domain/normalizacion'
import { BorradorProyecto, borradorAProyecto, borradorIABorrador } from '../importadores/borrador'
import { importarMarkdown } from '../importadores/markdown'

export type Herramienta = 'seleccion' | 'entidad' | 'relacion' | 'nota'
export type Pestana = 'propiedades' | 'revision' | 'chat' | 'consumo'
export type Seleccion =
  | { tipo: 'entidad'; id: string }
  | { tipo: 'relacion'; id: string }
  | { tipo: 'nota'; id: string }
  | null

export interface EstadoIA {
  revisando: boolean
  chateando: boolean
  error: string | null
}

interface Tienda {
  proyecto: Proyecto
  historial: Historial
  ruta: string | null
  sucio: boolean
  seleccion: Seleccion
  herramienta: Herramienta
  panelAbierto: boolean
  setPanelAbierto: (abierto: boolean) => void
  pestana: Pestana
  vista: 'actual' | 'propuesto'
  propuestaEnComparacion: string | null
  mensajesChat: MensajeChat[]
  sesionChat: number
  estadoIA: EstadoIA
  hallazgos: HallazgoLocal[]
  resultadoNormalizacion: ResultadoNormalizacion | null
  ajustes: Configuracion | null
  consumo: ResumenConsumo | null
  borradorImportacion: BorradorProyecto | null
  ambiguidadesBorrador: Ambiguedad[]
  mostrarConfiguracion: boolean
  mostrarHistorial: boolean
  aviso: string | null
  entidadOrigenRelacion: string | null
  setEntidadOrigenRelacion: (id: string | null) => void
  aplicar: (operaciones: Operacion[], opciones?: { etiqueta?: string; fuente?: EntradaHistorial['fuente']; propuestaId?: string | null }) => void
  deshacer: () => void
  rehacer: () => void
  seleccionar: (seleccion: Seleccion) => void
  setHerramienta: (herramienta: Herramienta) => void
  setPestana: (pestana: Pestana) => void
  setVista: (vista: 'actual' | 'propuesto') => void
  setPropuestaEnComparacion: (id: string | null) => void
  crearEntidadEn: (x: number, y: number) => void
  conectarEntidades: (a: string, b: string) => void
  crearNotaEn: (x: number, y: number) => void
  eliminarSeleccion: () => void
  guardar: () => Promise<void>
  guardarComo: () => Promise<void>
  abrir: () => Promise<void>
  renombrarProyecto: (nombre: string) => void
  nuevo: () => void
  importarDrawio: () => Promise<void>
  importarImagen: () => Promise<void>
  importarMarkdown: () => Promise<void>
  importarProsaIA: (contenido: string, nombre: string) => Promise<void>
  confirmarBorrador: () => void
  descartarBorrador: () => void
  resolverAmbiguedadBorrador: (indice: number, resolucion: Ambiguedad['resolucion']) => void
  confirmarInterpretacion: () => void
  resolverAmbiguedad: (id: string, resolucion: Ambiguedad['resolucion']) => void
  agregarPropuestaLocal: (entrada: {
    categoria: Propuesta['categoria']
    prioridad: Propuesta['prioridad']
    titulo: string
    explicacion: string
    fundamento: string
    supuestos: string[]
    preguntas: string[]
    operaciones: Operacion[]
    resultado: string
    contrapartidas: string[]
    dependeDe: string[]
  }) => void
  solicitarRevision: () => Promise<void>
  cancelarRevision: () => void
  aceptarPropuesta: (id: string, riesgosRevisados?: boolean) => void
  rechazarPropuesta: (id: string, nota: string | null) => void
  discutirPropuesta: (id: string, texto: string) => Promise<void>
  chatear: (texto: string) => Promise<void>
  seccionRevision: 'reglas' | 'propuestas'
  setSeccionRevision: (valor: 'reglas' | 'propuestas') => void
  analizar: () => void
  setMostrarConfiguracion: (valor: boolean) => void
  setMostrarHistorial: (valor: boolean) => void
  setAviso: (texto: string | null) => void
  recargarAjustes: () => Promise<Configuracion>
  guardarAjustes: (config: Configuracion, claveNueva: string | null) => Promise<void>
  probarConexion: () => Promise<ResultadoPruebaConexion | null>
  refrescarConsumo: () => Promise<void>
  limpiarConsumo: () => Promise<void>
  restaurarRecuperacion: (proyecto: Proyecto, historial: Historial) => void
  descartarRecuperacion: () => void
  recuperacionPendiente: { fecha: string; proyecto: Proyecto; historial: Historial; mensajesChat?: MensajeChat[] } | null
  actualizarPropuesta: (id: string, parche: Partial<Pick<Propuesta, 'titulo' | 'explicacion' | 'operaciones' | 'supuestos' | 'preguntas' | 'resultado' | 'contrapartidas' | 'fundamento'>>) => void
}

const ContextoTienda = createContext<Tienda | null>(null)

interface EstadoBorrador {
  borrador: BorradorProyecto
  proyectoBase: Proyecto
  resoluciones: (Ambiguedad['resolucion'])[]
}

export function TiendaProvider({ children }: { children: ReactNode }): JSX.Element {
  const [proyecto, setProyecto] = useState<Proyecto>(() => crearProyectoVacio('Proyecto sin título'))
  const [historial, setHistorial] = useState<Historial>(historialVacio)
  const [ruta, setRuta] = useState<string | null>(null)
  const [sucio, setSucio] = useState(false)
  const [seleccion, setSeleccion] = useState<Seleccion>(null)
  const [herramienta, setHerramienta] = useState<Herramienta>('seleccion')
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [pestana, setPestanaActiva] = useState<Pestana>('propiedades')
  const setPestana = useCallback((valor: Pestana) => {
    setPestanaActiva(valor)
    setPanelAbierto(true)
  }, [])
  const [seccionRevision, setSeccionRevision] = useState<'reglas' | 'propuestas'>('reglas')
  const [vista, setVista] = useState<'actual' | 'propuesto'>('actual')
  const [propuestaEnComparacion, setPropuestaEnComparacion] = useState<string | null>(null)
  const [mensajesChat, establecerMensajesChat] = useState<MensajeChat[]>(chatInicial)
  const mensajesChatRef = useRef(mensajesChat)
  const sesionChat = useRef(0)
  const revisionEnCurso = useRef(false)
  const turnoRevision = useRef(0)
  const [versionChat, setVersionChat] = useState(0)
  const setMensajesChat = useCallback((valor: MensajeChat[] | ((prev: MensajeChat[]) => MensajeChat[])) => {
    const siguientes = typeof valor === 'function' ? valor(mensajesChatRef.current) : valor
    mensajesChatRef.current = siguientes
    establecerMensajesChat(siguientes)
    setVersionChat((prev) => prev + 1)
    setSucio(true)
  }, [])
  const cargarChat = useCallback((valor?: unknown) => {
    setAviso(null)
    sesionChat.current += 1
    turnoRevision.current += 1
    revisionEnCurso.current = false
    setVista('actual')
    setPropuestaEnComparacion(null)
    setHallazgos([])
    setResultadoNormalizacion(null)
    const mensajes = chatInicial(valor)
    mensajesChatRef.current = mensajes
    establecerMensajesChat(mensajes)
    setEstadoIA({ revisando: false, chateando: false, error: null })
  }, [])
  const [estadoIA, setEstadoIA] = useState<EstadoIA>({ revisando: false, chateando: false, error: null })
  const [hallazgos, setHallazgos] = useState<HallazgoLocal[]>([])
  const [resultadoNormalizacion, setResultadoNormalizacion] = useState<ResultadoNormalizacion | null>(null)
  const [ajustes, setAjustes] = useState<Configuracion | null>(null)
  const [consumo, setConsumo] = useState<ResumenConsumo | null>(null)
  const [estadoBorrador, setEstadoBorrador] = useState<EstadoBorrador | null>(null)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [entidadOrigenRelacion, setEntidadOrigenRelacion] = useState<string | null>(null)
  const [recuperacionPendiente, setRecuperacionPendiente] =
    useState<{ fecha: string; proyecto: Proyecto; historial: Historial; mensajesChat?: MensajeChat[] } | null>(null)

  const refrescarConsumo = useCallback(async () => {
    try {
      const resumen = await api().consumo()
      setConsumo(resumen)
    } catch {
      // el consumo no debe interrumpir el flujo
    }
  }, [])

  const limpiarConsumo = useCallback(async () => {
    const resumen = await api().limpiarConsumo()
    setConsumo(resumen)
  }, [])

  const proyectoRef = useRef(proyecto)
  proyectoRef.current = proyecto
  const historialRef = useRef(historial)
  historialRef.current = historial

  const aplicar = useCallback<Tienda['aplicar']>((operaciones, opciones = {}) => {
    if (vista === 'propuesto') { setAviso('La propuesta es de solo lectura. Vuelve a Actual para editar.'); return }
    if (operaciones.length === 0) return
    const primera = operaciones[0]
    try {
      const resultado = editar(
        { diseno: proyectoRef.current.diseno, reglas: proyectoRef.current.reglas },
        historialRef.current,
        operaciones,
        operaciones.length === 1 && primera.op === 'updateEntidad' && !opciones.etiqueta
          ? { ...opciones, etiqueta: `Modificar entidad «${primera.parche.nombre ?? proyectoRef.current.diseno.entidades.find(e => e.id === primera.id)?.nombre ?? 'Entidad'}»` }
          : opciones
      )
      const siguiente: Proyecto = {
        ...proyectoRef.current,
        diseno: resultado.estado.diseno,
        reglas: resultado.estado.reglas,
        versionDiseno: proyectoRef.current.versionDiseno + 1,
        actualizadoEn: new Date().toISOString()
      }
      setProyecto(marcarDesactualizadas(siguiente))
      setHistorial(resultado.historial)
      setSucio(true)
    } catch (error) {
      setAviso(`No se pudo aplicar el cambio: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [vista])

  const deshacer = useCallback(() => {
    if (vista === 'propuesto') { setAviso('Vuelve a Actual para modificar el historial.'); return }
    const resultado = deshacerHistorial(
      { diseno: proyectoRef.current.diseno, reglas: proyectoRef.current.reglas },
      historialRef.current
    )
    if (!resultado) return
    setProyecto({
      ...proyectoRef.current,
      diseno: resultado.estado.diseno,
      reglas: resultado.estado.reglas,
      versionDiseno: proyectoRef.current.versionDiseno + 1,
      actualizadoEn: new Date().toISOString()
    })
    setHistorial(resultado.historial)
    setSucio(true)
    setSeleccion(null)
  }, [vista])

  const rehacer = useCallback(() => {
    if (vista === 'propuesto') { setAviso('Vuelve a Actual para modificar el historial.'); return }
    const resultado = rehacerHistorial(
      { diseno: proyectoRef.current.diseno, reglas: proyectoRef.current.reglas },
      historialRef.current
    )
    if (!resultado) return
    setProyecto({
      ...proyectoRef.current,
      diseno: resultado.estado.diseno,
      reglas: resultado.estado.reglas,
      versionDiseno: proyectoRef.current.versionDiseno + 1,
      actualizadoEn: new Date().toISOString()
    })
    setHistorial(resultado.historial)
    setSucio(true)
  }, [vista])

  const empaquetar = useCallback(
    (p: Proyecto = proyectoRef.current, h: Historial = historialRef.current) => ({
      formatoVersion: p.formatoVersion,
      proyecto: p,
      historial: h,
      mensajesChat: mensajesChatRef.current
    }),
    []
  )

  const renombrarProyecto = useCallback((nombre: string) => {
    if (nombre.slice(0, 120) === proyectoRef.current.nombre) return
    const actual = { ...proyectoRef.current, nombre: nombre.slice(0, 120), actualizadoEn: new Date().toISOString() }
    proyectoRef.current = actual
    setProyecto(actual)
    setSucio(true)
  }, [])

  const guardar = useCallback(async () => {
    if (!proyectoRef.current.nombre.trim()) { setAviso("Escribe un nombre para el proyecto antes de guardar."); return }
    const actual = ruta
    if (!actual) {
      await guardarComo()
      return
    }
    try {
      const archivo = empaquetar()
      const sesion = sesionChat.current
      await api().guardarProyecto(actual, archivo)
      if (sesion !== sesionChat.current) return
      if (archivo.proyecto === proyectoRef.current && archivo.mensajesChat === mensajesChatRef.current) setSucio(false)
      await api().guardarAjustes(
        {
          ...(ajustes ?? (await api().obtenerAjustes())),
          ultimoProyecto: { ruta: actual, id: proyectoRef.current.id }
        },
        null
      )
    } catch (error) {
      setAviso(`Error al guardar: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [ruta, empaquetar, ajustes])

  const guardarComo = useCallback(async () => {
    if (!proyectoRef.current.nombre.trim()) { setAviso("Escribe un nombre para el proyecto antes de guardar."); return }
    try {
      const archivo = empaquetar()
      const sesion = sesionChat.current
      const destino = await api().guardarComoDialogo(archivo, archivo.proyecto.nombre)
      if (!destino) return
      if (sesion !== sesionChat.current) return
      setRuta(destino)
      if (archivo.proyecto === proyectoRef.current && archivo.mensajesChat === mensajesChatRef.current) setSucio(false)
      const actuales = ajustes ?? (await api().obtenerAjustes())
      await api().guardarAjustes(
        { ...actuales, ultimoProyecto: { ruta: destino, id: proyectoRef.current.id } },
        null
      )
      setAjustes(actuales)
    } catch (error) {
      setAviso(`Error al guardar: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [empaquetar, ajustes])

  const abrir = useCallback(async () => {
    try {
      const resultado = await api().abrirProyectoDialogo()
      if (!resultado) return
      const archivo = resultado.archivo as { proyecto: Proyecto; historial: Historial; mensajesChat?: MensajeChat[] }
      setProyecto(archivo.proyecto)
      setHistorial(archivo.historial ?? historialVacio())
      setRuta(resultado.ruta)
      setSucio(false)
      setSeleccion(null)
      cargarChat(archivo.mensajesChat)
      await api().guardarAjustes(
        { ...(ajustes ?? (await api().obtenerAjustes())), ultimoProyecto: { ruta: resultado.ruta, id: archivo.proyecto.id } },
        null
      )
    } catch (error) {
      setAviso(`No se pudo abrir el proyecto: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [ajustes])

  const nuevo = useCallback(() => {
    const nombre = `Proyecto ${new Date().toLocaleDateString('es-ES')}`
    cargarChat()
    setProyecto(crearProyectoVacio(nombre))
    setHistorial(historialVacio())
    setRuta(null)
    setSucio(false)
    setSeleccion(null)
    setHallazgos([])
    setResultadoNormalizacion(null)
    setPropuestaEnComparacion(null)
    setVista('actual')
  }, [])

  const importarDrawio = useCallback(async () => {
    try {
      const resultado = await api().importarDrawio()
      if (!resultado) return
      const borrador = resultado.borrador as BorradorProyecto
      const { proyecto: proyectoBase } = borradorAProyecto(borrador, proyectoRef.current.nombre)
      setEstadoBorrador({
        borrador,
        proyectoBase,
        resoluciones: proyectoBase.revision.ambiguidades.map(() => null)
      })
    } catch (error) {
      setAviso(`Importación draw.io fallida: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [])

  const importarImagen = useCallback(async () => {
    try {
      const resultado = await api().importarImagen()
      if (!resultado) return
      const ajustesActuales = ajustes ?? (await api().obtenerAjustes())
      if (ajustesActuales.soloLocal || !ajustesActuales.proveedor.modelo) {
        const borrador: BorradorProyecto = {
          resumen:
            'Imagen cargada como referencia. Sin proveedor de visión configurado no se interpretó automáticamente: reconstruye el diseño manualmente o configura un modelo con visión.',
          procedenciaArchivo: resultado.ruta,
          procedenciaImportador: 'imagen',
          pagina: null,
          entidades: [],
          relaciones: [],
          reglas: [],
          ambiguidades: [
            {
              pregunta: 'La imagen quedó como referencia sin interpretar. ¿Conservarla como desconocida o descartar la importación?',
              tipo: 'ausencia',
              afectaA: null
            }
          ],
          advertencias: ['Interpretación por visión no disponible (modo Solo local o sin modelo).'],
          figurasSinClasificar: [],
          imagenBase64: resultado.base64
        }
        const { proyecto: proyectoBase } = borradorAProyecto(borrador, proyectoRef.current.nombre)
        setEstadoBorrador({ borrador, proyectoBase, resoluciones: proyectoBase.revision.ambiguidades.map(() => null) })
        return
      }
      setEstadoIA((prev) => ({ ...prev, revisando: true, error: null }))
      const interpretacion = await api().interpretarImagen(resultado.base64, resultado.mime)
      const borrador = borradorIABorrador(interpretacion, {
        archivo: resultado.ruta,
        importador: 'imagen',
        imagenBase64: resultado.base64
      })
      const { proyecto: proyectoBase } = borradorAProyecto(borrador, proyectoRef.current.nombre)
      setEstadoBorrador({ borrador, proyectoBase, resoluciones: proyectoBase.revision.ambiguidades.map(() => null) })
      setEstadoIA((prev) => ({ ...prev, revisando: false }))
      void refrescarConsumo()
    } catch (error) {
      setEstadoIA((prev) => ({ ...prev, revisando: false }))
      setAviso(`Importación de imagen fallida: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [ajustes, refrescarConsumo])

  const importarMarkdownFlujo = useCallback(async () => {
    try {
      const resultado = await api().importarMarkdown()
      if (!resultado) return
      const borrador = importarMarkdown(resultado.contenido, resultado.ruta)
      const { proyecto: proyectoBase } = borradorAProyecto(borrador, proyectoRef.current.nombre)
      setEstadoBorrador({ borrador, proyectoBase, resoluciones: proyectoBase.revision.ambiguidades.map(() => null) })
    } catch (error) {
      setAviso(`Importación de Markdown fallida: ${mensajeErrorVisible((error as Error).message)}`)
    }
  }, [])

  const importarProsaIA = useCallback(
    async (contenido: string, nombre: string) => {
      try {
        setEstadoIA((prev) => ({ ...prev, revisando: true, error: null }))
        const interpretacion = await api().interpretarTexto(contenido, nombre)
        const borrador = borradorIABorrador(interpretacion, {
          archivo: nombre,
          importador: 'markdown',
          imagenBase64: null
        })
        const { proyecto: proyectoBase } = borradorAProyecto(borrador, proyectoRef.current.nombre)
        setEstadoBorrador({ borrador, proyectoBase, resoluciones: proyectoBase.revision.ambiguidades.map(() => null) })
        setEstadoIA((prev) => ({ ...prev, revisando: false }))
        void refrescarConsumo()
      } catch (error) {
        setEstadoIA((prev) => ({ ...prev, revisando: false }))
        setAviso(`La interpretación IA falló: ${mensajeErrorVisible((error as Error).message)}`)
      }
    },
    [refrescarConsumo]
  )

  const resolverAmbiguedadBorrador = useCallback<Tienda['resolverAmbiguedadBorrador']>((indice, resolucion) => {
    setEstadoBorrador((prev) => {
      if (!prev) return prev
      const resoluciones = [...prev.resoluciones]
      resoluciones[indice] = resolucion
      return { ...prev, resoluciones }
    })
  }, [])

  const confirmarBorrador = useCallback(() => {
    if (!estadoBorrador) return
    const { proyectoBase, resoluciones } = estadoBorrador
    const ambiguidades = proyectoBase.revision.ambiguidades.map((ambiguedad, i) => ({
      ...ambiguedad,
      resolucion: resoluciones[i] ?? { accion: 'desconocida' }
    }))
    const excluirTodas = resoluciones.every((r) => r === null || r.accion === 'excluir' || r.accion === 'desconocida')
    const confirmado = excluirTodas && ambiguidades.every((a) => a.resolucion !== null)
    const proyectoConfirmado: Proyecto = {
      ...proyectoBase,
      revision: { ...proyectoBase.revision, ambiguidades },
      versionDiseno: proyectoRef.current.versionDiseno + 1,
      actualizadoEn: new Date().toISOString()
    }
    setProyecto(proyectoConfirmado)
    setHistorial((prev) => ({
      ...prev,
      entradas: [
        ...prev.entradas,
        {
          id: nuevoId('h'),
          etiqueta: `Importación confirmada (${estadoBorrador.borrador.procedenciaImportador})`,
          adelante: [],
          atras: [],
          fuente: 'importacion',
          propuestaId: null,
          fecha: new Date().toISOString()
        }
      ]
    }))
    setSucio(true)
    setEstadoBorrador(null)
    setSeleccion(null)
    if (!confirmado) {
      setAviso('Interpretación importada con ambigüedades pendientes. Resuélvelas en el panel Revisión.')
    }
  }, [estadoBorrador])

  const descartarBorrador = useCallback(() => setEstadoBorrador(null), [])

  const confirmarInterpretacion = useCallback(() => {
    setProyecto((prev) => ({
      ...prev,
      revision: { ...prev.revision, interpretacion: 'confirmada' },
      actualizadoEn: new Date().toISOString()
    }))
    setSucio(true)
  }, [])

  const resolverAmbiguedad = useCallback<Tienda['resolverAmbiguedad']>((id, resolucion) => {
    setProyecto((prev) => ({
      ...prev,
      revision: {
        ...prev.revision,
        ambiguidades: prev.revision.ambiguidades.map((a) => (a.id === id ? { ...a, resolucion } : a))
      },
      actualizadoEn: new Date().toISOString()
    }))
    setSucio(true)
  }, [])

  const agregarPropuestaLocal = useCallback<Tienda['agregarPropuestaLocal']>((entrada) => {
    const propuesta = crearPropuesta(proyectoRef.current, entrada)
    setProyecto((prev) => guardarNuevasPropuestas(prev, [propuesta]))
    setSucio(true)
    setSeccionRevision('propuestas')
    setAviso('Propuesta creada desde el análisis local. Revísala en la pestaña Revisión; se aplica solo con tu aprobación.')
  }, [])

  const cancelarRevision = useCallback(() => {
    turnoRevision.current += 1
    revisionEnCurso.current = false
    setEstadoIA(prev => ({ ...prev, revisando: false, error: null }))
    setAviso('Revisión descartada. Su respuesta no se incorporará al proyecto; el proveedor puede seguir procesando la solicitud.')
  }, [])
  const solicitarRevision = useCallback(async () => {
    if (revisionEnCurso.current) return
    revisionEnCurso.current = true
    const turno = ++turnoRevision.current
    const origen = structuredClone(proyectoRef.current)
    const sesion = sesionChat.current
    setAviso(null)
    setPestana('revision')
    setSeccionRevision('propuestas')
    setEstadoIA((prev) => ({ ...prev, revisando: true, error: null }))
    try {
      const solicitud = {
        proyecto: {
          nombre: proyectoRef.current.nombre,
          versionDiseno: proyectoRef.current.versionDiseno,
          diseno: proyectoRef.current.diseno,
          reglas: proyectoRef.current.reglas,
          desconocidos: proyectoRef.current.desconocidos,
          revision: {
            interpretacion: proyectoRef.current.revision.interpretacion,
            ambiguidadesPendientes: proyectoRef.current.revision.ambiguidades.filter((a) => !a.resolucion).length
          }
        },
        historialResumen: historialRef.current.entradas
          .slice(-10)
          .map((e) => e.etiqueta)
          .join(' | ')
      }
      const respuesta = await api().revisar(solicitud)
      if (sesion !== sesionChat.current || turno !== turnoRevision.current) return
      const nuevas: Propuesta[] = respuesta.propuestas.map((entrada) =>
        crearPropuesta(origen, {
          origenIA: respuesta.origen ?? (ajustes ? { proveedor: ajustes.proveedor.proveedor, modelo: ajustes.proveedor.modelo } : undefined),
          categoria: entrada.categoria,
          prioridad: entrada.prioridad,
          titulo: entrada.titulo,
          explicacion: entrada.explicacion,
          fundamento: entrada.fundamento,
          supuestos: entrada.supuestos,
          preguntas: entrada.preguntas,
          operaciones: entrada.operaciones as Operacion[],
          resultado: entrada.resultado,
          contrapartidas: entrada.contrapartidas,
          dependeDe: entrada.dependeDe
        })
      )
      setProyecto((prev) => marcarDesactualizadas(guardarNuevasPropuestas(prev, nuevas)))
      setMensajesChat((prev) => [
        ...prev,
        {
          rol: 'asistente',
          contenido: `Revisión terminada: ${respuesta.resumen || 'sin resumen.'}\nPropuestas generadas: ${nuevas.length}. Revisa la pestaña Revisión; ninguna se aplica sin tu aprobación.`,
          fecha: new Date().toISOString()
        }
      ])
      setAviso(`Revisión terminada: ${nuevas.length} propuesta(s). Ningún cambio se aplicó automáticamente.`)
      setSucio(true)
      setEstadoIA((prev) => ({ ...prev, revisando: false }))
      void refrescarConsumo()
    } catch (error) {
      if (sesion !== sesionChat.current || turno !== turnoRevision.current) return
      setEstadoIA((prev) => ({ ...prev, revisando: false, error: mensajeErrorVisible((error as Error).message) }))
      setMensajesChat((prev) => [
        ...prev,
        {
          rol: 'sistema',
          contenido: `La revisión falló: ${mensajeErrorVisible((error as Error).message)}. El diseño permanece editable; puedes reintentar.`,
          fecha: new Date().toISOString()
        }
      ])
    } finally {
      if (turno === turnoRevision.current) revisionEnCurso.current = false
    }
  }, [refrescarConsumo, ajustes])

  const aceptarPropuesta = useCallback((id: string, riesgosRevisados = false) => {
    const propuesta = proyectoRef.current.propuestas.find((p) => p.id === id)
    if (!propuesta) return
    const resultado = aplicarPropuesta(proyectoRef.current, historialRef.current, propuesta, riesgosRevisados)
    if (!resultado.ok) {
      setAviso(`No se pudo aplicar la propuesta: ${resultado.motivos.join(' ')}`)
      return
    }
    setProyecto(marcarDesactualizadas(resultado.proyecto))
    setHistorial(resultado.historial)
    setVista('actual')
    setPropuestaEnComparacion(null)
    setSucio(true)
    setAviso(propuesta.operaciones.length ? `Propuesta aplicada: «${propuesta.titulo}». Puedes deshacerla con Ctrl+Z.` : `Aclaración revisada: «${propuesta.titulo}». El diseño no cambió.`)
  }, [])

  const rechazarPropuestaCallback = useCallback((id: string, nota: string | null) => {
    setProyecto((prev) => rechazarPropuesta(prev, id, nota))
    setSucio(true)
  }, [])

  const discutirPropuesta = useCallback(async (id: string, texto: string) => {
    const sesion = sesionChat.current
    const propuesta = proyectoRef.current.propuestas.find((p) => p.id === id)
    if (!propuesta) return
    const mensajeUsuario: MensajeChat = {
      rol: 'usuario',
      contenido: texto,
      propuestaId: id,
      fecha: new Date().toISOString()
    }
    setMensajesChat((prev) => [...prev, mensajeUsuario])
    setEstadoIA((prev) => ({ ...prev, chateando: true, error: null }))
    try {
      const respuesta = await api().chatear({
        mensajes: [...mensajesChat, mensajeUsuario]
          .filter((m) => m.rol !== 'sistema')
          .slice(-12)
          .map((m) => ({ rol: m.rol, contenido: m.contenido })),
        proyecto: {
          diseno: proyectoRef.current.diseno,
          reglas: proyectoRef.current.reglas,
          versionDiseno: proyectoRef.current.versionDiseno
        },
        propuestaContexto: propuesta
      })
      if (sesion !== sesionChat.current) return
      setMensajesChat((prev) => [
        ...prev,
        {
          rol: 'asistente',
          contenido: respuesta.contenido,
          propuestaId: id,
          fecha: new Date().toISOString()
        }
      ])
      setEstadoIA((prev) => ({ ...prev, chateando: false }))
      void refrescarConsumo()
    } catch (error) {
      if (sesion !== sesionChat.current) return
      setEstadoIA((prev) => ({ ...prev, chateando: false, error: mensajeErrorVisible((error as Error).message) }))
      setMensajesChat((prev) => [
        ...prev,
        {
          rol: 'sistema',
          contenido: `El proveedor falló: ${mensajeErrorVisible((error as Error).message)}`,
          fecha: new Date().toISOString()
        }
      ])
    }
  }, [mensajesChat, refrescarConsumo])

  const chatear = useCallback(
    async (texto: string) => {
      const sesion = sesionChat.current
      const mensaje: MensajeChat = { rol: 'usuario', contenido: texto, fecha: new Date().toISOString() }
      const siguiente = [...mensajesChat, mensaje]
      setMensajesChat(siguiente)
      setEstadoIA((prev) => ({ ...prev, chateando: true, error: null }))
      try {
        const respuesta = await api().chatear({
          mensajes: siguiente
            .filter((m) => m.rol !== 'sistema')
            .slice(-12)
            .map((m) => ({ rol: m.rol, contenido: m.contenido })),
          proyecto: {
            diseno: proyectoRef.current.diseno,
            reglas: proyectoRef.current.reglas,
            desconocidos: proyectoRef.current.desconocidos,
            versionDiseno: proyectoRef.current.versionDiseno
          }
        })
        if (sesion !== sesionChat.current) return
        setMensajesChat((prev) => [
          ...prev,
          { rol: 'asistente', contenido: respuesta.contenido, fecha: new Date().toISOString() }
        ])
        setEstadoIA((prev) => ({ ...prev, chateando: false }))
        void refrescarConsumo()
      } catch (error) {
        if (sesion !== sesionChat.current) return
        setEstadoIA((prev) => ({ ...prev, chateando: false, error: mensajeErrorVisible((error as Error).message) }))
        setMensajesChat((prev) => [
          ...prev,
          {
            rol: 'sistema',
            contenido: `El proveedor falló: ${mensajeErrorVisible((error as Error).message)}`,
            fecha: new Date().toISOString()
          }
        ])
      }
    },
    [mensajesChat, refrescarConsumo]
  )

  const analizar = useCallback(() => {
    const hallazgosLocales = validarProyecto(proyectoRef.current)
    const normalizacion = analizarNormalizacion(proyectoRef.current)
    setHallazgos(hallazgosLocales)
    setResultadoNormalizacion(normalizacion)
    setSeccionRevision('reglas')
    setPestana('revision')
  }, [])

  const recargarAjustes = useCallback(async () => {
    const config = await api().obtenerAjustes()
    setAjustes(config)
    return config
  }, [])

  const guardarAjustes = useCallback(async (config: Configuracion, claveNueva: string | null) => {
    const guardados = await api().guardarAjustes(config, claveNueva)
    setAjustes(guardados)
  }, [])

  const probarConexion = useCallback(async () => {
    const resultado = await api().probarConexion()
    setAviso(resultado.ok ? `Conexión correcta. ${resultado.detalle}` : `Fallo de conexión: ${resultado.detalle}`)
    return resultado
  }, [])

  const restaurarRecuperacion = useCallback((proyectoRecuperado: Proyecto, historialRecuperado: Historial) => {
    cargarChat(recuperacionPendiente?.mensajesChat)
    setProyecto(proyectoRecuperado)
    setHistorial(historialRecuperado)
    setSucio(true)
    setRecuperacionPendiente(null)
    setAviso('Se restauró la copia de recuperación.')
  }, [recuperacionPendiente, cargarChat])

  const descartarRecuperacion = useCallback(async () => {
    if (recuperacionPendiente) {
      await api().borrarRecuperacion(recuperacionPendiente.proyecto.id)
    }
    setRecuperacionPendiente(null)
  }, [recuperacionPendiente])

  const crearEntidadEn = useCallback(
    (x: number, y: number) => {
      const numero = proyectoRef.current.diseno.entidades.length + 1
      const entidad = crearEntidad(`Entidad ${numero}`, x, y)
      aplicar([{ op: 'addEntidad', entidad }], { etiqueta: `Crear entidad «${entidad.nombre}»` })
      setSeleccion({ tipo: 'entidad', id: entidad.id })
      setPestana('propiedades')
    },
    [aplicar]
  )

  const conectarEntidades = useCallback(
    (a: string, b: string) => {
      const relacion = crearRelacion(a, b)
      aplicar([{ op: 'addRelacion', relacion }], { etiqueta: 'Crear relación' })
      setSeleccion({ tipo: 'relacion', id: relacion.id })
      setPestana('propiedades')
      setEntidadOrigenRelacion(null)
    },
    [aplicar]
  )

  const crearNotaEn = useCallback(
    (x: number, y: number) => {
      const nota = crearNota('Nota', x, y)
      aplicar([{ op: 'addNota', nota }], { etiqueta: 'Añadir nota' })
      setSeleccion({ tipo: 'nota', id: nota.id })
      setPestana('propiedades')
    },
    [aplicar]
  )

  const eliminarSeleccion = useCallback(() => {
    if (!seleccion) return
    if (seleccion.tipo === 'entidad') {
      aplicar([{ op: 'removeEntidad', id: seleccion.id }], { etiqueta: 'Eliminar entidad' })
    } else if (seleccion.tipo === 'relacion') {
      aplicar([{ op: 'removeRelacion', id: seleccion.id }], { etiqueta: 'Eliminar relación' })
    } else if (seleccion.tipo === 'nota') {
      aplicar([{ op: 'removeNota', id: seleccion.id }], { etiqueta: 'Eliminar nota' })
    }
    setSeleccion(null)
  }, [aplicar, seleccion])

  const actualizarPropuesta = useCallback<Tienda['actualizarPropuesta']>((id, parche) => {
    setProyecto((prev) => ({
      ...prev,
      propuestas: prev.propuestas.map((p) => (p.id === id ? { ...p, ...parche } : p))
    }))
    setSucio(true)
  }, [])

  // arranque: ajustes, último proyecto y recuperación
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const config = await api().obtenerAjustes()
      if (cancelado) return
      setAjustes(config)
      void refrescarConsumo()
      let idRecuperacion = proyectoRef.current.id
      if (config.ultimoProyecto?.ruta) {
        const resultado = await api().abrirProyectoRuta(config.ultimoProyecto.ruta)
        if (!cancelado && resultado.archivo) {
          const archivo = resultado.archivo as { proyecto: Proyecto; historial: Historial; mensajesChat?: MensajeChat[] }
          cargarChat(archivo.mensajesChat)
          setProyecto(archivo.proyecto)
          setHistorial(archivo.historial ?? historialVacio())
          setRuta(resultado.ruta ?? null)
          idRecuperacion = archivo.proyecto.id
        }
      }
      if (cancelado) return
      const info = await api().leerRecuperacion(idRecuperacion)
      if (cancelado || !info.disponible || !info.proyecto) return
      setRecuperacionPendiente({
        fecha: info.fecha ?? '',
        proyecto: info.proyecto as Proyecto,
        historial: (info.historial as Historial) ?? historialVacio(),
        mensajesChat: info.mensajesChat
      })
    })()
    return () => {
      cancelado = true
    }
  }, [])

  // recuperación periódica
  useEffect(() => {
    if (!sucio) return
    const temporizador = setTimeout(() => {
      void api().escribirRecuperacion(proyecto.id, empaquetar())
    }, 3000)
    return () => clearTimeout(temporizador)
  }, [sucio, proyecto, versionChat, empaquetar])

  // atajos de teclado globales
  useEffect(() => {
    const manejador = (evento: KeyboardEvent) => {
      const destino = evento.target as HTMLElement
      const escribiendo =
        destino.tagName === 'INPUT' || destino.tagName === 'TEXTAREA' || destino.isContentEditable
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'z' && !escribiendo) {
        evento.preventDefault()
        deshacer()
      } else if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'y' && !escribiendo) {
        evento.preventDefault()
        rehacer()
      } else if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault()
        void (evento.shiftKey ? guardarComo() : guardar())
      } else if (evento.key === 'Escape') {
        setEntidadOrigenRelacion(null)
        setHerramienta('seleccion')
      } else if ((evento.key === 'Delete' || evento.key === 'Supr') && !escribiendo) {
        eliminarSeleccion()
      }
    }
    window.addEventListener('keydown', manejador)
    return () => window.removeEventListener('keydown', manejador)
  }, [deshacer, rehacer, guardar, guardarComo, eliminarSeleccion])

  // menú nativo
  useEffect(() => {
    const apiPreload = api()
    const suscripciones = [
      apiPreload.onMenu('menu:nuevo', nuevo),
      apiPreload.onMenu('menu:abrir', () => void abrir()),
      apiPreload.onMenu('menu:guardar', () => void guardar()),
      apiPreload.onMenu('menu:guardar-como', () => void guardarComo()),
      apiPreload.onMenu('menu:deshacer', deshacer),
      apiPreload.onMenu('menu:rehacer', rehacer),
      apiPreload.onMenu('menu:importar-drawio', () => void importarDrawio()),
      apiPreload.onMenu('menu:importar-imagen', () => void importarImagen()),
      apiPreload.onMenu('menu:importar-markdown', () => void importarMarkdownFlujo()),
      apiPreload.onMenu('menu:revisar-reglas', analizar),
      apiPreload.onMenu('menu:revisar', () => void solicitarRevision()),
      apiPreload.onMenu('menu:configuracion', () => setMostrarConfiguracion(true)),
      apiPreload.onMenu('menu:recuperacion', () => setMostrarHistorial(true))
    ]
    return () => suscripciones.forEach((s) => s())
  }, [nuevo, abrir, guardar, guardarComo, deshacer, rehacer, importarDrawio, importarImagen, importarMarkdownFlujo, solicitarRevision, analizar])

  const valor = useMemo<Tienda>(
    () => ({
      proyecto,
      historial,
      ruta,
      sucio,
      seleccion,
      herramienta,
      pestana,
      panelAbierto,
      setPanelAbierto,
      vista,
      propuestaEnComparacion,
      mensajesChat,
      sesionChat: sesionChat.current,
      estadoIA,
      hallazgos,
      resultadoNormalizacion,
      ajustes,
      consumo,
      borradorImportacion: estadoBorrador?.borrador ?? null,
      ambiguidadesBorrador: (estadoBorrador?.proyectoBase.revision.ambiguidades ?? []).map(
        (ambiguedad, i) => ({
          ...ambiguedad,
          resolucion: estadoBorrador?.resoluciones[i] ?? null
        })
      ),
      mostrarConfiguracion,
      mostrarHistorial,
      aviso,
      entidadOrigenRelacion,
      setEntidadOrigenRelacion,
      aplicar,
      deshacer,
      rehacer,
      seleccionar: setSeleccion,
      setHerramienta,
      setPestana,
      setVista,
      setPropuestaEnComparacion,
      crearEntidadEn,
      conectarEntidades,
      crearNotaEn,
      eliminarSeleccion,
      guardar,
      guardarComo,
      abrir,
      nuevo,
      renombrarProyecto,
      importarDrawio,
      importarImagen,
      importarMarkdown: importarMarkdownFlujo,
      importarProsaIA,
      confirmarBorrador,
      descartarBorrador,
      resolverAmbiguedadBorrador,
      confirmarInterpretacion,
      resolverAmbiguedad,
      agregarPropuestaLocal,
      solicitarRevision,
      cancelarRevision,
      aceptarPropuesta,
      rechazarPropuesta: rechazarPropuestaCallback,
      discutirPropuesta,
      chatear,
      analizar,
      seccionRevision,
      setSeccionRevision,
      setMostrarConfiguracion,
      setMostrarHistorial,
      setAviso,
      guardarAjustes,
      recargarAjustes,
      probarConexion,
      refrescarConsumo,
      limpiarConsumo,
      restaurarRecuperacion,
      descartarRecuperacion,
      recuperacionPendiente,
      actualizarPropuesta
    }),
    [
      proyecto,
      historial,
      ruta,
      sucio,
      seleccion,
      herramienta,
      pestana,
      panelAbierto,
      setPanelAbierto,
      vista,
      propuestaEnComparacion,
      mensajesChat,
      estadoIA,
      hallazgos,
      resultadoNormalizacion,
      ajustes,
      consumo,
      estadoBorrador,
      mostrarConfiguracion,
      mostrarHistorial,
      aviso,
      entidadOrigenRelacion,
      aplicar,
      deshacer,
      rehacer,
      crearEntidadEn,
      conectarEntidades,
      crearNotaEn,
      eliminarSeleccion,
      guardar,
      guardarComo,
      abrir,
      nuevo,
      renombrarProyecto,
      importarDrawio,
      importarImagen,
      importarMarkdownFlujo,
      importarProsaIA,
      confirmarBorrador,
      descartarBorrador,
      resolverAmbiguedadBorrador,
      confirmarInterpretacion,
      resolverAmbiguedad,
      agregarPropuestaLocal,
      solicitarRevision,
      cancelarRevision,
      aceptarPropuesta,
      rechazarPropuestaCallback,
      discutirPropuesta,
      chatear,
      analizar,
      seccionRevision,
      setSeccionRevision,
      guardarAjustes,
      recargarAjustes,
      probarConexion,
      refrescarConsumo,
      limpiarConsumo,
      restaurarRecuperacion,
      descartarRecuperacion,
      recuperacionPendiente,
      actualizarPropuesta
    ]
  )

  return <ContextoTienda.Provider value={valor}>{children}</ContextoTienda.Provider>
}

export function useTienda(): Tienda {
  const contexto = useContext(ContextoTienda)
  if (!contexto) throw new Error('useTienda fuera del proveedor')
  return contexto
}

export function usePuedeDeshacer(): boolean {
  const { historial } = useTienda()
  return estadoPuedeDeshacer(historial)
}

export function usePuedeRehacer(): boolean {
  const { historial } = useTienda()
  return estadoPuedeRehacer(historial)
}
