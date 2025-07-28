import { api } from "../lib/api.js";
import { authStore } from "../stores/authStore.js";

class OrderService {
	async createOrder(orderData) {
		const response = await api.post("/orders", orderData);
		return response;
	}

	async getAllOrders() {
		const userId = authStore.getUser().id;
		const response = await api.get(`/orders/${userId}`);
		return response;
	}
}

export const orderService = new OrderService();
