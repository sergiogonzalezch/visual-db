/** Centraliza errores seguros y reintentos acotados de peticiones idempotentes. */
export async function solicitar(url: string, opciones: RequestInit = {}): Promise<Response> {
  const destino = new URL(url)
  if (!['http:', 'https:'].includes(destino.protocol) || destino.username || destino.password || destino.search || destino.hash) {
    throw new Error('Usa una URL HTTP o HTTPS sin credenciales, parámetros ni fragmentos.')
  }
  const signal = opciones.signal ?? AbortSignal.timeout(15000)
  const intentos = !opciones.method || opciones.method === 'GET' ? 3 : 1
  for (let intento = 0; intento < intentos; intento++) {
    let respuesta: Response
    try {
      respuesta = await fetch(url, { ...opciones, signal, redirect: 'error' })
    } catch {
      throw new Error(signal.aborted ? 'Se agotó el tiempo de espera o se canceló la solicitud.' : 'No se pudo contactar con el proveedor. Revisa la URL y la conexión de red.')
    }
    if (respuesta.ok) return respuesta
    if ((respuesta.status === 429 || respuesta.status >= 500) && intento + 1 < intentos) {
      const cabecera = respuesta.headers.get('retry-after')
      const segundos = cabecera !== null && /^\d+(?:\.\d+)?$/.test(cabecera.trim()) ? Number(cabecera) : NaN
      const fecha = cabecera !== null ? Date.parse(cabecera) : NaN
      const indicada = Number.isFinite(segundos) ? segundos * 1000 : Number.isFinite(fecha) ? Math.max(0, fecha - Date.now()) : null
      // No repetir antes del plazo del proveedor ni mantener una conexión de
      // catálogo bloqueada durante una espera larga.
      if (indicada !== null && indicada > 5000) {
        await respuesta.body?.cancel()
        throw new Error(`El proveedor pidió esperar ${Math.ceil(indicada / 1000)} segundos antes de volver a intentarlo.`)
      }
      const demora = indicada ?? 500 * 2 ** intento
      await respuesta.body?.cancel()
      await new Promise<void>((resolve, reject) => {
        if (signal.aborted) { reject(new Error('Solicitud cancelada.')); return }
        const cancelar = () => { clearTimeout(timer); reject(new Error('Se agotó el tiempo de espera.')) }
        const timer = setTimeout(() => { signal.removeEventListener('abort', cancelar); resolve() }, demora)
        signal.addEventListener('abort', cancelar, { once: true })
      })
      continue
    }
    const estado = respuesta.status
    // Clasifica únicamente mensajes conocidos; nunca propaga cuerpos arbitrarios,
    // que pueden contener credenciales, prompts o información interna.
    const datos: unknown = await respuesta.json().catch(() => null)
    const objeto = Array.isArray(datos) ? datos[0] : datos
    const errorProveedor = objeto && typeof objeto === 'object'
      ? (objeto as { error?: { message?: unknown } }).error : undefined
    const mensaje = typeof errorProveedor?.message === 'string' ? errorProveedor.message : ''
    if (estado === 404 && /no longer available to new users/i.test(mensaje)) {
      throw new Error('El modelo seleccionado ya no está disponible para nuevos usuarios de este proveedor. La conexión al catálogo funciona, pero tu cuenta no puede generar con ese modelo. Selecciona otro modelo en Modelo / IA; no necesitas reemplazar la clave.')
    }
    if (estado === 503) {
      throw new Error('HTTP 503: el modelo no está disponible temporalmente o está saturado. El catálogo puede seguir accesible. Espera y reintenta, o selecciona otro modelo; no necesitas reemplazar la clave por este error.')
    }
    throw new Error(estado === 401 || estado === 403
      ? 'Autenticación rechazada. Revisa la clave y sus permisos.'
      : estado === 429 ? 'Límite de tasa alcanzado. Espera unos segundos y vuelve a intentarlo.'
      : estado === 404 ? 'HTTP 404: la ruta o el modelo solicitado no esta disponible. Revisa la URL base y vuelve a seleccionar un modelo.'
      : `El proveedor respondió HTTP ${estado}. Inténtalo de nuevo más tarde.`)
  }
  throw new Error('No se pudo completar la solicitud.')
}
