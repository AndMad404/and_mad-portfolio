# Instrucciones del portafolio

- Raíz del proyecto: esta carpeta. Prometheus se reutiliza desde `C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA`; `../prometeus` es otro proyecto.
- Para contexto ambiguo, usar $context-librarian y leer `context-index.md`. Para una responsabilidad conocida, ir directamente a su propietario.
- Usar $indexation-librarian al crear, mover o retirar documentos y rutas. Perfil compartido: `C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA/.codex/context-librarian/profile.json`.
- Antes de editar código, configuración o pruebas, usar $dependency-librarian con los archivos previstos y comunicar área, dependientes, pruebas, evidencia e incertidumbres. Lector: `node C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA/.codex/dependency-librarian/reader.mjs --file <ruta>`.
- Mantener Dependency conforme se consume `ROADMAP.md`: revisar solo el incremento activo; registrar relaciones demostradas y sus pruebas con $dependency-editor. No anticipar dependencias de funciones futuras ni duplicar imports en reglas.
- Al cerrar cada incremento: actualizar roadmap y evidencia en `docs/prometheus.md`, ejecutar `node .codex/maintain-prometheus.mjs`, comprobar impacto y ejecutar las pruebas seleccionadas y las verificaciones del producto que correspondan.
- Esta carpeta no tiene Git: usar archivos explícitos, no `--diff` ni `--base`. No interpretar la ausencia de Git como ausencia de impacto. El ciclo CLI `di init/update` requiere Git; usar el mantenimiento local documentado mientras tanto.
- `content/published.json` alimenta el sitio público; `content/labor-cases.json` y `content/services.json` son material inicial. `dist/` y `docs/legacy/` pertenecen al prototipo anterior. No desplegar `dist/`.
- Presentar casos por técnicas y contexto de negocio; conservar límites de evidencia y estados pendientes. No publicar documentos privados, credenciales ni métricas inventadas.
