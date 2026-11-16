# and_mad — portafolio

Portafolio profesional desarrollado con React, TypeScript, React Router y Vite. El sitio público genera páginas HTML prerenderizadas, con contenido estructurado, metadatos SEO y rutas individuales para proyectos y servicios.

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

El contenido publicado se obtiene de `content/published.json`. La salida para despliegue se genera en `build/site/client/`; `dist/` corresponde a un prototipo anterior y no debe desplegarse.

## Estructura del sitio

- `app/`: rutas, componentes y estilos públicos.
- `shared/`: componentes, estilos y contratos compartidos.
- `content/published.json`: contenido público aprobado.
- `public/`: recursos estáticos.
- `server/public.ts`: Worker público para entregar archivos y responder 404.
- `react-router.config.ts`, `vite.config.ts` y `wrangler.site.jsonc`: configuración de compilación y despliegue.

El código de pruebas, el panel editorial y su backend siguen en el repositorio porque forman parte de la verificación o del flujo de publicación existente. Separarlos requiere modificar esas dependencias primero.

Las instrucciones de agentes, los índices internos de Prometheus y la documentación de trabajo se excluyen mediante `.gitignore`. No deben subirse credenciales, borradores privados ni archivos internos de asistentes.
