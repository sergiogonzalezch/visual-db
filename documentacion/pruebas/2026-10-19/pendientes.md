# Pendientes y mejoras por prioridad

Actualizado el **19 de octubre de 2026**, después de corregir el contrato JSON y probar proveedores reales. Los números históricos 5 y 6 continúan abiertos por el criterio de aprobación correcta, no porque las revisiones completas ya no respondan.

| Prioridad | Tipo | Trabajo pendiente | Criterio de cierre |
| --- | --- | --- | --- |
| Alta | Calidad / corrección | Reducir recomendaciones sin evidencia, restricciones inferidas y errores de normalización. | Evaluar casos conocidos y exigir correspondencia entre reglas, IDs, explicación y operaciones; conservar rechazo atómico y confirmación humana. |
| Alta | Verificación funcional — punto 5 | Aprobar una modificación correcta generada por Gemini. | Revisión real → evaluación de evidencia → comparación → aprobación → guardado → reapertura con cambios e historial correctos. Flash Lite ya pasó revisión, rechazo y persistencia. |
| Alta | Verificación funcional — punto 6 | Aprobar una modificación correcta generada por Ollama. | Mismo recorrido anterior con modelo local. Mistral ya pasó revisión, aclaración marcada y persistencia; eso no aplica cambios de negocio. |
| Media | Mejora de experiencia | Distinguir visualmente conexión al catálogo y generación comprobada. | Estado de verificación asociado al proveedor/modelo y configuración exactos, sin considerar un catálogo accesible como prueba de generación. El texto actual ya explica esa diferencia. |
| Media | Calidad / pruebas | Ampliar la matriz reproducible de evaluación semántica. | Casos con precios históricos, unicidad frente a obligatoriedad, claves compuestas y referencias inexistentes; expectativas explícitas y mediciones por modelo. Ya hay catorce pruebas de controles semánticos, no un benchmark amplio de calidad de modelos. |
| Media | Rendimiento / investigación | Medir revisiones locales en varios modelos y tamaños. | Registrar contexto, tokens, carga y generación; verificar presión de memoria con contexto 8192. Aún no se confirmó la causa del timeout histórico de Gemma. |
| Media | Funcionalidad nueva | Cancelar la petición real al proveedor. | Propagar cancelación desde UI hasta la petición y comprobar liberación local. No prometer que el servidor o su facturación se detienen sin confirmación del proveedor. Actualmente se descarta la incorporación de la respuesta. |
| Baja | Accesibilidad | Evaluación manual con lector de pantalla y sesiones prolongadas. | Completar recorridos con lector activo y registrar barreras; la cobertura automatizada básica no equivale a certificación WCAG. |
| Baja | Funcionalidad nueva | Comparación histórica de propuestas aplicadas. | Reconstrucción fiable del antes/después sin alterar el modelo actual ni forzar huellas de propuestas antiguas. |

## Pospuestos por petición del usuario

| Referencia | Alcance | Situación |
| --- | --- | --- |
| Punto 10 | Intercambio externo draw.io y Mermaid | Exportadores disponibles; validación con herramientas externas fuera del ciclo autorizado. |
| Punto 12 | macOS y Linux | Compatibilidad completa pendiente de prueba en esos sistemas. |
| Distribución | Ejecutador sencillo e instaladores | Empaquetado e iconos configurados; no hay instaladores publicados ni lanzamiento simplificado validado. |

## Lo que ya está cubierto

Concurrencia y aislamiento por proyecto; historial inverso y referencias FK; validación de operaciones; errores recuperables; controles semánticos y procedencia de IA; accesibilidad básica claro/oscuro; posición de herramientas tras reinicios y escalas 125 %/150 %; referencia de rendimiento con 500 entidades, 6000 atributos y 499 relaciones.

El contrato de IA usa objetos JSON con `op`. Ollama recibe esquema estructurado y contexto 8192; Gemini mantiene `json_object` con contrato completo como instrucción. Los mensajes 503 y modelos no habilitados están diferenciados. La aplicación no convierte en verdaderas las conclusiones del modelo.

Para evidencia y límites: [estado de los doce puntos](informe.md#estado), [correcciones y pruebas finales](informe.md#correcciones), [cierre de controles/UI/rendimiento](informe.md#controles).
