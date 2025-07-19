class Api {
	constructor() {
		this.baseURL = "/api/v1";
		this.token = localStorage.getItem("token");
	}

	// Método para hacer peticiones HTTP
	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;

		const config = {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		};

		if (this.token) {
			config.headers.Authorization = `Bearer ${this.token}`;
		}

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || `HTTP error! status: ${response.status}`,
				);
			}

			return data;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		}
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

	async googleLogin() {
		return this.request("/auth/google");
	}

	async getMe(options = {}) {
		return this.request("/auth/me", options);
	}
}

export const API = new Api();
