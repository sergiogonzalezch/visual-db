# Plan de producto y arquitectura
## Aplicación de escritorio para diseñar y revisar bases de datos visualmente

**Estado:** plan original de referencia; varias funciones ya están implementadas. Consulta el [estado vigente](../../README.md) y los [pendientes actuales](../../pendientes.md); este documento conserva la intención inicial.
**Principio central:** la IA propone; el usuario aprueba o rechaza.  
**Almacenamiento:** local por defecto.  
**Restricción permanente:** no generar SQL, DDL ni código.

## 1. Visión y alcance del MVP

La aplicación será una pizarra visual para construir, importar y revisar modelos relacionales. El diagrama ocupa el centro de la experiencia. Un agente integrado explica problemas, plantea preguntas y prepara cambios visuales, sin modificar el diseño por su cuenta.

El producto distingue tres estados: **interpretación pendiente → diseño confirmado → propuestas por aprobar**. Confirmar una importación no equivale a aprobar mejoras posteriores.

El MVP trabajará con un modelo relacional lógico y una notación inicial de pata de cuervo. Permitirá entidades, atributos, claves y relaciones, sin ofrecer editores conceptuales y físicos independientes.

| Dentro del MVP | Fuera del MVP |
|---|---|
| Crear proyectos desde un lienzo vacío | Generar SQL, DDL o código |
| Importar draw.io, imágenes y Markdown con límites documentados | Conectarse a bases de datos reales |
| Confirmar y corregir la interpretación | Ejecutar migraciones o cambios externos |
| Editar entidades, atributos, claves y cardinalidades | Colaboración simultánea y cuentas |
| Revisar estructura y posibles problemas de normalización | Certificar normalización sin reglas de negocio suficientes |
| Propuestas ancladas al diagrama y comparación antes/después | Optimización física basada en consultas reales |
| Aceptar, rechazar, discutir y deshacer cambios | Cambios autónomos o aprobación automática |
| Guardar proyectos e historial localmente | Reproducir cualquier dibujo arbitrario de draw.io |
| Ollama y una familia inicial de API remota | Compatibilidad universal con cualquier API desde el lanzamiento |

### Criterios de éxito

- El usuario comprende qué se interpretó y puede corregirlo visualmente.
- Cada hallazgo identifica los elementos afectados y explica su fundamento.
- Ninguna propuesta modifica el diseño sin aprobación explícita.
- Cada cambio aceptado puede deshacerse.
- Un proyecto puede guardarse y reabrirse sin pérdida de significado ni disposición.
- La edición básica y los validadores locales funcionan sin conexión a un modelo.

## 2. Funcionalidades priorizadas

| Prioridad | Funcionalidades |
|---|---|
| Imprescindibles | Lienzo editable; entidades y atributos; claves primarias, candidatas y foráneas, incluidas las compuestas; cardinalidad mínima/máxima; importación de los tres formatos; confirmación de interpretación; revisión estructural; análisis condicionado de 1FN–BCNF; propuestas visuales; aprobación individual; comparación; deshacer; guardado local; chat con referencias; prueba de conexión |
| Deseables | Distribución automática con vista previa; búsqueda; revisión de una selección; filtros; exportación visual; atajos; recuperación tras cierre inesperado; grupos de cambios relacionados |
| Futuras | Notaciones adicionales; módulos y diagramas grandes; comparación de versiones; más adaptadores; informes de revisión; catálogos reutilizables de reglas de negocio |

La interacción se basa en arrastrar, conectar, seleccionar y completar formularios. Escribir nombres y descripciones será necesario, pero ninguna tarea exigirá código ni expresiones técnicas.

## 3. Flujos de usuario

### 3.1 Importar y revisar

```text
Importar archivo
      ↓
Interpretación provisional
      ↓
Comparar fuente y diagrama
      ↓
Resolver dudas o conservarlas como desconocidas
      ↓
Confirmar interpretación
      ↓
Solicitar revisión
      ↓
Explorar hallazgos sobre el lienzo
      ↓
Ver antes/después → Discutir / Rechazar / Aceptar
                                           ↓
                                Aplicar y guardar historial
```

La confirmación puede conservar información desconocida. La revisión indica qué conclusiones quedan limitadas por ella. Los errores que impiden construir una estructura coherente, como una relación sin extremos identificados, deben resolverse o excluirse explícitamente de la parte revisable.

### 3.2 Crear desde cero

1. Crear un proyecto local.
2. Arrastrar entidades y añadir atributos.
3. Marcar claves mediante controles visuales.
4. Conectar entidades y seleccionar cardinalidades.
5. Registrar reglas de negocio mediante preguntas guiadas.
6. Solicitar revisión o una propuesta de diseño.

Si el usuario pide al agente un diseño completo, este genera un borrador separado. Solo se incorpora al lienzo principal cuando el usuario lo aprueba.

### 3.3 Aprobar una propuesta

1. Seleccionar una marca del diagrama.
2. Leer problema, fundamento, supuestos y consecuencias.
3. Comparar el estado actual con el propuesto.
4. Discutir, rechazar o aceptar.
5. Validar que la propuesta siga siendo aplicable a la versión actual.
6. Aplicar todos sus cambios como una operación reversible.

Discutir nunca equivale a aprobar. Si la conversación modifica una propuesta, su nueva versión requiere aprobación.

### 3.4 Cambios y fallos durante una revisión

- Si el usuario edita elementos afectados, las propuestas correspondientes quedan desactualizadas.
- Si falla el proveedor, el proyecto permanece editable y se puede reintentar la revisión.
- Si una propuesta depende de otra, la interfaz muestra esa dependencia antes de aprobar.
- Rechazar conserva el registro de la decisión, sin alterar el diseño.

## 4. Interfaz y componentes

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Proyecto · Guardado   Importar   Deshacer/Rehacer   Revisar   Modelo │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ Herramientas│                                     │ Panel contextual  │
│ Entidad    │               LIENZO                │ Propiedades       │
│ Relación   │                                     │ o Revisión        │
│ Nota       │    [Cliente] ───────< [Pedido]        │ o Chat            │
│            │                         ◉ 2         │                   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ Interpretación · Pendientes · Zoom · Historial                       │
└──────────────────────────────────────────────────────────────────────┘
```

El lienzo recibe aproximadamente el 70% del espacio. El panel derecho es ajustable y muestra una función contextual a la vez.

| Componente | Comportamiento |
|---|---|
| Tarjeta de entidad | Nombre, atributos e indicadores de claves |
| Conector | Cardinalidad y participación en ambos extremos |
| Marcas de revisión | Icono, texto y color; nunca solo color |
| Panel contextual | Propiedades, propuesta seleccionada o chat |
| Comparación | Alternar Actual/Propuesto conservando posición y zoom |
| Confirmación de importación | Fuente original junto al borrador editable |
| Historial | Cambios manuales y aceptados, con posibilidad de deshacer |

Los mensajes describen acciones concretas: «Falta confirmar la relación Cliente–Pedido». Las ambigüedades de importación y los problemas de diseño usan indicadores distintos.

## 5. Contrato entre el agente y el diagrama

### 5.1 Qué ve el agente

- Modelo confirmado con identificadores estables.
- Entidades, atributos, claves y relaciones.
- Reglas de negocio y dependencias funcionales declaradas.
- Información desconocida y supuestos pendientes.
- Selección actual y contexto relacionado.
- Versión del diseño y propuestas relevantes.

Para revisar estructura recibe el modelo semántico; no necesita una captura en cada interacción. Las imágenes se utilizan durante la interpretación o cuando sea necesario aclarar una referencia visual.

### 5.2 Qué devuelve

| Campo de propuesta | Propósito |
|---|---|
| Identificador y versión de origen | Vincularla con el diseño revisado |
| Elementos afectados | Localizar el problema |
| Categoría y prioridad | Clasificar el hallazgo |
| Explicación y fundamento | Justificar la propuesta |
| Supuestos y preguntas | Separar hechos de interpretaciones |
| Operaciones del dominio | Añadir, modificar, trasladar o eliminar elementos |
| Resultado y contrapartidas | Mostrar beneficios y consecuencias |
| Dependencias | Evitar cambios incompatibles |

Las operaciones pertenecen a un catálogo cerrado. El agente no recibe acceso de escritura al proyecto ni devuelve instrucciones ejecutables.

### 5.3 Representación visual

- Elemento afectado: contorno resaltado y comentario anclado.
- Elemento nuevo: figura provisional con borde discontinuo.
- Eliminación: marca dentro de la vista propuesta.
- Relación modificada: cardinalidades anteriores y propuestas.
- Cambio compuesto: una tarjeta agrupa todos los elementos implicados.

Ejemplo: separar los datos del cliente almacenados en Pedido muestra conjuntamente la entidad Cliente propuesta, los atributos trasladados y la nueva relación. Se aprueba como una unidad coherente.

### 5.4 Normalización y límites del análisis

El diagrama por sí solo no permite demostrar siempre las formas normales. Se necesitan reglas de negocio, claves candidatas y dependencias funcionales suficientemente completas.

| Nivel | Comprobación |
|---|---|
| 1FN | Ausencia de grupos repetitivos y atomicidad de valores respecto al dominio |
| 2FN | Estando en 1FN, ausencia de dependencia de atributos no primos respecto a una parte propia de una clave candidata |
| 3FN | Para cada dependencia funcional no trivial, el determinante es superclave o el atributo dependiente es primo |
| BCNF | Todo determinante de una dependencia funcional no trivial es superclave |

La interfaz traduce estas condiciones en preguntas comprensibles. Por ejemplo: «¿Cada código postal determina una única ciudad en tu sistema?».

Los resultados se presentan como **verificado con la información declarada**, **posible problema** o **información insuficiente**. Un porcentaje de confianza del modelo no sustituye la evidencia. La descomposición propuesta debe explicar preservación de información y, cuando corresponda, el impacto sobre las dependencias; BCNF puede implicar contrapartidas respecto a su preservación.

## 6. Conversión al modelo interno

### 6.1 Modelo interno único

| Parte | Contenido |
|---|---|
| Diseño | Entidades, atributos, tipos opcionales, nulabilidad y unicidad |
| Claves | Primarias, candidatas y foráneas; simples o compuestas |
| Relaciones | Extremos, cardinalidades mínima/máxima y correspondencia de atributos |
| Reglas | Reglas de negocio, dependencias y supuestos |
| Presentación | Posición, tamaño, conectores y notas |
| Procedencia | Archivo, página, fragmento o región de imagen |
| Revisión | Ambigüedades, confirmaciones, propuestas y decisiones |

El significado se separa de la presentación. **Desconocido** es un valor explícito, diferente de opcional, inexistente o no aplicable.

### 6.2 draw.io

1. Leer el XML y descomprimir el contenido cuando corresponda.
2. Seleccionar una página para importar en el MVP.
3. Extraer figuras, textos, grupos, conectores, estilos y geometría.
4. Reconocer las convenciones ER documentadas.
5. Construir el borrador y conservar procedencia y disposición cuando sea viable.
6. Mostrar elementos no clasificados y conexiones ambiguas.
7. Permitir asignar visualmente su significado y confirmar.

La lectura estructural es determinista y no requiere IA. La semántica depende de las convenciones del dibujo. Una figura que parece una entidad no garantiza que lo sea. Los elementos no reconocidos nunca se descartan silenciosamente.

### 6.3 Imágenes

1. Comprobar formato, tamaño y legibilidad.
2. Verificar que el modelo seleccionado acepte imágenes.
3. Extraer entidades, atributos, claves, conectores y cardinalidades con visión.
4. Validar la estructura obtenida.
5. Asociar elementos con regiones de origen cuando sea posible.
6. Mostrar imagen y borrador juntos para corregir y confirmar.

Texto ilegible, cruces de líneas y cardinalidades dudosas quedan marcados. El modelo no debe completar información faltante como si estuviera observada.

### 6.4 Markdown

1. Leer estructura, tablas y listas reconocibles sin IA cuando sea posible.
2. Interpretar prosa y reglas de negocio mediante un modelo de texto.
3. Vincular las interpretaciones a fragmentos de origen.
4. Distinguir información explícita de inferencias.
5. Resolver contradicciones y confirmar el borrador.

Conviene ofrecer una plantilla Markdown opcional para mejorar la fiabilidad, manteniendo la posibilidad de importar prosa libre.

### 6.5 Resolución de ambigüedades

Cada duda ofrece acciones específicas: clasificar figura, corregir texto, elegir extremo de relación, seleccionar cardinalidad o dejar el dato como desconocido. La aplicación diferencia incertidumbre de lectura, ambigüedad semántica y ausencia real de información.

### 6.6 Modelo sin visión

Antes de enviar una imagen, ofrecer:

1. Elegir un modelo con visión local o remoto.
2. Importar draw.io o Markdown.
3. Usar la imagen como referencia para reconstrucción manual.

No se intenta interpretar una imagen con un modelo solo de texto. Un reconocimiento de texto podría ayudar en una fase posterior, pero no resuelve por sí mismo relaciones y cardinalidades.

## 7. Arquitectura de alto nivel

```text
               INTERFAZ DE ESCRITORIO
        Lienzo · Propiedades · Chat · Comparación
                           │
                 Servicios de aplicación
                Importar · Revisar · Aprobar
                           │
                  NÚCLEO DEL DOMINIO
          Modelo · Reglas · Versiones · Historial
                │                       │
        Persistencia local      Coordinador de IA
                                        │
                               Adaptadores de proveedor
                                 │               │
                              Ollama         API remotas
```

| Componente | Responsabilidad |
|---|---|
| Lienzo | Representación e interacción visual |
| Núcleo del dominio | Coherencia y significado del diseño |
| Importadores | Borradores, procedencia e incertidumbre |
| Validadores locales | Referencias rotas, claves inconsistentes y relaciones incompletas |
| Coordinador de IA | Contexto, solicitudes y validación de respuestas |
| Servicio de aprobación | Aprobación explícita, versión, dependencias y aplicación atómica |
| Historial | Operaciones manuales y aceptadas reversibles |
| Persistencia | Proyecto, adjuntos y recuperación |

Los importadores crean borradores y la IA crea propuestas. Solo el servicio de aprobación aplica propuestas al modelo principal. Las ediciones manuales pasan por las mismas reglas de coherencia e historial.

### 7.1 Persistencia

Propuesta inicial: archivo de proyecto local versionado que contenga documentos estructurados y adjuntos. Una base embebida interna es alternativa si crece la complejidad del historial. Esta decisión no implica generar código para el usuario.

- Guardado atómico y copias de recuperación.
- Versionado del formato y migraciones internas controladas.
- Credenciales en el almacén seguro del sistema operativo, fuera del proyecto.
- Posibilidad de omitir adjuntos originales sensibles del archivo final, explicando la pérdida de referencias.

### 7.2 Adaptadores intercambiables

Configuración visible: proveedor, endpoint, modelo y clave cuando se necesite. Un endpoint configurable no hace equivalentes todas las API.

Cada adaptador declara visión, respuestas estructuradas, límites de contexto e imágenes, conversación progresiva, cancelación, autenticación y manejo de errores. «Probar conexión» comprueba acceso y capacidades; lo no verificable se muestra como tal.

El núcleo utiliza contratos propios para interpretar fuentes, conversar y proponer cambios. El adaptador traduce esos contratos al proveedor. Las respuestas se validan aunque el proveedor admita un esquema estructurado.

Ante una respuesta inválida se permite un intento acotado de corrección. Si falla, se informa al usuario y se conserva el diseño intacto. No hay cambio silencioso de proveedor.

### 7.3 Integridad y privacidad

- Propuestas vinculadas a una versión y a elementos concretos.
- Detección de propuestas desactualizadas antes de aplicar.
- Cambios compuestos atómicos: todos se aplican o ninguno.
- Modo Solo local que bloquea conexiones remotas de la aplicación.
- Información visible sobre el contenido que se enviará a una API.
- Archivos importados tratados como datos, nunca como instrucciones para el agente.
- Lectores de archivos con límites de tamaño y sin resolución de recursos externos innecesarios.
- Registros técnicos sin claves de API ni contenido sensible por defecto.

## 8. Tecnologías de escritorio

La siguiente tabla es una valoración de arquitectura para este producto, sujeta a experiencia del equipo y pruebas de rendimiento.

| Opción | Ventajas | Desventajas | Encaje |
|---|---|---|---|
| Electron + TypeScript | Representación consistente; mismo lenguaje para gran parte de la aplicación; buen encaje con un lienzo web | Mayor consumo base y tamaño; requiere aislamiento entre interfaz y sistema | Validar pronto el MVP |
| Tauri + TypeScript + Rust | Aprovecha WebView del sistema; potencial de menor distribución; separación entre interfaz y núcleo | Dos lenguajes y diferencias de WebView entre plataformas | Cuando tamaño y consumo sean prioritarios |
| Qt/PySide6 + Python | Herramientas de escritorio y gráficos personalizados; adecuado para equipos con experiencia en Qt | Trabajo de interacción visual; empaquetado y licencias por evaluar | Equipo con dominio previo de Qt |

**Recomendación inicial:** Electron y TypeScript para validar el producto, condicionados a una prueba de consumo y fluidez con diagramas representativos. Si memoria o instalador son restricciones firmes, comparar con Tauri antes de cerrar la decisión.

El componente de lienzo debe evaluarse por soporte de conectores, cardinalidades, selección, navegación por teclado, superposiciones, comparación y escala. Su estructura interna no será la fuente de verdad del diseño.

## 9. Riesgos y decisiones abiertas

| Riesgo | Consecuencia | Tratamiento |
|---|---|---|
| Confundir dibujo con significado | Interpretación semántica incorrecta | Convenciones admitidas y confirmación |
| Normalización sin reglas suficientes | Conclusiones falsas | Preguntas y resultados condicionados |
| Imagen ilegible | Elementos inventados | Incertidumbre visible y corrección |
| Diseño modificado durante una revisión | Propuestas incompatibles | Versionado y conflictos |
| Exceso de marcas | Pérdida de claridad | Filtros y detalle contextual |
| Diagramas grandes | Lentitud y contexto incompleto | Pruebas de escala y revisión por partes |
| Diferencias entre proveedores | Funciones irregulares | Adaptadores y capacidades explícitas |
| Optimización sin carga de trabajo | Recomendaciones débiles | Limitar conclusiones a evidencia disponible |
| Pérdida de historial o archivo | Pérdida de trabajo | Guardado atómico y recuperación |

| Decisión abierta | Propuesta inicial |
|---|---|
| Sistema operativo | Windows primero; confirmar con usuarios |
| Notación | Pata de cuervo |
| Nivel de diseño | Relacional lógico |
| Compatibilidad draw.io | Convenciones ER documentadas y una página seleccionada |
| Escala inicial | Evaluar 100 entidades y 1.000 atributos; es objetivo de prueba, no garantía |
| Proveedores | Ollama y una familia inicial de API remota |
| Aprobación | Individual; grupos para cambios inseparables |
| Datos de ejemplo | Fuera del MVP |
| Fidelidad gráfica | Priorizar significado y legibilidad |
| Historial | Definir persistencia y comportamiento de deshacer al reabrir |
| Distribución | Definir firma, instalador y estrategia de actualización |

## 10. Roadmap por fases

| Fase | Entregable | Criterio para avanzar |
|---|---|---|
| 0. Validación | Prototipo navegable y ejemplos de los tres formatos | Usuarios comprenden importar, confirmar, revisar y aprobar |
| 1. Núcleo visual | Modelo, lienzo, edición, guardado y deshacer | Crear, guardar, reabrir y restaurar sin pérdida |
| 2. Importación verificable | Tres importadores, procedencia y dudas | Nada no reconocido desaparece; las ambigüedades se corrigen |
| 3. Revisión asistida | Validadores, reglas de negocio, chat y adaptadores | Hallazgos localizados y supuestos explícitos |
| 4. Aprobación e historial | Comparación, aplicación reversible y conflictos | Ningún cambio del agente se aplica sin aprobación |
| 5. Piloto del MVP | Instalador, recuperación y pruebas con usuarios | Flujo completo fiable ante fallos y casos representativos |
| 6. Evolución | Más proveedores, escala y funciones según demanda | Mejoras sustentadas en dificultades observadas |

No se fijan fechas sin conocer equipo, experiencia, presupuesto y plataformas. La importación por visión, el lienzo y la calidad de las propuestas requieren pruebas tempranas antes de estimar el desarrollo completo.

### Validaciones del piloto

- Comparar importaciones contra modelos de referencia y registrar errores por tipo.
- Comprobar que los casos ambiguos se señalan en lugar de resolverse silenciosamente.
- Verificar aprobación, rechazo, discusión, propuesta desactualizada y deshacer.
- Probar cierres inesperados, archivos dañados, desconexiones y respuestas inválidas.
- Medir fluidez del lienzo, consumo y tiempo de revisión con diagramas representativos.
- Observar si los usuarios entienden las consecuencias antes de aceptar.

## Referencias técnicas

Estas referencias respaldan características de los formatos y plataformas. Las decisiones de alcance y arquitectura son propuestas para este producto.

- [draw.io: estructura XML del diagrama](https://www.drawio.com/docs/manual/advanced/diagram-source-edit/).
- [Ollama: modelos con visión](https://docs.ollama.com/capabilities/vision).
- [Ollama: respuestas estructuradas](https://docs.ollama.com/capabilities/structured-outputs).
- [Electron: modelo de procesos](https://github.com/electron/electron/blob/main/docs/tutorial/process-model.md).
- [Tauri: modelo de procesos y WebViews](https://tauri.app/concept/process-model/).
- [Qt para Python](https://doc.qt.io/qtforpython-6/).

**Resultado esperado:** el usuario entiende qué se interpretó, por qué se propone un cambio, cómo afectaría al diseño y cómo volver al estado anterior.
