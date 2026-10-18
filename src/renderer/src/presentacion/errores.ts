/** Retira el envoltorio técnico de IPC y conserva el mensaje útil del proveedor. */
export function mensajeErrorVisible(mensaje: string): string {
  return mensaje.replace(/^Error invoking remote method '[^']+':\s*(?:Error:\s*)?/, '')
}
