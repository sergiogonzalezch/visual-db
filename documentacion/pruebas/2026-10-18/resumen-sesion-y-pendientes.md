# Resumen de la sesión y pendientes detallados

Fecha de corte: 18 de octubre de 2026. Este documento distingue correcciones implementadas, pruebas realizadas y verificaciones pendientes. Un pendiente de verificación no equivale a un fallo confirmado.

## Tabla de resultados de la sesión

| Área | Problema | Cómo se resolvió | Estado / pendiente |
| --- | --- | --- | --- |
| Aprobación de propuestas | Se informaban ocho atributos inexistentes que sí estaban presentes. | Se conservó la entidad propietaria en los identificadores y se recupera desde las operaciones en archivos anteriores cuando es inequívoca. | Corregido y comprobado: propuesta aplicada, guardada y recuperada al reiniciar. |
| Actual / Propuesto | Lienzo e inspector mostraban versiones distintas y se podía editar durante la comparación. | Proyección compartida e inspector propuesto de solo lectura; protección de edición, creación e historial. | Implementado; valores y ausencia de edición comprobados en Electron. |
| Comparación | No se entendían los cambios de reglas y restricciones. | Desglose Actual → Propuesto por campo, complementario al diagrama. | Implementado; pendiente ampliar la cobertura de operaciones y escenarios combinados. |
| Estado posterior a aprobar | Permanecía un borrador después de aplicar. | Vuelta a Actual; aceptación y previsualización de la propuesta aplicada deshabilitadas. | Comprobado. No se implementó una comparación histórica de propuestas aplicadas. |
| Conflictos reales | Una propuesta podía quedar incompatible tras editar el diseño. | Recalcular estados, bloquear aceptación y mostrar motivos; conservar las huellas y aplicación atómica. | Regresiones de dominio aprobadas; falta completar los conflictos a través de IPC/UI. |
| Aclaraciones | Una propuesta sin operaciones parecía un cambio aplicable. | Acción Marcar como revisada, sin modificar diseño, versión ni historial. | Comprobado en Electron. Marcar revisada no significa contestar o confirmar su supuesto de negocio. |
| Alertas | Los mensajes comprimían el botón Cerrar. | Espacio reservado al botón, detalles desplegables y altura limitada; roles de estado/error. | Éxito y timeout comprobados; falta la matriz completa de errores y accesibilidad. |
| Navegación | Se perdía la propuesta abierta y su posición al cambiar de pestaña. | Conservar paneles en el mismo proyecto y reiniciarlos al cambiar de proyecto. | Conservación de contexto comprobada; falta automatizar todos los cambios de proyecto y solicitudes en curso. |
| Guardar como | Ctrl+Shift+S guardaba directamente. | Diferenciarlo de Ctrl+S. | Diálogo nativo y copia de prueba comprobados en Windows. |
| Respuestas tardías | Una revisión podía terminar sobre una versión o proyecto diferente. | Conservar la instantánea enviada, impedir solicitudes duplicadas y descartar incorporaciones de otra sesión o turno. | Implementado; pendiente ensayo determinista de concurrencia por IPC/UI. |
| Calidad de IA | Podía imponer restricciones o afirmar normalización sin evidencia. | Instrucciones reforzadas y distinción entre evidencia, supuestos y preguntas. | Mejorado; requiere evaluación semántica continuada, no solo JSON válido. |
| Gemini | La nueva revisión del caso completo agotó el tiempo. | Se verificó el timeout recuperable y la conservación del diseño. | Falta repetir con éxito el recorrido completo después de las correcciones. La generación exitosa anterior no sustituye esta prueba. |
| Ollama | Faltaba revisión estructurada local exitosa. | Adaptador real con Mistral y caso reducido: respuesta en unos 85 segundos, preguntas y operaciones vacías. | Caso reducido aprobado; falta conexión y revisión completas desde UI y caso grande. |
| Exportación y persistencia | Faltaba una regresión integrada. | Importar → guardar → reabrir → comparar → aprobar → exportar y reimportar draw.io. | Integración aprobada; faltan aplicaciones externas y validación visual de Mermaid. |
| Ajustar al contenido | Su ubicación estaba en la cápsula de vistas. | Traslado a la barra arrastrable, con icono de encuadre y el mismo evento. | Tipado y compilación aprobados; falta comprobar visualmente esta última reubicación y el encuadre desde su nueva posición. |
| Cobertura general | La evidencia no cubría todos los entornos ni estados. | 99 pruebas automáticas aprobadas; ensayo real de Ollama aprobado por separado; tipado y compilación correctos. | No certifica todos los proveedores, modos, plataformas ni tamaños de proyecto. |

## Pendientes priorizados

P1: integridad y continuidad del trabajo. P2: completar los recorridos principales y accesibilidad. P3: ampliación de cobertura y compatibilidad. Son prioridades propuestas para el siguiente ciclo, no nuevos defectos demostrados.

| ID | Prioridad | Pendiente | Impacto si no se verifica | Criterio de cierre |
| --- | --- | --- | --- | --- |
| PEND-01 | P1 | Concurrencia y respuestas tardías por IPC/UI | Incorporar resultados en un contexto distinto o mostrar estados de carga erróneos. | Todos los escenarios del apartado 1 pasan con respuestas controladas y sin cambios cruzados. |
| PEND-02 | P2 | Gemini: recorrido completo posterior a las correcciones | Falta evidencia reciente del flujo generativo remoto de principio a fin. | Revisión nueva, comparación, aprobación, guardado y reapertura exitosos. |
| PEND-03 | P2 | Ollama: recorrido UI y caso grande | El éxito de una entidad no demuestra viabilidad con un proyecto completo. | Caso reducido desde UI y caso de tienda con métricas y evaluación semántica. |
| PEND-04 | P1 | Operaciones combinadas, integridad y previsualización | Un tipo de operación no cubierto podría producir referencias inválidas o una comparación engañosa. | Matriz de operaciones e invariantes aprobada, con fallos atómicos. |
| PEND-05 | P2 | Errores, recuperación y reintentos completos | El usuario podría no saber si debe reintentar, corregir credenciales o cambiar de modelo. | Fallos controlados muestran acciones adecuadas, sin secretos ni duplicados. |
| PEND-06 | P2 | E2E automatizado de Electron | La integración de dominio y disco no detecta todos los fallos de foco, botones, menús o IPC. | Recorrido principal automatizado por interfaz con resultados deterministas. |
| PEND-07 | P2 | Accesibilidad, tema claro y ventana pequeña | Controles inaccesibles, bajo contraste o desbordes fuera del entorno probado. | Matriz de teclado, foco, anuncios, temas y tamaños completada. |
| PEND-08 | P2 | Intercambio externo draw.io y Mermaid | Un archivo válido internamente podría no representar bien el modelo en otra herramienta. | Abrir, editar y volver a importar en herramienta externa; Mermaid renderizado sin errores. |
| PEND-09 | P2 | Calidad semántica y trazabilidad de nuevas revisiones | Recomendaciones plausibles pero incorrectas podrían confundirse con hechos verificados. | Casos conocidos evaluados por reglas explícitas, con origen y límites visibles. |
| PEND-10 | P3 | Diagramas grandes y rendimiento | Lentitud o encuadre ilegible al aumentar el tamaño. | Mediciones repetibles y ausencia de pérdida de datos, bloqueos o elementos inaccesibles. |
| PEND-11 | P3 | macOS y Linux | Diferencias de atajos, diálogos, rutas, fuentes y escalado. | Recorrido principal comprobado en cada plataforma disponible. |
| PEND-12 | P2 | Barra arrastrable y preferencias tras reiniciar | El nuevo botón podría desbordar la barra o la posición guardada quedar fuera de pantalla. | Encuadre correcto desde la barra y posición recuperada dentro del área visible. |
| PEND-13 | P3 | Entrega de cambios en Git | Las correcciones siguen sin una entrega versionada de este ciclo. | Revisar el diff acumulado y, cuando se solicite, realizar commit y push del alcance acordado. |

## 1. Concurrencia y cambio de proyecto — PEND-01

La protección ya está implementada, pero la sesión no ejecutó todas las combinaciones de respuesta tardía. Se necesitan respuestas controladas para repetir el mismo orden de eventos sin depender de la latencia de un proveedor.

Probar:

1. Iniciar revisión en proyecto A, abrir B y recibir después la respuesta de A. B no recibe propuestas, mensajes ni estados de carga de A.
2. Revisar la versión N, editar un atributo y recibir el resultado. La propuesta conserva N como origen; detecta el conflicto real antes de aplicar, sin recalcular sus huellas como si hubiera revisado la nueva versión.
3. Descartar la respuesta y recibirla después. No se incorpora ni se marca el proyecto como modificado por esa respuesta.
4. Descartar, iniciar otro intento y recibir las respuestas en orden inverso. El intento anterior no termina ni sobrescribe el estado del nuevo.
5. Pulsar varias veces Revisar o usar menú y atajo casi simultáneamente. Se envía una sola solicitud activa para el mismo turno.
6. Cambiar de pestaña durante la espera. La terminación anuncia el resultado sin quitar el foco.

**Límite actual:** descartar invalida la incorporación local, pero no garantiza detener el procesamiento ni los cargos del proveedor. No se presenta como cancelación de red efectiva. Implementar esa cancelación, si se desea, sería una mejora adicional del contrato IPC y del control de solicitudes.

## 2. Gemini: nueva revisión completa — PEND-02

La generación anterior fue exitosa y su propuesta permitió demostrar que el bloqueo de atributos quedó corregido. La solicitud nueva del ciclo de corrección terminó en timeout; por eso falta una prueba remota completa reciente.

Usar el modelo y cuenta configurados, sin cambiar claves innecesariamente. Registrar fecha, modelo, duración y resultado. Primero probar un caso pequeño y luego la tienda completa. El recorrido debe incluir una propuesta nueva ejecutable, diferencias legibles, aceptación humana, persistencia y reapertura.

Separar disponibilidad del servicio, acceso al modelo, forma de la respuesta y calidad conceptual. Un timeout no demuestra por sí solo una URL incorrecta ni una clave inválida. Evitar reintentos automáticos ilimitados o generaciones duplicadas.

## 3. Ollama desde la aplicación y con mayor contexto — PEND-03

El ensayo aprobado llamó por HTTP real al adaptador de producción con `mistral:latest`, una entidad y datos sintéticos. El registro de consumo personal se sustituyó en el ensayo. No recorrió selección de proveedor, IPC, presentación y aprobación desde la UI.

Falta comprobar desde Electron: Conectar → seleccionar modelo instalado → revisar → mostrar resultado → discutir una aclaración o comparar una propuesta ejecutable → aprobar → guardar → reabrir. Después repetir con Cliente, Pedido, Producto y LineaPedido.

Medir por separado conexión, carga inicial del modelo, generación, longitud de contexto y validez del resultado. No extrapolar los 85 segundos del caso reducido al grande. Si el modelo no produce operaciones válidas, registrar ese límite sin aplicar correcciones inventadas ni descargar otro modelo sin acordarlo.

## 4. Operaciones, conflictos y atomicidad — PEND-04

Ya hay pruebas de identidad nueva/heredada, colisiones de ID entre entidades, conflictos, previsualización sin mutación y fallo atómico. Falta cubrir el catálogo completo y sus interacciones.

| Grupo | Casos a completar |
| --- | --- |
| Entidades y atributos | Añadir, modificar, eliminar; atributo usado en PK/FK o dependencia; entidad eliminada con referencias. |
| Claves | PK compuesta, candidata y FK; cambios de orden y mapeo; destino ausente; duplicados. |
| Relaciones | Altas, bajas, nombres, cardinalidades, autorrelaciones y extremos inválidos. |
| Reglas y notas | Cambios no gráficos, dependencias funcionales con referencias válidas, altas/bajas y geometría de notas. |
| Propuestas | Dependencias entre propuestas, aplicada/rechazada/desactualizada, archivo heredado ambiguo y operaciones incompatibles. |
| Historial | Aplicar → deshacer → rehacer → guardar → reabrir; verificar coherencia de diseño y estados de propuesta. |

Comprobar que el borrador anticipa lo que realmente se aplicará y que un error no deja una parte del grupo aplicada. Nunca aceptar una propuesta forzando la omisión de huellas. La comparación histórica de una propuesta aplicada no existe actualmente: está deshabilitada; añadirla requeriría definir instantáneas históricas y su persistencia.

## 5. Errores y recuperación — PEND-05

Existen pruebas de transporte para autenticación, límites, servicio no disponible y timeout; falta verificar su recorrido completo por la interfaz con respuestas simuladas de forma controlada.

| Fallo | Comportamiento esperado |
| --- | --- |
| 401 / 403 | Explicar el rechazo y orientar a revisar acceso; no repetir indefinidamente. |
| 404 de ruta o modelo | Distinguir lo que pueda saberse de la respuesta y ofrecer revisar proveedor/modelo. |
| 429 | Mostrar el límite y la posibilidad de esperar; respetar el mecanismo de espera si está disponible. |
| 503 / desconexión | Mantener el proyecto editable y ofrecer recuperación sin duplicar generaciones. |
| Timeout | Finalizar el estado de carga y conservar el diseño; una respuesta posterior no debe incorporarse indebidamente. |
| JSON mal formado u operaciones inválidas | No aplicar nada; explicar el problema de formato y conservar un diagnóstico seguro. |
| Error largo | Resumen legible, detalles accesibles, cierre estable, sin ocultar controles esenciales. |

Verificar que nuevos intentos no mezclan avisos antiguos con el resultado actual y que ningún cuerpo de error expone claves o información interna innecesaria.

## 6. E2E de la interfaz — PEND-06

La prueba integrada existente verifica dominio, guardado e intercambio de datos. Falta una prueba que active controles reales de Electron y atraviese el puente IPC.

Recorrido objetivo: nombrar proyecto → importar caso → revisar reglas → solicitar revisión controlada → ver carga → abrir propuesta → comparar → inspeccionar → aceptar → guardar → cerrar/reabrir → verificar valores → exportar. Añadir variantes de error, conflicto y aclaración sin operaciones.

Debe poder ejecutarse sin gastar cuota ni depender de una cuenta externa. Las comprobaciones reales de Gemini y Ollama se mantienen separadas. Si se propone una nueva herramienta de automatización, revisar antes la dependencia y el alcance; todavía no se añadió una biblioteca para este E2E.

## 7. Accesibilidad, temas y adaptación — PEND-07

La evidencia visual principal corresponde a Windows, tema oscuro y una ventana de aproximadamente 1426 × 893. No certifica el tema claro ni todos los controles por teclado.

Completar Tab/Shift+Tab, Enter/Espacio, flechas en pestañas y asa arrastrable, Escape y retorno de foco desde diálogos. Comprobar foco visible, etiquetas accesibles, estados disabled/loading, anuncios de éxito/error y controles ocultos fuera de la navegación.

Probar modo claro y oscuro, texto ampliado, escala de pantalla y ventanas más estrechas dentro de los tamaños admitidos por la aplicación. Revisar alertas largas, campos de comparación, nombres extensos, listas vacías y panel superpuesto. Medir contraste de texto y foco; verificar que color, símbolos y texto se complementen.

## 8. Exportaciones externas — PEND-08

La integración interna recuperó entidades y una relación desde el draw.io exportado. Eso no demuestra una recuperación sin pérdidas de todo el modelo.

Abrir draw.io en diagrams.net, revisar tablas, conectores, cardinalidades y caracteres especiales, editar y volver a importar. Comparar el resultado con el modelo original y documentar pérdidas previstas: reglas, tipos, nulabilidad, composición de claves y notas según las limitaciones actuales del formato/importador.

Renderizar Mermaid en una herramienta compatible y comprobar sintaxis, nombres escapados, cardinalidades y legibilidad. Abrir también PNG/SVG y verificar recortes y geometría. No subir proyectos privados a servicios externos sin autorización específica; para estas pruebas usar el caso sintético de QA.

## 9. Calidad semántica y trazabilidad — PEND-09

Una respuesta JSON válida no demuestra que la recomendación sea correcta. Evaluar casos con resultado conocido: tipos o nulabilidad desconocidos, claves candidatas y compuestas, precio histórico, repetición de un producto en líneas distintas, dependencias funcionales insuficientes y contradicciones entre reglas.

Criterios: preguntar cuando falta evidencia, no convertir email único en email obligatorio por inferencia, no certificar 3FN/BCNF sin fundamento, no duplicar reglas y usar referencias existentes. Verificar que el razonamiento y las contrapartidas corresponden a las operaciones que propone.

Comprobar en una revisión nueva los metadatos opcionales de proveedor/modelo, fecha y versión de origen, incluidos guardado y reapertura. Las propuestas antiguas deben seguir mostrando origen no registrado; nunca se inventa su proveedor histórico.

## 10. Rendimiento y diagramas grandes — PEND-10

Preparar casos sintéticos con decenas y cientos de entidades, atributos extensos y numerosas relaciones. Son tamaños de ensayo propuestos, no capacidad certificada del programa.

Medir apertura, guardado, paneo, zoom, encuadre, selección, expansión de propuesta, cálculo de diferencias y exportación. Comprobar uso de memoria y respuesta de la interfaz. Separar el tiempo de UI del tiempo de IA. Establecer umbrales aceptables con mediciones reales antes de prometer un máximo de entidades o tiempo de respuesta.

## 11. Plataformas — PEND-11

En macOS y Linux comprobar arranque, rutas de archivos, permisos de guardado, fuentes, escalado, menús y atajos equivalentes. Repetir una importación, guardado/reapertura, comparación y exportación.

La compatibilidad de la stack con varias plataformas no sustituye estas pruebas. Empaquetadores, instaladores o un nuevo ejecutador siguen fuera de estas correcciones; se habían pospuesto en la conversación.

## 12. Barra arrastrable y preferencias — PEND-12

La última reubicación de Ajustar al contenido pasó tipado y compilación, pero no se volvió a probar visualmente desde su nueva posición.

Pulsar el botón con un lienzo desplazado y comprobar que encuadra entidades y notas sin editar el modelo. Repetir en Actual y en una propuesta válida. Verificar que no se duplica en la cápsula y que el icono no comprime el texto.

Mover la barra mediante ratón y teclado, guardar su posición, reiniciar y comprobarla. Reducir después la ventana para verificar que la barra permanece accesible. Comprobar Restablecer posición y distinguirlo de Ajustar al contenido: uno mueve las herramientas y el otro encuadra el diagrama.

## 13. Entrega en Git — PEND-13

No se hizo commit ni push en este ciclo. El árbol de trabajo también contiene cambios anteriores de exportación y otras correcciones.

Antes de entregar, revisar el diff acumulado, excluir datos temporales o secretos y acordar qué archivos de evidencia se versionan. Cuando se solicite commit/push, ejecutar las comprobaciones necesarias sobre ese conjunto y registrar los cambios sin atribuir todos los archivos pendientes a una sola corrección.

## Orden recomendado para continuar

1. Comprobar rápidamente la nueva ubicación de Ajustar al contenido.
2. Cerrar concurrencia, cambios de proyecto y operaciones combinadas, porque afectan integridad.
3. Completar el recorrido real de Gemini y el de Ollama desde UI, manteniendo separada la evaluación semántica.
4. Automatizar el recorrido principal por interfaz y los errores recuperables.
5. Cerrar accesibilidad, temas, exportaciones externas, rendimiento y plataformas disponibles.

## Evidencia y referencias

- [Informe de correcciones y nueva prueba](./informe-correcciones-revision.md).
- [Auditoría de revisión IA y UX](./informe-revision-ia-ux.md).
- [Informe de regresión anterior](./informe-regresion.md).
- [Plan original de mejoras](./plan-mejoras-revision-ia-ux.md), cuya matriz describe el punto de partida; este resumen y el informe posterior contienen los resultados actualizados.
- `Respuesta real de Ollama` (evidencia local no versionada).

Este documento se elaboró con la evidencia de la sesión; no representa una nueva ejecución de pruebas.
