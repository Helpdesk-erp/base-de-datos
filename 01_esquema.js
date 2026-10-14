// =============================================================================
//  01_esquema.js  -  Base de datos helpdesk_erp
//  Crea las colecciones con su validación ($jsonSchema) y los índices.
//
//  Uso dentro de mongosh:   load("01_esquema.js")
//  Cada bloque db.createCollection(...) también se puede copiar y pegar solo.
// =============================================================================

db = db.getSiblingDB("helpdesk_erp");

// Borra las colecciones si ya existen (incluye las de la versión anterior)
for (const nombre of ["roles", "paquetes", "empleados", "clientes", "usuarios", "sesiones",
  "tickets", "base_conocimiento", "contadores", "pagos", "capacitaciones", "asistencias",
  "modulos", "membresias"]) {
  db.getCollection(nombre).drop();
}

// Listas que se repiten en varias colecciones
const PAQUETES = ["VENTAS_ONLINE", "INVENTARIOS", "COMPRAS", "PRODUCCION", "POS"];
const ROLES = ["administrador", "auditor", "agente_soporte", "cliente"];
const NUMERO = ["int", "long", "double", "decimal"];

// Los códigos tienen un mínimo de dígitos y no un máximo: CLI-001 ... CLI-999, CLI-1000 ...
const COD_CLIENTE = "^CLI-[0-9]{3,}$";
const COD_EMPLEADO = "^EMP-[0-9]{3,}$";
const COD_USUARIO = "^USR-[0-9]{3,}$";
const COD_TICKET = "^TCK-[0-9]{4,}$";
const COD_ARTICULO = "^KB-[0-9]{3,}$";
const COD_PAGO = "^PAG-[0-9]{4,}$";
const COD_CAPACITACION = "^CAP-[0-9]{3,}$";


// -----------------------------------------------------------------------------
// 1. ROLES  (_id = nombre del rol)
// -----------------------------------------------------------------------------
db.createCollection("roles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "descripcion", "permisos"],
      properties: {
        _id: { enum: ROLES },
        descripcion: { bsonType: "string" },
        permisos: { bsonType: "array", minItems: 1, items: { bsonType: "string" } }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 2. PAQUETES  (lo que vende la empresa; _id = código del paquete)
//    campos_ticket describe los datos técnicos que pide el formulario de un
//    ticket de este paquete. El frontend arma el formulario a partir de aquí.
// -----------------------------------------------------------------------------
db.createCollection("paquetes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "nombre", "precio_mensual", "activo", "campos_ticket"],
      properties: {
        _id: { enum: PAQUETES },
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        precio_mensual: { bsonType: NUMERO, minimum: 0 },
        activo: { bsonType: "bool" },
        campos_ticket: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["campo", "etiqueta", "tipo", "requerido"],
            properties: {
              campo: { bsonType: "string", pattern: "^[a-z_]+$", description: "Nombre del campo dentro de tickets.detalle" },
              etiqueta: { bsonType: "string", description: "Texto que ve el usuario" },
              tipo: { enum: ["texto", "texto_largo", "numero", "lista", "url"] },
              opciones: { bsonType: "array", minItems: 1, items: { bsonType: "string" } },
              requerido: { bsonType: "bool" },
              ayuda: { bsonType: "string" }
            },
            // Un campo de tipo lista debe traer sus opciones
            anyOf: [
              { properties: { tipo: { enum: ["texto", "texto_largo", "numero", "url"] } } },
              { required: ["opciones"] }
            ]
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 3. EMPLEADOS  (_id = código EMP-001)
// -----------------------------------------------------------------------------
db.createCollection("empleados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "numero_documento", "nombres", "apellidos", "sexo", "estado_civil",
        "profesion", "correo_personal", "telefono_movil", "direccion", "contrato", "estado"],
      properties: {
        _id: { bsonType: "string", pattern: COD_EMPLEADO, description: "Formato EMP-001" },
        numero_documento: { bsonType: "string", pattern: "^[0-9]{6,10}$", description: "Solo números, 6 a 10 dígitos" },
        nombres: { bsonType: "string", pattern: "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$", description: "Solo letras" },
        apellidos: { bsonType: "string", pattern: "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$", description: "Solo letras" },
        sexo: { enum: ["masculino", "femenino", "otro"] },
        estado_civil: { enum: ["soltero", "casado", "union_libre", "divorciado", "viudo"] },
        profesion: { bsonType: "string" },
        correo_personal: { bsonType: "string", pattern: "^[a-z0-9._-]+@[a-z0-9.-]+\\.[a-z]{2,}$" },
        telefono_movil: { bsonType: "string", pattern: "^[0-9]{10}$", description: "10 dígitos" },
        direccion: {
          bsonType: "object",
          required: ["direccion", "ciudad", "departamento"],
          properties: {
            direccion: { bsonType: "string" },
            barrio: { bsonType: "string" },
            ciudad: { bsonType: "string" },
            departamento: { bsonType: "string" },
            codigo_postal: { bsonType: "string", pattern: "^[0-9]{6}$" }
          }
        },
        contrato: {
          bsonType: "object",
          required: ["cargo", "area", "tipo_contrato", "fecha_inicio", "salario"],
          properties: {
            cargo: { bsonType: "string" },
            area: { enum: ["administracion", "soporte", "auditoria"] },
            tipo_contrato: { enum: ["indefinido", "termino_fijo", "prestacion_servicios"] },
            fecha_inicio: { bsonType: "date" },
            fecha_fin: { bsonType: "date" },
            salario: { bsonType: NUMERO, minimum: 0 },
            jornada: { enum: ["tiempo_completo", "medio_tiempo"] },
            modalidad: { enum: ["presencial", "remoto", "hibrido"] }
          },
          // Si el contrato no es indefinido, debe tener fecha de terminación
          anyOf: [
            { properties: { tipo_contrato: { enum: ["indefinido"] } } },
            { required: ["fecha_fin"] }
          ]
        },
        seguridad_social: {
          bsonType: "object",
          required: ["eps", "fondo_pensiones", "arl"],
          properties: {
            eps: { bsonType: "string" },
            fondo_pensiones: { bsonType: "string" },
            arl: { bsonType: "string" },
            caja_compensacion: { bsonType: "string" },
            fondo_cesantias: { bsonType: "string" }
          }
        },
        informacion_bancaria: {
          bsonType: "object",
          required: ["banco", "tipo_cuenta", "numero_cuenta"],
          properties: {
            banco: { bsonType: "string" },
            tipo_cuenta: { enum: ["ahorros", "corriente"] },
            numero_cuenta: { bsonType: "string", pattern: "^[0-9]{6,20}$" }
          }
        },
        estado: { enum: ["activo", "inactivo", "retirado"] },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 4. CLIENTES  (_id = código CLI-001)
//    Los paquetes que compró el cliente van EMBEBIDOS en paquetes_contratados.
//    Si un pago falla se suspende solo ese paquete, no el cliente completo.
// -----------------------------------------------------------------------------
db.createCollection("clientes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "tipo_cliente", "tipo_documento", "numero_documento", "nombre",
        "correo", "telefono", "direccion", "estado", "fecha_registro"],
      properties: {
        _id: { bsonType: "string", pattern: COD_CLIENTE, description: "Formato CLI-001" },
        tipo_cliente: { enum: ["persona_natural", "empresa", "persona_juridica"] },
        tipo_documento: { enum: ["CC", "CE", "NIT"] },
        numero_documento: { bsonType: "string", pattern: "^[0-9]{6,10}$", description: "Solo números" },
        nombre: { bsonType: "string", description: "Nombre completo, nombre comercial o razón social" },
        representante: { bsonType: "string", pattern: "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$", description: "Propietario o representante legal" },
        correo: { bsonType: "string", pattern: "^[a-z0-9._-]+@[a-z0-9.-]+\\.[a-z]{2,}$" },
        telefono: { bsonType: "string", pattern: "^[0-9]{10}$" },
        direccion: {
          bsonType: "object",
          required: ["direccion", "ciudad", "departamento"],
          properties: {
            direccion: { bsonType: "string" },
            ciudad: { bsonType: "string" },
            departamento: { bsonType: "string" }
          }
        },
        paquetes_contratados: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["paquete_id", "nombre", "precio_mensual", "fecha_inicio", "fecha_fin", "estado"],
            properties: {
              paquete_id: { enum: PAQUETES },
              nombre: { bsonType: "string" },
              precio_mensual: { bsonType: NUMERO, minimum: 0 },
              fecha_inicio: { bsonType: "date" },
              fecha_fin: { bsonType: "date" },
              estado: { enum: ["activo", "suspendido", "vencido"] }
            }
          }
        },
        estado: { enum: ["activo", "suspendido", "inactivo"] },
        fecha_registro: { bsonType: "date" }
      },
      // Persona natural: CC o CE.  Empresa o persona jurídica: NIT y representante.
      anyOf: [
        {
          properties: {
            tipo_cliente: { enum: ["persona_natural"] },
            tipo_documento: { enum: ["CC", "CE"] }
          }
        },
        {
          properties: {
            tipo_cliente: { enum: ["empresa", "persona_juridica"] },
            tipo_documento: { enum: ["NIT"] }
          },
          required: ["representante"]
        }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 5. USUARIOS  (_id = código USR-001)
//    Un usuario pertenece a un cliente (cliente_id) o a un empleado
//    (empleado_id), nunca a los dos.
// -----------------------------------------------------------------------------
db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "usuario", "correo", "password_hash", "roles", "estado", "fecha_creacion"],
      properties: {
        _id: { bsonType: "string", pattern: COD_USUARIO, description: "Formato USR-001" },
        usuario: { bsonType: "string", pattern: "^[a-z0-9._]{4,30}$", description: "Nombre para iniciar sesión" },
        correo: { bsonType: "string", pattern: "^[a-z0-9._-]+@[a-z0-9.-]+\\.[a-z]{2,}$" },
        password_hash: { bsonType: "string", minLength: 8, description: "Contraseña cifrada con bcrypt por el backend" },
        roles: {
          bsonType: "array",
          minItems: 1,
          uniqueItems: true,
          items: { enum: ROLES }
        },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE },
        empleado_id: { bsonType: "string", pattern: COD_EMPLEADO },
        estado: { enum: ["activo", "inactivo", "bloqueado"] },
        credenciales_enviadas: { bsonType: "bool", description: "true cuando el sistema ya envió el usuario al correo" },
        ultimo_acceso: { bsonType: "date" },
        fecha_creacion: { bsonType: "date" }
      },
      oneOf: [
        {
          // Usuario de un cliente: solo puede tener el rol cliente
          required: ["cliente_id"],
          not: { required: ["empleado_id"] },
          properties: { roles: { items: { enum: ["cliente"] } } }
        },
        {
          // Usuario de un empleado: solo roles internos
          required: ["empleado_id"],
          not: { required: ["cliente_id"] },
          properties: { roles: { items: { enum: ["administrador", "auditor", "agente_soporte"] } } }
        }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 6. SESIONES  (las genera el sistema, por eso usan el ObjectId automático)
//    El _id de la sesión viaja en el token JWT (claim "jti"). En cada petición
//    el backend revisa que la sesión siga activa.
// -----------------------------------------------------------------------------
db.createCollection("sesiones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "rol", "fecha_inicio", "fecha_expiracion", "estado"],
      properties: {
        usuario_id: { bsonType: "string", pattern: COD_USUARIO },
        rol: { enum: ROLES },
        ip: { bsonType: "string" },
        dispositivo: { bsonType: "string" },
        fecha_inicio: { bsonType: "date" },
        fecha_expiracion: { bsonType: "date" },
        fecha_cierre: { bsonType: "date" },
        estado: { enum: ["activa", "cerrada", "expirada"] }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 7. TICKETS  (_id = código TCK-0001)
//    "detalle" cambia según el paquete afectado (documento polimórfico).
//    "historial" guarda cada cambio de estado (trazabilidad).
//    Los campos de detalle deben coincidir con paquetes.campos_ticket.
// -----------------------------------------------------------------------------
db.createCollection("tickets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "cliente_id", "reportado_por", "paquete", "tipo", "prioridad",
        "asunto", "descripcion", "detalle", "estado", "historial", "fecha_creacion"],
      properties: {
        _id: { bsonType: "string", pattern: COD_TICKET, description: "Formato TCK-0001" },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE },
        reportado_por: { bsonType: "string", pattern: COD_USUARIO },
        paquete: { enum: PAQUETES },
        tipo: { enum: ["incidente", "consulta", "mejora"] },
        prioridad: { enum: ["baja", "media", "alta"] },
        asunto: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        detalle: { bsonType: "object" },
        estado: { enum: ["sin_atender", "asignado", "en_proceso", "resuelto", "cerrado"] },
        agente_id: { bsonType: "string", pattern: COD_USUARIO, description: "Usuario de soporte que lo atiende" },
        asignado_por: { bsonType: "string", pattern: COD_USUARIO, description: "Administrador que asignó" },
        solucion: { bsonType: "string" },
        historial: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["fecha", "estado", "usuario_id"],
            properties: {
              fecha: { bsonType: "date" },
              estado: { enum: ["sin_atender", "asignado", "en_proceso", "resuelto", "cerrado"] },
              usuario_id: { bsonType: "string", pattern: COD_USUARIO },
              comentario: { bsonType: "string" }
            }
          }
        },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      },
      allOf: [
        // Campos obligatorios de "detalle" según el paquete, con su tipo
        {
          oneOf: [
            {
              properties: {
                paquete: { enum: ["VENTAS_ONLINE"] },
                detalle: {
                  required: ["pasarela_pago", "url_error", "navegador"],
                  properties: {
                    pasarela_pago: { bsonType: "string" },
                    url_error: { bsonType: "string", pattern: "^https?://" },
                    navegador: { bsonType: "string" },
                    log_api: { bsonType: "string" }
                  }
                }
              }
            },
            {
              properties: {
                paquete: { enum: ["INVENTARIOS"] },
                detalle: {
                  required: ["bodega", "codigo_producto"],
                  properties: {
                    bodega: { bsonType: "string" },
                    codigo_producto: { bsonType: "string" },
                    codigo_barras: { bsonType: "string", pattern: "^[0-9]{8,14}$" },
                    cantidad_sistema: { bsonType: NUMERO, minimum: 0 },
                    cantidad_fisica: { bsonType: NUMERO, minimum: 0 }
                  }
                }
              }
            },
            {
              properties: {
                paquete: { enum: ["COMPRAS"] },
                detalle: {
                  required: ["orden_compra", "nit_proveedor"],
                  properties: {
                    orden_compra: { bsonType: "string", pattern: "^OC-[0-9]+$" },
                    nit_proveedor: { bsonType: "string", pattern: "^[0-9]{6,10}$" },
                    etapa: { bsonType: "string" }
                  }
                }
              }
            },
            {
              properties: {
                paquete: { enum: ["PRODUCCION"] },
                detalle: {
                  required: ["maquina", "lote", "temperatura"],
                  properties: {
                    maquina: { bsonType: "string" },
                    lote: { bsonType: "string" },
                    fase: { bsonType: "string" },
                    temperatura: { bsonType: NUMERO }
                  }
                }
              }
            },
            {
              properties: {
                paquete: { enum: ["POS"] },
                detalle: {
                  required: ["numero_caja"],
                  properties: {
                    numero_caja: { bsonType: "string" },
                    dispositivo: { bsonType: "string" },
                    turno: { bsonType: "string" },
                    navegador: { bsonType: "string" }
                  }
                }
              }
            }
          ]
        },
        // Si ya no está "sin_atender", debe saberse quién lo atiende
        {
          anyOf: [
            { properties: { estado: { enum: ["sin_atender"] } } },
            { required: ["agente_id"] }
          ]
        },
        // Un ticket resuelto o cerrado debe tener la solución escrita
        {
          anyOf: [
            { properties: { estado: { enum: ["sin_atender", "asignado", "en_proceso"] } } },
            { required: ["solucion"] }
          ]
        }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 8. BASE_CONOCIMIENTO  (_id = código KB-001)
//    Qué hizo soporte para resolver cada ticket, paso a paso. Es el material
//    que más adelante leerá el LLM.
// -----------------------------------------------------------------------------
db.createCollection("base_conocimiento", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "ticket_id", "paquete", "titulo", "problema", "pasos", "solucion", "autor_id", "fecha_creacion"],
      properties: {
        _id: { bsonType: "string", pattern: COD_ARTICULO, description: "Formato KB-001" },
        ticket_id: { bsonType: "string", pattern: COD_TICKET },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE },
        contacto: { bsonType: "string", description: "Persona que reportó el problema" },
        paquete: { enum: PAQUETES },
        titulo: { bsonType: "string" },
        problema: { bsonType: "string" },
        pasos: { bsonType: "array", minItems: 1, items: { bsonType: "string" } },
        solucion: { bsonType: "string" },
        palabras_clave: { bsonType: "array", items: { bsonType: "string" } },
        autor_id: { bsonType: "string", pattern: COD_USUARIO },
        fecha_creacion: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 9. CONTADORES  (_id = nombre de la colección)
//    El backend saca el siguiente código con findOneAndUpdate + $inc, que es
//    atómico: dos registros simultáneos nunca reciben el mismo número.
// -----------------------------------------------------------------------------
db.createCollection("contadores", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "secuencia"],
      properties: {
        _id: { enum: ["clientes", "empleados", "usuarios", "tickets", "base_conocimiento", "pagos", "capacitaciones"] },
        secuencia: { bsonType: ["int", "long"], minimum: 0, description: "Último número usado" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 10. PAGOS  (_id = código PAG-0001)
//     Un pago por paquete y por mes. Cuando un pago se rechaza, el backend
//     inserta el pago y suspende el paquete en el cliente dentro de una misma
//     transacción multi-documento.
// -----------------------------------------------------------------------------
db.createCollection("pagos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "cliente_id", "paquete_id", "periodo", "valor", "metodo", "estado", "fecha"],
      properties: {
        _id: { bsonType: "string", pattern: COD_PAGO, description: "Formato PAG-0001" },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE },
        paquete_id: { enum: PAQUETES },
        periodo: { bsonType: "string", pattern: "^[0-9]{4}-(0[1-9]|1[0-2])$", description: "Mes que paga, formato 2026-10" },
        valor: { bsonType: NUMERO, minimum: 0 },
        metodo: { enum: ["PSE", "tarjeta_credito", "tarjeta_debito", "transferencia", "efectivo"] },
        estado: { enum: ["aprobado", "rechazado", "pendiente"] },
        referencia: { bsonType: "string", description: "Código que devuelve la pasarela o el banco" },
        motivo_rechazo: { bsonType: "string" },
        registrado_por: { bsonType: "string", pattern: COD_USUARIO },
        fecha: { bsonType: "date" }
      },
      // Un pago rechazado debe decir por qué
      anyOf: [
        { properties: { estado: { enum: ["aprobado", "pendiente"] } } },
        { required: ["motivo_rechazo"] }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 11. CAPACITACIONES  (_id = código CAP-001)
//     Masivas (abiertas a todos los clientes del paquete) o personalizadas
//     (para un solo cliente). El cronograma va EMBEBIDO en "sesiones" porque
//     tiene pocas fechas y siempre se lee junto con la capacitación.
// -----------------------------------------------------------------------------
db.createCollection("capacitaciones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "titulo", "descripcion", "paquete", "tipo", "modalidad", "instructor_id",
        "cupo_maximo", "sesiones", "fecha_inicio", "fecha_fin", "estado", "fecha_creacion"],
      properties: {
        _id: { bsonType: "string", pattern: COD_CAPACITACION, description: "Formato CAP-001" },
        titulo: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        paquete: { enum: PAQUETES },
        tipo: { enum: ["masiva", "personalizada"] },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE, description: "Solo en las personalizadas" },
        modalidad: { enum: ["virtual", "presencial"] },
        enlace: { bsonType: "string", pattern: "^https?://" },
        lugar: { bsonType: "string" },
        instructor_id: { bsonType: "string", pattern: COD_USUARIO },
        cupo_maximo: { bsonType: ["int", "long"], minimum: 1 },
        sesiones: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["tema", "fecha_inicio", "fecha_fin"],
            properties: {
              tema: { bsonType: "string" },
              fecha_inicio: { bsonType: "date" },
              fecha_fin: { bsonType: "date" }
            }
          }
        },
        fecha_inicio: { bsonType: "date", description: "Inicio de la primera sesión" },
        fecha_fin: { bsonType: "date", description: "Fin de la última sesión" },
        estado: { enum: ["programada", "en_curso", "finalizada", "cancelada"] },
        fecha_creacion: { bsonType: "date" }
      },
      allOf: [
        // Una capacitación personalizada debe decir para qué cliente es
        {
          anyOf: [
            { properties: { tipo: { enum: ["masiva"] } } },
            { required: ["cliente_id"] }
          ]
        },
        // Virtual con enlace, presencial con lugar
        {
          anyOf: [
            { properties: { modalidad: { enum: ["virtual"] } }, required: ["enlace"] },
            { properties: { modalidad: { enum: ["presencial"] } }, required: ["lugar"] }
          ]
        }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// -----------------------------------------------------------------------------
// 12. ASISTENCIAS  (ObjectId automático)
//     Una inscripción por usuario y capacitación. Va REFERENCIADA y no dentro
//     de la capacitación porque una masiva puede tener cientos de asistentes y
//     las analíticas agrupan asistencias de todas las capacitaciones a la vez.
// -----------------------------------------------------------------------------
db.createCollection("asistencias", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["capacitacion_id", "usuario_id", "cliente_id", "estado", "fecha_inscripcion"],
      properties: {
        capacitacion_id: { bsonType: "string", pattern: COD_CAPACITACION },
        usuario_id: { bsonType: "string", pattern: COD_USUARIO },
        cliente_id: { bsonType: "string", pattern: COD_CLIENTE },
        estado: { enum: ["inscrito", "asistio", "no_asistio", "cancelado"] },
        fecha_inscripcion: { bsonType: "date" },
        calificacion: { bsonType: "int", minimum: 1, maximum: 5, description: "La pone el cliente si asistió" },
        comentario: { bsonType: "string" }
      },
      // Solo califica quien asistió
      anyOf: [
        { properties: { estado: { enum: ["asistio"] } } },
        { not: { required: ["calificacion"] } }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// =============================================================================
// ÍNDICES
// =============================================================================

// Datos que no se pueden repetir
db.empleados.createIndex({ numero_documento: 1 }, { unique: true, name: "empleado_documento_unico" });
db.clientes.createIndex({ numero_documento: 1 }, { unique: true, name: "cliente_documento_unico" });
db.clientes.createIndex({ correo: 1 }, { unique: true, name: "cliente_correo_unico" });
db.usuarios.createIndex({ usuario: 1 }, { unique: true, name: "usuario_unico" });
db.usuarios.createIndex({ correo: 1 }, { unique: true, name: "usuario_correo_unico" });

// Un empleado tiene un solo usuario (el índice solo mira documentos con empleado_id)
db.usuarios.createIndex(
  { empleado_id: 1 },
  { unique: true, partialFilterExpression: { empleado_id: { $exists: true } }, name: "un_usuario_por_empleado" }
);

// Un usuario se inscribe una sola vez en cada capacitación
db.asistencias.createIndex({ capacitacion_id: 1, usuario_id: 1 }, { unique: true, name: "una_inscripcion_por_usuario" });

// Consultas frecuentes (compuestos: igualdad primero, orden después)
db.sesiones.createIndex({ usuario_id: 1, estado: 1 }, { name: "sesiones_por_usuario" });
db.tickets.createIndex({ estado: 1, fecha_creacion: -1 }, { name: "tickets_por_estado" });                      // bandeja del administrador
db.tickets.createIndex({ agente_id: 1, estado: 1, fecha_creacion: -1 }, { name: "tickets_por_agente" });       // bandeja del agente
db.tickets.createIndex({ cliente_id: 1, fecha_creacion: -1 }, { name: "tickets_por_cliente" });                // "mis tickets" del cliente
db.pagos.createIndex({ cliente_id: 1, fecha: -1 }, { name: "pagos_por_cliente" });                              // estado de cuenta
db.pagos.createIndex({ estado: 1, fecha: -1 }, { name: "pagos_por_estado" });                                   // pagos rechazados recientes
db.capacitaciones.createIndex({ estado: 1, fecha_inicio: 1 }, { name: "capacitaciones_proximas" });            // cronograma
db.asistencias.createIndex({ cliente_id: 1, estado: 1 }, { name: "asistencias_por_cliente" });

// Búsqueda por texto en la base de conocimiento
db.base_conocimiento.createIndex(
  { titulo: "text", problema: "text", pasos: "text", solucion: "text", palabras_clave: "text" },
  { default_language: "spanish", name: "busqueda_texto" }
);

print("Esquema creado: " + db.getCollectionNames().sort().join(", "));
