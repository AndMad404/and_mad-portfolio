# Operación y despliegue

Repositorio previsto: https://github.com/AndMad404/and_mad-portfolio. Se comprobó que existe y estaba vacío. La implementación está en el espacio de trabajo local; no se han enviado commits ni ejecutado workflows remotos.

## Preparar Cloudflare

1. Autenticarse con `npx wrangler login`. Confirmar la cuenta y el plan gratuito; comprobar el uso actual de Workers y D1 antes de crear recursos. No activar planes facturables. Consultar [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) y [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). No se ha comprobado la cuota disponible de esta cuenta porque no hay sesión autenticada.
2. Definir los orígenes HTTPS del sitio y del panel. El Worker público previsto se llama `and-mad`; el privado, `and-mad-editorial`. Verificar primero si esos nombres ya tienen despliegues que deban preservarse.
3. Crear una base D1 `editorial` dentro de la cuota disponible. Registrar su identificador en la variable de repositorio `CLOUDFLARE_D1_ID`. El marcador de `wrangler.studio.jsonc` es deliberado: no identifica una base real.
4. Crear una aplicación Cloudflare Access que cubra **todo el origen privado**, incluidos `/api/*` y assets. La política humana permite exclusivamente el correo del propietario. Evitar que una URL alternativa workers.dev quede fuera de la protección; el Worker también valida JWT y propietario en servidor.
5. Crear credenciales Access de servicio diferentes para Actions y el conector. Sus políticas de servicio se limitan respectivamente a `/api/deploy/*` y `/api/connector/*`. El backend exige además credenciales propias distintas para cada rol. Un token Access de servicio no obtiene acceso al panel ni a las operaciones del propietario.
6. Configurar las variables y secretos siguientes sin pegarlos en el chat ni en archivos versionados.

## Configuración

Variables de GitHub, entorno `production`: `SITE_ORIGIN`, `PANEL_ORIGIN`, `ACCESS_TEAM`, `ACCESS_AUDIENCE`, `CLOUDFLARE_D1_ID`.

Secretos de GitHub: `OWNER_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (solo despliegue público), `STUDIO_CLOUDFLARE_API_TOKEN` (Worker privado y D1), `DEPLOY_TOKEN`, `DEPLOY_ACCESS_CLIENT_ID`, `DEPLOY_ACCESS_CLIENT_SECRET`.

Secretos del Worker privado, mediante `wrangler secret put` o el panel Cloudflare: `GITHUB_TOKEN` y `DEPLOY_TOKEN`. `GITHUB_TOKEN` necesita acceso restringido a Actions en este repositorio para iniciar y consultar ejecuciones. `DEPLOY_TOKEN` debe ser aleatorio, tener al menos 32 caracteres y coincidir con el secreto independiente de Actions.

`SOURCE_REVISION` es el commit de código de 40 caracteres que se congela al aprobar cada publicación. El workflow del panel lo fija con `github.sha`; también configura `PANEL_ORIGIN`, `ACCESS_TEAM`, `ACCESS_AUDIENCE` y `OWNER_EMAIL`. No se aprueban versiones sin ese commit. El workflow público recibe ese SHA y lo usa en checkout, de manera que un reintento conserve tanto contenido como código y lockfile.

Los permisos de los dos tokens de Cloudflare deben separarse según su destino. No se incluyen en el navegador ni en el conector.

## Primera publicación

1. Subir el código revisado al repositorio y comprobar el workflow `Verify`.
2. Configurar Access y secretos; ejecutar manualmente `Deploy private editorial platform`. Este workflow verifica, compila, aplica las migraciones revisadas y despliega el panel. No crea cuentas, bases ni planes de pago.
3. Entrar al panel como propietario. Cargar el contenido inicial como borradores, revisar y guardar las entradas.
4. Seleccionar el contenido completo del sitio, incluidas las tres páginas de servicios y las rutas de proyectos históricas. Aprobar congela las revisiones; todavía no publica.
5. Revisar la versión congelada y pulsar Desplegar. Actions descarga solo esa versión, verifica HTML y separación pública, y despliega el Worker público.

El sitio público no tiene binding D1 ni dependencia de Prometheus. Su única entrada editorial es `content/published.json`, reemplazada en Actions por el snapshot aprobado.

## Fallos, reintentos y recuperación

Un fallo de verificación/build no ejecuta el despliegue. Un fallo previo al cambio de versión pública mantiene el sitio anterior. Una respuesta de red ambigua no se convierte automáticamente en otro intento.

El panel distingue aprobado, desplegando, publicado y fallido. Los callbacks llevan la identidad del intento; un callback anterior no puede cambiar el estado del nuevo. Los clics concurrentes crean un solo intento. Publicar de nuevo una versión ya publicada requiere la acción explícita «Volver a publicar esta versión».

Si Actions terminó pero falló su callback, introducir el ID de esa ejecución en el panel y usar «Comprobar resultado en Actions». El backend verifica la identidad de la ejecución y el paso de despliegue. Si el despliegue quedó ambiguo, comprobar el deployment activo en Cloudflare antes de resolverlo; no marcarlo fallido a ciegas. No se habilitan reintentos mientras exista un intento activo.

Una versión anterior se restaura volviendo a publicar su snapshot y commit congelados. Esto conserva el historial; no edita las revisiones originales. El artefacto de Actions guarda el identificador público de publicación.

## Respaldos

«Descargar respaldo editorial» produce un JSON privado consistente de las tablas editoriales. Excluye solicitudes temporales y credenciales del conector. Guardarlo fuera del repositorio público; `backups/` está ignorado.

Para recuperar en una **base nueva**: aplicar la migración inicial, generar SQL revisable con `npx tsx scripts/restore-backup.ts backups/editorial.json backups/restore.sql`, inspeccionarlo y ejecutarlo mediante Wrangler sobre la base nueva. Comprobar `PRAGMA foreign_key_check` antes de cambiar el binding del Worker. El SQL no borra ni reemplaza una base existente. Las credenciales del conector se vuelven a emitir; no se reactivan desde el respaldo.

Las pruebas restauran un respaldo en otra D1 local y comparan las entradas y relaciones. Una restauración remota real continúa pendiente.

## Conector Prometheus

Copiar `connector/config.example.json` a `connector/config.local.json`. Configurar el origen HTTPS del panel, la raíz local real de Prometheus y recursos concretos de lectura. El archivo local no se versiona. Cada recurso debe ser un archivo permitido; no se aceptan carpetas, traversal ni enlaces fuera de la raíz resuelta.

Crear en el panel una credencial con esos mismos identificadores. Guardar su valor en `CONNECTOR_TOKEN` y el token de servicio Access en `CF_ACCESS_CLIENT_ID` y `CF_ACCESS_CLIENT_SECRET`, solo en el entorno local. Ejecutar manualmente `npm run connector`. Ctrl+C detiene el proceso. No se instala como servicio ni se inicia automáticamente.

Cada diez segundos consulta por HTTPS; cada solicitud dura como máximo sesenta segundos, la asignación exclusiva veinticinco y la lectura local quince. Reader recibe hasta 16 KiB de lectura, un archivo, veinte resultados y doscientas entradas examinadas por búsqueda. La salida enviada no supera 32 KiB de caracteres. La búsqueda es literal y la API no recibe rutas, código ni comandos.

Después de treinta segundos sin heartbeat, el panel muestra desconexión. Un resultado no se sirve después de quince minutos; el cron elimina filas caducadas en su siguiente ejecución, como máximo un minuto después en operación normal. La revocación borra sus solicitudes y rechaza resultados tardíos. Las respuestas son privadas, sin caché; no se registra el contenido en logs. Esta caducidad de aplicación no controla las políticas internas de recuperación del proveedor D1.

Para conservar información se redacta y revisa un texto de evidencia y se pulsa la acción explícita correspondiente. Se crea otra revisión del borrador. No se publica la respuesta privada automáticamente.
