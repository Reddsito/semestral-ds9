// Script de inicialización para MongoDB
db = db.getSiblingDB("dev_db");

// Crear usuario para la aplicación
db.createUser({
	user: "app_user",
	pwd: "app_password",
	roles: [
		{
			role: "readWrite",
			db: "dev_db",
		},
	],
});

// Crear colecciones iniciales
db.createCollection("users");
db.createCollection("roles");
db.createCollection("materials");
db.createCollection("finishes");
db.createCollection("files");
db.createCollection("orders");
db.createCollection("addresses");
db.createCollection("pricebreakdowns");

print("MongoDB inicializado correctamente");
