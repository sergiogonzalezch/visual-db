import { BorradorAtributo, BorradorProyecto } from './borrador'

interface Linea {
  texto: string
  numero: number
}

export function importarMarkdown(contenido: string, nombreArchivo: string): BorradorProyecto {
  const lineas: Linea[] = contenido.split(/\r?\n/).map((texto, i) => ({ texto, numero: i + 1 }))
  const entidades: BorradorProyecto['entidades'] = []
  const relaciones: BorradorProyecto['relaciones'] = []
  const reglas: BorradorProyecto['reglas'] = []
  const ambiguidades: BorradorProyecto['ambiguidades'] = []
  const advertencias: string[] = []
  const prosaPendiente: Linea[] = []

  let entidadActual: BorradorProyecto['entidades'][number] | null = null
  let indiceEntidad = 0

  const nuevaEntidad = (nombre: string): BorradorProyecto['entidades'][number] => {
    const entidad = {
      nombre,
      x: 60 + (indiceEntidad % 4) * 280,
      y: 60 + Math.floor(indiceEntidad / 4) * 220,
      atributos: [] as BorradorAtributo[]
    }
    indiceEntidad++
    entidades.push(entidad)
    return entidad
  }

  const parsearAtributoLinea = (texto: string): BorradorAtributo | null => {
    let limpio = texto.trim().replace(/^[-*+]\s*/, '')
    if (!limpio) return null
    let clave: BorradorAtributo['clave'] = 'ninguna'
    if (/\bPK\b|clave primaria|primaria\b/i.test(limpio)) clave = 'primaria'
    else if (/\bFK\b|for[aá]nea/i.test(limpio)) clave = 'foranea'
    else if (/\bUK\b|\bAK\b|candidata/i.test(limpio)) clave = 'candidata'
    limpio = limpio
      .replace(/\b(PK|FK|UK|AK)\b/gi, '')
      .replace(/\((clave primaria|for[aá]nea|candidata|PK|FK|UK|AK)\)/gi, '')
      .replace(/[*:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const nombre = limpio.split(/[,(]/)[0].trim()
    if (!nombre || nombre.length > 60) return null
    return { nombre, clave }
  }

  const parsearCardinalidad = (texto: string): { origen: string | null; destino: string | null } => {
    const coincidencias = texto.match(/(0\.\.1|0\.\.n|0\.\.\*|1\.\.n|1\.\.\*|\b1\b|\bn\b|\bN\b|\*)/g)
    if (!coincidencias || coincidencias.length === 0) return { origen: null, destino: null }
    return {
      origen: coincidencias[0] ?? null,
      destino: coincidencias[coincidencias.length - 1] ?? null
    }
  }

  let i = 0
  while (i < lineas.length) {
    const linea = lineas[i]
    const texto = linea.texto.trim()

    if (!texto) {
      i++
      continue
    }

    const encabezado = texto.match(/^#{1,3}\s+(.+)$/)
    if (encabezado) {
      const nombre = encabezado[1].replace(/[*_`]/g, '').trim()
      const esSeccionRelacional = /relaci[oó]n|relationship|dependencia|regla|reglas|notas?\b/i.test(nombre)
      if (esSeccionRelacional) {
        entidadActual = null
      } else {
        entidadActual = nuevaEntidad(nombre)
      }
      i++
      continue
    }

    if (texto.startsWith('|')) {
      const filas: { celdas: string[]; cruda: string }[] = []
      while (i < lineas.length && lineas[i].texto.trim().startsWith('|')) {
        const cruda = lineas[i].texto.trim()
        const celdas = cruda.split('|').map((c) => c.trim()).filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length - 1)))
        if (!/^[-:\s|]+$/.test(cruda)) filas.push({ celdas, cruda })
        i++
      }
      if (filas.length >= 2) {
        const encabezadoTabla = filas[0].celdas
        const nombreEntidad = entidadActual?.nombre ?? entidades[entidades.length - 1]?.nombre
        const entidad = entidadActual ?? entidades[entidades.length - 1] ?? nuevaEntidad(nombreEntidad ?? `Tabla${entidades.length + 1}`)
        entidadActual = entidad
        for (let f = 1; f < filas.length; f++) {
          const primeraCelda = filas[f].celdas[0] ?? ''
          if (!primeraCelda) continue
          let clave: BorradorAtributo['clave'] = 'ninguna'
          const filaCompleta = filas[f].celdas.join(' ')
          if (/\bPK\b|clave primaria/i.test(filaCompleta)) clave = 'primaria'
          else if (/\bFK\b|for[aá]nea/i.test(filaCompleta)) clave = 'foranea'
          else if (/\bUK\b|candidata/i.test(filaCompleta)) clave = 'candidata'
          const nombre = primeraCelda.replace(/\b(PK|FK|UK|AK)\b/gi, '').replace(/[*`]/g, '').trim()
          if (nombre && !entidad.atributos.some((a) => a.nombre.toLowerCase() === nombre.toLowerCase())) {
            entidad.atributos.push({ nombre, clave })
          }
        }
        void encabezadoTabla
        continue
      }
      continue
    }

    const relacion = texto.match(
      /^(?:relaci[oó]n\s*:\s*)?([A-Za-zÁÉÍÓÚÑáéíóúñ0-9_ ]{2,60}?)\s*(?:─+|—+|-{2,}>|<-{2,}-|->|←|→|↔|,)\s*(?:\(([^)]+)\)\s*)?([A-Za-zÁÉÍÓÚÑáéíóúñ0-9_ ]{2,60})?$/
    )
    const relacionExplicita = texto.match(/^relaci[oó]n\s*:\s*(.+?)\s+(?:1\.\.|0\.\.|\bn\b|\bN\b|\*)/i)
    if (relacionExplicita || (relacion && entidadActual === null && !texto.startsWith('-'))) {
      const fuente = texto.replace(/^relaci[oó]n\s*:\s*/i, '')
      const flecha = fuente.match(/^(.+?)\s*(?:→|<-|->|—|--|<|>)\s*(?:\(([^)]+)\)\s*)?(.+)$/)
      const lineal = fuente.match(/^(.+?)\s+((?:[01]\.\.)?[01nN*])\s+(.+)$/)
      const partes = flecha ?? lineal
      if (partes) {
        const card = parsearCardinalidad(partes[2] ?? '')
        relaciones.push({
          origenNombre: partes[1].trim(),
          destinoNombre: partes[3].trim(),
          etiqueta: null,
          cardOrigen: card.origen,
          cardDestino: card.destino
        })
        i++
        continue
      }
    }

    const lista = texto.match(/^[-*+]\s+(.+)$/)
    if (lista && entidadActual) {
      const atributo = parsearAtributoLinea(lista[1])
      if (atributo && !entidadActual.atributos.some((a) => a.nombre.toLowerCase() === atributo.nombre.toLowerCase())) {
        entidadActual.atributos.push(atributo)
      } else if (!atributo && /depende|determina|→|->/i.test(lista[1])) {
        reglas.push({ texto: lista[1].trim(), fragmento: `Línea ${linea.numero}` })
      } else if (!atributo) {
        prosaPendiente.push({ texto: lista[1].trim(), numero: linea.numero })
      }
      i++
      continue
    }

    const regla = texto.match(/^(?:regla|reglas|dependencia(?:\s+funcional)?)\s*:\s*(.+)$/i)
    if (regla) {
      reglas.push({ texto: regla[1].trim(), fragmento: `Línea ${linea.numero}` })
      i++
      continue
    }

    const inline = texto.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9_ ]{1,40})\s*:\s*(.+)$/)
    if (inline && entidadActual === null && !/^(error|nota|aviso|tip|ejemplo)\b/i.test(inline[1])) {
      const entidad = nuevaEntidad(inline[1].trim())
      const atributos = inline[2].split(',')
      for (const parte of atributos) {
        const atributo = parsearAtributoLinea(parte)
        if (atributo) entidad.atributos.push(atributo)
      }
      i++
      continue
    }

    if (/^[.#]/.test(texto) === false && texto.length > 40) {
      prosaPendiente.push({ texto, numero: linea.numero })
    } else if (texto.length > 0) {
      prosaPendiente.push({ texto, numero: linea.numero })
    }
    i++
  }

  if (prosaPendiente.length > 0) {
    ambiguidades.push({
      tipo: 'semantica',
      pregunta: `${prosaPendiente.length} fragmento(s) de prosa no se pudieron interpretar de forma determinista (Líneas ${prosaPendiente.slice(0, 3).map((p) => p.numero).join(', ')}${prosaPendiente.length > 3 ? '…' : ''}). ¿Interpretarlos con IA o conservarlos como desconocidos?`,
      afectaA: null
    })
  }

  for (const entidad of entidades) {
    if (entidad.atributos.length === 0) {
      advertencias.push(`La sección «${entidad.nombre}» no produjo atributos reconocibles.`)
    }
  }

  const resumenParts = [`${entidades.length} entidad(es)`, `${relaciones.length} relación(es)`, `${reglas.length} regla(s)`]
  if (prosaPendiente.length > 0) resumenParts.push(`${prosaPendiente.length} fragmento(s) de prosa pendientes`)

  const borrador: BorradorProyecto = {
    resumen: resumenParts.join('; ') + '.',
    procedenciaArchivo: nombreArchivo,
    procedenciaImportador: 'markdown',
    pagina: null,
    entidades,
    relaciones,
    reglas,
    ambiguidades,
    advertencias,
    figurasSinClasificar: [],
    imagenBase64: null
  }
  ;(borrador as BorradorProyecto & { prosa?: string }).prosa = prosaPendiente.map((p) => `L${p.numero}: ${p.texto}`).join('\n')
  return borrador
}
