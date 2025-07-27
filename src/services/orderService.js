import { Order } from "../models/Order.js";
import { NotFoundError } from "../utils/errors.js";
import { VALID_ORDER_STATUSES } from "../constants/orderStatus.js";

const OrderService = () => {
	const createOrder = async (orderData) => {
		const order = new Order(orderData);
		await order.save();
		return order;
	};

	const getOrderById = async (orderId) => {
		const order = await Order.findById(orderId).populate("quoteId");
		if (!order) throw new NotFoundError("Order not found");
		return order;
	};

	const getAllOrders = async () => {
		const orders = await Order.find().populate("quoteId");
		return orders;
	};

	const getOrdersByUserId = async (userId) => {
		const orders = await Order.find({ userId }).populate("quoteId");
		return orders;
	};

	//Funcion para obtener los estados de pedidos válidos - Usar en frontend
	const getValidOrderStatuses = () => {
		return VALID_ORDER_STATUSES;
	}; 

	const updateOrder = async (orderId, updateData) => {
		const order = await Order.findByIdAndUpdate(orderId, updateData, {
			new: true,
			runValidators: true,
		}).populate("quoteId");
		if (!order) throw new NotFoundError("Order not found");
		return order;
	};

	const updateOrderStatus = async (orderId, status) => {
		if (!VALID_ORDER_STATUSES.includes(status)) {
			throw new Error("Invalid order status");
		}

		const order = await Order.findByIdAndUpdate(
			orderId,
			{ status },
			{ new: true, runValidators: true }
		);

		if (!order) throw new NotFoundError("Order not found");
		return order;
	}

	const removeOrder = async (orderId) => {
		const order = await Order.findByIdAndDelete(orderId);
		if (!order) throw new NotFoundError("Order not found");
		return order;
	};

	return {
		createOrder,
		getOrderById,
		getAllOrders,
		getOrdersByUserId,
		updateOrder,
		updateOrderStatus,
		removeOrder,
	};
};

export default OrderService;
