# Informes de pruebas

Un único informe consolidado por fecha, con las etapas de diagnóstico, correcciones y verificación identificadas. La consolidación del 19 de octubre es editorial: no representa una ejecución nueva ni cambia las cifras de cada ronda.

| Fecha de realización | Informe | Contenido |
| --- | --- | --- |
| 2026-10-18 | [Auditoría y correcciones](2026-10-18/informe.md) | Persistencia/proveedores, Foco, caso de tienda, regresión, Actual/Propuesto y aprobación. |
| 2026-10-19 | [Regresión y proveedores reales](2026-10-19/informe.md) | Doce puntos, controles semánticos, accesibilidad, carga, diagnóstico de APIs y contrato corregido. |

Los pendientes de estos informes describen su fecha de corte. La lista operativa actual está únicamente en [pendientes](../pendientes.md). Los planes se conservan en [plans](../plans/README.md).

## Fuentes y evidencias

| Contenido | Ubicación desde la raíz | Versionado |
| --- | --- | --- |
| Informe diario | `documentacion/pruebas/<fecha>/informe.md` | Sí |
| Ejemplo de reporte exportado | [2026-10-18/ejemplo-reporte-exportado.md](2026-10-18/ejemplo-reporte-exportado.md) | Sí; muestra de salida, no auditoría |
| Entrada sintética | `tests/fixtures/tienda-prueba.md` | Sí |
| Automatización | `src/**/*.test.ts`, `tests/integracion/`, `tests/e2e/` | Sí |
| Proyectos, JSON, diagramas, capturas, métricas y logs generados | `artefactos-locales/pruebas/` | No |

Los informes nombran evidencias locales sin enlazar resultados ausentes en un clon. `.gitignore` excluye `artefactos-locales/` y las nuevas evidencias no Markdown bajo esta carpeta; los recursos necesarios de la aplicación sí se versionan. Las pruebas reales pueden consumir cuota, a diferencia del proveedor controlado; procedimientos en [instrucciones](../INSTRUCCIONES.md).
