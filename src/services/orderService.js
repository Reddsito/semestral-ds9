import { Order } from "../models/Order.js";
import { NotFoundError } from "../utils/errors.js";
import { VALID_ORDER_STATUSES } from "../constants/orderStatus.js";
import { QuoteService } from "./quoteService.js";

const OrderService = () => {
	const quoteService = new QuoteService();

	const createOrder = async (orderData, userId) => {
		const orderParsed = _parseOrderData(orderData);
		const order = new Order({ ...orderParsed, userId });
		await order.save();

		if (orderData.quoteId) {
			await quoteService.remove(orderData.quoteId);
		}

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
			{
				status,
				statusUpdatedAt: new Date(),
			},
			{
				new: true,
				runValidators: true,
			},
		);

		if (!order) throw new NotFoundError("Order not found");
		return order;
	};

	const removeOrder = async (orderId) => {
		const order = await Order.findByIdAndDelete(orderId);
		if (!order) throw new NotFoundError("Order not found");
		return order;
	};

	const _parseOrderData = (raw) => {
		return {
			fileId: raw.fileId,
			materialId: raw.materialId,
			addressId: raw.addressId,
			finishId: raw.finishId,
			quantity: Number(raw.quantity),
			totalPrice: Number(raw.totalPrice),
			status: "RECEIVED",
			sessionId: raw.sessionId,
			expiresAt: raw.expiresAt,
			address: raw.address,

			priceBreakdown: {
				materialCost: {
					pricePerGram: Number(raw.materialPricePerGram),
					weight: Number(raw.materialWeight),
					costPerUnit: Number(raw.materialCostPerUnit),
					quantity: Number(raw.materialQuantity),
					total: Number(raw.materialTotal),
				},
				finishCost: {
					basePrice: Number(raw.finishBasePrice),
					multiplier: Number(raw.finishMultiplier),
					costPerUnit: Number(raw.finishCostPerUnit),
					quantity: Number(raw.finishQuantity),
					total: Number(raw.finishTotal),
				},
				fixedCosts: {
					shippingCost: Number(raw.shippingCost),
					orderFixedCost: Number(raw.orderFixedCost),
					total: Number(raw.fixedCostsTotal),
					note: raw.fixedCostsNote,
				},
				subtotal: Number(raw.subtotal),
				tax: Number(raw.tax),
				total: Number(raw.total),
				calculationNotes: raw.calculationNotes,
			},
		};
	};

	return {
		createOrder,
		getOrderById,
		getValidOrderStatuses,
		getAllOrders,
		getOrdersByUserId,
		updateOrder,
		updateOrderStatus,
		removeOrder,
	};
};

export default OrderService;
