# Capa de contenido, SEO y depuración editorial

## Estado editorial vigente — 16 de noviembre de 2026

Actualización autorizada por el propietario tras aclarar que necesita cuatro tipos de trabajo con experiencias dentro, en lugar de cuatro casos seleccionados. Las decisiones y conteos históricos de ocho áreas que aparecen más abajo describen el corte previo.

| Tipo de trabajo | Experiencias adjuntas |
| --- | --- |
| CMS: plantillas y contenido | AEM y sitios con WordPress; creación de estructuras, plantillas, componentes y gestión de contenido |
| Creación de sitios web | Federación de Kendo y WordPress |
| Publicación y flujos de contenido | Flujo de eventos de Federación, plataforma editorial del portafolio y Gestor, manteniendo el estado en desarrollo de este último |
| Calidad de datos | Investigación del catálogo, ExcelBatch, CleanTreeFlow, informes de auditoría web y extractor de productos por ID |

Centrificador y eventos de combate no se destacan en esas carpetas; sus rutas históricas y los estados de documentación se conservan. No hay filtros visibles ni desplegable de apoyo. selectCases conserva compatibilidad programática con selecciones históricas, pero la portada muestra siempre las cuatro familias. Las experiencias se abren desde enlaces HTML rastreables y modales; las rutas independientes siguen prerenderizadas.

El snapshot conserva doce casos y tres servicios, sus IDs, slugs y release contenido-seo-2026-11-15. Se actualizaron títulos, resúmenes y contexto de los casos que agrupan capacidades sin inventar métricas ni atribuir pruebas automatizadas de QA al propietario. ExcelBatch conserva su nombre canónico. Los informes y el extractor conservan sus límites locales; no se mezclan sus estados con los de herramientas usadas en el trabajo empresarial.

La página mantiene un solo h1; Servicios es una lista; cada tipo de trabajo tiene un h3 bajo el h2 del bloque; Perfil y forma de trabajar se unifica en #perfil con h2, grupos h3 y pasos h4 dentro de una lista ordenada. Se retiraron las etiquetas 01 / TIPO DE TRABAJO, DESDE COSTA RICA y / CONVERSEMOS de sus posiciones anteriores.

Con un origen configurado, pageMeta emite el grafo WebPage, WebSite y Person. Añade Service para los servicios visibles en portada o el servicio correspondiente en su detalle, con provider enlazado a Person. El detalle de un servicio lo referencia como mainEntity. La portada declara #perfil como WebPageElement sobre la persona; no se reclasifica toda la landing como ProfilePage. El marcado se genera desde los títulos y resúmenes publicados, sin ofertas, puntuaciones ni resultados inventados.

Referencia primaria: [políticas de datos estructurados de Google](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). El marcado describe contenido visible y no garantiza resultados enriquecidos ni posicionamiento. Se comprobó el grafo en un build con origen HTTPS de prueba, después restaurado al build local normal. No se ejecutó una validación remota de Rich Results ni se publicó el sitio.

Pendientes: diseño de contenido sobre las ventanas del parallax, revisión visual/accesible, configuración y publicación real, versión inglesa y medición de búsquedas. El cierre técnico no equivale a esos hitos.

Documento del incremento definido el 15 de noviembre de 2026. Cubre análisis, depuración, SEO y cierre técnico. El 16 de noviembre el propietario aplazó la revisión visual del punto 4 para continuar el cierre de datos y SEO.

**Estado:** incremento cerrado técnicamente. El propietario eligió ocho áreas y conservar el titular simplificando su entorno. El corte inicial de SEO pasó 36 pruebas y ambos builds, más tres builds de 16 rutas en modos indexable, vista previa con origen y local. Tras cambios posteriores de navegación/contacto, npm run verify volvió a terminar correctamente; la auditoría final confirmó las 15 entradas y las 16 rutas. El propietario autorizó el cierre documental, reanudó el trabajo y después aplazó expresamente la revisión visual («sigue, esto quedara para despues»). El rechazo administrado de localhost persiste; no se presenta como QA aprobada. Evidencia y límites en [prometheus.md](prometheus.md).

## 1. Objetivo y decisiones acordadas

- Atraer **clientes y reclutadores por igual** mostrando habilidades mediante proyectos y experiencia verificable.
- Mercados: Costa Rica, Latinoamérica y búsquedas internacionales.
- Depurar primero el español; documentar los términos en inglés para una versión futura.
- Evitar redundancias entre espacios de la página; entre proyectos se tolera la repetición.
- Eliminar componentes que pierdan su contenido útil.
- Fuera de este incremento: ilustraciones conceptuales y sus datos, rediseño de animaciones, despliegue, versión en inglés y medición de posicionamiento real.

## 2. Fuentes consultadas

| Fuente | Qué aporta | Límite |
|---|---|---|
| Master CV (`CVs/CV's/candidate-data/master-cv.json`), ensamblado con `readMaster()` y sus módulos de perfil, habilidades, experiencia, proyectos, evidencias y límites | Hechos y atribuciones identificados por IDs canónicos | Mezcla declaraciones del candidato y registros previos de inspección de código; leerlo ahora no equivale a repetir aquellas inspecciones |
| `content/published.json`, `app/routes/*.tsx`, `shared/EntryView.tsx`, `app/components/ProjectCard.tsx` | Estado real del contenido y de cómo se muestra | Lectura de código; sin navegador |
| Google Search Central, [meta tags que Google admite](https://developers.google.com/search/docs/crawling-indexing/special-tags) | La etiqueta `meta keywords` no se usa y no influye en indexación ni posicionamiento | Hecho de la documentación oficial |
| Google Search Central, [sitios multirregionales y multilingües](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) | URLs por idioma, `hreflang` y recomendaciones sobre redirecciones y ubicación | Consultada el 15 de noviembre de 2026; orientación para una fase posterior |
| Google Search Central, [guía SEO inicial](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) y [bases de JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) | Redacción útil, títulos descriptivos, enlaces rastreables, prerenderizado y canónicas | Consultadas de nuevo para implementar el punto 3; no garantizan posicionamiento |
| [Registro local del proyecto](prometheus.md), roadmap y código del portafolio | Estado de los casos locales y alcance de las verificaciones anteriores | No se volvieron a ejecutar informes, extractor ni otros proyectos privados; tampoco se comprobó su despliegue |

Comprobación de la cita durante la integración: «Google no utiliza `meta keywords`» aparece tanto en la página de meta tags como en la sección «Things we believe you shouldn't focus on» de la guía SEO inicial. La cita del plan era válida.

## 3. Evidencia del CV que respalda búsquedas

| Capacidad | Respaldo en el Master CV | Límite que se conserva |
|---|---|---|
| Frontend con React, TypeScript y Vue | `federacion-spa`, `subaru-vue-components`, `freelance-web-development` | Vue y AEM provienen de trabajo empresarial privado |
| Animaciones y transiciones web | `web-motion` en cuatro contextos: freelance, Subaru, Simetría y Federación | Sin métricas; el sitio propio sirve de muestra |
| Sitios, landing pages y WordPress | `simetria-wordpress`, `simetria-ecommerce`, `subaru-marketing-landing-pages-forms` | Sin capturas ni muestras públicas de cliente |
| Mantenimiento de sitios | `subaru-site-maintenance-support`, `federacion-platform-test-maintenance` | Rendimiento, disponibilidad y seguridad son responsabilidades declaradas; sin métricas |
| SEO técnico y rendimiento (práctica de desarrollo) | `simetria-seo-performance`; en Federación: `federacion-performance`, `federacion-performance-audits` (Lighthouse, Screaming Frog), `federacion-ssr-route-generation` | WordPress se presenta como optimización de rendimiento en 2018–2019. Core Web Vitals se vincula a Federación. Sin atribuir pruebas de carga, investigación de palabras clave ni resultados de posicionamiento |
| Accesibilidad y sitios bilingües | `federacion-multilingual-accessibility` (WCAG 2.1 AA como estándar aplicado), axe-core | No se infiere certificación ni cumplimiento garantizado |
| Contenido empresarial en AEM | `subaru-aem`, `subaru-content-operations`; cargo documentado: Content Analyst | CMS Developer es una posible búsqueda afín a las tareas, no un reemplazo del cargo ni prueba de especialización backend AEM |
| Automatización con Python y Excel | `subaru-python-automation`, ExcelBatch, CleanTreeFlow, `federacion-calendar-pipeline` | Tiempos de ExcelBatch declarados; sin ETL a base de datos |
| Calidad de datos y contenido | `subaru-content-xml-qa`, `subaru-data-auditing`, Playwright y regresión visual en Federación | Las pruebas automatizadas de `.content.xml` las implementó la QA Automation Lead |

## 4. Búsquedas objetivo

**Propuestas por afinidad con la experiencia; no tienen volumen de búsqueda comprobado.** Una herramienta de palabras clave o Search Console las confirmará o descartará.

| Intención | Términos en español | Equivalentes en inglés (versión futura) | Destino en el sitio |
|---|---|---|---|
| Contratar desarrollo web | «desarrollador web freelance Costa Rica», «creación de páginas web», «desarrollo de landing pages» | freelance web developer Costa Rica, landing page development | Servicio de creación; Federación y WordPress |
| Contratar frontend | «desarrollador frontend React TypeScript», «desarrollador Vue» | React TypeScript frontend developer, Vue 3 developer | Perfil; Federación; AEM |
| Interfaces con movimiento | «desarrollo web con animaciones», «animaciones y transiciones CSS» | web animation developer, CSS transitions | Portada y Federación; el propio sitio como muestra |
| Mantener un sitio | «mantenimiento web», «corregir errores de una página web», «mantenimiento WordPress» | website maintenance, fix website bugs | Servicio de mejora y mantenimiento |
| Rendimiento y SEO técnico | «optimización de velocidad web», «Core Web Vitals», «SEO técnico para sitios React» | Core Web Vitals optimization, technical SEO for React sites | Servicios de creación y mantenimiento; Federación; WordPress |
| Contenido empresarial | «especialista en contenido AEM», «Adobe Experience Manager content author», «web content specialist» | AEM content author, CMS developer | Caso AEM |
| Automatizar tareas | «automatización con Python», «automatización Excel VBA», «procesamiento de archivos por lotes» | Python automation, Excel VBA batch macros | Servicio de automatización; ExcelBatch; CleanTreeFlow |
| Revisar calidad | «auditoría de contenido web», «calidad de datos XML», «pruebas web con Playwright», «accesibilidad web WCAG» | content QA, XML data quality, Playwright testing | Caso de calidad de datos; Federación |

Las filas de «Rendimiento y SEO técnico» y la mención de accesibilidad se añadieron respecto al plan inicial porque el CV las respalda.

**Reclutadores.** Búsquedas afines a las tareas: Frontend Developer (React/TypeScript), CMS Developer, Content Analyst (AEM), desarrollador WordPress y analista de calidad de datos. Los términos objetivo no sustituyen los cargos históricos. En particular, experiencia con contenido y frontend AEM no demuestra desarrollo Java/OSGi de la plataforma.

**Prioridad editorial, no estimación de demanda:** usar desarrollo y mantenimiento web para necesidades de clientes; frontend y AEM para especialización profesional; automatización y calidad de datos como diferenciadores demostrables. Movimiento, rendimiento y accesibilidad aportan técnicas concretas dentro de esos recorridos. No se crea un servicio nuevo por cada familia.

### Términos descartados

| Término | Motivo |
|---|---|
| Backend empresarial, ingeniero de datos | Sin diseño de bases relacionales ni pipeline ETL hacia base de datos; JOIN es conocimiento declarado sin uso profesional confirmado |
| Consultoría SEO, posicionamiento garantizado | El CV acredita SEO técnico dentro del desarrollo; no investigación de palabras clave ni resultados. El servicio ya declara que no promete posiciones |
| Asistencia por agentes de IA | Sí está documentada (`freelance-ai-lifecycle`, `federacion-ai-agent-orchestration`). Se excluye del contenido público por decisión editorial del propietario, no por falta de evidencia |
| Desarrollo de productos LLM o RAG | El uso de agentes para desarrollar software no demuestra implementación de esas funcionalidades en un producto |
| Banca, Temenos T24 | Sin experiencia |
| Diseño gráfico o branding | Figma y Photoshop son apoyo; no hay muestras |
| Cumplimiento WCAG garantizado | Se aplica WCAG 2.1 AA como estándar; no hay auditoría certificada |

## 5. Estrategia por mercado e idioma

- **Guía de Google:** recomienda URLs distintas por idioma y anotaciones `hreflang`; determina el idioma a partir del contenido visible e ignora metaetiquetas geográficas como `geo.position`. Recomienda evitar redirecciones automáticas por idioma y adaptación basada en IP que impida descubrir versiones. `lang` sigue siendo relevante para accesibilidad aunque Google no lo use para determinar el idioma.
- **Recomendación:** Costa Rica permanece como ubicación visible. Latinoamérica comparte el mismo contenido en español: no se crean páginas por país con el mismo texto. La versión en inglés será un incremento propio, con URL y referencias cruzadas, a partir de los equivalentes de la sección 4.
- **Inferencia:** `inLanguage: "es-CR"` ya describe correctamente el contenido actual.

## 6. Diagnóstico

Estado de partida comprobado antes de editar: 12 casos y 3 servicios (15 entradas, 16 rutas con la portada), 15 límites con el texto «Pendiente de confirmar», fichas que repetían su alcance entre resumen, contribución, resultados y evidencia, y cuatro bloques del perfil que volvían a contar proyectos.

Estado tras las dos pasadas de depuración:

- `content/published.json` no contiene «Pendiente de confirmar» (comprobado por lectura).
- Cada entrada tiene límites propios y específicos.
- Las rutas, los identificadores y el contrato v1 no cambiaron.
- Cada caso y servicio tiene ruta propia prerenderizada, y `project.tsx` y `service.tsx` toman título y resumen del snapshot como metadatos. Por eso el resumen cumple dos funciones: orientar en la tarjeta y describir la página.
- El texto de las fichas pasó de 2.513 a 1.967 palabras (546 menos, aproximadamente 22 %), y las decisiones de 46 a 33. Se cuentan título, resumen, problema, contribución, decisiones, resultados, límites y etiquetas de evidencia; se excluyen tags y URLs. Es una medida editorial, no de rendimiento ni posicionamiento.
- El contenido público procede del mismo snapshot; el CV permanece como referencia privada. No se publica el documento ni se agrega como dependencia del build.

## 7. Funciones de cada espacio

| Espacio | Función | No debe |
|---|---|---|
| Portada | Especialidad, valor y acceso a servicios o trayectoria | Contar proyectos |
| Perfil | Síntesis de experiencia, colaboración y evolución | Relatar proyectos de sus fichas |
| Método | Cómo se acuerda, ejecuta y verifica el trabajo | Repetir listas de tecnologías |
| Servicios | Necesidad del cliente, intervención, entregables y alcance | Trasladar estimaciones de otros proyectos |
| Casos | Contexto, participación, decisiones y resultados respaldados | Repetir el estado ya mostrado en la etiqueta |

Dentro de cada ficha: el resumen orienta; la contribución explica la responsabilidad personal; las decisiones aportan razones; los resultados describen lo conseguido; los límites concentran pendientes, advertencias y atribuciones.

## 8. Auditoría editorial de las 15 entradas

Decisión final por entrada. «Conservar» significa mantener caso o servicio como página propia.

| Entrada | Decisión | Ajuste |
|---|---|---|
| Federación (`fak`) | Conservar, reescribir resultados | El resultado responde al problema; la advertencia sobre la duración queda solo en límites; «bilingüe» solo en el resumen |
| AEM (`operacion-cms`) | Conservar, eliminar una decisión | La comunicación de riesgos con equipos y cliente vive en el perfil; la referencia a casos propios pasa a límites |
| Calidad de datos (`auditoria-datos`) | Conservar, fusionar decisiones | La primera decisión repetía el resumen; la atribución de las pruebas automatizadas pasa a límites |
| Plataforma editorial (`portafolio-editorial`) | Conservar | Se retira «Implementada localmente» del resumen (el estado ya consta en etiqueta, resultados y límites); el aprendizaje de backend pasa a límites |
| ExcelBatch | Conservar | La advertencia sobre los tiempos queda solo en límites |
| CleanTreeFlow | Conservar, fusionar | La segunda decisión duplicaba el resultado |
| Informes de auditoría web | Conservar | El límite deja de aludir a «esta revisión editorial» |
| Extractor de productos | Conservar sin cambios | Observación menor: el resultado repite «prototipo local» del resumen y la etiqueta |
| Eventos de combate | Conservar | Una sola mención del repositorio en límites y evidencia |
| WordPress | Conservar | El resultado no repite «experiencia laboral» del resumen |
| Gestor | Conservar | El estado «en desarrollo» consta en la etiqueta y en límites, no en la contribución |
| Centrificador | Conservar, sin decisiones | Sin decisiones no se muestra el bloque; el problema pierde la jerga interna; «alcance por definir» pasa a límites |
| Creación de sitios | Conservar | Separar mensajes y páginas a entregar de los criterios de trabajo; retirar la reiteración de «marketing de producto» como especialidad |
| Mejora y mantenimiento | Conservar | Diferenciar diagnóstico, correcciones y registro de verificación; alcance sujeto a plataforma y accesos |
| Automatización editorial | Conservar, ampliar claridad del título | «Automatización de contenido y datos» explica mejor las tareas respaldadas; la URL histórica se conserva |

Evidencia: las etiquetas «CV maestro: …» pasan a «CV: …» y se abrevian; los identificadores no cambian.

**Portada integrada.** Se conserva el orden actual de servicios antes de casos y los enlaces a LinkedIn y GitHub. La entrada ofrece acceso a servicios y experiencia; se retiró la lista de tecnologías redundante bajo el encabezado. El método explica acordar, construir, comprobar y entregar. El perfil reemplaza cuatro relatos de proyectos por dos bloques de colaboración y transferencia de conocimiento, respaldados por `subaru-requirements-translation`, `subaru-client-meetings-english`, `subaru-qa-ticket-mentoring` y `subaru-aem-legacy-onboarding`. El contacto invita tanto a proyectos como a oportunidades de equipo. El titular de marca y el eyebrow se conservan; su posible ajuste queda para revisión posterior. Las ilustraciones conceptuales, sus datos y los estilos no se tocaron.

**Bloques sin contenido.** Centrificador conserva la información disponible y sus condiciones de inicio, pero elimina la sección de decisiones que repetía trabajo futuro. `EntryView` omite decisiones y etiquetas vacías, mantiene numeración consecutiva y llama «Cómo lo abordo» al enfoque de servicios. `EvidenceGallery` ya omite referencias vacías. No se eliminó una ficha ni se rellenaron vacíos con afirmaciones nuevas.

### Evidencia disponible por caso

| Caso o grupo | Evidencia disponible | Qué permite concluir |
|---|---|---|
| Federación | CV y enlaces al sitio y repositorio | Responsabilidades y finalización declaradas, implementación consultable; no mediciones comerciales ni nueva comprobación del sitio remoto |
| ExcelBatch y CleanTreeFlow | CV, registros de inspección previa y enlaces al código | Herramientas con uso laboral declarado y alcance técnico acotado; cifras de ExcelBatch no medidas de nuevo |
| AEM e investigación del catálogo | Hechos canónicos `subaru-*`, incluidos `subaru-content-xml-*` | Trabajo empresarial, liderazgo y reparto de responsabilidades; documentos del cliente privados |
| WordPress | Trabajo `simetria-digital` | Experiencia declarada con sitios de negocio; sin muestras públicas actuales |
| Portafolio editorial | Código y pruebas locales de este proyecto | Implementación y verificaciones locales; no acredita operación remota |
| Informes y extractor | Registro previo de lectura de contratos/código local | Base y prototipo documentados; no se reejecutaron en este incremento |
| Eventos de combate | Registro de planificación y enlace al repositorio inicial | Proyecto y alcance planificado; no un producto operativo |
| Gestor y Centrificador | Roadmap y planificación existente, sin referencias públicas en sus fichas | Intención y condiciones de inicio; no se presentan como integraciones verificadas |

En total, cuatro casos tienen enlaces públicos (cinco enlaces); seis dependen de evidencia privada o local; dos no tienen referencias en sus fichas. La existencia de un enlace no certifica autoría, funcionamiento actual ni resultados. Los tres servicios derivan de estos casos, no son evidencia independiente.

## 9. Hallazgos del corte anterior al punto 3

Los siguientes hallazgos describen el corte de los puntos 1 y 2. La resolución aplicada se registra debajo; no representan pendientes actuales.

1. **Evidencia que puede hacerse más visible.** Federación: Core Web Vitals, imágenes WebP optimizadas, Lighthouse, Screaming Frog y WCAG 2.1 AA. WordPress: rendimiento y SEO técnico (hoy se menciona optimización de imágenes y videos). AEM ya menciona formularios y páginas de campaña; el matiz que falta es explicitar su contexto de marketing y las animaciones.
2. **Animaciones.** Respaldadas en cuatro contextos; solo Federación las menciona.
3. **Filtros de casos.** 24 etiquetas únicas más «Todos». Mezclan inglés y español («Data Quality», «QA», «SEO técnico») y títulos laborales («Content Analyst»). Propuesta: reducirlas a un máximo de diez alineadas con las familias de búsqueda. Decisión del propietario: afecta al parámetro `?area=`.
4. **Metadatos.** `pageMeta` añade ` | and_mad` al título; la portada usa texto fijo. Revisar longitud y unicidad de los 16 títulos y descripciones.
5. **Identidad.** El JSON-LD de la portada usa `and_mad` como nombre de la persona, mientras la identidad visible es «Andrés Madrigal / And_Mad».
6. **Indexación.** La configuración de build recibe `INDEXABLE=true` y `SITE_ORIGIN` (HTTPS); Vite los expone como `VITE_INDEXABLE` y `VITE_SITE_ORIGIN`. Sin origen no se emiten canónicas, `og:url` ni JSON-LD de página. El generador existente de sitemap y robots toma las variables del build. La salida verificada en este corte sigue sin indexación productiva; no se activó el punto 3.

**Aclaración de fechas:** `simetria-seo-performance` contiene el término Core Web Vitals, pero ese empleo termina en 2019 y la iniciativa fue presentada en [mayo de 2020](https://blog.chromium.org/2020/05/introducing-web-vitals-essential-metrics.html). Consultado el propietario, confirmó la primera fecha (2018–2019). Para este portafolio se conserva «optimización de rendimiento» en ese trabajo y se vincula Core Web Vitals a Federación; no se atribuyen herramientas concretas nuevas. El CV no se modifica en este incremento.

### Resolución del punto 3

- **Contenido respaldado:** Federación incorpora optimización WebP y carga, Core Web Vitals, Lighthouse, Screaming Frog y WCAG 2.1 AA como referencia, sin certificación ni métricas nuevas. AEM explicita formularios de marketing y animaciones/transiciones en Vue. WordPress incorpora rendimiento y SEO técnico en el trabajo de 2018–2019, sin atribuirle Core Web Vitals. Las etiquetas de integración reflejan el calendario de Federación y el conector editorial; Gestor conserva su estado pendiente.
- **Filtros aprobados:** desarrollo web, AEM/CMS, automatización, integración, calidad de datos, QA/accesibilidad, SEO técnico y planificación. Las tecnologías permanecen en cada ficha. Los valores históricos de `?area=` conservan su selección exacta y muestran una opción para quitar el filtro; los desconocidos muestran todos los casos. El filtrado se aplica tras hidratar, conservando todos los enlaces en el HTML prerenderizado.
- **Portada aprobada:** se mantiene «Contenido claro. Datos confiables. Web que funciona.». El texto de apoyo identifica «ANDRÉS MADRIGAL / PORTAFOLIO» y «DESDE COSTA RICA» para evitar repetir la tríada. No se modificaron ilustraciones ni estilos en este punto.
- **Metadatos e identidad:** `app/content.ts` centraliza Andrés Madrigal, And_Mad y sus perfiles públicos. Cada una de las 16 rutas emite título y descripción propios; con origen configurado, una canónica y un grafo JSON-LD con WebPage, WebSite y Person enlazados. Se elimina el JSON-LD duplicado de la portada y se unifican los metadatos sociales y la identidad de `llms.txt`. Sin `meta keywords` ni límites artificiales de caracteres.
- **Indexación comprobada:** HTML completo, enlaces de navegación, títulos/descripciones únicos, canónicas, grafo, metadatos sociales, sitemap y robots se contrastan con la fuente. Se verificaron builds con origen HTTPS de ejemplo indexable y no indexable, y sin origen. La última salida es local y no indexable; no se contactó ni publicó en el dominio de ejemplo.
- **Contrato:** release `contenido-seo-2026-11-15`, doce casos y tres servicios; IDs, slugs, rutas y contrato v1 conservados. La reducción editorial y los conteos del punto 2 son mediciones de aquel corte, anteriores a esta incorporación de evidencia.

## 10. Pendientes

- Revisión visual e interactiva aplazada por el propietario el 16 de noviembre de 2026: móvil/escritorio, filtros nuevos e históricos, modales, teclado, retorno de foco, rueda/táctil y movimiento reducido. El navegador administrado volvió a rechazar localhost después del aviso de habilitación; la verificación automática no sustituye esta revisión.
- Versión en inglés, publicación y medición real: incrementos posteriores.
