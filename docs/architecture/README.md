# Diagramas Archify

Los diagramas fueron preparados antes de la migración. «Propuesto» identifica los nuevos componentes del plan; su implementación local no acredita despliegue en Cloudflare.

| Vista | Fuente | HTML independiente | Recibo determinista |
|---|---|---|---|
| General | [overview.json](overview.json) | [overview.html](overview.html) | [overview.delivery.json](overview.delivery.json) |
| Hooks | [hooks.json](hooks.json) | [hooks.html](hooks.html) | [hooks.delivery.json](hooks.delivery.json) |

Ambos: arquitectura, perfil **showcase**, 9/9 comprobaciones, cero errores y cero advertencias. Cada recibo incluye SHA-256 y tamaño de fuente y HTML. Las fuentes quedaron congeladas después de validar.

## Evidencia y correcciones

Se contrastó el diagrama histórico con `docs/contracts/hook-system.md`, `core/README.md`, `.codex/hooks/session-start.mjs` y `.codex/hooks/stop-orchestrator.mjs` del Prometheus local existente. No se modificaron esos archivos.

- SessionStart informa HEAD y cambios; no persiste el baseline histórico representado anteriormente.
- El baseline de cambios del turno corresponde al seguimiento de dependencias antes de la primera operación relevante, no a SessionStart.
- PreToolUse clasifica y aplica controles preventivos; no sustituye el sandbox.
- PostToolUse conserva evidencia con identidad de verificación: PASS, FAILED, UNKNOWN y BLOCKED. Un éxito de otra operación no elimina fallos pendientes.
- Stop reporta y agrega avisos; no ejecuta pruebas ni reintenta operaciones.
- SubagentStart orienta el alcance, sin otorgar permisos nuevos.

Los originales `prometheus-hooks.architecture.json` y `.html` permanecen sin cambios en el repositorio local de Prometheus, bajo `docs/architecture/`. Esta nueva versión no los sobrescribe.

## Evidencia visual separada

No se ejecutó `visual-check`: la política administrada de navegador bloqueó la revisión local en esta sesión. No existe recibo automatizado de navegador ni aprobación visual. No se usó otro transporte para eludir ese bloqueo.

La validación determinista no demuestra legibilidad, ajuste a la ventana ni funcionamiento de los controles. Queda pendiente revisar los HTML exactos en 1440×900, 1600×1000, 1920×1080 y 2048×1320, temas claro/oscuro, foco, búsqueda y exportación. Revisar también `scrollWidth <= innerWidth` y `scrollHeight <= innerHeight` en escritorio.

El contenido redactado está en español. Los controles fijos del visor y su atributo HTML de idioma conservan el respaldo inglés de Archify.
