export function dimensionesPng(ancho: number, alto: number, escala: number) {
  if (![ancho, alto].every(n => Number.isFinite(n) && n > 0) || ![1, 2].includes(escala)) throw new Error('Dimensiones de imagen inválidas.')
  const w = Math.ceil(ancho * escala), h = Math.ceil(alto * escala)
  if (w > 16384 || h > 16384 || w * h > 32_000_000) throw new Error('El PNG supera 16 384 px por lado o 32 megapíxeles. Usa escala 1× o exporta SVG.')
  return { ancho: w, alto: h }
}
export async function rasterizarPng(svg: { contenido: string; ancho: number; alto: number }, escala: 1 | 2): Promise<string> {
  const tamano = dimensionesPng(svg.ancho, svg.alto, escala)
  const url = URL.createObjectURL(new Blob([svg.contenido], { type: 'image/svg+xml' }))
  const canvas = document.createElement('canvas')
  try {
    const imagen = new Image()
    await new Promise<void>((resolver, rechazar) => { imagen.onload = () => resolver(); imagen.onerror = () => rechazar(new Error('No se pudo rasterizar el SVG. Prueba exportar SVG directamente.')); imagen.src = url })
    canvas.width = tamano.ancho; canvas.height = tamano.alto
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('No hay un contexto gráfico disponible.')
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height)
    const datos = canvas.toDataURL('image/png')
    if (!datos.startsWith('data:image/png;base64,')) throw new Error('No se pudo crear la imagen PNG.')
    return datos.slice('data:image/png;base64,'.length)
  } finally { URL.revokeObjectURL(url); canvas.width = 0; canvas.height = 0 }
}
