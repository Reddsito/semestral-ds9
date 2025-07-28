import OrderService from "../services/orderService.js";
import { successResponse } from "../utils/responseHelper.js";

const OrderController = () => {
	const orderService = OrderService();

	const getAll = async (request, reply) => {
		const orders = await orderService.getAllOrders();
		return reply
			.status(200)
			.send(successResponse("Orders retrieved successfully", orders));
	};

	const getById = async (request, reply) => {
		const { id } = request.params;
		const order = await orderService.getOrdersByUserId(id);
		if (!order) {
			return errorResponse(false, "Order not found");
		}
		return reply
			.status(200)
			.send(successResponse("Order retrieved successfully", order));
	};

	const getValidOrderStatuses = async (request, reply) => {
		const statuses = orderService.getValidOrderStatuses();
		return reply
			.status(200)
			.send(successResponse("Valid order statuses retrieved", statuses));
	};

	const create = async (request, reply) => {
		const userId = request.user.userId;
		const newOrder = await orderService.createOrder(request.body, userId);
		return reply
			.status(200)
			.send(successResponse("Order created successfully", newOrder));
	};

	const update = async (request, reply) => {
		const { id } = request.params;
		const updatedOrder = await orderService.updateOrder(id, request.body);
		return reply
			.status(200)
			.send(successResponse(true, "Order updated successfully", updatedOrder));
	};

	const updateStatus = async (request, reply) => {
		try {
			const { id } = request.params;
			const { status } = request.body;

			const updatedOrder = await orderService.updateOrderStatus(id, status);
			return reply
				.status(200)
				.send(
					successResponse(
						true,
						"Order status updated successfully",
						updatedOrder,
					),
				);
		} catch (error) {
			return reply.status(400).send(errorResponse(false, error.message));
		}
	};

	const remove = async (request, reply) => {
		const { id } = request.params;
		const result = await orderService.removeOrder(id);

		return reply
			.status(200)
			.send(successResponse(true, "Order deleted successfully", result));
	};

	return {
		getAll,
		getById,
		getValidOrderStatuses,
		create,
		update,
		updateStatus,
		remove,
	};
};

export default OrderController;
