# Correcciones de revisión con IA y segunda comprobación

Fecha: 18 de octubre de 2026, Ciudad de México.

## Resultado

Se corrigió el bloqueo de aprobación de atributos y se aplicó desde Electron la misma propuesta de ocho atributos que fallaba en la auditoría. Se guardó y recuperó al reiniciar la aplicación. La comparación ahora comparte su cálculo entre lienzo, inspector y desglose; el borrador es de solo lectura.

La revisión local real con `mistral:latest` terminó correctamente en aproximadamente 85 segundos. La nueva revisión de Gemini sobre el caso completo agotó los 180 segundos: se verificaron el error recuperable y la conservación del diseño. No se confunde este timeout con una generación exitosa; la propuesta de Gemini aplicada procede de la sesión anterior y se reutilizó deliberadamente para reproducir el defecto original.

## Cambios realizados

| Área | Corrección |
| --- | --- |
| Identidad de atributos | Los afectados conservan `entidadId`. Los proyectos anteriores recuperan el propietario desde las operaciones cuando la asociación es inequívoca; no se omiten huellas ni se escoge un atributo por coincidencia global. |
| Conflictos y aprobación | Se muestra la causa de incompatibilidad, se bloquea la aceptación cuando no corresponde y se recalculan propuestas desactualizadas tras aplicar. Se mantiene la aplicación atómica. |
| Actual / Propuesto | Una función común proyecta las operaciones. El inspector muestra valores propuestos, atributos, claves y extremos de relaciones sin controles de edición. Herramientas de creación, edición e historial quedan protegidas en Propuesto. |
| Comparación | Desglose Actual → Propuesto por campo, incluidas reglas y restricciones; referencias legibles cuando se conocen. Se muestran errores de previsualización. Las propuestas aplicadas no se vuelven a proyectar como borradores. |
| Lienzo | Nombres de relación al seleccionar y en título; elementos eliminados como entidades atenuadas; leyenda separa cambios de la marca de obligatoriedad. Tras aprobar se vuelve a Actual. |
| Navegación | Pestañas conservan componentes y desplazamiento; acciones de propuesta al inicio del detalle y adheridas al desplazamiento; filtro por estado y contadores. El resultado de IA deja de cambiar la pestaña elegida durante la espera. |
| Alertas | Botón Cerrar sin compresión; resumen y detalles desplegables para avisos largos; altura limitada, contraste semántico y roles de estado/error. Se retira el aviso previo al empezar una revisión nueva. |
| Aclaraciones | Sin operaciones: Marcar como revisada, sin cambiar diseño, versión ni historial. Se reutiliza el estado persistido `aceptada`, presentado como revisada. La comparación está deshabilitada. |
| Trabajo asíncrono | Una revisión activa por sesión; se conserva la instantánea del diseño enviado para comprobar conflictos. Cambiar de proyecto o descartar la respuesta invalida su incorporación. Descartar no garantiza detener la generación ni sus cargos en el servidor, y el mensaje lo explica. |
| Trazabilidad | Nuevas propuestas de revisión pueden registrar proveedor y modelo, además de la versión y fecha existentes. No se guardan claves ni endpoints en estos metadatos. Las anteriores muestran Origen no registrado. |
| Instrucciones a IA | Se exige distinguir evidencia de supuestos, no afirmar 3FN/BCNF sin información suficiente y preguntar antes de imponer restricciones no confirmadas. Esto orienta al modelo; no garantiza razonamiento correcto. |
| Teclado | Ctrl+Shift+S abre Guardar como; Ctrl+S conserva Guardar. |

Se mantuvieron stack y dependencias. Las ampliaciones de propuestas son campos opcionales compatibles con archivos previos; no se modificó el cifrado, las credenciales ni el proveedor activo. No se ejecutó commit ni push.

## Prueba manual en Electron

Archivo de salida: `revision-corregida-qa.vbdproj`. Origen: copia de la auditoría previa. No se aplicaron estas decisiones al archivo original del usuario.

1. Ctrl+Shift+S abrió el diálogo nativo y permitió guardar una nueva copia.
2. La propuesta original de ocho atributos se abrió y comparó. El inspector de Cliente mostró “Permite nulos: No” y “Único: Sí” para cliente_id; el estado Actual seguía sin modificar.
3. Al volver a Revisión se conservaron la tarjeta abierta y su posición.
4. Aceptar cambios aplicó los ocho atributos. La versión pasó de 5 a 6 y el historial de 4 a 5 pasos. La vista volvió a Actual; aceptar y comparar esa propuesta quedaron deshabilitados.
5. Se guardó y se comprobaron en el archivo los ocho valores `nulable: false`, con su unicidad correspondiente. Después de reiniciar Electron reaparecieron el nombre, las cuatro entidades, tres relaciones y versión 6.
6. Se solicitó otra revisión real con Gemini. Se pudo usar Chat durante la espera. Al agotarse el tiempo apareció “No se pudo completar la revisión”, con Reintentar revisión y Revisar proveedor y modelo. No se añadieron propuestas ni cambios estructurales.
7. La aclaración sobre repetición de productos mostró Marcar como revisada y comparación deshabilitada. Al marcarla, los pendientes pasaron de 1 a 0, manteniendo versión 6 e historial de 5 pasos. Se guardó.
8. Los avisos de éxito conservaron Cerrar en una sola línea. La comprobación cubrió tema oscuro y una ventana de aproximadamente 1426 × 893; no certifica todos los tamaños ni el tema claro.

Estado final del archivo: cuatro propuestas aplicadas, una aclaración revisada y una propuesta desactualizada; diez reglas; cuatro entidades y tres relaciones. La propuesta antigua quedó desactualizada por conflictos reales y no se forzó su aplicación.

## Prueba real de Ollama

Se consultó el catálogo local y se utilizó un modelo ya instalado, `mistral:latest`, sin descargar nada. El primer acceso desde el entorno aislado devolvió EACCES; la consulta con acceso permitido confirmó que el servidor estaba encendido. No fue una avería de Ollama.

El ensayo optativo `tests/integracion/ollama-real.test.ts` llamó al adaptador de producción mediante HTTP real, con una entidad Cliente, cliente_id con PK y email sin restricciones confirmadas. Se sustituyó únicamente el registro de consumo para no escribir en el historial personal; no se simularon fetch, catálogo, generación ni análisis de JSON. No se cambió la configuración de la aplicación.

Resultado guardado: `ollama-revision-real.json`, duración de generación 85223 ms. El modelo devolvió una propuesta de preguntas sobre nulabilidad, unicidad y multivalor de email, con operaciones vacías. No impuso restricciones ni inventó una certificación de normalización. La prueba confirma conexión, respuesta y estructura en este caso reducido; no valida todo el recorrido de Ollama por IPC/UI ni todos los modelos locales.

## Verificación automatizada

| Comprobación | Resultado |
| --- | --- |
| npm test | 99 pruebas aprobadas, 22 archivos; un ensayo de red optativo omitido en la ejecución normal. |
| Ollama optativo habilitado | 1/1 aprobado, HTTP real. |
| npm run typecheck | Aprobado; incluye procesos main/renderer y pruebas de integración. |
| npm run build | Aprobado; Electron reiniciado con la compilación actual. |

Regresiones añadidas: identidad nueva y heredada, atributos con mismo ID en entidades diferentes, conflictos reales, atributo eliminado e identidad ambigua, previsualización sin mutación, diferencias de reglas, rechazo de comparación de aplicadas, aclaración sin modificación y grupo de operaciones atómico ante un fallo posterior.

La nueva prueba integrada recorre importar Markdown → guardar → reabrir → comparar → aprobar → guardar → reabrir → exportar draw.io → reimportar entidades y relación. También comprueba la salida Mermaid como texto. Es una integración entre dominio, disco e importadores/exportadores; no un E2E automatizado de toda la interfaz.

## Archivos de implementación de este ciclo

- `src/renderer/src/domain/propuestas.ts`, `aprobacion.ts`, `comparacion.ts` y `comparacion.test.ts`.
- `src/renderer/src/estado/tienda.tsx`.
- `src/renderer/src/componentes/PanelRevision.tsx`, `PanelDerecho.tsx`, `PanelPropiedades.tsx`, `PropiedadesPropuestas.tsx`, `ComparacionPropuesta.tsx`, `Lienzo.tsx` y `Herramientas.tsx`.
- `src/renderer/src/App.tsx` y `estilos.css`.
- `src/main/ia/adaptador.ts`.
- `tests/integracion/recorrido-proyecto.test.ts`, `ollama-real.test.ts`, `tsconfig.tests.json`, `vitest.config.mts` y `package.json`.
- README y documentación de este informe.

El repositorio contiene cambios previos de exportación y correcciones anteriores; esta lista no atribuye todos los cambios pendientes de Git a esta sesión.

## Pendientes de la matriz amplia

Las correcciones de los defectos reproducidos están implementadas. Quedan verificaciones que no pueden darse por cerradas con esta muestra: macOS/Linux, tema claro y accesibilidad completa, renderizado Mermaid en otra herramienta, ida y vuelta de draw.io en diagrams.net, todos los tipos de operación IA y carga con diagramas grandes.

La protección frente a respuestas tardías y la acción de descartar están implementadas, pero necesitan un ensayo determinista de concurrencia a través de IPC/UI. La disponibilidad y latencia de Gemini siguen siendo externas. La revisión local del caso grande tampoco se certifica por haber pasado el caso reducido.

Para probar manualmente después: abrir el archivo de regresión, consultar la propuesta desactualizada y su motivo, revisar reglas, comparar una propuesta nueva que añada reglas, verificar la leyenda y valores del inspector, guardar/reabrir y ejecutar el mismo caso con otro proveedor cuando esté disponible.


## Ubicación de las evidencias

Tras organizar el repositorio, las salidas de esta sesión se conservan en `artefactos-locales/pruebas/2026-10-18/`, ignoradas por Git. Los nombres y rutas del relato describen el momento de la prueba, salvo los enlaces actualizados. La entrada reproducible está en `tests/fixtures/tienda-prueba.md`; el ejemplo Markdown exportado se conserva como `ejemplo-reporte-exportado.md`.
