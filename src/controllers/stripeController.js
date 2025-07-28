import OrderService from "../services/orderService.js";
import StripeService from "../services/stripeService.js";
import { standardResponse } from "../utils/responseHelper.js";

const StripeController = () => {
	const stripeService = StripeService();

	const purchaseOrder = async (request, reply) => {
		const response = await stripeService.createCheckoutSession(request.body);
		return reply
			.status(200)
			.send(
				standardResponse(
					true,
					"Checkout session created successfully",
					response,
				),
			);
	};

	const getCheckoutSession = async (request, reply) => {
		const sessionId = request.params.sessionId;
		const session = await stripeService.retrieveCheckoutSession(sessionId);

		return reply
			.status(200)
			.send(
				standardResponse(
					true,
					"Checkout session retrieved successfully",
					session,
				),
			);
	};

	const refundOrder = async (request, reply) => {
		const { orderId, intentId } = request.body;
		const user = request.user;
		try {
			const response = await stripeService.refund(
				orderId,
				intentId,
				user.userId,
			);
			return reply
				.status(200)
				.send(
					standardResponse(
						true,
						"Order refunded and removed successfully",
						response,
					),
				);
		} catch (error) {
			console.error("Error processing refund:", error);
			return reply
				.status(500)
				.send(
					standardResponse(false, "Error processing refund", error.message),
				);
		}
	};

	return {
		purchaseOrder,
		getCheckoutSession,
		refundOrder,
	};
};

export default StripeController;
