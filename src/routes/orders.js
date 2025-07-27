import OrderController from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/auth.js";

export async function orderRoutes(fastify) {
	fastify.get(
		"/",
		{
			preHandler: authenticateToken,
		},
		OrderController().getAll,
	);
	fastify.get(
		"/:id",
		{
			preHandler: authenticateToken,
		},
		OrderController().getById,
	);

	fastify.post(
		"/",
		{
			preHandler: authenticateToken,
		},
		OrderController().create,
	);

	fastify.patch(
		"/:id",
		{
			preHandler: authenticateToken,
		},
		OrderController().update,
	);

	fastify.delete(
		"/:id",
		{
			preHandler: authenticateToken,
		},
		OrderController().remove,
	);
}
