# and_mad — portafolio

Portafolio profesional desarrollado con React, TypeScript, React Router y Vite. El sitio público prerenderiza las portadas en español (`/`) e inglés (`/en/`), con metadatos SEO y secciones de Servicios, Casos y Contacto. Las URL históricas de casos y servicios redirigen a la sección correspondiente.

## Desarrollo del sitio público

Requiere Node.js 22.19 o superior.

```powershell
npm ci
npm run dev
```

Para validar y compilar:

```powershell
npm run typecheck
npm run build
```

La portada toma los servicios y el registro de entradas de `content/published.json`. Las historias y los resultados de las cuatro áreas se redactan en `app/content.ts`. La salida para despliegue se genera en `build/site/client/`. Excluye `dist/` del despliegue.

## Estructura del sitio

- `app/`: rutas, componentes y estilos públicos.
- `shared/`: componentes, estilos y contratos compartidos.
- `content/published.json`: contenido público aprobado.
- `public/`: recursos estáticos.
- `server/public.ts`: Worker público para entregar archivos, redirigir fichas retiradas y responder 404.
- `react-router.config.ts`, `vite.config.ts` y `wrangler.site.jsonc`: configuración de compilación y despliegue.

## Pruebas por tipo

`npm test` ejecuta los cuatro grupos del portafolio. `npm run verify` añade TypeScript y el build público.

| Comando | Responsabilidad |
| --- | --- |
| `npm run test:content` | Contenido publicado, contratos, rutas y estructura del sitio |
| `npm run test:nodes` | Retícula, coordenadas, conexiones, selección y límites del sistema de nodos |
| `npm run test:animations` | Secuencias, recorridos de energía, tiempos y movimiento reducido |
| `npm run test:transitions` | Contratos de modales, navegación entre secciones y proyección del parallax |

Los contratos estáticos de modales no verifican su apertura/cierre real, foco o historial en navegador. Fluidez, aspecto y comportamiento interactivo requieren revisión visual.

Las 13 pruebas de edición (backend, conector y vista previa del panel) se conservan en `tests/edition/*.unverified.ts`: **no verificadas para entrega y pendientes de revisión**. Están fuera de `npm test`, `verify` y los workflows. Sus resultados locales históricos no validan el sistema editorial. Solo se ejecutan deliberadamente con `npm run test:edition:unverified`, que puede necesitar sockets locales de Miniflare. El build de Studio sigue disponible por separado con `npm run build:studio`; el código editorial y sus workflows manuales se conservan.

Las instrucciones de agentes, los índices internos de Prometheus y la documentación de trabajo se excluyen mediante `.gitignore`. No deben subirse credenciales, borradores privados ni archivos internos de asistentes.
