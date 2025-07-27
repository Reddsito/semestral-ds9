import OrderService from "../services/orderService.js";
import { successResponse } from "../utils/responseHelper.js";

const OrderController = () => {
	const orderService = OrderService();

	const getAll = async (request, reply) => {
		const orders = await orderService.getAll();
		return successResponse(true, "Orders retrieved successfully", orders);
	};

	const getById = async (request, reply) => {
		const { id } = request.params;
		const order = await orderService.getById(id);
		if (!order) {
			return errorResponse(false, "Order not found");
		}
		return responseHelper.success(reply, order);
	};
	
	const getValidOrderStatuses = async (request, reply) => {
		const statuses = orderService.getValidOrderStatuses();
		return successResponse(true, "Valid order statuses retrieved", statuses);
	};

	const create = async (request, reply) => {
		const newOrder = await orderService.createOrder(request.body);
		return responseHelper.success(reply, newOrder);
	};

	const update = async (request, reply) => {
		const { id } = request.params;
		const updatedOrder = await orderService.updateOrder(id, request.body);
		return successResponse(true, "Order updated successfully", updatedOrder);
	};

	const updateStatus = async (request, reply) => {
		try{
			const { id } = request.params;
			const { status } = request.body;

			const updatedOrder = await orderService.updateOrderStatus(id, status);
			return successResponse(true, "Order status updated successfully", updatedOrder);
		}
		catch (error) {
			return errorResponse(false, error.message);
		}
	};

	const remove = async (request, reply) => {
		const { id } = request.params;
		const result = await orderService.removeOrder(id);

		return successResponse(true, "Order deleted successfully", result);
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
