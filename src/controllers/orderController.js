import OrderService from "../services/orderService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import { NotFoundError } from "../utils/errors.js";
import { Order } from "../models/Order.js";

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

	const getAllForAdmin = async (request, reply) => {
		try {
			const {
				page = 1,
				limit = 20,
				status = "",
				email = "",
				dateFrom = "",
				dateTo = "",
			} = request.query;
			const skip = (page - 1) * limit;

			// Construir filtros
			const filters = {};

			if (status) {
				filters.status = status;
			}

			if (dateFrom || dateTo) {
				filters.createdAt = {};
				if (dateFrom) {
					filters.createdAt.$gte = new Date(dateFrom);
				}
				if (dateTo) {
					filters.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
				}
			}

			// Construir pipeline de agregación
			const pipeline = [
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "userId",
					},
				},
				{
					$unwind: "$userId",
				},
			];

			// Agregar filtro de email después del lookup de usuarios
			if (email) {
				pipeline.push({
					$match: {
						"userId.email": { $regex: email, $options: "i" },
					},
				});
			}

			// Agregar filtros de estado y fechas al inicio del pipeline
			if (Object.keys(filters).length > 0) {
				pipeline.unshift({ $match: filters });
			}

			// Continuar con los otros lookups
			pipeline.push(
				{
					$lookup: {
						from: "files",
						localField: "fileId",
						foreignField: "_id",
						as: "fileId",
					},
				},
				{
					$unwind: "$fileId",
				},
				{
					$lookup: {
						from: "materials",
						localField: "materialId",
						foreignField: "_id",
						as: "materialId",
					},
				},
				{
					$unwind: "$materialId",
				},
				{
					$lookup: {
						from: "finishes",
						localField: "finishId",
						foreignField: "_id",
						as: "finishId",
					},
				},
				{
					$unwind: "$finishId",
				},
			);

			// Agregar paginación
			pipeline.push(
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: parseInt(limit) },
			);

			// Pipeline para contar total
			const countPipeline = [...pipeline.slice(0, -3), { $count: "total" }];

			const [orders, countResult] = await Promise.all([
				Order.aggregate(pipeline),
				Order.aggregate(countPipeline),
			]);

			const total = countResult.length > 0 ? countResult[0].total : 0;

			return reply.status(200).send(
				successResponse("Orders retrieved successfully", {
					orders,
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total,
						pages: Math.ceil(total / limit),
					},
				}),
			);
		} catch (error) {
			console.error("Error getting orders for admin:", error);
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

	const getOrdersByUserId = async (request, reply) => {
		const userId = request.user.userId;
		try {
			const orders = await orderService.getOrdersByUserId(userId);
			return reply
				.status(200)
				.send(successResponse("User orders retrieved successfully", orders));
		} catch (error) {
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
			const updatedOrder = await orderService.updateOrder(
				id,
				request.body,
				user,
			);
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

		console.log("🔄 Actualizando estado de orden:", {
			id,
			status,
			user: request.user,
		});

		try {
			const updatedOrder = await orderService.updateOrderStatus(id, status);
			console.log("✅ Orden actualizada exitosamente:", updatedOrder);
			return reply
				.status(200)
				.send(
					successResponse("Order status updated successfully", updatedOrder),
				);
		} catch (error) {
			console.error("❌ Error actualizando estado de orden:", error);
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
		getAllForAdmin,
		getById,
		getValidOrderStatuses,
		create,
		update,
		updateStatus,
		remove,
		getOrdersByUserId,
	};
};

export default OrderController;
