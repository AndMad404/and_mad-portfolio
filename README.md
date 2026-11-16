# and_mad — portafolio y panel editorial

Portafolio comercial para Costa Rica, con tres servicios, casos de estudio y administración privada. React + TypeScript estricto, React Router framework y Vite, Tailwind, Workers, D1/Drizzle y Zod. El sitio público y el panel se despliegan de forma independiente.

## Desarrollo

Node 22.19 o superior. Instalar con `npm ci`.

```powershell
npm run dev
```

Sitio en `http://127.0.0.1:5173`. HMR de Vite y navegación de React Router. El menú permanece visible con CSS sticky. Los filtros se guardan en la URL y se recuperan con atrás/adelante.

Para trabajar en el panel, abrir dos terminales:

```powershell
npm run dev:api
```

```powershell
npm run dev:studio
```

Panel en `http://127.0.0.1:5174`. El servidor de desarrollo escucha solo en loopback y usa una D1 local persistida en `.wrangler/studio-dev`. Identifica expresamente al operador como `local-development`; no contiene credenciales cloud ni puede desplegar. Ese servidor no forma parte del Worker de producción, que siempre exige Cloudflare Access. No exponer los puertos de desarrollo a internet.

En el entorno administrado las pruebas Miniflare y el servidor API pueden necesitar permiso para sockets locales. Los límites del navegador siguen siendo independientes de esas pruebas HTTP.

## Verificación

```powershell
npm run typecheck
npm test
npm run build
npm run build:studio
```

`npm run verify` ejecuta esos cuatro pasos. El build público comprueba HTML sin JS, metadatos, contenido de cada ruta y ausencia de nombres de secretos/datos privados. Las pruebas usan D1 local real con Miniflare y claves JWT de prueba; no contactan cuentas productivas. Los paquetes quedan fijados por `package-lock.json`.

`build/site/client/` contiene exclusivamente la publicación pública. `build/studio/` contiene la interfaz privada. `dist/` pertenece al prototipo anterior y **no debe desplegarse**. Su generador y router hechos a medida se conservaron como referencia en `docs/legacy/`.

## Contenido

`content/published.json` es el snapshot público inicial. En el workflow se sustituye por la versión aprobada, descargada del backend. `content/services.json` y `content/labor-cases.json` documentan el material inicial; no son una segunda fuente de edición del panel.

Los casos distinguen experiencia laboral, proyectos en desarrollo y resultados pendientes de comprobar. No se atribuyen métricas inventadas ni se publican archivos privados de empleadores. La experiencia en backend y D1 se presenta como aprendizaje de este proyecto.

Biblioteca inicial: favicon y tarjeta social preparada, sin R2 ni subida de archivos. La integración con Meta sigue fuera de este incremento.

## Publicación

Configurar `SITE_ORIGIN` con el origen HTTPS verificado e `INDEXABLE=true` para indexar; sin ellos la compilación permanece noindex. No se inventa un dominio productivo. El Worker público responde 404 en rutas inexistentes, sin fallback SPA.

El Worker privado verifica el JWT de Access y el propietario en cada petición humana, exige origen del panel para escrituras y responde sin caché. Conector y Actions tienen credenciales separadas y limitadas a sus operaciones.

- [Operación, configuración y despliegue](docs/operations.md)
- [Modelo relacional y contratos](docs/data-model.md)
- [Verificación y pendientes reales](docs/verification.md)
- [Diagramas Archify y recibos](docs/architecture/README.md)
- [Roadmap actualizado](ROADMAP.md)
- [Aplicación de Modern Web Guidance](docs/modern-web-guidance.md)
- [Diseño, animaciones y revisión manual](docs/design-and-motion.md)

No hay despliegue remoto confirmado: falta autenticar Cloudflare, completar dominios, Access, D1 y secretos. El repositorio objetivo ya fue identificado. La revisión visual real sigue pendiente; el build y las pruebas no la sustituyen.

"# and_mad-portfolio" 
"# and_mad-portfolio" 
