# Guía de CRUD para la sustentación

Comandos listos para copiar en mongosh. Antes de empezar:

```js
use helpdesk_erp
```

Los `_id` son códigos legibles (`CLI-001`, `EMP-001`, `USR-001`, `TCK-0001`, `KB-001`, `PAG-0001`, `CAP-001`), así que para buscar, actualizar o borrar basta con escribir el código. Al crear un documento nuevo hay que poner el siguiente código disponible. Con los datos de prueba, los siguientes libres son `CLI-005`, `EMP-005`, `USR-009`, `TCK-0007`, `KB-003`, `PAG-0021` y `CAP-005`.

El backend no adivina el código: lo saca de la colección `contadores`, que guarda el último número usado en cada colección. Para pedir el siguiente desde mongosh (y dejarlo reservado):

```js
db.contadores.findOneAndUpdate({ _id: "clientes" }, { $inc: { secuencia: 1 } }, { returnDocument: "after" })
// { _id: 'clientes', secuencia: 5 }  ->  el código nuevo es CLI-005
```

Si los ejemplos de esta guía se insertan a mano con su código, los contadores quedan atrás. Para ponerlos al día, se vuelve a correr `02_datos_semilla.js` (que reinicia todos los datos) o se ajusta cada uno con `$set`, por ejemplo `db.contadores.updateOne({ _id: "clientes" }, { $set: { secuencia: 7 } })`.

---

## Clientes

### Crear

Persona natural:

```js
db.clientes.insertOne({
  _id: "CLI-005",
  tipo_cliente: "persona_natural",
  tipo_documento: "CC",
  numero_documento: "1091723344",
  nombre: "Natalia Ascanio Rincón",
  correo: "natalia.ascanio@correo.test",
  telefono: "3186665544",
  direccion: { direccion: "Calle 11 # 9-60", ciudad: "Ocaña", departamento: "Norte de Santander" },
  paquetes_contratados: [
    { paquete_id: "POS", nombre: "Sistema POS", precio_mensual: 90000, fecha_inicio: new Date("2026-09-21"), fecha_fin: new Date("2027-03-21"), estado: "activo" }
  ],
  estado: "activo",
  fecha_registro: new Date()
})
```

Empresa (debe llevar NIT y representante):

```js
db.clientes.insertOne({
  _id: "CLI-006",
  tipo_cliente: "empresa",
  tipo_documento: "NIT",
  numero_documento: "27890123",
  nombre: "Panadería Trigo de Oro",
  representante: "Ludy Esperanza Jaime Ortiz",
  correo: "trigodeoro@correo.test",
  telefono: "3148887766",
  direccion: { direccion: "Carrera 4 # 6-18", ciudad: "Ábrego", departamento: "Norte de Santander" },
  paquetes_contratados: [],
  estado: "activo",
  fecha_registro: new Date()
})
```

Cuando se registra un cliente, el sistema le crea su usuario. En el shell se hace con un segundo insert:

```js
db.usuarios.insertOne({
  _id: "USR-009",
  usuario: "natalia.ascanio",
  correo: "natalia.ascanio@correo.test",
  password_hash: "$2b$10$itrYzHP5qSD29p3r.1hNHeJoOcMD7icEs8oT.tL6Ag4Fr59fyT/ka",
  roles: ["cliente"],
  cliente_id: "CLI-005",
  estado: "activo",
  credenciales_enviadas: false,
  fecha_creacion: new Date()
})
```

### Leer

```js
db.clientes.find()                                           // todos
db.clientes.findOne({ _id: "CLI-001" })                      // uno
db.clientes.find({ tipo_cliente: "persona_juridica" })       // por tipo
db.clientes.find({ "paquetes_contratados.paquete_id": "POS" }, { nombre: 1 })   // quiénes tienen POS

// Qué paquetes contrató un cliente
db.clientes.findOne({ _id: "CLI-002" }, { nombre: 1, paquetes_contratados: 1 })
```

### Actualizar

```js
// Cambiar el teléfono
db.clientes.updateOne({ _id: "CLI-001" }, { $set: { telefono: "3165550000" } })

// Agregar un paquete nuevo al cliente
db.clientes.updateOne(
  { _id: "CLI-001" },
  { $push: { paquetes_contratados: { paquete_id: "INVENTARIOS", nombre: "Inventarios", precio_mensual: 80000, fecha_inicio: new Date(), fecha_fin: new Date("2027-09-21"), estado: "activo" } } }
)

// Suspender un paquete puntual (el $ apunta al elemento que cumplió el filtro)
db.clientes.updateOne(
  { _id: "CLI-001", "paquetes_contratados.paquete_id": "POS" },
  { $set: { "paquetes_contratados.$.estado": "suspendido" } }
)

// Suspender al cliente completo
db.clientes.updateOne({ _id: "CLI-001" }, { $set: { estado: "suspendido" } })
```

### Eliminar

```js
db.usuarios.deleteMany({ cliente_id: "CLI-006" })   // primero sus usuarios
db.clientes.deleteOne({ _id: "CLI-006" })
```

Un cliente con tickets no se debería borrar porque se pierde la trazabilidad. Para esos casos se usa `estado: "inactivo"`.

---

## Empleados

### Crear

```js
db.empleados.insertOne({
  _id: "EMP-005",
  numero_documento: "1091734455",
  nombres: "Diego Armando",
  apellidos: "Pacheco Sanjuán",
  sexo: "masculino",
  estado_civil: "soltero",
  profesion: "Tecnólogo en sistemas",
  correo_personal: "diego.pacheco@correo.test",
  telefono_movil: "3176663322",
  direccion: { direccion: "Calle 12 # 20-05", barrio: "Santa Clara", ciudad: "Ocaña", departamento: "Norte de Santander" },
  contrato: {
    cargo: "Técnico de soporte", area: "soporte", tipo_contrato: "termino_fijo",
    fecha_inicio: new Date("2026-09-21"), fecha_fin: new Date("2027-09-20"),
    salario: 2300000, jornada: "tiempo_completo", modalidad: "presencial"
  },
  seguridad_social: { eps: "Nueva EPS", fondo_pensiones: "Colpensiones", arl: "Positiva" },
  estado: "activo",
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date()
})

// Su usuario, con el rol de soporte
db.usuarios.insertOne({
  _id: "USR-010",
  usuario: "diego.pacheco",
  correo: "diego.pacheco@sistemasintegrados.test",
  password_hash: "$2b$10$itrYzHP5qSD29p3r.1hNHeJoOcMD7icEs8oT.tL6Ag4Fr59fyT/ka",
  roles: ["agente_soporte"],
  empleado_id: "EMP-005",
  estado: "activo",
  credenciales_enviadas: false,
  fecha_creacion: new Date()
})
```

### Leer

```js
db.empleados.find({}, { nombres: 1, apellidos: 1, "contrato.cargo": 1 })
db.empleados.findOne({ _id: "EMP-003" })
db.empleados.find({ "contrato.area": "soporte", estado: "activo" })
db.empleados.find({ "contrato.salario": { $gte: 3000000 } }, { nombres: 1, "contrato.salario": 1 })
```

### Actualizar

```js
db.empleados.updateOne({ _id: "EMP-003" }, { $set: { estado_civil: "casado", fecha_actualizacion: new Date() } })
db.empleados.updateOne({ _id: "EMP-003" }, { $set: { "contrato.salario": 2500000, fecha_actualizacion: new Date() } })
```

### Eliminar

Retiro normal (se conserva el registro y se desactiva el usuario):

```js
db.empleados.updateOne({ _id: "EMP-005" }, { $set: { estado: "retirado", fecha_actualizacion: new Date() } })
db.usuarios.updateOne({ empleado_id: "EMP-005" }, { $set: { estado: "inactivo" } })
```

Borrado definitivo:

```js
db.usuarios.deleteOne({ empleado_id: "EMP-005" })
db.empleados.deleteOne({ _id: "EMP-005" })
```

---

## Usuarios y roles

```js
db.roles.find()
db.usuarios.find({ roles: "agente_soporte", estado: "activo" }, { usuario: 1 })   // agentes disponibles
db.usuarios.updateOne({ _id: "USR-004" }, { $addToSet: { roles: "auditor" } })     // darle otro rol
db.usuarios.updateOne({ _id: "USR-004" }, { $pull: { roles: "auditor" } })         // quitárselo
db.usuarios.updateOne({ _id: "USR-007" }, { $set: { estado: "bloqueado" } })
```

## Sesiones

```js
// Inicio de sesión
db.sesiones.insertOne({ usuario_id: "USR-004", rol: "agente_soporte", ip: "192.0.2.30", dispositivo: "Edge en Windows 11", fecha_inicio: new Date(), fecha_expiracion: new Date(Date.now() + 8 * 60 * 60 * 1000), estado: "activa" })

// Cierre de sesión
db.sesiones.updateOne({ usuario_id: "USR-004", estado: "activa" }, { $set: { estado: "cerrada", fecha_cierre: new Date() } })

// Sesiones activas y limpieza de las cerradas
db.sesiones.find({ estado: "activa" })
db.sesiones.deleteMany({ estado: { $in: ["cerrada", "expirada"] } })
```

---

## Tickets

### Crear (lo hace el cliente)

El campo `detalle` cambia según el paquete. Este es un ticket de Producción, que exige máquina, lote y temperatura:

```js
db.tickets.insertOne({
  _id: "TCK-0007",
  cliente_id: "CLI-002",
  reportado_por: "USR-006",
  paquete: "PRODUCCION",
  tipo: "incidente",
  prioridad: "alta",
  asunto: "La balanza de empaque no envía el peso al lote",
  descripcion: "La balanza muestra el peso, pero el lote en el sistema queda en cero.",
  detalle: { maquina: "BAL-01", lote: "LT-0921-P", fase: "empaque", temperatura: 4.5 },
  estado: "sin_atender",
  historial: [{ fecha: new Date(), estado: "sin_atender", usuario_id: "USR-006" }],
  fecha_creacion: new Date()
})
```

Campos de `detalle` por paquete:

| Paquete | Obligatorios | Opcionales |
|---|---|---|
| VENTAS_ONLINE | `pasarela_pago`, `url_error` (empieza por `http`), `navegador` | `log_api` |
| INVENTARIOS | `bodega`, `codigo_producto` | `codigo_barras` (8 a 14 dígitos), `cantidad_sistema`, `cantidad_fisica` (números) |
| COMPRAS | `orden_compra` (formato `OC-004512`), `nit_proveedor` (solo dígitos) | `etapa` |
| PRODUCCION | `maquina`, `lote`, `temperatura` (número) | `fase` |
| POS | `numero_caja` | `dispositivo`, `turno`, `navegador` |

La misma lista está en `paquetes.campos_ticket`, que es de donde la lee el formulario. Si se agrega un campo obligatorio hay que cambiar los dos: el documento del paquete y el `oneOf` de `tickets` en `01_esquema.js`.

### El administrador asigna el ticket a un agente

```js
db.tickets.updateOne(
  { _id: "TCK-0007" },
  {
    $set: { estado: "asignado", agente_id: "USR-004", asignado_por: "USR-001", fecha_actualizacion: new Date() },
    $push: { historial: { fecha: new Date(), estado: "asignado", usuario_id: "USR-001", comentario: "Asignado a Karen Sanguino" } }
  }
)
```

### El agente lo atiende y lo resuelve

```js
db.tickets.updateOne(
  { _id: "TCK-0007" },
  {
    $set: { estado: "en_proceso", fecha_actualizacion: new Date() },
    $push: { historial: { fecha: new Date(), estado: "en_proceso", usuario_id: "USR-004" } }
  }
)

db.tickets.updateOne(
  { _id: "TCK-0007" },
  {
    $set: { estado: "resuelto", solucion: "Se configuró el puerto COM correcto de la balanza y se reinició el servicio.", fecha_actualizacion: new Date() },
    $push: { historial: { fecha: new Date(), estado: "resuelto", usuario_id: "USR-004", comentario: "Puerto COM corregido" } }
  }
)
```

### Leer

```js
db.tickets.find({ estado: "sin_atender" }).sort({ fecha_creacion: 1 })     // bandeja del administrador
db.tickets.find({ agente_id: "USR-003" })                                   // bandeja de un agente
db.tickets.find({ cliente_id: "CLI-001" })                                  // tickets de un cliente
db.tickets.findOne({ _id: "TCK-0001" }, { estado: 1, agente_id: 1, historial: 1 })   // trazabilidad
```

### Eliminar

```js
db.tickets.deleteOne({ _id: "TCK-0007" })
```

---

## Base de conocimiento

### Crear (a partir del ticket resuelto)

```js
db.base_conocimiento.insertOne({
  _id: "KB-003",
  ticket_id: "TCK-0007",
  cliente_id: "CLI-002",
  contacto: "Wilmer Alonso Picón Durán",
  paquete: "PRODUCCION",
  titulo: "La balanza de empaque no envía el peso por un cambio de puerto COM",
  problema: "La balanza mostraba el peso en pantalla, pero el lote en el sistema quedaba en cero.",
  pasos: [
    "Revisar en el Administrador de dispositivos el puerto COM de la balanza",
    "Configurar ese puerto en Producción > Maquinaria",
    "Reiniciar el servicio de integración de balanzas",
    "Pesar una unidad de prueba"
  ],
  solucion: "Con el puerto correcto el peso volvió a llegar al lote.",
  palabras_clave: ["balanza", "puerto com", "peso"],
  autor_id: "USR-004",
  fecha_creacion: new Date()
})
```

### Buscar con texto libre

```js
db.base_conocimiento.find(
  { $text: { $search: "no puedo ingresar navegador" } },
  { titulo: 1, score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

### Actualizar y eliminar

```js
db.base_conocimiento.updateOne({ _id: "KB-003" }, { $push: { pasos: "Dejar el puerto fijo en la configuración de Windows" } })
db.base_conocimiento.deleteOne({ _id: "KB-003" })
```

---

## Paquetes y formulario dinámico

```js
db.paquetes.find({}, { nombre: 1, precio_mensual: 1 })
db.paquetes.findOne({ _id: "PRODUCCION" }, { campos_ticket: 1 })   // lo que pide el formulario

// Agregar un campo opcional al formulario de POS: el frontend lo muestra sin cambiar código
db.paquetes.updateOne(
  { _id: "POS" },
  { $push: { campos_ticket: { campo: "numero_factura", etiqueta: "Número de factura", tipo: "texto", requerido: false } } }
)

// Subir el precio del catálogo (los clientes que ya lo tienen conservan el precio de su contrato)
db.paquetes.updateOne({ _id: "POS" }, { $set: { precio_mensual: 95000 } })
```

---

## Pagos y transacciones

```js
db.pagos.find({ cliente_id: "CLI-004" }).sort({ fecha: -1 })        // estado de cuenta (índice pagos_por_cliente)
db.pagos.find({ estado: "rechazado" }).sort({ fecha: -1 })          // rechazos recientes (índice pagos_por_estado)
```

Cuando un pago se rechaza pasan dos cosas: se guarda el pago y se suspende ese paquete en el cliente. Son dos colecciones, así que van en una transacción: o quedan las dos o no queda ninguna.

```js
const sesion = db.getMongo().startSession()
sesion.withTransaction(() => {
  const bd = sesion.getDatabase("helpdesk_erp")
  bd.pagos.insertOne({
    _id: "PAG-0021", cliente_id: "CLI-001", paquete_id: "POS", periodo: "2026-11", valor: 90000,
    metodo: "PSE", estado: "rechazado", motivo_rechazo: "El banco rechazó la transacción", fecha: new Date()
  })
  bd.clientes.updateOne(
    { _id: "CLI-001", "paquetes_contratados.paquete_id": "POS" },
    { $set: { "paquetes_contratados.$.estado": "suspendido" } }
  )
})
sesion.endSession()
```

Para ver el rollback, se repite con otro `_id` (por ejemplo `PAG-0022`) y un estado que el validador no acepta en el segundo paso, como `"congelado"` en lugar de `"suspendido"`. MongoDB rechaza el `updateOne`, la transacción se aborta y el pago del primer paso tampoco queda: `db.pagos.findOne({ _id: "PAG-0022" })` devuelve `null`.

Para reactivar el paquete cuando el cliente paga, la misma transacción inserta un pago `aprobado` y pone el paquete en `activo`.

---

## Capacitaciones y asistencias

### Crear

Una masiva (abierta a todos los clientes del paquete) y virtual, con dos sesiones:

```js
db.capacitaciones.insertOne({
  _id: "CAP-005",
  titulo: "Órdenes de compra y cuentas por pagar",
  descripcion: "Aprobación, anulación y seguimiento de órdenes de compra.",
  paquete: "COMPRAS",
  tipo: "masiva",
  modalidad: "virtual",
  enlace: "https://meet.sistemasintegrados.test/compras-ordenes",
  instructor_id: "USR-003",
  cupo_maximo: 40,
  sesiones: [
    { tema: "Aprobación y anulación", fecha_inicio: new Date("2026-11-12T15:00:00-05:00"), fecha_fin: new Date("2026-11-12T17:00:00-05:00") },
    { tema: "Cuentas por pagar", fecha_inicio: new Date("2026-11-19T15:00:00-05:00"), fecha_fin: new Date("2026-11-19T17:00:00-05:00") }
  ],
  fecha_inicio: new Date("2026-11-12T15:00:00-05:00"),
  fecha_fin: new Date("2026-11-19T17:00:00-05:00"),
  estado: "programada",
  fecha_creacion: new Date()
})
```

Una personalizada debe llevar `cliente_id`, y una presencial `lugar` en vez de `enlace`.

Inscribir a un usuario (el índice único impide inscribirlo dos veces):

```js
db.asistencias.insertOne({ capacitacion_id: "CAP-005", usuario_id: "USR-006", cliente_id: "CLI-002", estado: "inscrito", fecha_inscripcion: new Date() })
```

### Leer

```js
db.capacitaciones.find({ estado: "programada" }).sort({ fecha_inicio: 1 })     // cronograma (índice capacitaciones_proximas)
db.asistencias.find({ capacitacion_id: "CAP-002" })                            // inscritos
db.asistencias.find({ cliente_id: "CLI-004" })                                 // capacitaciones de un cliente
```

### Actualizar

```js
// Registrar que asistió y su calificación (solo se puede calificar si asistió)
db.asistencias.updateOne(
  { capacitacion_id: "CAP-001", usuario_id: "USR-008" },
  { $set: { estado: "asistio", calificacion: 4 } }
)

// Agregar una sesión al cronograma
db.capacitaciones.updateOne(
  { _id: "CAP-005" },
  { $push: { sesiones: { tema: "Preguntas abiertas", fecha_inicio: new Date("2026-11-26T15:00:00-05:00"), fecha_fin: new Date("2026-11-26T16:00:00-05:00") } },
    $set: { fecha_fin: new Date("2026-11-26T16:00:00-05:00") } }
)

db.capacitaciones.updateOne({ _id: "CAP-005" }, { $set: { estado: "cancelada" } })
```

### Eliminar

```js
db.asistencias.deleteMany({ capacitacion_id: "CAP-005" })
db.capacitaciones.deleteOne({ _id: "CAP-005" })
```

---

## Consultas que suelen pedir

```js
// Ticket con los datos del cliente ($lookup)
db.tickets.aggregate([
  { $match: { _id: "TCK-0001" } },
  { $lookup: { from: "clientes", localField: "cliente_id", foreignField: "_id", as: "cliente" } }
])

// Paquete con más tickets
db.tickets.aggregate([
  { $group: { _id: "$paquete", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
])

// Cuántos tickets hay en cada estado
db.tickets.aggregate([{ $group: { _id: "$estado", total: { $sum: 1 } } }])

// Comprobar que la consulta usa un índice
db.tickets.find({ estado: "sin_atender" }).explain("executionStats")
```

Los reportes completos de los dashboards (incidentes por paquete, carga por agente, tiempo de resolución, recaudo, asistencia) y el resumen de los `explain` están en `04_reportes.js`.

---

## En Compass o en Atlas (Data Explorer)

**Insertar:** en la colección, botón **Add Data > Insert Document** (en Atlas, **Insert Document**). Se pega el documento en formato JSON. Las fechas se escriben así:

```json
{
  "_id": "CLI-007",
  "tipo_cliente": "persona_natural",
  "tipo_documento": "CC",
  "numero_documento": "1091745566",
  "nombre": "Yeimy Carrascal Ropero",
  "correo": "yeimy.carrascal@correo.test",
  "telefono": "3012223344",
  "direccion": { "direccion": "Calle 3 # 4-5", "ciudad": "Ocaña", "departamento": "Norte de Santander" },
  "estado": "activo",
  "fecha_registro": { "$date": "2026-09-21T00:00:00Z" }
}
```

Compass pone un `_id` con ObjectId por defecto; hay que cambiarlo por el código (`"CLI-007"`), o el validador rechaza el documento.

**Buscar:** en la barra **Filter** se escribe el mismo filtro del shell, por ejemplo `{ "estado": "sin_atender" }`.

**Actualizar:** clic en el lápiz del documento, se cambia el valor y **Update**. Si el cambio no cumple el esquema, Compass muestra el error de validación.

**Eliminar:** ícono de la papelera sobre el documento, o la pestaña **Delete** con un filtro.

**Ver las reglas:** pestaña **Validation** de cada colección. **Índices:** pestaña **Indexes**.
