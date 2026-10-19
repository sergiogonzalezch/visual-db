# Informe consolidado — 2026-10-18

Fecha de los trabajos: **2026-10-18**. Consolidación editorial realizada el **19 de octubre de 2026**, sin ejecutar pruebas nuevas ni cambiar sus resultados. Sustituye los informes sueltos de esta fecha.

Los resultados se distinguen por etapa: un fallo inicial y una corrección posterior no son contradictorios. Las cifras corresponden a cada ejecución, no a un único ensayo. Los pendientes operativos vigentes se mantienen exclusivamente en [pendientes](../../pendientes.md); las tablas históricas conservan el corte de su fecha.

## Contenido

- [Balance y pendientes al cierre del día](#resumen)
- [Persistencia, proveedores y evolución de Foco](#proveedores)
- [Implementación inicial de la interfaz Foco](#foco)
- [Auditoría funcional inicial y experiencia de uso](#auditoria)
- [Correcciones de importación, proyecto y exportaciones](#regresion)
- [Diagnóstico de revisión IA y Actual/Propuesto](#revision-ia)
- [Correcciones de aprobación y segunda comprobación](#correcciones)

**Corte histórico:** las pruebas y pendientes siguientes son del 18 de octubre. Para las correcciones posteriores, consulta el [informe del 19](../2026-10-19/informe.md). El [plan de mejoras IA/UX](../../plans/2026-10-18/plan-mejoras-revision-ia-ux.md) conserva su fecha original.

<a id="resumen"></a>

## Balance y pendientes al cierre del día

### Tabla de resultados de la sesión

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

### Pendientes priorizados

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

### 1. Concurrencia y cambio de proyecto — PEND-01

La protección ya está implementada, pero la sesión no ejecutó todas las combinaciones de respuesta tardía. Se necesitan respuestas controladas para repetir el mismo orden de eventos sin depender de la latencia de un proveedor.

Probar:

1. Iniciar revisión en proyecto A, abrir B y recibir después la respuesta de A. B no recibe propuestas, mensajes ni estados de carga de A.
2. Revisar la versión N, editar un atributo y recibir el resultado. La propuesta conserva N como origen; detecta el conflicto real antes de aplicar, sin recalcular sus huellas como si hubiera revisado la nueva versión.
3. Descartar la respuesta y recibirla después. No se incorpora ni se marca el proyecto como modificado por esa respuesta.
4. Descartar, iniciar otro intento y recibir las respuestas en orden inverso. El intento anterior no termina ni sobrescribe el estado del nuevo.
5. Pulsar varias veces Revisar o usar menú y atajo casi simultáneamente. Se envía una sola solicitud activa para el mismo turno.
6. Cambiar de pestaña durante la espera. La terminación anuncia el resultado sin quitar el foco.

**Límite actual:** descartar invalida la incorporación local, pero no garantiza detener el procesamiento ni los cargos del proveedor. No se presenta como cancelación de red efectiva. Implementar esa cancelación, si se desea, sería una mejora adicional del contrato IPC y del control de solicitudes.

### 2. Gemini: nueva revisión completa — PEND-02

La generación anterior fue exitosa y su propuesta permitió demostrar que el bloqueo de atributos quedó corregido. La solicitud nueva del ciclo de corrección terminó en timeout; por eso falta una prueba remota completa reciente.

Usar el modelo y cuenta configurados, sin cambiar claves innecesariamente. Registrar fecha, modelo, duración y resultado. Primero probar un caso pequeño y luego la tienda completa. El recorrido debe incluir una propuesta nueva ejecutable, diferencias legibles, aceptación humana, persistencia y reapertura.

Separar disponibilidad del servicio, acceso al modelo, forma de la respuesta y calidad conceptual. Un timeout no demuestra por sí solo una URL incorrecta ni una clave inválida. Evitar reintentos automáticos ilimitados o generaciones duplicadas.

### 3. Ollama desde la aplicación y con mayor contexto — PEND-03

El ensayo aprobado llamó por HTTP real al adaptador de producción con `mistral:latest`, una entidad y datos sintéticos. El registro de consumo personal se sustituyó en el ensayo. No recorrió selección de proveedor, IPC, presentación y aprobación desde la UI.

Falta comprobar desde Electron: Conectar → seleccionar modelo instalado → revisar → mostrar resultado → discutir una aclaración o comparar una propuesta ejecutable → aprobar → guardar → reabrir. Después repetir con Cliente, Pedido, Producto y LineaPedido.

Medir por separado conexión, carga inicial del modelo, generación, longitud de contexto y validez del resultado. No extrapolar los 85 segundos del caso reducido al grande. Si el modelo no produce operaciones válidas, registrar ese límite sin aplicar correcciones inventadas ni descargar otro modelo sin acordarlo.

### 4. Operaciones, conflictos y atomicidad — PEND-04

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

### 5. Errores y recuperación — PEND-05

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

### 6. E2E de la interfaz — PEND-06

La prueba integrada existente verifica dominio, guardado e intercambio de datos. Falta una prueba que active controles reales de Electron y atraviese el puente IPC.

Recorrido objetivo: nombrar proyecto → importar caso → revisar reglas → solicitar revisión controlada → ver carga → abrir propuesta → comparar → inspeccionar → aceptar → guardar → cerrar/reabrir → verificar valores → exportar. Añadir variantes de error, conflicto y aclaración sin operaciones.

Debe poder ejecutarse sin gastar cuota ni depender de una cuenta externa. Las comprobaciones reales de Gemini y Ollama se mantienen separadas. Si se propone una nueva herramienta de automatización, revisar antes la dependencia y el alcance; todavía no se añadió una biblioteca para este E2E.

### 7. Accesibilidad, temas y adaptación — PEND-07

La evidencia visual principal corresponde a Windows, tema oscuro y una ventana de aproximadamente 1426 × 893. No certifica el tema claro ni todos los controles por teclado.

Completar Tab/Shift+Tab, Enter/Espacio, flechas en pestañas y asa arrastrable, Escape y retorno de foco desde diálogos. Comprobar foco visible, etiquetas accesibles, estados disabled/loading, anuncios de éxito/error y controles ocultos fuera de la navegación.

Probar modo claro y oscuro, texto ampliado, escala de pantalla y ventanas más estrechas dentro de los tamaños admitidos por la aplicación. Revisar alertas largas, campos de comparación, nombres extensos, listas vacías y panel superpuesto. Medir contraste de texto y foco; verificar que color, símbolos y texto se complementen.

### 8. Exportaciones externas — PEND-08

La integración interna recuperó entidades y una relación desde el draw.io exportado. Eso no demuestra una recuperación sin pérdidas de todo el modelo.

Abrir draw.io en diagrams.net, revisar tablas, conectores, cardinalidades y caracteres especiales, editar y volver a importar. Comparar el resultado con el modelo original y documentar pérdidas previstas: reglas, tipos, nulabilidad, composición de claves y notas según las limitaciones actuales del formato/importador.

Renderizar Mermaid en una herramienta compatible y comprobar sintaxis, nombres escapados, cardinalidades y legibilidad. Abrir también PNG/SVG y verificar recortes y geometría. No subir proyectos privados a servicios externos sin autorización específica; para estas pruebas usar el caso sintético de QA.

### 9. Calidad semántica y trazabilidad — PEND-09

Una respuesta JSON válida no demuestra que la recomendación sea correcta. Evaluar casos con resultado conocido: tipos o nulabilidad desconocidos, claves candidatas y compuestas, precio histórico, repetición de un producto en líneas distintas, dependencias funcionales insuficientes y contradicciones entre reglas.

Criterios: preguntar cuando falta evidencia, no convertir email único en email obligatorio por inferencia, no certificar 3FN/BCNF sin fundamento, no duplicar reglas y usar referencias existentes. Verificar que el razonamiento y las contrapartidas corresponden a las operaciones que propone.

Comprobar en una revisión nueva los metadatos opcionales de proveedor/modelo, fecha y versión de origen, incluidos guardado y reapertura. Las propuestas antiguas deben seguir mostrando origen no registrado; nunca se inventa su proveedor histórico.

### 10. Rendimiento y diagramas grandes — PEND-10

Preparar casos sintéticos con decenas y cientos de entidades, atributos extensos y numerosas relaciones. Son tamaños de ensayo propuestos, no capacidad certificada del programa.

Medir apertura, guardado, paneo, zoom, encuadre, selección, expansión de propuesta, cálculo de diferencias y exportación. Comprobar uso de memoria y respuesta de la interfaz. Separar el tiempo de UI del tiempo de IA. Establecer umbrales aceptables con mediciones reales antes de prometer un máximo de entidades o tiempo de respuesta.

### 11. Plataformas — PEND-11

En macOS y Linux comprobar arranque, rutas de archivos, permisos de guardado, fuentes, escalado, menús y atajos equivalentes. Repetir una importación, guardado/reapertura, comparación y exportación.

La compatibilidad de la stack con varias plataformas no sustituye estas pruebas. Empaquetadores, instaladores o un nuevo ejecutador siguen fuera de estas correcciones; se habían pospuesto en la conversación.

### 12. Barra arrastrable y preferencias — PEND-12

La última reubicación de Ajustar al contenido pasó tipado y compilación, pero no se volvió a probar visualmente desde su nueva posición.

Pulsar el botón con un lienzo desplazado y comprobar que encuadra entidades y notas sin editar el modelo. Repetir en Actual y en una propuesta válida. Verificar que no se duplica en la cápsula y que el icono no comprime el texto.

Mover la barra mediante ratón y teclado, guardar su posición, reiniciar y comprobarla. Reducir después la ventana para verificar que la barra permanece accesible. Comprobar Restablecer posición y distinguirlo de Ajustar al contenido: uno mueve las herramientas y el otro encuadra el diagrama.

### 13. Entrega en Git — PEND-13

No se hizo commit ni push en este ciclo. El árbol de trabajo también contiene cambios anteriores de exportación y otras correcciones.

Antes de entregar, revisar el diff acumulado, excluir datos temporales o secretos y acordar qué archivos de evidencia se versionan. Cuando se solicite commit/push, ejecutar las comprobaciones necesarias sobre ese conjunto y registrar los cambios sin atribuir todos los archivos pendientes a una sola corrección.

### Orden recomendado para continuar

1. Comprobar rápidamente la nueva ubicación de Ajustar al contenido.
2. Cerrar concurrencia, cambios de proyecto y operaciones combinadas, porque afectan integridad.
3. Completar el recorrido real de Gemini y el de Ollama desde UI, manteniendo separada la evaluación semántica.
4. Automatizar el recorrido principal por interfaz y los errores recuperables.
5. Cerrar accesibilidad, temas, exportaciones externas, rendimiento y plataformas disponibles.

### Evidencia y referencias

- [Informe de correcciones y nueva prueba](informe.md#correcciones).
- [Auditoría de revisión IA y UX](informe.md#revision-ia).
- [Informe de regresión anterior](informe.md#regresion).
- [Plan original de mejoras](../../plans/2026-10-18/plan-mejoras-revision-ia-ux.md), cuya matriz describe el punto de partida; este resumen y el informe posterior contienen los resultados actualizados.
- `Respuesta real de Ollama` (evidencia local no versionada).

Este documento se elaboró con la evidencia de la sesión; no representa una nueva ejecución de pruebas.

<a id="proveedores"></a>

## Persistencia, proveedores y evolución de Foco

### Actualización del 18 de octubre de 2026: interfaz Foco y chat por proyecto

- Herramientas verticales flotantes: asa de arrastre, movimiento con flechas y Shift, límites del lienzo y restablecimiento de posición.
- Inspector deslizable sobre el lienzo, con tirador en el borde derecho, cierre con Escape y retirada del foco cuando está oculto.
- Cápsula flotante centrada con Modelo lógico y Actual/Propuesto; conserva las condiciones de comparación y los avisos de creación de relaciones.
- Iconos SVG reutilizables para acciones de la interfaz, sin añadir librerías.
- La causa de la mezcla de chats era un estado de sesión global que Nuevo no limpiaba y Abrir conservaba. Ahora `mensajesChat` forma parte del `.vbdproj`, con bienvenida para archivos antiguos, recuperación automática y borrado del texto sin enviar al cambiar de sesión.
- Las respuestas pendientes de chat, discusión de propuestas y revisión IA se comprueban contra la sesión de origen antes de modificar el proyecto actual. Un guardado que coincide con mensajes nuevos no elimina su indicador de cambios pendientes.
- Identidad C aplicada a icono de Electron, Dock y favicon; PNG, ICO e ICNS en el repositorio. El ejecutador y los instaladores siguen pendientes.

Validación: 60 pruebas en 15 archivos, tipos y build correctos. Las comprobaciones automatizadas no sustituyen la revisión visual nativa de los iconos en Windows/macOS/Linux.

Comprobación manual recomendada:

1. Mover herramientas con ratón y teclado; redimensionar y restablecer.
2. Abrir/cerrar el inspector y comprobar foco, Escape y edición del lienzo.
3. Comparar una propuesta y volver a Actual; crear una relación y verificar el aviso.
4. Guardar chat en A, crear B, comprobar chat limpio y reabrir A.
5. Cambiar de proyecto mientras llega una respuesta IA; comprobar que no aparece en el nuevo.
6. Reabrir un archivo antiguo sin mensajes y restaurar una copia de recuperación con chat.
7. Reiniciar Electron y revisar el icono C y el favicon, incluidos tamaños pequeños.

Las secciones siguientes documentan las etapas anteriores y sus resultados históricos.

### Hallazgos y causa raíz

1. La credencial estaba cifrada por proveedor, pero el formulario marcaba la clave como ausente al cambiar de proveedor. URL y modelo solo existían para el proveedor activo. Conectar además borraba el modelo y vaciaba el campo de clave; faltaba distinguir campo vacío de clave guardada.
2. No había restauración y verificación automática de conexiones. Los errores HTTP podían confundirse con una pérdida de credencial.
3. El checkbox heredaba una altura mínima global de 32px. El diálogo anterior tenía reglas de scroll superpuestas, espaciados inconsistentes y texto con codificación dañada.
4. Las relaciones usaban coordenadas persistidas mientras las entidades usaban coordenadas temporales durante el arrastre.
5. Había normalización JSON duplicada y una advertencia CJS en Vitest.

### Cambios

- Configuración por proveedor: URL, último modelo y metadatos de credencial. Migración compatible del formato anterior; recupera metadatos de claves anteriores, sin inventar URLs personalizadas que nunca se guardaron.
- Credenciales cifradas mediante safeStorage, escritura temporal y reemplazo del archivo. Se conservan las demás claves al editar o borrar una. No se escriben nuevas claves en texto plano si falla el cifrado.
- Conectar guarda el perfil sin activar otro proveedor ni vaciar su modelo. Un fallo conserva credenciales/modelo; el formulario conserva el borrador si la conexión falla.
- Reconexión del proveedor activo al iniciar, sin generar contenido, respetando Solo local. El diálogo recibe cambios mediante eventos IPC.
- Selector de modelos habilitado tras conectar, con búsqueda, vacío y errores. La selección disponible se valida en main y se guarda automáticamente.
- OpenRouter valida la clave en /key antes de consultar su catálogo público, según https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key.
- Gemini normaliza el prefijo models/ al listar y enviar solicitudes; también soporta configuraciones ya guardadas.
- Panel con lista de proveedores, estados y activo; credencial enmascarada y acciones explícitas de revelar, editar, probar y borrar. Las claves no forman parte de obtenerAjustes; revelar es una operación IPC independiente bajo acción del usuario.
- Tokens de espaciado/superficies, paleta clara y oscura, foco visible, checkbox corregido y diálogo nativo con foco confinado y Escape. Scroll limitado al cuerpo del gestor.
- Ollama local puede usarse en Solo local. Se corrige el desfase de extremos de relaciones al arrastrar y se retiran any del renderizado del lienzo.
- Se comparte normalización JSON/transporte HTTP. Vitest usa configuración ESM (.mts), sin cambiar versiones ni dependencias.

### Archivos de esta etapa

- src/shared/ai.ts: tipos, perfiles y metadatos de validación.
- src/main/ia/configuracion.ts: lectura, migración y persistencia de perfiles.
- src/main/ia/proveedores.ts: conexiones, modelo activo y gestión de credenciales.
- src/main/almacen-credenciales.ts: cifrado, conservación y escritura temporal.
- src/main/ia/coordinador.ts y openai.ts: adaptación, permisos locales y validación.
- src/main/index.ts y src/preload/index.ts: IPC, eventos y reconexión.
- src/renderer/src/estado/useProveedores.ts y tienda.tsx: borradores y sincronización sin escrituras duplicadas.
- src/renderer/src/componentes/DialogoConfiguracion.tsx y estilos.css: gestor visual.
- src/renderer/src/componentes/Lienzo.tsx: coordenadas y tipos.
- src/renderer/src/importadores/borrador.ts: corrección de texto con codificación dañada.
- src/main/ia/*.test.ts: pruebas de perfiles, credenciales, transporte y proveedores.
- vitest.config.mts: configuración ESM.

### Verificación

Suite automatizada, comprobación de tipos y build de producción. Inspección real en Electron con directorio de datos aislado: diálogo oscuro completo, etiquetas accesibles, checkbox normal y reconexión automática a Ollama con cinco modelos. Instancia de prueba y datos temporales retirados.

No se revelaron claves reales ni se hicieron generaciones remotas durante esta etapa. La paleta clara y los tamaños pequeños se ajustaron en CSS, pero requieren revisión visual adicional. Las pruebas de autenticación de servicios remotos son simuladas.

### Diagnóstico confirmado del 404 de Gemini

La configuración usa gemini-2.5-flash y la URL compatible documentada. Consultas reales de metadatos devolvieron HTTP 200 tanto en el catálogo como al consultar el modelo (API nativa y compatible). Una generación mínima, sin datos del proyecto, devolvió HTTP 404 / NOT_FOUND: el modelo ya no está disponible para nuevos usuarios. El servicio recomendó gemini-3.8-flash.

Esto confirma que la credencial y el acceso al catálogo funcionan, pero no que la cuenta tenga permiso de generación para ese modelo. La normalización de models/ por sí sola no resolvía esta restricción. No se cambió el modelo del usuario automáticamente.

El transporte ahora clasifica esa restricción en errores estructurados de objeto o arreglo, sin mostrar cuerpos arbitrarios. El selector explica que el catálogo no garantiza permisos de generación. Se añadieron dos pruebas de regresión; 49 pruebas pasan, además de tipos y compilación.

<a id="foco"></a>

## Implementación inicial de la interfaz Foco

### Decisión aprobada

Dirección Foco y una única entrada «Revisar» que ofrece «Revisar reglas» y «Revisar con IA». La primera conserva el analizador determinista de estructura y normalización; la segunda conserva la llamada al proveedor y las propuestas con aprobación explícita.

### Cambios de presentación

- Tokens centralizados en `src/renderer/src/tokens.css`: colores claros/oscuros según el sistema, superficies, acción, texto, estados, espacios, radio, tipografía y controles.
- Cabecera compacta: Archivo conserva Nuevo, Abrir y Guardar como. Guardar visible. Importar agrupa draw.io, imagen y Markdown. Deshacer y Rehacer conservan atajos y nombres accesibles.
- Revisar abre un menú con descripción de cada opción. La revisión con IA deshabilita solo su opción mientras trabaja; Revisar reglas sigue disponible. El menú nativo usa los mismos nombres.
- Menú reutilizable con clic exterior, Escape, foco inicial, flechas, Inicio/Fin y retorno de foco; pestañas reutilizables con flechas y semántica accesible.
- Herramientas en la parte superior del lienzo; Actual/Propuesto conserva la comparación existente. Estado vacío con Crear entidad e Importar draw.io, sin ejecutar una acción de negocio nueva.
- Inspector más ancho, secciones Reglas y Propuestas. La acción ejecutada abre su sección correspondiente. Normalización en cuadrícula 2×2 con estados que se ajustan a su celda.
- Claves candidatas y foráneas plegables; nombres de campos asociados en componentes compartidos. Propuestas expandibles mediante botón accesible.
- Chat con contexto compacto, área de conversación desplazable y compositor estable. El feedback de revisión fallida aparece en Propuestas con acceso a la configuración; se retira solo el envoltorio técnico de IPC al mostrar errores.
- Consumo con nombres y cifras en líneas separadas; limpieza del registro dentro de una sección de gestión. Conserva las acciones y confirmación existentes.
- Base de diálogo nativo compartida para importación, historial y recuperación. Historial admite Escape; importación y recuperación requieren sus acciones explícitas para evitar descartar información al cerrar accidentalmente.
- Estilos duplicados de los componentes principales consolidados y antiguo fondo modal retirado.

### Verificación

- Comprobación de tipos y compilación de producción correctas.
- Suite existente: 49 pruebas aprobadas.
- Inspección real en Electron con datos aislados: tema oscuro a tamaño de escritorio y claro a 1040×800.
- Menú Revisar con las dos acciones; ejecución de Revisar reglas sin proveedor.
- Selección con flechas y Enter de Revisar con IA, con error local esperado al bloquear conexiones: feedback visible en Propuestas.
- Normalización 2×2 sin desborde horizontal.
- Historial nativo: estado vacío, cierre por Escape y vuelta al editor.
- Retirados el script y el directorio de datos usados para la prueba.

<a id="auditoria"></a>

## Auditoría funcional inicial y experiencia de uso

### Entorno y alcance

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

### Caso de negocio utilizado

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

### Cobertura ejecutada

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

### Hallazgos priorizados

#### H01 — P1: importación confirma relaciones semánticamente incorrectas

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

#### H02 — P1: Ctrl+R recarga en lugar de revisar

**Reproducción:** con cambios manuales sin guardar, pulsar Ctrl+R. Se recargó el renderer y apareció el diálogo de recuperación; no inició la revisión esperada.

**Impacto:** interrumpe el trabajo y obliga a restaurar una copia. No se observó pérdida tras restaurar en este caso; no debe presentarse como pérdida confirmada de datos.

**Contraste técnico:** el menú asigna CmdOrCtrl+R a «Revisar con IA» y también incluye el rol nativo reload en «Ver». Es una colisión de atajos consistente con lo observado.

**Recomendación:** reservar un único atajo para revisar y retirar o reasignar recarga en el menú de usuario.

**Aceptación:** con cambios pendientes, el atajo debe iniciar una sola revisión, conservar el documento y no abrir recuperación.

#### H03 — P1: cuatro salidas ofrecidas no se guardan en la instancia abierta

**Reproducción:** Exportar → diseño completo → SVG, PNG, Mermaid o draw.io → Exportar. Los cuatro terminaron en «Archivos de exportación inválidos.» sin selector de destino.

**Impacto:** el usuario ve formatos habilitados que no puede utilizar. Markdown + JSON sí se guardó.

**Diagnóstico pendiente:** el código fuente y el bundle en disco incluyen los seis tipos, y las pruebas de validación pasan. No se capturó el payload IPC ni se reinició el proceso principal. Por tanto, una instancia principal desactualizada frente al renderer es una hipótesis, no una causa raíz demostrada. Tampoco puede afirmarse que los generadores actuales estén rotos por este único resultado.

**Recomendación:** repetir primero con main/preload/renderer iniciados desde la misma compilación y añadir una prueba integrada real que llegue al diálogo y al archivo. Diferenciar error de contrato, formato no soportado y contenido inválido.

**Aceptación:** cada formato habilitado crea su archivo desde la UI de una sesión recién iniciada y comunica cualquier incompatibilidad de versión.

#### H04 — P2: claves incompletas y composición poco clara

**Evidencia persistida:** LineaPedido tiene dos objetos de tipo primaria, uno por pedido_id y otro por producto_id, en lugar de una única clave compuesta. El ejemplo pretendía una clave de dos columnas. El significado de varias marcas PK en el importador no está explicado en el diálogo.

Al pulsar «Crear clave foránea en Producto» desde la relación Categoria → Producto, se guardó fk_producto con atributoIds: [] y claveDestinoIds: [], aunque Categoria ya tenía su PK. No se completó después la configuración de esa FK.

**Impacto:** un usuario puede confundir una declaración incompleta con una restricción utilizable. Estas estructuras no se deben traducir directamente a SQL/ORM.

**Recomendación:** presentar un asistente de mapeo de columnas y estado «FK incompleta»; definir una convención explícita de PK compuesta en Markdown. Permitir borradores incompletos es razonable si se identifican claramente.

**Aceptación:** la FK tiene columnas origen y destino compatibles, o queda señalada como pendiente; una PK compuesta se conserva como una sola restricción con dos atributos.

#### H05 — P2: estados de revisión que pueden dar confianza excesiva

La revisión local encontró 71 elementos con información desconocida, mientras que la sección de información desconocida había mostrado cero elementos registrados. Son fuentes de información diferentes, pero la UI no explica esa diferencia.

También mostró 2FN «Verificado con la información declarada» mientras 1FN figuraba con información insuficiente. La importación había separado las PK de LineaPedido. Esta combinación puede interpretarse como una certificación de normalización que el modelo incompleto no permite concluir.

**Recomendación:** distinguir desconocidos detectados frente a registrados, y explicar que una verificación de dependencias parciales no certifica 2FN sin los prerrequisitos. Separar «sin infracciones detectadas» de «forma normal verificada».

**Aceptación:** un esquema con atomicidad desconocida no presenta una certificación global de 2FN; el usuario puede navegar desde cada contador a los campos que lo componen.

#### H06 — P2: errores de IA técnicos, duplicados y sin recuperación directa

La revisión y el chat terminaron con HTTP 503. En chat apareció texto del tipo «Error invoking remote method 'ia:chat'» además del mensaje comprensible. El fallo de revisión también apareció en la conversación. Durante la sesión hubo un aviso de error adicional; al reabrir quedó el historial de errores persistido sin ese aviso transitorio.

**Recomendación:** un mensaje contextual por operación, con «Reintentar» y detalle técnico opcional. Mantener solicitud y modelo utilizados. Un estado «conectado» debería describir validación de credenciales/catálogo, sin implicar disponibilidad de generación.

**Aceptación:** ante 503 no se cambia el diseño, se conserva la solicitud y se ofrece un reintento explícito; no se muestra IPC interno como texto principal.

#### H07 — P3: detalles visuales y de orientación

- La barra flotante tapa parte de Cliente al importar. Arrastrarla funciona, pero la ubicación vuelve a su posición inicial tras recargar.
- Con zoom 110 % parte del modelo queda fuera del borde izquierdo. No se descubrió un control destacado de «Ajustar al contenido» en el recorrido.
- El panel tiene buena separación por pestañas, pero configurar atributos requiere bastante desplazamiento vertical.
- La configuración mostró «El modelo «» está disponible» con un modelo seleccionado: feedback incompleto.
- El aviso «Se restauró la copia de recuperación» permaneció visible incluso después de crear otro proyecto; el mensaje conserva un contexto anterior.
- Una operación del historial mostró un ID de entidad en vez de su nombre.
- Guardar como tienda-e2e.vbdproj conserva «Proyecto sin título» como nombre interno. Conviene ofrecer un campo de nombre al crear/guardar, sin asumir que el nombre de archivo deba renombrar el proyecto automáticamente.

### Feedback del producto

#### Pros

1. **Recuperación efectiva:** la restauración recuperó los cambios reales de la sesión, incluida la entidad adicional.
2. **Persistencia del chat por proyecto:** Nuevo limpió la conversación y Abrir restauró los mensajes del archivo correcto.
3. **Separación de revisión local e IA:** permite evaluar reglas sin depender del servicio remoto; los errores de IA no bloquearon la edición.
4. **Diseño centrado en el lienzo:** herramientas arrastrables y panel superpuesto permiten aprovechar el espacio.
5. **Edición reversible y trazable:** renombrar, deshacer, rehacer y consultar historial funcionaron.
6. **Tratamiento explícito de incertidumbre:** aparecen valores desconocidos en vez de inventar tipos; falta unificar cómo se resumen.
7. **Exportación documental útil:** el paquete incluye diccionario, claves, reglas, pendientes y revisión local. Los formatos gráficos explican límites antes de exportar.
8. **Privacidad visible:** la clave se presentó enmascarada y los artefactos documentales inspeccionados no incluyeron el chat ni la configuración del proveedor. Esto no equivale a una auditoría criptográfica del almacenamiento.

#### Contras

1. La interpretación importada exige revisar manualmente cada relación, aunque el resumen diga que no hay ambigüedades.
2. El modelo permite estados incompletos que visualmente se parecen a restricciones terminadas.
3. Las interrupciones del proveedor y los errores de integración no ofrecen un camino de recuperación suficientemente directo.
4. El flujo de edición de atributos es repetitivo para modelos de tamaño mediano.
5. La navegación espacial requiere mover herramientas y ajustar el lienzo manualmente; falta una acción visible de encuadre.
6. Pasar todas las pruebas unitarias no garantiza que main, preload y renderer funcionen juntos en la sesión instalada.

#### Áreas de oportunidad y orden recomendado

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

### Evidencias y estado final

| Archivo | Contenido |
| --- | --- |
| tienda-prueba.md | Entrada sintética reproducible |
| tienda-e2e.vbdproj | Proyecto final v15, con nota y chat; conserva defectos encontrados |
| Proyecto sin título-export-2f81b0a5/Proyecto sin título-reporte.md | Reporte generado por la aplicación, snapshot v13 anterior a la nota |
| Proyecto sin título-export-2f81b0a5/Proyecto sin título-modelo.json | Modelo estructurado del mismo snapshot v13 |

Los archivos exportados se inspeccionaron: son legibles, contienen cinco entidades y cuatro relaciones, conservan la descripción con acentos y &, y no contienen la solicitud de chat de esta prueba, nombres de campos apiKey/credencial ni la ruta personal de importación buscada. No se inspeccionó la clave secreta para comparar su valor. No se adjuntan capturas como archivos de evidencia; las observaciones visuales corresponden a la interacción en vivo.

La aplicación quedó abierta con el proyecto de prueba guardado. No se hicieron correcciones, commit ni push como parte de esta auditoría. El siguiente ciclo debe corregir los fallos prioritarios y repetir primero T02–T03, T18 y T26–T29; después completar los recorridos bloqueados cuando Gemini responda correctamente.

### Ubicación de las evidencias

Tras organizar el repositorio, las salidas de esta sesión se conservan en `artefactos-locales/pruebas/2026-10-18/`, ignoradas por Git. Los nombres y rutas del relato describen el momento de la prueba, salvo los enlaces actualizados. La entrada reproducible está en `tests/fixtures/tienda-prueba.md`; el ejemplo Markdown exportado se conserva como `ejemplo-reporte-exportado.md`.

<a id="regresion"></a>

## Correcciones de importación, proyecto y exportaciones

### Dictamen

Los problemas principales de importación, nombre del proyecto, clave compuesta, creación de FK y atajo de revisión quedaron corregidos y comprobados. Las exportaciones SVG, PNG, Mermaid y draw.io se guardaron desde una sesión actualizada. La inspección visual del PNG detectó un solapamiento adicional; se corrigió y se volvió a exportar con las tablas separadas y los tres conectores visibles.

La generación con IA sigue teniendo limitaciones verificadas: Gemini respondió con errores del proveedor o de acceso al modelo; Ollama respondió al chat, pero su revisión estructurada agotó el tiempo de espera y la respuesta de chat tuvo errores conceptuales. **La conexión funciona, pero todavía no puede darse por validado el recorrido de revisión, propuestas y aprobación con ambos proveedores.**

Verificación técnica: **89 pruebas aprobadas en 20 archivos**, comprobación de tipos aprobada para main y renderer y compilación de producción completada.

### Entorno y método

- Windows, Electron, Visual BD 0.1.0; sesiones iniciadas desde la compilación actual mediante `npm start`.
- Interacción real con la aplicación y diálogos nativos mediante la habilidad computer-use.
- Pruebas con el fixture ficticio [tienda-prueba.md](../../../tests/fixtures/tienda-prueba.md), sin datos reales de negocio.
- Gemini: URL oficial compatible con OpenAI, credencial guardada existente y catálogo accesible. No se reveló, copió ni reemplazó la clave durante la prueba.
- Ollama: servidor existente en `http://127.0.0.1:11434`; cinco modelos listados; utilizado `llama3.2:latest`.
- Se reinició la aplicación para alinear main, preload y renderer. El guardado y la reapertura se comprobaron también mediante lectura del archivo generado.
- No se modificó la stack, no se añadieron dependencias de UI y no se generó SQL ni se aplicaron cambios propuestos por IA.

La comprobación cubre los flujos afectados y una muestra real de IA; no certifica todas las funciones, plataformas, condiciones de red o tamaños de ventana.

### Correcciones implementadas

| Área | Cambio | Resultado comprobado |
| --- | --- | --- |
| Nombre del proyecto | Campo editable en cabecera, hasta 120 caracteres; marca cambios pendientes y conserva el nombre en el proyecto | Se guardó y restauró «Tienda QA — Gemini y Ollama» tras reiniciar |
| Validación del nombre | Guardar y Guardar como bloquean un nombre vacío o compuesto solo por espacios | Nombre vacío + Ctrl+S mostró «Escribe un nombre para el proyecto antes de guardar», sin guardar el nombre vacío |
| Importación Markdown | Se separan entidades y cardinalidad antes de procesar la relación | Los tres extremos del fixture se importaron correctamente |
| Resolución de nombres | Se retiró la coincidencia parcial automática de extremos | Un destino no resuelto exactamente se registra como ambigüedad; cubierto por prueba de regresión |
| Cardinalidades | Se reconoce correctamente el máximo n y el mínimo de intervalos como 1..n | El proyecto conserva 1, 0..n y 1..n del fixture |
| Clave primaria compuesta | Las marcas PK de una entidad se agrupan en una restricción | LineaPedido tiene una PK con pedido_id y producto_id |
| Atajos | Ctrl+R se conserva para revisar; recarga pasa a Ctrl+Shift+R | Ctrl+R inició la revisión sin recarga ni recuperación |
| FK desde relación | Se selecciona la PK destino y se reutilizan o crean columnas para completar el mapeo | Pedido reutilizó cliente_id y apuntó a la PK de Cliente |
| FK desde formulario | Requiere seleccionar una clave primaria/candidata y usa la misma utilidad de mapeo | Tipos y pruebas de la utilidad aprobados; esta variante de formulario no se repitió íntegramente en UI |
| Duplicación de FK | Se rechaza un mapeo idéntico ya existente | Segundo clic mostró «Esta clave foránea ya existe», sin añadir otra |
| Archivos antiguos | La validación identifica FK vacías y múltiples PK separadas | Prueba de regresión para FK incompleta aprobada; no se migran ni corrigen datos antiguos automáticamente |
| Normalización | Un nivel superior no queda verificado si falta verificar un prerrequisito | Revisión local mostró 1FN, 2FN, 3FN y BCNF con información insuficiente en este caso incompleto |
| Desconocidos | Se explica la diferencia entre desconocidos registrados en importación y campos pendientes detectados por reglas | Texto aclaratorio añadido; la revisión real detectó 66 elementos desconocidos |
| Errores de IA | Se elimina el envoltorio técnico de IPC de los errores nuevos y del historial visible | Los errores de Gemini y Ollama aparecieron con mensajes comprensibles |
| Reintento | Se incorporaron acciones para reintentar revisión y último mensaje | Implementado; no se afirma éxito de generación por la existencia del botón |
| Contenido estructurado en chat | El bloque de propuestas emitido como texto se presenta desplegable y marcado como no aplicado | Compilado; su presentación final no se volvió a inspeccionar directamente en la pestaña Chat tras el último reinicio |
| Mensaje de conexión | Se elimina el nombre de modelo vacío del feedback del catálogo | Se observó un mensaje de catálogo sin «modelo «»» |
| Contexto de avisos | Al cargar otro chat/proyecto se limpia el aviso anterior | Implementado para evitar conservar avisos de recuperación de otro proyecto |
| Orientación del lienzo | Nueva acción «Ajustar al contenido» y margen inicial para no tapar Cliente con herramientas | Encuadre probado con inspector abierto; las cuatro entidades quedaron visibles |
| Herramientas | Se conserva la posición como preferencia visual local, con control de límites | Implementado; no se repitió una prueba específica de arrastrar y reiniciar en la versión final |
| Historial | Las ediciones de descripción de entidad usan el nombre en lugar del ID cuando está disponible | Implementado y tipado; no se reejecutó esa descripción concreta en UI |
| Gráficos | Se separan tablas ensanchadas por sus etiquetas y se desvía un conector horizontal que cruza otra tabla | PNG final inspeccionado visualmente; regresión automatizada aprobada |

Las adaptaciones gráficas afectan a la copia exportada, no a las posiciones ni a las relaciones del proyecto. Las correcciones de integridad afectan a nuevas operaciones; los archivos anteriores se conservan y se señalan cuando requieren revisión.

### Caso de BD y evidencias de persistencia

Archivo final: `tienda-regresion.vbdproj` (evidencia local no versionada).

| Dato persistido | Valor comprobado |
| --- | --- |
| Nombre | Tienda QA — Gemini y Ollama |
| Versión del diseño | 2 |
| Entidades | 4 |
| Atributos | 15 |
| Relaciones | 3 |
| Reglas de negocio | 4 |
| Mensajes de chat | 6 |
| FK añadida manualmente | Pedido.cliente_id → PK de Cliente |

Relaciones comprobadas en el archivo:

```text
Cliente   → Pedido
Pedido    → LineaPedido
Producto  → LineaPedido
```

LineaPedido guarda una sola clave primaria con dos IDs de atributos. La FK de Pedido guarda un atributo origen, el ID de la entidad Cliente, el ID de su clave primaria y el ID de la relación. No quedó como una FK vacía.

El caso contiene información deliberadamente desconocida —tipos, nulabilidad, participación y otras decisiones— para comprobar cómo comunica la aplicación la incertidumbre. **No es un esquema terminado para ejecutar en un motor DB.**

### Resultado de IA remota: Gemini

| Operación | Modelo | Resultado real |
| --- | --- | --- |
| Conexión y listado | Catálogo del proveedor | Correcto; 63 modelos accesibles en la lista |
| Revisión por Ctrl+R | gemini-3.8-flash | HTTP 503; la ventana no se recargó y el diseño siguió editable |
| Revisión con alternativa del catálogo | gemini-2.5-flash | Respuesta clasificada por la aplicación como modelo no disponible para nuevos usuarios de la cuenta |

El cambio de cuenta comunicado por el usuario se respetó utilizando la credencial guardada. No se verificó la identidad de la cuenta ni se inspeccionó la clave secreta.

**Conclusión:** no se reprodujo pérdida de credenciales. Los resultados observados corresponden a disponibilidad o acceso a generación; listar modelos no demuestra que la cuenta pueda utilizarlos. No se obtuvo una revisión correcta ni propuestas reales de Gemini. El chat remoto no se volvió a ejecutar en este ciclo; sí quedó documentado el fallo de chat remoto en la auditoría inicial.

Después de las pruebas se seleccionó nuevamente el modelo original `gemini-3.8-flash` en Gemini. La configuración local de Ollama quedó conservada por separado. No se activó ni desactivó la opción de privacidad Solo local durante la prueba.

### Resultado de IA local: Ollama

| Operación | Resultado real |
| --- | --- |
| Conectar a servidor | Correcto |
| Consultar modelos instalados | Correcto; cinco entradas |
| Seleccionar modelo | llama3.2:latest activado desde la UI |
| Revisión estructurada del diseño | Alcanzó el timeout configurado de 180 segundos |
| Chat breve sobre LineaPedido | Respondió y se guardó en el proyecto |
| Aplicación de cambios de IA | Ninguno |

Solicitud del chat:

> Prueba QA con datos ficticios. Resume en dos frases para qué sirve LineaPedido y su clave compuesta. No generes propuestas ni SQL.

La respuesta afirmó que LineaPedido relacionaba pedidos con clientes, en lugar de explicar correctamente el enlace entre pedidos y productos mediante las líneas. También incluyó un bloque XML de propuestas pese a la instrucción de no hacerlo. No se interpretó como una propuesta aplicable ni se modificó el diseño.

**Conclusión:** la integración local pudo completar una generación de chat. La precisión conceptual de esa respuesta fue insuficiente y la revisión estructurada no se completó dentro del límite. No se atribuye el timeout a una causa específica de hardware sin una medición que lo demuestre. Queda pendiente probar un modelo local más adecuado para salida estructurada o evaluar límites/contexto con mediciones.

### Exportaciones repetidas

Los cuatro formatos que fallaron en la instancia anterior se guardaron correctamente después de iniciar una sesión actualizada:

| Archivo | Verificación |
| --- | --- |
| `regresion.svg` (evidencia local no versionada) | Guardado desde UI; archivo existente |
| `regresion.png` (evidencia local no versionada) | Guardado desde UI; inspección visual detectó solapamientos en esta primera salida |
| `regresion.mmd` (evidencia local no versionada) | Guardado desde UI; contiene las tres relaciones, sin avisos de omisión por cardinalidad desconocida |
| `regresion.drawio` (evidencia local no versionada) | Guardado desde UI; archivo existente; no se abrió en diagrams.net ni se reimportó en este ciclo |
| `regresion-final.png` (evidencia local no versionada) | Exportado otra vez tras corregir geometría y crear la FK; inspección visual final aprobada |

La salida final muestra las cuatro tablas separadas, la FK en Pedido y el conector Pedido → LineaPedido desviado por arriba de Producto. El título conserva el nombre del proyecto.

Evidencia visual local: `artefactos-locales/pruebas/2026-10-18/regresion-final.png` (no versionada).

El rechazo anterior de todos los formatos gráficos desapareció con una sesión alineada con la compilación actual. Esto es consistente con una instancia desactualizada; no se capturó su payload IPC original, por lo que no se presenta como una causa raíz demostrada al cien por cien. La nueva corrección geométrica sí corresponde a un defecto visual observado y reproducido en la salida PNG.

### Verificación automatizada

| Comando | Resultado |
| --- | --- |
| npm test | 89/89 pruebas; 20/20 archivos |
| npm run typecheck | Aprobado en main y renderer |
| npm run build | Aprobado; compilación final iniciada y utilizada en la comprobación de FK y PNG |

Se añadieron regresiones para extremos de relaciones, cardinalidades entre paréntesis, PK compuesta, nombres parcialmente coincidentes, mapeo de FK, FK heredadas incompletas y separación de tablas/conectores. Se reforzó la aserción del estado 2FN con información incompleta.

No se añadieron dependencias. Las pruebas no garantizan calidad de razonamiento de los modelos ni disponibilidad de servicios externos.

### Archivos de código modificados en este ciclo

| Grupo | Archivos |
| --- | --- |
| Nombre, guardado y estados | src/renderer/src/estado/tienda.tsx; componentes/Cabecera.tsx; estilos.css |
| Importación | src/renderer/src/importadores/markdown.ts; borrador.ts; markdown.test.ts |
| FK y validación | src/renderer/src/domain/clave-foranea.ts y su test; validacion.ts y su test; componentes/PanelPropiedades.tsx |
| Normalización | src/renderer/src/domain/normalizacion.ts; normalizacion.test.ts |
| Atajo y feedback del proveedor | src/main/index.ts; src/main/ia/openai.ts |
| Mensajes y reintentos | src/renderer/src/componentes/PanelChat.tsx; PanelRevision.tsx |
| Orientación y herramientas | src/renderer/src/componentes/Lienzo.tsx; Herramientas.tsx; estado/usePanelArrastrable.ts |
| Salida gráfica | src/renderer/src/exportadores/graficos.ts; diagramas.test.ts |
| Documentación | README.md; documentacion/exportacion.md; este informe |

El repositorio ya tenía cambios de la implementación de exportación antes de este ciclo. La lista anterior describe las correcciones actuales; no atribuye todos los cambios pendientes de Git a esta auditoría. No se realizó commit ni push en este ciclo.

<a id="revision-ia"></a>

## Diagnóstico de revisión IA y Actual/Propuesto

### Alcance y evidencia

- Aplicación Electron en Windows, maximizada, tema oscuro; interacción real mediante la interfaz nativa.
- Caso de tienda: Cliente, Pedido, Producto y LineaPedido; cuatro entidades, quince atributos y tres relaciones.
- Proveedor activo observado: Gemini; modelo mostrado en la interfaz: `gemini-3.8-flash`. No se modificaron credenciales ni ajustes de privacidad.
- Copia de prueba: `revision-comparacion-qa.vbdproj`, conservada ahora en `artefactos-locales/pruebas/2026-10-18/`. Los cambios de aprobación se realizaron en esta copia.
- Se contrastaron los resultados con el archivo guardado y con el código de comprobación, previsualización y presentación. No se inyectaron respuestas ni propuestas sintéticas.
- El atajo Ctrl+Shift+S guardó el archivo de origen antes de crear la copia; posteriormente Archivo → Guardar como sí abrió el diálogo y permitió aislar las pruebas. Por tanto, el origen recibió ese guardado inicial, pero las nuevas aprobaciones se hicieron en la copia.

No se repitió Ollama en este ciclo: la revisión real de Gemini permitió recorrer el flujo solicitado. La revisión estructurada local sigue pendiente; el informe anterior registró chat local exitoso con calidad semántica insuficiente y una revisión local que agotó 180 segundos. Tampoco se provocaron nuevos errores de autenticación, cuota o red: los errores reproducidos aquí fueron de aprobación dentro de la aplicación.

### Pruebas realizadas

| Prueba | Resultado | Evidencia y límite |
| --- | --- | --- |
| Generar revisión real con IA | Aprobada | Gemini respondió en aproximadamente 30 segundos y añadió tres propuestas; ninguna se aplicó automáticamente. No es una medición de rendimiento repetida. |
| Mostrar revisión en curso | Parcial | Se mostraron “Revisando con IA…” y “El agente está revisando…”. El detalle del panel quedó fuera de vista por el desplazamiento previo; una alerta antigua permaneció visible. |
| Comparar una propuesta de atributos | Parcial | Propuesto mostró bordes y marcas de cambio; Actual recuperó el diseño vigente. La previsualización no incrementó la versión. Faltan leyenda y valores antes/después. |
| Inspeccionar una entidad en Propuesto | Fallo | El lienzo mostraba cambios propuestos, pero Propiedades mostraba nulabilidad y unicidad actuales, como Desconocido. Los controles seguían habilitados; no se editó desde ese estado. |
| Aplicar propuesta previa de atributos | Fallo | Informó atributos inexistentes y conflictos con cambios anteriores. Se repitió con una propuesta recién generada para aislar el problema. |
| Aplicar propuesta nueva de atributos | Fallo reproducible | Sin ediciones del diseño entre generación y aceptación, informó ocho atributos inexistentes. Los ocho se verificaron presentes por entidad e ID en el archivo. |
| Previsualizar seis reglas nuevas | Parcial | Se pudo activar Propuesto, pero el lienzo no cambió y no apareció una comparación de las reglas. Un diagrama por sí solo no representa este cambio. |
| Aplicar propuesta de seis reglas | Aprobada | Las reglas pasaron de 4 a 10, la versión de 4 a 5 y el historial de 3 a 4 pasos. Se mostró confirmación y se guardó mediante Ctrl+S. |
| Estado posterior a aceptar | Parcial | La vista permaneció en Propuesto con el rótulo de borrador después de aplicar. La previsualización de una propuesta ya aplicada no constituye un antes/después histórico. |
| Propuesta de aclaración sin operaciones | Fricción | La propuesta sobre repetición de productos en un pedido tenía Operaciones (0), pero ofrecía Aceptar y Ver antes/después. No se aceptó ni rechazó. |
| Presentación de errores y éxito | Fallo visual | Los mensajes fueron visibles, pero el botón Cerrar se comprimió. El error extenso expuso IDs técnicos y persistió durante otra revisión exitosa. |
| Cambio entre pestañas del panel | Fricción | Se perdió el contexto de expansión de propuestas y el desplazamiento no resultó coherente con el contenido de la pestaña. |
| Guardar como con teclado | Fallo | Ctrl+Shift+S guardó directamente; Archivo → Guardar como abrió el diálogo esperado. |

Estado guardado de la copia: seis propuestas, tres aplicadas y tres pendientes; cuatro entidades, tres relaciones y diez reglas. La aplicación quedó en Actual. No se probaron deshacer la nueva aprobación ni rechazar propuestas en este ciclo.

### Hallazgos priorizados

#### R1 — P1: identidad incorrecta de atributos al validar propuestas

La propuesta recién generada “Establecer no nulabilidad en claves primarias y foráneas obligatorias” contenía ocho operaciones `updateAtributo`. Todos los atributos existían: Cliente.cliente_id, Cliente.email, Pedido.pedido_id, Pedido.cliente_id, Producto.producto_id, Producto.sku, LineaPedido.pedido_id y LineaPedido.producto_id.

La causa se localizó en `src/renderer/src/domain/propuestas.ts`: el mapa de huellas indexa atributos mediante `atributo:<entidadId>:<atributoId>`, pero `afectadosDeOperaciones` conserva únicamente el último segmento como ID. `claveAfectado` reconstruye `atributo:<atributoId>`, que no coincide con el mapa. La comprobación concluye erróneamente que el atributo dejó de existir.

Debe corregirse la identidad conservando la comprobación de cambios reales y la compatibilidad de proyectos guardados. No conviene solucionar el fallo omitiendo la validación de huellas.

#### R2 — P1: mezcla de datos actuales y propuestos

`Lienzo.tsx` proyecta las operaciones, mientras `PanelPropiedades.tsx` consulta el proyecto actual. La inconsistencia fue visible en nulabilidad y unicidad. Los controles de edición permanecen habilitados, lo que crea riesgo de modificar el diseño vigente mientras se interpreta que se está inspeccionando un borrador. No se ejecutó esa modificación durante la prueba.

#### R3 — P2: comparación incompleta y estado posterior ambiguo

Las operaciones se presentan como nombres técnicos, sin los campos y valores concretos que cambiarán. Las reglas nuevas no tienen representación diferencial; los nombres de relación guardados tampoco se muestran en el lienzo. Después de aceptar, Propuesto continúa pareciendo un borrador pendiente.

La implementación de la previsualización captura errores y puede volver al diseño actual sin explicarlos. Aplicar de nuevo las operaciones sobre un diseño ya actualizado no sustituye una comparación histórica. Este último punto se obtuvo por lectura de código; no se provocó una segunda aplicación.

#### R4 — P2: alertas difíciles de leer y sin contexto de operación

La alerta larga mezcla explicación e identificadores, domina el área inferior y estrecha Cerrar incluso en una ventana de 1920 × 1080. También se observó el botón dividido en el mensaje de éxito. El error anterior permaneció durante la carga y tras finalizar una revisión nueva, dificultando saber a qué acción pertenecía.

#### R5 — P2: detalle extenso y pérdida de orientación

Las acciones de aprobación requieren bastante desplazamiento. Cambiar a Propiedades y volver a Revisión pierde el contexto de la propuesta. Al terminar la revisión, se activó Revisión aunque se había consultado Chat durante la espera. Conviene conservar selección, expansión y posición por pestaña, y anunciar el resultado sin quitar el foco de una tarea en curso.

#### R6 — P2: Guardar como no funciona con su atajo

El manejador de Ctrl/Meta+S en `estado/tienda.tsx` no distingue Shift. La acción de menú funciona. Es una regresión de interacción concreta que debe cubrirse con una prueba de teclado.

#### R7 — P2: distinguir recomendaciones, preguntas y cambios ejecutables

La propuesta de ambigüedad sin operaciones pide una decisión de negocio válida, pero los botones prometen aplicar o comparar un cambio inexistente. El resumen de Gemini afirma una base en Tercera Forma Normal mientras reconoce tipos, nulabilidad y dependencias sin confirmar. Eso no demuestra normalización: deben separarse hipótesis, evidencia verificable y preguntas pendientes.

### Fortalezas observadas

- Gemini pudo revisar el caso y producir operaciones estructuradas utilizables; las nuevas reglas se aplicaron y persistieron.
- La aprobación humana se conservó: generar y previsualizar no aplicó automáticamente los cambios.
- Actual/Propuesto es un punto de entrada comprensible y las marcas del lienzo ayudan a localizar entidades afectadas.
- Las propuestas incluyen fundamento, supuestos, preguntas y contrapartidas. La pregunta sobre varias líneas del mismo producto aporta valor para revisar la PK compuesta.
- El nombre del proyecto, guardado y panel lateral permiten continuar el caso sin reconstruirlo.

### Relación con el informe anterior

| Pendiente o resultado de informe-regresion.md | Situación actual |
| --- | --- |
| Generación real con Gemini | Verificada ahora; sustituye la limitación anterior de no haber obtenido una revisión exitosa. |
| Recorrido de aprobación de propuestas | Parcial: añadir reglas funciona; modificar atributos está bloqueado por R1. |
| Revisión estructurada y calidad de Ollama | Sigue pendiente; no se repitió esta vez. |
| Reimportar draw.io y renderizar Mermaid externamente | Sigue pendiente. |
| Teclado completo, ventana pequeña, modo claro y otros OS | Sigue pendiente; la muestra actual añade el fallo Ctrl+Shift+S, no certifica accesibilidad completa. |
| Posición de herramientas tras reiniciar y reintento recuperable | Sigue pendiente. |
| Prueba integrada automatizada | Sigue pendiente; debe incorporar comparación y aprobación. |
| Nombre persistente, importación, FK, normalización y geometría corregidos | Conservar como regresiones del ciclo anterior; no atribuir su validación completa a esta sesión. |

Los 89 tests, typecheck y build aprobados corresponden al informe anterior. No se repitieron en este ciclo de evaluación sin cambios de código. Tampoco se certifican todos los tipos de operación por haber aplicado correctamente `addRegla`.

### Próximo paso

Ejecutar, tras aprobar su alcance, el plan de `plan-mejoras-revision-ia-ux.md`: primero integridad de aprobación y separación Actual/Propuesto; después comparación, alertas y navegación; finalmente matriz de regresión y proveedores. No se requiere cambiar la stack ni añadir una biblioteca de UI.

<a id="correcciones"></a>

## Correcciones de aprobación y segunda comprobación

### Cambios realizados

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

### Prueba manual en Electron

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

### Prueba real de Ollama

Se consultó el catálogo local y se utilizó un modelo ya instalado, `mistral:latest`, sin descargar nada. El primer acceso desde el entorno aislado devolvió EACCES; la consulta con acceso permitido confirmó que el servidor estaba encendido. No fue una avería de Ollama.

El ensayo optativo `tests/integracion/ollama-real.test.ts` llamó al adaptador de producción mediante HTTP real, con una entidad Cliente, cliente_id con PK y email sin restricciones confirmadas. Se sustituyó únicamente el registro de consumo para no escribir en el historial personal; no se simularon fetch, catálogo, generación ni análisis de JSON. No se cambió la configuración de la aplicación.

Resultado guardado: `ollama-revision-real.json`, duración de generación 85223 ms. El modelo devolvió una propuesta de preguntas sobre nulabilidad, unicidad y multivalor de email, con operaciones vacías. No impuso restricciones ni inventó una certificación de normalización. La prueba confirma conexión, respuesta y estructura en este caso reducido; no valida todo el recorrido de Ollama por IPC/UI ni todos los modelos locales.

### Verificación automatizada

| Comprobación | Resultado |
| --- | --- |
| npm test | 99 pruebas aprobadas, 22 archivos; un ensayo de red optativo omitido en la ejecución normal. |
| Ollama optativo habilitado | 1/1 aprobado, HTTP real. |
| npm run typecheck | Aprobado; incluye procesos main/renderer y pruebas de integración. |
| npm run build | Aprobado; Electron reiniciado con la compilación actual. |

Regresiones añadidas: identidad nueva y heredada, atributos con mismo ID en entidades diferentes, conflictos reales, atributo eliminado e identidad ambigua, previsualización sin mutación, diferencias de reglas, rechazo de comparación de aplicadas, aclaración sin modificación y grupo de operaciones atómico ante un fallo posterior.

La nueva prueba integrada recorre importar Markdown → guardar → reabrir → comparar → aprobar → guardar → reabrir → exportar draw.io → reimportar entidades y relación. También comprueba la salida Mermaid como texto. Es una integración entre dominio, disco e importadores/exportadores; no un E2E automatizado de toda la interfaz.

### Archivos de implementación de este ciclo

- `src/renderer/src/domain/propuestas.ts`, `aprobacion.ts`, `comparacion.ts` y `comparacion.test.ts`.
- `src/renderer/src/estado/tienda.tsx`.
- `src/renderer/src/componentes/PanelRevision.tsx`, `PanelDerecho.tsx`, `PanelPropiedades.tsx`, `PropiedadesPropuestas.tsx`, `ComparacionPropuesta.tsx`, `Lienzo.tsx` y `Herramientas.tsx`.
- `src/renderer/src/App.tsx` y `estilos.css`.
- `src/main/ia/adaptador.ts`.
- `tests/integracion/recorrido-proyecto.test.ts`, `ollama-real.test.ts`, `tsconfig.tests.json`, `vitest.config.mts` y `package.json`.
- README y documentación de este informe.

El repositorio contiene cambios previos de exportación y correcciones anteriores; esta lista no atribuye todos los cambios pendientes de Git a esta sesión.
