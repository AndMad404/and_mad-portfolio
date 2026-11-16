# Prometheus en el portafolio

## Instalación

Proyecto registrado en los perfiles compartidos de contexto, Dependency Reader y Dependency Editor de `C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA/.codex/`. Los hooks globales existentes consumen esos perfiles; no se duplican hooks ni se copia el motor al producto.

Los índices y las instrucciones de este proyecto viven aquí: `context-index.md`, `context-library/`, `dependency-index.json` y `AGENTS.md`. El mapa Dependency comienza con reglas respaldadas por los imports de las tres suites existentes: contenido, backend editorial y conector. El grafo de referencias se calcula por el motor; las reglas no lo duplican.

## Ciclo por incremento del roadmap

1. Seleccionar el siguiente trabajo en `ROADMAP.md` y leer su propietario.
2. Ejecutar el lector compartido con `--file <ruta>` por cada archivo previsto; revisar impacto, pruebas y relaciones desconocidas antes de editar.
3. Implementar el incremento. Usar Dependency Editor para incorporar o corregir únicamente relaciones técnicas demostradas por ese trabajo y sus pruebas.
4. Actualizar roadmap y esta evidencia cuando cierre un entregable. No registrar cada consulta sin cambios.
5. Ejecutar `node .codex/maintain-prometheus.mjs`: valida el índice, recalcula su snapshot y regenera el inventario con las exclusiones del perfil.
6. Repetir el lector sobre los archivos afectados, ejecutar pruebas pertinentes y comprobar el inventario con `node C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA/.codex/indexation-librarian/inventory-check.mjs --project Portafolio_And_Mad`.

## Límites

Esta carpeta no tiene repositorio Git. Se registró explícitamente `fileDiscovery.mode = filesystem`, con raíces acotadas. El lector no admite aquí `--diff` ni `--base`; no hay historial para detectar archivos eliminados. El CLI compartido `di init/update` requiere Git, por lo que el mantenimiento local reutiliza las funciones del motor con el mismo alcance de archivos del lector. Al incorporar Git, revisar la configuración antes de cambiar de modalidad.

La extracción estática puede no detectar referencias dinámicas, SQL o relaciones de compilación. La compilación pública (`npm run build`) verifica HTML, contenido y metadatos; las pruebas de producto se eligen según el incremento. Los índices no certifican QA visual ni despliegue remoto.

## Evidencia de instalación — 14 de noviembre de 2026

Configuración realizada por el agente a petición del propietario. El propietario indicó mantener Dependency conforme se consume el roadmap. No implica práctica autónoma demostrada por el propietario. Verificación: consultar el resultado del cierre de instalación en este chat; los comandos de mantenimiento son reproducibles desde la raíz.

Comprobaciones ejecutadas: el hook SessionStart reconoce el portafolio; el validador acepta el índice. Las pruebas de herramientas dieron 13 aprobadas y una impedida por EPERM al crear un enlace simbólico en Windows. No se cambió esa prueba ni el motor. El lector identificó consumidores directos y transitivos de contenido, backend y conector y seleccionó las tres suites del producto. El inventario se regenera después de los cambios concurrentes detectados durante la instalación.

## Revisión de animación para 4K — 15 de noviembre de 2026

El agente revisó el delta recibido tras el corte de sesión. Se conservó la entrada CSS del hero, proceso y encabezados. Se añadió entrada CSS a los bloques revelables, casos y detalles que ya pueden estar visibles al cargar en un viewport alto: el observer omite su primera notificación para evitar repetir la entrada tras hidratar. Las tarjetas llevan un escalonado de 300/380/460 ms y duración de 800 ms. El scroll posterior conserva IntersectionObserver y WAAPI. Movimiento reducido mantiene las anulaciones existentes. En ese punto la etiqueta temporal de diagnóstico permanecía pendiente de retirada; fue eliminada durante las iteraciones posteriores descritas abajo.

Verificación real ejecutada: `npm run verify`, salida 0; TypeScript, 15/15 pruebas, build público de nueve rutas y build privado. No hay evidencia de revisión visual ni del valor de matchMedia en el monitor del propietario; el navegador administrado estaba bloqueado. Comprobar 3840×2160 y el viewport efectivo con escalado del sistema, recarga completa, Tab, controles, scroll y movimiento reducido. No se declara VERIFIED visual.

## Cierre documental de diseño — 15 de noviembre de 2026

Actualización solicitada explícitamente por el propietario después de pausar las iteraciones visuales. El agente implementó los cambios; el propietario aportó capturas, criterios y correcciones. Esto acredita revisión dirigida del diseño, no dominio autónomo demostrado de React, animaciones o del mantenimiento de Prometheus.

### Alcance y estado conservado

- `app/root.tsx` y `app/public.css`: entrada de identidad «Andrés Madrigal» a «And_Mad», tilde convertida en guion y menú coordinado con la entrada de página. La duración común está configurada a 1400 ms. No se certifica sincronización visual medida.
- `app/components/PageMotion.ts` y estilos: revelado por scroll, entrada inicial para bloques visibles en pantallas altas y respeto a movimiento reducido. Retirada de la etiqueta de diagnóstico.
- `vite.config.ts`: caché pública `node_modules/.vite-public`, deduplicación de React/React DOM y dependencias de optimización declaradas. Aplicado tras reportes de 504 Outdated Optimize Dep e invalid hook call. La evidencia no permite atribuir todos los errores a una sola causa.
- `app/components/EditorialDemo.tsx` y `app/public.css`: tres pestañas con silueta de carpeta, colores propios y selección que reorganiza la activa a la izquierda. El cuerpo final es único y opaco; color, encabezado y filas pertenecen siempre al mismo estado. Se retiraron los cuerpos duplicados, el fundido entre textos y los temporizadores de la transición por etapas. El desplazamiento actual corresponde a las pestañas, no a tres carpetas completas.
- Correcciones de borde: lateral izquierdo sin escalón y recorte de las pestañas traseras para impedir la línea horizontal sobrante. Conservada la geometría de reposo acordada.

### Evidencia y límites

El último cambio de código pasó TypeScript y build público con comprobación de nueve rutas. El índice de dependencias pasó su validador sin modificaciones. La ejecución anterior de `npm run verify` aprobó 15 pruebas y ambos builds; es evidencia histórica, no una repetición de esas pruebas sobre cada iteración posterior.

Las capturas del propietario mostraron recortes, cuerpos ausentes, bordes sobrantes y mezcla visual durante versiones intermedias. Los ajustes posteriores no cuentan todavía con aprobación visual definitiva. El acceso automatizado al navegador estuvo bloqueado en esta sesión; no se sustituyó por pruebas unitarias ni se declaró VERIFIED visual. Sigue pendiente comprobar Edge, móvil, monitor 4K con su escalado, teclado/foco y movimiento reducido.

### Revisión de dependencias y documentación

Dependency Reader sobre los dos archivos de la interacción identifica `shared/motion.ts` como dependencia directa del componente, `app/routes/home.tsx` como consumidor del componente y `app/root.tsx` como consumidor de los estilos. No selecciona pruebas específicas para esos archivos. Se conservan las asociaciones existentes: no hay evidencia para agregar pruebas de animación inexistentes ni para duplicar imports en reglas.

Esta actualización modifica únicamente `ROADMAP.md` y `docs/prometheus.md`; ambos conservan ruta y responsabilidad ya registradas en `context-index.md`. No se crean documentos ni rutas. No se modifican índices, perfiles o asociaciones con esta autorización documental. El script `maintain-prometheus.mjs` escribe el snapshot y regenera inventarios: su ejecución y el reconocimiento del lote quedan pendientes de autorización explícita para ese mantenimiento, según el recordatorio de esta sesión.

### Reanudación

Ejecutar `npm run dev` desde la raíz y usar la URL de la terminal, normalmente `http://127.0.0.1:5173/`. API y Studio son procesos separados y no son necesarios para revisar el sitio público. El trabajo visual queda pausado por decisión del propietario; el despliegue real, Access/D1, ciclo editorial remoto y los hitos de Instagram/Meta permanecen pendientes según el roadmap.

## Efecto del mouse en negativo — 15 de noviembre de 2026

El propietario aclaró que debe cambiar únicamente el efecto que sigue al mouse. El agente retiró la inversión de la tarjeta completa y restauró su aspecto e interacción anteriores. En `app/components/ProjectCard.tsx` el círculo sigue al mouse sin texto; conserva un único requestAnimationFrame pendiente y limpieza al salir, cancelar, desmontar o activar movimiento reducido. En `app/public.css` usa fondo blanco y `mix-blend-mode: difference` para invertir solo los píxeles cubiertos. La portada aísla la mezcla y recorta el círculo en sus límites. Las carpetas del proceso editorial conservan su interacción original.

Dependency Reader confirma consumidores en portada y raíz, sin pruebas específicas. No se agregan asociaciones especulativas ni se duplican imports calculados por el motor. Con la autorización documental vigente se corrigen roadmap, diseño y esta evidencia y se recalcula el snapshot e inventario, conservando rutas y reglas existentes.

La política administrada impide inspeccionar localhost desde el navegador; no se afirma validación visual ni despliegue. `npm run typecheck` pasó. El primer build falló con EPERM al crear su carpeta de salida; el reintento autorizado pasó y verificó HTML, metadatos y separación pública en nueve rutas.

Refinamiento solicitado por el propietario: el indicador pasa a un halo de 112 px con forma orgánica y borde degradado. El centro conserva la inversión y la periferia la atenúa. Aparición de 160/220 ms por opacidad/escala y seguimiento de 85 ms; recorte, mezcla, limpieza y movimiento reducido se conservan. Cambios en los mismos dos archivos de producto, sin nuevas rutas ni asociaciones.
Verificación del refinamiento: TypeScript y build público correctos; HTML, metadatos y separación pública comprobados en nueve rutas. Revisión visual pendiente por la restricción de navegador ya documentada.

### Lupa de ampliación — mismo incremento

A petición posterior del propietario, el indicador se convierte en una lupa de 160 px y zoom 1,6×. `ProjectCard` renderiza una copia decorativa de `CaseCover` dentro de la lente con aria-hidden; la copia conserva viewTransitionName none. Las coordenadas del mouse y el ancho original determinan su traslación y escala. Se conserva el negativo con filter invert, ahora sobre la copia ampliada; una máscara radial suaviza el contorno orgánico. No se usa mix-blend-mode ni retardo de posición en esta versión para mantener alineada la ampliación. Se conservan el enlace, la limpieza, el único requestAnimationFrame pendiente y las preferencias de movimiento. Los párrafos anteriores describen las iteraciones sustituidas.

Mismos archivos de producto y consumidores de portada/raíz; sin nuevas rutas, dependencias de paquete o reglas declarativas. TypeScript y build público pasaron; HTML, metadatos y separación pública verificados en nueve rutas. QA visual sigue pendiente por política administrada del navegador.

Refinamiento líquido de la lupa: `lens-liquid` ondula el contorno y la máscara en ciclos de 2,4 s, con cuatro fases y deformación de hasta el 18 %, ampliada a petición del propietario. El centro, zoom y contenido permanecen alineados; solo se anima mientras la lente es visible y el sistema permite movimiento.

Verificación del refinamiento líquido: build público correcto, con HTML, metadatos y separación pública en nueve rutas. Cambio solo CSS; sin nuevas asociaciones o rutas. QA visual pendiente por la restricción de navegador documentada.

### Dirección del gesto y móvil

Petición del propietario: ralentizar el movimiento y vincular su forma a la dirección, también con drag móvil. La ondulación usa ahora ciclos de 3,4 s. La lente se orienta según la dirección del gesto, se estira hasta un 20 % según su velocidad y se relaja al detenerse. La imagen ampliada compensa la rotación para seguir derecha y alineada. En móvil, Pointer Events y captura permiten el arrastre horizontal; pan-y y pinch-zoom conservan scroll vertical y zoom nativos. La cancelación del navegador oculta la lupa. Un arrastre de más de 8 px impide abrir el caso por accidente, mientras un toque normal conserva el enlace.

Archivos: ProjectCard.tsx y public.css; consumidores de portada y raíz según Dependency Reader. Sin pruebas específicas registradas; no se agregan reglas especulativas. Un único requestAnimationFrame pendiente coordina posición y relajación, y termina cuando se estabiliza. Pendientes de QA real: cambios bruscos de dirección, alineación de la ampliación, toque frente a drag, cancelación por scroll, multitáctil, pérdida de captura y movimiento reducido. La política administrada sigue impidiendo verificar en navegador.
Verificación de dirección y soporte táctil: npm run typecheck y npm run build terminaron con salida 0; nueve rutas públicas verificadas. La comprobación de gestos en dispositivo sigue pendiente.

Corrección del contorno: máscara elíptica closest-side dentro de una caja invisible de 256 px; diámetro visible base de 160 px. Retirado el recorte rectangular del propio indicador. La deformación máxima conserva al menos 14,72 px de margen interior para evitar lados planos al estirarse. Se mantiene el centrado, zoom, negativo, ondulación de 3,4 s y soporte táctil existente.
Verificación del contorno: TypeScript y build público correctos; nueve rutas verificadas. Comprobación geométrica de los valores CSS confirma 14,72 px de margen mínimo con la deformación máxima. QA visual continúa pendiente por la restricción de navegador documentada. Sin nuevas rutas ni reglas de dependencias.


## Casos del CV maestro y prioridad editorial — 15 de noviembre de 2026

Trabajo solicitado por el propietario e implementado por el agente: lectura de la fuente profesional canónica, localización de proyectos y ampliación del contenido del sitio. No acredita práctica autónoma nueva del propietario.

### Alcance y procedencia

Archivos de producto: `content/published.json`, `app/routes/home.tsx` y `app/components/ProjectCard.tsx`. El snapshot contiene trece casos y tres servicios. La portada respeta su orden editorial; las tarjetas distinguen plataforma completada, experiencia, código público, implementación local, prototipo, planificación y fase futura.

| Casos | Fuentes inspeccionadas | Límite conservado |
| --- | --- | --- |
| Federación | Master ensamblado: `federacion-kendo`, declaraciones y evidencia de integración; README del repositorio fuente | Duración declarada de cuatro meses; sin inferir fecha final ni métricas; Calendar HTTP/ICS |
| Operación AEM e investigación del catálogo | `subaru-accenture`, especialmente `subaru-content-xml-*`, `subaru-qa-ticket-mentoring` | Implementación de las pruebas automatizadas atribuida a QA Automation Lead; sin datos empresariales publicados |
| ExcelBatch | `subaru-excelbatch-processing`, evidencia canónica de inspección y listado actual de archivos públicos | Tiempos aproximados declarados; macros no ejecutadas; sin trasladar el 83 % de Python |
| CleanTreeFlow | `subaru-cleantreeflow-xml` y script local | Un producto representativo por categoría; salida terminal; sin base de datos ni cambios al XML |
| WordPress | `simetria-digital` y aclaración actual del propietario | Experiencia laboral, sin capturas ni proyectos de cliente disponibles para mostrar |
| Prometheus | `core/README.md`, herramientas usadas en esta sesión y cierre de edición directa | Privado, implementación asistida; permisos Node no equivalen a aislamiento de código malicioso |
| Plataforma editorial | Código y contratos del portafolio, roadmap y operaciones | Trabajo local; Access/D1 remotos y ciclo HTTPS pendientes |
| Informes de auditoría | README y package.json de `web-audit-report-kit` | Pipeline específico de cliente; no se distribuyen informe ni recursos; sin reejecución de ese proyecto |
| Extractor | Contrato de uso y código de `prometeus/consultor.html` | Prototipo local; sin scraping, stock actual ni integración con FinanzaPro |
| Eventos de Combate | README e índice canónico del MVP | Planificación; repositorio inicial no acredita producto operativo |

La lista del conector GitHub confirmó visibilidad pública de Federación, ExcelBatch, CleanTreeFlow y Eventos de Combate; se conservaron privados Prometheus y los recursos internos. El CV maestro se ensambló con `readMaster()` desde su manifiesto; no se consultaron candidaturas históricas. La redacción conserva la estructura y tono del contenido existente.

### Dependencias e índices

Dependency Reader identifica `content/published.json → app/content.ts → rutas públicas` y el consumo del snapshot desde Studio. `ProjectCard → home` queda registrado como referencia estática. La regla `public-content` ya selecciona `tests/content.test.ts`; no se añaden reglas que dupliquen imports ni pruebas inexistentes. Validador del índice correcto antes del cambio.

Indexation Librarian: revisado el perfil compartido para este proyecto. No se crean ni mueven documentos; las ocho rutas nuevas son instancias de la ruta dinámica de proyectos y su fuente sigue siendo el propietario `content/published.json` ya enlazado por el índice raíz. Sin rutas documentales nuevas ni cambios de propiedad. Mantenimiento mecánico autorizado por el ciclo del incremento vigente.

### Estado operativo y límites de verificación

`wrangler whoami` informó que no hay autenticación; además no pudo escribir su log fuera del workspace. No se interpretó su salida 0 como autenticación válida. El conector confirmó el repositorio del portafolio con tamaño cero. Se integró el contenido localmente; no se ejecutó un despliegue ni se publicaron repositorios privados.

La consulta del tab local mediante CUA fue rechazada por la política administrada para localhost. No se intentó otro acceso al navegador. QA visual pendiente, incluida la longitud de las etiquetas y tarjetas en móvil. TypeScript, pruebas y HTML generado no sustituyen esa revisión.


### Verificación final del incremento

- `npm run typecheck`: salida 0 sobre los tres archivos de producto finales.
- `npx tsx --test tests/content.test.ts`: tres pruebas aprobadas tras actualizar el snapshot y el orden; comprueban contrato, rutas históricas, salida escapada, Worker y galerías. El ajuste posterior de las etiquetas se comprobó mediante el build y el HTML final.
- `npm run build`: salida 0 sobre el estado final; HTML, metadatos y separación pública comprobados en 17 rutas.
- Comprobación adicional del artefacto: trece rutas de casos presentes, orden de los enlaces igual al snapshot, estados de completado/futuro/sin muestras en HTML y ausencia de rutas privadas o patrones de token en las fichas.
- `node .codex/maintain-prometheus.mjs`: 80 archivos fuente, 74 relaciones; inventario de 74 entradas, sin altas, bajas, movimientos ni artefactos regenerados. Reglas declarativas conservadas.
- Dependency Reader posterior: confianza alta, consumidores públicos y Studio identificados, prueba de contenido seleccionada, ninguna relación no resuelta identificada dentro del alcance estático.
- `inventory-check.mjs --project Portafolio_And_Mad`: CONSISTENT.

No se volvió a ejecutar la batería completa del backend o conector: no cambiaron sus contratos ni implementación. No se da por aprobado el diseño en navegador ni por publicado el sitio en Internet.


## Ajuste editorial — 15 de noviembre de 2026

A petición del propietario, se retira la ficha pública de Prometheus y se posponen las menciones a asistencia por IA en Federación, perfil y plataforma editorial. Permanecen doce casos y tres servicios; el caso editorial conserva el alcance personal de definición y revisión y el límite de aprendizaje. La documentación privada y las herramientas de mantenimiento conservan sus responsabilidades. Se retira también la etiqueta de la ficha eliminada. Sin nuevas relaciones técnicas ni rutas documentales: las reglas existentes cubren el snapshot; se mantiene el inventario mecánico.

## Alternancia de casos — 15 de noviembre de 2026

El agente ajustó `app/public.css` por solicitud del propietario: imagen a la izquierda en casos impares y a la derecha en pares desde 64rem, incluida la copia de la lupa. No cambia el orden móvil ni el contenido editorial.

Dependency Reader: `app/public.css → app/root.tsx` por referencia estática, confianza alta tras corregir el desfase del snapshot mediante el mantenimiento local. Sin pruebas específicas registradas ni relaciones no resueltas; no se agregan reglas que dupliquen esa referencia. El inventario incorporó cuatro archivos preexistentes de Blueprint (app y shared), sin cambios de propietario ni nuevas rutas documentales.

Verificación: `npm run typecheck` correcto; `npm run build` correcto y 16 rutas verificadas tras reintentar con permisos de ejecución el EPERM inicial al crear la salida del servidor. QA visual en navegador pendiente. Se ejecuta el mantenimiento local al cerrar y se vuelve a comprobar el impacto del CSS.

## Hidratación de enlaces con fragmento — 15 de noviembre de 2026

El propietario aportó un aviso de React con diferencias en `data-paused` del fondo y `aria-current` del menú. El agente encontró que ambos atributos en `app/root.tsx` consumían directamente `location.hash`, mientras la portada ya esperaba al montaje. Los fragmentos no forman parte de la petición HTTP. La raíz ahora comienza con un fragmento vacío en SSR y durante el primer render del cliente, y aplica el fragmento actual del router tras el montaje. No se suprime el aviso de React ni se modifica el fondo compartido.

Dependency Reader sobre raíz, roadmap y esta evidencia: confianza alta, dependencias directas en BlueprintBackground, BlueprintWindows, PageMotion, estilos y movimiento compartido; sin dependientes inversos ni pruebas específicas identificadas. Esto limita la cobertura conocida y no prueba ausencia de impacto. La suite de contenido existente se ejecutó como regresión de portada y fondo, sin añadir asociaciones de pruebas de hidratación inexistentes ni duplicar imports. Índice válido antes del cambio; reglas declarativas conservadas. Indexation Librarian confirma que no se crean, mueven o retiran rutas ni cambian propietarios; se ejecuta el mantenimiento mecánico del ciclo autorizado.

Verificación: `npm run typecheck`, `npx tsx --test tests/content.test.ts` (16/16) y `npm run build` (16 rutas públicas) terminaron con salida 0. Sin comprobación en navegador en este incremento: queda pendiente recargar enlaces de caso, servicio y sección, confirmar la ausencia del aviso y comprobar atrás/adelante y los atributos tras hidratar. No acredita despliegue ni aprobación visual.

## Modal sobre un único parallax — 15 de noviembre de 2026

Implementado por el agente según la aclaración del propietario: se reutiliza el fondo de página, sin montar otro BlueprintBackground en EntryView inline. La ventana del modal es transparente; el texto usa una composición compacta, lateral desde 64rem y debajo de la ventana en móvil. CSS :has(.entry-modal[open]) oculta las superficies de página únicamente durante la apertura real del diálogo. Se retira la pausa del fondo en app/root.tsx y el desenfoque/velo del backdrop; se conservan cierre, foco y desplazamiento del detalle existentes.

Impacto revisado con Dependency Reader sobre app/public.css, app/root.tsx, shared/EntryView.tsx, ProjectCard y tests/content.test.ts, además de roadmap y evidencia: confianza alta, rutas públicas y Studio como consumidores; Studio usa EntryView sin inline, por lo que conserva su portada. La regla public-content ya selecciona la suite de contenido para EntryView. Dependency Editor: sin nuevas asociaciones declarativas; no se duplican imports. Indexation Librarian: perfil compartido coincide con la raíz autorizada; no se crean, mueven ni retiran documentos ni rutas, y no cambian propietarios. Se mantiene el inventario mecánico mediante el comando local autorizado.

Verificación: npm run typecheck correcto; npx tsx --test tests/content.test.ts, 19/19; npm run build correcto, 16 rutas públicas. La prueba existente del detalle inline ahora confirma la ventana transparente y ausencia de un segundo fondo. El lector documental informó READ_BUDGET_EXCEEDED para las selecciones de diseño/roadmap: no se amplió su presupuesto y el cambio se contrastó con código y consultas acotadas.

Límite: CUA rechazó acceder a http://127.0.0.1:5173 por política administrada del origen, incluso estando la revisión autorizada por el propietario. No se intentó eludir esa restricción. Pendientes: revisión visual en tamaños reales, continuidad del fondo entre ventana y exterior, teclado y cierre. Sin despliegue.

## Capa de contenido: cierre de los puntos 1 y 2 — 15 de noviembre de 2026

El propietario pidió definir el objetivo y ejecutar solo análisis y depuración, entregando resultados antes del SEO técnico. Se integró el traspaso READY_FOR_INTEGRATION de otra sesión con los cambios de portada y detalle ya realizados por Codex. Se conservaron el orden de servicios antes de casos y los enlaces de contacto existentes. La estrategia y su auditoría pertenecen a [content-seo-strategy.md](content-seo-strategy.md); no se duplica aquí su matriz editorial.

### Cambio comprobado

- Snapshot: doce casos, tres servicios, IDs/slugs/tipos y orden conservados; release `contenido-depurado-2026-11-15`, contrato v1. Los quince límites genéricos se sustituyen por condiciones propias. Decisiones: 46 a 33. Texto de fichas: 2.513 a 1.967 palabras contando campos narrativos y etiquetas de evidencia, sin tags/URLs. Es una medida de depuración, no de rendimiento ni de impacto comercial.
- Portada: acceso a servicios y experiencia, método de colaboración, perfil con capacidades transversales y contacto para proyectos o equipos. Se retiran la lista de tecnologías duplicada del encabezado y los cuatro relatos de proyectos del perfil; dos bloques nuevos explican colaboración y transferencia de conocimiento con respaldo en el CV.
- Detalle: «Cómo lo abordo» en servicios, omisión de decisiones y tags vacíos, numeración consecutiva. Centrificador deja de renderizar decisiones repetidas; EvidenceGallery ya omitía referencias vacías. El comportamiento aplica al modal, páginas independientes y vista previa del panel.
- Las advertencias de tiempos y atribuciones permanecen visibles en límites. Las pruebas de .content.xml se atribuyen a QA Automation Lead. Asistencia por IA excluida por decisión editorial, no por ausencia en el CV. El propietario confirmó 2018–2019 para el rendimiento WordPress; Core Web Vitals se vincula a Federación. No se modificó el Master.

### Impacto y mantenimiento

Dependency Reader identificó el área pública y las cadenas `published.json → app/content.ts → rutas` y `published.json → studio/main.tsx`; EntryView también afecta a ProjectCard, rutas y Studio. Confianza alta dentro del análisis estático, sin relaciones no resueltas identificadas; esto no demuestra corrección visual. El primer intento incluía el documento todavía inexistente y fue rechazado; se repitió sobre archivos existentes y después sobre el conjunto completo.

La regla `public-content` incorpora `app/routes/home.tsx` para seleccionar explícitamente `tests/content.test.ts` cuando cambie la portada. Evidencia: esa prueba importa Home y comprueba anclas, orden, modales y rutas. No se añadieron aristas que dupliquen imports ni dependencias de funciones futuras. El índice pasó validate.mjs antes y después de la edición.

Indexation Librarian: el perfil compartido coincide con esta raíz; se conserva la nueva ruta documental de estrategia en context-index.md, autorizada por el pedido de documentación. `node .codex/maintain-prometheus.mjs` terminó con 85 archivos, 88 relaciones e inventario de 79 entradas. Añadió únicamente `docs/content-seo-strategy.md` al inventario y regeneró su área docs y el índice mecánico; no retiró ni movió entradas. La estrategia es documentación interna y no se añade al snapshot público.

Comprobación posterior: inventory-check.mjs devuelve CONSISTENT (79 entradas); Dependency Reader conserva confianza alta, selecciona la prueba de contenido y no identifica relaciones no resueltas para el conjunto final.

### Verificaciones ejecutadas

- JSON válido; comparación con la lectura inicial confirma IDs, slugs, tipos y orden preservados.
- `npm run typecheck`: correcto.
- `npx tsx --test tests/content.test.ts`: 22/22. Incluye las dos pruebas aportadas en el traspaso (higiene y rótulo de servicios) y la prueba de omisión de colecciones vacías en detalle independiente/inline. No se relajaron para aprobar el contenido.
- `npm run verify`: salida 0, 34/34 pruebas y builds del público y Studio. El primer intento aislado falló en los hooks de Miniflare por `fetch failed`; la repetición autorizada con sockets locales pasó. No se corrigió código para ocultar el fallo del entorno.
- Build: 16 rutas con texto completo, metadatos presentes, enlaces de navegación y separación pública según verify-build.ts. Esta comprobación no acredita el SEO técnico futuro ni mide Core Web Vitals.
- Huellas SHA-256 iguales a las previas para app/content.ts, scripts/finalize-site.ts, react-router.config.ts, shared/contracts.ts, EditorialDemo, CaseCover y app/public.css: sin cambios en lógica SEO, contrato, ilustraciones ni estilos. Los títulos y resúmenes depurados sí llegan a los metadatos mediante el mecanismo existente.

**Límite y punto de revisión:** CUA intentó observar el tab existente de localhost y la política administrada rechazó el origen. No se usó otro navegador ni una vía indirecta. QA visual, móvil/escritorio, foco y movimiento reducido siguen pendientes. No se desplegó ni activó indexación. Los filtros (24 más Todos), el titular de marca y el punto 3 quedan a revisión del propietario; este registro cierra solo el trabajo técnico de 1 y 2.

## Capa de contenido: cierre técnico del punto 3 — 15 de noviembre de 2026

Tras revisar el corte anterior, el propietario eligió ocho áreas de filtro, conservación de tecnologías y enlaces antiguos, y mantener el titular simplificando el texto circundante. Autorizó explícitamente el cierre documental y el mantenimiento de índices; después pidió actualizar este punto y frenar. El trabajo queda detenido al terminar este registro, sin iniciar la revisión visual ni publicar.

### Implementación y evidencia

El agente modificó app/content.ts, app/routes/home.tsx, content/published.json, scripts/finalize-site.ts, scripts/verify-build.ts y tests/content.test.ts. Se conservan doce casos, tres servicios, IDs, slugs, rutas y contrato v1; release contenido-seo-2026-11-15. La estrategia contiene la resolución editorial y la taxonomía aprobada, sin duplicarlas aquí.

La fuente centraliza identidad, ocho áreas y selección compatible con etiquetas antiguas. La portada aplica filtros después de hidratar y conserva enlaces de todos los casos en HTML. Los metadatos por ruta comparten la identidad Andrés Madrigal / And_Mad, títulos/descripciones únicos y, cuando existe origen configurado, canónica y un grafo WebPage/WebSite/Person. La evidencia añadida sobre rendimiento, SEO técnico, accesibilidad y animaciones procede del CV; no son nuevas mediciones ni certificaciones. WordPress conserva 2018–2019 sin Core Web Vitals. No se modificaron el Master CV, las ilustraciones ni los estilos en este punto.

### Verificación realizada

- npm run verify terminó con salida 0: 36 pruebas y builds del sitio público y Studio. Las dos pruebas nuevas verifican cobertura de las ocho áreas, selección exacta de todas las etiquetas anteriores y HTML inicial con todos los casos antes de hidratar.
- scripts/verify-build.ts comprueba las 16 rutas: contenido y enlaces, título/descripción únicos y derivados de la fuente, robots, canónicas, grafo único y referencias internas, metadatos sociales, dimensiones de la imagen, sitemap y release. Conserva la comprobación de separación pública.
- Tres ejecuciones adicionales de npm run build terminaron correctamente: SITE_ORIGIN=https://portfolio.example con INDEXABLE=true; el mismo origen con INDEXABLE=false; y sin origen con INDEXABLE=false. Son configuraciones de compilación locales, no publicaciones ni consultas al dominio. Registros en build/seo-indexable.log, build/seo-preview.log y build/seo-local.log. La última salida mantiene robots con Disallow: /.
- No se repitió QA visual: el origen local continúa bloqueado por la política administrada del navegador. Las pruebas de SSR no demuestran el comportamiento interactivo completo, foco, móvil ni movimiento reducido. Tampoco se midieron Core Web Vitals reales ni posicionamiento.

### Mantenimiento autorizado

Dependency Reader identifica el área de contenido público: app/content.ts depende de published.json y contracts.ts; lo consumen las tres rutas y los scripts de finalización/verificación. tests/content.test.ts importa directamente la selección de filtros. Por esa evidencia se añade app/content.ts a la regla public-content para seleccionar esa suite, conservando las asociaciones anteriores y sin duplicar imports mediante reglas nuevas.

El índice declarativo era válido y el inventario consistente con 79 entradas. El lector previo a regenerar señaló graphSnapshot: dependency-index-drift por las referencias nuevas. El mantenimiento local regenera el snapshot técnico y el inventario; la comprobación posterior se registra debajo. No se crean, mueven ni retiran documentos, rutas de contexto ni propietarios. Se mantienen la ruta existente de la estrategia y el perfil compartido dentro de la raíz autorizada.

Comprobación final del cierre documental, 16 de noviembre de 2026: maintain-prometheus.mjs terminó con 85 archivos y 91 relaciones; inventario de 79 entradas, sin altas, bajas, movimientos ni artefactos regenerados. validate.mjs confirmó índice válido; inventory-check.mjs devolvió CONSISTENT. Dependency Reader volvió a confianza alta, seleccionó tests/content.test.ts y no identificó relaciones sin resolver. La suite seleccionada pasó 24/24 después del mantenimiento. Trabajo detenido aquí por instrucción del propietario; permanece pendiente el cierre visual del punto 4.

## Recorrido por bloques y contacto — 16 de noviembre de 2026

El agente ajustó home, root, PageMotion y estilos públicos según las tres capturas del propietario. La aclaración posterior delimita la retirada a «Una ficha / dos momentos»; método y Perfil permanecen. Contacto pasa al footer compartido con sus enlaces originales. No cambia el snapshot, los casos, las rutas ni los contratos editoriales.

La navegación agrupa presentación, servicios completos y encabezado/filtros/primera ficha de casos. Recalcula los límites desde el DOM, incluido el primer caso visible tras filtrar; las siguientes fichas conservan paradas. Los bloques altos permiten desplazamiento nativo dentro de sus límites y entrada por el extremo correspondiente al sentido. La transición de rueda dura 600 ms sin la pausa inicial; solo opera en portada con puntero fino y movimiento permitido. Táctil usa snap de proximidad y omite la primera tarjeta como parada separada. El detalle independiente no intercepta la rueda hacia el footer. Modales y movimiento reducido conservan el desplazamiento nativo.

Dependency Reader: confianza alta; PageMotion y public.css tienen a root como consumidor, y tests/content.test.ts importa los cálculos de scroll. No identifica relaciones sin resolver dentro de su alcance estático. La regla public-content añade PageMotion para seleccionar explícitamente la prueba que ahora comprueba lectura completa, regreso y límites; no se duplican imports como relaciones declarativas. El índice era válido antes de editar. Indexation Librarian confirma el perfil y raíz autorizados; no se crean, mueven ni retiran rutas documentales. Se actualizan únicamente los propietarios existentes y el inventario/snapshot mediante maintain-prometheus.mjs.

Verificación: npm run typecheck; npx tsx --test tests/content.test.ts (25/25); npm run build (16 rutas). El verificador conserva las anclas y comprueba footer único de contacto con ambos enlaces en cada ruta, además de la ausencia de la comparación en portada. No se modificaron backend ni Studio. El navegador integrado rechazó http://127.0.0.1:5173 por política administrada; no se usaron vías alternativas. Pendientes: revisión visual móvil/escritorio, rueda real y trackpad, teclado, foco y movimiento reducido. Sin despliegue ni aprobación visual.

Cierre del incremento: maintain-prometheus.mjs registró 85 archivos y 91 relaciones; inventario de 79 entradas, sin altas, bajas ni regeneraciones documentales. validate.mjs aceptó el índice e inventory-check.mjs devolvió CONSISTENT. El lector final conserva confianza alta y selecciona tests/content.test.ts. La comprobación final pasó TypeScript y 25/25 pruebas. El segundo build encontró EPERM al crear build/site/server/.vite; el reintento autorizado fuera del sandbox terminó correctamente y verificó las 16 rutas. No se cambió código para ocultar ese fallo del entorno.

## Flecha móvil a la derecha — 16 de noviembre de 2026

Cambio solicitado por el propietario: app/public.css sustituye left por right y safe-area-inset-left por safe-area-inset-right en .back-to-top. Se conserva el comportamiento y la visibilidad del control. Dependency Reader identifica app/root.tsx como consumidor por static-reference, confianza alta, sin pruebas específicas ni relaciones no resueltas. No hay nuevas relaciones que registrar ni cambios de rutas documentales. npm run build terminó con salida 0 y verificó las 16 rutas. No se realizó revisión visual ni despliegue.

## Cierre de datos y SEO con revisión visual aplazada — 16 de noviembre de 2026

El propietario reanudó el objetivo y después indicó «sigue, esto quedara para despues» ante la revisión manual propuesta. Se cierra el alcance técnico de datos y SEO y se conserva la revisión visual/interactiva como trabajo posterior, sin declararla aprobada. Continúan fuera del incremento ilustraciones, versión inglesa, publicación y medición de posicionamiento real.

Antes de cerrar, npm run verify terminó con salida 0 sobre el estado que incorpora navegación por bloques, footer compartido y flecha móvil: TypeScript, suite completa y builds público/Studio correctos. El verificador del build público volvió a pasar después, contrastando 16 rutas con la fuente. Auditoría directa del snapshot: 12 casos, 3 servicios; 15 IDs, slugs, títulos, resúmenes y límites únicos; sin «Pendiente de confirmar» ni ficha pública de Prometheus. Centrificador es la única entrada sin decisiones y conserva la omisión del bloque. Release contenido-seo-2026-11-15 sin cambios.

CUA localizó la pestaña actual del portafolio, pero getTab volvió a rechazar http://127.0.0.1:5173 por política administrada, pese al aviso de habilitación del propietario. No se observó la página ni se intentó otra vía. Quedan para después móvil/escritorio, filtros tras hidratar y enlaces históricos, modales, teclado/retorno de foco, rueda/táctil y movimiento reducido. No se atribuyen resultados de esa revisión al agente ni al propietario.

El ajuste final afecta únicamente ROADMAP.md, docs/content-seo-strategy.md y este registro, dentro del cierre documental ya autorizado. Dependency Reader informa confianza alta, sin dependencias, pruebas específicas ni relaciones sin resolver identificadas para esos documentos; es un límite del análisis estático, no una prueba de QA. Dependency Editor revisa el cambio sin proponer nuevas asociaciones. Indexation Librarian conserva rutas y propietarios: no se crean, mueven ni retiran archivos. Se ejecuta el mantenimiento mecánico y se comprueba la consistencia al cerrar.

Resultado del mantenimiento final: 85 archivos y 91 relaciones; inventario CONSISTENT con 79 entradas, sin altas, bajas, movimientos ni regeneraciones. Índice de dependencias válido y asociaciones conservadas.

## Portada sobre parallax — 16 de noviembre de 2026

Alcance: app/public.css y app/components/BlueprintWindows.tsx. Dependency Reader previo: confianza alta, consumidor app/root.tsx por static-reference y tests/content.test.ts para las ventanas; sin relaciones no resueltas identificadas. El área funcional es presentación pública. Los documentos existentes ROADMAP, diseño y este registro no tienen dependientes estáticos identificados; eso no acredita ausencia de impacto visual. Dependency Editor revisó las asociaciones: no se agregan reglas porque no hay relaciones nuevas y las importaciones ya seleccionan la suite. Indexation Librarian conserva rutas, propietarios y archivos existentes bajo la raíz registrada.

Verificación: TypeScript correcto, pruebas seleccionadas 25/25 y build público con 16 rutas. El primer build encontró EPERM al crear server/.vite; el reintento autorizado fuera del sandbox pasó. No se realizó revisión visual en navegador ni despliegue. Pendiente contrastar portada y controles en móvil vertical/horizontal, tablet y escritorio. Archify no se utilizó por instrucción expresa del propietario.

## Nodos del menú ajustados al texto — 16 de noviembre de 2026

Cambio realizado por el agente en app/root.tsx y app/public.css: etiqueta con contenedor propio y SVG absoluto centrado al 95 % de su ancho, con altura proporcional. Esto elimina la contribución intrínseca del SVG al ancho del enlace. Duración del nodo activo duplicada de 1,233333 s a 2,466666 s; no cambia el recorrido de Volver al inicio.

Dependency Reader confirma app/public.css → app/root.tsx mediante referencia estática, sin pruebas declaradas para estos archivos. Dependency Editor revisó las reglas existentes: no hay nuevas relaciones técnicas que registrar ni imports que duplicar. TypeScript correcto. Build público y verificación de HTML/metadatos en 16 rutas correctos tras repetir con permisos la primera ejecución, que falló por EPERM al crear build/site/server/assets. Sin revisión visual de este ajuste ni despliegue. Se ejecuta el mantenimiento local y la comprobación del inventario al cerrar.

## Color de pestañas y CSS modular — 16 de noviembre de 2026

El propietario señaló el tono incorrecto de la pestaña CMS y el tamaño de la hoja de estilos, y pidió conservar los colores de los nodos. El agente cambió únicamente el fondo de `.public-site .project-card .work-type-title`, de `--color-surface-sky` a `--color-sky`. Dividió las 2.051 líneas de `app/public.css` en 13 módulos contiguos bajo `app/styles/`; la entrada tiene 16 líneas y el módulo mayor 374. Los cortes respetan reglas completas y el orden original, incluidos ajustes posteriores y media queries.

Impacto: presentación pública, consumida por `app/root.tsx`. Dependency Reader detectó inicialmente `graphSnapshot: dependency-index-drift`; se validó el índice y se regeneró mediante el mantenimiento local antes de editar, recuperando confianza alta. No hay pruebas CSS declaradas. El lector identifica la referencia de root a public.css, pero no recorre los nuevos `@import` CSS: el impacto de los módulos hasta public.css y root se verificó directamente en la entrada y en el resultado compilado. Esa limitación se conserva explícita; no se modifica el motor compartido ni se duplican imports en reglas. Dependency Editor revisó las reglas y no añadió asociaciones especulativas.

Comprobaciones: concatenar los módulos reproduce exactamente el CSS original salvo la declaración autorizada; el CSS compilado antes/después también es idéntico salvo esa declaración. Las huellas SHA-256 de `shared/tokens.css`, `shared/presentation.css`, `shared/BlueprintBackground.tsx` y `app/root.tsx` permanecen iguales. Evidencia local excluida de publicación en `build/color-review/`. `npm run build` pasó y verificó las 16 rutas; el intento previo al cambio había fallado por EPERM al crear server/assets y el build final se ejecutó con permisos. No se agregaron pruebas que repitan la implementación. Sin revisión visual en navegador ni despliegue.

Indexation Librarian: perfil y raíz autorizados comprobados; se conservan la ruta de diseño y los propietarios existentes. Se documentó la organización en `docs/design-and-motion.md`; los módulos nuevos se incorporan al inventario mecánico mediante `maintain-prometheus.mjs`. Se mantienen los tokens compartidos como fuente de la paleta.


## Cierre acumulado autorizado — 16 de noviembre de 2026

El propietario respondió «si» a la propuesta de actualizar documentación e índices tras el rediseño y la mejora semántica. Se cierra el lote acumulado de portada, cuatro tipos de trabajo y experiencias, ventanas del parallax, navegación por bloques, menú y enlaces externos, retícula compartida, perfil/método unificados y JSON-LD Service. El estado vigente se sintetiza al comienzo de ROADMAP.md, docs/design-and-motion.md y docs/content-seo-strategy.md; los registros previos se conservan como historial. Las ediciones más recientes de pestaña celeste, velocidad del menú y modularización CSS se preservan.

Área: presentación y contenido públicos, con estilos y componentes compartidos con Studio. Evidencia: imports de root a estilos, movimiento y fondo; BlueprintEnergy alimenta BlueprintBackground, Layout y Studio; published.json alimenta app/content, rutas, metadatos y Studio. Las pruebas de contenido verifican esas superficies. No se crean rutas ni propietarios documentales nuevos.

Al revisar el estado actual se encontró un fallo de prueba tras dividir public.css: la prueba de márgenes leía solo la entrada @import; la de retícula podía pasar sin examinar los módulos. Se adaptó tests/content.test.ts para resolver recursivamente imports CSS locales en orden, con límite a app y detección de ciclos, y comprobar que llegan reglas reales. No se cambia el CSS ni se revierte la división para resolver el fallo. La suite seleccionada vuelve a pasar 33/33 y TypeScript es correcto.

Dependency Editor validó el índice antes de editar y añadió a public-content únicamente relaciones declarativas de prueba demostradas: app/public.css, app/styles/**, shared/tokens.css y shared/presentation.css se leen mediante el guard; shared/BlueprintBackground.tsx y shared/BlueprintEnergy.ts se importan y se contrastan con la unidad del grid. No se duplican imports como relaciones del código ni se eliminan asociaciones previas. El lector no sigue los @import CSS como aristas técnicas: la selección de pruebas por la regla y el resolvedor local de la suite cubren esa frontera conocida, sin alterar el motor de Prometheus.

Indexation Librarian confirma Portafolio_And_Mad y su raíz autorizada en el perfil compartido. Se conservan archivos, rutas de contexto y propietarios; se regenera solo el inventario local y el snapshot mediante .codex/maintain-prometheus.mjs. No se escribe en el perfil ni en proyectos vecinos. Se comprueba el impacto de todos los archivos del lote por rutas explícitas, sin Git.

La última verificación funcional anterior a este cierre pasó 45 pruebas, TypeScript y builds público/Studio; el build con origen HTTPS de prueba verificó el grafo SEO en 16 rutas y se restauró el build local. En este cierre se repetirá la verificación sobre el CSS modular y las pruebas adaptadas. La revisión visual/interactiva permanece pendiente: no se observó el resultado en navegador ni se declara aprobado, desplegado o con resultados SEO medidos.
