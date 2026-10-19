(() => {
  'use strict'
  const datos = window.guiaVisualBD
  if (!datos) return
  const $ = id => document.getElementById(id)
  const crear = (tag, texto, clase) => {
    const nodo = document.createElement(tag)
    if (texto !== undefined) nodo.textContent = texto
    if (clase) nodo.className = clase
    return nodo
  }
  const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)')
  let tema
  try { tema = localStorage.getItem('visual-bd-guia-tema') } catch { /* file:// puede restringir almacenamiento */ }
  const aplicarTema = valor => {
    document.documentElement.dataset.tema = valor
    document.querySelectorAll('.tema').forEach(b => b.setAttribute('aria-label', `Activar tema ${valor === 'claro' ? 'oscuro' : 'claro'}`))
  }
  aplicarTema(tema === 'claro' || tema === 'oscuro' ? tema : window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro')
  document.querySelectorAll('.tema').forEach(b => b.addEventListener('click', () => {
    const valor = document.documentElement.dataset.tema === 'claro' ? 'oscuro' : 'claro'
    aplicarTema(valor)
    try { localStorage.setItem('visual-bd-guia-tema', valor) } catch { /* Funciona sin persistencia. */ }
  }))
  if ($('pasos')) {
    let paso = 0, reloj = null
    const nombres = ['Proyecto', 'Modelo', 'Reglas', 'Proveedor', 'Revisión IA', 'Decisión', 'Entrega']
    const parar = () => {
      if (reloj) clearInterval(reloj)
      reloj = null
      document.documentElement.dataset.animar = 'false'
      $('reproducir').textContent = 'Reproducir recorrido'
      $('reproducir').setAttribute('aria-pressed', 'false')
    }
    const mostrar = indice => {
      paso = Math.max(0, Math.min(datos.pasos.length - 1, indice))
      const actual = datos.pasos[paso]
      $('contador').textContent = `PASO ${String(paso + 1).padStart(2, '0')} / 07`
      for (const [id, propiedad] of [['paso-titulo', 'titulo'], ['paso-verbo', 'verbo'], ['paso-texto', 'texto'], ['paso-ruta', 'ruta'], ['paso-tarea', 'tarea'], ['demo-titulo', 'panel'], ['demo-detalle', 'detalle'], ['demo-estado', 'estado']]) $(id).textContent = actual[propiedad]
      $('mini-vista').textContent = paso === 5 ? 'Propuesto · solo lectura' : 'Actual'
      $('marca-total').textContent = paso === 5 ? '*' : '?'
      $('simulacion').dataset.paso = String(paso)
      $('simulacion').classList.remove('entrando')
      requestAnimationFrame(() => $('simulacion').classList.add('entrando'))
      $('pasos').querySelectorAll('button').forEach((b, i) => { if (i === paso) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current') })
      $('anterior').disabled = paso === 0
      $('siguiente').disabled = paso === datos.pasos.length - 1
      $('paso-enlaces').replaceChildren(...actual.enlaces.map(id => {
        const enlace = crear('a', datos.funciones.find(f => f.id === id).titulo + ' ↗')
        enlace.href = `tecnica.html#${id}`
        return enlace
      }))
      $('estado-recorrido').textContent = `Paso ${paso + 1} de 7: ${actual.titulo}.`
    }
    datos.pasos.forEach((p, i) => {
      const b = crear('button'); b.type = 'button'
      b.append(crear('b', String(i + 1).padStart(2, '0')), crear('span', nombres[i]))
      b.addEventListener('click', () => { parar(); mostrar(i) })
      $('pasos').append(b)
    })
    $('anterior').addEventListener('click', () => { parar(); mostrar(paso - 1) })
    $('siguiente').addEventListener('click', () => { parar(); mostrar(paso + 1) })
    $('reproducir').addEventListener('click', () => {
      if (reloj) { parar(); return }
      if (reducido.matches) return
      if (paso === datos.pasos.length - 1) mostrar(0)
      document.documentElement.dataset.animar = 'true'
      $('reproducir').textContent = 'Pausar recorrido'; $('reproducir').setAttribute('aria-pressed', 'true')
      reloj = setInterval(() => { if (paso === datos.pasos.length - 1) { parar(); return }; mostrar(paso + 1); if (paso === datos.pasos.length - 1) parar() }, 6500)
    })
    const ajustarMovimiento = () => {
      if (reducido.matches) parar()
      $('reproducir').disabled = reducido.matches
      $('reproducir').title = reducido.matches ? 'Movimiento reducido activo. Usa los pasos manuales.' : 'Avanzar automáticamente cada 6,5 segundos'
    }
    reducido.addEventListener('change', ajustarMovimiento)
    document.addEventListener('visibilitychange', () => { if (document.hidden) parar() })
    parar(); mostrar(0); ajustarMovimiento()
  }
  let categoria = 'Todas'
  const contenedor = $('funciones') || $('referencia-funciones')
  if (!contenedor) return
  const tecnica = Boolean($('referencia-funciones'))
  const fichas = datos.funciones.map(f => {
    let nodo
    if (tecnica) {
      nodo = crear('details', undefined, 'referencia'); nodo.id = f.id
      const resumen = crear('summary'); resumen.append(crear('small', f.categoria), document.createTextNode(f.titulo))
      const cuerpo = crear('div'); cuerpo.append(crear('p', f.descripcion))
      const lista = crear('dl')
      for (const [etiqueta, texto] of [['Acceso en la interfaz', f.acceso], ['Implementación', f.fuente], ['Contrato / operación', f.contrato], ['Límites y requisitos', f.limite]]) {
        const valor = crear('dd')
        if (etiqueta === 'Implementación' || etiqueta === 'Contrato / operación') valor.append(crear('code', texto)); else valor.textContent = texto
        lista.append(crear('dt', etiqueta), valor)
      }
      cuerpo.append(lista); nodo.append(resumen, cuerpo)
    } else {
      nodo = crear('article', undefined, 'funcion')
      const enlace = crear('a', 'Ver ubicación y detalles ↗'); enlace.href = `tecnica.html#${f.id}`
      nodo.append(crear('span', f.categoria, 'categoria'), crear('h3', f.titulo), crear('p', f.descripcion), enlace)
    }
    contenedor.append(nodo)
    return { nodo, funcion: f, texto: normalizar(Object.values(f).join(' ')) }
  })
  const filtrar = () => {
    const busqueda = normalizar($('buscar').value.trim()); let visibles = 0
    fichas.forEach(f => { const coincide = (categoria === 'Todas' || f.funcion.categoria === categoria) && f.texto.includes(busqueda); f.nodo.hidden = !coincide; if (coincide) visibles++ })
    $('conteo').textContent = `${visibles} de ${fichas.length} funciones · ${categoria}`
    $('sin-resultados').hidden = visibles !== 0
    $('filtros').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === categoria)))
  }
  ;['Todas', ...datos.categorias].forEach(nombre => { const b = crear('button', nombre); b.type = 'button'; b.addEventListener('click', () => { categoria = nombre; filtrar() }); $('filtros').append(b) })
  $('buscar').addEventListener('input', filtrar); filtrar()
  const abrirReferencia = () => {
    if (!tecnica || !location.hash) return
    const ficha = fichas.find(f => `#${f.funcion.id}` === location.hash)
    if (!ficha) return
    categoria = 'Todas'; $('buscar').value = ''; filtrar(); ficha.nodo.open = true
    requestAnimationFrame(() => ficha.nodo.scrollIntoView({ block: 'start', behavior: 'instant' }))
  }
  window.addEventListener('hashchange', abrirReferencia); abrirReferencia()
})()
