# Informes de pruebas

Esta carpeta contiene documentación Markdown versionada: informes, planes, pendientes y ejemplos de reporte. Las carpetas por fecha conservan el contexto de cada sesión; los resultados históricos no equivalen a pruebas ejecutadas de nuevo.

## Estado vigente — 19 de octubre de 2026

- [Pendientes priorizados](../pendientes.md): mejoras, exclusiones y criterios de cierre.
- [Informe de los doce puntos](2026-10-19/informe-pendientes.md): ocho resueltos en su alcance, dos abiertos y dos excluidos.
- [Correcciones y pruebas finales](2026-10-19/correcciones-contrato-y-pruebas.md): contrato JSON, 176 pruebas, quince grupos Electron y dos relanzamientos; recorridos reales Mistral y Flash Lite.
- [Controles, accesibilidad y rendimiento](2026-10-19/cierre-7-8-9-11.md): límites concretos del cierre básico.
- [Diagnóstico previo de proveedores](2026-10-19/diagnostico-proveedores.md): situación anterior a las correcciones, no estado actual del contrato.

Las pruebas reales guardaron una aclaración revisada con Mistral y un rechazo con Flash Lite. Falta certificar una modificación correcta de negocio generada y aprobada con cada proveedor. Los 503 siguen dependiendo del servicio.

## Organización

| Contenido | Ubicación | Git |
| --- | --- | --- |
| Informes, planes y pendientes | `documentacion/pruebas/<fecha>/*.md` | Se versionan. |
| Ejemplo documental de exportación | `2026-10-18/ejemplo-reporte-exportado.md` | Se conserva como ejemplo Markdown de datos ficticios. |
| Entrada sintética reproducible | `tests/fixtures/tienda-prueba.md` | Se versiona como fuente de pruebas. |
| Proyectos `.vbdproj`, JSON, imágenes, diagramas exportados y logs | `artefactos-locales/pruebas/<fecha>/` | Se conservan localmente y se ignoran. |
| Capturas de comprobación de la guía | `artefactos-locales/pruebas/2026-10-18/capturas-guia/` | Se ignoran. |
| Código de pruebas automatizadas | `src/**/*.test.ts`, `tests/integracion/` y `tests/e2e/` | Se versiona. |

Las rutas de la tabla se expresan desde la raíz del repositorio, salvo el ejemplo relativo a esta carpeta. `.gitignore` impide incorporar nuevas evidencias no Markdown dentro de `documentacion/pruebas/`, además de ignorar `artefactos-locales/`.

Los informes identifican las evidencias locales mediante nombres de archivo, sin enlazar imágenes o resultados que no estarán disponibles al clonar el repositorio. Los recursos necesarios para la aplicación y la guía, como iconos y favicon, sí son parte del producto y se versionan.

Para futuras pruebas manuales, elige el destino `artefactos-locales/pruebas/<fecha>/` al guardar proyectos o exportaciones. El ensayo optativo de Ollama ya escribe allí automáticamente, usando la fecha local de ejecución. No se incluye esa carpeta en commits.
