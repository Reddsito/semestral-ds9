import OrderController from "../controllers/orderController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { commonValidations } from "../validations/commonValidations.js";

const orderController = OrderController();

export async function orderRoutes(fastify) {
	fastify.get("/", { preHandler: authenticateToken }, orderController.getAll);

	fastify.get(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: {
				params: {
					type: "object",
					properties: { id: commonValidations.mongoId },
					required: ["id"],
				},
			},
		},
		orderController.getById,
	);

	fastify.get(
		"/user/:id",
		{
			preHandler: authenticateToken,
		},
		orderController.getOrdersByUserId,
	);

	fastify.get(
		"orders/statuses",
		{ preHandler: authenticateToken },
		orderController.getValidOrderStatuses,
	);

	fastify.post(
		"/",
		{
			preHandler: async (request, reply) => {
				console.log("🚀 POST /orders route hit!");
				console.log("📥 Headers:", request.headers);
				await authenticateToken(request, reply);
			},
		},
		orderController.create,
	);

	fastify.put(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: {
				params: {
					type: "object",
					properties: { id: commonValidations.mongoId },
					required: ["id"],
				},
			},
		},
		orderController.update,
	);

	fastify.patch(
		"/:id/status",
		{
			preHandler: [authenticateToken, requireAdmin],
			schema: {
				params: {
					type: "object",
					properties: { id: commonValidations.mongoId },
					required: ["id"],
				},
				body: {
					type: "object",
					properties: { status: commonValidations.orderStatus },
					required: ["status"],
				},
			},
		},
		orderController.updateStatus,
	);

	fastify.delete(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: {
				params: {
					type: "object",
					properties: { id: commonValidations.mongoId },
					required: ["id"],
				},
			},
		},
		orderController.remove,
	);
}
