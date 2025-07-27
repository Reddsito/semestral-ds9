import OrderController from "../controllers/orderController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { commonValidations } from "../validations/commonValidations.js";

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

	fastify.put(
		"/:id",
		{
			preHandler: authenticateToken,
		},
		OrderController().update,
	);

	fastify.patch(
		"/:id/status",
		{
			preHandler: [authenticateToken , requireAdmin],
			schema: {
				params:{
					type: "object",
					properties: {
						id: commonValidations.mongoId,
					},
					required: ["id"],
				},
				body: {
					type: "object",
					properties: {
						status: commonValidations.orderStatus,
					},
					required: ["status"],
				},
			},
		},
		OrderController().updateStatus,
	);

	fastify.delete(
		"/:id",
		{
			preHandler: authenticateToken,
		},
		OrderController().remove,
	);
}
