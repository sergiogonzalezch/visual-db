# Visual BD

Aplicación de escritorio para diseñar modelos de bases de datos relacionales de forma visual, con revisión por IA que **propone** cambios que tú apruebas o rechazas.

No genera SQL ni DDL: trabaja sobre el modelo (entidades, atributos, claves, relaciones y reglas) como única fuente de verdad.

## Guías

- **[Índice de documentación](documentacion/README.md)** y **[pendientes por prioridad](documentacion/pruebas/2026-10-19/pendientes.md)**: estado vigente, mejoras y criterios de cierre.

- **[Guía visual paso a paso](documentacion/guia/index.html)**: recorrido ilustrado de proyecto → modelo → reglas → proveedor → IA → aprobación → exportación, con animaciones opcionales y un mapa de funciones filtrable.
- **[Referencia técnica](documentacion/guia/tecnica.html)**: arquitectura, funciones, contratos IPC, archivos, estados y límites.
- **[Instrucciones de uso y desarrollo](documentacion/INSTRUCCIONES.md)**: procedimientos, atajos y resolución de problemas.

Las páginas son estáticas: abre `documentacion/guia/index.html` en tu navegador. Funcionan sin instalar dependencias, sin conexión y sin acceder a la aplicación ni a sus credenciales. También puedes servir `documentacion/` con un servidor HTTP local.

## Características

- **Lienzo visual**: crear entidades, relaciones y notas; mover, hacer zoom y panear; edición de atributos, tipos, claves (PK/UK/FK), cardinalidades y notas de negocio.
- **Revisión asistida por IA**: propuestas estructuradas con explicación, supuestos y resultado; se aplican de forma atómica solo tras tu aprobación. Comparación antes/después por campos y en el lienzo, inspector propuesto de solo lectura, rechazo y discusión por chat. Las aclaraciones sin operaciones se marcan como revisadas sin modificar el diseño.
- **Validación local determinista**: hallazgos de integridad y análisis de normalización 1FN–BCNF con preguntas explícitas cuando falta información.
- **Importación**: draw.io (comprimido y plano), imágenes de diagramas (mediante proveedor con visión) y Markdown (listas y tablas). draw.io y Markdown tienen lectura estructural determinista; imágenes y prosa asistida dependen de IA. La interpretación pasa por un borrador que debes revisar.
- **Modo Solo local** por defecto: ninguna conexión remota sin que actives un proveedor. Ollama local o cualquier API compatible con OpenAI: OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), OpenRouter o un endpoint personalizado; las claves se guardan cifradas con `safeStorage` del sistema operativo.
- **Panel de consumo**: registro local de peticiones y tokens por día, proveedor y modelo; límite diario opcional con barra de progreso (las API gratuitas suelen tener cupo diario).
- **Chat por proyecto**: la conversación se guarda dentro del `.vbdproj` y se restaura al abrirlo. Crear un proyecto limpia el chat y su borrador; las respuestas pendientes del proyecto anterior se descartan.
- **Persistencia segura**: guardado atómico en `.vbdproj`, historial de deshacer/rehacer y recuperación automática ante un cierre inesperado, incluyendo la conversación.
- **Interfaz Foco**: herramientas verticales flotantes y arrastrables, cápsula centrada Actual/Propuesto e inspector deslizable sobre el lienzo. Icono y favicon del concepto C: base de datos conectada a una tabla.
- **Exportación**: Archivo → Exportar genera Markdown, JSON, SVG, PNG, Mermaid ER y draw.io editable. Admite diseño completo, selección parcial y propuesta en comparación sin aplicarla; no incluye chat ni credenciales ni consulta IA.

## Inicio rápido

Pulsa el lápiz junto al nombre para editarlo; confirma con ✓, Enter o al salir del campo para volver a bloquearlo. Se conserva al guardar, reabrir y exportar; no se permite guardar un nombre vacío. «Ajustar al contenido», en la barra arrastrable, encuadra el modelo sin mover sus elementos. `Ctrl+R` revisa con IA; la recarga de desarrollo usa `Ctrl+Shift+R`.

En Markdown se admiten relaciones como `Relación: Pedido -> (1, 1..n) LineaPedido`. Las marcas PK de una entidad forman una única clave primaria compuesta. Los nombres de extremos deben coincidir exactamente; los no resueltos se señalan como ambigüedades.

```bash
npm install
npm run dev
```

Requisitos: Node 20+ (probado con Node 24). Para IA local, [Ollama](https://ollama.com) en ejecución.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo (ventana Electron + HMR) |
| `npm run test` | Pruebas (Vitest) |
| `npm run test:e2e` | Compilar y probar Electron con perfil aislado y proveedor controlado |
| `npm run typecheck` | Comprobación de tipos |
| `npm run build` | Compilar a `out/` |
| `npm start` | Abrir la vista previa de Electron |
| `npm run pack` | Empaquetar sin instalador |
| `npm run dist` | Generar instalador |

## Uso básico

1. Crea un proyecto nuevo o importa un archivo (draw.io, imagen o Markdown) y confirma su interpretación resolviendo las ambigüedades.
2. Edita en el lienzo con las herramientas flotantes. Abre el inspector desde la pestaña del borde derecho.
3. Abre **Revisar** y elige **Revisar reglas** para el análisis local o **Revisar con IA** (`Ctrl+R`) para solicitar propuestas.
4. En Revisión → Propuestas, consulta cambios, supuestos y preguntas. Compara con Actual/Propuesto; acepta cambios válidos, rechaza o discute. Marcar una aclaración como revisada no confirma sus supuestos.
5. Guarda con `Ctrl+S` y usa Archivo → Exportar para compartir un reporte o diagrama. La exportación no sustituye el archivo editable `.vbdproj`.

Atajos: `Ctrl+Z`/`Ctrl+Y` deshacer/rehacer · `Ctrl+S` guardar · `Ctrl+Shift+S` guardar como · `Supr` eliminar · `Esc` cancelar.

Al compartir un `.vbdproj`, compartes también sus mensajes de chat. Las credenciales de proveedores se almacenan por separado y no se incluyen en el proyecto.

El ejecutador simplificado y los instaladores por sistema siguen pendientes. Los comandos de empaquetado existen, pero esta etapa solo configura sus iconos; no publica instaladores.

## Verificación y límites

La regresión del 19 de octubre aprobó 176 pruebas deterministas, tipado y compilación. Se añadieron pruebas de Electron con perfil aislado (`npm run test:e2e`), casos optativos de rendimiento y una nueva prueba real reducida de Ollama. Los [controles semánticos, accesibilidad básica, reinicios y carga de modelos grandes](documentacion/pruebas/2026-10-19/informe.md#controles) tienen nueva cobertura. Se corrigió el contrato de revisiones y se comprobaron recorridos reales con Mistral y Gemini Flash Lite: revisión, decisión, guardado y reapertura. La aprobación de cambios de negocio generados por IA sigue sin certificar; consulta las [correcciones y pruebas](documentacion/pruebas/2026-10-19/informe.md#correcciones). Consulta [el informe y estado de pendientes](documentacion/pruebas/2026-10-19/informe.md#estado); estos resultados no garantizan disponibilidad ni calidad semántica de los modelos.

No se generan SQL, DDL, modelos ORM ni esquemas NoSQL ejecutables. Markdown/JSON sirven como documentación de entrada para otra herramienta o agente. La comparación histórica de propuestas aplicadas no está disponible. macOS/Linux, accesibilidad completa e intercambio en herramientas externas requieren completar sus comprobaciones.

## Stack

Electron · TypeScript · React 18 · Vite (electron-vite) · Vitest · electron-builder

## Estructura

```
src/
├── main/        # Proceso principal: ventana, menú, IPC, persistencia, IA, importadores
├── preload/     # Puente seguro window.api (contextBridge)
├── shared/      # Contratos IPC/IA compartidos
└── renderer/    # React: dominio, store, importadores y componentes de UI
documentacion/guia/ # Sitio estático de guía y referencia técnica
tests/integracion/  # Recorridos de dominio/disco y ensayo local optativo
```

## Documentación

Consulta el [índice documental](documentacion/README.md) para el manual, guía visual, referencia técnica y exportación; los [informes por fecha](documentacion/pruebas/README.md) reúnen las auditorías y correcciones. Las planificaciones están en [plans](documentacion/plans/README.md), y los [pendientes](documentacion/pruebas/2026-10-19/pendientes.md) son la única lista operativa vigente.

## Organización de evidencias

Los informes Markdown se versionan en `documentacion/pruebas/<fecha>/informe.md` y los planes en `documentacion/plans/<fecha>/`; las entradas sintéticas están en `tests/fixtures/`. Proyectos de QA, JSON de proveedores, exportaciones, capturas y logs se guardan en `artefactos-locales/pruebas/<fecha>/`, ignorada por Git. Los iconos y recursos necesarios para la app/guía sí se incluyen. Consulta [la política de archivos de pruebas](documentacion/pruebas/README.md).

## Licencia

MIT
