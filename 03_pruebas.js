// =============================================================================
//  03_pruebas.js  -  Comprueba que las validaciones funcionan
//  Intenta insertar y actualizar documentos con errores; MongoDB debe rechazarlos todos.
//  No deja datos nuevos en la base.
//
//  Uso dentro de mongosh:   load("03_pruebas.js")
// =============================================================================

db = db.getSiblingDB("helpdesk_erp");

var correctas = 0;
var fallidas = 0;

// Ejecuta una operación que DEBE ser rechazada por MongoDB
function debeFallar(descripcion, operacion) {
  try {
    operacion();
    fallidas++;
    print("[FALLO] " + descripcion + " -> MongoDB la aceptó");
  } catch (e) {
    correctas++;
    var motivo = e.code === 121 ? "no cumple el esquema" : e.code === 11000 ? "valor duplicado" : e.message;
    print("[OK]    " + descripcion + " -> rechazado (" + motivo + ")");
  }
}

print("\n--- Control: un documento correcto sí se inserta ---");
try {
  db.clientes.insertOne({
    _id: "CLI-900", tipo_cliente: "persona_natural", tipo_documento: "CC", numero_documento: "1091799999",
    nombre: "Cliente de prueba", correo: "prueba@correo.test", telefono: "3001112233",
    direccion: { direccion: "Calle 1 # 2-3", ciudad: "Ocaña", departamento: "Norte de Santander" },
    estado: "activo", fecha_registro: new Date()
  });
  db.clientes.deleteOne({ _id: "CLI-900" });
  correctas++;
  print("[OK]    Cliente válido insertado y borrado");
} catch (e) {
  fallidas++;
  print("[FALLO] El cliente válido fue rechazado: " + e.message);
}

print("\n--- Clientes ---");
debeFallar("Documento con letras", () => db.clientes.insertOne({
  _id: "CLI-901", tipo_cliente: "persona_natural", tipo_documento: "CC", numero_documento: "10A2345678",
  nombre: "Prueba", correo: "p1@correo.test", telefono: "3001112233",
  direccion: { direccion: "Calle 1", ciudad: "Ocaña", departamento: "Norte de Santander" }, estado: "activo", fecha_registro: new Date()
}));
debeFallar("Persona natural con NIT", () => db.clientes.insertOne({
  _id: "CLI-902", tipo_cliente: "persona_natural", tipo_documento: "NIT", numero_documento: "901999888",
  nombre: "Prueba", correo: "p2@correo.test", telefono: "3001112233",
  direccion: { direccion: "Calle 1", ciudad: "Ocaña", departamento: "Norte de Santander" }, estado: "activo", fecha_registro: new Date()
}));
debeFallar("Empresa sin representante", () => db.clientes.insertOne({
  _id: "CLI-903", tipo_cliente: "empresa", tipo_documento: "NIT", numero_documento: "901999888",
  nombre: "Tienda sin dueño", correo: "p3@correo.test", telefono: "3001112233",
  direccion: { direccion: "Calle 1", ciudad: "Ocaña", departamento: "Norte de Santander" }, estado: "activo", fecha_registro: new Date()
}));
debeFallar("Correo mal escrito", () => db.clientes.insertOne({
  _id: "CLI-904", tipo_cliente: "persona_natural", tipo_documento: "CC", numero_documento: "1091788888",
  nombre: "Prueba", correo: "correo-sin-arroba", telefono: "3001112233",
  direccion: { direccion: "Calle 1", ciudad: "Ocaña", departamento: "Norte de Santander" }, estado: "activo", fecha_registro: new Date()
}));
debeFallar("Documento repetido (el de CLI-003)", () => db.clientes.insertOne({
  _id: "CLI-905", tipo_cliente: "persona_natural", tipo_documento: "CC", numero_documento: "1091700345",
  nombre: "Prueba", correo: "p5@correo.test", telefono: "3001112233",
  direccion: { direccion: "Calle 1", ciudad: "Ocaña", departamento: "Norte de Santander" }, estado: "activo", fecha_registro: new Date()
}));

print("\n--- Empleados ---");
debeFallar("Sexo fuera de la lista", () => db.empleados.updateOne({ _id: "EMP-003" }, { $set: { sexo: "X" } }));
debeFallar("Nombre con números", () => db.empleados.updateOne({ _id: "EMP-003" }, { $set: { nombres: "Jhon2" } }));
debeFallar("Contrato a término fijo sin fecha de fin", () => db.empleados.updateOne({ _id: "EMP-003" }, { $set: { "contrato.tipo_contrato": "termino_fijo" } }));
debeFallar("Cédula repetida (la de EMP-001)", () => db.empleados.updateOne({ _id: "EMP-003" }, { $set: { numero_documento: "1091654321" } }));

print("\n--- Usuarios ---");
debeFallar("Usuario de cliente con rol administrador", () => db.usuarios.updateOne({ _id: "USR-005" }, { $set: { roles: ["administrador"] } }));
debeFallar("Usuario con cliente y empleado al tiempo", () => db.usuarios.updateOne({ _id: "USR-005" }, { $set: { empleado_id: "EMP-099" } }));
debeFallar("Segundo usuario para EMP-001", () => db.usuarios.insertOne({
  _id: "USR-900", usuario: "otro.andres", correo: "otro.andres@correo.test", password_hash: "$2b$10$abcdefghijk",
  roles: ["administrador"], empleado_id: "EMP-001", estado: "activo", fecha_creacion: new Date()
}));

print("\n--- Tickets ---");
debeFallar("Ticket de POS sin número de caja", () => db.tickets.insertOne({
  _id: "TCK-9001", cliente_id: "CLI-001", reportado_por: "USR-005", paquete: "POS", tipo: "incidente", prioridad: "media",
  asunto: "Prueba", descripcion: "Prueba", detalle: { navegador: "Chrome" }, estado: "sin_atender",
  historial: [{ fecha: new Date(), estado: "sin_atender", usuario_id: "USR-005" }], fecha_creacion: new Date()
}));
debeFallar("Ticket de PRODUCCION sin temperatura", () => db.tickets.insertOne({
  _id: "TCK-9002", cliente_id: "CLI-002", reportado_por: "USR-006", paquete: "PRODUCCION", tipo: "incidente", prioridad: "alta",
  asunto: "Prueba", descripcion: "Prueba", detalle: { maquina: "PAST-01", lote: "LT-1" }, estado: "sin_atender",
  historial: [{ fecha: new Date(), estado: "sin_atender", usuario_id: "USR-006" }], fecha_creacion: new Date()
}));
debeFallar("Paquete que no existe (NOMINA)", () => db.tickets.updateOne({ _id: "TCK-0005" }, { $set: { paquete: "NOMINA" } }));
debeFallar("Pasar a asignado sin agente", () => db.tickets.updateOne({ _id: "TCK-0005" }, { $set: { estado: "asignado" } }));
debeFallar("Pasar a resuelto sin solución", () => db.tickets.updateOne({ _id: "TCK-0003" }, { $set: { estado: "resuelto" } }));

debeFallar("Ticket de PRODUCCION con temperatura escrita como texto", () => db.tickets.insertOne({
  _id: "TCK-9003", cliente_id: "CLI-002", reportado_por: "USR-006", paquete: "PRODUCCION", tipo: "incidente", prioridad: "alta",
  asunto: "Prueba", descripcion: "Prueba", detalle: { maquina: "PAST-01", lote: "LT-1", temperatura: "caliente" }, estado: "sin_atender",
  historial: [{ fecha: new Date(), estado: "sin_atender", usuario_id: "USR-006" }], fecha_creacion: new Date()
}));
debeFallar("Ticket de COMPRAS con NIT de proveedor con letras", () => db.tickets.insertOne({
  _id: "TCK-9004", cliente_id: "CLI-002", reportado_por: "USR-006", paquete: "COMPRAS", tipo: "consulta", prioridad: "baja",
  asunto: "Prueba", descripcion: "Prueba", detalle: { orden_compra: "OC-000001", nit_proveedor: "90076A432" }, estado: "sin_atender",
  historial: [{ fecha: new Date(), estado: "sin_atender", usuario_id: "USR-006" }], fecha_creacion: new Date()
}));

print("\n--- Base de conocimiento ---");
debeFallar("Artículo sin pasos", () => db.base_conocimiento.updateOne({ _id: "KB-001" }, { $set: { pasos: [] } }));

print("\n--- Paquetes ---");
debeFallar("Paquete sin campos para el formulario", () => db.paquetes.updateOne({ _id: "POS" }, { $unset: { campos_ticket: "" } }));
debeFallar("Campo de tipo lista sin opciones", () => db.paquetes.updateOne({ _id: "POS" }, {
  $push: { campos_ticket: { campo: "marca_impresora", etiqueta: "Marca", tipo: "lista", requerido: false } }
}));

print("\n--- Pagos ---");
debeFallar("Pago rechazado sin motivo", () => db.pagos.insertOne({
  _id: "PAG-9001", cliente_id: "CLI-001", paquete_id: "POS", periodo: "2026-11", valor: 90000, metodo: "PSE", estado: "rechazado", fecha: new Date()
}));
debeFallar("Periodo con mes 13", () => db.pagos.insertOne({
  _id: "PAG-9002", cliente_id: "CLI-001", paquete_id: "POS", periodo: "2026-13", valor: 90000, metodo: "PSE", estado: "aprobado", fecha: new Date()
}));

print("\n--- Capacitaciones ---");
debeFallar("Capacitación personalizada sin cliente", () => db.capacitaciones.updateOne({ _id: "CAP-002" }, { $set: { tipo: "personalizada" } }));
debeFallar("Capacitación virtual sin enlace", () => db.capacitaciones.updateOne({ _id: "CAP-001" }, { $unset: { enlace: "" } }));
debeFallar("Inscribir dos veces al mismo usuario", () => db.asistencias.insertOne({
  capacitacion_id: "CAP-002", usuario_id: "USR-008", cliente_id: "CLI-004", estado: "inscrito", fecha_inscripcion: new Date()
}));
debeFallar("Calificar sin haber asistido", () => db.asistencias.updateOne(
  { capacitacion_id: "CAP-002", usuario_id: "USR-006" }, { $set: { calificacion: 4 } }
));

print("\nCorrectas: " + correctas + "   Fallidas: " + fallidas + "\n");
