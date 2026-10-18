import { describe, expect, it } from 'vitest'
import { chatInicial, restaurarChat } from './chat-proyecto'

describe('chat por proyecto', () => {
  it('abre archivos antiguos con bienvenida y sin conversaciones anteriores', () => {
    expect(chatInicial(undefined)).toEqual([
      expect.objectContaining({ rol: 'sistema', contenido: expect.any(String) })
    ])
    expect(restaurarChat(undefined)).toEqual([])
  })

  it('restaura el orden, las fechas y las referencias a propuestas', () => {
    const mensajes = [
      { rol: 'usuario', contenido: 'Revisa User', fecha: '2026-10-18T12:00:00Z' },
      { rol: 'asistente', contenido: 'Propuesta', propuestaId: 'p-1', fecha: '2026-10-18T12:00:01Z' }
    ]
    expect(chatInicial(JSON.parse(JSON.stringify(mensajes)))).toEqual(mensajes)
  })

  it('ignora entradas inválidas sin impedir abrir el proyecto', () => {
    expect(restaurarChat([null, {}, { rol: 'otro', contenido: 'x', fecha: 'hoy' }])).toEqual([])
    expect(chatInicial({ contenido: 'incorrecto' })[0].rol).toBe('sistema')
  })

  it('devuelve conversaciones independientes para cada proyecto', () => {
    const original = [{ rol: 'usuario', contenido: 'Proyecto A', fecha: '2026-10-18' }]
    const a = chatInicial(original)
    const b = chatInicial()
    a[0].contenido = 'Editado'
    expect(original[0].contenido).toBe('Proyecto A')
    expect(b.some(m => m.contenido === 'Proyecto A')).toBe(false)
  })
})
