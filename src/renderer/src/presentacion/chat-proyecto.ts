import type { MensajeChat } from '@shared/ai'

export function restaurarChat(valor: unknown): MensajeChat[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((mensaje): mensaje is MensajeChat => Boolean(
    mensaje && typeof mensaje === 'object' &&
    ['usuario', 'asistente', 'sistema'].includes(mensaje.rol) &&
    typeof mensaje.contenido === 'string' && typeof mensaje.fecha === 'string'
  )).map(({ rol, contenido, fecha, propuestaId }) => ({
    rol, contenido, fecha,
    ...(typeof propuestaId === 'string' ? { propuestaId } : {})
  }))
}

export function chatInicial(valor?: unknown): MensajeChat[] {
  const mensajes = restaurarChat(valor)
  return mensajes.length ? mensajes : [{
    rol: 'sistema',
    contenido: 'El asistente explica el diseño, responde preguntas y prepara propuestas. Ningún cambio se aplica sin tu aprobación. El chat requiere un proveedor configurado.',
    fecha: new Date().toISOString()
  }]
}
