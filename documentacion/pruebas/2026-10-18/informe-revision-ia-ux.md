# Informe de revisión con IA y experiencia Actual/Propuesto

Fecha: 18 de octubre de 2026, hora de Ciudad de México. Las marcas UTC de las respuestas pueden corresponder al 19 de octubre.

## Resultado principal

Se completó una revisión real con Gemini desde la aplicación abierta. Generó tres propuestas nuevas y se aplicó y guardó correctamente una que añadió seis dependencias funcionales como reglas de negocio. Sin embargo, la aprobación de una propuesta nueva sobre atributos falló: la aplicación indicó que no existían ocho atributos que sí estaban presentes. Este defecto bloquea parte del recorrido principal y tiene prioridad sobre los ajustes visuales.

La comparación Actual/Propuesto modifica el lienzo, pero el inspector continúa mostrando los datos actuales y conserva controles de edición. Además, el cambio de reglas no dispone de un desglose antes/después y las alertas extensas comprimen el botón Cerrar hasta dividirlo en letras.

No se modificó código de la aplicación en este ciclo. Se realizaron pruebas sobre una copia y se documentó el plan de corrección.

## Alcance y evidencia

- Aplicación Electron en Windows, maximizada, tema oscuro; interacción real mediante la interfaz nativa.
- Caso de tienda: Cliente, Pedido, Producto y LineaPedido; cuatro entidades, quince atributos y tres relaciones.
- Proveedor activo observado: Gemini; modelo mostrado en la interfaz: `gemini-3.8-flash`. No se modificaron credenciales ni ajustes de privacidad.
- Copia de prueba: `revision-comparacion-qa.vbdproj`, conservada ahora en `artefactos-locales/pruebas/2026-10-18/`. Los cambios de aprobación se realizaron en esta copia.
- Se contrastaron los resultados con el archivo guardado y con el código de comprobación, previsualización y presentación. No se inyectaron respuestas ni propuestas sintéticas.
- El atajo Ctrl+Shift+S guardó el archivo de origen antes de crear la copia; posteriormente Archivo → Guardar como sí abrió el diálogo y permitió aislar las pruebas. Por tanto, el origen recibió ese guardado inicial, pero las nuevas aprobaciones se hicieron en la copia.

No se repitió Ollama en este ciclo: la revisión real de Gemini permitió recorrer el flujo solicitado. La revisión estructurada local sigue pendiente; el informe anterior registró chat local exitoso con calidad semántica insuficiente y una revisión local que agotó 180 segundos. Tampoco se provocaron nuevos errores de autenticación, cuota o red: los errores reproducidos aquí fueron de aprobación dentro de la aplicación.

## Pruebas realizadas

| Prueba | Resultado | Evidencia y límite |
| --- | --- | --- |
| Generar revisión real con IA | Aprobada | Gemini respondió en aproximadamente 30 segundos y añadió tres propuestas; ninguna se aplicó automáticamente. No es una medición de rendimiento repetida. |
| Mostrar revisión en curso | Parcial | Se mostraron “Revisando con IA…” y “El agente está revisando…”. El detalle del panel quedó fuera de vista por el desplazamiento previo; una alerta antigua permaneció visible. |
| Comparar una propuesta de atributos | Parcial | Propuesto mostró bordes y marcas de cambio; Actual recuperó el diseño vigente. La previsualización no incrementó la versión. Faltan leyenda y valores antes/después. |
| Inspeccionar una entidad en Propuesto | Fallo | El lienzo mostraba cambios propuestos, pero Propiedades mostraba nulabilidad y unicidad actuales, como Desconocido. Los controles seguían habilitados; no se editó desde ese estado. |
| Aplicar propuesta previa de atributos | Fallo | Informó atributos inexistentes y conflictos con cambios anteriores. Se repitió con una propuesta recién generada para aislar el problema. |
| Aplicar propuesta nueva de atributos | Fallo reproducible | Sin ediciones del diseño entre generación y aceptación, informó ocho atributos inexistentes. Los ocho se verificaron presentes por entidad e ID en el archivo. |
| Previsualizar seis reglas nuevas | Parcial | Se pudo activar Propuesto, pero el lienzo no cambió y no apareció una comparación de las reglas. Un diagrama por sí solo no representa este cambio. |
| Aplicar propuesta de seis reglas | Aprobada | Las reglas pasaron de 4 a 10, la versión de 4 a 5 y el historial de 3 a 4 pasos. Se mostró confirmación y se guardó mediante Ctrl+S. |
| Estado posterior a aceptar | Parcial | La vista permaneció en Propuesto con el rótulo de borrador después de aplicar. La previsualización de una propuesta ya aplicada no constituye un antes/después histórico. |
| Propuesta de aclaración sin operaciones | Fricción | La propuesta sobre repetición de productos en un pedido tenía Operaciones (0), pero ofrecía Aceptar y Ver antes/después. No se aceptó ni rechazó. |
| Presentación de errores y éxito | Fallo visual | Los mensajes fueron visibles, pero el botón Cerrar se comprimió. El error extenso expuso IDs técnicos y persistió durante otra revisión exitosa. |
| Cambio entre pestañas del panel | Fricción | Se perdió el contexto de expansión de propuestas y el desplazamiento no resultó coherente con el contenido de la pestaña. |
| Guardar como con teclado | Fallo | Ctrl+Shift+S guardó directamente; Archivo → Guardar como abrió el diálogo esperado. |

Estado guardado de la copia: seis propuestas, tres aplicadas y tres pendientes; cuatro entidades, tres relaciones y diez reglas. La aplicación quedó en Actual. No se probaron deshacer la nueva aprobación ni rechazar propuestas en este ciclo.

## Hallazgos priorizados

### R1 — P1: identidad incorrecta de atributos al validar propuestas

La propuesta recién generada “Establecer no nulabilidad en claves primarias y foráneas obligatorias” contenía ocho operaciones `updateAtributo`. Todos los atributos existían: Cliente.cliente_id, Cliente.email, Pedido.pedido_id, Pedido.cliente_id, Producto.producto_id, Producto.sku, LineaPedido.pedido_id y LineaPedido.producto_id.

La causa se localizó en `src/renderer/src/domain/propuestas.ts`: el mapa de huellas indexa atributos mediante `atributo:<entidadId>:<atributoId>`, pero `afectadosDeOperaciones` conserva únicamente el último segmento como ID. `claveAfectado` reconstruye `atributo:<atributoId>`, que no coincide con el mapa. La comprobación concluye erróneamente que el atributo dejó de existir.

Debe corregirse la identidad conservando la comprobación de cambios reales y la compatibilidad de proyectos guardados. No conviene solucionar el fallo omitiendo la validación de huellas.

### R2 — P1: mezcla de datos actuales y propuestos

`Lienzo.tsx` proyecta las operaciones, mientras `PanelPropiedades.tsx` consulta el proyecto actual. La inconsistencia fue visible en nulabilidad y unicidad. Los controles de edición permanecen habilitados, lo que crea riesgo de modificar el diseño vigente mientras se interpreta que se está inspeccionando un borrador. No se ejecutó esa modificación durante la prueba.

### R3 — P2: comparación incompleta y estado posterior ambiguo

Las operaciones se presentan como nombres técnicos, sin los campos y valores concretos que cambiarán. Las reglas nuevas no tienen representación diferencial; los nombres de relación guardados tampoco se muestran en el lienzo. Después de aceptar, Propuesto continúa pareciendo un borrador pendiente.

La implementación de la previsualización captura errores y puede volver al diseño actual sin explicarlos. Aplicar de nuevo las operaciones sobre un diseño ya actualizado no sustituye una comparación histórica. Este último punto se obtuvo por lectura de código; no se provocó una segunda aplicación.

### R4 — P2: alertas difíciles de leer y sin contexto de operación

La alerta larga mezcla explicación e identificadores, domina el área inferior y estrecha Cerrar incluso en una ventana de 1920 × 1080. También se observó el botón dividido en el mensaje de éxito. El error anterior permaneció durante la carga y tras finalizar una revisión nueva, dificultando saber a qué acción pertenecía.

### R5 — P2: detalle extenso y pérdida de orientación

Las acciones de aprobación requieren bastante desplazamiento. Cambiar a Propiedades y volver a Revisión pierde el contexto de la propuesta. Al terminar la revisión, se activó Revisión aunque se había consultado Chat durante la espera. Conviene conservar selección, expansión y posición por pestaña, y anunciar el resultado sin quitar el foco de una tarea en curso.

### R6 — P2: Guardar como no funciona con su atajo

El manejador de Ctrl/Meta+S en `estado/tienda.tsx` no distingue Shift. La acción de menú funciona. Es una regresión de interacción concreta que debe cubrirse con una prueba de teclado.

### R7 — P2: distinguir recomendaciones, preguntas y cambios ejecutables

La propuesta de ambigüedad sin operaciones pide una decisión de negocio válida, pero los botones prometen aplicar o comparar un cambio inexistente. El resumen de Gemini afirma una base en Tercera Forma Normal mientras reconoce tipos, nulabilidad y dependencias sin confirmar. Eso no demuestra normalización: deben separarse hipótesis, evidencia verificable y preguntas pendientes.

## Fortalezas observadas

- Gemini pudo revisar el caso y producir operaciones estructuradas utilizables; las nuevas reglas se aplicaron y persistieron.
- La aprobación humana se conservó: generar y previsualizar no aplicó automáticamente los cambios.
- Actual/Propuesto es un punto de entrada comprensible y las marcas del lienzo ayudan a localizar entidades afectadas.
- Las propuestas incluyen fundamento, supuestos, preguntas y contrapartidas. La pregunta sobre varias líneas del mismo producto aporta valor para revisar la PK compuesta.
- El nombre del proyecto, guardado y panel lateral permiten continuar el caso sin reconstruirlo.

## Relación con el informe anterior

| Pendiente o resultado de informe-regresion.md | Situación actual |
| --- | --- |
| Generación real con Gemini | Verificada ahora; sustituye la limitación anterior de no haber obtenido una revisión exitosa. |
| Recorrido de aprobación de propuestas | Parcial: añadir reglas funciona; modificar atributos está bloqueado por R1. |
| Revisión estructurada y calidad de Ollama | Sigue pendiente; no se repitió esta vez. |
| Reimportar draw.io y renderizar Mermaid externamente | Sigue pendiente. |
| Teclado completo, ventana pequeña, modo claro y otros OS | Sigue pendiente; la muestra actual añade el fallo Ctrl+Shift+S, no certifica accesibilidad completa. |
| Posición de herramientas tras reiniciar y reintento recuperable | Sigue pendiente. |
| Prueba integrada automatizada | Sigue pendiente; debe incorporar comparación y aprobación. |
| Nombre persistente, importación, FK, normalización y geometría corregidos | Conservar como regresiones del ciclo anterior; no atribuir su validación completa a esta sesión. |

Los 89 tests, typecheck y build aprobados corresponden al informe anterior. No se repitieron en este ciclo de evaluación sin cambios de código. Tampoco se certifican todos los tipos de operación por haber aplicado correctamente `addRegla`.

## Próximo paso

Ejecutar, tras aprobar su alcance, el plan de `plan-mejoras-revision-ia-ux.md`: primero integridad de aprobación y separación Actual/Propuesto; después comparación, alertas y navegación; finalmente matriz de regresión y proveedores. No se requiere cambiar la stack ni añadir una biblioteca de UI.


## Ubicación de las evidencias

Tras organizar el repositorio, las salidas de esta sesión se conservan en `artefactos-locales/pruebas/2026-10-18/`, ignoradas por Git. Los nombres y rutas del relato describen el momento de la prueba, salvo los enlaces actualizados. La entrada reproducible está en `tests/fixtures/tienda-prueba.md`; el ejemplo Markdown exportado se conserva como `ejemplo-reporte-exportado.md`.
