import { Order } from "../models/Order.js";
import { File } from "../models/File.js";
import { NotFoundError } from "../utils/errors.js";
import { VALID_ORDER_STATUSES } from "../constants/orderStatus.js";
import { QuoteService } from "./quoteService.js";
import { StorageService } from "./storageService.js";

const OrderService = () => {
	const quoteService = new QuoteService();
	const storageService = new StorageService();

	const createOrder = async (orderData, userId) => {
		const orderParsed = _parseOrderData(orderData);
		const order = new Order({ ...orderParsed, userId });
		await order.save();

		// Actualizar el archivo para cambiar su tipo de "quotation" a "order"
		if (orderData.fileId) {
			await File.findByIdAndUpdate(orderData.fileId, {
				type: "order",
				status: "ordered",
				orderedAt: new Date(),
				orderId: order._id,
			});
		}

		if (orderData.quoteId) {
			await quoteService.remove(orderData.quoteId);
		}

		return order;
	};

	const getOrderById = async (orderId, user) => {
		const order = await Order.findById(orderId)
			.populate("materialId")
			.populate("finishId")
			.populate("userId")
			.populate("address");

		if (!order) throw new NotFoundError("Order not found");

		// Si no es admin, sólo puede ver su orden
		if (user.role !== "admin" && order.userId._id.toString() !== user.userId) {
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
		console.log("🔧 Actualizando estado de orden en servicio:", {
			orderId,
			status,
		});

		if (!VALID_ORDER_STATUSES.includes(status)) {
			console.error(
				"❌ Estado inválido:",
				status,
				"Estados válidos:",
				VALID_ORDER_STATUSES,
			);
			throw new Error("Invalid order status");
		}

		// Si el estado es CANCELED, eliminar archivo del bucket
		if (status === "CANCELED") {
			const order = await Order.findById(orderId).populate("fileId");
			if (order && order.fileId && order.fileId.filePath) {
				try {
					console.log(
						"🗑️ Cancelando orden - eliminando archivo del bucket:",
						order.fileId.filePath,
					);
					const deleteResult = await storageService.deleteFile(
						order.fileId.filePath,
					);

					if (deleteResult.success) {
						console.log("✅ Archivo eliminado del bucket al cancelar orden");
					} else {
						console.error(
							"⚠️ Error eliminando archivo del bucket al cancelar:",
							deleteResult.message,
						);
					}
				} catch (error) {
					console.error(
						"❌ Error eliminando archivo del bucket al cancelar:",
						error,
					);
				}

				// Eliminar registro de archivo de MongoDB
				if (order.fileId) {
					try {
						await File.findByIdAndDelete(order.fileId._id);
						console.log(
							"✅ Registro de archivo eliminado de MongoDB al cancelar",
						);
					} catch (error) {
						console.error(
							"❌ Error eliminando registro de archivo al cancelar:",
							error,
						);
					}
				}
			}
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

		if (!order) {
			console.error("❌ Orden no encontrada:", orderId);
			throw new NotFoundError("Order not found");
		}

		console.log("✅ Orden actualizada en servicio:", order);
		return order;
	};

	const removeOrder = async (orderId, userId) => {
		const order = await Order.findById(orderId).populate("fileId");
		if (!order) throw new NotFoundError("Order not found");

		if (userId.toString() !== order.userId.toString()) {
			throw new Error("Access denied");
		}

		// Eliminar archivo del bucket si existe
		if (order.fileId && order.fileId.filePath) {
			try {
				console.log("🗑️ Eliminando archivo del bucket:", order.fileId.filePath);
				const deleteResult = await storageService.deleteFile(
					order.fileId.filePath,
				);

				if (deleteResult.success) {
					console.log("✅ Archivo eliminado del bucket exitosamente");
				} else {
					console.error(
						"⚠️ Error eliminando archivo del bucket:",
						deleteResult.message,
					);
				}
			} catch (error) {
				console.error("❌ Error eliminando archivo del bucket:", error);
			}
		}

		// Eliminar registro de archivo de MongoDB si existe
		if (order.fileId) {
			try {
				await File.findByIdAndDelete(order.fileId._id);
				console.log("✅ Registro de archivo eliminado de MongoDB");
			} catch (error) {
				console.error("❌ Error eliminando registro de archivo:", error);
			}
		}

		// Eliminar la orden
		await updateOrderStatus(orderId, "CANCELED");
		console.log("✅ Orden eliminada de MongoDB");

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

			stripeTransferId: raw.paymentIntentId,
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
