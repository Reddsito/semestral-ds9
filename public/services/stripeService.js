import { api } from "../lib/api.js";

class StripeService {
	async createCheckoutSession(orderData) {
		api
			.post("/stripe/checkout-session", orderData)
			.then((response) => {
				if (response.result.data && response.result.data.url) {
					window.location.href = response.result.data.url;
				} else {
					throw new Error("Error al crear la sesión de pago");
				}
			})
			.catch((error) => {
				console.error("Error en el proceso de pago:", error);
				throw error;
			});
	}

	async getCheckoutSession(sessionId) {
		try {
			const response = await api.get(`/stripe/checkout-session/${sessionId}`);
			return response;
		} catch (error) {
			console.error("Error al obtener la sesión de pago:", error);
			throw error;
		}
	}
}

export const stripeService = new StripeService();
