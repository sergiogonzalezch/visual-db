# Documentación de Visual BD

Organizada el **19 de octubre de 2026**. Cada documento tiene una responsabilidad; los resultados de QA se publican una sola vez por fecha y los planes conservan su fecha de referencia.

| Qué necesitas | Fuente principal |
| --- | --- |
| Presentación, instalación y comandos rápidos | [README del proyecto](../README.md) |
| Uso, configuración, atajos, desarrollo y pruebas | [Instrucciones](INSTRUCCIONES.md) |
| Recorrido visual y mapa de 33 funciones | [Guía visual](guia/index.html) |
| Arquitectura y contratos técnicos | [Referencia técnica](guia/tecnica.html) |
| Detalle de formatos y límites de exportación | [Referencia técnica de exportación](tecnica/exportacion.md) |
| Trabajo vigente por prioridad | [Pendientes](pruebas/2026-10-19/pendientes.md) |
| Evidencia histórica por fecha | [Informes consolidados](pruebas/README.md) |
| Alcance y decisiones planificadas | [Planes](plans/README.md) |
| Recursos de marca | [Identidad visual](../resources/README.md) |

## Organización

```text
documentacion/
  README.md                   Índice; no duplica resultados ni manuales
  INSTRUCCIONES.md             Manual de uso y desarrollo
  tecnica/                    Referencias técnicas por funcionalidad
  guia/                       Guía visual y referencia técnica
  plans/<fecha>/              Planes y matrices de trabajo originales
  pruebas/<fecha>/informe.md   Un informe de auditoría y QA por día
  pruebas/2026-10-19/pendientes.md  Lista operativa vigente al cierre del día
```

Los informes distinguen diagnóstico, corrección y comprobación posterior. Sus pendientes son históricos; para decidir qué hacer ahora consulta `pruebas/2026-10-19/pendientes.md`. El ejemplo de reporte exportado del 18 de octubre se conserva aparte porque es una muestra del formato de salida, no un informe de QA.

Los proyectos, imágenes, respuestas de modelos, métricas y logs generados permanecen en `artefactos-locales/`, ignorado por Git. Las fuentes originales consolidadas se pueden consultar en el historial Git anterior a esta reorganización.
