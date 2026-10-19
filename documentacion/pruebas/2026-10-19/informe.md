# Informe consolidado — 2026-10-19

Fecha de los trabajos: **2026-10-19**. Consolidación editorial realizada el **19 de octubre de 2026**, sin ejecutar pruebas nuevas ni cambiar sus resultados. Sustituye los informes sueltos de esta fecha.

Los resultados se distinguen por etapa: un fallo inicial y una corrección posterior no son contradictorios. Las cifras corresponden a cada ejecución, no a un único ensayo. Los pendientes operativos vigentes se mantienen exclusivamente en [pendientes](pendientes.md); las tablas históricas conservan el corte de su fecha.

## Contenido

- [Estado de los doce puntos y primeras correcciones](#estado)
- [Controles semánticos, accesibilidad, reinicios y rendimiento](#controles)
- [Diagnóstico previo a la corrección del contrato](#diagnostico)
- [Contrato corregido y verificación final](#correcciones)

**Cierre del día:** 176 pruebas deterministas, tipado y build aprobados; quince grupos Electron y dos relanzamientos. Mistral: aclaración revisada, guardada y reabierta. Flash Lite: comparación, riesgos, rechazo persistido y reapertura. Falta certificar una modificación correcta generada y aprobada con cada proveedor.

<a id="estado"></a>

## Estado de los doce puntos y primeras correcciones

### Estado por prioridad

**Resumen: 8 resueltos · 2 no resueltos · 2 excluidos.** Los puntos 7, 8, 9 y 11 tienen nueva implementación y pruebas. Consulta el [cierre y sus criterios concretos](informe.md#controles): accesibilidad básica automatizada, controles semánticos y rendimiento local de referencia; no certificación universal.

- ✅ **Resuelto:** corrección o verificación completada dentro del alcance probado que describe la fila.
- ❌ **No resuelto:** queda trabajo o verificación pendiente, aunque existan avances parciales; no significa necesariamente un bug confirmado.
- ⏸️ **Excluido:** fuera de este ciclo por petición del usuario; no se cuenta como resuelto.

| N.º | Prioridad | Pendiente | Estado | Resultado de este ciclo |
| --- | --- | --- | --- | --- |
| 1 | P1 | Concurrencia y respuestas tardías | ✅ Resuelto | Regresión por UI/IPC: solicitud única, cambio A → nuevo B, descarte, respuesta vieja antes/después de la nueva, edición durante la espera y conservación del foco. Sin incorporaciones cruzadas en estos escenarios. |
| 2 | P1 | Operaciones combinadas e integridad | ✅ Resuelto | Corregidos historial inverso, referencias FK eliminadas y duplicados de ID. Matriz de los 23 tipos de operación: proyección, aprobación, inmutabilidad y deshacer/rehacer. Añadidos casos combinados, fallos atómicos y FK compuestas/autorreferentes. No equivale a probar todas las permutaciones del catálogo. |
| 3 | P2 | Errores y recuperación | ✅ Resuelto | UI/IPC con 401, 403, 404, 429, 503, desconexión, JSON inválido, timeout y operación incompatible. Cada error permite reintentar, conserva propuestas existentes y no propaga el cuerpo secreto del servidor de prueba. |
| 4 | P2 | E2E de Electron | ✅ Resuelto | Automatizador reproducible sin nuevas librerías. Renderer, preload, IPC, coordinador, adaptador HTTP y persistencia reales; proveedor y destinos de diálogos controlados. |
| 5 | P2 | Gemini completo | ❌ No resuelto — aprobación correcta pendiente | Contrato corregido. Flash Lite: revisión por UI, comparación, bloqueo por riesgos, rechazo, guardado y reapertura aprobados; diagnóstico con catorce operaciones estructuralmente válidas. Primer intento UI 503; segundo funcionó. 3.8 Flash sigue saturado. Falta aprobar una modificación de negocio correcta. [Pruebas](informe.md#correcciones). |
| 6 | P2 | Ollama completo | ❌ No resuelto — aprobación correcta pendiente | Esquema estructurado y contexto 8192; Mistral y Llama producen operaciones objeto. Mistral: tienda por UI, aclaración marcada como revisada, guardado/reapertura aprobados. Persisten errores conceptuales variables; no se aprueban automáticamente. Falta modificación correcta aprobada y persistida. [Pruebas](informe.md#correcciones). |
| 7 | P2 | Calidad semántica y trazabilidad | ✅ Resuelto — controles | Evaluación compartida con 14 casos conocidos; bloqueo de referencias inválidas; revisión explícita de riesgos y nota persistida. El proceso principal registra el proveedor/modelo reales. La veracidad del texto libre sigue requiriendo revisión humana. |
| 8 | P2 | Accesibilidad y temas | ✅ Resuelto — básica | Nombres y contraste revisados en siete vistas, claro/oscuro, árbol AX, teclado, foco y desbordes. Corregidas etiquetas de claves/FK/notas. Escalas de dispositivo 125 %/150 % comprobadas. No se declara certificación WCAG ni prueba auditiva manual de lectores. |
| 9 | P2 | Barra arrastrable | ✅ Resuelto | Arrastre, Escape, teclado y restablecimiento; cierre completo y dos procesos nuevos con el mismo perfil verifican posición y límites. No se modificó la versión del diseño al mover herramientas. |
| 10 | — | Herramientas externas | ⏸️ Excluido | Excluido por petición del usuario. |
| 11 | P3 | Modelos grandes | ✅ Resuelto — referencia local | 500 entidades, 6000 atributos y 499 relaciones; carga de 30 s con paneo, zoom y selección. Comprobados memoria retenida, comparación/aprobación, guardado y exportación. Tarjetas/relaciones reutilizadas entre transformaciones. Límites y métricas en el informe de cierre. |
| 12 | — | macOS y Linux | ⏸️ Excluido | Excluido por petición del usuario. |

### Correcciones aplicadas

#### Historial y referencias

El historial calculaba todas las inversas contra el estado inicial y después invertía cada paso de restauración. Crear y modificar en un mismo grupo podía no deshacerse correctamente; borrar una entidad podía intentar recuperar sus relaciones antes que la entidad.

Ahora se calcula cada inversa contra el estado inmediatamente anterior y se invierte el orden de los grupos, conservando los pasos internos. Las restauraciones de entidades, atributos y claves conservan su índice. Las entradas anteriores siguen siendo legibles; no se reescriben retroactivamente inversas históricas ya guardadas.

Eliminar una entidad/clave destino o cambiar sus columnas al eliminar un atributo limpia las restricciones FK afectadas, conservando las columnas de las otras entidades. Eliminar una columna origen de una FK compuesta elimina la restricción completa para no conservar un mapeo parcial. Deshacer restaura esas restricciones. No se infieren reglas alternativas ni se convierten restricciones en supuestos.

Las altas rechazan IDs ya presentes dentro de su colección; las bajas de atributos, claves, atributos de relación y notas ausentes dejan de pasar silenciosamente. Un fallo del grupo no modifica el diseño original ni añade una entrada al historial.

#### Contrato de IA y transporte

Antes, una operación desconocida se descartaba y se conservaban las demás, incluso convirtiendo una propuesta de cambios en una aparente aclaración. Ahora se rechaza la revisión completa ante operaciones incompatibles o incompletas. Se validan formas, campos, referencias textuales, valores desconocidos y parches; no se permite cambiar IDs mediante un parche del modelo.

Una respuesta sin lista de propuestas o con campos incompletos muestra un error de formato, en vez de presentarse como revisión vacía exitosa. Los errores de sintaxis JSON se traducen sin mostrar fragmentos arbitrarios del cuerpo. Un JSON válido con `propuestas: []` continúa siendo válido; no se fuerza al modelo a inventar recomendaciones.

`Retry-After` admite segundos o fecha HTTP. Una espera larga se informa al usuario sin reintentar antes del plazo. Las generaciones HTTP fallidas no se repiten automáticamente; se conserva el mecanismo existente de un segundo intento ante un error de formato JSON.

El prompt aclara que `dependeDe` referencia propuestas, nunca reglas, entidades o atributos. No certifica que un modelo siga la instrucción.

#### Lienzo

El mínimo de zoom de encuadre dejaba entidades fuera de pantalla en diagramas grandes. El encuadre calcula ahora la escala necesaria para el área disponible. La rueda permite alejar la vista sin saltar al mínimo anterior.

El listener de rueda de React era pasivo: `preventDefault()` emitía una advertencia. Se registra ahora directamente con `passive: false` y se retira al desmontar/actualizar. El E2E comprueba que el renderer no emite errores de consola.

Entidades, relaciones y notas tienen nombre accesible, foco visible y activación con Enter/Espacio para abrir Propiedades, también en Propuesto de solo lectura. El texto informativo del lienzo usa el token de contraste del tema.

### Pruebas y evidencia de la primera ronda

- Suite determinista: **155 aprobadas**, 4 optativas omitidas por defecto (3 de rendimiento y 1 de Ollama real).
- Tipado main/preload, renderer e integración: aprobado.
- Compilación de producción: aprobada.
- Rendimiento optativo: 3 casos aprobados por separado.
- Mistral real reducido: 1 caso aprobado por separado, aproximadamente 15,7 s de generación. Pasar formato no implica corrección semántica: incluyó supuestos contradictorios acerca de multivaloración, pero no operaciones que impusieran esos supuestos.
- E2E: 12 grupos con aserciones de UI/IPC, errores, persistencia y modelo grande. Se ejecuta con perfil aislado; los diálogos nativos reciben destinos controlados y el timeout del escenario determinista se acorta en el arnés, sin cambiar el timeout de producción.

La ejecución final quedó en `artefactos-locales/pruebas/electron-1792422379943/resultado.json`: `ok: true`, 12 grupos aprobados y `erroresRenderer: []`. La tienda grande de UI tenía 500 entidades, 1500 atributos y 499 relaciones; apertura medida ≈529 ms y respuesta de zoom ≈182 ms, incluyendo el coste del arnés. Son distintos de los 6000 atributos del ensayo de dominio.

Las capturas, proyectos, respuestas JSON, métricas y logs permanecen en `artefactos-locales/pruebas/`, ignorada por Git. El perfil de prueba remoto usa únicamente una copia cifrada de Gemini y su clave de sistema cifrada; se retira la copia de la credencial al terminar tanto con éxito como con fallo. Nunca se imprime ni se revela en el formulario. El perfil personal original no se escribe.

En una medición de dominio con 500 entidades, 6000 atributos y 499 relaciones: guardar ≈10 ms, abrir ≈11 ms, proyectar ≈17 ms, comparar ≈25 ms, aprobar ≈26 ms y generar SVG ≈23 ms. Son muestras locales, no percentiles ni SLA. Las métricas del renderer se guardan aparte; los intervalos de `requestAnimationFrame` en reposo no prueban fluidez bajo carga continua ni equivalen a un benchmark completo de GPU.

<a id="controles"></a>

## Controles semánticos, accesibilidad, reinicios y rendimiento

### 7. Evidencia, supuestos y trazabilidad

Se añadió `domain/evaluacion-ia.ts`, compartido por el panel y la aprobación. Para propuestas nuevas identificadas como IA:

- Señala cambios de tipo, nulabilidad, unicidad y multivaloración; email único no implica email obligatorio.
- Señala claves nuevas/modificadas y obliga a revisar columnas y mapeos compuestos.
- Señala reglas duplicadas, cambios de reglas de negocio, eliminación de información y dependencias funcionales nuevas.
- Detecta pares explícitos de supuestos opuestos por negación, como el caso real de Mistral. Es una comprobación limitada, no un analizador general de contradicciones en lenguaje natural.
- Las referencias inexistentes y los mapeos FK incompletos bloquean la aplicación incluso si se confirma la revisión.
- Presenta las afirmaciones sobre 1FN–BCNF como no certificadas por la IA; la verificación depende de Revisar reglas y de las dependencias declaradas.

La casilla de revisión se invalida cuando cambia la propuesta, su versión o la versión del diseño. El dominio también exige confirmación: no depende solo de deshabilitar un botón. Confirmar no contesta automáticamente preguntas ni convierte supuestos en hechos; expresa la decisión del usuario sobre los cambios elegidos.

Al aprobar se guarda una nota de los puntos revisados. El proceso principal añade el proveedor y modelo de la configuración capturada al iniciar la solicitud, evitando atribuir el resultado a un modelo elegido posteriormente en el renderer. No guarda endpoints ni claves en esa procedencia. Las propuestas antiguas mantienen su origen no registrado.

Se añadieron 14 pruebas de casos conocidos: desconocidos, unicidad/obligatoriedad, normalización sin evidencia, referencias ausentes, duplicación de reglas, claves compuestas, supuestos contradictorios y política de precio histórico. El E2E verifica botón bloqueado → confirmación → aprobación → guardado/reapertura con nota y procedencia.

**Límite:** estas comprobaciones no pueden demostrar por sí solas la corrección conceptual de una recomendación arbitraria ni corregir el conocimiento de un modelo. La revisión humana y los ensayos reales de los puntos 5/6 siguen siendo necesarios.

### 8. Accesibilidad y adaptación

Se corrigieron nombres accesibles ausentes en el nombre de clave candidata, los dos selectores de FK y el texto de notas.

El arnés inspecciona editor, Propiedades, Revisión, Chat, Consumo, proveedores y exportación, en claro y oscuro. Comprueba controles con nombre, contraste del texto visible y desbordes internos. El árbol de accesibilidad de Chromium expone nombres y roles de botones, campos, selectores, pestañas y casillas. Las capturas AX se guardan por vista/tema.

Las pruebas de teclado comprueban pestañas con flechas, apertura y cierre del panel, Escape y retorno de foco desde configuración, selección del lienzo y movimiento de la barra. Se mantienen las comprobaciones anteriores de mensajes de estado/error y escala de contenido de 150 %.

Los relanzamientos usan `--force-device-scale-factor=1.25` y `1.5`; se comprueba el `devicePixelRatio` real y el diseño a 1024×640. No se modifica la escala de pantalla del usuario en Windows.

**Límites:** auditoría técnica automatizada, sin lector de pantalla escuchado manualmente, certificación WCAG completa ni todos los estilos/páginas/estados posibles. El contraste se mide tras estabilizar las transiciones; se excluyen controles deshabilitados. No se certifica rendimiento con un lector activo sobre diagramas grandes.

### 9. Persistencia tras terminar el proceso

El ejecutor abre un perfil de prueba, guarda su posición y cierra Electron de forma normal, vaciando el almacenamiento del perfil. Después inicia dos procesos nuevos con ese mismo perfil.

Cada proceso verifica la posición recuperada, reduce la ventana, comprueba los límites de la barra y usa Restablecer. El segundo reinicio verifica la posición restablecida por el primero. También se prueba cancelar un arrastre mediante Escape y que mover la barra no modifica la versión del diseño.

Esto verifica la persistencia entre procesos. No requiere reiniciar o apagar físicamente el equipo ni altera el perfil personal.

### 11. Carga, latencia y memoria

Se indexaron las entidades por ID para resolver relaciones sin búsquedas repetidas. Las tarjetas del lienzo y las líneas reutilizan su representación cuando sus datos no cambian: el paneo modifica la transformación y el zoom conserva las tarjetas. Los cambios de selección, datos, marcas o posiciones invalidan las representaciones pertinentes.

La zona de clic de relaciones usa un trazo transparente de 14 px con `non-scaling-stroke`. Antes, las reglas CSS de las líneas anulaban sus atributos de transparencia/grosor y el zoom actualizaba cientos de atributos innecesariamente. La prueba comprueba su estilo calculado y permite reutilizar las líneas también durante el zoom. Una muestra previa alcanzó 516 ms de p95 de zoom; no se dio por aprobada hasta aplicar y comprobar esta corrección.

El lienzo impide la selección/arrastre de texto del navegador durante sus gestos. El benchmark envía eventos DOM de paneo y eventos de rueda/teclado de Electron. Los tiempos incluyen el arnés y comprobaciones de DOM; no son medidas puras de GPU ni equivalen a FPS de animación.

La carga de 30 s repite paneos, zoom y selecciones con 500 entidades, 6000 atributos y 499 relaciones. Se fijaron umbrales de referencia para este equipo: p95 de paneo menor de 250 ms, p95 de zoom menor de 500 ms, crecimiento de heap retenido menor de 32 MiB y menos de 2000 nodos adicionales. Se comprueba también la conservación de las 500 entidades, aprobación, guardado y exportación JSON.

La memoria se mide de dos formas:

1. Memoria privada y residente del proceso renderer, consultadas por PID desde Windows, con tiempo de espera acotado.
2. Heap y nodos retenidos antes/después de recolección de basura de Chromium. El inspector se inicializa antes de ambas muestras para comparar el mismo estado de UI.

La primera medición sin ese calentamiento incluía los controles recién montados del inspector. Además, memoria privada reservada no equivale por sí sola a fuga: por eso se conservan ambas métricas y se comprueba retención, sin ocultar el crecimiento de memoria del proceso.

La auditoría AX forzada y el benchmark se ejecutan por separado. La instrumentación de accesibilidad se desactiva únicamente en el proceso aislado antes del benchmark; la aplicación personal y sus preferencias no se modifican.

### Evidencia y reproducción

- `npm test`: 169 aprobadas; cuatro casos optativos omitidos por defecto.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado.
- `npm run test:e2e`: recorrido UI/IPC, auditoría por vista/tema, carga sostenida y dos relanzamientos.

La ejecución final pasó en `artefactos-locales/pruebas/electron-1792424283909/`: 15 grupos E2E y dos relanzamientos, sin errores de consola del renderer. Apertura del modelo grande: 759 ms. Durante unos 31,5 s se hicieron 180 actualizaciones de paneo, 45 zooms y nueve selecciones; p95 paneo 119 ms y p95 zoom 393 ms. Heap usado tras GC de 19 147 288 a 20 409 380 bytes (unos 1,2 MiB adicionales), cuatro nodos DOM adicionales y el mismo número de listeners (279). Los JSON conservan también la memoria privada/residente; no se interpreta esta muestra como garantía de ausencia de fugas en sesiones ilimitadas.

El arnés de métricas usa PowerShell para consultar memoria de Windows. No se presenta como una prueba multiplataforma; macOS/Linux siguen excluidos. Artefactos, capturas y proyectos de prueba permanecen ignorados por Git.

<a id="diagnostico"></a>

## Diagnóstico previo a la corrección del contrato

### Método y límites

Peticiones HTTP reales desde Electron con perfil aislado, instrucciones `SISTEMA_REVISION` actuales, sin reintentos automáticos. Se comparó una entidad Cliente con dos atributos frente a la tienda sintética de cuatro entidades, quince atributos y cuatro reglas del ensayo anterior. Sin historial conversacional. Una muestra por combinación: los modelos son no deterministas.

Se usaron el normalizador y el validador de operaciones de producción. Aceptar el JSON exterior **no** equivale a aceptar operaciones ni a certificar la lógica propuesta. Las evaluaciones semánticas del ejecutor no sustituyen el rechazo previo de operaciones inválidas del coordinador.

La clave Gemini se descifró exclusivamente en memoria; solo se copió temporalmente el archivo de estado con la clave de sistema cifrada al perfil de QA, retirado al finalizar. No se guardaron cabeceras de autorización ni cuerpos de error arbitrarios. Las respuestas de modelos conservadas contienen únicamente el caso sintético y están en el directorio ignorado de artefactos.

### Resultados

| Proveedor / modelo | Caso | HTTP | Tiempo | Resultado útil para la aplicación |
| --- | --- | --- | --- | --- |
| Gemini, catálogo | Listado | 200 | 0,63 s | Credencial y consulta de catálogo operativas. |
| gemini-3.8-flash | Mínimo | 503 | 0,60 s | No generó revisión. |
| gemini-3.8-flash | Tienda | 503 | 0,57 s | No generó revisión. |
| gemini-3.8-flash | Sonda «Responde únicamente OK» | 503 | 0,91 s | Error `UNAVAILABLE`; mensaje clasificado como capacidad/saturación. |
| gemini-2.5-flash | Mínimo / sonda | 404 | 0,16 / 0,18 s | El proveedor informa que no está disponible para usuarios nuevos, aunque figura en el catálogo. |
| gemini-2.5-flash-lite | Sonda | 200 | 1,41 s | Respondió usando la misma credencial. |
| gemini-2.5-flash-lite | Mínimo | 200 | 2,22 s | JSON exterior válido, una operación inválida representada como cadena. |
| gemini-2.5-flash-lite | Tienda | 200 | 10,55 s | Seis propuestas: dieciocho operaciones, todas cadenas incompatibles; dos propuestas sin operaciones. El coordinador rechazaría la revisión completa. |
| mistral:latest | Mínimo | 200 | 19,90 s | Dos propuestas, trece operaciones incompatibles expresadas como cadenas. |
| mistral:latest | Tienda | 200 | 53,73 s | Devuelve un esquema de entidades, no el objeto de revisión con propuestas. |
| llama3.2:latest | Mínimo | 200 | 5,64 s | Dos operaciones incompatibles expresadas como cadenas. |
| llama3.2:latest | Tienda | 200 | 6,68 s | Propuesta con categoría `normalización` en lugar del enum `normalizacion`; operaciones como cadenas. |

### Causas identificadas

#### 1. Gemini: disponibilidad del modelo, no pérdida de clave

El modelo guardado falla incluso con seis tokens de entrada aproximados y sin esquema. La respuesta `503 UNAVAILABLE` clasificada como saturación, junto con catálogo y Flash Lite operativos con la misma clave, señala disponibilidad/capacidad específica del modelo solicitado. El tamaño de la tienda no explica ese fallo inmediato. No se afirma cuánto durará ni qué infraestructura interna está saturada.

Que un modelo aparezca en el catálogo no garantiza permiso ni disponibilidad de generación. El 404 de Flash es un caso distinto del 503: restricción comunicada por el proveedor para usuarios nuevos.

#### 2. Contrato del prompt ambiguo: afecta también a Gemini

El prompt enumera operaciones mediante pseudonotación como `updateAtributo{entidadId,id,parche{...}}`, pero no muestra un ejemplo JSON completo con el discriminante `op`. Los tres modelos que generaron revisiones copiaron esa notación en cadenas de texto. El contrato real exige objetos, por ejemplo:

```json
{"op":"updateEntidad","id":"id-existente","parche":{"descripcion":"Descripción confirmada"}}
```

Además, `format: "json"` y `response_format: {type: "json_object"}` aseguran formato JSON general, no conformidad con el catálogo de operaciones. Es un defecto de claridad del contrato enviado por la aplicación y una hipótesis fuerte sobre la causa de las cadenas; falta una comparación A/B con un contrato explícito para medir cuánto mejora cada modelo. No se deben convertir las cadenas a operaciones automáticamente.

#### 3. Errores conceptuales independientes del formato

Llama propuso eliminar atributos no primarios para «normalizar» y eliminar una regla de negocio; Mistral afirmó un nivel «NT+» no sustentado. Flash Lite volvió a preguntar si el precio es histórico pese a la regla declarada y supuso que unicidad implica obligatoriedad. Corregir el JSON no vuelve fiables esas decisiones: mantener revisión humana, referencias verificadas y aprobación explícita.

#### 4. Rendimiento local: sin timeout en esta muestra

`ollama ps` confirmó Mistral al **100 % GPU**, tamaño cargado 5 GB y contexto 4096, en equipo con RTX 3060 y Ryzen 5 5600G. No se observó una ejecución exclusivamente CPU de ese modelo.

| Modelo / caso | Carga | Evaluación entrada | Generación salida | Tokens salida |
| --- | --- | --- | --- | --- |
| Mistral mínimo | 4,93 s | 0,76 s | 14,19 s | 862 |
| Mistral tienda | 0,005 s | 1,02 s | 52,58 s | 3070 |
| Llama mínimo | 2,86 s | 0,34 s | 2,43 s | 261 |
| Llama tienda | 0,005 s | 0,81 s | 5,85 s | 559 |

En Mistral domina la generación extensa: aproximadamente 58–61 tokens/s. Esto explica su demora observada; no demuestra la causa del timeout histórico de Gemma, que no se repitió en esta inspección. El contexto 4096 puede ser restrictivo para conversaciones mayores; no se confirmó truncamiento en estos casos y no debe afirmarse como causa comprobada.

<a id="correcciones"></a>

## Contrato corregido y verificación final

### Cambios implementados

- Contrato JSON explícito: objetos con discriminante `op`, ejemplos ejecutables del catálogo y enums exactos. Se eliminó la pseudonotación que los modelos copiaban como cadenas.
- Esquema JSON para las 23 operaciones y la respuesta completa, con un máximo de tres propuestas en el esquema. Se solicita concisión y preguntas sin operaciones cuando falta evidencia, preservando unicidad frente a obligatoriedad y precios históricos.
- Ollama recibe el esquema en `format` para revisiones; contexto 8192 y temperatura 0,2. Chat e importación conservan sus formatos. Mayor contexto puede consumir más memoria local; no supone compatibilidad certificada con todos los modelos/equipos.
- Gemini conserva `json_object` y recibe el contrato completo en la instrucción de sistema. Un ensayo con `response_format: json_schema` devolvió HTTP 500 en ambos casos; **esa modificación se retiró**. Incluir el esquema en la instrucción aumenta el contexto y su posible coste; se contabiliza también en la estimación de consumo cuando el proveedor no aporta uso real.
- HTTP 503 explica indisponibilidad/saturación del modelo, catálogo accesible y alternativas. No solicita cambiar la clave por ese error. No se añadió repetición automática de POST ni sustitución automática del modelo.
- Conexión al catálogo deja explícito que la disponibilidad de generación aún no se ha comprobado.
- El ejecutor diagnóstico ahora genera la tienda desde el fixture versionado, sin depender de un artefacto de una ejecución anterior.

Se mantienen rechazo íntegro de respuestas con operaciones incompatibles, bloqueo por referencias inválidas, advertencias semánticas y confirmación del usuario. No se convierten cadenas en operaciones ni se relajan tipos para admitir respuestas incorrectas. No se cambió lógica de negocio, persistencia personal, stack ni dependencias.

### Pruebas automatizadas

- `npm run typecheck`: correcto.
- `npm test`: **176 aprobadas**, cuatro optativas omitidas; 29 archivos aprobados.
- `npm run build`: correcto.
- Regresión Electron con proveedor controlado: **15 grupos aprobados y dos relanzamientos aprobados**. Comparación, aprobación, deshacer/rehacer, guardado, reapertura, concurrencia, nueve errores simulados, accesibilidad claro/oscuro y carga de 500 entidades. Los procesos nuevos comprueban escalas 125 %/150 %.
- Pruebas añadidas: ejemplos del prompt válidos; envío del esquema y parámetros de contexto; 503 seguro tanto en cuerpo objeto como array. Se reforzó el ensayo Gemini para conservar `json_object` y enviar el contrato como instrucción.

Los errores impresos por Electron durante la regresión controlada son provocados deliberadamente. Su presencia no implica fallo del ensayo: se verifican recuperación y mensajes de la interfaz.

### Comparaciones reales

| Caso | Antes | Después observado |
| --- | --- | --- |
| Mistral mínimo | Trece operaciones como cadenas incompatibles | Objetos válidos y aclaraciones sin operaciones; algunas respuestas aún sugieren reglas redundantes. |
| Mistral tienda | Sin lista de propuestas, o referencias incorrectas con contexto menor | Con contexto 8192: entrada de 5133 tokens, revisión de 14,9 s y tres aclaraciones sin operaciones. La calidad varía entre ejecuciones. |
| Llama tienda | Propuesta incompleta, categoría con acento y cadenas | Revisión estructurada con operaciones del catálogo; aún puede inventar referencias y conceptos, que deben verificarse. |
| Gemini Flash Lite mínimo | Operación como cadena | Operación objeto válida, con advertencias sobre supuestos. |
| Gemini Flash Lite tienda | Dieciocho operaciones como cadenas | Último diagnóstico: catorce operaciones válidas, sin bloqueos de referencias; todas las propuestas con cambios requerían revisar sus supuestos. |
| Gemini 3.8 Flash | 503 | Sigue respondiendo 503; la aplicación ahora explica el error. No se cambió el modelo personal. |

El esquema corrige estructura, no garantiza veracidad ni buena normalización. No se presenta esta muestra como un benchmark estadístico: las respuestas no son deterministas. Tampoco se confirmó la causa del timeout histórico de Gemma.

### Recorridos reales por interfaz

**Ollama / Mistral:** importación de la tienda, conexión, selección, revisión, marcado de una aclaración sin operaciones, guardado y reapertura aprobados. La aclaración quedó `aceptada`; las otras propuestas permanecieron pendientes. No se aprobó automáticamente una modificación de negocio.

**Gemini / Flash Lite:** primer intento por interfaz devolvió 503 y mostró el nuevo mensaje con reintento/configuración. En el segundo intento: revisión completa, comparación, bloqueo de aprobación por riesgos pendientes, rechazo de una propuesta, guardado y reapertura aprobados. La propuesta rechazada contenía quince operaciones; el rechazo persistió. No se simula que confirmar riesgos sea equivalente a validar la propuesta.

Se corrigió el automatizador real, que antes intentaba pulsar `Aceptar cambios` aunque el botón estuviera deshabilitado por la revisión semántica. Ahora marca aclaraciones o verifica el bloqueo y rechaza la propuesta con cambios; no marca automáticamente la casilla de confirmación. La aprobación y su historial se comprueban con propuestas conocidas del proveedor controlado.

### Evidencia ignorada por Git

- `artefactos-locales/pruebas/diagnostico-1792426174759`: matriz con esquema local/contexto ampliado; Mistral tienda 14,9 s.
- `artefactos-locales/pruebas/diagnostico-1792426262092`: Flash Lite con contrato completo como instrucción, catorce operaciones válidas en tienda.
- `artefactos-locales/pruebas/diagnostico-1792426137207`: experimento de parámetro `json_schema` rechazado con 500; no quedó en producción.
- `artefactos-locales/pruebas/electron-1792426343439`: recorrido real Mistral aprobado.
- `artefactos-locales/pruebas/electron-1792426381196`: recorrido real Flash Lite aprobado.
- `artefactos-locales/pruebas/electron-1792426355940`: primer intento Flash Lite con 503.
- `artefactos-locales/pruebas/electron-1792426379519`: regresión controlada completa sobre el build final, quince grupos y dos relanzamientos aprobados.

### Archivos de esta corrección

- `src/main/ia/contrato-revision.ts` y `.test.ts`: contrato, esquema, ejemplos y pruebas.
- `src/main/ia/adaptador.ts`: instrucciones de revisión explícitas.
- `src/main/ia/ollama.ts`: esquema y contexto para revisión.
- `src/main/ia/openai.ts` y `.test.ts`: claridad del catálogo y contrato Gemini sin cambiar el formato compatible.
- `src/main/ia/http.ts` y `.test.ts`: mensaje seguro de 503.
- `tests/e2e/diagnostico-proveedores.cjs`: matriz real reproducible.
- `tests/e2e/electron.cjs`: modelo alternativo solo en perfil de QA y decisión sin aprobación automática de riesgos.
- README, instrucciones, guía técnica e informe de pendientes: resultados y límites actualizados.

La API local admite esquemas en `format`, según [documentación oficial de Ollama](https://github.com/ollama/ollama/blob/main/docs/capabilities/structured-outputs.mdx). La validación local se mantiene independientemente de la garantía del proveedor.
