db = db.getSiblingDB("bancodb");

// Crear colecciones con un documento inicial para asegurar su creación
db.personas.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.roles.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.cuentas_app.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.cuentas.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.movimientos.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.dispositivos_autorizados.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.patron_autenticacion.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.dedos_patron.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.dedos_registrados.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

db.restricciones.insertOne({
  _id: "init_doc",
  nombre: "Documento Inicial",
  descripcion: "Este documento se crea automáticamente y puede ser eliminado",
});

// Crear un usuario con permisos para la base de datos
db.createUser({
  user: "banco",
  pwd: "Banco123*",
  roles: [
    {
      role: "readWrite",
      db: "bancodb",
    },
  ],
});

print(
  "Base de datos bancodb y sus colecciones han sido inicializadas correctamente",
);
