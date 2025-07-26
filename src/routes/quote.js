import { QuoteController } from "../controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";

export async function quoteRoutes(fastify) {
	const quoteController = new QuoteController();

	// Obtener materiales disponibles (público)
	fastify.get(
		"/materials",

		quoteController.getMaterials.bind(quoteController),
	);

	// Obtener acabados disponibles (público)
	fastify.get(
		"/finishes",

		quoteController.getFinishes.bind(quoteController),
	);

	// Calcular cotización (requiere autenticación)
	fastify.post(
		"/calculate",
		{
			preHandler: authenticateToken,
		},
		quoteController.calculateQuote.bind(quoteController),
	);

	// Obtener desglose de precios de un pedido (requiere autenticación)
	fastify.get(
		"/breakdown/:orderId",
		{
			preHandler: authenticateToken,
		},
		quoteController.getPriceBreakdown.bind(quoteController),
	);
}
