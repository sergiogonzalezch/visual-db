# Cierre de controles y regresión: puntos 7, 8, 9 y 11

Fecha: 19 de octubre de 2026. Complementa el [informe de pendientes](informe-pendientes.md). Se conservaron la stack y las reglas de negocio; no se añadieron librerías ni se cambiaron credenciales personales. Los puntos 5 y 6 siguen abiertos; 10 y 12 siguen excluidos.

## Criterios y resultado

| Punto | Estado | Criterio comprobado |
| --- | --- | --- |
| 7. Calidad semántica y trazabilidad | ✅ Resuelto: controles de la aplicación | Detectar riesgos verificables, bloquear referencias inválidas, pedir revisión explícita de decisiones de negocio y guardar la decisión con proveedor/modelo reales. No significa que el texto libre de cualquier modelo sea correcto. |
| 8. Accesibilidad y temas | ✅ Resuelto: accesibilidad básica automatizada | Nombres accesibles, contraste de texto visible, árbol AX, foco, teclado, Escape, ausencia de desbordes y escalas de dispositivo de Chromium 125 %/150 %. No es una certificación WCAG ni una prueba auditiva con Narrador/NVDA. |
| 9. Barra arrastrable | ✅ Resuelto | Arrastre y cancelación, teclado, recuperación de posición después de cerrar completamente Electron, dos relanzamientos independientes y posición accesible en ventana reducida. |
| 11. Modelos grandes | ✅ Resuelto: referencia de rendimiento local | 500 entidades, 6000 atributos y 499 relaciones; 30 s de interacciones repetidas, selección, comparación, aprobación, guardado, exportación y control de memoria retenida. No fija una capacidad máxima ni garantiza sesiones de varias horas. |

Los estados cierran estos criterios acotados. No equivalen a certificar todos los lectores de pantalla, hardware, proveedores o respuestas de IA.

## 7. Evidencia, supuestos y trazabilidad

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

## 8. Accesibilidad y adaptación

Se corrigieron nombres accesibles ausentes en el nombre de clave candidata, los dos selectores de FK y el texto de notas.

El arnés inspecciona editor, Propiedades, Revisión, Chat, Consumo, proveedores y exportación, en claro y oscuro. Comprueba controles con nombre, contraste del texto visible y desbordes internos. El árbol de accesibilidad de Chromium expone nombres y roles de botones, campos, selectores, pestañas y casillas. Las capturas AX se guardan por vista/tema.

Las pruebas de teclado comprueban pestañas con flechas, apertura y cierre del panel, Escape y retorno de foco desde configuración, selección del lienzo y movimiento de la barra. Se mantienen las comprobaciones anteriores de mensajes de estado/error y escala de contenido de 150 %.

Los relanzamientos usan `--force-device-scale-factor=1.25` y `1.5`; se comprueba el `devicePixelRatio` real y el diseño a 1024×640. No se modifica la escala de pantalla del usuario en Windows.

**Límites:** auditoría técnica automatizada, sin lector de pantalla escuchado manualmente, certificación WCAG completa ni todos los estilos/páginas/estados posibles. El contraste se mide tras estabilizar las transiciones; se excluyen controles deshabilitados. No se certifica rendimiento con un lector activo sobre diagramas grandes.

## 9. Persistencia tras terminar el proceso

El ejecutor abre un perfil de prueba, guarda su posición y cierra Electron de forma normal, vaciando el almacenamiento del perfil. Después inicia dos procesos nuevos con ese mismo perfil.

Cada proceso verifica la posición recuperada, reduce la ventana, comprueba los límites de la barra y usa Restablecer. El segundo reinicio verifica la posición restablecida por el primero. También se prueba cancelar un arrastre mediante Escape y que mover la barra no modifica la versión del diseño.

Esto verifica la persistencia entre procesos. No requiere reiniciar o apagar físicamente el equipo ni altera el perfil personal.

## 11. Carga, latencia y memoria

Se indexaron las entidades por ID para resolver relaciones sin búsquedas repetidas. Las tarjetas del lienzo y las líneas reutilizan su representación cuando sus datos no cambian: el paneo modifica la transformación y el zoom conserva las tarjetas. Los cambios de selección, datos, marcas o posiciones invalidan las representaciones pertinentes.

La zona de clic de relaciones usa un trazo transparente de 14 px con `non-scaling-stroke`. Antes, las reglas CSS de las líneas anulaban sus atributos de transparencia/grosor y el zoom actualizaba cientos de atributos innecesariamente. La prueba comprueba su estilo calculado y permite reutilizar las líneas también durante el zoom. Una muestra previa alcanzó 516 ms de p95 de zoom; no se dio por aprobada hasta aplicar y comprobar esta corrección.

El lienzo impide la selección/arrastre de texto del navegador durante sus gestos. El benchmark envía eventos DOM de paneo y eventos de rueda/teclado de Electron. Los tiempos incluyen el arnés y comprobaciones de DOM; no son medidas puras de GPU ni equivalen a FPS de animación.

La carga de 30 s repite paneos, zoom y selecciones con 500 entidades, 6000 atributos y 499 relaciones. Se fijaron umbrales de referencia para este equipo: p95 de paneo menor de 250 ms, p95 de zoom menor de 500 ms, crecimiento de heap retenido menor de 32 MiB y menos de 2000 nodos adicionales. Se comprueba también la conservación de las 500 entidades, aprobación, guardado y exportación JSON.

La memoria se mide de dos formas:

1. Memoria privada y residente del proceso renderer, consultadas por PID desde Windows, con tiempo de espera acotado.
2. Heap y nodos retenidos antes/después de recolección de basura de Chromium. El inspector se inicializa antes de ambas muestras para comparar el mismo estado de UI.

La primera medición sin ese calentamiento incluía los controles recién montados del inspector. Además, memoria privada reservada no equivale por sí sola a fuga: por eso se conservan ambas métricas y se comprueba retención, sin ocultar el crecimiento de memoria del proceso.

La auditoría AX forzada y el benchmark se ejecutan por separado. La instrumentación de accesibilidad se desactiva únicamente en el proceso aislado antes del benchmark; la aplicación personal y sus preferencias no se modifican.

## Evidencia y reproducción

- `npm test`: 169 aprobadas; cuatro casos optativos omitidos por defecto.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado.
- `npm run test:e2e`: recorrido UI/IPC, auditoría por vista/tema, carga sostenida y dos relanzamientos.

La ejecución final pasó en `artefactos-locales/pruebas/electron-1792424283909/`: 15 grupos E2E y dos relanzamientos, sin errores de consola del renderer. Apertura del modelo grande: 759 ms. Durante unos 31,5 s se hicieron 180 actualizaciones de paneo, 45 zooms y nueve selecciones; p95 paneo 119 ms y p95 zoom 393 ms. Heap usado tras GC de 19 147 288 a 20 409 380 bytes (unos 1,2 MiB adicionales), cuatro nodos DOM adicionales y el mismo número de listeners (279). Los JSON conservan también la memoria privada/residente; no se interpreta esta muestra como garantía de ausencia de fugas en sesiones ilimitadas.

El arnés de métricas usa PowerShell para consultar memoria de Windows. No se presenta como una prueba multiplataforma; macOS/Linux siguen excluidos. Artefactos, capturas y proyectos de prueba permanecen ignorados por Git.

## Archivos de esta ampliación

- Dominio: `evaluacion-ia.ts`, `evaluacion-ia.test.ts`, `aprobacion.ts`.
- Procedencia: `src/shared/ai.ts`, `src/main/index.ts`, `estado/tienda.tsx`.
- UI: `PanelRevision.tsx`, `PanelPropiedades.tsx`, `Lienzo.tsx`, `estilos.css`.
- QA: `tests/e2e/accesibilidad.cjs`, `electron.cjs`, `ejecutar.cjs`.

No se hizo commit ni push de esta ampliación.
