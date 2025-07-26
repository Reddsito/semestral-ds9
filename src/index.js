import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import caching from "@fastify/caching";
import oauth2 from "@fastify/oauth2";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";
import { authRoutes } from "./routes/auth.js";
import { initializeData } from "./utils/initData.js";
import { CacheService } from "./services/cacheService.js";
import { CleanupService } from "./services/cleanupService.js";
import { validationErrorHandler } from "./middleware/validationErrorHandler.js";
import { successResponse, errorResponse } from "./utils/responseHelper.js";
import fastifyStatic from "@fastify/static";
import path, { dirname } from "node:path";
import { fileURLToPath } from "url";

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
		"http://localhost:3001/api/v1/auth/google/callback",
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001/",
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
				ignore: "pid,hostname,reqId,responseTime,res",
				messageFormat: "{msg} {req.method} {req.url}",
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

	// Multipart para subida de archivos
	await fastify.register(multipart, {
		limits: {
			fileSize: 50 * 1024 * 1024, // 50MB
		},
	});

	console.log("multipart");

	// OAuth2 para Google
	console.log(
		"Configurando OAuth2 con callback URI:",
		config.GOOGLE_CALLBACK_URL,
	);
	await fastify.register(oauth2, {
		name: "googleOAuth2",
		scope: ["openid", "profile", "email"],
		credentials: {
			client: {
				id: config.GOOGLE_CLIENT_ID,
				secret: config.GOOGLE_CLIENT_SECRET,
			},
			auth: oauth2.GOOGLE_CONFIGURATION,
		},
		startRedirectPath: "/api/v1/auth/google",
		callbackUri: config.GOOGLE_CALLBACK_URL,
	});
}

// Registrar rutas
async function registerRoutes() {
	// Rutas de autenticación
	try {
		await fastify.register(authRoutes, { prefix: "/api/v1/auth" });

		// Rutas de cotización
		const { quoteRoutes } = await import("./routes/quote.js");
		await fastify.register(quoteRoutes, { prefix: "/api/v1/quote" });

		// Rutas de gestión de cotizaciones
		const quotesRoutes = await import("./routes/quotes.js");
		await fastify.register(quotesRoutes.default, { prefix: "/api/v1/quotes" });

		// Rutas de archivos
		const { fileRoutes } = await import("./routes/file.js");
		await fastify.register(fileRoutes, { prefix: "/api/v1/files" });

		// Rutas de administración
		const { adminRoutes } = await import("./routes/admin.js");
		await fastify.register(adminRoutes, { prefix: "/api/v1/admin" });

		// Rutas de direcciones
		const { addressRoutes } = await import("./routes/addresses.js");
		await fastify.register(addressRoutes, { prefix: "/api/v1/addresses" });

		// Ruta raíz
		fastify.get("/api/v1/health", async (request, reply) => {
			return successResponse("API de Autenticación", {
				version: "1.0.0",
				endpoints: {
					health: "api/v1/health",
				},
			});
		});

		// Ruta de prueba de cache
		fastify.get("/api/v1/cache/test", async (request, reply) => {
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

		fastify.setNotFoundHandler((request, reply) => {
			if (request.url.startsWith("/api")) {
				console.log("api route not found");
				reply.status(404).send("API route not found");
			} else {
				console.log("index.html");
				reply.sendFile("index.html");
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

		// Iniciar limpieza automática de archivos temporales
		const cleanupService = new CleanupService();
		cleanupService.startAutoCleanup();
		fastify.log.info("🧹 Limpieza automática iniciada");

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
			fastify,
		);

		console.log("first");

		initializeAuthMiddleware(config.JWT_SECRET, config.JWT_EXPIRES_IN, fastify);
		fastify.log.info("AuthController inicializado");

		console.log("second");

		// Registrar rutas
		fastify.log.info("Registrando rutas...");
		await registerRoutes();
		fastify.log.info("Rutas registradas");

		// Registrar archivos estáticos DESPUÉS de las rutas
		await fastify.register(fastifyStatic, {
			root: path.join(dirname(fileURLToPath(import.meta.url)), "..", "public"),
			prefix: "/",
			setHeaders: (res, path) => {
				if (path.endsWith(".js")) {
					res.setHeader("Content-Type", "application/javascript");
				}
			},
		});

		console.log("static files registered");

		// Iniciar servidor
		await fastify.listen({
			port: parseInt(config.PORT),
			host: "0.0.0.0",
		});

		fastify.log.info(`Servidor corriendo en http://localhost:${config.PORT}`);
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
