// Servicio de autenticación para el frontend
class AuthService {
	constructor() {
		this.baseURL = "http://localhost:3001";
		this.tokenKey = "auth_token";
		this.userKey = "auth_user";
	}

	// Obtener token del localStorage
	getToken() {
		return localStorage.getItem(this.tokenKey);
	}

	// Guardar token en localStorage
	setToken(token) {
		localStorage.setItem(this.tokenKey, token);
	}

	// Obtener usuario del localStorage
	getUser() {
		const user = localStorage.getItem(this.userKey);
		return user ? JSON.parse(user) : null;
	}

	// Guardar usuario en localStorage
	setUser(user) {
		localStorage.setItem(this.userKey, JSON.stringify(user));
	}

	// Verificar si está autenticado
	isAuthenticated() {
		return !!this.getToken();
	}

	// Limpiar datos de autenticación
	clearAuth() {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.userKey);
	}

	// Login con email y password
	async login(email, password) {
		try {
			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (data.success) {
				const user = data.result.data;
				const token = data.result.extra?.token;

				if (token) {
					this.setToken(token);
					this.setUser(user);
					return { success: true, user, token };
				} else {
					return { success: false, message: "Token no recibido" };
				}
			} else {
				return { success: false, message: data.message };
			}
		} catch (error) {
			console.error("Error en login:", error);
			return { success: false, message: "Error de conexión" };
		}
	}

	// Registro de usuario
	async register(userData) {
		try {
			const response = await fetch(`${this.baseURL}/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});

			const data = await response.json();

			if (data.success) {
				const user = data.result.data;
				const token = data.result.extra?.token;

				if (token) {
					this.setToken(token);
					this.setUser(user);
					return { success: true, user, token };
				} else {
					return { success: false, message: "Token no recibido" };
				}
			} else {
				return { success: false, message: data.message };
			}
		} catch (error) {
			console.error("Error en registro:", error);
			return { success: false, message: "Error de conexión" };
		}
	}

	// Logout
	async logout() {
		try {
			const token = this.getToken();
			if (token) {
				await fetch(`${this.baseURL}/auth/logout`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
			}
		} catch (error) {
			console.error("Error en logout:", error);
		} finally {
			this.clearAuth();
		}
	}

	// Verificar token
	async verifyToken() {
		try {
			const token = this.getToken();
			if (!token) {
				return { success: false, message: "No hay token" };
			}

			const response = await fetch(`${this.baseURL}/auth/verify`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error verificando token:", error);
			return { success: false, message: "Error de conexión" };
		}
	}

	// Obtener perfil del usuario
	async getProfile() {
		try {
			const token = this.getToken();
			if (!token) {
				return { success: false, message: "No hay token" };
			}

			const response = await fetch(`${this.baseURL}/auth/profile`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error obteniendo perfil:", error);
			return { success: false, message: "Error de conexión" };
		}
	}

	// Procesar callback de Google OAuth
	processGoogleCallback(token, userData) {
		try {
			if (token && userData) {
				this.setToken(token);
				this.setUser(userData);
				return { success: true, user: userData, token };
			} else {
				return {
					success: false,
					message: "Datos de autenticación incompletos",
				};
			}
		} catch (error) {
			console.error("Error procesando callback de Google:", error);
			return { success: false, message: "Error procesando autenticación" };
		}
	}

	// Verificar si el usuario es de Google
	isGoogleUser() {
		const user = this.getUser();
		return user && user.googleId;
	}

	// Obtener información del proveedor de autenticación
	getAuthProvider() {
		const user = this.getUser();
		if (user && user.googleId) {
			return "Google";
		}
		return "Email/Password";
	}
}

const authService = new AuthService();
export default authService;
