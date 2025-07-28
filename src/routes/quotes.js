import { QuoteManagementController } from "../controllers/quoteManagementController.js";
import { authMiddleware } from "../middleware/auth.js";

const quotesController = new QuoteManagementController();

const quotesRoutes = async (fastify, options) => {
	// Middleware de autenticación para todas las rutas
	fastify.addHook("preHandler", authMiddleware);

	// Guardar cotización
	fastify.post("/save", async (request, reply) => {
		return await quotesController.saveQuote(request, reply);
	});

	// Obtener cotizaciones del usuario
	fastify.get("/user", async (request, reply) => {
		console.log("🔍 Ruta /user accedida");
		console.log("👤 Usuario:", request.user);
		return await quotesController.getUserQuotes(request, reply);
	});

	// Obtener cotización específica
	fastify.get("/:quoteId", async (request, reply) => {
		return await quotesController.getQuoteById(request, reply);
	});

	// Eliminar cotización
	fastify.delete("/:quoteId", async (request, reply) => {
		return await quotesController.deleteQuote(request, reply);
	});

	// Rutas solo para admin
	fastify.register(async function (fastify, options) {
		// Middleware para verificar rol de admin
		fastify.addHook("preHandler", async (request, reply) => {
			if (request.user.role !== "admin") {
				return reply.code(403).send({
					success: false,
					message: "Acceso denegado. Se requieren permisos de administrador.",
				});
			}
		});

		// Obtener todas las cotizaciones (con filtros y paginación)
		fastify.get("/admin/all", async (request, reply) => {
			return await quotesController.getAllQuotesForAdmin(request, reply);
		});

		// Obtener todas las cotizaciones (método anterior para compatibilidad)
		fastify.get("/admin/all-old", async (request, reply) => {
			return await quotesController.getAllQuotes(request, reply);
		});

		// Obtener estadísticas de cotizaciones
		fastify.get("/admin/stats", async (request, reply) => {
			return await quotesController.getQuoteStats(request, reply);
		});

		// Limpiar cotizaciones expiradas
		fastify.post("/admin/cleanup", async (request, reply) => {
			return await quotesController.cleanupExpiredQuotes(request, reply);
		});
	});
};

export default quotesRoutes;
