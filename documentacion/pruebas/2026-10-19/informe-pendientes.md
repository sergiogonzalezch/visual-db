# Avance de pendientes y regresión — 19 de octubre de 2026

## Alcance autorizado

Se trabajó sobre la lista priorizada de la conversación. Se excluyeron **10: intercambio con draw.io/Mermaid externos** y **12: macOS/Linux**. Estos números corresponden a la lista de la conversación, no a los identificadores del informe histórico.

No se cambiaron la stack, las reglas de negocio, el formato principal del proyecto ni el perfil personal de proveedores. No se añadieron dependencias. Los cambios de este ciclo se incluyen en el commit solicitado el 19 de octubre. No se solicita push.

## Estado por prioridad

**Resumen: 8 resueltos · 2 no resueltos · 2 excluidos.** Los puntos 7, 8, 9 y 11 tienen nueva implementación y pruebas. Consulta el [cierre y sus criterios concretos](cierre-7-8-9-11.md): accesibilidad básica automatizada, controles semánticos y rendimiento local de referencia; no certificación universal.

- ✅ **Resuelto:** corrección o verificación completada dentro del alcance probado que describe la fila.
- ❌ **No resuelto:** queda trabajo o verificación pendiente, aunque existan avances parciales; no significa necesariamente un bug confirmado.
- ⏸️ **Excluido:** fuera de este ciclo por petición del usuario; no se cuenta como resuelto.

| N.º | Prioridad | Pendiente | Estado | Resultado de este ciclo |
| --- | --- | --- | --- | --- |
| 1 | P1 | Concurrencia y respuestas tardías | ✅ Resuelto | Regresión por UI/IPC: solicitud única, cambio A → nuevo B, descarte, respuesta vieja antes/después de la nueva, edición durante la espera y conservación del foco. Sin incorporaciones cruzadas en estos escenarios. |
| 2 | P1 | Operaciones combinadas e integridad | ✅ Resuelto | Corregidos historial inverso, referencias FK eliminadas y duplicados de ID. Matriz de los 23 tipos de operación: proyección, aprobación, inmutabilidad y deshacer/rehacer. Añadidos casos combinados, fallos atómicos y FK compuestas/autorreferentes. No equivale a probar todas las permutaciones del catálogo. |
| 3 | P2 | Errores y recuperación | ✅ Resuelto | UI/IPC con 401, 403, 404, 429, 503, desconexión, JSON inválido, timeout y operación incompatible. Cada error permite reintentar, conserva propuestas existentes y no propaga el cuerpo secreto del servidor de prueba. |
| 4 | P2 | E2E de Electron | ✅ Resuelto | Automatizador reproducible sin nuevas librerías. Renderer, preload, IPC, coordinador, adaptador HTTP y persistencia reales; proveedor y destinos de diálogos controlados. |
| 5 | P2 | Gemini completo | ❌ No resuelto — aprobación correcta pendiente | Contrato corregido. Flash Lite: revisión por UI, comparación, bloqueo por riesgos, rechazo, guardado y reapertura aprobados; diagnóstico con catorce operaciones estructuralmente válidas. Primer intento UI 503; segundo funcionó. 3.8 Flash sigue saturado. Falta aprobar una modificación de negocio correcta. [Pruebas](correcciones-contrato-y-pruebas.md). |
| 6 | P2 | Ollama completo | ❌ No resuelto — aprobación correcta pendiente | Esquema estructurado y contexto 8192; Mistral y Llama producen operaciones objeto. Mistral: tienda por UI, aclaración marcada como revisada, guardado/reapertura aprobados. Persisten errores conceptuales variables; no se aprueban automáticamente. Falta modificación correcta aprobada y persistida. [Pruebas](correcciones-contrato-y-pruebas.md). |
| 7 | P2 | Calidad semántica y trazabilidad | ✅ Resuelto — controles | Evaluación compartida con 14 casos conocidos; bloqueo de referencias inválidas; revisión explícita de riesgos y nota persistida. El proceso principal registra el proveedor/modelo reales. La veracidad del texto libre sigue requiriendo revisión humana. |
| 8 | P2 | Accesibilidad y temas | ✅ Resuelto — básica | Nombres y contraste revisados en siete vistas, claro/oscuro, árbol AX, teclado, foco y desbordes. Corregidas etiquetas de claves/FK/notas. Escalas de dispositivo 125 %/150 % comprobadas. No se declara certificación WCAG ni prueba auditiva manual de lectores. |
| 9 | P2 | Barra arrastrable | ✅ Resuelto | Arrastre, Escape, teclado y restablecimiento; cierre completo y dos procesos nuevos con el mismo perfil verifican posición y límites. No se modificó la versión del diseño al mover herramientas. |
| 10 | — | Herramientas externas | ⏸️ Excluido | Excluido por petición del usuario. |
| 11 | P3 | Modelos grandes | ✅ Resuelto — referencia local | 500 entidades, 6000 atributos y 499 relaciones; carga de 30 s con paneo, zoom y selección. Comprobados memoria retenida, comparación/aprobación, guardado y exportación. Tarjetas/relaciones reutilizadas entre transformaciones. Límites y métricas en el informe de cierre. |
| 12 | — | macOS y Linux | ⏸️ Excluido | Excluido por petición del usuario. |

## Correcciones aplicadas

### Historial y referencias

El historial calculaba todas las inversas contra el estado inicial y después invertía cada paso de restauración. Crear y modificar en un mismo grupo podía no deshacerse correctamente; borrar una entidad podía intentar recuperar sus relaciones antes que la entidad.

Ahora se calcula cada inversa contra el estado inmediatamente anterior y se invierte el orden de los grupos, conservando los pasos internos. Las restauraciones de entidades, atributos y claves conservan su índice. Las entradas anteriores siguen siendo legibles; no se reescriben retroactivamente inversas históricas ya guardadas.

Eliminar una entidad/clave destino o cambiar sus columnas al eliminar un atributo limpia las restricciones FK afectadas, conservando las columnas de las otras entidades. Eliminar una columna origen de una FK compuesta elimina la restricción completa para no conservar un mapeo parcial. Deshacer restaura esas restricciones. No se infieren reglas alternativas ni se convierten restricciones en supuestos.

Las altas rechazan IDs ya presentes dentro de su colección; las bajas de atributos, claves, atributos de relación y notas ausentes dejan de pasar silenciosamente. Un fallo del grupo no modifica el diseño original ni añade una entrada al historial.

### Contrato de IA y transporte

Antes, una operación desconocida se descartaba y se conservaban las demás, incluso convirtiendo una propuesta de cambios en una aparente aclaración. Ahora se rechaza la revisión completa ante operaciones incompatibles o incompletas. Se validan formas, campos, referencias textuales, valores desconocidos y parches; no se permite cambiar IDs mediante un parche del modelo.

Una respuesta sin lista de propuestas o con campos incompletos muestra un error de formato, en vez de presentarse como revisión vacía exitosa. Los errores de sintaxis JSON se traducen sin mostrar fragmentos arbitrarios del cuerpo. Un JSON válido con `propuestas: []` continúa siendo válido; no se fuerza al modelo a inventar recomendaciones.

`Retry-After` admite segundos o fecha HTTP. Una espera larga se informa al usuario sin reintentar antes del plazo. Las generaciones HTTP fallidas no se repiten automáticamente; se conserva el mecanismo existente de un segundo intento ante un error de formato JSON.

El prompt aclara que `dependeDe` referencia propuestas, nunca reglas, entidades o atributos. No certifica que un modelo siga la instrucción.

### Lienzo

El mínimo de zoom de encuadre dejaba entidades fuera de pantalla en diagramas grandes. El encuadre calcula ahora la escala necesaria para el área disponible. La rueda permite alejar la vista sin saltar al mínimo anterior.

El listener de rueda de React era pasivo: `preventDefault()` emitía una advertencia. Se registra ahora directamente con `passive: false` y se retira al desmontar/actualizar. El E2E comprueba que el renderer no emite errores de consola.

Entidades, relaciones y notas tienen nombre accesible, foco visible y activación con Enter/Espacio para abrir Propiedades, también en Propuesto de solo lectura. El texto informativo del lienzo usa el token de contraste del tema.

## Pruebas y evidencia de la primera ronda

- Suite determinista: **155 aprobadas**, 4 optativas omitidas por defecto (3 de rendimiento y 1 de Ollama real).
- Tipado main/preload, renderer e integración: aprobado.
- Compilación de producción: aprobada.
- Rendimiento optativo: 3 casos aprobados por separado.
- Mistral real reducido: 1 caso aprobado por separado, aproximadamente 15,7 s de generación. Pasar formato no implica corrección semántica: incluyó supuestos contradictorios acerca de multivaloración, pero no operaciones que impusieran esos supuestos.
- E2E: 12 grupos con aserciones de UI/IPC, errores, persistencia y modelo grande. Se ejecuta con perfil aislado; los diálogos nativos reciben destinos controlados y el timeout del escenario determinista se acorta en el arnés, sin cambiar el timeout de producción.

La ejecución final quedó en `artefactos-locales/pruebas/electron-1792422379943/resultado.json`: `ok: true`, 12 grupos aprobados y `erroresRenderer: []`. La tienda grande de UI tenía 500 entidades, 1500 atributos y 499 relaciones; apertura medida ≈529 ms y respuesta de zoom ≈182 ms, incluyendo el coste del arnés. Son distintos de los 6000 atributos del ensayo de dominio.

Las capturas, proyectos, respuestas JSON, métricas y logs permanecen en `artefactos-locales/pruebas/`, ignorada por Git. El perfil de prueba remoto usa únicamente una copia cifrada de Gemini y su clave de sistema cifrada; se retira la copia de la credencial al terminar tanto con éxito como con fallo. Nunca se imprime ni se revela en el formulario. El perfil personal original no se escribe.

En una medición de dominio con 500 entidades, 6000 atributos y 499 relaciones: guardar ≈10 ms, abrir ≈11 ms, proyectar ≈17 ms, comparar ≈25 ms, aprobar ≈26 ms y generar SVG ≈23 ms. Son muestras locales, no percentiles ni SLA. Las métricas del renderer se guardan aparte; los intervalos de `requestAnimationFrame` en reposo no prueban fluidez bajo carga continua ni equivalen a un benchmark completo de GPU.

## Reproducir

```powershell
npm test
npm run typecheck
npm run test:e2e

$env:VISUAL_BD_QA_RENDIMIENTO = '1'
npm test -- tests/integracion/rendimiento.test.ts
Remove-Item Env:VISUAL_BD_QA_RENDIMIENTO

$env:VISUAL_BD_QA_LOCAL = '1'
npm test -- tests/integracion/ollama-real.test.ts
Remove-Item Env:VISUAL_BD_QA_LOCAL
```

Para el recorrido real de UI: compilar primero y ejecutar `node tests/e2e/ejecutar.cjs` con `VISUAL_BD_QA_PROVEEDOR=ollama` o `gemini`. Ambos proveedores admiten `VISUAL_BD_QA_MODELO`; en Ollama, por defecto utiliza `llama3.2:latest`. No descarga modelos. Gemini usa el último modelo del perfil Windows `Visual BD` salvo override de QA, realiza llamadas reales y puede consumir cuota. Desactivar estas variables devuelve al servidor controlado sin consumo externo.

## Servicios pendientes y ampliaciones posteriores al cierre

1. La revisión con Flash Lite ya pasó decisión, guardado y reapertura; falta aprobar un cambio correcto de negocio. El modelo personal 3.8 Flash sigue sujeto a 503; no se cambió automáticamente.
2. Conseguir una propuesta local ejecutable y conceptualmente correcta para la tienda completa, evaluar evidencia/supuestos y cerrar su aprobación/reapertura. No aceptar respuestas por el mero hecho de ser JSON válido.
3. Ampliar la accesibilidad básica ya verificada con evaluación auditiva manual de lectores y certificación formal; extender el benchmark cerrado a sesiones de varias horas, hardware distinto y lectores activos.
4. Mantener fuera de este ciclo los dos puntos excluidos. La cancelación efectiva del proveedor y la comparación histórica siguen siendo mejoras distintas del descarte local y la comparación de propuestas pendientes.

El commit `bff8fba` pertenece al ciclo anterior y ya estaba realizado; el push quedó a cargo del usuario. La entrega actual fue solicitada posteriormente por el usuario: actualizar documentación y hacer commit, sin push.

## Archivos del ciclo

| Área | Archivos |
| --- | --- |
| Historial e integridad | `src/renderer/src/domain/historial.ts`, `operaciones.ts`; nuevas regresiones `historial-combinado.test.ts`, `referencias-eliminacion.test.ts`, `catalogo-operaciones.test.ts`. |
| IA y transporte | `src/main/ia/adaptador.ts`, `coordinador.ts`, `http.ts`, `http.test.ts`; nuevos `operaciones-validas.ts`, `respuesta-revision.test.ts`; simplificación del handler en `src/main/index.ts`. |
| UI | `src/renderer/src/componentes/Lienzo.tsx`, `src/renderer/src/estilos.css`. |
| Automatización | `tests/e2e/electron.cjs`, `tests/e2e/ejecutar.cjs`, `tests/integracion/operaciones-ia.test.ts`, `tests/integracion/rendimiento.test.ts`, script `test:e2e` en `package.json`. |
| Documentación | `README.md`, `documentacion/INSTRUCCIONES.md`, referencia técnica de la guía, nota de actualización del resumen histórico y este informe. |


## Seguimiento vigente

La lista completa priorizada de mejoras, incluida cancelación real, comparación histórica y evaluación ampliada, está en [pendientes](../../pendientes.md). El [índice documental](../../README.md) distingue guía de uso, referencia técnica e informes históricos.
