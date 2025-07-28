import OrderService from "../services/orderService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import { NotFoundError } from "../utils/errors.js";

const OrderController = () => {
	const orderService = OrderService();

	const getAll = async (request, reply) => {
		const user = request.user;
		try {
			let orders;
			if (user.role !== "admin") {
				orders = await orderService.getOrdersByUserId(user.userId);
				return reply
					.status(200)
					.send(successResponse("User orders retrieved successfully", orders));
			}
			orders = await orderService.getAllOrders();
			return reply
				.status(200)
				.send(successResponse("Orders retrieved successfully", orders));
		} catch (error) {
			return reply.status(500).send(errorResponse(error.message));
		}
	};

	const getById = async (request, reply) => {
		const { id } = request.params;
		const user = request.user;

		try {
			const order = await orderService.getOrderById(id, user);
			return reply
				.status(200)
				.send(successResponse("Order retrieved successfully", order));
		} catch (error) {
			if (error instanceof NotFoundError) {
				return reply.status(404).send(errorResponse(error.message));
			}
			if (error.message === "Access denied") {
				return reply.status(403).send(errorResponse(error.message));
			}
			return reply.status(500).send(errorResponse(error.message));
		}
	};

	const getValidOrderStatuses = async (request, reply) => {
		try {
			const statuses = orderService.getValidOrderStatuses();
			return reply
				.status(200)
				.send(successResponse("Valid order statuses retrieved", statuses));
		} catch (error) {
			return reply.status(500).send(errorResponse(error.message));
		}
	};

	const create = async (request, reply) => {
		const userId = request.user.userId;
		try {
			const newOrder = await orderService.createOrder(request.body, userId);
			return reply
				.status(201)
				.send(successResponse("Order created successfully", newOrder));
		} catch (error) {
			return reply.status(400).send(errorResponse(error.message));
		}
	};

	const update = async (request, reply) => {
		const { id } = request.params;
		const user = request.user;

		try {
			const updatedOrder = await orderService.updateOrder(id, request.body, user);
			return reply
				.status(200)
				.send(successResponse("Order updated successfully", updatedOrder));
		} catch (error) {
			if (error instanceof NotFoundError) {
				return reply.status(404).send(errorResponse(error.message));
			}
			if (error.message === "Access denied") {
				return reply.status(403).send(errorResponse(error.message));
			}
			return reply.status(400).send(errorResponse(error.message));
		}
	};

	const updateStatus = async (request, reply) => {
		const { id } = request.params;
		const { status } = request.body;

		try {
			const updatedOrder = await orderService.updateOrderStatus(id, status);
			return reply
				.status(200)
				.send(successResponse("Order status updated successfully", updatedOrder));
		} catch (error) {
			return reply.status(400).send(errorResponse(error.message));
		}
	};

	const remove = async (request, reply) => {
		const { id } = request.params;
		const user = request.user;

		try {
			const result = await orderService.removeOrder(id, user);
			return reply
				.status(200)
				.send(successResponse("Order removed successfully", result));
		} catch (error) {
			if (error instanceof NotFoundError) {
				return reply.status(404).send(errorResponse(error.message));
			}
			if (error.message === "Access denied") {
				return reply.status(403).send(errorResponse(error.message));
			}
			return reply.status(500).send(errorResponse(error.message));
		}
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
