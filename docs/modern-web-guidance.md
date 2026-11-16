# Modern Web Guidance aplicado

Se conserva como referencia por tarea [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance-src). No es un framework ni una dependencia del build. La versión anterior de este registro permanece en `docs/legacy/modern-web-guidance.md`.

## Navegación y accesibilidad

- [Navbar](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-components/navbar.md): navegación semántica, enlaces visibles y `aria-current` en la sección correspondiente. El menú permite ajuste de líneas en móvil.
- [Sticky headers](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-atoms/state-aware-sticky-headers.md): visibilidad por CSS sticky, altura medida con ResizeObserver y respaldo CSS. No depende de APIs experimentales de scroll-state.
- [Stack drill-down](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-components/stack-drill-down.md): se aplican foco e historial coherentes. El router artesanal fue sustituido por React Router; los filtros usan parámetros de URL. No se incorpora una interfaz gestual en pila.

## HTML, React y Workers

Se consultaron [React Router en Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/), [prerenderizado](https://reactrouter.com/how-to/pre-rendering), [manejo de HTML estático](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) y [Drizzle con D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1).

El público usa React Router en modo framework con HTML prerenderizado y navegación React. No necesita servidor React ni D1 al recibir visitas. El Worker sirve assets y preserva 404. El panel utiliza React/Vite en una sola página privada con backend Worker separado. Los dos comparten contratos, componentes de contenido y tokens.

En React Router 7.18.5, la lista interna de prerenderizado usa rutas sin slash final para coincidir con la normalización del framework. Los enlaces públicos y canónicas conservan el slash histórico. Una prueba de build comprueba contenido real en cada HTML para detectar regresiones que generen solamente la estructura de carga.

## SEO adaptado de FAK

Contenido completo sin JS, un h1 público por ruta, título y descripción propios, canonical y Open Graph con origen verificado, Person/WebSite/WebPage coherentes, sitemap y llms.txt. No se reutiliza la identidad institucional de FAK. No se declara hreflang sin traducciones revisadas. La 404 es noindex y permanece fuera del sitemap.

## Evidencia y límites

La implementación visual del 14 de noviembre de 2026 vuelve a consultar la guía de sticky headers y añade transiciones progresivas de React Router, movimiento reducido, scroll snap nativo y marcas decorativas con IntersectionObserver. La navegación sigue visible; no se incorporan scroll hijacking, cargas ficticias ni bibliotecas de motion. Las fuentes, decisiones y pruebas manuales están en [diseño y movimiento](design-and-motion.md).

Se verifican tipos, contratos, HTML generado, autenticación de servidor, datos, publicación y empaquetado. Estas comprobaciones no acreditan funcionamiento visual ni interacción en navegadores. La revisión real continúa pendiente por bloqueo de política; no se sustituyó por otro navegador ni por pruebas unitarias.
