# Plan consolidado de mejoras: revisión con IA y UX

> Informe histórico del 18 de octubre. Consulta los [pendientes vigentes](../../pendientes.md) y las [correcciones y pruebas del 19 de octubre](../2026-10-19/correcciones-contrato-y-pruebas.md); este documento conserva sus resultados originales.

Fecha: 18 de octubre de 2026. Estado: correcciones autorizadas e implementadas en el ciclo posterior. Consulta `informe-correcciones-revision.md` para resultados y verificaciones aún pendientes; la matriz original se conserva como referencia de alcance.

## Objetivo y fuentes

Completar un recorrido confiable: revisar reglas o solicitar revisión con IA → comprender el resultado → comparar cambios → aprobar o resolver preguntas → verificar el diseño guardado.

Fuentes: `informe-revision-ia-ux.md` de esta sesión e `informe-regresion.md` del ciclo anterior. El primero documenta una generación real de Gemini y una aprobación de reglas exitosa, pero también el bloqueo de atributos y las inconsistencias de comparación. El segundo aporta pendientes de Ollama, exportaciones, accesibilidad y regresión integrada.

Se conservarán las funciones actuales, la aprobación humana y la stack. No se propone reescribir proveedores ni persistencia. Si la corrección de identidad o la trazabilidad exige ampliar el formato persistido, se explicará el cambio y su compatibilidad antes de implementarlo; no se reiniciarán credenciales ni proyectos.

## Prioridades y etapas

El tamaño S/M/L expresa alcance relativo, no una fecha comprometida. Cada etapa termina con evidencia revisable y pruebas específicas antes de pasar a la siguiente.

| Etapa | Prioridad / tamaño | Trabajo | Criterio para cerrar |
| --- | --- | --- | --- |
| 1. Integridad de propuestas | P1 / M | Corregir la identidad de atributos y la comprobación de huellas; tratar proyectos previos; comprobar aplicabilidad antes de aceptar; mantener aplicación atómica. | La propuesta nueva de ocho atributos se aplica si el diseño no cambió; un conflicto real se bloquea con causa precisa; no aparecen cambios parciales ni se omite la validación. |
| 2. Actual y Propuesto coherentes | P1 / M | Separar el modelo vigente del modelo proyectado; inspector de propuesta de solo lectura; selección y etiquetas claras; tratamiento explícito de errores de previsualización. | Lienzo e inspector muestran los mismos valores. Previsualizar no cambia versión, historial ni guardado. No se puede editar accidentalmente el diseño actual desde el borrador. |
| 3. Comparación comprensible | P2 / L | Desglose por entidad/campo y regla con Antes → Después; nombres legibles; leyenda de añadidos/modificados/eliminados; resumen de impactos; cierre correcto tras aceptar. | Una propuesta de reglas muestra sus seis incorporaciones aunque el gráfico no cambie. Una de atributos muestra nulabilidad/unicidad exactas. Después de aceptar se identifica inequívocamente el estado aplicado. |
| 4. Mensajes y navegación | P2 / M | Alertas con contexto, cierre estable y detalles desplegables; progreso accesible; acciones visibles; conservación de posición y selección; atajo Guardar como. | Ningún mensaje comprime Cerrar. El resultado pertenece a una operación identificable. Cambiar de pestaña conserva contexto y Ctrl+Shift+S abre Guardar como. |
| 5. Calidad de revisión y proveedores | P2 / M | Diferenciar preguntas de operaciones; evidencia frente a hipótesis; ejecutar revisión estructurada local y ensayos de recuperación; trazabilidad de generación. | Gemini y un modelo local instalado recorren el caso reducido o presentan un límite reproducible; no se certifica normalización con información insuficiente; una pregunta sin operaciones no simula una aplicación estructural. |
| 6. Regresión completa | P2 / L | E2E del proyecto, intercambio de exportaciones, accesibilidad, temas, tamaños y plataformas; conservar las correcciones previas. | Se completa la matriz inferior con evidencia y límites explícitos. Los casos pendientes no se califican como aprobados por inferencia. |

## Etapa 1: aprobación segura

Áreas previstas: `domain/propuestas.ts`, `domain/aprobacion.ts`, sus pruebas y el estado de aprobación del panel.

1. Usar una identidad consistente para atributo y entidad en generación, serialización y consulta de huellas. Evitar claves ambiguas o pérdida del identificador de entidad.
2. Definir compatibilidad para propuestas guardadas con la representación anterior. Si una identidad no puede recuperarse con certeza, explicar por qué se requiere regenerar esa propuesta; no invalidar todas ni saltar controles.
3. Validar dependencia, estado y huella antes de habilitar Aceptar. La comprobación definitiva seguirá ocurriendo al aplicar, porque el diseño puede cambiar después de renderizar el botón.
4. Mantener la operación atómica: ante un error se conserva diseño, reglas, versión e historial. Traducir entidad/atributo a nombres visibles y dejar IDs en detalles técnicos.
5. Cubrir atributo existente, eliminado, modificado, ID repetido entre entidades, propuesta heredada y grupo de operaciones con un fallo intermedio. Comprobar también `addAtributo` y `removeAtributo`, afectados por el mismo contrato de identidad.

Puerta de salida: reproducir el caso real que hoy falla y demostrar tanto aceptación válida como rechazo de un conflicto genuino.

## Etapas 2 y 3: experiencia de comparación

Propuesta de organización:

- Cápsula del lienzo: Actual / Propuesto, acompañada del título de la propuesta seleccionada cuando corresponda.
- Panel: resumen del impacto y estado, seguido de una lista de cambios por elemento; cada campo incluye valor actual y valor propuesto. Fundamento, supuestos y detalles técnicos permanecen disponibles sin desplazar las acciones principales.
- Inspector en Propuesto: valores proyectados y aviso de solo lectura. “Volver a Actual para editar” conserva la selección.
- Cambios no gráficos: reglas, dependencias, unicidad, nulabilidad y claves disponen de comparación textual. El gráfico complementa el desglose; no lo sustituye.
- Leyenda visible para cambios; el color se acompaña con icono o texto. Incluir elementos eliminados en la comparación, aunque ya no estén en el modelo proyectado.
- Relaciones: permitir identificar sus nombres sin saturar el lienzo; evaluar etiqueta o detalle al seleccionar. Mantener cardinalidades legibles.
- Propuesta aplicada: volver a Actual con confirmación o mostrar una comparación histórica respaldada por una instantánea real. No recalcular un supuesto “antes” reaplicando operaciones al diseño posterior. Si no existe información histórica suficiente, explicarlo y deshabilitar esa comparación.
- Preguntas sin operaciones: presentar “Responder / Discutir / Marcar resuelta”, sujeto a definir el estado de resolución compatible. No ofrecer una vista de cambios inexistentes.

Pruebas de aceptación: modificar solo una propiedad; añadir reglas sin cambios gráficos; propuesta con altas y bajas; propuesta inválida; aplicada/rechazada/desactualizada; vuelta a Actual sin edición; selección del mismo elemento en ambas vistas. Inspeccionar cambios que alteren claves y relaciones, no solo atributos simples.

## Etapa 4: feedback, foco y accesibilidad

1. Sustituir el aviso extenso por un resumen útil y detalles expandibles. Dar espacio fijo mínimo al botón de cierre, permitir que el texto reduzca su ancho y limitar la altura con desplazamiento interno cuando haga falta.
2. Diferenciar éxito, error y advertencia con texto/icono y contraste. Asociar cada mensaje con su acción y proyecto. Archivar o retirar el error anterior al iniciar/completar otra operación sin perder el diagnóstico consultable.
3. Mostrar el estado de revisión junto al punto de entrada y en el panel sin depender de su desplazamiento. No inventar porcentajes de progreso. Evitar cambiar la pestaña o robar el foco cuando llega la respuesta.
4. Conservar propuesta expandida, selección y desplazamiento por pestaña; mantener acciones de comparación/aprobación accesibles sin recorrer todo el fundamento.
5. Revisar foco visible, orden de tabulación, activación por teclado, nombres accesibles y anuncios de estado. Verificar `aria-live` apropiado y cierre con teclado sin interceptar edición de texto.
6. Corregir Ctrl+Shift+S distinguiéndolo de Ctrl+S y probar equivalentes de la plataforma. Mantener Guardar y Guardar como en el menú.
7. Verificar panel sobre lienzo, barra de herramientas y cápsula en ventana pequeña y temas claro/oscuro. Centralizar ajustes en tokens existentes; evitar reglas CSS específicas duplicadas.

## Etapa 5: revisión fiable

Separar estados: sin revisión → solicitando → resultado con propuestas/preguntas, o error recuperable. Reintentar conserva el caso y muestra qué intento está activo.

Revisar por código y probar el caso de edición del diseño mientras la IA trabaja: la respuesta debe conservar la versión del diseño que recibió y detectar conflictos antes de aplicarse. Este riesgo se identificó por inspección; no se provocó durante la sesión actual. Evitar peticiones duplicadas y resultados tardíos de otro proyecto. Cualquier cancelación añadida debe impedir incorporar una respuesta cancelada, además de actualizar la UI.

Evaluar la necesidad de registrar proveedor, modelo, fecha y versión de origen por revisión. Antes de ampliar persistencia, definir lectura de archivos anteriores y ausencia de secretos en esa información.

Validar operaciones y referencias mediante el contrato existente y evaluar semántica: diferenciar una recomendación basada en un supuesto de una regla confirmada. No presentar 3FN/BCNF como demostradas si faltan tipos, dependencias o decisiones de negocio. No cambiar automáticamente la lógica del negocio para satisfacer una sugerencia.

Para Ollama: usar primero un caso pequeño y un modelo ya instalado adecuado para salida estructurada; medir duración, tamaño de contexto y resultado. No descargar modelos ni ampliar silenciosamente el timeout. Separar disponibilidad del servicio, respuesta JSON válida y calidad conceptual. El timeout anterior no demuestra por sí solo un defecto de hardware.

## Matriz consolidada de comprobación

| Grupo | Escenarios mínimos | Situación de partida |
| --- | --- | --- |
| IA real | Gemini y Ollama: solicitud, espera, respuesta estructurada, comparación, aceptación y guardado | Gemini genera y `addRegla` aplica; atributos fallan. Revisión Ollama pendiente. |
| Fallos de proveedor | Autenticación, 429, 503, timeout, JSON inválido; reintento y recuperación sin duplicar propuestas | Pendientes en este ciclo; usar respuestas controladas para regresión y un smoke real separado. |
| Conflictos | Atributo existente/modificado/eliminado; dependencia incumplida; cambio durante solicitud; cambio de proyecto; respuesta tardía | Fallo de identidad reproducido; resto necesita cobertura dirigida. |
| Comparación | Campos, reglas, FK, nombres, altas/bajas; Actual/Propuesto; propuesta aplicada y sin operaciones | Parcial y con inconsistencias observadas. |
| Proyecto | Nombre → importar → guardar → reabrir → revisar → comparar → aprobar → guardar → reabrir | Correcciones previas de nombre/importación; falta recorrido integrado automatizado. |
| Datos | PK compuesta, FK completa, ausencia de duplicados, referencias válidas; normalización con datos desconocidos | Mantener regresiones del último informe. |
| Exportación | Formatos existentes; coherencia de nombre y diseño; reimportar draw.io; renderizar Mermaid; comprobar PNG/SVG | Archivos generados previamente; intercambio externo pendiente. |
| UX | Alertas extensas, éxito/error, carga, vacío, sin propuestas; teclado y foco; tema claro/oscuro; ventana pequeña | Muestra actual en oscuro maximizado; cierre roto y contexto mejorable. |
| Preferencias | Posición de herramientas tras reiniciar, panel y vista sin estados engañosos | Reinicio de posición pendiente del informe anterior. |
| Plataformas | Windows, macOS y Linux: atajos, diálogos, escala y panel | Windows probado parcialmente; otros OS sin comprobar. |

Las pruebas automatizadas deben cubrir lógica y recorridos críticos con resultados deterministas; no deben depender todas de una cuenta o cuota externa. Los ensayos reales de proveedor se documentarán por separado y no sustituirán la evaluación semántica humana.

## Orden recomendado de entrega

Primera entrega pequeña: corregir R1 y añadir regresiones de identidad/conflictos. Segunda: separar inspector y previsualización, con comparación de reglas y atributos. Tercera: alertas, contexto del panel y atajos. Cuarta: preguntas, trazabilidad y trabajo asíncrono. Quinta: cerrar la matriz pendiente del informe anterior, incluida revisión local e intercambio de formatos.

En cada entrega: describir archivos cambiados, ejecutar pruebas proporcionales y repetir el recorrido afectado en la app. No considerar terminado el flujo de IA mientras una propuesta válida no pueda compararse, aprobarse y recuperarse al reabrir el proyecto.
