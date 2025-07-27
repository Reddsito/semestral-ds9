class Api {
	constructor() {
		this.baseURL = "/api/v1";
	}

	// Método para hacer peticiones HTTP
	async request(endpoint, options = {}) {
		const token = localStorage.getItem("token");

		const url = `${this.baseURL}${endpoint}`;

		const config = {
			headers: {
				...options.headers,
			},
			...options,
		};

		// Solo agregar Content-Type si no está presente y hay body
		if (!config.headers["Content-Type"] && config.body) {
			config.headers["Content-Type"] = "application/json";
		}

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		console.log("🌐 API Request:", {
			url,
			method: config.method || "GET",
			headers: config.headers,
			token: token ? "Presente" : "Ausente",
		});

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			console.log("📡 API Response:", {
				status: response.status,
				success: data.success,
				message: data.message,
			});

			if (!response.ok) {
				throw new Error(
					data.message || `HTTP error! status: ${response.status}`,
				);
			}

			return data;
		} catch (error) {
			console.error("❌ API Error:", error);
			throw error;
		}
	}

	// Métodos HTTP genéricos
	async get(endpoint, options = {}) {
		return this.request(endpoint, {
			method: "GET",
			...options,
		});
	}

	async post(endpoint, data, options = {}) {
		return this.request(endpoint, {
			method: "POST",
			body: JSON.stringify(data),
			...options,
		});
	}

	async put(endpoint, data, options = {}) {
		return this.request(endpoint, {
			method: "PUT",
			body: JSON.stringify(data),
			...options,
		});
	}

	async patch(endpoint, data, options = {}) {
		return this.request(endpoint, {
			method: "PATCH",
			body: JSON.stringify(data),
			...options,
		});
	}

	async delete(endpoint, options = {}) {
		// Para DELETE, no enviar Content-Type si no hay body
		const headers = { ...options.headers };

		return this.request(endpoint, {
			method: "DELETE",
			headers,
			...options,
		});
	}
}

export const api = new Api();
