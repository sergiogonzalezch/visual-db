# Documentación de Visual BD

Estado actualizado: **19 de octubre de 2026**. La IA propone; el usuario decide. La aplicación modela y documenta bases relacionales, sin ejecutar SQL ni generar ORM/NoSQL.

## Recorrido de lectura

| Necesidad | Documento |
| --- | --- |
| Comenzar y conocer el proyecto | [README principal](../README.md) |
| Aprender el flujo con ejemplos y animaciones | [Guía visual](guia/index.html) |
| Consultar funciones, IPC y arquitectura | [Referencia técnica](guia/tecnica.html) |
| Usar, configurar, desarrollar y probar | [Instrucciones](INSTRUCCIONES.md) |
| Entender formatos y límites de intercambio | [Exportación](exportacion.md) |
| Consultar trabajo pendiente y prioridades | [Pendientes actuales](pendientes.md) |
| Revisar evidencia de correcciones | [Índice de pruebas](pruebas/README.md) |

## Mapa de funciones

1. **Proyecto:** crear, nombrar, abrir, guardar, recuperar y conservar chat por proyecto.
2. **Importación:** interpretar draw.io, Markdown o imagen; revisar el borrador antes de incorporarlo.
3. **Modelado:** entidades, atributos, claves, relaciones, cardinalidades, reglas y notas; herramientas flotantes, encuadre y deshacer/rehacer.
4. **Revisión de reglas:** análisis determinista local, hallazgos y preguntas ante información desconocida.
5. **Proveedores:** credencial cifrada por proveedor → conectar → catálogo → elegir modelo. Catálogo accesible no certifica generación.
6. **Revisión por IA:** respuesta estructurada → validación del contrato → propuestas y riesgos → comparación Actual/Propuesto → confirmar y aplicar, rechazar o discutir. Las aclaraciones sin operaciones se marcan como revisadas.
7. **Seguimiento:** historial del diseño, chat contextual y registro orientativo de consumo.
8. **Entrega:** guardar `.vbdproj` para seguir editando; exportar Markdown/JSON y diagramas para compartir lógica y estructura.

La guía visual comparte un catálogo de 33 funciones con la referencia técnica. No se conecta a servicios ni accede a credenciales.

## Estado verificado y límites

176 pruebas deterministas aprobadas, tipado y build correctos. La regresión Electron aprobó quince grupos y dos relanzamientos: concurrencia, aprobación conocida, persistencia, errores recuperables, teclado, contraste claro/oscuro y carga de 500 entidades.

Mistral y Gemini Flash Lite completaron recorridos reales de revisión, decisión, guardado y reapertura. Se comprobó una aclaración revisada con Mistral y el rechazo persistido de una propuesta de Flash Lite. **No se certificó una modificación correcta de negocio generada y aprobada por cada proveedor.** La calidad conceptual y disponibilidad siguen siendo variables; el modelo Gemini 3.8 Flash configurado respondió 503 en las inspecciones.

## Documentos de diseño e históricos

- [Plan original de producto](plan-aplicacion-visual-bases-de-datos.md): referencia de diseño, no estado actual de implementación.
- [Auditoría inicial y evolución](auditoria-mejoras.md).
- [Interfaz Foco](foco-ui.md).
- [Plan de exportación](plan-exportacion.md): etapas 1–5 implementadas; verificación externa pendiente.
- Informes en `pruebas/<fecha>/`: instantáneas de cada ejecución. Los datos originales no se reescriben como si fueran pruebas nuevas.

Los Markdown y scripts de prueba se versionan. Las capturas, respuestas de modelos, proyectos de QA y demás salidas permanecen en `artefactos-locales/`, ignorado por Git.
