# Modern Web Guidance en el portafolio

Referencia técnica consultada el 13 de noviembre de 2026:
[fuente](https://github.com/GoogleChrome/modern-web-guidance-src) y
[distribución](https://github.com/GoogleChrome/modern-web-guidance).
Se usa mediante consulta selectiva de las guías; no es una dependencia de
compilación ni una instalación de su CLI o de sus skills.

## Aplicación en este incremento

- [Navbar](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-components/navbar.md): se conserva una navegación semántica; la sección seleccionada tiene `aria-current="location"` y subrayado. Se adapta la altura al texto y el desplazamiento al menú real. Los tres enlaces permanecen visibles por requisito del propietario; no se necesita un popover.
- [Stack drill-down](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-components/stack-drill-down.md): se adoptan los principios de sincronización de historial y gestión del foco. Volver/avanzar no crea entradas adicionales. No se adopta la interfaz gestual en pila, que no corresponde al portafolio.
- [Sticky headers](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-atoms/state-aware-sticky-headers.md): la visibilidad del menú se sostiene con CSS sticky; no depende de efectos visuales ni de consultas experimentales de estado de desplazamiento.

## Compatibilidad y SEO

HTML completo en cada ruta, enlaces nativos y módulos ES. La navegación en cliente
usa Fetch, History y AbortController; si faltan las APIs requeridas conserva
navegación completa. ResizeObserver mejora el margen del encabezado, con valores
CSS de respaldo. Se respeta movimiento reducido. No hay animaciones obligatorias.

Cada cambio de página actualiza título, descripción, canonical, Open Graph y
JSON-LD. Los filtros se reinicializan al volver a inicio. Los enlaces externos,
las descargas y los clics con modificadores conservan su comportamiento nativo.
El SEO personal y los requisitos derivados de FAK mantienen su propio contrato.

## Verificación y límites

Las pruebas locales comprueban destinos de navegación, excepciones, identificación
de sección y HTML/SEO generado. El build y el análisis sintáctico se ejecutan
además. La revisión en navegador de atrás/adelante, foco, zoom, filtros y live reload
está pendiente por bloqueo de política del navegador; estas pruebas unitarias no
sustituyen esa revisión. No se afirma compatibilidad certificada en navegadores.

Para futuros cambios de plataforma web, consultar las guías pertinentes y
registrar aquí la aplicación y sus límites. Verificar soporte antes de introducir
una API nueva y conservar una alternativa funcional cuando corresponda.
