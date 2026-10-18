import { useId, useState } from 'react'
import {
  DESCONOCIDO,
  Desconocible,
  Atributo,
  Entidad,
  crearAtributo,
  nuevoId
} from '../domain/modelo'
import { useTienda } from '../estado/tienda'

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = 'text'
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  tipo?: string
}): JSX.Element {
  const id = useId()
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function SelectorDesconocible({
  etiqueta,
  valor,
  opciones,
  onChange
}: {
  etiqueta: string
  valor: Desconocible<string>
  opciones: { valor: string; etiqueta: string }[]
  onChange: (valor: Desconocible<string>) => void
}): JSX.Element {
  const id = useId()
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={String(valor)} onChange={(e) => onChange(e.target.value as Desconocible<string>)}>
        <option value={DESCONOCIDO}>Desconocido</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
}

export function PanelPropiedades(): JSX.Element {
  const tienda = useTienda()
  const { proyecto, seleccion } = tienda
  const [nuevaClaveNombre, setNuevaClaveNombre] = useState('')
  const [fkEntidadDestino, setFkEntidadDestino] = useState('')
  const [fkClaveDestino, setFkClaveDestino] = useState('')
  const [textoRegla, setTextoRegla] = useState('')
  const [atributoCandidatoIds, setAtributoCandidatoIds] = useState<string[]>([])

  if (!seleccion) {
    return (
      <div>
        <h2>Propiedades</h2>
        <p className="vacio">
          Selecciona una entidad, relación o nota en el lienzo para editarla. Usa las herramientas sobre el lienzo para crear elementos.
        </p>
        <h3>Reglas de negocio</h3>
        <ListaReglas />
        <div className="campo">
          <label htmlFor="regla-negocio">Nueva regla de negocio</label>
          <input
            value={textoRegla}
            id="regla-negocio" placeholder="Ej: Cada cliente puede tener muchos pedidos"
            onChange={(e) => setTextoRegla(e.target.value)}
          />
        </div>
        <button
          disabled={!textoRegla.trim()}
          onClick={() => {
            tienda.aplicar(
              [
                {
                  op: 'addRegla',
                  regla: { id: nuevoId('reg'), tipo: 'negocio', texto: textoRegla.trim(), dependencia: null, fragmentoOrigen: null }
                }
              ],
              { etiqueta: 'Añadir regla de negocio' }
            )
            setTextoRegla('')
          }}
        >
          Añadir regla
        </button>
        <h3>Información desconocida</h3>
        {proyecto.desconocidos.length === 0 ? (
          <p className="vacio">Sin elementos desconocidos registrados.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {proyecto.desconocidos.map((desconocido, i) => (
              <li key={i}>{desconocido}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (seleccion.tipo === 'nota') {
    const nota = proyecto.diseno.notas.find((n) => n.id === seleccion.id)
    if (!nota) return <p className="vacio">Nota no encontrada.</p>
    return (
      <div>
        <h2>Nota</h2>
        <div className="campo">
          <label>Texto</label>
          <textarea
            value={nota.texto}
            onChange={(e) =>
              tienda.aplicar([{ op: 'updateNota', id: nota.id, parche: { texto: e.target.value } }])
            }
          />
        </div>
        <button className="peligro" onClick={tienda.eliminarSeleccion}>
          Eliminar nota
        </button>
      </div>
    )
  }

  if (seleccion.tipo === 'relacion') {
    const relacion = proyecto.diseno.relaciones.find((r) => r.id === seleccion.id)
    if (!relacion) return <p className="vacio">Relación no encontrada.</p>
    const nombreEntidad = (id: string): string =>
      proyecto.diseno.entidades.find((e) => e.id === id)?.nombre ?? '—'
    const editarExtremo = (
      cual: 'inicio' | 'fin',
      parche: Partial<{ cardinalidad: { minimo: Desconocible<0 | 1>; maximo: Desconocible<1 | 'n'> }; participacion: Desconocible<'total' | 'parcial'> }>
    ) => {
      tienda.aplicar([
        {
          op: 'updateRelacion',
          id: relacion.id,
          parche: { [cual]: { ...relacion[cual], ...parche } } as never
        }
      ])
    }
    return (
      <div>
        <h2>
          Relación {nombreEntidad(relacion.inicio.entidadId)} – {nombreEntidad(relacion.fin.entidadId)}
        </h2>
        <Campo
          etiqueta="Nombre (opcional)"
          valor={relacion.nombre ?? ''}
          onChange={(valor) =>
            tienda.aplicar([{ op: 'updateRelacion', id: relacion.id, parche: { nombre: valor || null } }])
          }
        />
        <h3>Extremo: {nombreEntidad(relacion.inicio.entidadId)}</h3>
        <div className="fila">
          <SelectorDesconocible
            etiqueta="Mínimo"
            valor={relacion.inicio.cardinalidad.minimo as Desconocible<string>}
            opciones={[
              { valor: '0', etiqueta: '0 (parcial)' },
              { valor: '1', etiqueta: '1 (total)' }
            ]}
            onChange={(valor) =>
              editarExtremo('inicio', {
                cardinalidad: { ...relacion.inicio.cardinalidad, minimo: valor as Desconocible<0 | 1> }
              })
            }
          />
          <SelectorDesconocible
            etiqueta="Máximo"
            valor={relacion.inicio.cardinalidad.maximo as Desconocible<string>}
            opciones={[
              { valor: '1', etiqueta: '1' },
              { valor: 'n', etiqueta: 'n' }
            ]}
            onChange={(valor) =>
              editarExtremo('inicio', {
                cardinalidad: { ...relacion.inicio.cardinalidad, maximo: valor as Desconocible<1 | 'n'> }
              })
            }
          />
          <SelectorDesconocible
            etiqueta="Participación"
            valor={relacion.inicio.participacion as Desconocible<string>}
            opciones={[
              { valor: 'parcial', etiqueta: 'Parcial' },
              { valor: 'total', etiqueta: 'Total' }
            ]}
            onChange={(valor) =>
              editarExtremo('inicio', { participacion: valor as Desconocible<'total' | 'parcial'> })
            }
          />
        </div>
        <h3>Extremo: {nombreEntidad(relacion.fin.entidadId)}</h3>
        <div className="fila">
          <SelectorDesconocible
            etiqueta="Mínimo"
            valor={relacion.fin.cardinalidad.minimo as Desconocible<string>}
            opciones={[
              { valor: '0', etiqueta: '0 (parcial)' },
              { valor: '1', etiqueta: '1 (total)' }
            ]}
            onChange={(valor) =>
              editarExtremo('fin', {
                cardinalidad: { ...relacion.fin.cardinalidad, minimo: valor as Desconocible<0 | 1> }
              })
            }
          />
          <SelectorDesconocible
            etiqueta="Máximo"
            valor={relacion.fin.cardinalidad.maximo as Desconocible<string>}
            opciones={[
              { valor: '1', etiqueta: '1' },
              { valor: 'n', etiqueta: 'n' }
            ]}
            onChange={(valor) =>
              editarExtremo('fin', {
                cardinalidad: { ...relacion.fin.cardinalidad, maximo: valor as Desconocible<1 | 'n'> }
              })
            }
          />
          <SelectorDesconocible
            etiqueta="Participación"
            valor={relacion.fin.participacion as Desconocible<string>}
            opciones={[
              { valor: 'parcial', etiqueta: 'Parcial' },
              { valor: 'total', etiqueta: 'Total' }
            ]}
            onChange={(valor) =>
              editarExtremo('fin', { participacion: valor as Desconocible<'total' | 'parcial'> })
            }
          />
        </div>
        <button
          onClick={() => {
            const claveForanea = {
              id: nuevoId('k'),
              nombre: `fk_${nombreEntidad(relacion.fin.entidadId).toLowerCase()}`,
              tipo: 'foranea' as const,
              atributoIds: [],
              foranea: {
                entidadDestinoId: relacion.inicio.entidadId,
                claveDestinoIds: [],
                relacionId: relacion.id
              }
            }
            tienda.aplicar(
              [{ op: 'addClave', entidadId: relacion.fin.entidadId, clave: claveForanea }],
              { etiqueta: 'Crear clave foránea desde la relación' }
            )
          }}
        >
          Crear clave foránea en «{nombreEntidad(relacion.fin.entidadId)}»
        </button>
        <div style={{ marginTop: 10 }}>
          <button className="peligro" onClick={tienda.eliminarSeleccion}>
            Eliminar relación
          </button>
        </div>
      </div>
    )
  }

  const entidad = proyecto.diseno.entidades.find((e) => e.id === seleccion.id)
  if (!entidad) return <p className="vacio">Entidad no encontrada.</p>

  const editarEntidad = (parche: Partial<Pick<Entidad, 'nombre' | 'descripcion'>>) => {
    tienda.aplicar([{ op: 'updateEntidad', id: entidad.id, parche }])
  }

  const editarAtributo = (atributo: Atributo, parche: Partial<Omit<Atributo, 'id'>>) => {
    tienda.aplicar([{ op: 'updateAtributo', entidadId: entidad.id, id: atributo.id, parche }])
  }

  const alternarPrimaria = (atributo: Atributo) => {
    const existente = entidad.claves.find((c) => c.tipo === 'primaria' && c.atributoIds.includes(atributo.id))
    if (existente) {
      const resto = existente.atributoIds.filter((id) => id !== atributo.id)
      if (resto.length === 0) {
        tienda.aplicar([{ op: 'removeClave', entidadId: entidad.id, id: existente.id }])
      } else {
        tienda.aplicar([
          { op: 'updateClave', entidadId: entidad.id, id: existente.id, parche: { atributoIds: resto } }
        ])
      }
      return
    }
    const primaria = entidad.claves.find((c) => c.tipo === 'primaria')
    if (primaria) {
      tienda.aplicar([
        {
          op: 'updateClave',
          entidadId: entidad.id,
          id: primaria.id,
          parche: { atributoIds: [...primaria.atributoIds, atributo.id] }
        }
      ])
    } else {
      tienda.aplicar([
        {
          op: 'addClave',
          entidadId: entidad.id,
          clave: {
            id: nuevoId('k'),
            nombre: `pk_${entidad.nombre.toLowerCase()}`,
            tipo: 'primaria',
            atributoIds: [atributo.id],
            foranea: null
          }
        }
      ])
    }
  }

  return (
    <div>
      <h2>Entidad</h2>
      <Campo etiqueta="Nombre" valor={entidad.nombre} onChange={(nombre) => editarEntidad({ nombre })} />
      <div className="campo">
        <label htmlFor="descripcion-entidad">Descripción</label>
        <textarea
          id="descripcion-entidad"
          value={entidad.descripcion ?? ''}
          onChange={(e) => editarEntidad({ descripcion: e.target.value || null })}
        />
      </div>

      <h3>Atributos</h3>
      {entidad.atributos.length === 0 && <p className="vacio">Sin atributos todavía.</p>}
      <div className="lista-elementos">
        {entidad.atributos.map((atributo) => {
          const clave = entidad.claves.find((c) => c.atributoIds.includes(atributo.id))
          return (
            <div key={atributo.id} className="elemento" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="fila">
                <input aria-label="Nombre del atributo"
                  value={atributo.nombre}
                  onChange={(e) => editarAtributo(atributo, { nombre: e.target.value })}
                />
                <button
                  className="auto"
                  title="Marcar como parte de la clave primaria"
                  style={{ borderColor: clave?.tipo === 'primaria' ? 'var(--nota)' : undefined }}
                  onClick={() => alternarPrimaria(atributo)}
                >
                  PK
                </button>
                <button className="auto peligro" onClick={() => tienda.aplicar([{ op: 'removeAtributo', entidadId: entidad.id, id: atributo.id }])}>
                  ✕
                </button>
              </div>
              <div className="fila" style={{ marginTop: 4 }}>
                <SelectorDesconocible
                  etiqueta="Tipo"
                  valor={atributo.tipoDato as Desconocible<string>}
                  opciones={[
                    { valor: 'texto', etiqueta: 'Texto' },
                    { valor: 'entero', etiqueta: 'Entero' },
                    { valor: 'decimal', etiqueta: 'Decimal' },
                    { valor: 'fecha', etiqueta: 'Fecha' },
                    { valor: 'booleano', etiqueta: 'Booleano' }
                  ]}
                  onChange={(valor) => editarAtributo(atributo, { tipoDato: valor as Desconocible<string> })}
                />
                <SelectorDesconocible
                  etiqueta="Nulable"
                  valor={atributo.nulable as Desconocible<string>}
                  opciones={[
                    { valor: 'true', etiqueta: 'Sí' },
                    { valor: 'false', etiqueta: 'No' }
                  ]}
                  onChange={(valor) =>
                    editarAtributo(atributo, {
                      nulable: valor === DESCONOCIDO ? DESCONOCIDO : (valor === 'true')
                    })
                  }
                />
              </div>
              <div className="fila" style={{ marginTop: 4 }}>
                <SelectorDesconocible
                  etiqueta="Único"
                  valor={atributo.unico as Desconocible<string>}
                  opciones={[
                    { valor: 'true', etiqueta: 'Sí' },
                    { valor: 'false', etiqueta: 'No' }
                  ]}
                  onChange={(valor) =>
                    editarAtributo(atributo, { unico: valor === DESCONOCIDO ? DESCONOCIDO : valor === 'true' })
                  }
                />
                <SelectorDesconocible
                  etiqueta="Multivalorado"
                  valor={atributo.multivalorado as Desconocible<string>}
                  opciones={[
                    { valor: 'true', etiqueta: 'Sí' },
                    { valor: 'false', etiqueta: 'No' }
                  ]}
                  onChange={(valor) =>
                    editarAtributo(atributo, {
                      multivalorado: valor === DESCONOCIDO ? DESCONOCIDO : valor === 'true'
                    })
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
      <button
        style={{ marginTop: 6 }}
        onClick={() =>
          tienda.aplicar(
            [
              {
                op: 'addAtributo',
                entidadId: entidad.id,
                atributo: crearAtributo(`atributo_${entidad.atributos.length + 1}`)
              }
            ],
            { etiqueta: 'Añadir atributo' }
          )
        }
      >
        + Añadir atributo
      </button>

      <details className="seccion-plegable"><summary>Claves candidatas</summary>
      {entidad.claves.filter((c) => c.tipo === 'candidata').length === 0 && (
        <p className="vacio">Sin claves candidatas declaradas.</p>
      )}
      {entidad.claves
        .filter((c) => c.tipo === 'candidata')
        .map((clave) => (
          <div key={clave.id} className="fila" style={{ marginBottom: 4 }}>
            <span>{clave.nombre || clave.id}</span>
            <span className="auto chip">
              {clave.atributoIds
                .map((id) => entidad.atributos.find((a) => a.id === id)?.nombre ?? '?')
                .join(' + ')}
            </span>
            <button className="auto peligro" onClick={() => tienda.aplicar([{ op: 'removeClave', entidadId: entidad.id, id: clave.id }])}>
              ✕
            </button>
          </div>
        ))}
      <div className="campo">
        <label>Crear clave candidata desde atributos</label>
        <div className="chips">
          {entidad.atributos.map((atributo) => {
            const activo = atributoCandidatoIds.includes(atributo.id)
            return (
              <button
                key={atributo.id}
                className="chip"
                style={{ borderColor: activo ? 'var(--acento)' : undefined, cursor: 'pointer' }}
                onClick={() =>
                  setAtributoCandidatoIds((prev) =>
                    prev.includes(atributo.id) ? prev.filter((id) => id !== atributo.id) : [...prev, atributo.id]
                  )
                }
              >
                {atributo.nombre}
              </button>
            )
          })}
        </div>
      </div>
      <div className="fila">
        <input
          placeholder="Nombre de la clave"
          value={nuevaClaveNombre}
          onChange={(e) => setNuevaClaveNombre(e.target.value)}
        />
        <button
          className="auto"
          disabled={atributoCandidatoIds.length === 0}
          onClick={() => {
            tienda.aplicar([
              {
                op: 'addClave',
                entidadId: entidad.id,
                clave: {
                  id: nuevoId('k'),
                  nombre: nuevaClaveNombre || 'uk',
                  tipo: 'candidata',
                  atributoIds: [...atributoCandidatoIds],
                  foranea: null
                }
              }
            ])
            setNuevaClaveNombre('')
            setAtributoCandidatoIds([])
          }}
        >
          Crear
        </button>
      </div>

      </details><details className="seccion-plegable"><summary>Claves foráneas</summary>
      {entidad.claves.filter((c) => c.tipo === 'foranea').length === 0 && (
        <p className="vacio">Sin claves foráneas. Crea una desde la relación correspondiente o aquí.</p>
      )}
      {entidad.claves
        .filter((c) => c.tipo === 'foranea')
        .map((clave) => {
          const destino = clave.foranea
            ? proyecto.diseno.entidades.find((e) => e.id === clave.foranea!.entidadDestinoId)
            : undefined
          return (
            <div key={clave.id} className="seccion-regla">
              <div className="fila">
                <span>{clave.nombre || clave.id}</span>
                <span className="auto chip">→ {destino?.nombre ?? 'destino perdido'}</span>
                <button className="auto peligro" onClick={() => tienda.aplicar([{ op: 'removeClave', entidadId: entidad.id, id: clave.id }])}>
                  ✕
                </button>
              </div>
              <div className="fila" style={{ marginTop: 6 }}>
                <span className="auto">Atributos:</span>
                {entidad.atributos.map((atributo) => {
                  const activo = clave.atributoIds.includes(atributo.id)
                  return (
                    <button
                      key={atributo.id}
                      className="chip"
                      style={{ borderColor: activo ? '#7ec8ff' : undefined, cursor: 'pointer' }}
                      onClick={() => {
                        const siguiente = activo
                          ? clave.atributoIds.filter((id) => id !== atributo.id)
                          : [...clave.atributoIds, atributo.id]
                        tienda.aplicar([
                          { op: 'updateClave', entidadId: entidad.id, id: clave.id, parche: { atributoIds: siguiente } }
                        ])
                      }}
                    >
                      {atributo.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      <div className="campo">
        <label>Nueva clave foránea</label>
        <div className="fila">
          <select value={fkEntidadDestino} onChange={(e) => { setFkEntidadDestino(e.target.value); setFkClaveDestino('') }}>
            <option value="">Entidad destino…</option>
            {proyecto.diseno.entidades
              .filter((e) => e.id !== entidad.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
          </select>
          <select value={fkClaveDestino} onChange={(e) => setFkClaveDestino(e.target.value)} disabled={!fkEntidadDestino}>
            <option value="">Clave destino…</option>
            {(proyecto.diseno.entidades.find((e) => e.id === fkEntidadDestino)?.claves ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre || c.tipo}
              </option>
            ))}
          </select>
          <button
            className="auto"
            disabled={!fkEntidadDestino}
            onClick={() => {
              const destino = proyecto.diseno.entidades.find((e) => e.id === fkEntidadDestino)
              const clave = {
                id: nuevoId('k'),
                nombre: `fk_${destino?.nombre.toLowerCase() ?? 'destino'}`,
                tipo: 'foranea' as const,
                atributoIds: [],
                foranea: {
                  entidadDestinoId: fkEntidadDestino,
                  claveDestinoIds: fkClaveDestino ? [fkClaveDestino] : [],
                  relacionId: null
                }
              }
              tienda.aplicar([{ op: 'addClave', entidadId: entidad.id, clave }])
              setFkEntidadDestino('')
              setFkClaveDestino('')
            }}
          >
            Crear FK
          </button>
        </div>
      </div>

      </details><div style={{ marginTop: 14 }}>
        <button className="peligro" onClick={tienda.eliminarSeleccion}>
          Eliminar entidad
        </button>
      </div>
    </div>
  )
}

function ListaReglas(): JSX.Element {
  const tienda = useTienda()
  const { proyecto } = tienda
  if (proyecto.reglas.length === 0) {
    return <p className="vacio">Sin reglas declaradas. Ayudan a la revisión de normalización.</p>
  }
  return (
    <div>
      {proyecto.reglas.map((regla) => (
        <div key={regla.id} className="seccion-regla">
          <div className="fila">
            <span className="auto chip">{regla.tipo}</span>
            <span style={{ flex: 1 }}>{regla.texto}</span>
            <button
              className="auto peligro"
              onClick={() => tienda.aplicar([{ op: 'removeRegla', id: regla.id }])}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
