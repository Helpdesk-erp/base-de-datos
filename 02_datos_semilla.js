// =============================================================================
//  02_datos_semilla.js  -  Datos de prueba para helpdesk_erp
//  Ejecutar después de 01_esquema.js:   load("02_datos_semilla.js")
//
//  Contraseña de todos los usuarios de prueba: Helpdesk2026*
//  (en la base solo se guarda el hash bcrypt)
// =============================================================================

db = db.getSiblingDB("helpdesk_erp");

// Vacía las colecciones para poder correr el script varias veces
for (const nombre of ["roles", "paquetes", "empleados", "clientes", "usuarios", "sesiones", "tickets",
  "base_conocimiento", "contadores", "pagos", "capacitaciones", "asistencias"]) {
  db.getCollection(nombre).deleteMany({});
}


// -----------------------------------------------------------------------------
// ROLES
// -----------------------------------------------------------------------------
db.roles.insertMany([
  {
    _id: "administrador",
    descripcion: "Gestiona usuarios, clientes y empleados. Asigna los tickets a los agentes de soporte.",
    permisos: ["usuarios:gestionar", "clientes:gestionar", "empleados:gestionar", "tickets:ver_todos", "tickets:asignar",
      "reportes:ver", "pagos:registrar", "capacitaciones:gestionar", "conocimiento:buscar"]
  },
  {
    _id: "auditor",
    descripcion: "Consulta tickets e historiales para control. No puede modificar nada.",
    permisos: ["tickets:ver_todos", "clientes:ver", "reportes:ver", "pagos:ver", "conocimiento:buscar"]
  },
  {
    _id: "agente_soporte",
    descripcion: "Atiende los tickets que le asignan y registra la solución en la base de conocimiento.",
    permisos: ["tickets:ver_asignados", "tickets:cambiar_estado", "conocimiento:crear", "conocimiento:buscar", "capacitaciones:dictar"]
  },
  {
    _id: "cliente",
    descripcion: "Crea tickets sobre los paquetes que contrató y consulta su estado.",
    permisos: ["tickets:crear", "tickets:ver_propios", "conocimiento:buscar", "capacitaciones:inscribirse"]
  }
]);


// -----------------------------------------------------------------------------
// PAQUETES  (campos_ticket = lo que pide el formulario dinámico del ticket)
// -----------------------------------------------------------------------------
const NAVEGADORES = ["Chrome", "Firefox", "Edge", "Safari", "Opera", "Otro"];

db.paquetes.insertMany([
  {
    _id: "VENTAS_ONLINE", nombre: "Ventas Online", descripcion: "Tienda virtual, pasarelas de pago y carrito de compras", precio_mensual: 110000, activo: true,
    campos_ticket: [
      { campo: "pasarela_pago", etiqueta: "Pasarela de pago", tipo: "lista", opciones: ["PSE", "Tarjeta de crédito", "Nequi", "Daviplata", "Efecty"], requerido: true },
      { campo: "url_error", etiqueta: "URL donde aparece el error", tipo: "url", requerido: true, ayuda: "Copie la dirección completa de la página, empezando por https://" },
      { campo: "navegador", etiqueta: "Navegador", tipo: "lista", opciones: NAVEGADORES, requerido: true },
      { campo: "log_api", etiqueta: "Log de la API", tipo: "texto_largo", requerido: false, ayuda: "Si tiene el mensaje de error técnico, péguelo aquí" }
    ]
  },
  {
    _id: "INVENTARIOS", nombre: "Inventarios", descripcion: "Existencias, bodegas, alertas de stock y códigos de barras", precio_mensual: 80000, activo: true,
    campos_ticket: [
      { campo: "bodega", etiqueta: "Bodega", tipo: "texto", requerido: true },
      { campo: "codigo_producto", etiqueta: "Código del producto", tipo: "texto", requerido: true },
      { campo: "codigo_barras", etiqueta: "Código de barras", tipo: "texto", requerido: false, ayuda: "Entre 8 y 14 dígitos" },
      { campo: "cantidad_sistema", etiqueta: "Cantidad que muestra el sistema", tipo: "numero", requerido: false },
      { campo: "cantidad_fisica", etiqueta: "Cantidad contada en bodega", tipo: "numero", requerido: false }
    ]
  },
  {
    _id: "COMPRAS", nombre: "Compras", descripcion: "Proveedores, órdenes de compra y cuentas por pagar", precio_mensual: 85000, activo: true,
    campos_ticket: [
      { campo: "orden_compra", etiqueta: "Número de orden de compra", tipo: "texto", requerido: true, ayuda: "Formato OC-004512" },
      { campo: "nit_proveedor", etiqueta: "NIT del proveedor", tipo: "texto", requerido: true, ayuda: "Solo números, sin dígito de verificación" },
      { campo: "etapa", etiqueta: "Etapa de la compra", tipo: "lista", opciones: ["solicitud", "aprobacion", "recepcion", "cuenta_por_pagar"], requerido: false }
    ]
  },
  {
    _id: "PRODUCCION", nombre: "Producción", descripcion: "Lotes, recetas de materia prima y costos de fabricación", precio_mensual: 120000, activo: true,
    campos_ticket: [
      { campo: "maquina", etiqueta: "ID de la máquina", tipo: "texto", requerido: true },
      { campo: "lote", etiqueta: "Código de lote", tipo: "texto", requerido: true },
      { campo: "fase", etiqueta: "Fase del proceso", tipo: "lista", opciones: ["mezclado", "coccion", "pasteurizacion", "empaque", "almacenamiento"], requerido: false },
      { campo: "temperatura", etiqueta: "Temperatura del sensor (°C)", tipo: "numero", requerido: true }
    ]
  },
  {
    _id: "POS", nombre: "Sistema POS", descripcion: "Facturación en caja, manejo de efectivo y turnos de cajeros", precio_mensual: 90000, activo: true,
    campos_ticket: [
      { campo: "numero_caja", etiqueta: "Número de caja", tipo: "texto", requerido: true, ayuda: "Por ejemplo CAJA-01" },
      { campo: "dispositivo", etiqueta: "Dispositivo con problemas", tipo: "lista", opciones: ["impresora", "cajón monedero", "lector de código de barras", "datáfono", "pantalla"], requerido: false },
      { campo: "turno", etiqueta: "Turno del cajero", tipo: "lista", opciones: ["mañana", "tarde", "noche"], requerido: false },
      { campo: "navegador", etiqueta: "Navegador", tipo: "lista", opciones: NAVEGADORES, requerido: false }
    ]
  }
]);


// -----------------------------------------------------------------------------
// EMPLEADOS
// -----------------------------------------------------------------------------
db.empleados.insertMany([
  {
    _id: "EMP-001",
    numero_documento: "1091654321",
    nombres: "Andrés Felipe",
    apellidos: "Carrascal Rincón",
    sexo: "masculino",
    estado_civil: "casado",
    profesion: "Ingeniero de sistemas",
    correo_personal: "andres.carrascal@correo.test",
    telefono_movil: "3157894561",
    direccion: { direccion: "Calle 10 # 12-45", barrio: "La Primavera", ciudad: "Ocaña", departamento: "Norte de Santander", codigo_postal: "546551" },
    contrato: {
      cargo: "Coordinador de mesa de ayuda", area: "administracion", tipo_contrato: "indefinido",
      fecha_inicio: new Date("2019-02-04"), salario: 5200000, jornada: "tiempo_completo", modalidad: "presencial"
    },
    seguridad_social: { eps: "Nueva EPS", fondo_pensiones: "Porvenir", arl: "Positiva", caja_compensacion: "Comfanorte", fondo_cesantias: "Porvenir" },
    informacion_bancaria: { banco: "Bancolombia", tipo_cuenta: "ahorros", numero_cuenta: "45612378901" },
    estado: "activo",
    fecha_creacion: new Date("2019-02-04"),
    fecha_actualizacion: new Date("2026-09-01")
  },
  {
    _id: "EMP-002",
    numero_documento: "1094556677",
    nombres: "Laura Milena",
    apellidos: "Pacheco Duarte",
    sexo: "femenino",
    estado_civil: "soltero",
    profesion: "Contadora pública",
    correo_personal: "laura.pacheco@correo.test",
    telefono_movil: "3204561278",
    direccion: { direccion: "Avenida 0 # 14-20", barrio: "Caobos", ciudad: "Cúcuta", departamento: "Norte de Santander" },
    contrato: {
      cargo: "Auditora de procesos de soporte", area: "auditoria", tipo_contrato: "termino_fijo",
      fecha_inicio: new Date("2026-04-01"), fecha_fin: new Date("2027-03-31"), salario: 3900000, jornada: "tiempo_completo", modalidad: "hibrido"
    },
    seguridad_social: { eps: "Sanitas", fondo_pensiones: "Protección", arl: "Sura", caja_compensacion: "Comfanorte", fondo_cesantias: "Protección" },
    estado: "activo",
    fecha_creacion: new Date("2026-04-01"),
    fecha_actualizacion: new Date("2026-04-01")
  },
  {
    _id: "EMP-003",
    numero_documento: "1091665544",
    nombres: "Jhon Fredy",
    apellidos: "Ascanio Quintero",
    sexo: "masculino",
    estado_civil: "union_libre",
    profesion: "Tecnólogo en gestión de redes",
    correo_personal: "jhon.ascanio@correo.test",
    telefono_movil: "3166547812",
    direccion: { direccion: "Carrera 15 # 7-80", barrio: "El Tamaco", ciudad: "Ocaña", departamento: "Norte de Santander" },
    contrato: {
      cargo: "Técnico de soporte", area: "soporte", tipo_contrato: "indefinido",
      fecha_inicio: new Date("2021-08-17"), salario: 2300000, jornada: "tiempo_completo", modalidad: "presencial"
    },
    seguridad_social: { eps: "Nueva EPS", fondo_pensiones: "Colpensiones", arl: "Positiva", caja_compensacion: "Comfanorte", fondo_cesantias: "Porvenir" },
    informacion_bancaria: { banco: "Banco de Bogotá", tipo_cuenta: "ahorros", numero_cuenta: "009812345678" },
    estado: "activo",
    fecha_creacion: new Date("2021-08-17"),
    fecha_actualizacion: new Date("2021-08-17")
  },
  {
    _id: "EMP-004",
    numero_documento: "1091678899",
    nombres: "Karen Julieth",
    apellidos: "Sanguino Pérez",
    sexo: "femenino",
    estado_civil: "soltero",
    profesion: "Ingeniera de sistemas",
    correo_personal: "karen.sanguino@correo.test",
    telefono_movil: "3001237894",
    direccion: { direccion: "Calle 5 # 3-22", barrio: "Centro", ciudad: "Ábrego", departamento: "Norte de Santander" },
    contrato: {
      cargo: "Analista de soporte", area: "soporte", tipo_contrato: "prestacion_servicios",
      fecha_inicio: new Date("2026-01-15"), fecha_fin: new Date("2026-12-15"), salario: 3100000, jornada: "tiempo_completo", modalidad: "remoto"
    },
    seguridad_social: { eps: "Coosalud", fondo_pensiones: "Colpensiones", arl: "Positiva" },
    estado: "activo",
    fecha_creacion: new Date("2026-01-15"),
    fecha_actualizacion: new Date("2026-01-15")
  }
]);


// -----------------------------------------------------------------------------
// CLIENTES  (con los paquetes que contrataron)
// -----------------------------------------------------------------------------
db.clientes.insertMany([
  {
    _id: "CLI-001",
    tipo_cliente: "empresa",
    tipo_documento: "NIT",
    numero_documento: "37325678",
    nombre: "La Chispita Roja",
    representante: "María Elena Pérez Guerrero",
    correo: "lachispitaroja@correo.test",
    telefono: "3165554433",
    direccion: { direccion: "Carrera 12 # 8-34", ciudad: "Ocaña", departamento: "Norte de Santander" },
    paquetes_contratados: [
      { paquete_id: "POS", nombre: "Sistema POS", precio_mensual: 90000, fecha_inicio: new Date("2026-07-01"), fecha_fin: new Date("2027-01-01"), estado: "activo" }
    ],
    estado: "activo",
    fecha_registro: new Date("2026-06-28")
  },
  {
    _id: "CLI-002",
    tipo_cliente: "persona_juridica",
    tipo_documento: "NIT",
    numero_documento: "901456789",
    nombre: "Lácteos Brisas del Catatumbo S.A.S.",
    representante: "Hernando José Bayona Lobo",
    correo: "contacto@lacteosbrisas.test",
    telefono: "3182224567",
    direccion: { direccion: "Kilómetro 3 vía Ocaña - Ábrego", ciudad: "Ocaña", departamento: "Norte de Santander" },
    paquetes_contratados: [
      { paquete_id: "INVENTARIOS", nombre: "Inventarios", precio_mensual: 80000, fecha_inicio: new Date("2026-03-01"), fecha_fin: new Date("2027-03-01"), estado: "activo" },
      { paquete_id: "COMPRAS", nombre: "Compras", precio_mensual: 85000, fecha_inicio: new Date("2026-03-01"), fecha_fin: new Date("2027-03-01"), estado: "activo" },
      { paquete_id: "PRODUCCION", nombre: "Producción", precio_mensual: 120000, fecha_inicio: new Date("2026-03-01"), fecha_fin: new Date("2027-03-01"), estado: "activo" }
    ],
    estado: "activo",
    fecha_registro: new Date("2026-02-25")
  },
  {
    // Persona natural con el pago atrasado: cliente y paquete suspendidos
    _id: "CLI-003",
    tipo_cliente: "persona_natural",
    tipo_documento: "CC",
    numero_documento: "1091700345",
    nombre: "Camilo Andrés Rolón Sepúlveda",
    correo: "camilo.rolon@correo.test",
    telefono: "3209876543",
    direccion: { direccion: "Calle 7 # 30-12", ciudad: "Ocaña", departamento: "Norte de Santander" },
    paquetes_contratados: [
      { paquete_id: "VENTAS_ONLINE", nombre: "Ventas Online", precio_mensual: 110000, fecha_inicio: new Date("2026-09-01"), fecha_fin: new Date("2026-12-01"), estado: "suspendido" }
    ],
    estado: "suspendido",
    fecha_registro: new Date("2026-08-30")
  },
  {
    // Tiene todos los paquetes
    _id: "CLI-004",
    tipo_cliente: "persona_juridica",
    tipo_documento: "NIT",
    numero_documento: "900318642",
    nombre: "Ferretería y Distribuciones Santa Clara S.A.S.",
    representante: "Gloria Inés Manosalva Ortega",
    correo: "contacto@ferresantaclara.test",
    telefono: "3159871234",
    direccion: { direccion: "Avenida Libertadores # 10-150", ciudad: "Cúcuta", departamento: "Norte de Santander" },
    paquetes_contratados: [
      { paquete_id: "VENTAS_ONLINE", nombre: "Ventas Online", precio_mensual: 110000, fecha_inicio: new Date("2026-08-15"), fecha_fin: new Date("2027-08-15"), estado: "activo" },
      { paquete_id: "INVENTARIOS", nombre: "Inventarios", precio_mensual: 80000, fecha_inicio: new Date("2026-08-15"), fecha_fin: new Date("2027-08-15"), estado: "activo" },
      { paquete_id: "COMPRAS", nombre: "Compras", precio_mensual: 85000, fecha_inicio: new Date("2026-08-15"), fecha_fin: new Date("2027-08-15"), estado: "activo" },
      { paquete_id: "PRODUCCION", nombre: "Producción", precio_mensual: 120000, fecha_inicio: new Date("2026-08-15"), fecha_fin: new Date("2027-08-15"), estado: "activo" },
      { paquete_id: "POS", nombre: "Sistema POS", precio_mensual: 90000, fecha_inicio: new Date("2026-08-15"), fecha_fin: new Date("2027-08-15"), estado: "activo" }
    ],
    estado: "activo",
    fecha_registro: new Date("2026-08-10")
  }
]);


// -----------------------------------------------------------------------------
// USUARIOS  (uno por cada empleado y uno por cada cliente)
// -----------------------------------------------------------------------------
db.usuarios.insertMany([
  { _id: "USR-001", usuario: "andres.carrascal", correo: "andres.carrascal@sistemasintegrados.test", password_hash: "$2b$10$1M30jnhalu6s8vNvzxxpauEgWeWJnY2x17FflMCd0B2l0qWSUsD3q", roles: ["administrador"], empleado_id: "EMP-001", estado: "activo", credenciales_enviadas: true, ultimo_acceso: new Date("2026-09-20T08:00:00-05:00"), fecha_creacion: new Date("2019-02-04") },
  { _id: "USR-002", usuario: "laura.pacheco", correo: "laura.pacheco@sistemasintegrados.test", password_hash: "$2b$10$kdXzTLSLfcT8Jm3ocuehRODlyhyE8T9WXWtDx/qaFLUILhmw7KYe2", roles: ["auditor"], empleado_id: "EMP-002", estado: "activo", credenciales_enviadas: true, fecha_creacion: new Date("2026-04-01") },
  { _id: "USR-003", usuario: "jhon.ascanio", correo: "jhon.ascanio@sistemasintegrados.test", password_hash: "$2b$10$9GAO1EAT1psF023ODRK22utOhsOEWRj5PfkrPFugSNLAAlT/B/e..", roles: ["agente_soporte"], empleado_id: "EMP-003", estado: "activo", credenciales_enviadas: true, ultimo_acceso: new Date("2026-09-20T07:45:00-05:00"), fecha_creacion: new Date("2021-08-17") },
  { _id: "USR-004", usuario: "karen.sanguino", correo: "karen.sanguino@sistemasintegrados.test", password_hash: "$2b$10$0/vs3igDzzDfj7e8Ir8/e./w46D4NOtUD0QOjCAF3nyXjGsTS4zr.", roles: ["agente_soporte"], empleado_id: "EMP-004", estado: "activo", credenciales_enviadas: true, fecha_creacion: new Date("2026-01-15") },
  { _id: "USR-005", usuario: "lachispitaroja", correo: "lachispitaroja@correo.test", password_hash: "$2b$10$Z/EBzUbp//rc.tbNgGA8WO/3rUNRuGwyUBnzD3.gqutVmf8VMRctm", roles: ["cliente"], cliente_id: "CLI-001", estado: "activo", credenciales_enviadas: true, ultimo_acceso: new Date("2026-09-19T16:20:00-05:00"), fecha_creacion: new Date("2026-06-28") },
  { _id: "USR-006", usuario: "lacteosbrisas", correo: "sistemas@lacteosbrisas.test", password_hash: "$2b$10$mj0yer/gIo8DzsPh21FADO3N8bipIYmcWgwMKoGvWLQsVNW3A0FTi", roles: ["cliente"], cliente_id: "CLI-002", estado: "activo", credenciales_enviadas: true, fecha_creacion: new Date("2026-02-25") },
  { _id: "USR-007", usuario: "camilo.rolon", correo: "camilo.rolon@correo.test", password_hash: "$2b$10$URCVP7xAsuwWRpRz5ZRZS.9d59/hmqVvUQRciWS.tdjji3tJJJ/2m", roles: ["cliente"], cliente_id: "CLI-003", estado: "activo", credenciales_enviadas: true, fecha_creacion: new Date("2026-08-30") },
  { _id: "USR-008", usuario: "ferresantaclara", correo: "tic@ferresantaclara.test", password_hash: "$2b$10$EWqNgsIA2wUJ4CpJ1Qnm7OkHsKnAlt.EkkOOusoi33nJ3lT3sy9Pe", roles: ["cliente"], cliente_id: "CLI-004", estado: "activo", credenciales_enviadas: true, fecha_creacion: new Date("2026-08-10") }
]);


// -----------------------------------------------------------------------------
// SESIONES
// -----------------------------------------------------------------------------
db.sesiones.insertMany([
  { usuario_id: "USR-001", rol: "administrador", ip: "192.0.2.10", dispositivo: "Chrome en Windows 11", fecha_inicio: new Date("2026-09-20T08:00:00-05:00"), fecha_expiracion: new Date("2026-09-20T16:00:00-05:00"), estado: "activa" },
  { usuario_id: "USR-003", rol: "agente_soporte", ip: "192.0.2.24", dispositivo: "Chrome en Windows 10", fecha_inicio: new Date("2026-09-20T07:45:00-05:00"), fecha_expiracion: new Date("2026-09-20T15:45:00-05:00"), estado: "activa" },
  { usuario_id: "USR-005", rol: "cliente", ip: "198.51.100.7", dispositivo: "Chrome en Android", fecha_inicio: new Date("2026-09-19T16:20:00-05:00"), fecha_expiracion: new Date("2026-09-20T00:20:00-05:00"), fecha_cierre: new Date("2026-09-19T16:50:00-05:00"), estado: "cerrada" }
]);


// -----------------------------------------------------------------------------
// TICKETS
// -----------------------------------------------------------------------------
db.tickets.insertMany([
  {
    // Caso del ejemplo del profesor: resuelto y documentado en KB-001
    _id: "TCK-0001",
    cliente_id: "CLI-001",
    reportado_por: "USR-005",
    paquete: "POS",
    tipo: "incidente",
    prioridad: "alta",
    asunto: "No puedo ingresar al sistema POS desde el navegador",
    descripcion: "Escribo el usuario y la contraseña y la página vuelve al inicio de sesión sin mostrar ningún error. Desde el celular sí puedo entrar.",
    detalle: { numero_caja: "CAJA-01", navegador: "Chrome" },
    estado: "cerrado",
    agente_id: "USR-003",
    asignado_por: "USR-001",
    solucion: "Se le pidió a la cliente borrar las cookies y la caché de Chrome. Después de hacerlo pudo ingresar normalmente.",
    historial: [
      { fecha: new Date("2026-09-08T08:15:00-05:00"), estado: "sin_atender", usuario_id: "USR-005", comentario: "Ticket creado por el cliente" },
      { fecha: new Date("2026-09-08T09:00:00-05:00"), estado: "asignado", usuario_id: "USR-001", comentario: "Asignado a Jhon Ascanio" },
      { fecha: new Date("2026-09-08T09:20:00-05:00"), estado: "en_proceso", usuario_id: "USR-003", comentario: "Llamo a la cliente" },
      { fecha: new Date("2026-09-08T09:40:00-05:00"), estado: "resuelto", usuario_id: "USR-003", comentario: "Se borraron cookies y caché" },
      { fecha: new Date("2026-09-09T10:00:00-05:00"), estado: "cerrado", usuario_id: "USR-005", comentario: "Ya puedo entrar, gracias" }
    ],
    fecha_creacion: new Date("2026-09-08T08:15:00-05:00"),
    fecha_actualizacion: new Date("2026-09-09T10:00:00-05:00")
  },
  {
    _id: "TCK-0002",
    cliente_id: "CLI-002",
    reportado_por: "USR-006",
    paquete: "PRODUCCION",
    tipo: "incidente",
    prioridad: "alta",
    asunto: "El sensor de la pasteurizadora marca temperaturas fuera de rango",
    descripcion: "El sistema registra 92,5 °C en la pasteurizadora 2 y el termómetro manual marca 75 °C. El lote quedó bloqueado.",
    detalle: { maquina: "PAST-02", lote: "LT-0915-A", fase: "pasteurizacion", temperatura: 92.5 },
    estado: "en_proceso",
    agente_id: "USR-004",
    asignado_por: "USR-001",
    historial: [
      { fecha: new Date("2026-09-18T07:30:00-05:00"), estado: "sin_atender", usuario_id: "USR-006" },
      { fecha: new Date("2026-09-18T08:00:00-05:00"), estado: "asignado", usuario_id: "USR-001", comentario: "Asignado a Karen Sanguino" },
      { fecha: new Date("2026-09-18T08:30:00-05:00"), estado: "en_proceso", usuario_id: "USR-004", comentario: "Reviso la integración del sensor" }
    ],
    fecha_creacion: new Date("2026-09-18T07:30:00-05:00"),
    fecha_actualizacion: new Date("2026-09-18T08:30:00-05:00")
  },
  {
    _id: "TCK-0003",
    cliente_id: "CLI-004",
    reportado_por: "USR-008",
    paquete: "VENTAS_ONLINE",
    tipo: "incidente",
    prioridad: "alta",
    asunto: "Los pagos por PSE quedan pendientes",
    descripcion: "El banco descuenta el dinero al comprador, pero en la tienda virtual el pedido sigue como pendiente de pago.",
    detalle: { pasarela_pago: "PSE", url_error: "https://tienda.ferresantaclara.test/checkout", navegador: "Chrome", log_api: "POST /api/pagos/confirmacion -> 504 Gateway Timeout" },
    estado: "asignado",
    agente_id: "USR-003",
    asignado_por: "USR-001",
    historial: [
      { fecha: new Date("2026-09-19T10:00:00-05:00"), estado: "sin_atender", usuario_id: "USR-008" },
      { fecha: new Date("2026-09-19T10:30:00-05:00"), estado: "asignado", usuario_id: "USR-001", comentario: "Asignado a Jhon Ascanio" }
    ],
    fecha_creacion: new Date("2026-09-19T10:00:00-05:00"),
    fecha_actualizacion: new Date("2026-09-19T10:30:00-05:00")
  },
  {
    _id: "TCK-0004",
    cliente_id: "CLI-004",
    reportado_por: "USR-008",
    paquete: "INVENTARIOS",
    tipo: "incidente",
    prioridad: "media",
    asunto: "Diferencia entre el inventario del sistema y el conteo físico",
    descripcion: "En la bodega principal contamos 95 unidades del tornillo hexagonal 3/8 y el sistema muestra 120.",
    detalle: { bodega: "BOD-PRINCIPAL", codigo_producto: "TOR-HEX-38", cantidad_sistema: 120, cantidad_fisica: 95 },
    estado: "resuelto",
    agente_id: "USR-004",
    asignado_por: "USR-001",
    solucion: "Había dos traslados a otra bodega sin confirmar la recepción. Al confirmarlos el inventario quedó igual al conteo físico.",
    historial: [
      { fecha: new Date("2026-09-11T14:00:00-05:00"), estado: "sin_atender", usuario_id: "USR-008" },
      { fecha: new Date("2026-09-11T14:20:00-05:00"), estado: "asignado", usuario_id: "USR-001" },
      { fecha: new Date("2026-09-11T15:00:00-05:00"), estado: "en_proceso", usuario_id: "USR-004" },
      { fecha: new Date("2026-09-11T18:00:00-05:00"), estado: "resuelto", usuario_id: "USR-004", comentario: "Traslados confirmados" }
    ],
    fecha_creacion: new Date("2026-09-11T14:00:00-05:00"),
    fecha_actualizacion: new Date("2026-09-11T18:00:00-05:00")
  },
  {
    _id: "TCK-0005",
    cliente_id: "CLI-001",
    reportado_por: "USR-005",
    paquete: "POS",
    tipo: "incidente",
    prioridad: "media",
    asunto: "La impresora de la caja no imprime la factura",
    descripcion: "El sistema dice que la factura se generó, pero la impresora no saca nada. Ya revisé el papel.",
    detalle: { numero_caja: "CAJA-01", dispositivo: "impresora" },
    estado: "sin_atender",
    historial: [
      { fecha: new Date("2026-09-20T11:00:00-05:00"), estado: "sin_atender", usuario_id: "USR-005" }
    ],
    fecha_creacion: new Date("2026-09-20T11:00:00-05:00")
  },
  {
    _id: "TCK-0006",
    cliente_id: "CLI-002",
    reportado_por: "USR-006",
    paquete: "COMPRAS",
    tipo: "consulta",
    prioridad: "baja",
    asunto: "¿Cómo anular una orden de compra que ya fue aprobada?",
    descripcion: "Aprobamos por error la orden OC-004512 y el proveedor todavía no ha despachado.",
    detalle: { orden_compra: "OC-004512", nit_proveedor: "900765432" },
    estado: "sin_atender",
    historial: [
      { fecha: new Date("2026-09-20T12:10:00-05:00"), estado: "sin_atender", usuario_id: "USR-006" }
    ],
    fecha_creacion: new Date("2026-09-20T12:10:00-05:00")
  }
]);


// -----------------------------------------------------------------------------
// BASE DE CONOCIMIENTO
// -----------------------------------------------------------------------------
db.base_conocimiento.insertMany([
  {
    _id: "KB-001",
    ticket_id: "TCK-0001",
    cliente_id: "CLI-001",
    contacto: "María Elena Pérez Guerrero",
    paquete: "POS",
    titulo: "El POS no deja ingresar desde el navegador por cookies antiguas",
    problema: "La señora María Elena Pérez, de La Chispita Roja, no podía ingresar al POS. Escribía usuario y contraseña y la página volvía al inicio de sesión. Desde el celular sí entraba.",
    pasos: [
      "Verificar que el usuario del cliente esté activo",
      "Pedir a la cliente que abra Chrome > Configuración > Privacidad y seguridad > Borrar datos de navegación",
      "Marcar cookies y archivos en caché, con intervalo Desde siempre, y borrar",
      "Cerrar el navegador, abrirlo de nuevo e ingresar al POS"
    ],
    solucion: "Después de borrar las cookies y la caché la cliente ingresó normalmente. La causa era una cookie de sesión anterior a la última actualización del sistema.",
    palabras_clave: ["cookies", "navegador", "inicio de sesión", "no puedo ingresar"],
    autor_id: "USR-003",
    fecha_creacion: new Date("2026-09-08T09:45:00-05:00")
  },
  {
    _id: "KB-002",
    ticket_id: "TCK-0004",
    cliente_id: "CLI-004",
    contacto: "Sandra Patricia Lemus Carvajal",
    paquete: "INVENTARIOS",
    titulo: "Diferencias de inventario por traslados entre bodegas sin confirmar",
    problema: "El conteo físico de un producto daba menos unidades que las que mostraba el sistema en la bodega de origen.",
    pasos: [
      "Consultar en Inventarios > Traslados los movimientos del producto en estado En tránsito",
      "Pedir a la bodega destino que confirme la recepción de cada traslado",
      "Repetir el conteo y, si todavía hay diferencia, registrar un ajuste de inventario"
    ],
    solucion: "Al confirmar los traslados pendientes el inventario del sistema quedó igual al conteo físico.",
    palabras_clave: ["inventario", "traslado", "bodega", "conteo"],
    autor_id: "USR-004",
    fecha_creacion: new Date("2026-09-11T18:05:00-05:00")
  }
]);


// -----------------------------------------------------------------------------
// PAGOS  (uno por paquete y por mes; septiembre y octubre de 2026)
// CLI-003 tiene rechazado el pago de octubre, por eso su paquete está suspendido.
// -----------------------------------------------------------------------------
db.pagos.insertMany([
  { _id: "PAG-0001", cliente_id: "CLI-001", paquete_id: "POS", periodo: "2026-09", valor: 90000, metodo: "PSE", estado: "aprobado", referencia: "PSE-88213045", fecha: new Date("2026-09-01T09:12:00-05:00") },
  { _id: "PAG-0002", cliente_id: "CLI-001", paquete_id: "POS", periodo: "2026-10", valor: 90000, metodo: "PSE", estado: "aprobado", referencia: "PSE-88990311", fecha: new Date("2026-10-01T08:40:00-05:00") },

  { _id: "PAG-0003", cliente_id: "CLI-002", paquete_id: "INVENTARIOS", periodo: "2026-09", valor: 80000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20260901-17", fecha: new Date("2026-09-01T10:00:00-05:00") },
  { _id: "PAG-0004", cliente_id: "CLI-002", paquete_id: "COMPRAS", periodo: "2026-09", valor: 85000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20260901-18", fecha: new Date("2026-09-01T10:00:00-05:00") },
  { _id: "PAG-0005", cliente_id: "CLI-002", paquete_id: "PRODUCCION", periodo: "2026-09", valor: 120000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20260901-19", fecha: new Date("2026-09-01T10:00:00-05:00") },
  { _id: "PAG-0006", cliente_id: "CLI-002", paquete_id: "INVENTARIOS", periodo: "2026-10", valor: 80000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20261001-04", fecha: new Date("2026-10-01T09:30:00-05:00") },
  { _id: "PAG-0007", cliente_id: "CLI-002", paquete_id: "COMPRAS", periodo: "2026-10", valor: 85000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20261001-05", fecha: new Date("2026-10-01T09:30:00-05:00") },
  { _id: "PAG-0008", cliente_id: "CLI-002", paquete_id: "PRODUCCION", periodo: "2026-10", valor: 120000, metodo: "transferencia", estado: "aprobado", referencia: "TRF-20261001-06", fecha: new Date("2026-10-01T09:30:00-05:00") },

  { _id: "PAG-0009", cliente_id: "CLI-003", paquete_id: "VENTAS_ONLINE", periodo: "2026-09", valor: 110000, metodo: "tarjeta_credito", estado: "aprobado", referencia: "TC-551203", fecha: new Date("2026-09-01T12:05:00-05:00") },
  { _id: "PAG-0010", cliente_id: "CLI-003", paquete_id: "VENTAS_ONLINE", periodo: "2026-10", valor: 110000, metodo: "tarjeta_credito", estado: "rechazado", referencia: "TC-560987", motivo_rechazo: "Fondos insuficientes", fecha: new Date("2026-10-01T12:03:00-05:00") },

  { _id: "PAG-0011", cliente_id: "CLI-004", paquete_id: "VENTAS_ONLINE", periodo: "2026-09", valor: 110000, metodo: "PSE", estado: "aprobado", referencia: "PSE-87700120", fecha: new Date("2026-09-15T08:00:00-05:00") },
  { _id: "PAG-0012", cliente_id: "CLI-004", paquete_id: "INVENTARIOS", periodo: "2026-09", valor: 80000, metodo: "PSE", estado: "aprobado", referencia: "PSE-87700121", fecha: new Date("2026-09-15T08:00:00-05:00") },
  { _id: "PAG-0013", cliente_id: "CLI-004", paquete_id: "COMPRAS", periodo: "2026-09", valor: 85000, metodo: "PSE", estado: "aprobado", referencia: "PSE-87700122", fecha: new Date("2026-09-15T08:00:00-05:00") },
  { _id: "PAG-0014", cliente_id: "CLI-004", paquete_id: "PRODUCCION", periodo: "2026-09", valor: 120000, metodo: "PSE", estado: "aprobado", referencia: "PSE-87700123", fecha: new Date("2026-09-15T08:00:00-05:00") },
  { _id: "PAG-0015", cliente_id: "CLI-004", paquete_id: "POS", periodo: "2026-09", valor: 90000, metodo: "PSE", estado: "aprobado", referencia: "PSE-87700124", fecha: new Date("2026-09-15T08:00:00-05:00") },
  { _id: "PAG-0016", cliente_id: "CLI-004", paquete_id: "VENTAS_ONLINE", periodo: "2026-10", valor: 110000, metodo: "PSE", estado: "aprobado", referencia: "PSE-89120450", fecha: new Date("2026-10-01T07:50:00-05:00") },
  { _id: "PAG-0017", cliente_id: "CLI-004", paquete_id: "INVENTARIOS", periodo: "2026-10", valor: 80000, metodo: "PSE", estado: "aprobado", referencia: "PSE-89120451", fecha: new Date("2026-10-01T07:50:00-05:00") },
  { _id: "PAG-0018", cliente_id: "CLI-004", paquete_id: "COMPRAS", periodo: "2026-10", valor: 85000, metodo: "PSE", estado: "aprobado", referencia: "PSE-89120452", fecha: new Date("2026-10-01T07:50:00-05:00") },
  { _id: "PAG-0019", cliente_id: "CLI-004", paquete_id: "PRODUCCION", periodo: "2026-10", valor: 120000, metodo: "PSE", estado: "aprobado", referencia: "PSE-89120453", fecha: new Date("2026-10-01T07:50:00-05:00") },
  { _id: "PAG-0020", cliente_id: "CLI-004", paquete_id: "POS", periodo: "2026-10", valor: 90000, metodo: "PSE", estado: "aprobado", referencia: "PSE-89120454", fecha: new Date("2026-10-01T07:50:00-05:00") }
]);


// -----------------------------------------------------------------------------
// CAPACITACIONES  (cronograma embebido en "sesiones")
// -----------------------------------------------------------------------------
db.capacitaciones.insertMany([
  {
    _id: "CAP-001",
    titulo: "Cierre de caja y arqueo en el POS",
    descripcion: "Apertura y cierre de turno, arqueo de efectivo y reimpresión de facturas.",
    paquete: "POS",
    tipo: "masiva",
    modalidad: "virtual",
    enlace: "https://meet.sistemasintegrados.test/pos-cierre-caja",
    instructor_id: "USR-003",
    cupo_maximo: 50,
    sesiones: [
      { tema: "Apertura y cierre de turno", fecha_inicio: new Date("2026-09-15T15:00:00-05:00"), fecha_fin: new Date("2026-09-15T17:00:00-05:00") }
    ],
    fecha_inicio: new Date("2026-09-15T15:00:00-05:00"),
    fecha_fin: new Date("2026-09-15T17:00:00-05:00"),
    estado: "finalizada",
    fecha_creacion: new Date("2026-09-01T10:00:00-05:00")
  },
  {
    _id: "CAP-002",
    titulo: "Traslados entre bodegas y conteo cíclico",
    descripcion: "Cómo confirmar traslados para que el inventario del sistema cuadre con el conteo físico.",
    paquete: "INVENTARIOS",
    tipo: "masiva",
    modalidad: "virtual",
    enlace: "https://meet.sistemasintegrados.test/inventarios-traslados",
    instructor_id: "USR-004",
    cupo_maximo: 40,
    sesiones: [
      { tema: "Traslados y confirmación de recepción", fecha_inicio: new Date("2026-10-22T15:00:00-05:00"), fecha_fin: new Date("2026-10-22T17:00:00-05:00") },
      { tema: "Conteo cíclico y ajustes de inventario", fecha_inicio: new Date("2026-10-29T15:00:00-05:00"), fecha_fin: new Date("2026-10-29T17:00:00-05:00") }
    ],
    fecha_inicio: new Date("2026-10-22T15:00:00-05:00"),
    fecha_fin: new Date("2026-10-29T17:00:00-05:00"),
    estado: "programada",
    fecha_creacion: new Date("2026-09-25T09:00:00-05:00")
  },
  {
    _id: "CAP-003",
    titulo: "Registro de lotes y lectura de sensores en planta",
    descripcion: "Capacitación en sitio para los operarios de Lácteos Brisas sobre el registro de lotes y la calibración de sensores.",
    paquete: "PRODUCCION",
    tipo: "personalizada",
    cliente_id: "CLI-002",
    modalidad: "presencial",
    lugar: "Planta Lácteos Brisas, kilómetro 3 vía Ocaña - Ábrego",
    instructor_id: "USR-004",
    cupo_maximo: 12,
    sesiones: [
      { tema: "Registro de lotes", fecha_inicio: new Date("2026-10-20T08:00:00-05:00"), fecha_fin: new Date("2026-10-20T12:00:00-05:00") },
      { tema: "Sensores de temperatura y alertas", fecha_inicio: new Date("2026-10-27T08:00:00-05:00"), fecha_fin: new Date("2026-10-27T12:00:00-05:00") }
    ],
    fecha_inicio: new Date("2026-10-20T08:00:00-05:00"),
    fecha_fin: new Date("2026-10-27T12:00:00-05:00"),
    estado: "programada",
    fecha_creacion: new Date("2026-09-30T14:00:00-05:00")
  },
  {
    _id: "CAP-004",
    titulo: "Configuración de pasarelas de pago en la tienda virtual",
    descripcion: "Conexión con PSE y tarjetas, pruebas de pago y revisión de pedidos pendientes.",
    paquete: "VENTAS_ONLINE",
    tipo: "masiva",
    modalidad: "virtual",
    enlace: "https://meet.sistemasintegrados.test/ventas-pasarelas",
    instructor_id: "USR-003",
    cupo_maximo: 60,
    sesiones: [
      { tema: "Pasarelas de pago y confirmación de pedidos", fecha_inicio: new Date("2026-11-05T15:00:00-05:00"), fecha_fin: new Date("2026-11-05T17:30:00-05:00") }
    ],
    fecha_inicio: new Date("2026-11-05T15:00:00-05:00"),
    fecha_fin: new Date("2026-11-05T17:30:00-05:00"),
    estado: "programada",
    fecha_creacion: new Date("2026-10-05T11:00:00-05:00")
  }
]);


// -----------------------------------------------------------------------------
// ASISTENCIAS
// -----------------------------------------------------------------------------
db.asistencias.insertMany([
  { capacitacion_id: "CAP-001", usuario_id: "USR-005", cliente_id: "CLI-001", estado: "asistio", fecha_inscripcion: new Date("2026-09-03T10:00:00-05:00"), calificacion: 5, comentario: "Me quedó claro el arqueo" },
  { capacitacion_id: "CAP-001", usuario_id: "USR-008", cliente_id: "CLI-004", estado: "no_asistio", fecha_inscripcion: new Date("2026-09-05T16:30:00-05:00") },
  { capacitacion_id: "CAP-002", usuario_id: "USR-008", cliente_id: "CLI-004", estado: "inscrito", fecha_inscripcion: new Date("2026-10-01T09:00:00-05:00") },
  { capacitacion_id: "CAP-002", usuario_id: "USR-006", cliente_id: "CLI-002", estado: "inscrito", fecha_inscripcion: new Date("2026-10-02T11:15:00-05:00") },
  { capacitacion_id: "CAP-003", usuario_id: "USR-006", cliente_id: "CLI-002", estado: "inscrito", fecha_inscripcion: new Date("2026-09-30T14:10:00-05:00") },
  { capacitacion_id: "CAP-004", usuario_id: "USR-008", cliente_id: "CLI-004", estado: "inscrito", fecha_inscripcion: new Date("2026-10-06T08:20:00-05:00") }
]);


// -----------------------------------------------------------------------------
// CONTADORES  (último número usado en cada colección; el backend sigue desde aquí)
// -----------------------------------------------------------------------------
function ultimoNumero(coleccion) {
  let max = 0;
  db.getCollection(coleccion).find({}, { _id: 1 }).forEach(d => {
    const n = parseInt(String(d._id).split("-")[1], 10);
    if (n > max) max = n;
  });
  return max;
}

db.contadores.insertMany(
  ["clientes", "empleados", "usuarios", "tickets", "base_conocimiento", "pagos", "capacitaciones"]
    .map(nombre => ({ _id: nombre, secuencia: ultimoNumero(nombre) }))
);


print("Datos cargados:");
for (const nombre of ["roles", "paquetes", "empleados", "clientes", "usuarios", "sesiones", "tickets",
  "base_conocimiento", "pagos", "capacitaciones", "asistencias", "contadores"]) {
  print("  " + nombre + ": " + db.getCollection(nombre).countDocuments());
}
