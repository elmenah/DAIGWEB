export const servicePages = [
  {
    slug: 'piping-industrial',
    name: 'Piping Industrial',
    title: 'Piping Industrial en Quintero y Puchuncavi | DAIG Chile',
    description:
      'Diseno, fabricacion y montaje de piping industrial en Quintero, Puchuncavi y Ventanas. Soldadura certificada, mantencion y reparacion de lineas de proceso.',
    intro:
      'Desarrollamos proyectos de piping industrial para plantas y faenas de la zona industrial de Valparaiso. Ejecutamos montaje, reemplazo y mantencion de lineas con foco en seguridad operativa y continuidad productiva.',
    bullets: [
      'Fabricacion y montaje de tuberias para procesos industriales',
      'Soldadura especializada para acero al carbono e inoxidable',
      'Mantencion preventiva y correctiva de lineas criticas',
      'Levantamiento tecnico y documentacion de obra',
    ],
  },
  {
    slug: 'estructuras-metalicas',
    name: 'Estructuras Metalicas',
    title: 'Estructuras Metalicas en Puchuncavi | DAIG Chile',
    description:
      'Fabricacion e instalacion de estructuras metalicas industriales en Puchuncavi y Quintero. Proyectos para plantas, soportes, plataformas y ampliaciones.',
    intro:
      'Fabricamos e instalamos estructuras metalicas para proyectos industriales, desde soportes de equipos hasta plataformas y marcos de proceso. Adaptamos cada desarrollo a las exigencias tecnicas de cada cliente.',
    bullets: [
      'Diseno y fabricacion de estructuras a medida',
      'Montaje en terreno con control de calidad',
      'Refuerzos estructurales para ampliaciones industriales',
      'Proyectos con trazabilidad de materiales y soldaduras',
    ],
  },
  {
    slug: 'obras-civiles-industriales',
    name: 'Obras Civiles Industriales',
    title: 'Obras Civiles Industriales en Ventanas y Quintero | DAIG',
    description:
      'Obras civiles para industria: fundaciones, canalizaciones, mejoras de infraestructura y apoyo a montaje en plantas de Quintero, Ventanas y Puchuncavi.',
    intro:
      'Ejecutamos obras civiles orientadas a la operacion industrial, incluyendo fundaciones, canalizaciones y mejoras de infraestructura para equipos y lineas de proceso.',
    bullets: [
      'Fundaciones y obras de hormigon para equipos industriales',
      'Canalizaciones y adecuaciones de infraestructura',
      'Coordinacion con montajes mecanicos y piping',
      'Planificacion de obra para reducir detenciones operativas',
    ],
  },
  {
    slug: 'modelamiento-3d-industrial',
    name: 'Modelamiento 3D Industrial',
    title: 'Modelamiento 3D Industrial en Chile | DAIG Chile',
    description:
      'Modelamiento 3D para proyectos industriales: levantamiento, ingenieria de detalle, deteccion de interferencias y visualizacion para toma de decisiones.',
    intro:
      'Convertimos informacion de terreno en modelos 3D de alto detalle para planificar montajes, validar interferencias y anticipar riesgos tecnicos antes de ejecutar obra.',
    bullets: [
      'Modelos 3D de lineas, estructuras y equipos',
      'Deteccion de interferencias antes de fabricacion',
      'Planos y entregables para construccion y montaje',
      'Visualizaciones para aprobacion tecnica y comercial',
    ],
  },
  {
    slug: 'proteccion-de-tuberias',
    name: 'Proteccion de Tuberias',
    title: 'Proteccion de Tuberias Industriales | DAIG Chile',
    description:
      'Soluciones de proteccion de tuberias industriales: recubrimientos, reparacion, aislamiento y estrategias anticorrosivas para extender vida util de activos.',
    intro:
      'Aplicamos soluciones de proteccion para tuberias y lineas de proceso que aumentan la vida util de los activos y reducen costos por fallas y paradas no programadas.',
    bullets: [
      'Evaluacion tecnica de corrosion y estado de linea',
      'Aplicacion de recubrimientos de alto desempeno',
      'Reparacion de sectores comprometidos',
      'Planes de mantencion para continuidad operacional',
    ],
  },
  {
    slug: 'extraccion-y-recubrimiento',
    name: 'Extraccion y Recubrimiento',
    title: 'Extraccion y Recubrimiento de Canerias | DAIG Chile',
    description:
      'Servicio de extraccion de canerias y recubrimiento anticorrosivo para sistemas industriales. Intervenciones seguras y planificadas en plantas de la V Region.',
    intro:
      'Retiramos tramos deteriorados y aplicamos soluciones de recubrimiento para recuperar integridad mecanica y operativa en sistemas de canerias industriales.',
    bullets: [
      'Retiro controlado de canerias danadas',
      'Preparacion de superficie y tratamiento especializado',
      'Recubrimientos anticorrosivos segun exigencia operacional',
      'Reinstalacion y pruebas de funcionamiento',
    ],
  },
  {
    slug: 'cnc-router-y-laser',
    name: 'CNC Router y Laser',
    title: 'Corte CNC Router y Laser en Chile | DAIG Chile',
    description:
      'Servicio de corte y grabado CNC Router y Laser para industria, prototipos y piezas especiales. Alta precision, repetibilidad y tiempos de entrega competitivos.',
    intro:
      'Ofrecemos corte y grabado CNC para piezas tecnicas, senaletica, plantillas, prototipos y componentes productivos con estandares de precision industrial.',
    bullets: [
      'Corte CNC Router en multiples materiales',
      'Grabado y corte fino con tecnologia laser',
      'Series cortas y medianas para industria y mantenimiento',
      'Apoyo de diseno para optimizar fabricacion',
    ],
  },
  {
    slug: 'diseno-mecanico',
    name: 'Diseno Mecanico',
    title: 'Diseno Mecanico Industrial en Chile | DAIG Chile',
    description:
      'Servicio de diseno mecanico industrial: piezas, ensamblajes y planos de fabricacion para proyectos de mantenimiento, mejora y expansion operacional.',
    intro:
      'Desarrollamos soluciones de diseno mecanico para manufactura y mantenimiento industrial, desde conceptos iniciales hasta planos listos para fabricacion.',
    bullets: [
      'Diseno de piezas y ensamblajes mecanicos',
      'Planos de fabricacion y montaje',
      'Documentacion tecnica para mantencion y repuestos',
      'Soporte de ingenieria para mejora continua',
    ],
  },
]

export const serviceBySlug = Object.fromEntries(
  servicePages.map((service) => [service.slug, service]),
)