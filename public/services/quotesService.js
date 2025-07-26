import { api } from "../lib/api.js";

class QuotesService {
	async getUserQuotes(page = 1, limit = 10) {
		console.log("🔍 Llamando a getUserQuotes con:", { page, limit });
		const response = await api.get(`/quotes/user?page=${page}&limit=${limit}`);
		console.log("📡 Respuesta de getUserQuotes:", response);
		return response;
	}

	async getAllQuotes(filters = {}, page = 1, limit = 20) {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
			...filters,
		});
		return api.get(`/quotes/admin/all?${params}`);
	}

	async getQuoteById(quoteId) {
		return api.get(`/quotes/${quoteId}`);
	}

	async deleteQuote(quoteId) {
		return api.delete(`/quotes/${quoteId}`);
	}

	async saveQuote(quoteData) {
		return api.post("/quote/save", quoteData);
	}

	async getQuoteStats() {
		return api.get("/quotes/admin/stats");
	}

	async cleanupExpiredQuotes() {
		return api.post("/quotes/admin/cleanup");
	}
}

export const quotesService = new QuotesService();
