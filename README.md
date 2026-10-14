# Base de datos helpdesk_erp (MongoDB)

Base de datos del sistema de soporte para el ERP/POS de "Sistemas Integrados S.A.". Proyecto de aula de Gestión de Bases de Datos, UFPSO.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `01_esquema.js` | Crea las 12 colecciones con sus validaciones y los índices. Borra las anteriores si existen. |
| `02_datos_semilla.js` | Carga datos de prueba y deja los contadores en el último código usado. Se puede correr las veces que se quiera. |
| `03_pruebas.js` | Intenta 29 inserciones y actualizaciones con errores para mostrar que MongoDB las rechaza. No deja datos nuevos. |
| `04_reportes.js` | Los pipelines de agregación de los dashboards y el `explain("executionStats")` de las consultas que usan índices. |
| `GUIA_CRUD.md` | Comandos para crear, leer, actualizar y borrar en cada colección, listos para la sustentación. |
| `atlas-credentials.env` | Usuario y contraseña de Atlas. No se sube al repositorio (está en `.gitignore`). |

## Cómo cargar la base

Se necesita [mongosh](https://www.mongodb.com/try/download/shell) 2.x y MongoDB 8, en Atlas o local. El backend usa transacciones, así que un MongoDB local debe correr como replica set.

### En MongoDB Atlas

1. En Atlas, **Network Access**: agregue la IP de su equipo.
2. Abra una terminal en esta carpeta y conéctese con su usuario de base de datos (mongosh pide la contraseña):

```bash
mongosh "mongodb+srv://CLUSTER.mongodb.net/" --apiVersion 1 --username USUARIO
```

### En un MongoDB local

Cree una carpeta para los datos (por ejemplo `C:\data\helpdesk`) y levante un replica set de un nodo:

```bash
mongod --replSet rs0 --port 27018 --dbpath C:\data\helpdesk
```

En otra terminal, abierta en esta carpeta, inícielo y conéctese:

```bash
mongosh --port 27018 --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27018' }] })"
```

```bash
mongosh --port 27018
```

### Cargar los scripts

Dentro de mongosh, en este orden:

```js
load("01_esquema.js")
load("02_datos_semilla.js")
load("03_pruebas.js")
load("04_reportes.js")
```

`01_esquema.js` borra las colecciones y las crea de nuevo, así que cualquier dato insertado a mano se pierde. `03_pruebas.js` debe terminar con `Fallidas: 0`.

El backend (Spring Boot) y el frontend (React) del sistema están en repositorios aparte de la misma organización.

## Colecciones

| Colección | `_id` | Qué guarda |
|---|---|---|
| `roles` | `administrador`, `auditor`, `agente_soporte`, `cliente` | Descripción y permisos de cada rol |
| `paquetes` | `POS`, `INVENTARIOS`, `COMPRAS`, `PRODUCCION`, `VENTAS_ONLINE` | Catálogo de lo que vende la empresa, su precio mensual y los campos que pide el formulario de un ticket |
| `empleados` | `EMP-001` | Datos personales, dirección, contrato, seguridad social |
| `clientes` | `CLI-001` | Tipo de cliente, documento, contacto y los paquetes que contrató |
| `usuarios` | `USR-001` | Usuario, contraseña cifrada, roles y a qué cliente o empleado pertenece |
| `sesiones` | ObjectId automático | Cada inicio de sesión: usuario, rol, fechas y estado. El `_id` viaja en el token JWT |
| `tickets` | `TCK-0001` | El caso reportado, quién lo atiende, su estado y el historial de cambios |
| `base_conocimiento` | `KB-001` | Qué hizo soporte para resolver un ticket, paso a paso |
| `contadores` | nombre de la colección | El último número usado en cada código (`clientes: 4` quiere decir que el siguiente es `CLI-005`) |
| `pagos` | `PAG-0001` | El pago mensual de cada paquete de un cliente: valor, método y si fue aprobado o rechazado |
| `capacitaciones` | `CAP-001` | Capacitaciones masivas o personalizadas con su cronograma de sesiones |
| `asistencias` | ObjectId automático | La inscripción de un usuario a una capacitación y si asistió |

Los `_id` son códigos legibles para que las relaciones se entiendan a simple vista. Un ticket guarda `cliente_id: "CLI-001"` y `agente_id: "USR-003"`, y con eso se sabe de quién es y quién lo atiende. Las sesiones y las asistencias son la excepción porque las genera el sistema y nadie las busca por código.

Los patrones de los códigos fijan un mínimo de dígitos, no un máximo: después de `CLI-999` sigue `CLI-1000`.

## Relaciones

```
empleados  1 ── 1  usuarios  n ── 1  clientes ── 1 ── n  pagos
                      │                  │
                      │ agente_id        │ cliente_id
                      └───── tickets ────┘
                                │ ticket_id
                        base_conocimiento

capacitaciones  1 ── n  asistencias  n ── 1  usuarios
```

## Qué se embebe y qué se referencia

- Los paquetes contratados van dentro del cliente (`paquetes_contratados`). Se consultan siempre junto con el cliente y cada uno guarda el precio con el que se vendió.
- El historial va dentro del ticket (`historial`). Cada cambio de estado agrega un elemento con la fecha, el estado y el usuario que lo hizo. Así se ve la trazabilidad completa en un solo documento.
- Los campos del formulario de cada paquete van dentro del paquete (`campos_ticket`). El frontend los lee para armar el formulario; si un paquete necesita un campo nuevo se cambia ese documento y la interfaz no se toca.
- El cronograma va dentro de la capacitación (`sesiones`): son pocas fechas y siempre se leen con la capacitación.
- Los pagos van aparte. Crecen cada mes sin límite y se consultan solos (estado de cuenta, recaudo por paquete).
- Las asistencias van aparte. Una capacitación masiva puede tener cientos de inscritos y las analíticas agrupan asistencias de todas las capacitaciones a la vez.
- Usuarios, empleados y clientes van en colecciones separadas y se relacionan por código. Un empleado tiene exactamente un usuario, y un cliente puede tener varios.

## Tipos de cliente

- `persona_natural`: persona que contrata a título propio. Documento CC o CE.
- `empresa`: negocio de una persona natural comerciante, como una tienda de barrio. NIT y representante (el dueño).
- `persona_juridica`: sociedad (SAS, LTDA...). NIT y representante legal.

## Validaciones

- Documentos, NIT y teléfonos: solo números.
- Correos con formato válido. Nombres sin números.
- Sexo, estado civil, tipo de contrato, estados y paquetes solo aceptan los valores de su lista.
- Persona natural solo con CC o CE. Empresa y persona jurídica con NIT y representante.
- Un contrato que no sea indefinido debe tener fecha de fin.
- Un usuario de cliente solo puede tener el rol `cliente`. Un usuario de empleado solo roles internos. Nunca ambos.
- El `detalle` del ticket exige campos distintos según el paquete y revisa su tipo: en Producción la temperatura debe ser un número, en Compras el NIT del proveedor solo dígitos y la orden con formato `OC-`, en Ventas Online la URL debe empezar por `http`.
- Un ticket que ya no está `sin_atender` debe tener `agente_id`. Uno `resuelto` o `cerrado` debe tener `solucion`.
- Cada paquete debe traer al menos un campo de formulario, y un campo de tipo `lista` debe traer sus opciones.
- Un pago rechazado debe decir el motivo. El periodo tiene formato `2026-10` con un mes válido.
- Una capacitación personalizada debe tener cliente. Una virtual debe tener enlace y una presencial, lugar.
- Solo califica una capacitación quien asistió (calificación de 1 a 5).

## Índices

- Únicos: documento de empleados y clientes, correo de clientes y usuarios, nombre de usuario.
- Único parcial en `usuarios.empleado_id`: un empleado no puede tener dos usuarios.
- Único en `asistencias` por capacitación y usuario: nadie se inscribe dos veces.
- Compuestos para las bandejas, con la igualdad primero y el orden después: tickets por estado y fecha (administrador), por agente, estado y fecha (agente), y por cliente y fecha (cliente). Con eso las consultas ordenadas no necesitan la etapa `SORT`.
- Pagos por cliente y fecha (estado de cuenta) y por estado y fecha (pagos rechazados recientes).
- Capacitaciones por estado y fecha de inicio (cronograma) y asistencias por cliente y estado.
- Índice de texto en español sobre la base de conocimiento para buscar soluciones escribiendo el problema.

## Usuarios de prueba

Contraseña de todos: `Helpdesk2026*`

| Usuario | `_id` | Rol |
|---|---|---|
| andres.carrascal | USR-001 | administrador |
| laura.pacheco | USR-002 | auditor |
| jhon.ascanio | USR-003 | agente_soporte |
| karen.sanguino | USR-004 | agente_soporte |
| lachispitaroja | USR-005 | cliente (La Chispita Roja) |
| lacteosbrisas | USR-006 | cliente (Lácteos Brisas) |
| camilo.rolon | USR-007 | cliente con el paquete Ventas Online suspendido por un pago rechazado |
| ferresantaclara | USR-008 | cliente con todos los paquetes |
