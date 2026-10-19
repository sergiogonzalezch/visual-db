# Correcciones del contrato de revisión y pruebas

## Cambios implementados

- Contrato JSON explícito: objetos con discriminante `op`, ejemplos ejecutables del catálogo y enums exactos. Se eliminó la pseudonotación que los modelos copiaban como cadenas.
- Esquema JSON para las 23 operaciones y la respuesta completa, con un máximo de tres propuestas en el esquema. Se solicita concisión y preguntas sin operaciones cuando falta evidencia, preservando unicidad frente a obligatoriedad y precios históricos.
- Ollama recibe el esquema en `format` para revisiones; contexto 8192 y temperatura 0,2. Chat e importación conservan sus formatos. Mayor contexto puede consumir más memoria local; no supone compatibilidad certificada con todos los modelos/equipos.
- Gemini conserva `json_object` y recibe el contrato completo en la instrucción de sistema. Un ensayo con `response_format: json_schema` devolvió HTTP 500 en ambos casos; **esa modificación se retiró**. Incluir el esquema en la instrucción aumenta el contexto y su posible coste; se contabiliza también en la estimación de consumo cuando el proveedor no aporta uso real.
- HTTP 503 explica indisponibilidad/saturación del modelo, catálogo accesible y alternativas. No solicita cambiar la clave por ese error. No se añadió repetición automática de POST ni sustitución automática del modelo.
- Conexión al catálogo deja explícito que la disponibilidad de generación aún no se ha comprobado.
- El ejecutor diagnóstico ahora genera la tienda desde el fixture versionado, sin depender de un artefacto de una ejecución anterior.

Se mantienen rechazo íntegro de respuestas con operaciones incompatibles, bloqueo por referencias inválidas, advertencias semánticas y confirmación del usuario. No se convierten cadenas en operaciones ni se relajan tipos para admitir respuestas incorrectas. No se cambió lógica de negocio, persistencia personal, stack ni dependencias.

## Pruebas automatizadas

- `npm run typecheck`: correcto.
- `npm test`: **176 aprobadas**, cuatro optativas omitidas; 29 archivos aprobados.
- `npm run build`: correcto.
- Regresión Electron con proveedor controlado: **15 grupos aprobados y dos relanzamientos aprobados**. Comparación, aprobación, deshacer/rehacer, guardado, reapertura, concurrencia, nueve errores simulados, accesibilidad claro/oscuro y carga de 500 entidades. Los procesos nuevos comprueban escalas 125 %/150 %.
- Pruebas añadidas: ejemplos del prompt válidos; envío del esquema y parámetros de contexto; 503 seguro tanto en cuerpo objeto como array. Se reforzó el ensayo Gemini para conservar `json_object` y enviar el contrato como instrucción.

Los errores impresos por Electron durante la regresión controlada son provocados deliberadamente. Su presencia no implica fallo del ensayo: se verifican recuperación y mensajes de la interfaz.

## Comparaciones reales

| Caso | Antes | Después observado |
| --- | --- | --- |
| Mistral mínimo | Trece operaciones como cadenas incompatibles | Objetos válidos y aclaraciones sin operaciones; algunas respuestas aún sugieren reglas redundantes. |
| Mistral tienda | Sin lista de propuestas, o referencias incorrectas con contexto menor | Con contexto 8192: entrada de 5133 tokens, revisión de 14,9 s y tres aclaraciones sin operaciones. La calidad varía entre ejecuciones. |
| Llama tienda | Propuesta incompleta, categoría con acento y cadenas | Revisión estructurada con operaciones del catálogo; aún puede inventar referencias y conceptos, que deben verificarse. |
| Gemini Flash Lite mínimo | Operación como cadena | Operación objeto válida, con advertencias sobre supuestos. |
| Gemini Flash Lite tienda | Dieciocho operaciones como cadenas | Último diagnóstico: catorce operaciones válidas, sin bloqueos de referencias; todas las propuestas con cambios requerían revisar sus supuestos. |
| Gemini 3.8 Flash | 503 | Sigue respondiendo 503; la aplicación ahora explica el error. No se cambió el modelo personal. |

El esquema corrige estructura, no garantiza veracidad ni buena normalización. No se presenta esta muestra como un benchmark estadístico: las respuestas no son deterministas. Tampoco se confirmó la causa del timeout histórico de Gemma.

## Recorridos reales por interfaz

**Ollama / Mistral:** importación de la tienda, conexión, selección, revisión, marcado de una aclaración sin operaciones, guardado y reapertura aprobados. La aclaración quedó `aceptada`; las otras propuestas permanecieron pendientes. No se aprobó automáticamente una modificación de negocio.

**Gemini / Flash Lite:** primer intento por interfaz devolvió 503 y mostró el nuevo mensaje con reintento/configuración. En el segundo intento: revisión completa, comparación, bloqueo de aprobación por riesgos pendientes, rechazo de una propuesta, guardado y reapertura aprobados. La propuesta rechazada contenía quince operaciones; el rechazo persistió. No se simula que confirmar riesgos sea equivalente a validar la propuesta.

Se corrigió el automatizador real, que antes intentaba pulsar `Aceptar cambios` aunque el botón estuviera deshabilitado por la revisión semántica. Ahora marca aclaraciones o verifica el bloqueo y rechaza la propuesta con cambios; no marca automáticamente la casilla de confirmación. La aprobación y su historial se comprueban con propuestas conocidas del proveedor controlado.

## Evidencia ignorada por Git

- `artefactos-locales/pruebas/diagnostico-1792426174759`: matriz con esquema local/contexto ampliado; Mistral tienda 14,9 s.
- `artefactos-locales/pruebas/diagnostico-1792426262092`: Flash Lite con contrato completo como instrucción, catorce operaciones válidas en tienda.
- `artefactos-locales/pruebas/diagnostico-1792426137207`: experimento de parámetro `json_schema` rechazado con 500; no quedó en producción.
- `artefactos-locales/pruebas/electron-1792426343439`: recorrido real Mistral aprobado.
- `artefactos-locales/pruebas/electron-1792426381196`: recorrido real Flash Lite aprobado.
- `artefactos-locales/pruebas/electron-1792426355940`: primer intento Flash Lite con 503.
- `artefactos-locales/pruebas/electron-1792426379519`: regresión controlada completa sobre el build final, quince grupos y dos relanzamientos aprobados.

## Archivos de esta corrección

- `src/main/ia/contrato-revision.ts` y `.test.ts`: contrato, esquema, ejemplos y pruebas.
- `src/main/ia/adaptador.ts`: instrucciones de revisión explícitas.
- `src/main/ia/ollama.ts`: esquema y contexto para revisión.
- `src/main/ia/openai.ts` y `.test.ts`: claridad del catálogo y contrato Gemini sin cambiar el formato compatible.
- `src/main/ia/http.ts` y `.test.ts`: mensaje seguro de 503.
- `tests/e2e/diagnostico-proveedores.cjs`: matriz real reproducible.
- `tests/e2e/electron.cjs`: modelo alternativo solo en perfil de QA y decisión sin aprobación automática de riesgos.
- README, instrucciones, guía técnica e informe de pendientes: resultados y límites actualizados.

La API local admite esquemas en `format`, según [documentación oficial de Ollama](https://github.com/ollama/ollama/blob/main/docs/capabilities/structured-outputs.mdx). La validación local se mantiene independientemente de la garantía del proveedor.

## Qué sigue pendiente

Los puntos 5 y 6 tienen ahora recorrido real de revisión y persistencia comprobado. Sigue pendiente demostrar **una modificación correcta de negocio generada por cada proveedor**, revisada y aprobada, guardada y reabierta. No debe cerrarse ese criterio aprobando ciegamente para pasar la prueba. La disponibilidad del modelo Gemini guardado depende del servicio.

No se hizo commit ni push.
