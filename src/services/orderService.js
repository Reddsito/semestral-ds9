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

	const getOrderById = async (orderId, user) => {
		const order = await Order.findById(orderId);
		if (!order) throw new NotFoundError("Order not found");

		// Si no es admin, sólo puede ver su orden
		if (user.role !== "admin" && order.userId.toString() !== user.userId) {
			throw new Error("Access denied");
		}

		return order;
	};

	const getAllOrders = async () => {
		const orders = await Order.find()
			.populate("address")
			.populate("fileId")
			.populate("materialId")
			.populate("finishId")
			.populate("userId");
		return orders;
	};

	const getOrdersByUserId = async (userId) => {
		const orders = await Order.find({ userId })
			.populate("address")
			.populate("fileId")
			.populate("materialId")
			.populate("finishId")
			.populate("userId");

		console.log(orders);
		return orders;
	};

	//Funcion para obtener los estados de pedidos válidos - Usar en frontend
	const getValidOrderStatuses = () => {
		return VALID_ORDER_STATUSES;
	};

	const updateOrder = async (orderId, updateData, user) => {
		// Si es usuario común, filtra los campos no permitidos
		if (user.role !== "admin") {
			const filteredData = {};
			USER_ALLOWED_UPDATE_FIELDS.forEach((field) => {
				if (field in updateData) {
					filteredData[field] = updateData[field];
				}
			});
			updateData = filteredData;
		}

		const order = await Order.findByIdAndUpdate(orderId, updateData, {
			new: true,
			runValidators: true,
		}).populate("quoteId");

		if (!order) throw new NotFoundError("Order not found");

		// Validar que usuario solo actualice su orden
		if (user.role !== "admin" && order.userId.toString() !== user.id) {
			throw new Error("Access denied");
		}

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

	const removeOrder = async (orderId, user) => {
		const order = await Order.findById(orderId);
		if (!order) throw new NotFoundError("Order not found");

		if (user.role !== "admin" && order.userId.toString() !== user.id) {
			throw new Error("Access denied");
		}

		await Order.findByIdAndDelete(orderId);
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
