# Entradas reproducibles

`tienda-prueba.md` es el caso sintético usado en las auditorías manuales: se conserva como entrada editable, sin datos reales de negocio.

Esta carpeta contiene fuentes de pruebas que se versionan. Guarda las salidas de ejecución —proyectos, exportaciones, respuestas de proveedores, capturas y logs— en `artefactos-locales/pruebas/<fecha>/`, fuera del contenido del commit.

La tienda también se usa en los recorridos Electron y el diagnóstico real de proveedores. Es un modelo relacional de cuatro entidades y quince atributos; sus reglas incluyen preservar el precio histórico de cada línea. Los resultados del proveedor no son expectativas correctas por definición: revisa sus supuestos y operaciones. Procedimientos en [instrucciones](../../documentacion/INSTRUCCIONES.md) e [informe final](../../documentacion/pruebas/2026-10-19/correcciones-contrato-y-pruebas.md).
