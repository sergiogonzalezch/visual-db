export type TipoArchivoExportacion = 'markdown' | 'json' | 'svg' | 'png' | 'mermaid' | 'drawio'
export type FormatoExportacion = TipoArchivoExportacion | 'paquete'
export const formatosExportacion = {
  markdown: { extension: 'md', nombre: 'Reporte Markdown', sufijo: 'reporte' },
  json: { extension: 'json', nombre: 'Modelo JSON', sufijo: 'modelo' },
  svg: { extension: 'svg', nombre: 'Diagrama SVG', sufijo: 'diagrama' },
  png: { extension: 'png', nombre: 'Imagen PNG', sufijo: 'diagrama' },
  mermaid: { extension: 'mmd', nombre: 'Diagrama Mermaid', sufijo: 'diagrama' },
  drawio: { extension: 'drawio', nombre: 'Diagrama draw.io', sufijo: 'diagrama' }
} as const
export interface ArchivoExportacion {
  tipo: TipoArchivoExportacion
  /** PNG usa base64 puro; los otros formatos son texto UTF-8. */
  contenido: string
}
export interface SolicitudExportacion {
  nombre: string
  archivos: ArchivoExportacion[]
}
export interface ResultadoExportacion {
  estado: 'cancelada' | 'completa' | 'parcial' | 'error'
  archivos: string[]
  mensaje?: string
}

export function nombreExportacion(nombre: string): string {
  const seguro = nombre.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 100)
  return !seguro || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(seguro) ? 'modelo' : seguro
}
