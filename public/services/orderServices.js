import { api } from "../lib/api.js";

class OrderService {
	async createOrder(orderData) {
		const response = await api.post("/orders", orderData);
		return response;
	}
}

export const orderService = new OrderService();
