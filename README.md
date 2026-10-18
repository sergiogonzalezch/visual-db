# Visual BD

Aplicación de escritorio para diseñar modelos de bases de datos relacionales de forma visual, con revisión por IA que **propone** cambios que tú apruebas o rechazas.

No genera SQL ni DDL: trabaja sobre el modelo (entidades, atributos, claves, relaciones y reglas) como única fuente de verdad.

## Características

- **Lienzo visual**: crear entidades, relaciones y notas; mover, hacer zoom y panear; edición de atributos, tipos, claves (PK/UK/FK), cardinalidades y notas de negocio.
- **Revisión asistida por IA**: propuestas estructuradas con explicación, supuestos y resultado; se aplican de forma atómica solo tras tu aprobación. Comparación antes/después en el lienzo, rechazo y discusión por chat.
- **Validación local determinista**: hallazgos de integridad y análisis de normalización 1FN–BCNF con preguntas explícitas cuando falta información.
- **Importación**: draw.io (comprimido y plano), imágenes de diagramas (mediante proveedor con visión) y Markdown (listas y tablas). Toda la lectura es determinista: nada no reconocido se descarta en silencio.
- **Modo Solo local** por defecto: ninguna conexión remota sin que actives un proveedor. Ollama local o cualquier API compatible con OpenAI: OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), OpenRouter o un endpoint personalizado; las claves se guardan cifradas con `safeStorage` del sistema operativo.
- **Panel de consumo**: registro local de peticiones y tokens por día, proveedor y modelo; límite diario opcional con barra de progreso (las API gratuitas suelen tener cupo diario).
- **Persistencia segura**: guardado atómico en `.vbdproj`, historial de deshacer/rehacer y recuperación automática ante un cierre inesperado.

## Inicio rápido

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
| `npm run typecheck` | Comprobación de tipos |
| `npm run build` | Compilar a `out/` |
| `npm run pack` | Empaquetar sin instalador |
| `npm run dist` | Generar instalador |

## Uso básico

1. Crea un proyecto nuevo o importa un archivo (draw.io, imagen o Markdown) y confirma su interpretación resolviendo las ambigüedades.
2. Edita en el lienzo con las herramientas de la barra izquierda.
3. Pulsa **Validar local** y, si quieres, **Revisar** (`Ctrl+R`) para obtener propuestas de la IA en el panel Revisión.
4. Acepta, rechaza o discute cada propuesta; guarda con `Ctrl+S`.

Atajos: `Ctrl+Z`/`Ctrl+Y` deshacer/rehacer · `Ctrl+S` guardar · `Supr` eliminar · `Esc` cancelar.

## Stack

Electron · TypeScript · React 18 · Vite (electron-vite) · Vitest · electron-builder

## Estructura

```
src/
├── main/        # Proceso principal: ventana, menú, IPC, persistencia, IA, importadores
├── preload/     # Puente seguro window.api (contextBridge)
├── shared/      # Contratos IPC/IA compartidos
└── renderer/    # React: dominio, store, importadores y componentes de UI
```

## Documentación

- [Instrucciones completas](documentacion/INSTRUCCIONES.md) — uso, atajos, configuración de IA, archivos y recuperación.
- [Plan de la aplicación](documentacion/plan-aplicacion-visual-bases-de-datos.md) — alcance, principios y arquitectura.

## Licencia

MIT
