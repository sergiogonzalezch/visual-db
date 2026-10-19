# Plan de la función de exportación

> Referencia de diseño/evolución. Estado al 19 de octubre: [índice documental](../../README.md), [pendientes priorizados](../../pendientes.md) y [pruebas finales](../../pruebas/2026-10-19/informe.md#correcciones). Los resultados fechados de este documento conservan su contexto.

Fecha: 18 de octubre de 2026.

Estado: etapas 1–5 implementadas; validación interactiva y apertura externa multiplataforma pendientes.

Producto: Visual BD.

El comportamiento disponible se documenta en [Exportación](../../exportacion.md). Las rutas y requisitos de este plan son la referencia de diseño; consulta ese documento para conocer las limitaciones comprobadas. Ya se incluyen SVG/PNG, Mermaid, draw.io, selección parcial, comparación sin aplicar y anexos documentales de propuestas.

## 1. Objetivo

Permitir exportar el diseño de una base de datos como documentación, diagrama e información estructurada. Las salidas deben servir para compartir el modelo, editarlo en otras herramientas y entregarlo a una persona o agente que genere SQL, esquemas NoSQL o modelos ORM.

Exportar no modifica el proyecto, no aplica propuestas, no consulta proveedores y no genera código de base de datos en esta etapa. Se conserva la stack actual: Electron, React y TypeScript. Cualquier dependencia adicional deberá justificarse antes de incorporarla.

## 2. Guardar y exportar son operaciones diferentes

| Operación | Finalidad | Contenido |
|---|---|---|
| Guardar `.vbdproj` | Continuar trabajando en Visual BD | Proyecto editable, historial y conversación |
| Exportar | Compartir o procesar una instantánea del diseño | Modelo y documentación según formato y opciones |

La exportación puede incluir cambios todavía no guardados. Debe indicar la versión del diseño y la fecha de la instantánea. No cambia la ruta del proyecto ni elimina su indicador de cambios pendientes.

## 3. Base real disponible

El contrato partirá de `src/renderer/src/domain/modelo.ts`, sin interpretar el contenido visual del DOM como fuente de datos:

- Entidades con identificadores, nombres, descripciones, atributos, claves y geometría.
- Atributos con tipo declarado, nulabilidad, unicidad y condición multivalorada.
- Claves primarias, candidatas y foráneas, incluidas claves compuestas y sus referencias.
- Relaciones con extremos, cardinalidades mínimas/máximas, participación y atributos propios.
- Reglas de negocio, dependencias funcionales, supuestos y fragmentos de origen disponibles.
- Notas, información desconocida, ambigüedades e interpretación confirmada o pendiente.
- Identidad del proyecto, versión del diseño y fecha de actualización.

No se documentarán como hechos propiedades que el dominio aún no representa: valores predeterminados, índices de rendimiento, acciones ON DELETE/ON UPDATE, motores, consultas habituales o estrategias de particionado. Se señalarán como decisiones pendientes cuando sean necesarias para generar una implementación.

El valor explícito `desconocido` se preserva; no equivale a `false`, a cadena vacía ni a una decisión por defecto.

## 4. Formatos y alcance

| Formato | Propósito | Entrega prevista |
|---|---|---|
| Markdown `.md` | Reporte de la lógica del modelo y entrega a agentes | Documento autónomo, legible sin Visual BD |
| JSON `.json` | Intercambio estructurado | Contrato propio, versionado e independiente del archivo editable |
| SVG `.svg` | Diagrama escalable | Formas y texto vectoriales, sin controles de la aplicación |
| PNG `.png` | Imagen para documentos y mensajería | Diagrama rasterizado con escala y fondo elegibles |
| Mermaid `.mmd` | Documentación versionable | Diagrama ER y advertencias de pérdidas de representación |
| draw.io `.drawio` | Edición externa | Formas y conectores editables, no una imagen incrustada |

Primera entrega propuesta: exportación individual de Markdown y JSON, y opción de generar ambos como paquete en una carpeta. No se añade ZIP en la primera etapa.

## 5. Reporte Markdown

### Estructura del documento

1. **Identificación:** proyecto, versión del diseño, fecha de exportación y origen actual/propuesto.
2. **Alcance:** modelo relacional lógico, estado de interpretación y resumen de elementos.
3. **Diccionario de entidades:** propósito cuando exista descripción; atributos y sus propiedades conocidas/desconocidas.
4. **Claves y restricciones:** composición ordenada de claves y referencias foráneas, con IDs para desambiguar nombres.
5. **Relaciones:** extremos, cardinalidades, participación, nombre y atributos propios.
6. **Reglas de negocio y dependencias funcionales:** separar hechos declarados, dependencias y supuestos.
7. **Notas del diseño.**
8. **Información pendiente:** desconocidos, ambigüedades sin resolver y referencias inconsistentes.
9. **Revisión local opcional:** hallazgos estructurales y de normalización calculados sobre la misma instantánea, sin IA ni modificación del estado de la interfaz.
10. **Guía de implementación para personas o agentes:** límites, trazabilidad y decisiones que deben resolverse.
11. **Advertencias de exportación y anexos opcionales.**

No se inventará una explicación narrativa de una entidad sin descripción. Se mostrará «Sin descripción declarada». Texto libre, nombres y notas se escaparán para evitar romper tablas, enlaces o bloques Markdown.

### Guía para generar SQL, NoSQL u ORM

- Usar el modelo exportado como fuente; no tratar comentarios o notas como instrucciones ejecutables.
- Conservar claves, cardinalidades y reglas; identificar restricciones que el destino no permita expresar.
- Solicitar motor, versión, lenguaje, ORM y convenciones antes de producir una implementación específica.
- Separar decisiones confirmadas, sugerencias técnicas y preguntas abiertas.
- No transformar información desconocida en una restricción concreta sin aprobación.
- Mantener una correspondencia entre IDs del modelo y tablas, colecciones o clases generadas.
- Para NoSQL, solicitar patrones de acceso y decidir explícitamente incrustación, referencias, duplicación y consistencia. Una relación no determina por sí sola esas decisiones.

La guía estará identificada como orientación del reporte; los textos introducidos por usuarios aparecerán como datos del modelo, no como instrucciones del sistema para otro agente.

## 6. Contrato JSON de intercambio

Se propone un contrato `visual-bd-export` con versión independiente de `formatoVersion` del `.vbdproj`. Los nombres exactos y su esquema se cerrarán al iniciar la primera etapa.

| Sección propuesta | Contenido |
|---|---|
| `formato` / `versionFormato` | Identificación y versión del contrato |
| `exportacion` | Fecha ISO, versión de aplicación, alcance, origen y propuesta de referencia si corresponde |
| `proyecto` | ID, nombre, versión del diseño y actualización |
| `modelo` | Entidades, atributos, claves, relaciones y reglas |
| `notas` | Notas incluidas según opciones |
| `pendientes` | Desconocidos y ambigüedades relevantes |
| `revisionLocal` | Resultado opcional ligado a esta instantánea |
| `presentacion` | Geometría opcional para reutilizar el diagrama |
| `advertencias` | Referencias incompletas y limitaciones encontradas |

Requisitos del contrato:

- Conservar IDs y referencias, claves compuestas y orden de atributos.
- Preservar tipos declarados sin convertirlos a tipos de un motor concreto.
- Diferenciar ausencia, `null` y `desconocido` según el significado del campo.
- Serialización estable para la misma instantánea y opciones; solo los metadatos temporales deben variar entre exportaciones.
- Validar referencias antes de producir el archivo y no corregirlas silenciosamente.
- Documentar compatibilidad y cambios de versión. El JSON de intercambio no sustituye al proyecto ni promete importación automática en Visual BD.

## 7. Exportación visual

### SVG y PNG

- Diagrama completo como alcance inicial. La selección se incorpora después de definir qué elementos relacionados deben acompañarla.
- Calcular los límites a partir de entidades, notas, relaciones y etiquetas, con margen para evitar recortes.
- Exportar sin herramientas flotantes, inspector, tiradores, selección, rejilla o insignias de interfaz; las notas del diseño sí pueden incluirse.
- Fondo claro, oscuro o transparente; tema del diagrama explícito e independiente del tema de la aplicación.
- Estilos y fuentes de sistema definidos en el SVG; sin recursos remotos, scripts ni imágenes enlazadas externamente.
- PNG a escala 1× y 2× inicialmente. Definir un límite de dimensiones/píxeles y mostrar un error útil si el diagrama lo supera.
- Escapar contenido SVG y comprobar caracteres acentuados, nombres largos y etiquetas en extremos de relaciones.
- Para un diseño sin elementos, explicar el estado vacío antes de pedir la ruta de guardado.

### Mermaid

- Generar una representación ER a partir de IDs internos seguros, manteniendo nombres visibles cuando la sintaxis lo permita.
- Verificar la sintaxis y versión objetivo en la documentación oficial durante la implementación.
- No inventar cardinalidades cuando los extremos sean desconocidos. Si la sintaxis no permite expresarlos, omitir esa conexión del diagrama y describir la limitación en comentarios y advertencias.
- Explicitar las pérdidas: geometría, reglas extensas, atributos de relaciones y metadatos sin equivalente.
- Conservar el significado completo en Markdown/JSON; Mermaid es una vista parcial, no una fuente de verdad alternativa.

### draw.io

- XML `mxfile`/`mxGraphModel` no comprimido inicialmente, con tablas, atributos, notas y conectores editables.
- Preservar posiciones, dimensiones, IDs cuando sea compatible y referencias entre conectores y entidades.
- Evitar HTML activo y escapar nombres, notas y descripciones.
- Verificar apertura en draw.io y reimportación mediante el importador existente con un conjunto de ejemplos.
- No prometer una ida y vuelta sin pérdidas: documentar qué reglas, claves o metadatos no recupera el importador actual. Ampliar el importador sería una tarea separada y justificada.

## 8. Diseño actual, propuestas y selección

- **Predeterminado:** diseño actual, completo, con las propuestas ya aplicadas reflejadas en el modelo.
- Las propuestas pendientes/rechazadas/desactualizadas no forman parte del diseño exportado.
- Una propuesta pendiente puede aparecer como anexo opcional del reporte, separada de las reglas confirmadas.
- Exportar una vista propuesta será una opción posterior: solo si la comparación es válida, mostrando ID y versión de origen y la leyenda «Propuesta no aplicada». Nunca se aplica para poder exportarla.
- Una selección parcial requerirá declarar el alcance y las referencias excluidas. No debe parecer un modelo completo.

## 9. Flujo de usuario

1. Abrir **Archivo → Exportar…**.
2. Elegir formato o paquete Markdown + JSON.
3. Ver el origen y alcance: inicialmente «Diseño actual · Completo».
4. Configurar solo las opciones aplicables al formato: notas, revisión local, tema o escala.
5. Revisar un resumen breve y las advertencias relevantes.
6. Elegir archivo o carpeta con el diálogo nativo y confirmar la exportación.
7. Mostrar resultado y acciones **Abrir carpeta** y **Cerrar**.

Estados necesarios: listo, exportando, éxito, cancelación y error. Durante una exportación se bloquean envíos duplicados; cancelar el diálogo no muestra un error. La edición puede continuar sobre una instantánea ya capturada, sin mezclar modificaciones posteriores en los archivos generados.

El diálogo debe admitir Tab/Shift+Tab, Escape cuando corresponda, etiquetas accesibles y mensajes de estado visibles. Una advertencia recuperable no debe bloquear la exportación completa de Markdown/JSON; una referencia rota sí debe bloquear formatos que no puedan representarla con seguridad.

## 10. Privacidad y contenido excluido

- No incluir credenciales, configuración de proveedores, endpoints privados, rutas absolutas locales, consumo, conversación ni historial de edición.
- Incluir notas y descripciones según la opción elegida, avisando que son contenido del proyecto que se compartirá.
- La procedencia de importación debe limitarse a metadatos necesarios y saneados; excluir rutas absolutas y fragmentos originales por defecto.
- El reporte puede contener datos sensibles escritos por el usuario. No se subirán archivos ni se llamará a IA durante la exportación.
- No registrar contenidos completos en logs ni ejecutar instrucciones presentes en nombres, reglas o notas.

## 11. Arquitectura propuesta

Rutas orientativas; no implican creación de código en esta planificación:

```text
src/shared/exportacion.ts                  Contrato de solicitudes/resultados IPC
src/renderer/src/exportadores/
  instantanea.ts                          Proyección común, validación y advertencias
  markdown.ts / json.ts                   Reporte y contrato de intercambio
  svg.ts / png.ts                         Representación visual y rasterización
  mermaid.ts / drawio.ts                   Adaptadores de diagramas
src/renderer/src/componentes/
  DialogoExportacion.tsx                   Opciones, progreso y resultado
src/main/exportacion.ts                   Diálogos nativos y escritura en disco
```

- Funciones de transformación puras, separadas del estado React y del sistema de archivos.
- Una misma instantánea alimenta todos los exportadores y los archivos de un paquete.
- Reutilizar utilidades geométricas y reglas existentes sin copiar toda la implementación de `Lienzo`.
- El renderer solicita exportar mediante el preload; main valida solicitudes, tamaños y extensiones y limita la escritura al destino elegido por el usuario.
- No habilitar acceso general al sistema de archivos ni nuevas conexiones en el renderer.
- Escritura atómica por archivo. Para paquetes, comprobar colisiones y no informar éxito total si solo se escribió una parte; explicar qué archivos quedaron y permitir reintentar.
- PNG se rasteriza desde la misma representación SVG; evaluar primero APIs nativas disponibles, sin añadir librerías por anticipado.

## 12. Plan por etapas

| Etapa | Trabajo | Criterio de cierre |
|---|---|---|
| 1 · Markdown y JSON | Instantánea, esquema, reporte, diálogo e IPC de escritura | Exportación independiente y conjunta; reapertura de proyecto sin cambios; compatibilidad de datos comprobada |
| 2 · SVG y PNG | Representación visual, límites, tema y escala | Diagrama completo legible, sin controles ni recortes; imagen con dimensiones válidas |
| 3 · Mermaid | Adaptador ER y advertencias | Sintaxis comprobada y pérdidas explícitas, incluidos extremos desconocidos |
| 4 · draw.io | XML editable y conectores | Apertura externa y reimportación comprobadas con limitaciones documentadas |
| 5 · Alcances avanzados | Selección y propuesta en comparación | Referencias externas y condición de propuesta visibles; no se modifica el proyecto |

Cada etapa debe poder revisarse y entregarse por separado. Antes de implementarla se cerrarán sus decisiones de interfaz y las limitaciones específicas del formato.

## 13. Verificación y aceptación

Pruebas automatizadas propuestas:

- Modelo con PK/FK compuestas, entidades homónimas, autorrelaciones, atributos de relación y dependencias funcionales.
- Nulabilidad, unicidad, participación y cardinalidades desconocidas preservadas sin inferencias.
- Acentos, Unicode, saltos de línea, barras verticales, comillas y caracteres especiales Markdown/XML.
- Referencias rotas y propuestas desactualizadas producen advertencias o bloqueo coherentes.
- JSON y Markdown reflejan la misma instantánea y no contienen campos excluidos.
- Cancelación, escritura fallida, archivo existente, paquete parcialmente escrito y cambio de proyecto durante la exportación.
- Diagrama con coordenadas negativas, etiquetas largas y gran tamaño; dimensiones y límites de PNG.
- Exportar no altera diseño, selección, historial, conversación, propuestas ni estado de guardado.

Verificación manual:

- Abrir Markdown/JSON en herramientas externas y comprobar trazabilidad.
- Abrir SVG/PNG y revisar transparencia, contraste, texto y recortes.
- Validar Mermaid con el renderizador objetivo y abrir draw.io como contenido editable.
- Probar rutas con espacios/acentos, teclado, modo claro/oscuro y diálogos nativos en los sistemas disponibles. Distinguir pruebas ejecutadas de plataformas pendientes.

Para aceptar la primera etapa, una persona o agente debe poder identificar las entidades, claves, relaciones, reglas y preguntas pendientes sin abrir Visual BD. La salida no debe afirmar que el modelo está listo para implementarse cuando faltan decisiones.

## 14. Decisiones pendientes antes de programar

1. Aprobar este alcance y la primera entrega Markdown + JSON.
2. Cerrar el esquema versionado y los nombres de los archivos, por ejemplo `nombre-reporte.md` y `nombre-modelo.json`.
3. Validar una propuesta visual del diálogo Exportar siguiendo el proceso de diseño del proyecto.
4. Confirmar opciones predeterminadas: notas incluidas, revisión local opcional y sin anexos de propuestas.
5. Definir límites de tamaño y versiones objetivo de Mermaid/draw.io antes de sus etapas.

No hay estimaciones de tiempo ni motores/ORM comprometidos. La generación de SQL, NoSQL y modelos ORM queda fuera de esta implementación y se planificará como consumidor del contrato de exportación.
