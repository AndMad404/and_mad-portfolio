# Portafolio and_mad

Portafolio personal orientado a Content Analyst, Data Quality, CMS y QA.
Cuatro rutas con HTML generado, navegación en el cliente y filtros progresivos.
Los proyectos se abren sin recargar el documento; los enlaces directos también
funcionan y el contenido sigue disponible sin JavaScript.

## Desarrollo

Node.js 22 o superior; sin dependencias de terceros.

```powershell
npm run dev
```

Abrir http://127.0.0.1:4173. El servidor compila al iniciar y observa `src/`,
`public/` y `scripts/`: al guardar, recompila y recarga automáticamente la vista.
Los cambios en el propio servidor (`scripts/serve.mjs`) requieren reiniciarlo.
La recarga de desarrollo no se incluye en los archivos publicables.

```powershell
npm test
npm run build
```

## Contenido y publicación

- `src/content.mjs`: identidad, contacto, CV y fichas de proyectos.
- `scripts/build.mjs`: HTML, metadatos por ruta, sitemap, robots y llms.txt.
- `public/`: estilos, filtros y tarjeta social PNG 1200 × 630.
- `dist/`: salida publicable; no contiene el roadmap, el código fuente ni documentos privados.

Por defecto se genera una vista `noindex, follow`, sin dominio inventado.
Configurar `SITE_ORIGIN` con el origen HTTPS verificado para generar canónicas,
URLs sociales, sitemap y datos estructurados Person/WebSite/WebPage.
Activar `INDEXABLE=true` únicamente al preparar el lanzamiento público.
La página 404 conserva `noindex, nofollow` y omite canonical y datos estructurados.

El destino previsto es el Worker `and-mad`; este incremento no lo modifica ni
crea otro alojamiento. Falta verificar su configuración antes de desplegar.
El servidor local sirve las páginas inexistentes con HTTP 404; el alojamiento
definitivo debe mantener este comportamiento y no aplicar fallback SPA.

## Límites

No hay API, administración, autenticación ni conexión a Meta en este incremento.
Los diagramas son esquemas conceptuales; no son capturas del producto.
Contacto y CV quedan pendientes de datos reales. No se inventan enlaces,
experiencia profesional, resultados, métricas ni autoría exclusiva.

La administración futura será privada. `noindex` nunca sustituye autenticación.
No introducir credenciales de Meta en este proyecto estático.

## Referencias técnicas

Se utiliza [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance-src)
para decisiones de plataforma, navegación y accesibilidad. Las recomendaciones
aplicadas y los límites de verificación están en
[docs/modern-web-guidance.md](docs/modern-web-guidance.md).
