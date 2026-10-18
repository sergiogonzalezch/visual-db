import { Proyecto } from './modelo'
import { Historial, editar } from './historial'
import { Operacion } from './operaciones'
import {
  Propuesta,
  afectadosDeOperaciones,
  comprobarPropuesta
} from './propuestas'
import { validarProyecto } from './validacion'

export interface ResultadoAplicacion {
  ok: boolean
  proyecto: Proyecto
  historial: Historial
  motivos: string[]
}

export function aplicarPropuesta(
  proyecto: Proyecto,
  historial: Historial,
  propuesta: Propuesta
): ResultadoAplicacion {
  const comprobacion = comprobarPropuesta(proyecto, propuesta)
  if (!comprobacion.aplicable) {
    return {
      ok: false,
      proyecto,
      historial,
      motivos: comprobacion.motivos
    }
  }

  let resultado
  try {
    resultado = editar(
      { diseno: proyecto.diseno, reglas: proyecto.reglas },
      historial,
      propuesta.operaciones,
      {
        etiqueta: `Propuesta: ${propuesta.titulo}`,
        fuente: 'propuesta',
        propuestaId: propuesta.id
      }
    )
  } catch (error) {
    return {
      ok: false,
      proyecto,
      historial,
      motivos: [`Las operaciones de la propuesta no son aplicables al diseño actual: ${(error as Error).message}`]
    }
  }

  const errores = validarProyecto({
    ...proyecto,
    diseno: resultado.estado.diseno,
    reglas: resultado.estado.reglas
  }).filter((f) => f.severidad === 'error')
  if (errores.length > 0) {
    return {
      ok: false,
      proyecto,
      historial,
      motivos: ['La propuesta produjo errores de integridad: ', ...errores.map((e) => e.mensaje)]
    }
  }

  const versionDiseno = proyecto.versionDiseno + 1
  const ahora = new Date().toISOString()
  const propuestas = proyecto.propuestas.map((p) =>
    p.id === propuesta.id
      ? { ...p, estado: 'aplicada' as const, decididaEn: ahora }
      : p
  )

  const proyectoPosterior: Proyecto = {
    ...proyecto,
    diseno: resultado.estado.diseno,
    reglas: resultado.estado.reglas,
    versionDiseno,
    propuestas,
    actualizadoEn: ahora
  }

  return { ok: true, proyecto: proyectoPosterior, historial: resultado.historial, motivos: [] }
}

export function rechazarPropuesta(proyecto: Proyecto, propuestaId: string, nota: string | null): Proyecto {
  const ahora = new Date().toISOString()
  return {
    ...proyecto,
    propuestas: proyecto.propuestas.map((p) =>
      p.id === propuestaId
        ? { ...p, estado: 'rechazada' as const, decididaEn: ahora, notaDecision: nota }
        : p
    ),
    actualizadoEn: ahora
  }
}

export function marcarDesactualizadas(proyecto: Proyecto): Proyecto {
  let cambio = false
  const propuestas = proyecto.propuestas.map((p) => {
    if (p.estado !== 'pendiente') return p
    const comprobacion = comprobarPropuesta(proyecto, p)
    if (comprobacion.aplicable) return p
    const tocaDiseno = comprobacion.motivos.some((m) => m.includes('cambió') || m.includes('ya no existe'))
    if (!tocaDiseno) return p
    cambio = true
    return { ...p, estado: 'desactualizada' as const }
  })
  if (!cambio) return proyecto
  return { ...proyecto, propuestas }
}

export function crearPropuesta(
  proyecto: Proyecto,
  datos: Omit<Propuesta, 'id' | 'versionOrigen' | 'afectados' | 'estado' | 'creadaEn' | 'decididaEn' | 'notaDecision' | 'version'>
): Propuesta {
  return {
    ...datos,
    id: `prop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    versionOrigen: proyecto.versionDiseno,
    afectados: afectadosDeOperaciones(datos.operaciones, proyecto.diseno, proyecto.reglas),
    version: 1,
    estado: 'pendiente',
    creadaEn: new Date().toISOString(),
    decididaEn: null,
    notaDecision: null
  }
}

export function reabrirPropuesta(
  proyecto: Proyecto,
  propuestaId: string,
  operaciones: Operacion[],
  extras: Partial<Pick<Propuesta, 'explicacion' | 'fundamento' | 'supuestos' | 'preguntas' | 'resultado' | 'contrapartidas' | 'titulo'>>
): Proyecto {
  const ahora = new Date().toISOString()
  return {
    ...proyecto,
    propuestas: proyecto.propuestas.map((p) => {
      if (p.id !== propuestaId) return p
      return {
        ...p,
        ...extras,
        operaciones,
        afectados: afectadosDeOperaciones(operaciones, proyecto.diseno, proyecto.reglas),
        versionOrigen: proyecto.versionDiseno,
        version: p.version + 1,
        estado: 'pendiente' as const,
        decididaEn: null,
        notaDecision: null
      }
    }),
    actualizadoEn: ahora
  }
}

export function versionDePropuesta(proyecto: Proyecto, propuestaId: string): Propuesta | undefined {
  return proyecto.propuestas.find((p) => p.id === propuestaId)
}

export function guardarNuevasPropuestas(proyecto: Proyecto, nuevas: Propuesta[]): Proyecto {
  return { ...proyecto, propuestas: [...proyecto.propuestas, ...nuevas], actualizadoEn: new Date().toISOString() }
}
