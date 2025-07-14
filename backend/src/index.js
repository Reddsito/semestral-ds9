import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import caching from "@fastify/caching";
import oauth2 from "@fastify/oauth2";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";
import { authRoutes } from "./routes/auth.js";
import { initializeData } from "./utils/initData.js";
import { CacheService } from "./services/cacheService.js";
import { validationErrorHandler } from "./middleware/validationErrorHandler.js";
import { successResponse, errorResponse } from "./utils/responseHelper.js";

// Cargar variables de entorno
dotenv.config();

// Configuración por defecto
const config = {
	PORT: process.env.PORT || "3001",
	NODE_ENV: process.env.NODE_ENV || "development",
	MONGODB_URI:
		process.env.MONGODB_URI ||
		"mongodb://app_user:app_password@localhost:27017/auth_db?authSource=auth_db",
	JWT_SECRET: process.env.JWT_SECRET || "fallback-secret",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
	GOOGLE_CALLBACK_URL:
		process.env.GOOGLE_CALLBACK_URL ||
		"http://localhost:3001/auth/google/callback",
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};

// Crear instancia de Fastify con logs bonitos
const fastify = Fastify({
	logger: {
		level: "info",
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:standard",
				ignore: "pid,hostname",
				messageFormat: "{msg} {req.method} {req.url} {responseTime}ms",
			},
		},
	},
});

// Registrar plugins
async function registerPlugins() {
	// CORS
	await fastify.register(cors, {
		origin: config.CORS_ORIGIN,
		credentials: true,
	});

	console.log("cors");

	// JWT
	await fastify.register(jwt, {
		secret: config.JWT_SECRET,
	});

	console.log("jwt");

	// Caching local
	await fastify.register(caching);

	console.log("caching");

	// OAuth2 para Google (configuración manual)
	if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
		console.log("OAuth2 configurado");
	} else {
		console.log("OAuth2 no configurado - faltan credenciales");
	}
}

// Registrar rutas
async function registerRoutes() {
	// Rutas de autenticación
	try {
		await fastify.register(authRoutes, { prefix: "/auth" });

		// Ruta de salud
		fastify.get("/health", async (request, reply) => {
			return successResponse("Servidor funcionando correctamente", {
				status: "OK",
				timestamp: new Date().toISOString(),
			});
		});

		// Ruta raíz
		fastify.get("/", async (request, reply) => {
			return successResponse("API de Autenticación", {
				version: "1.0.0",
				endpoints: {
					auth: "/auth",
					health: "/health",
				},
			});
		});

		// Ruta de prueba de cache
		fastify.get("/cache/test", async (request, reply) => {
			const cacheService = CacheService.getInstance();
			try {
				// Probar cache
				await cacheService.setUser("test", { id: "test", name: "Test User" });
				const cachedUser = await cacheService.getUser("test");

				return successResponse("Test de cache completado", {
					cached: cachedUser,
					works: !!cachedUser,
				});
			} catch (error) {
				return errorResponse("Error en test de cache", {
					error: error.message,
				});
			}
		});
	} catch (error) {
		console.error("Error al registrar rutas:", error);
	}
}

// Manejo de errores global
fastify.setErrorHandler((error, request, reply) => {
	// Primero intentar manejar errores de validación
	if (error.validation) {
		return validationErrorHandler(error, request, reply);
	}

	// Si no es un error de validación, usar el manejo normal
	fastify.log.error(error);
	const statusCode = error.statusCode || 500;
	return reply
		.status(statusCode)
		.send(
			errorResponse(
				error.message || "Error interno del servidor",
				config.NODE_ENV === "development" ? { stack: error.stack } : null,
			),
		);
});

// Función principal
async function start() {
	try {
		fastify.log.info("Iniciando servidor de autenticación...");

		// Conectar a la base de datos
		fastify.log.info("Conectando a MongoDB...");
		await connectDatabase(config.MONGODB_URI);
		fastify.log.info("Conectado a MongoDB exitosamente");

		// Inicializar datos por defecto
		fastify.log.info("Inicializando datos por defecto...");
		await initializeData();
		fastify.log.info("Inicialización completada");

		// Registrar plugins
		fastify.log.info("Registrando plugins...");
		await registerPlugins();
		fastify.log.info("Plugins registrados");

		// Inicializar CacheService con la instancia de Fastify
		fastify.log.info("Inicializando CacheService...");
		const cacheService = CacheService.getInstance();
		cacheService.initialize(fastify);

		// Inicializar AuthController y middleware con configuración
		fastify.log.info("Inicializando AuthController...");
		const { AuthController } = await import("./controllers/authController.js");
		const { initializeAuthMiddleware } = await import("./middleware/auth.js");

		AuthController.initializeAuthService(
			config.JWT_SECRET,
			config.JWT_EXPIRES_IN,
		);
		initializeAuthMiddleware(config.JWT_SECRET, config.JWT_EXPIRES_IN);
		fastify.log.info("AuthController inicializado");

		// Registrar rutas
		fastify.log.info("Registrando rutas...");
		await registerRoutes();
		fastify.log.info("Rutas registradas");

		// Iniciar servidor
		await fastify.listen({
			port: parseInt(config.PORT),
			host: "0.0.0.0",
		});

		fastify.log.info(`Servidor corriendo en http://localhost:${config.PORT}`);
		fastify.log.info(
			`Documentación disponible en http://localhost:${config.PORT}/docs`,
		);
		fastify.log.info(`Frontend: ${config.CORS_ORIGIN}`);
		fastify.log.info(`MongoDB: mongodb://localhost:27017`);
		fastify.log.info(`Mongo Express: http://localhost:8080`);
	} catch (error) {
		fastify.log.error("Error iniciando servidor:", error);
		process.exit(1);
	}
}

// Manejo de señales para cierre graceful
process.on("SIGINT", async () => {
	fastify.log.info("Cerrando servidor...");
	await fastify.close();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	fastify.log.info("Cerrando servidor...");
	await fastify.close();
	process.exit(0);
});

// Iniciar aplicación
start();
