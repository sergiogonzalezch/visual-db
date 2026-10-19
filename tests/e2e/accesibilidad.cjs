// Auditoría del DOM renderizado, complementada con el árbol AX de Chromium.
// No sustituye la interacción auditiva con un lector de pantalla.
module.exports = function auditarAccesibilidad() {
  const visible = e => e.getClientRects().length && !e.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(e).visibility !== 'hidden'
  const sinNombre = [...document.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[role="button"]')].filter(visible).filter(e => {
    const etiqueta = e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ') || [...(e.labels || [])].map(l => l.textContent).join(' ') || (e.matches('button,[role="button"]') ? e.textContent : '')
    return !etiqueta.trim()
  }).map(e => ({ etiqueta: e.tagName, id: e.id, clase: e.className?.baseVal ?? e.className }))
  const parsear = s => { const n = s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0]; return [n[0], n[1], n[2], n[3] ?? 1] }
  const mezclar = (a, b) => a.slice(0, 3).map((c, i) => c * a[3] + b[i] * (1 - a[3]))
  const fondo = e => {
    const ancestros = []; for (let n = e; n; n = n.parentElement) ancestros.unshift(n)
    return ancestros.reduce((color, n) => mezclar(parsear(getComputedStyle(n).backgroundColor), color), [255, 255, 255])
  }
  const luminancia = c => c.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0)
  const contraste = []
  for (const e of [...document.querySelectorAll('button,label,p,small,span,h1,h2,h3,li,input,select,textarea')].filter(visible)) {
    if (e.closest(':disabled') || !e.textContent.trim() || e.children.length || e.closest('svg')) continue
    const estilo = getComputedStyle(e), bg = fondo(e), fg = mezclar(parsear(estilo.color), bg)
    const l = [luminancia(fg), luminancia(bg)].sort((a, b) => b - a)
    const ratio = (l[0] + .05) / (l[1] + .05)
    const grande = parseFloat(estilo.fontSize) >= 24 || (parseFloat(estilo.fontSize) >= 18.66 && Number(estilo.fontWeight) >= 700)
    if (ratio + .01 < (grande ? 3 : 4.5)) contraste.push({ texto: e.textContent.trim().slice(0, 90), clase: e.className, ratio: +ratio.toFixed(2), color: estilo.color, fondo: bg })
  }
  const desbordesInternos = [...document.querySelectorAll('dialog[open],.panel-derecho,.contenido-panel,.proveedor-detalle,.acciones-cabecera')].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 2).map(e => ({ clase: e.className, ancho: e.clientWidth, contenido: e.scrollWidth }))
  return { sinNombre, contraste, desbordesInternos, desborde: document.documentElement.scrollWidth > innerWidth, dpr: devicePixelRatio, ancho: innerWidth, alto: innerHeight }
}
