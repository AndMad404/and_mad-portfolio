# Contratos y consultas

`shared/contracts.ts` define entradas, evidencia, paquete de importación v1, consultas y snapshot público v1. Zod valida las mismas estructuras en servidor, herramientas y UI. React presenta texto escapado; los enlaces de evidencia admiten HTTPS sin usuario ni contraseña. Las rutas privadas y patrones conocidos de credenciales se rechazan; la revisión humana sigue siendo necesaria para detectar información sensible que no coincida con esos patrones.

La huella de importación es SHA-256 de la representación JSON canónica de `entry`, con claves ordenadas y arrays en orden. `scripts/package-import.ts` genera el paquete a partir de una entrada previamente revisada. `source.resourceId` es un identificador estable, no una ruta local. La huella detecta duplicados y alteraciones; no es una firma de autenticidad.

El incremento admite veinte entradas por snapshot y 500 KiB aproximadamente de contenido serializado. El límite mantiene las aprobaciones dentro del presupuesto de consultas D1 gratuito por operación. No se han medido cuotas disponibles de la cuenta real.

## Relaciones

- `entries` identifica tipo, ruta única y revisión vigente.
- `revisions` conserva contenido, revisión padre y fecha. Triggers prohíben modificar o borrar revisiones. El head solo puede apuntar a una revisión de la misma entrada.
- `evidence` enlaza referencias con una revisión y, opcionalmente, un ID de la biblioteca `media`. El contenido canónico de esa referencia también queda congelado en la revisión.
- `imports` registra huella única, procedencia y revisión creada. Un cambio de contenido para un ID existente exige decisión editorial; no sobrescribe el head.
- `releases` congela snapshot y commit fuente. `release_revisions` conserva su origen. `deployments` registra cada intento y resultado. Un índice parcial impide dos publicaciones activas.
- `audit` almacena actor, acción, destino y fecha, sin contenido de consultas.
- `credentials` almacena hashes revocables e IDs permitidos. `requests` conserva la cola, lease exclusivo y resultados temporales.

Drizzle tipa las consultas relacionales de lectura. Las operaciones de escritura que necesitan control exacto usan consultas parametrizadas D1 y `db.batch`, que revierte el lote al fallar. La migración SQL es la autoridad para constraints, índices y triggers; no ejecutar herramientas automáticas de schema push sobre producción.

## Conflictos

Guardar exige el head que abrió el editor. La inserción de una revisión se condiciona a ese head y a la identidad/ruta originales. Actualización del head, referencias y auditoría ocurren en el mismo lote. Si la condición dejó de cumplirse, se responde HTTP 409 sin guardar parcialmente.

Restaurar una revisión en el editor crea una nueva revisión al guardar. El cambio de ID o ruta de una entrada existente está fuera de este incremento; crear una entrada nueva evita sobrescribir rutas accidentalmente.

## Separación de publicación

El snapshot solo admite entradas públicas y sus referencias. No incluye importaciones completas, correos administrativos, credenciales, operaciones ni consultas locales. El workflow de publicación no puede descargar borradores con su credencial de despliegue. El Worker público solo recibe assets estáticos y responde HTTP 404 para rutas ausentes.
