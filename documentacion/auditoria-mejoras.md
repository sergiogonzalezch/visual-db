# Auditoría: proveedores, persistencia e interfaz

> Referencia de diseño/evolución. Estado al 19 de octubre: [índice documental](README.md), [pendientes priorizados](pendientes.md) y [pruebas finales](pruebas/2026-10-19/correcciones-contrato-y-pruebas.md). Los resultados fechados de este documento conservan su contexto.

## Actualización del 18 de octubre de 2026: interfaz Foco y chat por proyecto

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

## Hallazgos y causa raíz

1. La credencial estaba cifrada por proveedor, pero el formulario marcaba la clave como ausente al cambiar de proveedor. URL y modelo solo existían para el proveedor activo. Conectar además borraba el modelo y vaciaba el campo de clave; faltaba distinguir campo vacío de clave guardada.
2. No había restauración y verificación automática de conexiones. Los errores HTTP podían confundirse con una pérdida de credencial.
3. El checkbox heredaba una altura mínima global de 32px. El diálogo anterior tenía reglas de scroll superpuestas, espaciados inconsistentes y texto con codificación dañada.
4. Las relaciones usaban coordenadas persistidas mientras las entidades usaban coordenadas temporales durante el arrastre.
5. Había normalización JSON duplicada y una advertencia CJS en Vitest.

## Cambios

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

## Archivos de esta etapa

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

## Verificación

Suite automatizada, comprobación de tipos y build de producción. Inspección real en Electron con directorio de datos aislado: diálogo oscuro completo, etiquetas accesibles, checkbox normal y reconexión automática a Ollama con cinco modelos. Instancia de prueba y datos temporales retirados.

No se revelaron claves reales ni se hicieron generaciones remotas durante esta etapa. La paleta clara y los tamaños pequeños se ajustaron en CSS, pero requieren revisión visual adicional. Las pruebas de autenticación de servicios remotos son simuladas.

## Qué probar

1. Conectar Gemini, elegir modelo, cerrar/abrir diálogo y reiniciar la app: verificar la clave guardada y el modelo restaurado.
2. Configurar otro proveedor y alternar entre ambos: comprobar URL, modelo y credencial independientes.
3. Reemplazar/revelar/ocultar/borrar una clave: comprobar que las otras cuentas se conservan.
4. Probar una clave inválida, URL incorrecta, servidor inaccesible y respuesta 429: verificar el mensaje y la posibilidad de volver a intentar.
5. Buscar modelos, buscar un nombre inexistente y seleccionar un resultado.
6. Revisar modo claro/oscuro, ventana pequeña, Tab/Shift+Tab/Escape y arrastre de entidades relacionadas.

Los archivos heredados de credenciales sin cifrar se leen para compatibilidad y se cifran en la siguiente modificación de credenciales. Un catálogo disponible no garantiza permisos de generación para cada modelo; los servidores personalizados deben exponer /models.

## Diagnóstico confirmado del 404 de Gemini

La configuración usa gemini-2.5-flash y la URL compatible documentada. Consultas reales de metadatos devolvieron HTTP 200 tanto en el catálogo como al consultar el modelo (API nativa y compatible). Una generación mínima, sin datos del proyecto, devolvió HTTP 404 / NOT_FOUND: el modelo ya no está disponible para nuevos usuarios. El servicio recomendó gemini-3.8-flash.

Esto confirma que la credencial y el acceso al catálogo funcionan, pero no que la cuenta tenga permiso de generación para ese modelo. La normalización de models/ por sí sola no resolvía esta restricción. No se cambió el modelo del usuario automáticamente.

El transporte ahora clasifica esa restricción en errores estructurados de objeto o arreglo, sin mostrar cuerpos arbitrarios. El selector explica que el catálogo no garantiza permisos de generación. Se añadieron dos pruebas de regresión; 49 pruebas pasan, además de tipos y compilación.
