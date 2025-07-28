import { api } from "../lib/api.js";
import { authStore } from "../stores/authStore.js";

class OrderService {
	async createOrder(orderData) {
		const response = await api.post("/orders", orderData);
		return response.data;
	}

	async getAllOrders() {
		const response = await api.get("/orders");
		return response.data;
	}

	async getOrderById(id) {
		const response = await api.get(`/orders/${id}`);
		return response;
	}

	async updateOrder(id, updateData) {
		const response = await api.put(`/orders/${id}`, updateData);
		return response.data;
	}

	async updateOrderStatus(id, status) {
		const response = await api.patch(`/orders/${id}/status`, { status });
		return response.data;
	}

	async removeOrder(id) {
		const response = await api.delete(`/orders/${id}`);
		return response.data;
	}

	async getValidOrderStatuses() {
		const response = await api.get("/orders/statuses");
		return response.data;
	}

	async getOrdersByUserId() {
		const userId = authStore.getUser().id;
		const response = await api.get(`/orders/user/${userId}`);
		return response;
	}
}

export const orderService = new OrderService();
