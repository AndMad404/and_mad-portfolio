# Roadmap — portafolio comercial y panel editorial

## Estado vigente — cierre autorizado el 16 de noviembre de 2026

El propietario autorizó actualizar documentación e índices después del rediseño acumulado. Implementado localmente por el agente:

- Cuatro tipos de trabajo: CMS, creación de sitios web, publicación y flujos de contenido, y calidad de datos; cada carpeta adjunta experiencias y enlaces a sus detalles. Sin selector visual de ocho áreas ni apartado de proyectos de apoyo. Centrificador conserva su ruta histórica y estado pendiente, fuera de las carpetas principales.
- Título en la pestaña de cada carpeta, contenido textual a la izquierda y ventana al único parallax a la derecha; en móvil, texto antes de la ventana. El contenido superpuesto de esas ventanas queda por diseñar. Archify no participa en este rediseño.
- Perfil y forma de trabajar en una sección #perfil, proceso ordenado, jerarquía de encabezados y separadores cortos de nodos compartidos con Servicios. Eliminadas las líneas largas de Servicios y los textos «DESDE COSTA RICA» y «/ CONVERSEMOS».
- Retícula basada en ENERGY_CELL = 40 px CSS, compartida por SVG, energía, sitio y Studio, con subdivisiones. Scroll, drag y Page Up/Page Down usan paradas por bloques; los bloques altos conservan posiciones de lectura. Menú según sección visible y Contacto al final de página.
- Enlaces externos en pestaña nueva; nodos horizontales bajo el texto del menú, luz solo en el activo, y luz en la flecha de retorno. Se conserva el ajuste posterior del menú a 2,466666 s y la pestaña celeste.
- Semántica HTML y JSON-LD Service junto con WebPage, WebSite y Person; marcado limitado a servicios descritos en la página y habilitado con origen configurado.

Los detalles actuales están en [diseño](docs/design-and-motion.md), [estrategia editorial](docs/content-seo-strategy.md) y [evidencia de mantenimiento](docs/prometheus.md). Los apartados anteriores describen iteraciones históricas. Pendientes: QA visual/interactiva por dispositivos, contenido sobre las ventanas, publicación y ciclo editorial remoto. No se acredita despliegue ni resultados SEO.

Actualizado el 15 de noviembre de 2026. Basado en el plan aprobado y su contexto original. El roadmap anterior está preservado en `docs/legacy/ROADMAP.md`.

## Objetivo

Atraer clientes de servicios y reclutadores por igual mediante casos y experiencia verificable en desarrollo web, contenido y automatización. Contemplar Costa Rica, Latinoamérica y búsquedas internacionales; depurar primero el español y documentar el inglés para un incremento posterior. La experiencia laboral respalda los servicios; backend y D1 se presentan como trabajo desarrollado y aprendido aquí.

## Incrementos implementados en código

1. Diagramas Archify general y de hooks, contrastados con contratos y código existentes. JSON y HTML independientes, validación showcase y recibos. Revisión visual pendiente.
2. React + TypeScript estricto, Vite, React Router framework para el sitio prerenderizado y Tailwind con tokens compartidos. Dos configuraciones Workers, rutas históricas conservadas y tres páginas de servicios. Desarrollo local del editor con D1 de prueba.
3. Backend privado con validación de identidad Access, propietario único, CSRF, respuestas sin caché, migración SQL, Drizzle, revisiones inmutables, conflictos de edición y vista previa.
4. Importaciones v1 con procedencia y huella; aprobación de snapshots; Actions con contenido y commit congelados, estados, reintentos, recuperación y reconciliación de callbacks. Respaldo editorial sin consultas temporales ni credenciales.
5. Conector local Node/TS, polling, recursos permitidos, Reader de solo lectura, búsquedas literales, asignación exclusiva, TTL, revocación y estado de conexión.
6. Contenido inicial de servicios y casos basado en la experiencia laboral revisada. Se conservan límites explícitos en FAK, gestor y Centrificador.

## Cierre operativo pendiente

- Subir el código revisado al repositorio indicado y ejecutar Actions allí.
- Autenticación de Cloudflare, elección de dominios, revisión de cuotas gratuitas, D1 real, políticas Access y secretos.
- Despliegue y prueba de un ciclo editorial real: importar, editar, aprobar, publicar, simular fallo y recuperar.
- Probar el conector por HTTPS contra el panel desplegado. La lectura y búsqueda mediante el Reader local ya fueron comprobadas; eso no demuestra el circuito remoto.
- QA real en navegador: menú móvil/escritorio, foco, filtros, atrás/adelante, zoom, vistas previas y controles de Archify. Bloqueado por la política del navegador en esta sesión.
- Ampliar evidencia visual y resultados medidos de los casos cuando el propietario los revise. No publicar documentos privados originales.

## Instagram y Centrificador

El gestor sigue siendo una herramienta privada para preparar y publicar. La publicación web del portafolio no equivale a una publicación de Instagram.

El trabajo paralelo acordado de Centrificador exige **ambos** hitos: primera publicación real por API comprobada en Instagram y aprobación de la aplicación por Meta. Ambos siguen pendientes; ningún despliegue del panel habilita por sí solo esa fase.

## Límites

Un administrador; sin cuentas de clientes, pagos, multiempresa, R2 ni carga multimedia. Prometheus permanece local e intacto. El conector no modifica sus documentos ni ejecuta herramientas de edición. No se activan planes facturables automáticamente.

## Mantenimiento incremental con Prometheus

- Indexador y Dependency registrados para esta carpeta; instrucciones y ciclo en `docs/prometheus.md` y `AGENTS.md`.
- Mantener el mapa de dependencias al consumir cada incremento: analizar archivos previstos, conservar evidencia de las relaciones y pruebas, actualizar el snapshot y verificar el inventario al cerrar.
- No preconstruir dependencias de funciones futuras. Esta carpeta usa descubrimiento explícito por archivos mientras no tenga Git.

## Diseño y animación pública — estado al 15 de noviembre de 2026

Implementado localmente por el agente, con iteraciones guiadas por capturas y observaciones del propietario:

- Paleta principal: azul celeste `#87CEEB`, azul acero `#4682B4` y azul grisáceo `#8A9CA8`.
- Estilos mobile first con adaptación a pantallas grandes/4K; menú persistente y entrada de página coordinada. Sigue pendiente comprobar todos los tamaños y el escalado efectivo del monitor.
- Identidad animada «Andrés Madrigal» → «And_Mad»: desaparición de letras y caída de la tilde para formar el guion. Entrada del menú de derecha a izquierda, coordinada con la página a 1400 ms; respeto a movimiento reducido.
- Revelado de bloques al desplazarse y entrada de contenido inicialmente visible en pantallas altas. Retirada de la etiqueta temporal de diagnóstico.
- Caché de Vite separada para el sitio público y deduplicación de React/React DOM tras los errores locales de optimización e invalid hook call. No se da por demostrada una causa única del incidente.
- Proceso editorial en tres carpetas: Entrada, Revisión y Resultado, con sus tres colores y títulos en pestañas. La seleccionada pasa a la izquierda; pestañas al mismo nivel, lateral izquierdo continuo y sin línea sobrante a la derecha.
- Estado final de la interacción: un único cuerpo opaco con color, título y datos actualizados juntos; solo las pestañas se reorganizan con movimiento. Eliminadas las copias de contenido, transparencias y fases que producían mezclas y vacíos. No se considera terminado el diseño de una animación de carpetas completas.

**Punto de pausa:** el propietario decidió dejar temporalmente esta versión y continuar la revisión otro día. No equivale a aprobación visual definitiva ni a un despliegue.

**Verificación:** el último cambio de carpetas pasó `npm run typecheck` y `npm run build`, incluido HTML, metadatos y separación pública en nueve rutas. El `npm run verify` anterior pasó 15 pruebas y ambos builds; no se volvió a ejecutar esa batería completa después de cada ajuste visual. Pendientes: revisión real de la transición, teclado/foco, movimiento reducido, móvil y 4K. Las capturas del propietario evidenciaron defectos intermedios; no prueban que el estado final haya superado QA visual.

**Próxima sesión:** iniciar desde la raíz con `npm run dev` y abrir la URL indicada por la terminal (habitualmente `http://127.0.0.1:5173/`). Para revisar solo el portafolio no hacen falta `dev:api` ni `dev:studio`. Conservar primero la correspondencia entre título, color y contenido antes de retomar el movimiento.

### Ajuste posterior: lupa bajo el mouse

Las carpetas Entrada, Revisión y Resultado conservan su interacción original. En las portadas de los casos se sustituye el círculo «Ver caso» por una lupa sin texto, de 160 px y ampliación 1,6×. Una copia decorativa de la ilustración sigue las coordenadas del mouse dentro de la lente; conserva el efecto negativo, contorno orgánico, borde suave y entrada por opacidad y escala. El resto de la tarjeta no cambia. La salida o liberación del gesto elimina el efecto; no se activa con movimiento reducido. Pendiente aprobación visual del propietario.

Refinamiento líquido de la lupa: `lens-liquid` ondula el contorno y la máscara en ciclos de 3,4 s, con cuatro fases y deformación de hasta el 18 %. El centro, zoom y contenido permanecen alineados; solo se anima mientras la lente es visible y el sistema permite movimiento.

Refinamiento por dirección y soporte táctil: La ondulación usa ahora ciclos de 3,4 s. La lente se orienta según la dirección del gesto, se estira hasta un 20 % según su velocidad y se relaja al detenerse. La imagen ampliada compensa la rotación para seguir derecha y alineada. En móvil, Pointer Events y captura permiten el arrastre horizontal; pan-y y pinch-zoom conservan scroll vertical y zoom nativos. La cancelación del navegador oculta la lupa. Un arrastre de más de 8 px impide abrir el caso por accidente, mientras un toque normal conserva el enlace.

Corrección del contorno: máscara elíptica closest-side dentro de una caja invisible de 256 px; diámetro visible base de 160 px. Retirado el recorte rectangular del propio indicador. La deformación máxima conserva al menos 14,72 px de margen interior para evitar lados planos al estirarse. Se mantiene el centrado, zoom, negativo, ondulación de 3,4 s y soporte táctil existente.


## Casos desde el CV maestro — 15 de noviembre de 2026

Incremento implementado localmente a petición del propietario: leer el CV maestro, localizar los proyectos y dar relevancia a los de mayor alcance.

- Fuente profesional: Master CV modular de `CVs/CV's`, ensamblado con `readMaster()`. Se conservaron responsables, hechos y límites; no se modificó el CV ni se publicaron sus módulos.
- El snapshot pasa de cinco a trece casos, conserva los tres servicios y todas las rutas históricas. Primero aparecen Federación, Prometheus, operación empresarial AEM, investigación de datos y plataforma editorial; después las herramientas y proyectos de menor alcance o en planificación.
- Ocho fichas nuevas: Prometheus, investigación del catálogo AEM, plataforma editorial, ExcelBatch, CleanTreeFlow, informes de auditoría web, extractor de productos y Eventos de Combate. Federación y el caso empresarial se ampliaron con el alcance documentado en el Master.
- WordPress queda como experiencia laboral sin muestras públicas. Gestor, Centrificador y Eventos de Combate mantienen sus estados pendientes; las tarjetas ya no los presentan con una etiqueta genérica de documentación.
- El orden procede de `content/published.json`, compartido con el panel; se retiró la prioridad fija que situaba WordPress antes que Federación. No se alteraron las animaciones ni los estilos.
- Evidencia: enlaces públicos de Federación, ExcelBatch y CleanTreeFlow; resúmenes depurados para proyectos privados. Sin documentos privados, datos del empleador ni métricas nuevas. ExcelBatch conserva tiempos declarados, explícitamente no medidos de forma independiente.

Estado de publicación: contenido integrado en la versión local del sitio. Cloudflare sin autenticación según `wrangler whoami`; repositorio remoto del portafolio con tamaño cero según el conector GitHub. El despliegue en Internet y el ciclo editorial remoto siguen pendientes; no se creó alojamiento alternativo. La política administrada del navegador bloqueó observar localhost: no se acredita QA visual en esta sesión.

Verificación final y mantenimiento: véase el cierre de este incremento en `docs/prometheus.md`.


## Ajuste editorial — 15 de noviembre de 2026

A petición del propietario, se retira la ficha pública de Prometheus y se posponen las menciones a asistencia por IA en Federación, perfil y plataforma editorial. Permanecen doce casos y tres servicios; el caso editorial conserva el alcance personal de definición y revisión y el límite de aprendizaje. La documentación privada y las herramientas de mantenimiento conservan sus responsabilidades. Se retira también la etiqueta de la ficha eliminada. Sin nuevas relaciones técnicas ni rutas documentales: las reglas existentes cubren el snapshot; se mantiene el inventario mecánico.

## Alternancia de casos — 15 de noviembre de 2026

Implementado por el agente a petición del propietario: en escritorio (desde 64rem), las tarjetas impares presentan imagen + contenido y las pares contenido + imagen. La copia decorativa de la lupa conserva la misma distribución. En móvil se mantiene imagen encima del contenido. Cambio limitado a `app/public.css`; revisión visual en navegador pendiente. Cierre y verificaciones en `docs/prometheus.md`.

## Hidratación de enlaces con fragmento — 15 de noviembre de 2026

Corregido por el agente tras el aviso de React aportado por el propietario: `app/root.tsx` difiere el uso del fragmento de la URL en los atributos del fondo y del menú hasta después de hidratar, siguiendo el patrón existente en la portada. El servidor y el primer render del cliente comparten los atributos iniciales; después se aplica el fragmento actual del router. TypeScript, 16 pruebas de contenido y build público con 16 rutas correctos. Pendiente comprobar en navegador la recarga con `#caso-…`, `#servicio-…`, secciones y navegación atrás/adelante. Evidencia y mantenimiento en `docs/prometheus.md`.

## Modal sobre un único parallax — 15 de noviembre de 2026

A petición del propietario, el detalle en modal deja de montar una portada con otro BlueprintBackground: presenta una ventana transparente al mismo fondo de la página. En escritorio, texto compacto a la izquierda y ventana a la derecha; en móvil, ventana primero para verla sin desplazar el texto. Mientras existe un diálogo abierto se ocultan las superficies de la página y se conserva visible el fondo original, sin desenfoque ni pausa al abrir. El resto del detalle conserva desplazamiento independiente y cierre nativo.

Verificación: TypeScript correcto, 19 pruebas de contenido aprobadas (incluida ausencia de otro fondo en EntryView inline) y build público con 16 rutas correctas. Revisión visual pendiente: la política administrada del navegador integrado rechazó observar localhost. No acredita despliegue. Evidencia y mantenimiento en docs/prometheus.md.


## Capa de contenido, SEO y depuración editorial — 15 de noviembre de 2026

Objetivo definido por el propietario: preparar el portafolio para clientes y reclutadores por igual, con buenas prácticas de SEO y sin perder la presentación animada, y depurar las redundancias del contenido. Análisis, decisiones, auditoría y hallazgos: [estrategia de contenido](docs/content-seo-strategy.md). **Punto de revisión solicitado: entregar los resultados de 1 y 2 antes de continuar el 3.**

- **1. Análisis y búsquedas objetivo — INTEGRADO.** Ocho familias de búsquedas, evidencia y límites del CV, mercados e idiomas, auditoría de las 15 entradas y siguientes decisiones documentados. Sin volúmenes de búsqueda inventados. Asistencia por IA excluida por decisión editorial; Core Web Vitals vinculado a Federación, conservando rendimiento para WordPress 2018–2019 según aclaración del propietario.
- **2. Depuración de contenido — INTEGRADO Y VERIFICADO TÉCNICAMENTE.** 12 casos y 3 servicios, sin los 15 marcadores genéricos; 46 decisiones pasan a 33 y el texto de fichas se reduce aproximadamente 22 %. Perfil sin relatos repetidos de proyectos, método centrado en el proceso y acceso a servicios y experiencia. Bloques vacíos omitidos; servicios rotulados «Cómo lo abordo». Conservados cambios del traspaso y de la portada. `npm run verify`: 34 pruebas y ambos builds correctos; 16 rutas públicas. QA visual pendiente por bloqueo administrado de localhost. Mantenimiento y límites de verificación en [prometheus.md](docs/prometheus.md).
- **3. SEO sobre la fuente existente — IMPLEMENTADO Y VERIFICADO TÉCNICAMENTE.** El propietario eligió ocho áreas, compatibilidad con los filtros antiguos y conservación del titular con texto circundante simplificado. Se incorporó evidencia del CV sobre rendimiento, SEO técnico, accesibilidad y animaciones; identidad Andrés Madrigal / And_Mad, títulos y descripciones únicos, canónicas y grafo JSON-LD compartido. `npm run verify`: 36 pruebas y ambos builds correctos. Tres builds adicionales (indexable, vista previa con origen y local) verificaron las 16 rutas. Cierre documental autorizado explícitamente; detalles en la estrategia y el registro de evidencia.
- **4. Cierre técnico — COMPLETADO; QA VISUAL APLAZADA.** Tras reanudar, npm run verify aprobó la integración actual, incluidos navegación por bloques y contacto compartido. La comprobación final del snapshot y las 16 rutas volvió a pasar. El 16 de noviembre el propietario indicó «sigue, esto quedara para despues»: la revisión visual e interactiva se traslada a una revisión posterior y no se acredita como aprobada. Incluye móvil/escritorio, filtros, modales, teclado, foco, rueda/táctil y movimiento reducido. El navegador administrado volvió a rechazar localhost; no se usaron vías alternativas. El incremento de datos y SEO queda cerrado técnicamente, sin despliegue y con build local no indexable.

Alcance: sin migraciones, nuevas APIs ni cambios del contrato v1; se conservan identificadores y rutas. Quedan fuera las ilustraciones conceptuales y sus datos, el rediseño de animaciones, la versión en inglés, la publicación y la medición de posicionamiento real.

## Recorrido por bloques y contacto — 16 de noviembre de 2026

Implementado por el agente a partir de las tres capturas y la aclaración del propietario: presentación como primer bloque; servicios completos como segundo; encabezado, filtros y primera ficha visible de casos como tercero. Las fichas restantes conservan paradas individuales. El método y Perfil permanecen. Se retira únicamente «Una ficha / dos momentos» y se traslada «Conversemos», LinkedIn y GitHub a un único footer de contacto compartido.

El scroll de rueda conserva lectura nativa dentro de bloques altos y vuelve a su extremo inferior al subir; la transición comienza sin la pausa artificial anterior. Solo se intercepta en portada, con puntero fino y movimiento permitido. En táctil se usa ajuste de proximidad, sin paradas obligatorias en cada servicio. Los modales mantienen su desplazamiento independiente.

Verificación técnica: TypeScript, 25 pruebas de contenido y build público de 16 rutas. La suite cubre extremos y lectura de bloques altos; el build comprueba contacto único en el footer de cada ruta, anclas y ausencia de la comparación retirada. QA visual pendiente: el navegador administrado rechazó el origen local. Sin despliegue. Evidencia e índices en docs/prometheus.md.

## Flecha móvil a la derecha — 16 de noviembre de 2026

El control Volver al inicio se fija al borde derecho, respetando safe-area-inset-right. Build público correcto en 16 rutas; posición visual pendiente de revisión en navegador. Evidencia en docs/prometheus.md.

## Portada sobre parallax — 16 de noviembre de 2026

Implementado localmente: presentación abierta sobre el lienzo de nodos mediante BlueprintWindows, dos columnas desde 64rem, espaciado ligado al contenido y ajuste para pantallas horizontales bajas. Botones principales y enlace secundario del hero incorporan terminales circulares, bordes redondeados y brillo al interactuar. Archify descartado por el propietario. TypeScript, 25/25 pruebas de contenido y build público (16 rutas) correctos. Pendiente revisión visual responsive en navegador; no se declara aprobación ni despliegue.

## Nodos del menú ajustados al texto — 16 de noviembre de 2026

A petición del propietario, cada SVG del menú se centra al 95 % del ancho de su etiqueta. El contenedor nav-label toma su ancho del texto; el SVG absoluto deja de imponer su tamaño intrínseco al enlace. El recorrido activo pasa de 1,233333 s a 2,466666 s por ciclo. Se conserva movimiento reducido. TypeScript y build público de 16 rutas correctos; revisión visual pendiente. Evidencia en docs/prometheus.md.

## Color de pestañas y CSS modular — 16 de noviembre de 2026

Corregido el fondo de las pestañas de tipos de trabajo: celeste primario `#87CEEB` en lugar del auxiliar `#DFEFF7`. `app/public.css` pasa de 2.051 líneas a una entrada de 16 líneas con 13 módulos en `app/styles/`, de hasta 374 líneas, manteniendo el orden de la cascada. Por instrucción expresa, los colores de los nodos permanecen intactos.

Verificación: comparación exacta del CSS compilado antes/después, con una única declaración modificada; build público y comprobación de 16 rutas correctos. No se acredita revisión visual ni despliegue. Organización documentada en `docs/design-and-motion.md`; evidencia e impacto en `docs/prometheus.md`.
