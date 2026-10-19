const trazos = {
  editar: ['m15 4 5 5', 'M4 20l1-5L16 4a2 2 0 0 1 4 4L9 19Z'],
  confirmar: ['m5 12 4 4L19 6'],
  modelo: ['M4 6a8 3 0 1 0 16 0 8 3 0 1 0-16 0', 'M4 6v12a8 3 0 0 0 16 0V6', 'M4 12a8 3 0 0 0 16 0'],
  deshacer: ['M3 10h10a7 7 0 0 1 7 7', 'm7 6-4 4 4 4'],
  rehacer: ['M21 10H11a7 7 0 0 0-7 7', 'm17 6 4 4-4 4'],
  desplegar: ['m6 9 6 6 6-6'],
  lateral: ['m14 6-6 6 6 6'],
  cerrar: ['m6 6 12 12', 'M18 6 6 18'],
  seleccion: ['m4 3 7 18 2-8 8-2Z'],
  entidad: ['M4 4h16v16H4Z', 'M12 8v8', 'M8 12h8'],
  relacion: ['M6 3v12a3 3 0 0 0 3 3h9', 'M6 9h9a3 3 0 0 0 3-3V3', 'M3 3h6', 'M15 3h6', 'm15 15 3 3-3 3'],
  nota: ['M4 3h16v12l-5 6H4Z', 'M15 21v-6h5', 'M8 7h8', 'M8 11h5'],
  asa: ['M7 8h.01M12 8h.01M17 8h.01', 'M7 14h.01M12 14h.01M17 14h.01'],
  encuadrar: ['M8 3H3v5', 'M16 3h5v5', 'M21 16v5h-5', 'M8 21H3v-5', 'M8 8h8v8H8Z'],
  restablecer: ['M3 10a9 9 0 1 1 2 8', 'M3 4v6h6']
} as const

/** Iconos decorativos; el control que los contiene aporta el nombre accesible. */
export function Icono({ nombre }: { nombre: keyof typeof trazos }): JSX.Element {
  return <svg className="icono" viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false">
    {trazos[nombre].map((d) => <path key={d} d={d} />)}
  </svg>
}
