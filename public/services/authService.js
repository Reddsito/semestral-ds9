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
}

export const authService = new AuthService();
