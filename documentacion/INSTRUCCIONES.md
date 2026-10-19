# Visual BD — Instrucciones de uso y desarrollo

Visual BD permite diseñar modelos relacionales y revisar su lógica. La IA propone; el usuario decide. No genera ni ejecuta SQL, DDL, migraciones, modelos ORM o esquemas NoSQL.

## 1. Elige tu guía

- [Guía visual paso a paso](guia/index.html): siete etapas, ilustración animada opcional y mapa filtrable de las funciones.
- [Referencia técnica](guia/tecnica.html): arquitectura, módulos, contratos IPC, estados y limitaciones.
- [Exportación](exportacion.md): formatos, alcance y contrato documental.

Las dos páginas HTML son estáticas y funcionan abriendo `documentacion/guia/index.html` en un navegador, también sin conexión. No acceden a proyectos, proveedores ni credenciales. La reproducción del recorrido es opcional y respeta movimiento reducido. Para servirlas por HTTP local, sirve `documentacion/` y abre `/guia/`; no requieren compilar la aplicación.

El inventario de las dos páginas se mantiene en `documentacion/guia/catalogo.js`; `guia.js` aporta búsqueda, filtros, enlaces por función y recorrido, y `estilos.css` comparte los tokens visuales. Para añadir una función, actualiza el catálogo y contrástala con su acceso y módulo reales.

## 2. Requisitos e inicio

Node.js 20+ y npm; desarrollo probado en Windows. macOS y Linux requieren completar sus verificaciones. Para IA local necesitas Ollama en ejecución con un modelo instalado. Revisar reglas, editar y exportar no requieren IA.

```bash
npm install
npm run dev
```

Si la descarga inicial de Electron no terminó, puedes repetir su instalador con `node node_modules/electron/install.js`.

| Comando | Función |
| --- | --- |
| `npm run dev` | Electron con recarga de desarrollo del renderer. |
| `npm start` | Abre la vista previa mediante electron-vite preview. |
| `npm test` | Pruebas de dominio, importación, exportación, persistencia, IA y presentación. |
| `npm run test:e2e` | Compila y ejecuta Electron con perfil aislado, servidor de IA controlado y destinos de diálogos automatizados. |
| `npm run typecheck` | Tipado de main/preload, renderer y pruebas de integración. |
| `npm run build` | Compila a `out/`. |
| `npm run pack` | Empaqueta sin instalador. |
| `npm run dist` | Genera distribución mediante electron-builder. |

Pack y dist son comandos disponibles, no instaladores publicados ni una certificación de plataformas. El ejecutador simplificado sigue pospuesto.

## 3. Flujo de trabajo recomendado

1. Crea o abre un proyecto y ponle nombre.
2. Construye el modelo o importa y confirma una interpretación.
3. Completa atributos, claves, relaciones y reglas conocidas.
4. Ejecuta **Revisar → Revisar reglas** y lee las limitaciones por datos desconocidos.
5. Opcional: configura un proveedor, conecta y selecciona un modelo; solicita **Revisar con IA**.
6. Compara y decide cada propuesta. Guarda el proyecto editable.
7. Exporta un reporte y/o diagrama según el destinatario.

La guía visual desarrolla estas etapas con un ejemplo de Cliente y Pedido; sus botones no ejecutan acciones reales de la aplicación.

## 4. Proyectos, nombre y guardado

### Nombre protegido

El nombre aparece en la cabecera junto a un lápiz. Pulsa **Editar nombre del proyecto** para desbloquearlo. Confirma con **✓**, **Enter** o saliendo del campo: vuelve a solo lectura hasta pulsar el lápiz otra vez. El nombre admite hasta 120 caracteres y no puede quedar vacío al guardar.

**Cambios sin guardar** indica modificaciones pendientes; **Guardado** confirma el último guardado en la ruta existente; **Sin ruta de guardado** indica que todavía necesitas elegir un archivo.

### Archivo editable

**Guardar** conserva el modelo en `.vbdproj`. **Guardar como** permite elegir otra ruta. Renombrar el proyecto no cambia automáticamente el nombre del archivo ya elegido. Su nombre sí se utiliza como sugerencia al guardar como y al exportar.

El archivo contiene `formatoVersion`, `proyecto`, `historial` y `mensajesChat` opcional para compatibilidad. Las credenciales están fuera. El guardado usa un archivo temporal y renombrado.

**Nuevo proyecto** limpia la conversación y el texto sin enviar. **Abrir** restaura el chat del archivo seleccionado; los archivos antiguos sin chat muestran una bienvenida. Compartir `.vbdproj` comparte también su conversación.

### Recuperación

La copia automática por proyecto se escribe con un retardo aproximado de tres segundos cuando hay cambios. Al arrancar se puede ofrecer restaurarla; el menú **Proyecto → Información de recuperación** permite consultarla. La recuperación no sustituye guardar el archivo de trabajo.

## 5. Crear o importar un modelo

### Desde cero

Elige Entidad y pulsa el lienzo. Selecciónala para editar nombre, descripción, atributos y claves en Propiedades. Para relacionar dos entidades, elige Relación y pulsa origen y destino. Volver a pulsar el origen cancela ese intento; Escape también permite salir de la herramienta.

### Importaciones

| Entrada | Interpretación | Qué debes revisar |
| --- | --- | --- |
| draw.io / XML | Lectura estructural de páginas planas o comprimidas. | Entidades, conectores, cardinalidades y figuras no clasificadas. |
| Markdown | Listas, tablas y prosa estructurada reconocida de forma determinista. | Nombres exactos, PK/FK, relaciones y reglas. |
| Imagen | Interpretación por un modelo adecuado, o solo referencia si no se puede interpretar. | Lectura visual, omisiones, cardinalidades y ambigüedades. |
| Prosa asistida | Interpretación por IA cuando se solicita ese flujo. | Supuestos, entidades y relaciones inferidas. |

Al importar, **Confirmar interpretación importada** muestra el borrador antes de incorporarlo. Resuelve las ambigüedades disponibles o consérvalas explícitamente pendientes. Puedes descartar la importación.

En el flujo actual, importar imagen con **Solo local** activado o sin modelo conserva una referencia sin interpretación automática. La imagen de referencia no se guarda dentro de `.vbdproj`. No se debe confundir esta limitación del flujo de imagen con la revisión textual local mediante Ollama, que sí está permitida.

Ejemplo de Markdown:

```markdown
# Tienda
## Cliente
- cliente_id (PK)
- nombre
## Pedido
- pedido_id (PK)
- cliente_id (FK)
Relación: Cliente -> (1, 0..n) Pedido
Regla: Cada pedido pertenece a un cliente.
```

Los extremos deben coincidir exactamente con los nombres de entidad. Varias marcas PK forman una clave primaria compuesta. Una marca FK en el texto puede necesitar completar su referencia y mapeo en Propiedades: no equivale por sí sola a una FK completamente definida.

## 6. Herramientas, propiedades y paneles

La barra vertical es flotante y arrastrable. Usa su asa o enfócala y pulsa flechas; Shift aumenta el paso. Escape cancela el arrastre. Su posición se conserva como preferencia local.

| Control | Uso |
| --- | --- |
| Seleccionar | Seleccionar entidades, relaciones y notas; arrastrar entidades en Actual. |
| Entidad | Crear una entidad haciendo clic en el lienzo. |
| Relación | Elegir origen y destino. |
| Nota | Añadir texto de contexto al lienzo. |
| Ajustar al contenido | En la barra arrastrable: encuadra entidades y notas, sin mover el modelo. |
| Restablecer | Devuelve la barra a su posición inicial; no encuadra el modelo. |

Rueda: zoom. Clic izquierdo en vacío: paneo; clic central inicia el paneo. La cápsula centrada muestra Modelo lógico y **Actual / Propuesto**.

Abre el panel desde el tirador a media altura del borde derecho. Se superpone al lienzo. Incluye:

- **Propiedades**: entidad, atributos, PK, claves candidatas y FK; extremos de relaciones y notas. Sin selección permite añadir reglas y consultar información desconocida.
- **Revisión**: Reglas y Propuestas, con filtros de estado y detalle.
- **Chat**: conversación por proyecto y discusión contextual.
- **Consumo**: peticiones y tokens registrados localmente.

Cierra con el tirador, el botón de cierre o Escape cuando no haya otro diálogo abierto. Las pestañas conservan contexto dentro del mismo proyecto y se reinician al cambiar de proyecto.

Una relación dibujada y una clave foránea declarada son cosas diferentes. Puedes crear la FK desde Propiedades de la relación o desde la entidad, indicando entidad y clave destino. Para una clave compuesta, comprueba el conjunto y orden de atributos y su mapeo.

## 7. Revisar reglas y revisar con IA

### Revisar reglas

No usa proveedor ni consume tokens. Comprueba estructura y normalización 1FN–BCNF con claves y dependencias declaradas. Puede mostrar **Verificado con la información declarada**, **Posible problema** o **Información insuficiente**. Datos desconocidos no se inventan para alcanzar una conclusión.

Algunos hallazgos ofrecen **Convertir en propuesta para aprobar**. Crear la propuesta todavía no modifica el diseño.

### Revisar con IA

Requiere conexión y modelo seleccionados. Envía el diseño y contexto del proyecto al proveedor activo y muestra el estado de espera. La respuesta incorpora recomendaciones y propuestas, sin aplicarlas.

Lee explicación, fundamento, supuestos, preguntas, resultado y contrapartidas. La calidad semántica requiere revisión humana: un JSON válido no demuestra que el consejo sea correcto.

### Comparación y decisiones

1. En Revisión → Propuestas, abre una tarjeta y consulta el desglose **Actual → Propuesto**, incluso si el cambio solo afecta reglas.
2. Pulsa **Ver antes/después** para mostrar el borrador en el lienzo. El inspector usa los valores propuestos y es de solo lectura. Vuelve a Actual para editar.
3. **Aceptar cambios** comprueba afectados y dependencias y aplica el grupo de forma atómica. Las propuestas nuevas de IA que cambian restricciones, claves, reglas o incluyen supuestos exigen revisar y confirmar sus puntos semánticos; la decisión queda registrada. Si hay conflictos reales, muestra el motivo y bloquea la acción. No fuerces propuestas desactualizadas.
4. Tras aplicar, la vista vuelve a Actual. No se ofrece una comparación histórica de esa propuesta aplicada.
5. **Rechazar** conserva el diseño. **Discutir en el chat** no aprueba la propuesta.
6. Una aclaración sin operaciones ofrece **Marcar como revisada**: no modifica diseño, versión ni historial, ni confirma sus supuestos de negocio.

Leyenda del lienzo propuesto: `+` añadido, `~` modificado y `−` eliminado. `*` indica atributo obligatorio; `?` indica información desconocida. No son el mismo tipo de marca.

### Espera, errores y respuestas tardías

Ante un error puedes **Reintentar revisión** o **Revisar proveedor y modelo**. Un catálogo accesible no garantiza que todos sus modelos puedan generar para tu cuenta.

**Descartar respuesta pendiente** impide incorporarla al proyecto. No garantiza detener el procesamiento del servidor ni sus cargos. Al cambiar de proyecto se ignoran respuestas de la sesión anterior. Si editas mientras la IA trabaja, la comprobación utiliza la versión enviada para detectar conflictos.

## 8. Proveedores, credenciales y privacidad

Abre **Modelo / IA** o Modelo → Configuración de proveedor.

1. Selecciona proveedor y URL base. Para Ollama suele ser `http://127.0.0.1:11434`.
2. Introduce la credencial si corresponde y pulsa **Conectar** o **Probar conexión**.
3. Tras conectar, usa Buscar modelos y selecciona uno del catálogo. La elección se guarda y establece el proveedor/modelo activo.

Perfiles separados conservan URL, credencial y último modelo. Con una clave guardada, dejar el campo vacío la conserva; escribir una nueva la reemplaza. **Revelar/Ocultar** controla su visibilidad y **Borrar credencial** elimina la credencial de ese proveedor.

El almacén usa `safeStorage`. Si el cifrado no está disponible, no se guarda una clave nueva. Las claves no forman parte de proyectos ni exportaciones. Los perfiles, ajustes y consumo son datos de la aplicación, separados del modelo.

**Solo local** bloquea proveedores remotos y permite revisión/chat de Ollama en direcciones del propio equipo. No significa que solo se pueda ejecutar la validación determinista. Para API remotas debe estar desactivado.

Disponibles: Ollama; OpenAI; Anthropic, Gemini, xAI y OpenRouter mediante las capas compatibles configuradas; endpoint personalizado compatible con OpenAI. Las capacidades reales, acceso al modelo y cuotas dependen del servicio y cuenta.

Al usar IA remota se envía contexto del modelo. No introduzcas secretos en nombres, reglas o mensajes que vayas a compartir con un proveedor.

## 9. Chat y consumo

El chat usa el contexto del diseño; Discutir añade la propuesta como contexto. **Enter** envía; **Shift+Enter** añade una línea. Los bloques estructurados de una respuesta no son cambios aplicados. El borrador sin enviar es temporal; los mensajes se guardan con el proyecto y quedan fuera de Deshacer/Rehacer del diseño.

Consumo muestra peticiones, entrada/salida, proveedor/modelo y días anteriores. El límite diario es orientativo, no una sincronización de la cuota del proveedor. Si no hay uso real informado, se estiman tokens y se señala. Actualizar consulta el registro local; gestionar ese registro no modifica la facturación del servicio.

## 10. Exportar y entregar

Abre **Archivo → Exportar**. El diálogo toma una instantánea al abrirse, incluidos cambios sin guardar. Puedes elegir diseño completo, selección o una propuesta en comparación no aplicada. Seleccionar una relación incluye sus dos extremos.

| Formato | Uso | Advertencias |
| --- | --- | --- |
| Markdown | Reporte de lógica y pendientes. | No genera SQL ni reglas confirmadas a partir de supuestos. |
| JSON | Modelo documental estructurado. | No es `.vbdproj` ni un esquema ejecutable de motor/ORM. |
| Markdown + JSON | Ambos archivos en una carpeta nueva. | El destino se elige mediante diálogo. |
| SVG | Diagrama vectorial. | No conserva toda la semántica del reporte. |
| PNG | Imagen 1× o 2×. | Puede usarse fondo claro, oscuro o transparente. |
| Mermaid ER | Texto `.mmd`. | Revisa advertencias: omisiones por cardinalidad desconocida y propiedades no representadas. |
| draw.io | Diagrama editable. | Reimportar no conserva todas las reglas, tipos, claves y restricciones. |

Markdown/JSON permiten notas, revisión local y anexo de propuestas según opciones disponibles. Las propuestas anexadas no se convierten en reglas confirmadas. En salidas parciales o propuestas se conserva su advertencia de contexto.

Las exportaciones omiten chat, credenciales, perfiles, rutas de importación e historial; no consultan IA. Para continuar editando usa `.vbdproj`; para comunicar la lógica combina diagrama y Markdown/JSON. Otra herramienta o agente puede utilizar ese reporte, pero Visual BD no ejecuta la implementación resultante.

## 11. Atajos

| Atajo en Windows/Linux | Acción |
| --- | --- |
| Ctrl+N / Ctrl+O | Nuevo / Abrir. |
| Ctrl+S / Ctrl+Shift+S | Guardar / Guardar como. |
| Ctrl+Z / Ctrl+Y | Deshacer / Rehacer en Actual. |
| Ctrl+R | Revisar con IA. |
| Ctrl+Shift+R | Recargar el renderer; es una acción de desarrollo, no revisión. |
| Supr / Delete | Eliminar selección, fuera de campos de texto. |
| Escape | Cancelar herramienta/origen o cerrar panel según el contexto. |
| Enter en nombre | Confirmar el nombre y volver a bloquearlo. |
| Enter / Shift+Enter en chat | Enviar / nueva línea. |

El menú nativo usa CmdOrCtrl: en macOS se esperan los equivalentes con Cmd, pendientes de comprobación completa en ese sistema.

## 12. Problemas frecuentes

| Síntoma | Qué revisar |
| --- | --- |
| Conecta, pero no genera | Acceso de la cuenta a ese modelo; volver a seleccionar uno disponible. |
| Error de autenticación | Credencial, proveedor y permisos; no revelar la clave en capturas o logs. |
| 404 | Ruta base y disponibilidad del modelo; conectar al catálogo no garantiza generación. |
| 429 | Límite de tasa: respetar el tiempo de espera; no repetir peticiones continuamente. |
| 503 | Modelo temporalmente indisponible o saturado; el catálogo puede seguir accesible. Reintentar más tarde o elegir otro modelo, sin sustituir la clave por este error. |
| Timeout | Complejidad del caso, modelo y servicio. El timeout no demuestra una clave inválida. |
| No puedo editar | Comprueba si estás en Propuesto o si el nombre necesita el lápiz. |
| Propuesta desactualizada | Leer motivos y pedir otra revisión; no omitir la comprobación de huellas. |
| No veo todo el diagrama | Ajustar al contenido en la barra; cerrar el panel si oculta parte del lienzo. |
| Mi exportación no contiene todo | Alcance elegido y limitaciones del formato; consultar Markdown/JSON. |

## 13. Archivos y arquitectura

- `src/main/`: ventana, menús, IPC, disco, recuperación, proveedores e importador draw.io.
- `src/preload/index.ts`: puente `window.api`.
- `src/shared/`: contratos IA y exportación.
- `src/renderer/src/domain/`: modelo, operaciones, historial, aprobación, comparación, validación y normalización.
- `src/renderer/src/estado/`: store y comportamiento de interfaz/proveedores.
- `src/renderer/src/exportadores/`: alcance, instantánea y formatos.
- `tests/integracion/`: recorridos de dominio/disco y ensayo local optativo.
- `tests/fixtures/`: entradas sintéticas versionadas.
- `artefactos-locales/pruebas/`: salidas de ejecución conservadas localmente, ignoradas por Git.
- `documentacion/guia/`: sitio estático, sin librerías ni llamadas a la aplicación.

`<userData>/recuperacion`, `/credenciales`, `/ajustes` y `/consumo` son carpetas de datos de Electron. Su raíz depende del OS y nombre de aplicación: normalmente APPDATA en Windows, Application Support en macOS y .config en Linux. El lienzo mantiene cámara y arrastre transitorios; la fuente de verdad estructural es el dominio.

## 14. Pruebas, evidencia y límites

Antes de entregar cambios: `npm test`, `npm run typecheck` y `npm run build`.

La regresión del **19 de octubre** aprobó **176 pruebas deterministas en 29 archivos**. Cuatro casos optativos se omiten por defecto: tres de rendimiento y uno de Ollama real. Se ejecutaron por separado y pasaron; el ensayo de Ollama verifica un caso reducido, no certifica calidad conceptual ni la tienda completa.

Para repetir el ensayo local de forma explícita en PowerShell:

```powershell
$env:VISUAL_BD_QA_LOCAL='1'
node node_modules/vitest/vitest.mjs run tests/integracion/ollama-real.test.ts
Remove-Item Env:VISUAL_BD_QA_LOCAL
```

Requiere Ollama en el puerto y modelo indicados en el ensayo; efectúa una llamada real y escribe `ollama-revision-real.json` en `artefactos-locales/pruebas/<fecha-local>/`, ignorada por Git. Las pruebas normales de transporte/proveedores usan simulaciones. `npm run test:e2e` atraviesa renderer/preload/IPC y disco con proveedor controlado, sin modificar el perfil personal ni consumir cuota externa. Los diálogos nativos reciben rutas automatizadas; no se certifica su interacción manual mediante este arnés.

Consulta [el informe actualizado de pendientes](pruebas/2026-10-19/informe.md#estado) para reproducir el E2E y las métricas. Concurrencia, operaciones, errores, temas y encuadre tienen nueva cobertura. Los recorridos reales de revisión, decisión, guardado y reapertura pasaron con Mistral y Flash Lite. Siguen pendientes una modificación correcta de negocio generada y aprobada con cada proveedor, y la disponibilidad del modelo Gemini que respondió 503. Los [controles y pruebas de los puntos 7, 8, 9 y 11](pruebas/2026-10-19/informe.md#controles) cierran su alcance básico; certificación de lectores y sesiones de varias horas son ampliaciones. El intercambio externo y macOS/Linux quedaron excluidos de este ciclo.

No hay comparación histórica de propuestas aplicadas, ejecución SQL/DDL, generación ORM/NoSQL ni instaladores publicados. El icono de la app es el concepto C; sus recursos y procedencia están en [resources/README.md](../resources/README.md).


### Contrato actual de revisiones y pruebas reales

Las operaciones son objetos JSON con `op`; no se convierten cadenas de pseudocódigo en operaciones. Ollama recibe el esquema completo para revisión, contexto 8192 y temperatura 0,2. Ese contexto puede requerir más memoria. Gemini conserva `json_object` y recibe el contrato como instrucción; esto aumenta los tokens de entrada. Un experimento con el parámetro de esquema devolvió 500 y se retiró. Las revisiones no alteran automáticamente reglas ni configuración.

Para un recorrido real por interfaz, compila y configura explícitamente el proveedor de QA en PowerShell:

```powershell
npm run build
$env:VISUAL_BD_QA_PROVEEDOR='ollama'
$env:VISUAL_BD_QA_MODELO='mistral:latest'
node tests/e2e/ejecutar.cjs
Remove-Item Env:VISUAL_BD_QA_PROVEEDOR
Remove-Item Env:VISUAL_BD_QA_MODELO
```

Para Gemini, usa `VISUAL_BD_QA_PROVEEDOR='gemini'` y, opcionalmente, `VISUAL_BD_QA_MODELO='gemini-2.5-flash-lite'`. Sin override usa el modelo personal. El arnés real de Gemini lee el perfil Windows `Visual BD` y descifra su credencial solo en memoria, trabajando con un perfil aislado. No cambia la selección personal. Las llamadas reales pueden consumir cuota y dependen del servicio; no son pruebas deterministas.

El arnés real marca una aclaración o comprueba comparación/bloqueo por riesgos y rechaza una propuesta; nunca confirma automáticamente restricciones de negocio para pasar una prueba. La aprobación y deshacer/rehacer se verifican con propuestas conocidas del servidor controlado. Un resultado aprobado del arnés real no certifica una aprobación de cambios generados por el modelo.

`node tests/e2e/diagnostico-proveedores.cjs` compara el caso mínimo y la tienda de `tests/fixtures/tienda-prueba.md`. Requiere proveedores disponibles y puede consumir cuota. `QA_SOLO_SONDA=1` limita la ejecución a sondas Gemini; `QA_SOLO_LITE=1` prueba las dos revisiones de Flash Lite. Define y retira esas variables en el entorno del proceso igual que las anteriores; no guardan una preferencia de la aplicación. Las evidencias quedan ignoradas en `artefactos-locales/pruebas/diagnostico-<marca>/`.

Consulta el [índice documental](README.md), los [pendientes vigentes](pendientes.md) y las [correcciones con evidencia final](pruebas/2026-10-19/informe.md#correcciones). Los informes fechados conservan resultados históricos.
