# Foco — implementación de interfaz

> Referencia de diseño/evolución. Estado al 19 de octubre: [índice documental](README.md), [pendientes priorizados](pendientes.md) y [pruebas finales](pruebas/2026-10-19/correcciones-contrato-y-pruebas.md). Los resultados fechados de este documento conservan su contexto.

## Decisión aprobada

Dirección Foco y una única entrada «Revisar» que ofrece «Revisar reglas» y «Revisar con IA». La primera conserva el analizador determinista de estructura y normalización; la segunda conserva la llamada al proveedor y las propuestas con aprobación explícita.

## Cambios de presentación

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

## Archivos de esta etapa

- `src/renderer/src/tokens.css`, `estilos.css`, `App.tsx`.
- Componentes nuevos: `MenuAcciones.tsx`, `Pestanas.tsx`, `DialogoBase.tsx`.
- Componentes ajustados: Cabecera, Herramientas, PanelDerecho, PanelRevision, PanelPropiedades, PanelChat, PanelConsumo, DialogoHistorial, DialogoImportacion y DialogoRecuperacion.
- `src/renderer/src/presentacion/errores.ts`: formato del error visible.
- `src/renderer/src/estado/tienda.tsx`: selección de sección de revisión y suscripción al menú nativo. Es estado de presentación; no se persiste ni cambia los análisis.
- `src/main/index.ts`: etiquetas y acción del menú nativo para invocar la revisión de reglas existente.

No se modificaron los adaptadores, las credenciales, la persistencia, los validadores de dominio ni las dependencias en esta etapa. Los cambios anteriores del repositorio se conservan.

## Verificación

- Comprobación de tipos y compilación de producción correctas.
- Suite existente: 49 pruebas aprobadas.
- Inspección real en Electron con datos aislados: tema oscuro a tamaño de escritorio y claro a 1040×800.
- Menú Revisar con las dos acciones; ejecución de Revisar reglas sin proveedor.
- Selección con flechas y Enter de Revisar con IA, con error local esperado al bloquear conexiones: feedback visible en Propuestas.
- Normalización 2×2 sin desborde horizontal.
- Historial nativo: estado vacío, cierre por Escape y vuelta al editor.
- Retirados el script y el directorio de datos usados para la prueba.

## Qué conviene probar con un proyecto real

1. Abrir un proyecto, editar atributos y claves, crear relaciones y comprobar que las herramientas se comportan igual.
2. Revisar → Revisar reglas; revisar hallazgos y normalización. Convertir un hallazgo en propuesta y navegar a Propuestas.
3. Revisar → Revisar con IA usando el proveedor ya configurado; verificar resultado, comparar Actual/Propuesto, aceptar/rechazar y deshacer.
4. Probar teclado en menús, pestañas y diálogos; cambiar de tema del sistema.
5. Importar draw.io, imagen y Markdown; confirmar o descartar desde sus acciones explícitas.
6. Revisar chat, consumo, historial y recuperación con datos largos. No se hicieron generaciones remotas en la verificación visual.
