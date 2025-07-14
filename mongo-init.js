// Script de inicialización para MongoDB
db = db.getSiblingDB("auth_db");

// Crear usuario para la aplicación
db.createUser({
	user: "app_user",
	pwd: "app_password",
	roles: [
		{
			role: "readWrite",
			db: "auth_db",
		},
	],
});

// Crear colecciones iniciales
db.createCollection("users");
db.createCollection("roles");
db.createCollection("permissions");

print("MongoDB inicializado correctamente");
