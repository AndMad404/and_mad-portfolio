# Verificación del incremento

## Actualización de diseño — 14 de noviembre de 2026

Adaptación posterior: CSS mobile first con mejoras por `min-width`, escala fluida de texto/ilustraciones, contenedor público hasta 3072 px y distribución de casos en una, dos o tres columnas según viewport. `npm run build` y `npm run build:studio` pasan; la verificación del build conserva nueve rutas con HTML completo. Los cambios son de estilos; no se añadieron pruebas unitarias que pretendan sustituir la revisión visual. La matriz 320–3840 px, orientación horizontal y zoom al 200 % continúa pendiente por el bloqueo de navegador documentado.

`npm run verify` pasó con TypeScript estricto, 15/15 pruebas, nueve rutas prerenderizadas y build del panel. Incluye comprobación de enlaces y anclas públicos sin JS y regresión de varias vistas previas con IDs únicos y texto escapado. La primera ejecución de Miniflare falló por sockets del sandbox; la ejecución autorizada fuera del sandbox pasó. No se ha validado visualmente el rediseño ni se ha desplegado. Ver [diseño, movimiento y revisión pendiente](design-and-motion.md).

## Registro anterior

Fecha local: 13 de noviembre de 2026 (America/Guatemala). Estos resultados describen el espacio de trabajo local; no acreditan operación en Cloudflare ni publicación en GitHub.

## Comprobaciones ejecutadas

| Comprobación | Resultado observado |
|---|---|
| TypeScript estricto | `npm run typecheck`: correcto |
| Pruebas automatizadas | `npm test`: 14/14, sin omitidas |
| Verificación integrada | `npm run verify`: correcto |
| Build público | Nueve rutas con HTML completo, h1, contenido, navegación y metadatos; sin fallback SPA desplegable |
| SEO con origen | Build con origen HTTPS de prueba e indexación activada: canónicas y JSON-LD correctos en las nueve rutas |
| Salida final | Regenerada sin origen productivo, noindex; `build/site/client/` |
| Build del panel | Correcto; `build/studio/`, biblioteca aprobada incluida |
| Independencia de builds | Compilar el público después del panel conserva ambos directorios |
| Empaquetado Workers | Dry-run correcto para ambos; público sin D1, privado con binding D1 |
| Dependencias | Última auditoría npm: cero vulnerabilidades conocidas; lockfile actualizado |
| Reader real de Prometheus | Lectura y búsqueda literal del recurso permitido `core/README.md` correctas; solo se imprimieron estado y tamaño de resultado |
| API local por HTTP | Carga de ocho borradores y lectura de estado correctas; cero publicaciones |
| Servidores web por HTTP | Sitio `/proyectos/fak/` y panel: HTTP 200; contenido público presente; proxy privado devuelve ocho entradas locales |
| Archify | Ambos diagramas: 9/9 showcase, cero errores y advertencias; recibos de hashes y tamaños conservados |

Las pruebas D1 usan Miniflare y necesitan sockets locales. Su primera ejecución en sandbox falló por comunicación local; al conceder el permiso correspondiente se ejecutaron correctamente. Los servidores Vite también requirieron ese permiso para responder. Esto es comprobación HTTP, no revisión en navegador.

## Cobertura de las pruebas

- Atomicidad de edición, revisión desactualizada, head de otra entrada, revisiones inmutables y claves foráneas de imágenes.
- Rollback completo ante evidencia duplicada.
- Importación, huella inválida, duplicados y rechazo de sobrescritura.
- Rutas privadas, campos desconocidos, enlaces ejecutables y texto escapado.
- Anonimato rechazado, JWT de propietario, audiencia e identidad incorrectas, CSRF y no-store.
- Recurso no permitido, claim exclusivo, resultado tardío y credencial revocada.
- TTL y eliminación de resultados; ausencia de conversión automática en evidencia.
- Snapshot congelado sin borradores o consultas, repetición, fallo de dispatch, callback anterior y recuperación de una versión anterior.
- Dos solicitudes simultáneas producen un solo dispatch.
- Exportación y restauración del respaldo en otra D1, comparación de entradas y `foreign_key_check`; exclusión de consultas y credenciales.
- Conector: HTTPS, traversal, identificadores permitidos, rechazo de directorios y errores sin rutas privadas.
- Rutas históricas, tres servicios y comportamiento 404/405 del Worker público.

## Pendientes que impiden declarar entrega productiva

| Pendiente | Motivo |
|---|---|
| Navegación real, foco, filtros, menú móvil/escritorio y zoom | Navegador administrado bloqueado; no se usó otra vía para eludirlo |
| Revisión visual y controles Archify | No existe evidencia de navegador ni revisión perceptual; solo validación determinista |
| Políticas Access y acceso remoto | No hay cuenta Cloudflare autenticada ni dominios/Access configurados |
| Migración y restauración D1 remotas | Solo se verificaron bases locales |
| Workflow y despliegue reales | Código aún local; secretos, cuenta y repositorio operativo pendientes |
| Fallo real de build/deploy y recuperación del sitio publicado | El protocolo está probado localmente; falta ejecutarlo contra infraestructura real |
| Conector extremo a extremo por HTTPS | Reader y protocolo probados por separado; falta panel online |
| Cuota gratuita disponible | Documentación disponible, cuenta real sin verificar; no se activaron planes |

## Observaciones del build

React Router 7 informa cambios opcionales para v8; no se activaron flags experimentales. Rollup informa comentarios de anotación de Zod que elimina durante el build. Ninguno de estos avisos impide compilar ni representa una revisión visual aprobada.

Los paquetes corregidos de Sharp y Undici se fijaron mediante overrides exclusivamente para Miniflare 4. Las pruebas con ese simulador pasan. Los cambios futuros de dependencias deben volver a consultar impacto y mantener el lockfile revisable.

## Dependencias y evidencia

Se consultó dependency-librarian para los cambios de configuración, componentes, backend, base, conector y pruebas. El directorio no está registrado en su índice. No se interpreta esa ausencia como prueba de independencia. Las relaciones se comprobaron mediante imports, configuraciones, artefactos y pruebas: contratos compartidos → editor/backend/conector; snapshot → build público; D1 → servicios → API privada; snapshot aprobado y commit → Actions → assets públicos.

## Revisión de animación para 4K — 15 de noviembre de 2026

El agente revisó el delta recibido tras el corte de sesión. Se conservó la entrada CSS del hero, proceso y encabezados. Se añadió entrada CSS a los bloques revelables, casos y detalles que ya pueden estar visibles al cargar en un viewport alto: el observer omite su primera notificación para evitar repetir la entrada tras hidratar. Las tarjetas llevan un escalonado de 300/380/460 ms y duración de 800 ms. El scroll posterior conserva IntersectionObserver y WAAPI. Movimiento reducido mantiene las anulaciones existentes. La etiqueta temporal de diagnóstico permanece hasta observar la preferencia del navegador.

Verificación real ejecutada: `npm run verify`, salida 0; TypeScript, 15/15 pruebas, build público de nueve rutas y build privado. No hay evidencia de revisión visual ni del valor de matchMedia en el monitor del propietario; el navegador administrado estaba bloqueado. Comprobar 3840×2160 y el viewport efectivo con escalado del sistema, recarga completa, Tab, controles, scroll y movimiento reducido. No se declara VERIFIED visual.
