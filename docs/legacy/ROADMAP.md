# Roadmap — portafolio and_mad

Actualizado: 13 de noviembre de 2026.
Origen: contexto suministrado por el propietario y decisiones de esta conversación.
Este documento organiza el trabajo local; no forma parte de `dist/`.

## Objetivo y decisiones confirmadas

Buscar empleo en Content Analyst, Data Quality, CMS y QA, mostrando problemas,
diseños complejos, decisiones y evidencia visual. Identidad visible: and_mad.
Cada caso distinguirá problema, responsabilidad, decisiones, evidencia, resultado
y límites; la asistencia de IA no acredita autonomía ni autoría exclusiva.

El gestor será una herramienta privada para preparar y publicar contenido.
Se alojará temporalmente junto al portafolio, con un límite claro para trasladarlo.
Centrificador iniciará su desarrollo paralelo después de cumplir **ambos** hitos:
primer post exitoso por API en Instagram y aprobación de la aplicación por Meta.
El Worker `and-mad` es el destino mencionado; falta verificar su configuración.

## 1. Base del portafolio — implementada localmente

- Inicio orientado a reclutadores; cuatro áreas para navegar proyectos.
- Fichas FAK, gestor y Centrificador con estado explícito.
- HTML útil sin JavaScript, filtros accesibles y diseño adaptable.
- SEO por ruta; datos Person, no identidad institucional de la Federación.
- Generador y verificaciones locales sin dependencia de los otros repositorios.

Pendiente para cerrar la entrega pública:
- Contacto, CV y enlaces profesionales confirmados por el propietario.
- Evidencia visual depurada y alcance de la participación personal en FAK.
- Capturas, resultados y pruebas reales para ampliar los casos.
- Origen HTTPS y configuración del Worker; revisión de lanzamiento e indexación.

## 2. Gestor privado temporal — pendiente

Auditar la implementación existente antes de reutilizarla. Definir contrato de
integración y despliegue: el README actual describe una API Node con estado
persistente y procesamiento de imágenes; no asumir que funciona sin cambios
en un Worker. Separar sitio público, operador autenticado, API y secretos.
Preparar revisión de texto, imagen y cuenta; comenzar con datos ficticios.

Criterios de cierre: acceso anónimo rechazado en servidor, secretos fuera del
cliente, vista previa verificable y persistencia para registrar operaciones.
No habrá calendario público en esta fase. El gestor no entra al sitemap.

## 3. Validación Meta e Instagram — pendiente

Confirmar cuenta destinataria, permisos y estado de la aplicación con evidencia.
Comprobar los requisitos vigentes de Meta al implementar esta fase.mada.
- [ ] Aprobación de la aplicación por Meta comprobada.

Crear un Worker, compilar o recibir una respuesta intermedia de API no acredita
ninguno de esos hitos. No hay autorización para enviar un post específico todavía.

## 4. Operación + Centrificador — condicionada a los dos hitos

Operar el gestor para las publicaciones del propietario e iniciar el incremento
propio de Centrificador en paralelo. Auditar y conservar lo útil de su base
existente; no tratarlo como un proyecto sin antecedentes. Definir alcance,
contratos, almacenamiento, verificación y futura separación del portafolio.

## SEO adaptado de FAK

Se leyó completo el documento `textos-seo.md` del proyecto y se consultó su
configuración `seo.ts`. La guía documenta también estados históricos: no implica
que su despliegue actual esté verificado ni que sus políticas se hereden automáticamente.

Aplicación al portafolio:
- Un h1 y contenido HTML completo; títulos y descripciones específicos.
- Rutas estables, canónicas al configurar el dominio y sitemap desde esas rutas.
- Open Graph con tarjeta 1200 × 630 y descripción accesible.
- Datos estructurados alineados con la identidad visible de persona.
- `robots.txt` y `llms.txt` complementarios; 404 excluida del sitemap.
- Vista local sin indexación; administración futura protegida y no indexable.
- Sin hreflang hasta contar con traducciones revisadas y publicadas.
- Futuras fotografías con dimensiones, alt veraz y variantes cuando corresponda.

## Dependencias y verificación

El lector dependency-librarian reportó que este directorio no es un proyecto
registrado. El impacto no puede certificarse mediante su grafo. Por inspección:
contenido y plantilla alimentan cuatro páginas; CSS y JS son compartidos;
servidor y tests consumen el generador. No se modificaron repositorios vecinos.
Las verificaciones cubren HTML, enlaces, metadatos, sitemap, 404 y configuración.
Resultado del incremento: `npm test` pasó sus dos pruebas y `npm run build`
generó las cuatro rutas. `node --check public/app.js` pasó la revisión sintáctica.
La revisión visual y de filtros en navegador queda pendiente: la política
administrada bloqueó el acceso a 127.0.0.1. Los intentos HTTP tampoco confirmaron
la respuesta del servidor. No se declara validación visual, de comportamiento
en navegador ni de despliegue. Los servidores de revisión fueron detenidos.
