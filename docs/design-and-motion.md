# Del contenido a la evidencia

## Diseño vigente — 16 de noviembre de 2026

Este apartado sustituye las descripciones de iteraciones anteriores para el comportamiento actual. El propietario autorizó este cierre documental; los registros históricos se conservan debajo.

La portada tiene Servicios, cuatro tipos de trabajo y un único Perfil y forma de trabajar, además del footer compartido. Las carpetas agrupan experiencias, no representan cuatro proyectos aislados. Sus títulos ocupan pestañas celestes; todas presentan texto a la izquierda y una ventana al parallax a la derecha. En móvil se lee el texto primero. No hay ilustraciones conceptuales en esas ventanas; su contenido superpuesto queda por diseñar. Los detalles de experiencias conservan sus rutas y modales.

Perfil agrupa presentación, colaboración, conocimiento compartido y un proceso ordenado de cuatro pasos: acordar, construir, comprobar y entregar. Un h2 identifica la sección; h3 identifica los grupos y el proceso, y h4 sus pasos. Servicios es una lista. Los separadores son trazos cortos con terminales de nodos, sin las líneas largas de tabla. Un solo contenedor controla cada separación mediante gap y se retiran márgenes de sus hijos para evitar acumulaciones.

ENERGY_CELL en shared/BlueprintEnergy.ts define la unidad de 40 px CSS. Layout del sitio y entrada de Studio exponen --grid-unit; BlueprintBackground también la recibe para renders aislados. El SVG, canvas y CSS consumen esa unidad. shared/tokens.css deriva subdivisiones de 5, 10, 20 y 30 px y múltiplos; la retícula pasa por 4, 8 y 12 columnas. Desde 64 rem las doce pistas se anclan a las líneas de nodos: cada línea n·paso se redondea a un múltiplo de la unidad, la separación es una celda y la última pista absorbe el resto, de modo que el inicio y el final de cada columna caen sobre un nodo. El borde de 1 px de un contenedor de rejilla no ocupa layout (anillo interior), porque desplazaría su contenido fuera de la retícula. La alineación es horizontal; la vertical depende de la altura del contenido y no está garantizada. Móvil usa subdivisiones para conservar lectura y controles táctiles. Tipografía, bordes y geometría de ilustraciones no se fuerzan a una altura de texto múltiplo de 40.

app/public.css es una entrada ordenada a 13 módulos en app/styles/. shared/tokens.css y shared/presentation.css continúan compartidos con Studio. Las pruebas deben resolver los imports locales en orden; leer únicamente la entrada vacía de reglas produciría una verificación incompleta. No se alteran los colores del parallax al mantener esta organización.

Rueda, Page Up/Page Down y arrastre vertical con mouse usan las mismas paradas en portada. Táctil y barra nativa se ajustan a una parada al finalizar; hay posiciones intermedias solapadas dentro de bloques altos. Modales y controles editables conservan interacción propia. Movimiento reducido mantiene las paradas con cambio inmediato y oculta las luces viajeras. Esto está implementado y comprobado por pruebas de cálculo, no aprobado mediante gestos reales.

El menú sigue la mayor sección visible bajo la cabecera, con prioridad de Contacto al final de la página. Cada etiqueta tiene debajo una línea de nodos al 95 % del ancho del texto; las inactivas permanecen apagadas y la activa se recorre en 2,466666 s tras el ajuste posterior. La flecha de retorno mantiene su forma y un nodo recorre el trazado. Los enlaces externos incorporan target=_blank y rel=noopener noreferrer.

BlueprintWindows solo recorta una sección con sus ventanas descendientes y visibles. Excluye diálogos, lentes y detalles cerrados; sigue las animaciones finitas de secciones y contenido. La regresión comprueba que ventanas ajenas o fuera de los límites no abran huecos sobre otros textos.

Pendiente revisar en navegador móvil vertical/horizontal, tablet, escritorio y zoom: retícula, pestañas, ventanas, contraste, scroll/drag/teclado, menú, foco, modales, movimiento reducido y footer compacto. No se declara aprobación visual ni despliegue.

Implementación local: 14 de noviembre de 2026. El diseño traduce la propuesta visual aprobada a componentes React, con fondo claro frío, texto oscuro y detalles pixelados. La tipografía principal es la pila sans del sistema; las etiquetas usan monospace. No se descargan fuentes, imágenes ni motores de animación de terceros.

## Paleta personal

El propietario eligió tres tonalidades de sus ojos como colores principales:

| Color | Valor exacto | Uso |
|---|---|---|
| Azul celeste | `#87CEEB` | Botones con texto oscuro, contacto y superficies destacadas |
| Azul acero | `#4682B4` | Título grande, marcas pixeladas, ilustraciones y bordes de controles |
| Azul grisáceo | `#8A9CA8` | Detalles, sombras gráficas, bordes y texto secundario sobre fondo oscuro |

Los tokens se definen en `shared/tokens.css` y alimentan el sitio, las ilustraciones y la vista previa del panel. El favicon usa los mismos valores. Se complementan con fondos claros y tinta `#17242E`; los enlaces pequeños usan una variante oscura `#305D80` para conservar contraste. No se utiliza blanco para texto pequeño sobre celeste o acero. Contrastes calculados: tinta/celeste 9.08:1, tinta/gris azulado 5.57:1 y enlaces/fondo `#F4F7F9` 6.50:1. Estos cálculos no sustituyen la revisión visual en navegador.

## Organización del CSS público

`app/public.css` es la entrada de estilos y conserva el orden de carga de los módulos en `app/styles/`. La separación mantiene la cascada anterior: base, presentación y demo, contenido, movimiento y breakpoints, marca y tarjetas, carpetas editoriales, modal, lienzo y contacto, distribución de página, nodos de navegación, tipos de trabajo, rejilla responsive y servicios/perfil. Los ajustes posteriores siguen después de sus reglas base.

Las pestañas de tipos de trabajo, incluida «CMS: plantillas y contenido», usan el celeste primario `--color-sky` (`#87CEEB`) en [work-types.css](../app/styles/work-types.css), no el tono auxiliar `--color-surface-sky`. Los colores de los nodos se conservan por instrucción del propietario; sus reglas de navegación están en [navigation-nodes.css](../app/styles/navigation-nodes.css). Los tokens compartidos y el dibujo del lienzo no se modifican en este ajuste.

## Contenido y alcance

### Mobile first hasta 4K

La base de CSS es una columna, navegación visible en dos filas y controles con al menos 44 px de alto. Las mejoras de distribución usan `min-width` en rem: 40 rem para escalonar las tarjetas del proceso, 48 rem para dos columnas de casos y comparación, 64 rem para dividir hero, servicios y perfil, 120 rem para ampliar el detalle y 160 rem para tres columnas de casos. Se retiraron las correcciones de distribución basadas en `max-width` de las tres hojas de estilos activas.

El contenedor público tiene un máximo de 192 rem (3072 px con fuente base de 16 px), márgenes fluidos y espacio para las áreas seguras del dispositivo. En 4K no se estiran los párrafos a todo el ancho: el cuerpo de un caso mantiene un límite de 70 caracteres aproximados (`70ch`). Las etiquetas, controles, párrafos y títulos usan tamaños fluidos con mínimos en rem. Las ilustraciones calculan su escala desde la tarjeta mediante `cqw`, también cuando aparecen dentro de la vista previa del panel. No se aplica zoom CSS ni se ocultan desbordamientos de toda la página para disimular problemas de distribución.

La adaptación responde al ancho del viewport en píxeles CSS: un monitor físico 4K con escalado de sistema puede ofrecer un viewport menor. El zoom del navegador y las preferencias de tamaño de fuente se conservan.

Matriz de revisión visual pendiente: 320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080, 2560×1440 y 3840×2160; incluir móvil horizontal y zoom al 200 %. Revisar portada, detalle de CMS, un servicio y vista previa del panel, especialmente foco visible, menú, etiquetas largas, filtros, ilustraciones y desplazamiento horizontal exclusivo de la galería. Los builds públicos y privados y el contenido HTML se comprobaron; la matriz no se declara aprobada sin ejecutar la revisión real en navegador.

La portada prioriza los casos de operación de contenido en CMS y desarrollo con WordPress. Su respaldo es la experiencia ya documentada en el snapshot editorial; los proyectos en documentación conservan sus límites y rutas. No se añadieron resultados medidos, capturas de empleadores ni atribuciones nuevas de experiencia.

Las portadas son ilustraciones originales hechas con HTML/CSS, etiquetadas «Ilustración conceptual». El ejemplo de tres etapas y la comparación antes/después usan datos ficticios y se identifican como muestras ilustrativas. No ejecutan auditorías ni validaciones sobre proyectos reales. Las evidencias provienen exclusivamente del snapshot publicado, con texto escapado, enlaces HTTPS validados e imágenes de la biblioteca permitida.

Se modificaron portada, detalles de casos/servicios y presentación compartida con la vista previa privada. El panel conserva sus formularios y operaciones. No se cambió el contrato editorial, el backend, los workflows, las dependencias ni el lockfile.

## Movimiento implementado

Actualización del 15 de noviembre de 2026: las carpetas del proceso editorial conservan su interacción original. El efecto del mouse sobre las portadas de casos es una lupa sin texto de 160 px y ampliación 1,6×, con colores negativos. Una copia decorativa de CaseCover, excluida del árbol accesible y sin nombre de View Transition, se posiciona a partir de las coordenadas del puntero. La lente tiene forma orgánica, máscara radial para suavizar bordes y entrada por opacidad y escala. El seguimiento usa un único requestAnimationFrame pendiente, sin retardo de posición para mantener alineado el zoom. No se activa con movimiento reducido; desaparece al salir o liberar el gesto. La ondulación usa ahora ciclos de 3,4 s. La lente se orienta según la dirección del gesto, se estira hasta un 20 % según su velocidad y se relaja al detenerse. La imagen ampliada compensa la rotación para seguir derecha y alineada. En móvil, Pointer Events y captura permiten el arrastre horizontal; pan-y y pinch-zoom conservan scroll vertical y zoom nativos. La cancelación del navegador oculta la lupa. Un arrastre de más de 8 px impide abrir el caso por accidente, mientras un toque normal conserva el enlace.

| Interacción | Implementación | Evidencia y límite |
|---|---|---|
| Entrada → revisión → resultado | Tres botones nativos con `aria-pressed`; tarjetas siempre legibles; desplazamiento de 8 px y actualización del texto en 200 ms. Sin reproducción automática. | El flujo comunica tareas de contenido, revisión y entrega descritas en la experiencia. El ejemplo es ficticio; la animación no acredita eficiencia. |
| Antes/después | Comparación inicialmente completa; botones para comparar o aislar un momento; aparición de 180 ms, etiquetas textuales y campos alineados. | Ilustra el criterio de revisión; no presenta mejoras de un cliente ni una auditoría ejecutada. |
| Portada → detalle | React Router `viewTransition` y `useViewTransitionState`; nombre exclusivo en la portada activa; transición de 220 ms; cabecera separada del movimiento. | Se verificó la API en React Router instalado, 7.18.5. Si el navegador no soporta View Transitions, el router conserva la navegación normal. |
| Galería de evidencias | Overflow horizontal nativo y scroll snap de proximidad; botones y flechas del teclado; contenido accesible sin JS. | Solo muestra referencias publicadas. Con una referencia no hay controles ni arrastre artificial. No se inventaron capturas para completar la galería. |
| Gesto pixelado | Marca decorativa con `steps(2, end)`, 240 ms; IntersectionObserver dispara una vez al entrar en pantalla. Hover/foco de la marca también responde. | Decisión estética inspirada en la preferencia expresada por el usuario sobre PubPub; no es un indicador de validación. El contenido nunca depende del observer. |
| Etiqueta junto al mouse | Lupa decorativa sin texto, ampliación 1,6× y filtro invert, posicionada con Pointer Events y un único requestAnimationFrame. | Mouse o arrastre táctil horizontal, con movimiento permitido; limpieza al salir, liberar, perder captura, cancelar o desmontar. El enlace fijo «Ver caso» conserva la navegación. |
| Entrada de la página | CSS puro desde la primera pintura: el hero, la tarjeta del proceso y el encabezado de cada caso entran escalonados (`page-enter`, 700 ms, 24 px). Se repite al montar una ruta. | Es lo primero que se ve, así que no depende de JS ni de la hidratación. Con `prefers-reduced-motion: reduce` no se anima. |
| Aparición al desplazarse | `usePageMotion`: IntersectionObserver y Web Animations (640 ms) revelan secciones, tarjetas y bloques de caso cuando entran en pantalla. | Solo anima lo que entra después de la primera pintura; lo ya visible al hidratar no se reproduce, para evitar que desaparezca y reaparezca. En pantallas muy altas, lo visible al cargar fuera del hero aparece sin animación. El contenido nunca queda oculto esperando al observer. |
| Estado de navegación | «Abriendo página…» ligado directamente a `useNavigation`. | No hay pausa artificial ni porcentaje ficticio. Si la navegación termina inmediatamente, no se fuerza un loader. |

`useReducedMotion` observa cambios de preferencia del sistema. El render del servidor y la hidratación inicial omiten el movimiento opcional de React (la entrada CSS depende solo de la media query); CSS y React desactivan animaciones, transiciones, seguimiento del puntero y desplazamiento suave con movimiento reducido. El movimiento de la marca no altera la tipografía de lectura.

## Fuentes y razonamiento

- [Daniel Kiss](https://danielkiss.hu/): referencia de presentación mencionada por el usuario. No se atribuyen sus habilidades creativas/motion al propietario del portafolio.
- [Sadok — PubPub](https://sadok.mx/projects/pubpub/): referencia editorial y preferencia del usuario por el detalle pixelado. No se reprodujeron su composición, código ni recursos.
- [Raphael — Yucca](https://segerman.dev/work/yucca/): referencia señalada por el usuario para continuidad, mouse y tacto. No se identificó ni imitó su motor de animación.
- [React Router: View Transitions](https://reactrouter.com/how-to/view-transitions): patrón de navegación; contrastado con las declaraciones y el fallback del paquete local 7.18.5.
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): preferencia del sistema.
- [MDN: scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type): desplazamiento nativo y ajuste de las referencias.
- [Modern Web Guidance: sticky headers](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-atoms/state-aware-sticky-headers.md): navegación persistente. Se conserva CSS sticky y altura medida con ResizeObserver; no se exige soporte experimental de scroll-state.

Estas referencias sustentan posibilidades técnicas y decisiones visuales. No demuestran que estas animaciones mejoren conversión o comprensión; eso requiere observación con usuarios.

## Verificación ejecutada

`npm run verify`: TypeScript correcto, 15/15 pruebas, build público y build del panel correctos. Nueve rutas con HTML completo, un h1 por ruta y metadatos. Se comprueban los enlaces públicos y anclas de la portada sin JavaScript, ambos momentos de la comparación y la ausencia de datos privados. Una prueba de regresión renderiza varias vistas previas fuera del router y comprueba IDs únicos, referencias correctas y texto escapado.

La primera ejecución de Miniflare falló por sockets locales restringidos en el sandbox; la ejecución autorizada fuera del sandbox pasó. No hubo despliegue.

El análisis de impacto se solicitó con dependency-librarian sobre los archivos previstos. El directorio no pertenece a un proyecto registrado. Se revisaron imports y consumidores: rutas públicas → componentes → estilos; EntryView → vista previa del panel; contrato publicado → prerender → verificador de build. La ausencia de un grafo registrado deja relaciones adicionales sin certificar.

## Revisión real pendiente

No se aprobó revisión visual ni interacción en navegador: el acceso administrado estaba bloqueado y no se utilizó otro navegador para eludirlo. Las pruebas automatizadas no sustituyen esta revisión.

Abrir `http://127.0.0.1:5173` después de `npm run dev`. Comprobar:

1. Escritorio (1440 y 1024 px), móvil (390 y 320 px) y zoom al 200 %: menú visible, textos legibles, sin desbordamiento horizontal de la página.
2. Tab, Enter y Espacio: enlaces, etapas y comparación utilizables; foco visible. Seleccionar etapas varias veces sin temporizadores ni cambios automáticos.
3. Filtrar casos, abrir uno, volver y usar atrás/adelante. Abrir directamente FAK y los casos laborales; comprobar foco en el título al cambiar de página y navegación por anclas.
4. Pasar el mouse por las portadas: lupa sin texto, ampliación 1,6× en negativo, alineación con el cursor y desaparición al salir; click normal. En táctil, comprobar que el desplazamiento vertical no se intercepta.
5. Entrar y salir de secciones: marca pixelada breve, sin ocultar texto. Activar «reducir movimiento» durante la visita: sin gesto, seguimiento ni transición animada.
6. Galería con varias evidencias aprobadas: arrastre horizontal en táctil, scrollbar, botones y flechas al enfocar la lista. Los casos actuales tienen cero o una referencia; el gesto requiere contenido real adicional.
7. Navegación rápida y navegador sin View Transitions: rutas funcionales y menú visible. Simular red lenta: estado real de navegación, sin demora artificial.
8. Desactivar JavaScript en la compilación pública: todos los casos, servicios, referencias y comparación siguen legibles. Probar 404 con el Worker público, no con el fallback del servidor de desarrollo.
9. Recargar sin caché la portada y un caso: hero y tarjeta del proceso (o el encabezado del caso) entran escalonados, sin parpadeo al hidratar; las secciones inferiores aparecen al llegar a ellas. Con las animaciones del sistema desactivadas (en Windows, Accesibilidad → Efectos visuales) no debe moverse nada.

Refinamiento líquido de la lupa: `lens-liquid` ondula el contorno y la máscara en ciclos de 3,4 s, con cuatro fases y deformación de hasta el 18 %. El centro, zoom y contenido permanecen alineados; solo se anima mientras la lente es visible y el sistema permite movimiento.

Corrección del contorno: máscara elíptica closest-side dentro de una caja invisible de 256 px; diámetro visible base de 160 px. Retirado el recorte rectangular del propio indicador. La deformación máxima conserva al menos 14,72 px de margen interior para evitar lados planos al estirarse. Se mantiene el centrado, zoom, negativo, ondulación de 3,4 s y soporte táctil existente.

## Recorrido actualizado — 16 de noviembre de 2026

La portada agrupa el desplazamiento en presentación, servicios completos y encabezado/filtros/primera ficha de casos; después continúa por cada ficha, método y Perfil. PageMotion calcula los límites de los bloques visibles tras filtrar y permite lectura nativa dentro de bloques más altos que la pantalla, también al regresar. La rueda solo se coordina en portada con puntero fino y movimiento permitido, con transición de 600 ms sin pausa inicial. Táctil usa snap de proximidad; movimiento reducido no activa snap ni animación de rueda. El contacto y los enlaces LinkedIn/GitHub pertenecen a un único footer compartido, disponible mediante #contacto.

Se retira de la portada la comparación «Una ficha / dos momentos». Las descripciones anteriores de esa muestra corresponden a estados previos; el método y Perfil se conservan. Verificación técnica y límites de QA de este incremento en prometheus.md. La política del navegador impidió la revisión visual local.

## Presentación integrada al lienzo — 16 de noviembre de 2026

El hero se incluye en las ventanas transparentes de BlueprintWindows. Un gradiente oscuro protege la lectura sobre el parallax, con fallback oscuro antes de hidratar. Desde 64rem el título y el texto/acciones ocupan dos columnas; en móvil conservan el orden de lectura. Se reduce el espaciado y el tamaño máximo del título; en horizontal bajo se compactan cabecera y presentación. Los botones usan terminales circulares y bordes redondeados; el secundario del hero comparte ese lenguaje. Continúan los mínimos táctiles y foco visible. Revisión visual pendiente: las verificaciones técnicas no acreditan composición responsive.
