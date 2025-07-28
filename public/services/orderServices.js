import { api } from "../lib/api.js";

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
		return response.data;
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
}

export const orderService = new OrderService();
