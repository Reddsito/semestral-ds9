import stripe from "../config/stripe.js";
import dotenv from "dotenv";
import { NotFoundError } from "../utils/errors.js";
import OrderService from "./orderService.js";

dotenv.config();

const StripeService = () => {
	const createCheckoutSession = async (orderData) => {
		console.log(orderData);
		try {
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: [
					{
						price_data: {
							currency: "usd",
							product_data: {
								name: "Impresión 3D",
							},
							unit_amount: Math.round(orderData.totalPrice * 100), // Stripe usa centavos
						},
						quantity: 1,
					},
				],
				mode: "payment",
				success_url: `${
					process.env.FRONTEND_URL || "http://localhost:3001"
				}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${
					process.env.FRONTEND_URL || "http://localhost:3001"
				}/cancel`,
				metadata: createMetadata(orderData),
			});

			return {
				sessionId: session.id,
				url: session.url,
			};
		} catch (error) {
			console.error("Error creating checkout session:", error);
			throw new Error("Error al crear la sesión de checkout");
		}
	};

	const retrieveCheckoutSession = async (sessionId) => {
		try {
			const session = await stripe.checkout.sessions.retrieve(sessionId, {
				expand: ["payment_intent"],
			});

			if (!session) {
				throw new NotFoundError("Stripe Session not found");
			}
			return session;
		} catch (error) {
			console.error("Error retrieving checkout session:", error);
			throw new Error("Error al obtener la sesión de checkout");
		}
	};

	const createMetadata = (orderData) => {
		const materialCost = orderData.priceBreakdown?.materialCost || {};
		const finishCost = orderData.priceBreakdown?.finishCost || {};
		const fixedCosts = orderData.priceBreakdown?.fixedCosts || {};

		return {
			quoteId: orderData.quoteId ?? "",
			userId: orderData.userId ?? "",
			fileId: orderData.fileId || "",
			address: orderData.addressId || "",
			materialId: orderData.materialId || "",
			material: orderData.materialName || "", // si tienes nombre aparte
			finishId: orderData.finishId || "",
			finish: orderData.finishName || "", // si tienes nombre aparte

			quantity: orderData.quantity || 1,
			totalPrice: orderData.totalPrice || 0,

			// Material cost desglosado
			materialPricePerGram: materialCost.pricePerGram || 0,
			materialWeight: materialCost.weight || 0,
			materialCostPerUnit: materialCost.costPerUnit || 0,
			materialQuantity: materialCost.quantity || 0,
			materialTotal: materialCost.total || 0,

			// Finish cost desglosado
			finishBasePrice: finishCost.basePrice || 0,
			finishMultiplier: finishCost.multiplier || 0,
			finishCostPerUnit: finishCost.costPerUnit || 0,
			finishQuantity: finishCost.quantity || 0,
			finishTotal: finishCost.total || 0,

			// Fixed costs desglosados
			shippingCost: fixedCosts.shippingCost || 0,
			orderFixedCost: fixedCosts.orderFixedCost || 0,
			fixedCostsTotal: fixedCosts.total || 0,
			fixedCostsNote: fixedCosts.note || "",

			subtotal: orderData.priceBreakdown?.subtotal || 0,
			tax: orderData.priceBreakdown?.tax || 0,
			total: orderData.priceBreakdown?.total || 0,
			calculationNotes: orderData.priceBreakdown?.calculationNotes || "",

			status: orderData.status || "",
			expiresAt: orderData.expiresAt
				? new Date(orderData.expiresAt).toISOString()
				: "",
			notes: orderData.notes || "",
			sessionId: orderData.sessionId || "",
		};
	};

	const refund = async (orderId, intentId, userId) => {
		const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
		const chargeId = paymentIntent.latest_charge;
		console.log({ chargeId });

		await stripe.refunds.create({
			charge: chargeId,
		});

		await OrderService().removeOrder(orderId, userId);
	};

	return {
		createCheckoutSession,
		retrieveCheckoutSession,
		refund,
	};
};

export default StripeService;
