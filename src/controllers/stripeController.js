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

	return {
		purchaseOrder,
		getCheckoutSession,
	};
};

export default StripeController;
