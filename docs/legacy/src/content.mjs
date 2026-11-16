export const profile = {
  name: 'and_mad',
  description: 'Portafolio de and_mad: contenido, calidad de datos, CMS y QA. Proyectos, decisiones y evidencia de trabajo.',
  email: '',
  linkedin: '',
  cv: '',
};

export const areas = ['Content Analyst', 'Data Quality', 'CMS', 'QA'];

export const projects = [
  {
    slug: 'fak', number: '01', title: 'Federación de Asociaciones de Kendo', short: 'Contenido que conecta una comunidad.',
    status: 'Caso en documentación', kind: 'fak', areas,
    description: 'Un sitio de comunidad donde contenido, calendario, imágenes y SEO forman parte del mismo sistema.',
    problem: 'Presentar contenido de una federación con rutas claras, información de eventos y una experiencia coherente entre dispositivos.',
    scope: 'El repositorio consultado contiene configuración SEO, rutas localizadas de eventos y contratos de verificación. Esta ficha muestra ese contexto técnico; la responsabilidad personal y los resultados se documentarán con evidencia antes de atribuirlos.',
    decisions: [
      ['Contenido estructurado', 'El modelo distingue rutas, idioma, metadatos y datos de eventos. La presentación utiliza esa información para mantener consistencia.'],
      ['Publicación verificable', 'El contrato SEO contempla HTML prerenderizado, enlaces canónicos y comprobaciones sobre los archivos generados.'],
      ['Idiomas con control editorial', 'Las rutas de eventos en inglés dependen de una traducción válida; no se presenta una traducción pendiente como publicada.'],
    ],
    evidence: 'La configuración SEO y el documento editorial del proyecto sustentan este esquema. Es una representación conceptual del sistema, no una captura de su interfaz.',
    result: 'Base técnica localizada para desarrollar el caso. Pendientes: capturas depuradas, alcance de mi participación y resultados medidos. No se atribuyen mejoras de tráfico ni métricas de rendimiento.',
    steps: ['Contenido', 'Validación', 'HTML + SEO', 'Verificación'],
  },
  {
    slug: 'gestor', number: '02', title: 'Gestor de publicaciones', short: 'Del contenido a una publicación comprobada.',
    status: 'En desarrollo', kind: 'gestor', areas: ['Content Analyst', 'CMS', 'QA'],
    description: 'Preparación y publicación privada de contenido en Instagram, con revisión del texto, imagen y cuenta de destino.',
    problem: 'Reunir el contenido y su revisión en un flujo que permita comprobar qué se publica y evitar duplicados ante reintentos.',
    scope: 'El gestor se alojará temporalmente junto al portafolio, con acceso privado. El portafolio presenta el proyecto; no incluye todavía una administración ni una API de publicación.',
    decisions: [
      ['Preparar antes de publicar', 'Revisar el texto, la imagen y la cuenta de destino como parte de una misma operación.'],
      ['Acceso privado', 'La administración necesita autenticación y credenciales exclusivamente en el servidor. No tendrá calendario público en esta fase.'],
      ['Confirmar el resultado', 'Una respuesta técnica de la API no sustituye la comprobación de la publicación en la cuenta de destino.'],
    ],
    evidence: 'Flujo previsto para la integración. La aprobación de Meta y el primer post real permanecen pendientes de comprobar.',
    result: 'Proyecto en desarrollo. No se ha verificado una publicación en Instagram desde este portafolio.',
    steps: ['Preparación', 'Revisión', 'API de Meta', 'Confirmación'],
  },
  {
    slug: 'centrificador', number: '03', title: 'Centrificador', short: 'Una base existente. El siguiente incremento.',
    status: 'Siguiente fase', kind: 'centrificador', areas: ['Data Quality', 'CMS', 'QA'],
    description: 'Evolución de un flujo de contenido e imágenes, a partir de la base técnica ya documentada en el proyecto de eventos.',
    problem: 'Definir una responsabilidad propia para el proyecto y aprovechar lo que ya existe sin duplicar el flujo del gestor.',
    scope: 'Existe documentación de una base con interfaz, API y procesamiento de imágenes. Es necesario auditar su comportamiento antes de decidir qué componentes conservar.',
    decisions: [
      ['Reutilización con evidencia', 'Revisar la base existente, sus pruebas y sus límites antes de diseñar el primer incremento.'],
      ['Dos hitos previos', 'El desarrollo paralelo se habilita después del primer post exitoso por API y de la aprobación de la aplicación por Meta.'],
      ['Responsabilidad propia', 'Separar el producto de la operación temporal del gestor y documentar sus contratos.'],
    ],
    evidence: 'La documentación local de Centrificador describe una base técnica; su disponibilidad no acredita despliegue, permisos ni operación real.',
    result: 'Fase futura condicionada a los dos hitos de Instagram y Meta. No se presenta como producto terminado.',
    steps: ['Base existente', 'Auditoría', 'Alcance propio', 'Incremento'],
  },
];
