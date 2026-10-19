# Exportación de diseños

Actualizado el 19 de octubre de 2026. La regresión cubre guardado/exportación por IPC, comparación sin aplicar y modelos grandes; la comprobación con herramientas externas y macOS/Linux permanece pospuesta. Consulta los [pendientes](pendientes.md) y el [informe de pruebas](pruebas/2026-10-19/informe.md#correcciones).

## Uso

1. Abre **Archivo → Exportar…** en la cabecera o el menú nativo.
2. El diálogo captura el **diseño actual completo**, con sus cambios sin guardar, como opción predeterminada.
3. Elige **Markdown**, **JSON**, **Markdown + JSON**, **SVG**, **PNG**, **Mermaid** o **draw.io**.
4. Incluye o excluye notas; añade opcionalmente revisión local de estructura y normalización. No se llama a IA.
5. Pulsa **Exportar…** y selecciona destino mediante el diálogo nativo.

La opción conjunta crea una subcarpeta nueva con sufijo único, por ejemplo `Ventas-export-xxxxxxxx`, y dos archivos: `Ventas-reporte.md` y `Ventas-modelo.json`. No sobrescribe paquetes anteriores. Para un archivo individual se solicita confirmación de sobrescritura en el diálogo nativo. El nombre debe conservar la extensión del formato seleccionado.

Puedes abrir la carpeta desde el resultado. Si cancelas el diálogo de destino no se escriben archivos. Si falla una parte del paquete, se muestran las rutas ya escritas y un mensaje de resultado parcial; no se informa éxito completo. Cada archivo se escribe mediante temporal y renombrado. El límite total es 20 MB.

La instantánea permanece fija mientras el diálogo está abierto. Para exportar modificaciones posteriores, ciérralo y vuelve a abrirlo. Exportar no guarda ni modifica el proyecto y no borra su indicador de cambios pendientes.

## Contenido

El Markdown contiene identificación, diccionario de entidades y atributos, claves, relaciones, reglas/dependencias, notas opcionales, desconocidos, ambigüedades pendientes, figuras sin clasificar, advertencias y guía para un generador SQL/NoSQL/ORM.

El modelo es relacional lógico. La guía pide motor, versión, lenguaje, ORM y convenciones; para NoSQL requiere patrones de acceso y decisiones de incrustación/referencia. No genera código ni inventa decisiones desconocidas.

## Formatos gráficos y editables

La copia gráfica separa tablas cuyas etiquetas se ensanchan al incluir tipos y claves. Los conectores horizontales que atraviesan otra tabla se desvían por arriba. Esta adaptación de legibilidad no modifica las posiciones guardadas en el proyecto; la geometría del archivo gráfico puede diferir del lienzo.

| Formato | Opciones y comportamiento |
|---|---|
| SVG | Diagrama vectorial autónomo, encuadre completo, fondo claro/oscuro/transparente, sin controles del editor |
| PNG | Rasterización local del mismo SVG, escala 1×/2×, máximo 16 384 px por lado y 32 megapíxeles |
| Mermaid `.mmd` | ER con IDs seguros y alias de entidad; tipos/nombres no representables se conservan en comentarios de atributo |
| draw.io `.drawio` | XML sin comprimir, tablas y conectores editables, notas y posiciones; no es una imagen incrustada |

Los gráficos vacíos o con extremos de relación inexistentes se bloquean antes de pedir destino. SVG/PNG incluyen atributos de entidades, marcas PK/FK/UK y cardinalidades; no representan todas las reglas ni atributos propios de las relaciones. La transparencia utiliza texto oscuro, pensada para un soporte claro.

Mermaid omite relaciones con cardinalidad desconocida o extremos inexistentes y lo avisa en el diálogo y en comentarios. Mermaid ER exige identificación de relaciones; la línea punteada se usa como convención, porque el dominio actual no declara esa propiedad. No interpretes esa convención como una decisión de negocio. Las notas y reglas completas deben acompañarse con el reporte/JSON. El generador se comprobó con el parser de Mermaid 11.4.1.

draw.io se comprobó mediante validación XML y reimportación con el importador existente: entidades vacías, coordenadas negativas, caracteres especiales, marcas de clave y conexiones. La ida y vuelta no es sin pérdidas: el importador no recupera toda la semántica de tipos, claves compuestas, reglas, notas ni participación. Revisa su diálogo de interpretación. El importador ahora distingue el XML sin comprimir de XML escapado y conserva los saltos de línea codificados, sin desescapar prematuramente los atributos.

Fuentes de formato: [Mermaid ER](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) y [XML draw.io](https://www.drawio.com/docs/reference/diagram-generation/).

## Selección, comparación y anexos

- **Selección del lienzo:** una entidad sola, una nota o una relación con sus dos entidades. No se incluyen todas las relaciones externas. Las claves foráneas conservan IDs externos y pueden generar advertencias; las reglas y pendientes se presentan como contexto global.
- **Propuesta en comparación:** disponible cuando existe una propuesta seleccionada. Se verifica su aplicabilidad y se calculan sus operaciones sobre una copia. La exportación no acepta ni aplica la propuesta, ni aumenta la versión del proyecto. Los archivos indican que es una propuesta no aplicada e incluyen su identificación/versiones en los metadatos documentales.
- **Anexar propuestas pendientes:** opción exclusiva de Markdown/JSON. Incluye descripción, preguntas y supuestos como anexo separado; no los convierte en reglas confirmadas ni exporta operaciones para ejecutarlas.
- Una propuesta rechazada, aplicada o desactualizada no puede exportarse como comparación. Si la selección no existe en la vista propuesta, se muestra un error.

Las advertencias estructurales se conservan sin corregir el diseño. Los tipos, nulabilidad, unicidad, participación y cardinalidades mantienen el valor explícito `desconocido` cuando corresponde.

No se exportan conversación, historial de edición, configuración de proveedores, credenciales, consumo ni metadatos de procedencia con rutas de importación. Las propuestas no aplicadas solo se incluyen mediante las opciones explícitas de comparación o anexo. Los textos del modelo pueden contener información sensible que el propio usuario escribió; revisa el contenido antes de compartirlo.

## Contrato JSON v1

Identificador: `formato: "visual-bd-export"`, `versionFormato: 1`.

| Campo | Significado |
|---|---|
| `exportacion` | Fecha ISO, versión de aplicación, `origen: actual/propuesto`, `alcance: completo/seleccion`, propuesta de referencia y opciones |
| `proyecto` | ID, nombre, versión del diseño, actualización y estado de interpretación |
| `modelo.entidades` | IDs, nombres, descripciones, atributos y claves; sin geometría |
| `modelo.relaciones` | Extremos, cardinalidades, participación y atributos propios |
| `modelo.reglas` | ID, tipo, texto y dependencia funcional cuando exista |
| `notas` | ID y texto; arreglo vacío si se excluyen |
| `presentacion` | Geometría de entidades y notas cuando se solicita para formatos gráficos; `null` en exportaciones documentales |
| `anexoPropuestas` | Metadatos descriptivos de propuestas pendientes si se solicita; arreglo vacío por defecto |
| `pendientes` | Desconocidos, ambigüedades pendientes y figuras sin clasificar |
| `revisionLocal` | Estructura y normalización sobre la instantánea; `null` si no se solicita |
| `advertencias` | Errores estructurales/referenciales conocidos, sin correcciones automáticas |

Se mantienen los IDs y el orden de las claves compuestas. En claves foráneas, `claveDestinoIds` referencia claves de la entidad destino, no directamente sus atributos. No convertir `desconocido` a `false` ni a `null` al consumir el contrato.

El tipo de la instantánea se define en `src/renderer/src/exportadores/instantanea.ts`; los contratos de guardado IPC están en `src/shared/exportacion.ts`. El contrato JSON de intercambio no es un `.vbdproj` y no tiene importación de retorno implementada.

## Arquitectura y comprobaciones

- Proyección explícita del modelo y copia independiente en renderer.
- Markdown y JSON se generan desde la misma instantánea.
- Validación de tipos de archivo, duplicados, tamaño y nombre en main; rutas elegidas mediante diálogos nativos.
- Abrir carpeta solo permite la última carpeta exportada registrada en main; el renderer no envía una ruta arbitraria para abrirla.
- Sin librerías nuevas ni cambios en las conexiones o persistencia del proyecto.

Verificación automatizada de esta etapa: 83 pruebas en 18 archivos, comprobación de tipos y build. Las pruebas nuevas cubren proyección, privacidad de campos, claves compuestas, referencias rotas, caracteres especiales, estabilidad, cancelación, escritura UTF-8, reemplazo, paquetes independientes y resultados parciales.

Revisión manual pendiente: flujo de diálogos nativos en Electron, foco/teclado y lectura de archivos resultantes en aplicaciones externas, especialmente en macOS y Linux.

## Comprobaciones adicionales y límites

Las pruebas de diagramas cubren encuadre con coordenadas negativas, autorrelaciones, texto XML escapado, notas extensas, límites de PNG, cardinalidades Mermaid, reimportación draw.io, selección y propuesta sin mutación. La escritura PNG se verifica como binario y se rechazan cabeceras y dimensiones inválidas.

Se ejecutó una instancia oculta y aislada de Electron con datos sintéticos: PNG a escala 2×, transparencia y píxeles visibles correctos; Mermaid validado con su parser oficial cargado solo para esa prueba. No se incorporó esa librería al proyecto ni se enviaron modelos reales.

Pendiente de revisión manual: diálogo completo con teclado/foco, apertura/edición de draw.io en su aplicación y revisión nativa en macOS/Linux. El generador Mermaid y el XML no sustituyen el contrato semántico JSON.

Consulta [el plan completo](plans/2026-10-18/plan-exportacion.md).
