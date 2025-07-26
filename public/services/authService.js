import { api } from "../lib/api.js";

class AuthService {
	async login(email, password) {
		return api.post("/auth/login", { email, password });
	}

	async register(userData) {
		return api.post("/auth/register", userData);
	}

	async googleLogin() {
		return api.get("/auth/google");
	}

	async getMe(options = {}) {
		return api.get("/auth/me", options);
	}

	async logout() {
		// Limpiar token del localStorage
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	}

	// Obtener URL firmada del avatar
	async getAvatarSignedUrl() {
		try {
			const response = await fetch("/api/v1/auth/avatar/signed-url", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				return {
					success: true,
					signedUrl: data.result.data.signedUrl,
				};
			} else {
				return {
					success: false,
					message: data.message || "Error obteniendo URL del avatar",
				};
			}
		} catch (error) {
			console.error("Error obteniendo URL firmada del avatar:", error);
			return {
				success: false,
				message: "Error de conexión",
			};
		}
	}
}

export const authService = new AuthService();
