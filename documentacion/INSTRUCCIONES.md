# Visual BD — Instrucciones de uso y desarrollo

Aplicación de escritorio para diseñar modelos de bases de datos relacionales de forma visual, con revisión por IA que **propone** cambios que tú apruebas o rechazas. No genera SQL ni DDL (por diseño).

---

## 1. Requisitos

- Node.js 20 o superior (probado con Node 24) y npm.
- Windows, macOS o Linux (desarrollo probado en Windows).
- Para la IA local: [Ollama](https://ollama.com) instalado y en ejecución.
- O bien una API compatible con OpenAI (clave `sk-…`).

---

## 2. Instalación

```bash
npm install
```

Si la binaria de Electron falla en descargarse:

```bash
node node_modules/electron/install.js
```

---

## 3. Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Arranca en desarrollo (ventana de Electron + HMR del renderer) |
| `npm run test` | Ejecuta las pruebas con Vitest (dominio e importadores) |
| `npm run typecheck` | Comprobación de tipos de main/preload y renderer |
| `npm run build` | Compila main, preload y renderer a `out/` |
| `npm start` | Vista previa de la compilación (`preview`) |
| `npm run pack` | Empaqueta la app sin instalador (`electron-builder --dir`) |
| `npm run dist` | Genera el instalador de distribución (`electron-builder`) |

Flujo recomendado antes de commitear: `npm run test && npm run typecheck && npm run build`.

---

## 4. Uso de la aplicación

### 4.1 Flujo general

1. **Crear o importar** un modelo:
   - *Nuevo* desde cero (botón o `Ctrl+N`).
   - *Importar draw.io* (`.drawio` / `.xml`), *imagen* de un diagrama o *Markdown*.
   - Al importar se abre el diálogo **Confirmar interpretación importada**: revisa entidades, conexiones, reglas y ambigüedades; resuelve cada ambigüedad con sus acciones (o déjala pendiente) y confirma.
2. **Editar en el lienzo** con las herramientas (ver §5).
3. **Validar** con *Validar local* (hallazgos estructurales y de normalización 1FN–BCNF).
4. **Pedir revisión IA** (`Ctrl+R` o menú *Revisar*): el modelo propone operaciones; cada propuesta se aprueba, rechaza o discute. Nada se aplica sin tu confirmación.
5. **Guardar** (`Ctrl+S`) en formato `.vbdproj`.

### 4.2 Revisión y propuestas

- Panel **Revisión**: ambigüedades de interpretación, hallazgos de validación, análisis de normalización y tarjetas de propuestas IA.
- En cada propuesta: **Aceptar** (aplicación atómica con deshacer), **Rechazar**, **Comparar** (vista antes/después en el lienzo con `Vista propuesta`) y **Discutir** (abre el chat con la propuesta como contexto).
- Si el diseño cambia tras emitirse una propuesta, queda marcada como desactualizada y no puede aplicarse.
- El chat (panel derecho) también puede proponer operaciones de forma conversacional.

### 4.3 Importaciones

- **draw.io**: lee `mxfile` comprimido (deflate) y sin comprimir; detecta entidades (cajas con varias líneas o clave PK), conexiones con cardinalidades (`1`, `0..1`, `n`, `1..n`…) y múltiples páginas. La lectura estructural es determinista: todo lo no reconocido queda visible, nunca se descarta en silencio.
- **Imagen**: requiere proveedor IA con visión (no disponible en modo Solo local). Devuelve un borrador que debes confirmar.
- **Markdown**: acepta secciones `## Entidad` con listas (`- id (PK)`) o tablas con columna PK/FK, más prosa tipo `Relación: Cliente 1..N Pedido` y `Regla: …`. También puede pasar por IA con *Interpretar prosa*.

### 4.4 Interpretabilidad de lo desconocido

El marcaje `desconocido` es explícito en todo el modelo: cardinalidades, tipos de datos y nulabilidad no inferidos se muestran con `?` o se resuelven como ambigüedades. Nunca se inventa información.

---

## 5. Herramientas y atajos del lienzo

Herramientas (barra izquierda):

| Herramienta | Uso |
|---|---|
| **Seleccionar** | Clic para seleccionar; arrastrar entidades para moverlas |
| **Entidad** | Clic en el lienzo para crear una entidad |
| **Relación** | Dos clics: origen y destino (clic sobre la misma entidad para cancelar) |
| **Nota** | Clic en el lienzo para crear una nota libre |

Lienzo: **rueda** para zoom, **clic izquierdo en vacío** para paneo, **clic central** también panea.

Atajos de teclado:

| Atajo | Acción |
|---|---|
| `Ctrl+N` | Proyecto nuevo |
| `Ctrl+O` | Abrir proyecto |
| `Ctrl+S` | Guardar |
| `Ctrl+Shift+S` | Guardar como |
| `Ctrl+Z` / `Ctrl+Y` | Deshacer / Rehacer |
| `Ctrl+R` | Solicitar revisión IA |
| `Supr` / `Delete` | Eliminar selección |
| `Esc` | Cancelar selección u origen de relación |

---

## 6. Configuración de IA

Menú *Modelo → Configuración de proveedor…* (o botón *Modelo / IA*):

- **Modo Solo local** (activado por defecto): no se realiza ninguna conexión remota; la revisión se basa únicamente en validación local determinista.
- **Ollama (local)**: URL por defecto `http://127.0.0.1:11434`; modelo ej. `qwen2.5vl` (visión) o `llama3.2`.
- **API compatible con OpenAI**: URL por defecto `https://api.openai.com/v1`; modelo ej. `gpt-4o-mini`; la clave API se guarda cifrada con `safeStorage` del sistema operativo (nunca en texto plano ni en el proyecto).
- Botón *Probar conexión* para verificar el proveedor y las capacidades (visión, chat, revisión).

La IA solo habla por los canales IPC `ia:*`: recibe el modelo normalizado y devuelve JSON con operaciones del catálogo cerrado; cualquier operación fuera de catálogo o repetida se filtra y se muestra como advertencia.

---

## 7. Archivos y recuperación

- **Proyecto**: extensión `.vbdproj` (JSON con `formatoVersion`). El guardado es atómico (archivo temporal + renombrado) y solo se cierra si la escritura tiene éxito.
- **Recuperación automática**: copia de seguridad en `<userData>/recuperacion` (se escribe con debounce ~3 s). Al arrancar con copia disponible se ofrece restaurarla (menú *Proyecto → Información de recuperación*).
- **Credenciales**: `<userData>/credenciales`; **ajustes IA**: `<userData>/ajustes`.
- Rutas de `userData` según plataforma: Windows `%APPDATA%/<nombre-app>`, macOS `~/Library/Application Support/<nombre-app>`, Linux `~/.config/<nombre-app>`.

---

## 8. Estructura del proyecto

```
src/
├── main/                  # Proceso principal de Electron
│   ├── index.ts           # Ventana, menú nativo, IPC
│   ├── persistencia.ts    # Guardado atómico, recuperación, .vbdproj
│   ├── almacen-credenciales.ts
│   ├── ia/                # adaptador, ollama, openai, coordinador (solo-local, reintentos, filtros)
│   └── importadores/      # draw.io (zlib) + clasificación determinista
├── preload/index.ts       # Puente seguro window.api (contextBridge)
├── shared/ai.ts           # Contratos IPC/IA compartidos
└── renderer/src/
    ├── domain/            # Núcleo: modelo, operaciones, historial, propuestas,
    │                      # aprobación, validación, normalización (+ pruebas)
    ├── importadores/      # borrador (drawio/imagen/MD → Proyecto), markdown
    ├── estado/tienda.tsx  # Store global React (orquestación completa)
    └── componentes/       # Cabecera, Herramientas, Lienzo (SVG), paneles, diálogos
```

Principios arquitectónicos (ver `plan-aplicacion-visual-bases-de-datos.md`):

- El modelo de dominio es la única fuente de verdad; el lienzo SVG no guarda estado.
- Catálogo **cerrado** de operaciones con `aplicar` + `invertir` (deshacer siempre posible).
- La IA propone; aprueba/rechaza solo el usuario. Aplicación atómica.
- Identificadores de dominio en español (`Entidad`, `Atributo`, `Operacion`…); UI en español.

---

## 9. Pruebas

```bash
npm run test
```

Cobertura actual (16 pruebas): operaciones con inversión, historial (deshacer/rehacer), servicio de aprobación (atómico, desactualización, rechazo), análisis de normalización (1FN/3FN, insuficiencia de datos) e importadores (draw.io comprimido/sin comprimir y Markdown listas/tablas).

---

## 10. Limitaciones conocidas

- No genera SQL ni DDL (alcance deliberado del MVP).
- La imagen original importada se muestra como referencia en la sesión pero no se persiste dentro del `.vbdproj`.
- El historial de deshacer/rehacer se conserva al reabrir el proyecto, pero no hay «viajar» a estados antiguos para editarlos.
- La interpretación de imágenes depende de un proveedor con visión; en modo Solo local ese flujo no está disponible.
