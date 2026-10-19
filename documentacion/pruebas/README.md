# Informes de pruebas

Esta carpeta contiene documentación Markdown versionada: informes, planes, pendientes y ejemplos de reporte. Las carpetas por fecha conservan el contexto de cada sesión; los resultados históricos no equivalen a pruebas ejecutadas de nuevo.

## Organización

| Contenido | Ubicación | Git |
| --- | --- | --- |
| Informes, planes y pendientes | `documentacion/pruebas/<fecha>/*.md` | Se versionan. |
| Ejemplo documental de exportación | `2026-10-18/ejemplo-reporte-exportado.md` | Se conserva como ejemplo Markdown de datos ficticios. |
| Entrada sintética reproducible | `tests/fixtures/tienda-prueba.md` | Se versiona como fuente de pruebas. |
| Proyectos `.vbdproj`, JSON, imágenes, diagramas exportados y logs | `artefactos-locales/pruebas/<fecha>/` | Se conservan localmente y se ignoran. |
| Capturas de comprobación de la guía | `artefactos-locales/pruebas/2026-10-18/capturas-guia/` | Se ignoran. |
| Código de pruebas automatizadas | `src/**/*.test.ts` y `tests/integracion/` | Se versiona. |

Las rutas de la tabla se expresan desde la raíz del repositorio, salvo el ejemplo relativo a esta carpeta. `.gitignore` impide incorporar nuevas evidencias no Markdown dentro de `documentacion/pruebas/`, además de ignorar `artefactos-locales/`.

Los informes identifican las evidencias locales mediante nombres de archivo, sin enlazar imágenes o resultados que no estarán disponibles al clonar el repositorio. Los recursos necesarios para la aplicación y la guía, como iconos y favicon, sí son parte del producto y se versionan.

Para futuras pruebas manuales, elige el destino `artefactos-locales/pruebas/<fecha>/` al guardar proyectos o exportaciones. El ensayo optativo de Ollama ya escribe allí automáticamente, usando la fecha local de ejecución. No se incluye esa carpeta en commits.
