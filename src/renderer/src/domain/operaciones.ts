import {
  Atributo,
  Clave,
  Diseno,
  Entidad,
  Nota,
  ReglaNegocio,
  Relacion,
  clonarDiseno,
  hallarEntidad,
  hallarRelacion
} from './modelo'

export type Operacion =
  | { op: 'addEntidad'; entidad: Entidad }
  | { op: 'updateEntidad'; id: string; parche: Partial<Pick<Entidad, 'nombre' | 'descripcion'>> }
  | { op: 'moverEntidad'; id: string; x: number; y: number }
  | { op: 'redimensionarEntidad'; id: string; ancho: number; alto: number }
  | { op: 'removeEntidad'; id: string }
  | { op: 'addAtributo'; entidadId: string; atributo: Atributo }
  | {
      op: 'updateAtributo'
      entidadId: string
      id: string
      parche: Partial<Omit<Atributo, 'id'>>
    }
  | { op: 'removeAtributo'; entidadId: string; id: string }
  | { op: 'addClave'; entidadId: string; clave: Clave }
  | { op: 'updateClave'; entidadId: string; id: string; parche: Partial<Omit<Clave, 'id'>> }
  | { op: 'removeClave'; entidadId: string; id: string }
  | { op: 'addRelacion'; relacion: Relacion }
  | {
      op: 'updateRelacion'
      id: string
      parche: Partial<Pick<Relacion, 'nombre' | 'inicio' | 'fin'>>
    }
  | { op: 'removeRelacion'; id: string }
  | { op: 'addAtributoRelacion'; relacionId: string; atributo: Atributo }
  | {
      op: 'updateAtributoRelacion'
      relacionId: string
      id: string
      parche: Partial<Omit<Atributo, 'id'>>
    }
  | { op: 'removeAtributoRelacion'; relacionId: string; id: string }
  | { op: 'addNota'; nota: Nota }
  | { op: 'updateNota'; id: string; parche: Partial<Pick<Nota, 'texto' | 'x' | 'y' | 'ancho' | 'alto'>> }
  | { op: 'removeNota'; id: string }
  | { op: 'addRegla'; regla: ReglaNegocio }
  | { op: 'updateRegla'; id: string; parche: Partial<Omit<ReglaNegocio, 'id'>> }
  | { op: 'removeRegla'; id: string }

export interface DisenoConReglas {
  diseno: Diseno
  reglas: ReglaNegocio[]
}

function exigirEntidad(diseno: Diseno, id: string): Entidad {
  const entidad = hallarEntidad(diseno, id)
  if (!entidad) throw new Error(`Entidad no encontrada: ${id}`)
  return entidad
}

function exigirRelacion(diseno: Diseno, id: string): Relacion {
  const relacion = hallarRelacion(diseno, id)
  if (!relacion) throw new Error(`Relación no encontrada: ${id}`)
  return relacion
}

export function aplicarOperacion(estado: DisenoConReglas, operacion: Operacion): DisenoConReglas {
  const diseno = clonarDiseno(estado.diseno)
  const reglas = structuredClone(estado.reglas)

  switch (operacion.op) {
    case 'addEntidad': {
      diseno.entidades.push(structuredClone(operacion.entidad))
      break
    }
    case 'updateEntidad': {
      const entidad = exigirEntidad(diseno, operacion.id)
      Object.assign(entidad, structuredClone(operacion.parche))
      break
    }
    case 'moverEntidad': {
      const entidad = exigirEntidad(diseno, operacion.id)
      entidad.x = operacion.x
      entidad.y = operacion.y
      break
    }
    case 'redimensionarEntidad': {
      const entidad = exigirEntidad(diseno, operacion.id)
      entidad.ancho = Math.max(140, operacion.ancho)
      entidad.alto = Math.max(60, operacion.alto)
      break
    }
    case 'removeEntidad': {
      exigirEntidad(diseno, operacion.id)
      diseno.entidades = diseno.entidades.filter((e) => e.id !== operacion.id)
      diseno.relaciones = diseno.relaciones.filter(
        (r) => r.inicio.entidadId !== operacion.id && r.fin.entidadId !== operacion.id
      )
      for (let i = reglas.length - 1; i >= 0; i--) {
        if (reglas[i].dependencia?.entidadId === operacion.id) reglas.splice(i, 1)
      }
      break
    }
    case 'addAtributo': {
      exigirEntidad(diseno, operacion.entidadId).atributos.push(structuredClone(operacion.atributo))
      break
    }
    case 'updateAtributo': {
      const entidad = exigirEntidad(diseno, operacion.entidadId)
      const atributo = entidad.atributos.find((a) => a.id === operacion.id)
      if (!atributo) throw new Error(`Atributo no encontrado: ${operacion.id}`)
      Object.assign(atributo, structuredClone(operacion.parche))
      break
    }
    case 'removeAtributo': {
      const entidad = exigirEntidad(diseno, operacion.entidadId)
      entidad.atributos = entidad.atributos.filter((a) => a.id !== operacion.id)
      for (const clave of entidad.claves) {
        clave.atributoIds = clave.atributoIds.filter((id) => id !== operacion.id)
      }
      entidad.claves = entidad.claves.filter((c) => c.atributoIds.length > 0)
      for (const regla of reglas) {
        if (regla.dependencia?.entidadId !== entidad.id) continue
        regla.dependencia.determinanteIds = regla.dependencia.determinanteIds.filter(
          (id) => id !== operacion.id
        )
        regla.dependencia.dependientesIds = regla.dependencia.dependientesIds.filter(
          (id) => id !== operacion.id
        )
      }
      break
    }
    case 'addClave': {
      exigirEntidad(diseno, operacion.entidadId).claves.push(structuredClone(operacion.clave))
      break
    }
    case 'updateClave': {
      const entidad = exigirEntidad(diseno, operacion.entidadId)
      const clave = entidad.claves.find((c) => c.id === operacion.id)
      if (!clave) throw new Error(`Clave no encontrada: ${operacion.id}`)
      Object.assign(clave, structuredClone(operacion.parche))
      break
    }
    case 'removeClave': {
      const entidad = exigirEntidad(diseno, operacion.entidadId)
      entidad.claves = entidad.claves.filter((c) => c.id !== operacion.id)
      break
    }
    case 'addRelacion': {
      exigirEntidad(diseno, operacion.relacion.inicio.entidadId)
      exigirEntidad(diseno, operacion.relacion.fin.entidadId)
      diseno.relaciones.push(structuredClone(operacion.relacion))
      break
    }
    case 'updateRelacion': {
      const relacion = exigirRelacion(diseno, operacion.id)
      const parche = structuredClone(operacion.parche)
      if (parche.inicio) exigirEntidad(diseno, parche.inicio.entidadId)
      if (parche.fin) exigirEntidad(diseno, parche.fin.entidadId)
      Object.assign(relacion, parche)
      break
    }
    case 'removeRelacion': {
      exigirRelacion(diseno, operacion.id)
      diseno.relaciones = diseno.relaciones.filter((r) => r.id !== operacion.id)
      for (const entidad of diseno.entidades) {
        for (const clave of entidad.claves) {
          if (clave.foranea?.relacionId === operacion.id) clave.foranea = null
        }
      }
      break
    }
    case 'addAtributoRelacion': {
      exigirRelacion(diseno, operacion.relacionId).atributos.push(structuredClone(operacion.atributo))
      break
    }
    case 'updateAtributoRelacion': {
      const relacion = exigirRelacion(diseno, operacion.relacionId)
      const atributo = relacion.atributos.find((a) => a.id === operacion.id)
      if (!atributo) throw new Error(`Atributo de relación no encontrado: ${operacion.id}`)
      Object.assign(atributo, structuredClone(operacion.parche))
      break
    }
    case 'removeAtributoRelacion': {
      const relacion = exigirRelacion(diseno, operacion.relacionId)
      relacion.atributos = relacion.atributos.filter((a) => a.id !== operacion.id)
      break
    }
    case 'addNota': {
      diseno.notas.push(structuredClone(operacion.nota))
      break
    }
    case 'updateNota': {
      const nota = diseno.notas.find((n) => n.id === operacion.id)
      if (!nota) throw new Error(`Nota no encontrada: ${operacion.id}`)
      Object.assign(nota, structuredClone(operacion.parche))
      break
    }
    case 'removeNota': {
      diseno.notas = diseno.notas.filter((n) => n.id !== operacion.id)
      break
    }
    case 'addRegla': {
      reglas.push(structuredClone(operacion.regla))
      break
    }
    case 'updateRegla': {
      const regla = reglas.find((r) => r.id === operacion.id)
      if (!regla) throw new Error(`Regla no encontrada: ${operacion.id}`)
      Object.assign(regla, structuredClone(operacion.parche))
      break
    }
    case 'removeRegla': {
      const regla = reglas.find((r) => r.id === operacion.id)
      if (!regla) throw new Error(`Regla no encontrada: ${operacion.id}`)
      reglas.splice(reglas.indexOf(regla), 1)
      break
    }
  }

  return { diseno, reglas }
}

export function aplicarOperaciones(estado: DisenoConReglas, operaciones: Operacion[]): DisenoConReglas {
  let actual = estado
  for (const operacion of operaciones) {
    actual = aplicarOperacion(actual, operacion)
  }
  return actual
}

export function invertirOperacion(diseno: Diseno, reglas: ReglaNegocio[], operacion: Operacion): Operacion[] {
  switch (operacion.op) {
    case 'addEntidad':
      return [{ op: 'removeEntidad', id: operacion.entidad.id }]
    case 'updateEntidad': {
      const entidad = hallarEntidad(diseno, operacion.id)
      if (!entidad) return []
      return [
        {
          op: 'updateEntidad',
          id: operacion.id,
          parche: { nombre: entidad.nombre, descripcion: entidad.descripcion }
        }
      ]
    }
    case 'moverEntidad': {
      const entidad = hallarEntidad(diseno, operacion.id)
      if (!entidad) return []
      return [{ op: 'moverEntidad', id: operacion.id, x: entidad.x, y: entidad.y }]
    }
    case 'redimensionarEntidad': {
      const entidad = hallarEntidad(diseno, operacion.id)
      if (!entidad) return []
      return [
        { op: 'redimensionarEntidad', id: operacion.id, ancho: entidad.ancho, alto: entidad.alto }
      ]
    }
    case 'removeEntidad': {
      const entidad = hallarEntidad(diseno, operacion.id)
      if (!entidad) return []
      const relacionesAfectadas = diseno.relaciones.filter(
        (r) => r.inicio.entidadId === operacion.id || r.fin.entidadId === operacion.id
      )
      const reglasAfectadas = reglas.filter((r) => r.dependencia?.entidadId === operacion.id)
      return [
        { op: 'addEntidad', entidad: structuredClone(entidad) },
        ...relacionesAfectadas.map((r) => ({ op: 'addRelacion' as const, relacion: structuredClone(r) })),
        ...reglasAfectadas.map((r) => ({ op: 'addRegla' as const, regla: structuredClone(r) }))
      ]
    }
    case 'addAtributo':
      return [{ op: 'removeAtributo', entidadId: operacion.entidadId, id: operacion.atributo.id }]
    case 'updateAtributo': {
      const entidad = hallarEntidad(diseno, operacion.entidadId)
      const atributo = entidad?.atributos.find((a) => a.id === operacion.id)
      if (!entidad || !atributo) return []
      const { id: _id, ...parche } = atributo
      return [{ op: 'updateAtributo', entidadId: operacion.entidadId, id: operacion.id, parche }]
    }
    case 'removeAtributo': {
      const entidad = hallarEntidad(diseno, operacion.entidadId)
      const atributo = entidad?.atributos.find((a) => a.id === operacion.id)
      if (!entidad || !atributo) return []
      const sobreviven = entidad.claves.filter((c) =>
        c.atributoIds.some((id) => id !== operacion.id)
      )
      const eliminadas = entidad.claves.filter((c) =>
        c.atributoIds.every((id) => id === operacion.id)
      )
      const reglasPre = reglas
        .filter((r) => r.dependencia?.entidadId === entidad.id)
        .map((r) => structuredClone(r))
      return [
        { op: 'addAtributo', entidadId: operacion.entidadId, atributo: structuredClone(atributo) },
        ...sobreviven.map((clave) => ({
          op: 'updateClave' as const,
          entidadId: operacion.entidadId,
          id: clave.id,
          parche: { atributoIds: [...clave.atributoIds] }
        })),
        ...eliminadas.map((clave) => ({
          op: 'addClave' as const,
          entidadId: operacion.entidadId,
          clave: structuredClone(clave)
        })),
        ...reglasPre.map((regla) => ({
          op: 'updateRegla' as const,
          id: regla.id,
          parche: {
            dependencia: regla.dependencia ? structuredClone(regla.dependencia) : null
          }
        }))
      ]
    }
    case 'addClave':
      return [{ op: 'removeClave', entidadId: operacion.entidadId, id: operacion.clave.id }]
    case 'updateClave': {
      const entidad = hallarEntidad(diseno, operacion.entidadId)
      const clave = entidad?.claves.find((c) => c.id === operacion.id)
      if (!entidad || !clave) return []
      const { id: _id, ...parche } = clave
      return [{ op: 'updateClave', entidadId: operacion.entidadId, id: operacion.id, parche }]
    }
    case 'removeClave': {
      const entidad = hallarEntidad(diseno, operacion.entidadId)
      const clave = entidad?.claves.find((c) => c.id === operacion.id)
      if (!entidad || !clave) return []
      return [{ op: 'addClave', entidadId: operacion.entidadId, clave: structuredClone(clave) }]
    }
    case 'addRelacion':
      return [{ op: 'removeRelacion', id: operacion.relacion.id }]
    case 'updateRelacion': {
      const relacion = hallarRelacion(diseno, operacion.id)
      if (!relacion) return []
      const parche: { nombre?: string | null; inicio?: typeof relacion.inicio; fin?: typeof relacion.fin } = {}
      if (operacion.parche.nombre !== undefined) parche.nombre = relacion.nombre
      if (operacion.parche.inicio !== undefined) parche.inicio = structuredClone(relacion.inicio)
      if (operacion.parche.fin !== undefined) parche.fin = structuredClone(relacion.fin)
      return [{ op: 'updateRelacion', id: operacion.id, parche }]
    }
    case 'removeRelacion': {
      const relacion = hallarRelacion(diseno, operacion.id)
      if (!relacion) return []
      const foraneasAfectadas: Operacion[] = []
      for (const entidad of diseno.entidades) {
        for (const clave of entidad.claves) {
          if (clave.foranea?.relacionId === operacion.id) {
            foraneasAfectadas.push({
              op: 'updateClave',
              entidadId: entidad.id,
              id: clave.id,
              parche: { foranea: structuredClone(clave.foranea) }
            })
          }
        }
      }
      return [
        { op: 'addRelacion', relacion: structuredClone(relacion) },
        ...foraneasAfectadas
      ]
    }
    case 'addAtributoRelacion':
      return [
        { op: 'removeAtributoRelacion', relacionId: operacion.relacionId, id: operacion.atributo.id }
      ]
    case 'updateAtributoRelacion': {
      const relacion = hallarRelacion(diseno, operacion.relacionId)
      const atributo = relacion?.atributos.find((a) => a.id === operacion.id)
      if (!relacion || !atributo) return []
      const { id: _id, ...parche } = atributo
      return [
        { op: 'updateAtributoRelacion', relacionId: operacion.relacionId, id: operacion.id, parche }
      ]
    }
    case 'removeAtributoRelacion': {
      const relacion = hallarRelacion(diseno, operacion.relacionId)
      const atributo = relacion?.atributos.find((a) => a.id === operacion.id)
      if (!relacion || !atributo) return []
      return [
        { op: 'addAtributoRelacion', relacionId: operacion.relacionId, atributo: structuredClone(atributo) }
      ]
    }
    case 'addNota':
      return [{ op: 'removeNota', id: operacion.nota.id }]
    case 'updateNota': {
      const nota = diseno.notas.find((n) => n.id === operacion.id)
      if (!nota) return []
      return [{ op: 'updateNota', id: operacion.id, parche: structuredClone(nota) }]
    }
    case 'removeNota': {
      const nota = diseno.notas.find((n) => n.id === operacion.id)
      if (!nota) return []
      return [{ op: 'addNota', nota: structuredClone(nota) }]
    }
    case 'addRegla':
      return [{ op: 'removeRegla', id: operacion.regla.id }]
    case 'updateRegla': {
      const regla = reglas.find((r) => r.id === operacion.id)
      if (!regla) return []
      const { id: _id, ...parche } = regla
      return [{ op: 'updateRegla', id: operacion.id, parche }]
    }
    case 'removeRegla': {
      const regla = reglas.find((r) => r.id === operacion.id)
      if (!regla) return []
      return [{ op: 'addRegla', regla: structuredClone(regla) }]
    }
  }
}

export function descripcionOperacion(operacion: Operacion): string {
  switch (operacion.op) {
    case 'addEntidad':
      return `Crear entidad «${operacion.entidad.nombre}»`
    case 'updateEntidad':
      return `Modificar entidad «${operacion.parche.nombre ?? operacion.id}»`
    case 'moverEntidad':
      return 'Reubicar entidad'
    case 'redimensionarEntidad':
      return 'Redimensionar entidad'
    case 'removeEntidad':
      return 'Eliminar entidad'
    case 'addAtributo':
      return `Añadir atributo «${operacion.atributo.nombre}»`
    case 'updateAtributo':
      return 'Modificar atributo'
    case 'removeAtributo':
      return 'Eliminar atributo'
    case 'addClave':
      return `Añadir clave ${operacion.clave.tipo}`
    case 'updateClave':
      return 'Modificar clave'
    case 'removeClave':
      return 'Eliminar clave'
    case 'addRelacion':
      return 'Crear relación'
    case 'updateRelacion':
      return 'Modificar relación'
    case 'removeRelacion':
      return 'Eliminar relación'
    case 'addAtributoRelacion':
      return 'Añadir atributo de relación'
    case 'updateAtributoRelacion':
      return 'Modificar atributo de relación'
    case 'removeAtributoRelacion':
      return 'Eliminar atributo de relación'
    case 'addNota':
      return 'Añadir nota'
    case 'updateNota':
      return 'Modificar nota'
    case 'removeNota':
      return 'Eliminar nota'
    case 'addRegla':
      return 'Añadir regla de negocio'
    case 'updateRegla':
      return 'Modificar regla de negocio'
    case 'removeRegla':
      return 'Eliminar regla de negocio'
  }
}
