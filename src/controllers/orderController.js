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

	const create = async (request, reply) => {
		const newOrder = await orderService.createOrder(request.body);
		return responseHelper.success(reply, newOrder);
	};

	const update = async (request, reply) => {
		const { id } = request.params;
		const updatedOrder = await orderService.updateOrder(id, request.body);
		return successResponse(true, "Order updated successfully", updatedOrder);
	};

	const remove = async (request, reply) => {
		const { id } = request.params;
		const result = await orderService.removeOrder(id);

		return successResponse(true, "Order deleted successfully", result);
	};

	return {
		getAll,
		getById,
		create,
		update,
		remove,
	};
};

export default OrderController;
