import StripeController from "../controllers/stripeController.js";
import { authenticateToken } from "../middleware/auth.js";

export async function stripeRoutes(fastify) {
	fastify.post(
		"/checkout-session",
		{
			preHandler: authenticateToken,
		},
		StripeController().purchaseOrder,
	);
	fastify.get(
		"/checkout-session/:sessionId",
		{
			preHandler: authenticateToken,
		},
		StripeController().getCheckoutSession,
	);
	fastify.post(
		"/refund",
		{
			preHandler: authenticateToken,
		},
		StripeController().refundOrder,
	);
}
