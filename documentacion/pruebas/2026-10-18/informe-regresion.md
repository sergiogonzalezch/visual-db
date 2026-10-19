# Informe actualizado de correcciones y pruebas — Visual BD

**Fecha:** 18 de octubre de 2026.

**Tipo:** implementación de correcciones y repetición de los recorridos afectados.

**Referencia:** [auditoría inicial](./informe-qa.md).

## Dictamen

Los problemas principales de importación, nombre del proyecto, clave compuesta, creación de FK y atajo de revisión quedaron corregidos y comprobados. Las exportaciones SVG, PNG, Mermaid y draw.io se guardaron desde una sesión actualizada. La inspección visual del PNG detectó un solapamiento adicional; se corrigió y se volvió a exportar con las tablas separadas y los tres conectores visibles.

La generación con IA sigue teniendo limitaciones verificadas: Gemini respondió con errores del proveedor o de acceso al modelo; Ollama respondió al chat, pero su revisión estructurada agotó el tiempo de espera y la respuesta de chat tuvo errores conceptuales. **La conexión funciona, pero todavía no puede darse por validado el recorrido de revisión, propuestas y aprobación con ambos proveedores.**

Verificación técnica: **89 pruebas aprobadas en 20 archivos**, comprobación de tipos aprobada para main y renderer y compilación de producción completada.

## Entorno y método

- Windows, Electron, Visual BD 0.1.0; sesiones iniciadas desde la compilación actual mediante `npm start`.
- Interacción real con la aplicación y diálogos nativos mediante la habilidad computer-use.
- Pruebas con el fixture ficticio [tienda-prueba.md](../../../tests/fixtures/tienda-prueba.md), sin datos reales de negocio.
- Gemini: URL oficial compatible con OpenAI, credencial guardada existente y catálogo accesible. No se reveló, copió ni reemplazó la clave durante la prueba.
- Ollama: servidor existente en `http://127.0.0.1:11434`; cinco modelos listados; utilizado `llama3.2:latest`.
- Se reinició la aplicación para alinear main, preload y renderer. El guardado y la reapertura se comprobaron también mediante lectura del archivo generado.
- No se modificó la stack, no se añadieron dependencias de UI y no se generó SQL ni se aplicaron cambios propuestos por IA.

La comprobación cubre los flujos afectados y una muestra real de IA; no certifica todas las funciones, plataformas, condiciones de red o tamaños de ventana.

## Correcciones implementadas

| Área | Cambio | Resultado comprobado |
| --- | --- | --- |
| Nombre del proyecto | Campo editable en cabecera, hasta 120 caracteres; marca cambios pendientes y conserva el nombre en el proyecto | Se guardó y restauró «Tienda QA — Gemini y Ollama» tras reiniciar |
| Validación del nombre | Guardar y Guardar como bloquean un nombre vacío o compuesto solo por espacios | Nombre vacío + Ctrl+S mostró «Escribe un nombre para el proyecto antes de guardar», sin guardar el nombre vacío |
| Importación Markdown | Se separan entidades y cardinalidad antes de procesar la relación | Los tres extremos del fixture se importaron correctamente |
| Resolución de nombres | Se retiró la coincidencia parcial automática de extremos | Un destino no resuelto exactamente se registra como ambigüedad; cubierto por prueba de regresión |
| Cardinalidades | Se reconoce correctamente el máximo n y el mínimo de intervalos como 1..n | El proyecto conserva 1, 0..n y 1..n del fixture |
| Clave primaria compuesta | Las marcas PK de una entidad se agrupan en una restricción | LineaPedido tiene una PK con pedido_id y producto_id |
| Atajos | Ctrl+R se conserva para revisar; recarga pasa a Ctrl+Shift+R | Ctrl+R inició la revisión sin recarga ni recuperación |
| FK desde relación | Se selecciona la PK destino y se reutilizan o crean columnas para completar el mapeo | Pedido reutilizó cliente_id y apuntó a la PK de Cliente |
| FK desde formulario | Requiere seleccionar una clave primaria/candidata y usa la misma utilidad de mapeo | Tipos y pruebas de la utilidad aprobados; esta variante de formulario no se repitió íntegramente en UI |
| Duplicación de FK | Se rechaza un mapeo idéntico ya existente | Segundo clic mostró «Esta clave foránea ya existe», sin añadir otra |
| Archivos antiguos | La validación identifica FK vacías y múltiples PK separadas | Prueba de regresión para FK incompleta aprobada; no se migran ni corrigen datos antiguos automáticamente |
| Normalización | Un nivel superior no queda verificado si falta verificar un prerrequisito | Revisión local mostró 1FN, 2FN, 3FN y BCNF con información insuficiente en este caso incompleto |
| Desconocidos | Se explica la diferencia entre desconocidos registrados en importación y campos pendientes detectados por reglas | Texto aclaratorio añadido; la revisión real detectó 66 elementos desconocidos |
| Errores de IA | Se elimina el envoltorio técnico de IPC de los errores nuevos y del historial visible | Los errores de Gemini y Ollama aparecieron con mensajes comprensibles |
| Reintento | Se incorporaron acciones para reintentar revisión y último mensaje | Implementado; no se afirma éxito de generación por la existencia del botón |
| Contenido estructurado en chat | El bloque de propuestas emitido como texto se presenta desplegable y marcado como no aplicado | Compilado; su presentación final no se volvió a inspeccionar directamente en la pestaña Chat tras el último reinicio |
| Mensaje de conexión | Se elimina el nombre de modelo vacío del feedback del catálogo | Se observó un mensaje de catálogo sin «modelo «»» |
| Contexto de avisos | Al cargar otro chat/proyecto se limpia el aviso anterior | Implementado para evitar conservar avisos de recuperación de otro proyecto |
| Orientación del lienzo | Nueva acción «Ajustar al contenido» y margen inicial para no tapar Cliente con herramientas | Encuadre probado con inspector abierto; las cuatro entidades quedaron visibles |
| Herramientas | Se conserva la posición como preferencia visual local, con control de límites | Implementado; no se repitió una prueba específica de arrastrar y reiniciar en la versión final |
| Historial | Las ediciones de descripción de entidad usan el nombre en lugar del ID cuando está disponible | Implementado y tipado; no se reejecutó esa descripción concreta en UI |
| Gráficos | Se separan tablas ensanchadas por sus etiquetas y se desvía un conector horizontal que cruza otra tabla | PNG final inspeccionado visualmente; regresión automatizada aprobada |

Las adaptaciones gráficas afectan a la copia exportada, no a las posiciones ni a las relaciones del proyecto. Las correcciones de integridad afectan a nuevas operaciones; los archivos anteriores se conservan y se señalan cuando requieren revisión.

## Caso de BD y evidencias de persistencia

Archivo final: `tienda-regresion.vbdproj` (evidencia local no versionada).

| Dato persistido | Valor comprobado |
| --- | --- |
| Nombre | Tienda QA — Gemini y Ollama |
| Versión del diseño | 2 |
| Entidades | 4 |
| Atributos | 15 |
| Relaciones | 3 |
| Reglas de negocio | 4 |
| Mensajes de chat | 6 |
| FK añadida manualmente | Pedido.cliente_id → PK de Cliente |

Relaciones comprobadas en el archivo:

```text
Cliente   → Pedido
Pedido    → LineaPedido
Producto  → LineaPedido
```

LineaPedido guarda una sola clave primaria con dos IDs de atributos. La FK de Pedido guarda un atributo origen, el ID de la entidad Cliente, el ID de su clave primaria y el ID de la relación. No quedó como una FK vacía.

El caso contiene información deliberadamente desconocida —tipos, nulabilidad, participación y otras decisiones— para comprobar cómo comunica la aplicación la incertidumbre. **No es un esquema terminado para ejecutar en un motor DB.**

## Resultado de IA remota: Gemini

| Operación | Modelo | Resultado real |
| --- | --- | --- |
| Conexión y listado | Catálogo del proveedor | Correcto; 63 modelos accesibles en la lista |
| Revisión por Ctrl+R | gemini-3.8-flash | HTTP 503; la ventana no se recargó y el diseño siguió editable |
| Revisión con alternativa del catálogo | gemini-2.5-flash | Respuesta clasificada por la aplicación como modelo no disponible para nuevos usuarios de la cuenta |

El cambio de cuenta comunicado por el usuario se respetó utilizando la credencial guardada. No se verificó la identidad de la cuenta ni se inspeccionó la clave secreta.

**Conclusión:** no se reprodujo pérdida de credenciales. Los resultados observados corresponden a disponibilidad o acceso a generación; listar modelos no demuestra que la cuenta pueda utilizarlos. No se obtuvo una revisión correcta ni propuestas reales de Gemini. El chat remoto no se volvió a ejecutar en este ciclo; sí quedó documentado el fallo de chat remoto en la auditoría inicial.

Después de las pruebas se seleccionó nuevamente el modelo original `gemini-3.8-flash` en Gemini. La configuración local de Ollama quedó conservada por separado. No se activó ni desactivó la opción de privacidad Solo local durante la prueba.

## Resultado de IA local: Ollama

| Operación | Resultado real |
| --- | --- |
| Conectar a servidor | Correcto |
| Consultar modelos instalados | Correcto; cinco entradas |
| Seleccionar modelo | llama3.2:latest activado desde la UI |
| Revisión estructurada del diseño | Alcanzó el timeout configurado de 180 segundos |
| Chat breve sobre LineaPedido | Respondió y se guardó en el proyecto |
| Aplicación de cambios de IA | Ninguno |

Solicitud del chat:

> Prueba QA con datos ficticios. Resume en dos frases para qué sirve LineaPedido y su clave compuesta. No generes propuestas ni SQL.

La respuesta afirmó que LineaPedido relacionaba pedidos con clientes, en lugar de explicar correctamente el enlace entre pedidos y productos mediante las líneas. También incluyó un bloque XML de propuestas pese a la instrucción de no hacerlo. No se interpretó como una propuesta aplicable ni se modificó el diseño.

**Conclusión:** la integración local pudo completar una generación de chat. La precisión conceptual de esa respuesta fue insuficiente y la revisión estructurada no se completó dentro del límite. No se atribuye el timeout a una causa específica de hardware sin una medición que lo demuestre. Queda pendiente probar un modelo local más adecuado para salida estructurada o evaluar límites/contexto con mediciones.

## Exportaciones repetidas

Los cuatro formatos que fallaron en la instancia anterior se guardaron correctamente después de iniciar una sesión actualizada:

| Archivo | Verificación |
| --- | --- |
| `regresion.svg` (evidencia local no versionada) | Guardado desde UI; archivo existente |
| `regresion.png` (evidencia local no versionada) | Guardado desde UI; inspección visual detectó solapamientos en esta primera salida |
| `regresion.mmd` (evidencia local no versionada) | Guardado desde UI; contiene las tres relaciones, sin avisos de omisión por cardinalidad desconocida |
| `regresion.drawio` (evidencia local no versionada) | Guardado desde UI; archivo existente; no se abrió en diagrams.net ni se reimportó en este ciclo |
| `regresion-final.png` (evidencia local no versionada) | Exportado otra vez tras corregir geometría y crear la FK; inspección visual final aprobada |

La salida final muestra las cuatro tablas separadas, la FK en Pedido y el conector Pedido → LineaPedido desviado por arriba de Producto. El título conserva el nombre del proyecto.

Evidencia visual local: `artefactos-locales/pruebas/2026-10-18/regresion-final.png` (no versionada).

El rechazo anterior de todos los formatos gráficos desapareció con una sesión alineada con la compilación actual. Esto es consistente con una instancia desactualizada; no se capturó su payload IPC original, por lo que no se presenta como una causa raíz demostrada al cien por cien. La nueva corrección geométrica sí corresponde a un defecto visual observado y reproducido en la salida PNG.

## Verificación automatizada

| Comando | Resultado |
| --- | --- |
| npm test | 89/89 pruebas; 20/20 archivos |
| npm run typecheck | Aprobado en main y renderer |
| npm run build | Aprobado; compilación final iniciada y utilizada en la comprobación de FK y PNG |

Se añadieron regresiones para extremos de relaciones, cardinalidades entre paréntesis, PK compuesta, nombres parcialmente coincidentes, mapeo de FK, FK heredadas incompletas y separación de tablas/conectores. Se reforzó la aserción del estado 2FN con información incompleta.

No se añadieron dependencias. Las pruebas no garantizan calidad de razonamiento de los modelos ni disponibilidad de servicios externos.

## Archivos de código modificados en este ciclo

| Grupo | Archivos |
| --- | --- |
| Nombre, guardado y estados | src/renderer/src/estado/tienda.tsx; componentes/Cabecera.tsx; estilos.css |
| Importación | src/renderer/src/importadores/markdown.ts; borrador.ts; markdown.test.ts |
| FK y validación | src/renderer/src/domain/clave-foranea.ts y su test; validacion.ts y su test; componentes/PanelPropiedades.tsx |
| Normalización | src/renderer/src/domain/normalizacion.ts; normalizacion.test.ts |
| Atajo y feedback del proveedor | src/main/index.ts; src/main/ia/openai.ts |
| Mensajes y reintentos | src/renderer/src/componentes/PanelChat.tsx; PanelRevision.tsx |
| Orientación y herramientas | src/renderer/src/componentes/Lienzo.tsx; Herramientas.tsx; estado/usePanelArrastrable.ts |
| Salida gráfica | src/renderer/src/exportadores/graficos.ts; diagramas.test.ts |
| Documentación | README.md; documentacion/exportacion.md; este informe |

El repositorio ya tenía cambios de la implementación de exportación antes de este ciclo. La lista anterior describe las correcciones actuales; no atribuye todos los cambios pendientes de Git a esta auditoría. No se realizó commit ni push en este ciclo.

## Feedback actualizado y pendientes

**Fortalezas:** nombre persistente y visible, importación más segura, FK completa y reversible, separación de revisiones, errores comprensibles y exportación gráfica utilizable. El caso se recupera al reiniciar con su nombre y conversación; la IA no aplicó cambios de forma automática.

**Limitaciones:** no hubo revisión generativa exitosa en este ciclo; los formatos intercambiables no se validaron de ida y vuelta en aplicaciones externas; sigue siendo costoso completar muchos atributos individualmente. El resultado de un modelo local pequeño requiere revisión humana.

Antes de dar por cerrado un lanzamiento conviene completar:

1. Gemini: una generación real con un modelo habilitado para la cuenta y un recorrido completo de propuestas/aprobación.
2. Ollama: revisión estructurada exitosa y evaluación semántica de sus sugerencias.
3. Reimportación de draw.io y renderizado Mermaid externo.
4. Navegación completa por teclado, ventana pequeña y modo claro; pruebas en macOS y Linux.
5. Regresión de la preferencia de posición de herramientas tras reiniciar y del botón de reintento bajo un fallo recuperable.
6. Una prueba integrada automatizada que cubra nombre → importar → guardar → reabrir → exportar, además de las pruebas unitarias actuales.

El programa quedó abierto con el caso de prueba guardado. Los fallos de datos prioritarios de esta muestra están corregidos; los resultados de IA quedan documentados con sus límites, sin calificarlos como aprobados cuando no lo fueron.


## Ubicación de las evidencias

Tras organizar el repositorio, las salidas de esta sesión se conservan en `artefactos-locales/pruebas/2026-10-18/`, ignoradas por Git. Los nombres y rutas del relato describen el momento de la prueba, salvo los enlaces actualizados. La entrada reproducible está en `tests/fixtures/tienda-prueba.md`; el ejemplo Markdown exportado se conserva como `ejemplo-reporte-exportado.md`.
