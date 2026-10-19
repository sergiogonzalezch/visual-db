# Diagnóstico real de Gemini y Ollama

> Diagnóstico anterior a la corrección. El contrato, las pruebas posteriores y el estado de implementación están en [correcciones y pruebas finales](correcciones-contrato-y-pruebas.md). Las cifras siguientes conservan el resultado original.

Inspección del 19 de octubre de 2026. No se modificaron código de producción, modelo seleccionado, claves, proyectos personales ni reglas de negocio. Se añadió un ejecutor optativo de diagnóstico; no se hizo commit ni push.

## Método y límites

Peticiones HTTP reales desde Electron con perfil aislado, instrucciones `SISTEMA_REVISION` actuales, sin reintentos automáticos. Se comparó una entidad Cliente con dos atributos frente a la tienda sintética de cuatro entidades, quince atributos y cuatro reglas del ensayo anterior. Sin historial conversacional. Una muestra por combinación: los modelos son no deterministas.

Se usaron el normalizador y el validador de operaciones de producción. Aceptar el JSON exterior **no** equivale a aceptar operaciones ni a certificar la lógica propuesta. Las evaluaciones semánticas del ejecutor no sustituyen el rechazo previo de operaciones inválidas del coordinador.

La clave Gemini se descifró exclusivamente en memoria; solo se copió temporalmente el archivo de estado con la clave de sistema cifrada al perfil de QA, retirado al finalizar. No se guardaron cabeceras de autorización ni cuerpos de error arbitrarios. Las respuestas de modelos conservadas contienen únicamente el caso sintético y están en el directorio ignorado de artefactos.

## Resultados

| Proveedor / modelo | Caso | HTTP | Tiempo | Resultado útil para la aplicación |
| --- | --- | --- | --- | --- |
| Gemini, catálogo | Listado | 200 | 0,63 s | Credencial y consulta de catálogo operativas. |
| gemini-3.8-flash | Mínimo | 503 | 0,60 s | No generó revisión. |
| gemini-3.8-flash | Tienda | 503 | 0,57 s | No generó revisión. |
| gemini-3.8-flash | Sonda «Responde únicamente OK» | 503 | 0,91 s | Error `UNAVAILABLE`; mensaje clasificado como capacidad/saturación. |
| gemini-2.5-flash | Mínimo / sonda | 404 | 0,16 / 0,18 s | El proveedor informa que no está disponible para usuarios nuevos, aunque figura en el catálogo. |
| gemini-2.5-flash-lite | Sonda | 200 | 1,41 s | Respondió usando la misma credencial. |
| gemini-2.5-flash-lite | Mínimo | 200 | 2,22 s | JSON exterior válido, una operación inválida representada como cadena. |
| gemini-2.5-flash-lite | Tienda | 200 | 10,55 s | Seis propuestas: dieciocho operaciones, todas cadenas incompatibles; dos propuestas sin operaciones. El coordinador rechazaría la revisión completa. |
| mistral:latest | Mínimo | 200 | 19,90 s | Dos propuestas, trece operaciones incompatibles expresadas como cadenas. |
| mistral:latest | Tienda | 200 | 53,73 s | Devuelve un esquema de entidades, no el objeto de revisión con propuestas. |
| llama3.2:latest | Mínimo | 200 | 5,64 s | Dos operaciones incompatibles expresadas como cadenas. |
| llama3.2:latest | Tienda | 200 | 6,68 s | Propuesta con categoría `normalización` en lugar del enum `normalizacion`; operaciones como cadenas. |

## Causas identificadas

### 1. Gemini: disponibilidad del modelo, no pérdida de clave

El modelo guardado falla incluso con seis tokens de entrada aproximados y sin esquema. La respuesta `503 UNAVAILABLE` clasificada como saturación, junto con catálogo y Flash Lite operativos con la misma clave, señala disponibilidad/capacidad específica del modelo solicitado. El tamaño de la tienda no explica ese fallo inmediato. No se afirma cuánto durará ni qué infraestructura interna está saturada.

Que un modelo aparezca en el catálogo no garantiza permiso ni disponibilidad de generación. El 404 de Flash es un caso distinto del 503: restricción comunicada por el proveedor para usuarios nuevos.

### 2. Contrato del prompt ambiguo: afecta también a Gemini

El prompt enumera operaciones mediante pseudonotación como `updateAtributo{entidadId,id,parche{...}}`, pero no muestra un ejemplo JSON completo con el discriminante `op`. Los tres modelos que generaron revisiones copiaron esa notación en cadenas de texto. El contrato real exige objetos, por ejemplo:

```json
{"op":"updateEntidad","id":"id-existente","parche":{"descripcion":"Descripción confirmada"}}
```

Además, `format: "json"` y `response_format: {type: "json_object"}` aseguran formato JSON general, no conformidad con el catálogo de operaciones. Es un defecto de claridad del contrato enviado por la aplicación y una hipótesis fuerte sobre la causa de las cadenas; falta una comparación A/B con un contrato explícito para medir cuánto mejora cada modelo. No se deben convertir las cadenas a operaciones automáticamente.

### 3. Errores conceptuales independientes del formato

Llama propuso eliminar atributos no primarios para «normalizar» y eliminar una regla de negocio; Mistral afirmó un nivel «NT+» no sustentado. Flash Lite volvió a preguntar si el precio es histórico pese a la regla declarada y supuso que unicidad implica obligatoriedad. Corregir el JSON no vuelve fiables esas decisiones: mantener revisión humana, referencias verificadas y aprobación explícita.

### 4. Rendimiento local: sin timeout en esta muestra

`ollama ps` confirmó Mistral al **100 % GPU**, tamaño cargado 5 GB y contexto 4096, en equipo con RTX 3060 y Ryzen 5 5600G. No se observó una ejecución exclusivamente CPU de ese modelo.

| Modelo / caso | Carga | Evaluación entrada | Generación salida | Tokens salida |
| --- | --- | --- | --- | --- |
| Mistral mínimo | 4,93 s | 0,76 s | 14,19 s | 862 |
| Mistral tienda | 0,005 s | 1,02 s | 52,58 s | 3070 |
| Llama mínimo | 2,86 s | 0,34 s | 2,43 s | 261 |
| Llama tienda | 0,005 s | 0,81 s | 5,85 s | 559 |

En Mistral domina la generación extensa: aproximadamente 58–61 tokens/s. Esto explica su demora observada; no demuestra la causa del timeout histórico de Gemma, que no se repitió en esta inspección. El contexto 4096 puede ser restrictivo para conversaciones mayores; no se confirmó truncamiento en estos casos y no debe afirmarse como causa comprobada.

## Próximas correcciones recomendadas

1. Sustituir pseudonotación por contrato JSON explícito con `op`, tipos, enums y ejemplos; comparar A/B mínimo/tienda sin cambiar reglas.
2. Evaluar esquema estructurado completo cuando el proveedor lo admita, manteniendo validación local estricta y rechazo atómico.
3. Diferenciar catálogo disponible de generación verificada, y mostrar mensajes específicos para saturación y modelos no habilitados. Probar Flash Lite como alternativa sin cambiar automáticamente la elección guardada.
4. Pedir respuestas acotadas y preguntas sin operaciones cuando falte evidencia. Medir impacto antes de aumentar timeout/contexto o fragmentar la revisión.
5. Completar después el recorrido UI: revisión válida → comparación → aprobación humana → guardar → reabrir. Ambos pendientes siguen abiertos: ninguna muestra de esta inspección certifica ese recorrido.

## Reproducción y evidencia local

`node tests/e2e/diagnostico-proveedores.cjs` requiere Ollama activo y perfil personal configurado. El ejecutor actualizado genera la tienda desde `tests/fixtures/tienda-prueba.md`; la primera ejecución documentada aquí utilizó un artefacto sintético previo. Es optativo, usa red real y puede consumir cuota. `QA_SOLO_SONDA=1` limita a tres sondas Gemini; `QA_SOLO_LITE=1` prueba las dos revisiones de Flash Lite sin modificar la selección personal. El script utiliza esbuild ya presente, sin nuevas dependencias.

Directorios ignorados bajo `artefactos-locales/pruebas/`:

- `diagnostico-1792425544428`: matriz inicial Gemini/Mistral/Llama.
- `diagnostico-1792425614907`: sondas mínimas y clasificación segura de errores.
- `diagnostico-1792425637601`: revisiones mínimo/tienda con Flash Lite.

Verificación del ejecutor: `node --check tests/e2e/diagnostico-proveedores.cjs`. Ejecuciones reales terminadas correctamente. No se repitió toda la regresión porque no hubo cambios de producción.
