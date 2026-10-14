// =============================================================================
//  04_reportes.js  -  Reportes con el Framework de Agregación
//  Son los mismos pipelines que usa el backend (ReportesService.java) para los
//  dashboards. Sirven para la sustentación: se corren en mongosh y el
//  resultado debe coincidir con lo que muestra la interfaz.
//
//  Uso dentro de mongosh:   load("04_reportes.js")
//  También se puede copiar cada bloque db.<coleccion>.aggregate(...) por separado.
// =============================================================================

db = db.getSiblingDB("helpdesk_erp");

function mostrar(titulo, resultado) {
  print("\n--- " + titulo + " ---");
  printjson(resultado.toArray ? resultado.toArray() : resultado);
}


// 1. Qué paquete del ERP falla más ($match, $group, $lookup)
mostrar("Incidentes por paquete", db.tickets.aggregate([
  { $match: { tipo: "incidente" } },
  { $group: {
      _id: "$paquete",
      total: { $sum: 1 },
      abiertos: { $sum: { $cond: [ { $in: [ "$estado", [ "sin_atender", "asignado", "en_proceso" ] ] }, 1, 0 ] } }
  } },
  { $lookup: { from: "paquetes", localField: "_id", foreignField: "_id", as: "paquete" } },
  { $project: { _id: 0, paquete_id: "$_id", nombre: { $first: "$paquete.nombre" }, total: 1, abiertos: 1 } },
  { $sort: { total: -1, nombre: 1 } }
]));


// 2. Tickets por estado (tarjetas de los dashboards)
mostrar("Tickets por estado", db.tickets.aggregate([
  { $group: { _id: "$estado", total: { $sum: 1 } } }
]));


// 3. Carga de cada agente: tickets abiertos y resueltos ($lookup con pipeline)
mostrar("Carga por agente", db.usuarios.aggregate([
  { $match: { roles: "agente_soporte", estado: "activo" } },
  { $lookup: { from: "empleados", localField: "empleado_id", foreignField: "_id", as: "empleado" } },
  { $lookup: {
      from: "tickets", localField: "_id", foreignField: "agente_id", as: "carga",
      pipeline: [
        { $group: {
            _id: null,
            abiertos: { $sum: { $cond: [ { $in: [ "$estado", [ "asignado", "en_proceso" ] ] }, 1, 0 ] } },
            resueltos: { $sum: { $cond: [ { $in: [ "$estado", [ "resuelto", "cerrado" ] ] }, 1, 0 ] } }
        } }
      ]
  } },
  { $project: {
      _id: 0, agente_id: "$_id",
      nombre: { $concat: [ { $first: "$empleado.nombres" }, " ", { $first: "$empleado.apellidos" } ] },
      abiertos: { $ifNull: [ { $first: "$carga.abiertos" }, 0 ] },
      resueltos: { $ifNull: [ { $first: "$carga.resueltos" }, 0 ] }
  } },
  { $sort: { abiertos: -1, nombre: 1 } }
]));


// 4. Clientes, paquetes activos y suspendidos, ingreso mensual esperado
mostrar("Resumen de clientes", db.clientes.aggregate([
  { $project: {
      estado: 1,
      activos: { $filter: { input: { $ifNull: [ "$paquetes_contratados", [] ] }, cond: { $eq: [ "$$this.estado", "activo" ] } } },
      suspendidos: { $filter: { input: { $ifNull: [ "$paquetes_contratados", [] ] }, cond: { $eq: [ "$$this.estado", "suspendido" ] } } }
  } },
  { $group: {
      _id: null,
      total: { $sum: 1 },
      activos: { $sum: { $cond: [ { $eq: [ "$estado", "activo" ] }, 1, 0 ] } },
      paquetes_activos: { $sum: { $size: "$activos" } },
      paquetes_suspendidos: { $sum: { $size: "$suspendidos" } },
      ingreso_mensual: { $sum: { $sum: "$activos.precio_mensual" } }
  } },
  { $project: { _id: 0 } }
]));


// 5. Horas promedio hasta resolver un ticket, por paquete (lee el historial embebido)
mostrar("Tiempo de resolución por paquete", db.tickets.aggregate([
  { $match: { estado: { $in: [ "resuelto", "cerrado" ] } } },
  { $project: {
      paquete: 1, fecha_creacion: 1,
      resuelto: { $first: { $filter: { input: "$historial", cond: { $eq: [ "$$this.estado", "resuelto" ] } } } }
  } },
  { $group: {
      _id: "$paquete",
      tickets: { $sum: 1 },
      minutos: { $avg: { $dateDiff: { startDate: "$fecha_creacion", endDate: "$resuelto.fecha", unit: "minute" } } }
  } },
  { $lookup: { from: "paquetes", localField: "_id", foreignField: "_id", as: "paquete" } },
  { $project: {
      _id: 0, paquete_id: "$_id", nombre: { $first: "$paquete.nombre" }, tickets: 1,
      horas_promedio: { $round: [ { $divide: [ "$minutos", 60 ] }, 1 ] }
  } },
  { $sort: { horas_promedio: -1 } }
]));


// 6. Recaudo y pagos rechazados por paquete
mostrar("Ingresos por paquete", db.pagos.aggregate([
  { $group: {
      _id: "$paquete_id",
      recaudado: { $sum: { $cond: [ { $eq: [ "$estado", "aprobado" ] }, "$valor", 0 ] } },
      aprobados: { $sum: { $cond: [ { $eq: [ "$estado", "aprobado" ] }, 1, 0 ] } },
      rechazados: { $sum: { $cond: [ { $eq: [ "$estado", "rechazado" ] }, 1, 0 ] } }
  } },
  { $lookup: { from: "paquetes", localField: "_id", foreignField: "_id", as: "paquete" } },
  { $project: { _id: 0, paquete_id: "$_id", nombre: { $first: "$paquete.nombre" }, recaudado: 1, aprobados: 1, rechazados: 1 } },
  { $sort: { recaudado: -1 } }
]));


// 7. Asistencia y calificación de cada capacitación
mostrar("Asistencia por capacitación", db.asistencias.aggregate([
  { $group: {
      _id: "$capacitacion_id",
      inscritos: { $sum: { $cond: [ { $ne: [ "$estado", "cancelado" ] }, 1, 0 ] } },
      asistieron: { $sum: { $cond: [ { $eq: [ "$estado", "asistio" ] }, 1, 0 ] } },
      no_asistieron: { $sum: { $cond: [ { $eq: [ "$estado", "no_asistio" ] }, 1, 0 ] } },
      calificacion: { $avg: "$calificacion" }
  } },
  { $lookup: { from: "capacitaciones", localField: "_id", foreignField: "_id", as: "capacitacion" } },
  { $project: {
      _id: 0, capacitacion_id: "$_id",
      titulo: { $first: "$capacitacion.titulo" }, paquete: { $first: "$capacitacion.paquete" },
      estado: { $first: "$capacitacion.estado" }, fecha_inicio: { $first: "$capacitacion.fecha_inicio" },
      inscritos: 1, asistieron: 1, no_asistieron: 1, calificacion: { $round: [ "$calificacion", 1 ] }
  } },
  { $sort: { fecha_inicio: 1 } }
]));


// 8. Últimos cambios de estado de cualquier ticket ($unwind del historial)
mostrar("Actividad reciente", db.tickets.aggregate([
  { $unwind: "$historial" },
  { $sort: { "historial.fecha": -1 } },
  { $limit: 12 },
  { $lookup: { from: "usuarios", localField: "historial.usuario_id", foreignField: "_id", as: "usuario",
      pipeline: [ { $project: { usuario: 1, roles: 1 } } ] } },
  { $project: {
      _id: 0, ticket_id: "$_id", asunto: 1, estado: "$historial.estado", fecha: "$historial.fecha",
      comentario: "$historial.comentario", usuario: { $first: "$usuario.usuario" },
      rol: { $first: { $first: "$usuario.roles" } }
  } }
]));


// =============================================================================
// EXPLAIN: comprobar que las consultas de los dashboards usan índices
// En la salida, winningPlan debe mostrar IXSCAN con el nombre del índice y
// totalDocsExamined debe ser igual (o cercano) a nReturned.
// =============================================================================

function resumenExplain(titulo, explicacion) {
  const nombre = e => e.stage + (e.indexName ? " (" + e.indexName + ")" : "");
  const etapas = [];
  let etapa = explicacion.queryPlanner.winningPlan;
  while (etapa) {
    // SORT_MERGE y OR tienen varias ramas (por ejemplo, una por cada valor de un $in)
    etapas.push(nombre(etapa) + (etapa.inputStages ? " [" + etapa.inputStages.map(nombre).join(", ") + "]" : ""));
    etapa = etapa.inputStage || (etapa.queryPlan && etapa.queryPlan.inputStage) || etapa.queryPlan;
  }
  const stats = explicacion.executionStats;
  print("\n--- explain: " + titulo + " ---");
  print("  plan: " + etapas.join(" <- "));
  print("  devueltos: " + stats.nReturned + "   documentos examinados: " + stats.totalDocsExamined +
    "   claves examinadas: " + stats.totalKeysExamined + "   ms: " + stats.executionTimeMillis);
}

// Bandeja del administrador (índice tickets_por_estado)
resumenExplain("bandeja sin atender",
  db.tickets.find({ estado: "sin_atender" }).sort({ fecha_creacion: 1 }).explain("executionStats"));

// Bandeja del agente (índice tickets_por_agente, sin etapa SORT)
resumenExplain("tickets del agente USR-003",
  db.tickets.find({ agente_id: "USR-003", estado: { $in: ["asignado", "en_proceso"] } }).sort({ fecha_creacion: -1 }).explain("executionStats"));

// "Mis tickets" del cliente (índice tickets_por_cliente, sin etapa SORT)
resumenExplain("tickets del cliente CLI-004",
  db.tickets.find({ cliente_id: "CLI-004" }).sort({ fecha_creacion: -1 }).explain("executionStats"));

// Búsqueda en la base de conocimiento (índice de texto busqueda_texto)
resumenExplain("búsqueda de texto",
  db.base_conocimiento.find({ $text: { $search: "no puedo ingresar navegador" } }).explain("executionStats"));

// Próximas capacitaciones (índice capacitaciones_proximas)
resumenExplain("capacitaciones programadas",
  db.capacitaciones.find({ estado: "programada" }).sort({ fecha_inicio: 1 }).explain("executionStats"));

// Para ver la salida completa de cualquiera, quite resumenExplain, por ejemplo:
//   db.tickets.find({ estado: "sin_atender" }).explain("executionStats")
