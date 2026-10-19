# Informe de prueba funcional y UX — Visual BD

Fecha: 18 de octubre de 2026. Ejecución sobre la aplicación de escritorio abierta, mediante controles reales de Windows, ratón y teclado. Datos exclusivamente ficticios.

## Resultado ejecutivo

La edición manual, el guardado, la reapertura, la recuperación y el aislamiento del chat por proyecto funcionaron en el caso probado. La interfaz permite mantener el lienzo disponible y seguir trabajando después de errores del proveedor.

No recomendaría considerar esta versión validada para un flujo de diseño e intercambio de extremo a extremo: la importación produjo relaciones incorrectas sin señalar ambigüedades, el atajo de revisión recargó la ventana y cuatro formatos de exportación fueron rechazados por la instancia abierta. Además, se observaron claves primarias separadas donde el ejemplo requería una clave compuesta y una FK creada sin atributos asociados.

Gemini estuvo configurado como proveedor remoto; no se utilizó Ollama ni se cambió a un proveedor local. Las dos operaciones generativas iniciadas —revisión y chat— terminaron en HTTP 503. Esto bloqueó la evaluación de la calidad de las respuestas y del flujo de propuestas. Un 503 no demuestra una API key incorrecta ni un defecto del modelo de datos.

La suite automatizada sí pasó: **83 pruebas en 18 archivos**, y **typecheck de main y renderer sin errores**. Estos resultados corresponden al código del disco; no sustituyen los fallos observados en la instancia ejecutándose.

## Entorno y alcance

| Aspecto | Condición |
| --- | --- |
| Producto | Visual BD 0.1.0 |
| Entorno | Windows, Electron, renderer de desarrollo en localhost:5173 |
| Pantalla | 1920 × 1080, ventana maximizada, tema oscuro |
| Proveedor visible | Google Gemini, conectado, modelo gemini-3.8-flash |
| Configuración | Solo local desactivado; credencial guardada y enmascarada |
| Datos | Tienda ficticia: clientes, pedidos, productos, líneas y categoría |
| Método | Interacción con la aplicación y diálogos nativos; lectura posterior de los archivos generados; consulta puntual del código para contrastar hallazgos |
| Cambios realizados | Archivos de prueba y este informe. Ninguna corrección del código durante la auditoría |

No se reveló ni reemplazó la credencial. No se borraron historiales, credenciales ni elementos mediante acciones destructivas. No se reinició el proceso principal para intentar arreglar los formatos durante la prueba; la recarga del renderer ocurrió al probar Ctrl+R.

Esta es una prueba exploratoria amplia de los flujos principales, no una certificación exhaustiva: no cubre todos los sistemas operativos, tamaños de pantalla, escenarios de red o variantes del dominio.

## Caso de negocio utilizado

Entrada reproducible: [tienda-prueba.md](../../../tests/fixtures/tienda-prueba.md).

Se declararon cuatro entidades, quince atributos, tres relaciones y cuatro reglas. Cliente y Producto tienen identificadores primarios y claves únicas para email y SKU. LineaPedido utiliza pedido_id + producto_id como identificador compuesto del caso de negocio. Las reglas describen pertenencia de pedidos, cantidad positiva y conservación del precio histórico.

Las relaciones de entrada fueron:

```text
Relación: Cliente -> (1, 0..n) Pedido
Relación: Pedido -> (1, 1..n) LineaPedido
Relación: Producto -> (1, 0..n) LineaPedido
```

Después de importar se renombró Cliente a ClienteQA, se añadió descripción y tipo entero a cliente_id, y se creó Categoria con categoria_id como PK. Se conectó Categoria con Producto, se intentó crear su FK desde la relación y se añadió una nota sobre conservar precios históricos.

El proyecto final contiene cinco entidades, dieciséis atributos, cuatro relaciones y una nota; versión de diseño 15, doce pasos disponibles en la pila de historial. Tiene cuatro mensajes de chat guardados: introducción, error de revisión, solicitud de usuario y error del proveedor.

**El proyecto conserva deliberadamente los problemas encontrados. No es un esquema correcto listo para generar SQL u ORM.**

## Cobertura ejecutada

Leyenda: OK = resultado esperado observado; fallo = comportamiento incorrecto; parcial = operación ejecutada con limitación; bloqueado = no se pudo completar por una condición externa.

| ID | Prueba | Resultado | Evidencia / observación |
| --- | --- | --- | --- |
| T01 | Abrir configuración del proveedor existente | OK con detalle UX | Gemini conectado; clave enmascarada; catálogo visible de 63 modelos; mensaje de éxito con nombre de modelo vacío |
| T02 | Importar Markdown y revisar interpretación | Fallo | Reconoció 4 entidades, 3 relaciones y 4 reglas; anunció 0 ambigüedades pese a destinos mal interpretados |
| T03 | Confirmar la importación | Fallo | Confirmó relaciones hacia entidades equivocadas; ver H01 |
| T04 | Guardar como archivo .vbdproj | OK | Archivo tienda-e2e.vbdproj creado desde diálogo nativo |
| T05 | Seleccionar entidad y abrir panel lateral | OK | Propiedades visibles; panel superpuesto al lienzo |
| T06 | Cerrar panel con Escape y volver a abrir | OK | Lienzo disponible sin desplazar las entidades |
| T07 | Arrastrar barra vertical de herramientas | OK | Cambió de posición; no modificó la versión del diseño |
| T08 | Renombrar entidad | OK | Cliente pasó a ClienteQA |
| T09 | Deshacer y rehacer el cambio de nombre | OK | Revirtió y restauró el nombre por los controles de cabecera |
| T10 | Editar descripción con acentos y símbolo & | OK | Valor conservado en proyecto y exportación |
| T11 | Seleccionar tipo entero | OK | cliente_id quedó declarado como entero |
| T12 | Crear entidad manual | OK | Categoria creada desde lienzo y renombrada |
| T13 | Añadir y renombrar atributo | OK | categoria_id creado |
| T14 | Marcar clave primaria manual | OK | PK de Categoria persistida |
| T15 | Crear relación por origen y destino | OK | Categoria → Producto; feedback de selección de destino visible |
| T16 | Crear FK desde la relación | Parcial / defecto de integridad | Se creó fk_producto con listas de atributos y claves destino vacías; ver H04 |
| T17 | Revisar reglas localmente | Parcial | Mostró hallazgos y 71 elementos desconocidos; inconsistencias de estado descritas en H05 |
| T18 | Atajo Ctrl+R para revisión con IA | Fallo | Recargó renderer y abrió recuperación; ver H02 |
| T19 | Restaurar copia de recuperación | OK | Recuperó Categoria, cambios de ClienteQA y relación; no se observó pérdida tras restaurar |
| T20 | Guardar el trabajo recuperado | OK | Ctrl+S mostró Guardado |
| T21 | Revisión con Gemini desde menú visual | Bloqueado por HTTP 503 | Mostró carga, terminó con error y dejó editable el diseño; no hubo propuestas |
| T22 | Zoom con rueda | OK | 100 % → 110 %; parte del diseño quedó fuera del área visible |
| T23 | Chat con Gemini | Bloqueado por HTTP 503 | Enviando y botón desactivado visibles; solicitud guardada; no hubo respuesta útil |
| T24 | Mostrar errores del proveedor | Parcial | Mensaje comprensible acompañado de texto técnico de IPC y duplicación |
| T25 | Exportar paquete Markdown + JSON | OK | Carpeta nueva y dos archivos generados; comprobados mediante lectura |
| T26 | Exportar SVG | Fallo en instancia abierta | «Archivos de exportación inválidos.» antes del diálogo de destino |
| T27 | Exportar PNG a 1× | Fallo en instancia abierta | Mismo rechazo; ningún PNG creado |
| T28 | Exportar Mermaid | Fallo en instancia abierta | Advertencias correctas sobre cardinalidades desconocidas, pero guardado rechazado |
| T29 | Exportar draw.io | Fallo en instancia abierta | Limitaciones explicadas en modal, pero guardado rechazado |
| T30 | Consultar Consumo | OK de visualización | Mostró 2 peticiones, 12.5 k entrada, 13.6 k salida, 26.1 k total del día; no se atribuyen estos acumulados a las solicitudes fallidas de esta prueba |
| T31 | Crear proyecto nuevo después de guardar | OK | Diseño vacío y chat limpio; proveedor siguió seleccionado |
| T32 | Reabrir proyecto guardado | OK | Restauró 5 entidades, 4 relaciones y mensajes del chat |
| T33 | Consultar historial | OK con detalle UX | Mostró operaciones manuales e importación; una descripción empleó ID técnico de entidad |
| T34 | Crear y editar nota | OK | Nota visible en lienzo y guardada; versión final 15 |
| T35 | Ejecutar pruebas automatizadas | OK | 83/83; 18/18 archivos |
| T36 | Comprobar tipos TypeScript | OK | main y renderer sin errores |

No se completó la edición de cardinalidades: una operación de automatización sobre el combo no cambió el valor. Esto no se contabiliza como bug del programa sin una reproducción manual independiente. Una interacción con un botón fuera del área visible también fue una limitación de automatización, no un fallo funcional.

## Hallazgos priorizados

### H01 — P1: importación confirma relaciones semánticamente incorrectas

**Reproducción:** importar tienda-prueba.md, revisar el resumen y confirmar sin modificar las entidades. El diálogo muestra destinos como «0..n) Pedido» y «1..n) LineaPedido», pero indica cero ambigüedades.

| Relación esperada | Relación guardada |
| --- | --- |
| Cliente → Pedido | ClienteQA → Pedido; extremo destino máximo desconocido |
| Pedido → LineaPedido | Pedido → Pedido; autorrelación inesperada |
| Producto → LineaPedido | Producto → Pedido |

**Impacto:** la estructura puede parecer válida y terminar en informes o futuros generadores con relaciones equivocadas. Es el problema más importante de esta ejecución.

**Contraste técnico:** markdown.ts divide la fuente por comas y espacios de cardinalidad antes de quitar paréntesis completos. borrador.ts admite coincidencia parcial por inclusión; «Pedido» coincide con un destino que también contiene «LineaPedido». No se trata de un fallback comprobado a una posición fija de la lista.

**Recomendación:** reconocer primero ambos extremos y luego la cardinalidad; usar coincidencia exacta o solicitar confirmación de coincidencias aproximadas. Toda entidad destino no resuelta exactamente debe quedar como ambigüedad. Si esta sintaxis no se admite, rechazarla de forma explícita.

**Aceptación:** las tres relaciones del fixture deben conservar origen y destino, o bloquear la confirmación hasta resolverlos. Nunca convertir silenciosamente Pedido → LineaPedido en Pedido → Pedido.

### H02 — P1: Ctrl+R recarga en lugar de revisar

**Reproducción:** con cambios manuales sin guardar, pulsar Ctrl+R. Se recargó el renderer y apareció el diálogo de recuperación; no inició la revisión esperada.

**Impacto:** interrumpe el trabajo y obliga a restaurar una copia. No se observó pérdida tras restaurar en este caso; no debe presentarse como pérdida confirmada de datos.

**Contraste técnico:** el menú asigna CmdOrCtrl+R a «Revisar con IA» y también incluye el rol nativo reload en «Ver». Es una colisión de atajos consistente con lo observado.

**Recomendación:** reservar un único atajo para revisar y retirar o reasignar recarga en el menú de usuario.

**Aceptación:** con cambios pendientes, el atajo debe iniciar una sola revisión, conservar el documento y no abrir recuperación.

### H03 — P1: cuatro salidas ofrecidas no se guardan en la instancia abierta

**Reproducción:** Exportar → diseño completo → SVG, PNG, Mermaid o draw.io → Exportar. Los cuatro terminaron en «Archivos de exportación inválidos.» sin selector de destino.

**Impacto:** el usuario ve formatos habilitados que no puede utilizar. Markdown + JSON sí se guardó.

**Diagnóstico pendiente:** el código fuente y el bundle en disco incluyen los seis tipos, y las pruebas de validación pasan. No se capturó el payload IPC ni se reinició el proceso principal. Por tanto, una instancia principal desactualizada frente al renderer es una hipótesis, no una causa raíz demostrada. Tampoco puede afirmarse que los generadores actuales estén rotos por este único resultado.

**Recomendación:** repetir primero con main/preload/renderer iniciados desde la misma compilación y añadir una prueba integrada real que llegue al diálogo y al archivo. Diferenciar error de contrato, formato no soportado y contenido inválido.

**Aceptación:** cada formato habilitado crea su archivo desde la UI de una sesión recién iniciada y comunica cualquier incompatibilidad de versión.

### H04 — P2: claves incompletas y composición poco clara

**Evidencia persistida:** LineaPedido tiene dos objetos de tipo primaria, uno por pedido_id y otro por producto_id, en lugar de una única clave compuesta. El ejemplo pretendía una clave de dos columnas. El significado de varias marcas PK en el importador no está explicado en el diálogo.

Al pulsar «Crear clave foránea en Producto» desde la relación Categoria → Producto, se guardó fk_producto con atributoIds: [] y claveDestinoIds: [], aunque Categoria ya tenía su PK. No se completó después la configuración de esa FK.

**Impacto:** un usuario puede confundir una declaración incompleta con una restricción utilizable. Estas estructuras no se deben traducir directamente a SQL/ORM.

**Recomendación:** presentar un asistente de mapeo de columnas y estado «FK incompleta»; definir una convención explícita de PK compuesta en Markdown. Permitir borradores incompletos es razonable si se identifican claramente.

**Aceptación:** la FK tiene columnas origen y destino compatibles, o queda señalada como pendiente; una PK compuesta se conserva como una sola restricción con dos atributos.

### H05 — P2: estados de revisión que pueden dar confianza excesiva

La revisión local encontró 71 elementos con información desconocida, mientras que la sección de información desconocida había mostrado cero elementos registrados. Son fuentes de información diferentes, pero la UI no explica esa diferencia.

También mostró 2FN «Verificado con la información declarada» mientras 1FN figuraba con información insuficiente. La importación había separado las PK de LineaPedido. Esta combinación puede interpretarse como una certificación de normalización que el modelo incompleto no permite concluir.

**Recomendación:** distinguir desconocidos detectados frente a registrados, y explicar que una verificación de dependencias parciales no certifica 2FN sin los prerrequisitos. Separar «sin infracciones detectadas» de «forma normal verificada».

**Aceptación:** un esquema con atomicidad desconocida no presenta una certificación global de 2FN; el usuario puede navegar desde cada contador a los campos que lo componen.

### H06 — P2: errores de IA técnicos, duplicados y sin recuperación directa

La revisión y el chat terminaron con HTTP 503. En chat apareció texto del tipo «Error invoking remote method 'ia:chat'» además del mensaje comprensible. El fallo de revisión también apareció en la conversación. Durante la sesión hubo un aviso de error adicional; al reabrir quedó el historial de errores persistido sin ese aviso transitorio.

**Recomendación:** un mensaje contextual por operación, con «Reintentar» y detalle técnico opcional. Mantener solicitud y modelo utilizados. Un estado «conectado» debería describir validación de credenciales/catálogo, sin implicar disponibilidad de generación.

**Aceptación:** ante 503 no se cambia el diseño, se conserva la solicitud y se ofrece un reintento explícito; no se muestra IPC interno como texto principal.

### H07 — P3: detalles visuales y de orientación

- La barra flotante tapa parte de Cliente al importar. Arrastrarla funciona, pero la ubicación vuelve a su posición inicial tras recargar.
- Con zoom 110 % parte del modelo queda fuera del borde izquierdo. No se descubrió un control destacado de «Ajustar al contenido» en el recorrido.
- El panel tiene buena separación por pestañas, pero configurar atributos requiere bastante desplazamiento vertical.
- La configuración mostró «El modelo «» está disponible» con un modelo seleccionado: feedback incompleto.
- El aviso «Se restauró la copia de recuperación» permaneció visible incluso después de crear otro proyecto; el mensaje conserva un contexto anterior.
- Una operación del historial mostró un ID de entidad en vez de su nombre.
- Guardar como tienda-e2e.vbdproj conserva «Proyecto sin título» como nombre interno. Conviene ofrecer un campo de nombre al crear/guardar, sin asumir que el nombre de archivo deba renombrar el proyecto automáticamente.

## Feedback del producto

### Pros

1. **Recuperación efectiva:** la restauración recuperó los cambios reales de la sesión, incluida la entidad adicional.
2. **Persistencia del chat por proyecto:** Nuevo limpió la conversación y Abrir restauró los mensajes del archivo correcto.
3. **Separación de revisión local e IA:** permite evaluar reglas sin depender del servicio remoto; los errores de IA no bloquearon la edición.
4. **Diseño centrado en el lienzo:** herramientas arrastrables y panel superpuesto permiten aprovechar el espacio.
5. **Edición reversible y trazable:** renombrar, deshacer, rehacer y consultar historial funcionaron.
6. **Tratamiento explícito de incertidumbre:** aparecen valores desconocidos en vez de inventar tipos; falta unificar cómo se resumen.
7. **Exportación documental útil:** el paquete incluye diccionario, claves, reglas, pendientes y revisión local. Los formatos gráficos explican límites antes de exportar.
8. **Privacidad visible:** la clave se presentó enmascarada y los artefactos documentales inspeccionados no incluyeron el chat ni la configuración del proveedor. Esto no equivale a una auditoría criptográfica del almacenamiento.

### Contras

1. La interpretación importada exige revisar manualmente cada relación, aunque el resumen diga que no hay ambigüedades.
2. El modelo permite estados incompletos que visualmente se parecen a restricciones terminadas.
3. Las interrupciones del proveedor y los errores de integración no ofrecen un camino de recuperación suficientemente directo.
4. El flujo de edición de atributos es repetitivo para modelos de tamaño mediano.
5. La navegación espacial requiere mover herramientas y ajustar el lienzo manualmente; falta una acción visible de encuadre.
6. Pasar todas las pruebas unitarias no garantiza que main, preload y renderer funcionen juntos en la sesión instalada.

### Áreas de oportunidad y orden recomendado

| Prioridad | Trabajo propuesto | Beneficio |
| --- | --- | --- |
| Inmediata | Resolver H01 y añadir aserciones de extremos y cardinalidades, no solo de cantidad de relaciones | Evitar corrupción semántica silenciosa |
| Inmediata | Eliminar colisión Ctrl+R | Evitar interrupciones y dependencia de recuperación |
| Inmediata | Repetir exportaciones desde una sesión coherente y automatizar el recorrido integrado | Hacer confiable la salida prometida |
| Siguiente | Editor explícito de claves compuestas y mapeos FK | Preparar modelos utilizables por SQL/NoSQL/ORM o agentes |
| Siguiente | Unificar pendientes y prerrequisitos de normalización | Comunicar el grado real de certeza |
| Siguiente | Errores de IA contextualizados, reintento y estado de disponibilidad | Reducir fricción ante fallos externos |
| Después | Ajustar al contenido, evitar solapamiento inicial y conservar posición de herramientas | Mejorar orientación espacial |
| Después | Edición tabular de atributos y acceso directo al campo de cada hallazgo | Reducir pasos de modelado |

## Pruebas bloqueadas o pendientes

- Calidad de respuesta de Gemini y razonamiento sobre relaciones: bloqueada por 503 en revisión y chat.
- Generación, discusión, aprobación, rechazo y comparación de propuestas reales: no hubo propuestas generadas.
- Reimportación del draw.io exportado y validación visual de SVG/PNG/Mermaid: el guardado gráfico falló en la instancia abierta.
- Markdown y JSON individuales: no se probaron como formatos separados; sí juntos en paquete.
- Importación de imagen con visión y archivo draw.io externo: no ejecutadas en esta sesión.
- Cambio de proveedor, borrar/revelar credencial, almacenamiento cifrado tras reiniciar el sistema: no ejecutados; se preservó configuración existente.
- Errores 401, 429, timeout, desconexión, reintentos internos y límites de consumo: sin inyección de fallos; no se verificaron de extremo a extremo.
- Eliminación de objetos, limpieza de registros e historial y recuperación tras cierre forzado: no ejecutadas.
- Modo claro, ventana pequeña, escalado de pantalla, macOS/Linux, lector de pantalla y navegación completa solo con teclado: pendientes. Se comprobaron algunos atajos y Escape, no accesibilidad integral.
- Rendimiento con cientos de entidades, archivos corruptos/grandes y pruebas de seguridad: pendientes.

## Evidencias y estado final

| Archivo | Contenido |
| --- | --- |
| tienda-prueba.md | Entrada sintética reproducible |
| tienda-e2e.vbdproj | Proyecto final v15, con nota y chat; conserva defectos encontrados |
| Proyecto sin título-export-2f81b0a5/Proyecto sin título-reporte.md | Reporte generado por la aplicación, snapshot v13 anterior a la nota |
| Proyecto sin título-export-2f81b0a5/Proyecto sin título-modelo.json | Modelo estructurado del mismo snapshot v13 |

Los archivos exportados se inspeccionaron: son legibles, contienen cinco entidades y cuatro relaciones, conservan la descripción con acentos y &, y no contienen la solicitud de chat de esta prueba, nombres de campos apiKey/credencial ni la ruta personal de importación buscada. No se inspeccionó la clave secreta para comparar su valor. No se adjuntan capturas como archivos de evidencia; las observaciones visuales corresponden a la interacción en vivo.

La aplicación quedó abierta con el proyecto de prueba guardado. No se hicieron correcciones, commit ni push como parte de esta auditoría. El siguiente ciclo debe corregir los fallos prioritarios y repetir primero T02–T03, T18 y T26–T29; después completar los recorridos bloqueados cuando Gemini responda correctamente.


## Ubicación de las evidencias

Tras organizar el repositorio, las salidas de esta sesión se conservan en `artefactos-locales/pruebas/2026-10-18/`, ignoradas por Git. Los nombres y rutas del relato describen el momento de la prueba, salvo los enlaces actualizados. La entrada reproducible está en `tests/fixtures/tienda-prueba.md`; el ejemplo Markdown exportado se conserva como `ejemplo-reporte-exportado.md`.
