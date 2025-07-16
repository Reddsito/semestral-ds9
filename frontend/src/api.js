// API Service para manejar todas las peticiones HTTP
export class Api {
	constructor() {
		this.baseURL = "http://localhost:3001";
	}

	// Método genérico para hacer peticiones
	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		};

		try {
			const response = await fetch(url, config);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error en petición API:", error);
			throw error;
		}
	}

	// Método para peticiones autenticadas
	async authenticatedRequest(endpoint, options = {}) {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			throw new Error("No hay token de autenticación");
		}

		return this.request(endpoint, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});
	}

	// Métodos de autenticación
	async login(email, password) {
		return this.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
	}

	async register(userData) {
		return this.request("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}

	async logout() {
		return this.authenticatedRequest("/auth/logout", {
			method: "POST",
		});
	}

	async verifyToken() {
		return this.authenticatedRequest("/auth/verify");
	}

	async getProfile() {
		return this.authenticatedRequest("/auth/profile");
	}

	// Métodos para productos (ejemplo)
	async getProducts() {
		return this.authenticatedRequest("/products");
	}

	async createProduct(productData) {
		return this.authenticatedRequest("/products", {
			method: "POST",
			body: JSON.stringify(productData),
		});
	}

	async updateProduct(id, productData) {
		return this.authenticatedRequest(`/products/${id}`, {
			method: "PUT",
			body: JSON.stringify(productData),
		});
	}

	async deleteProduct(id) {
		return this.authenticatedRequest(`/products/${id}`, {
			method: "DELETE",
		});
	}
}
