import { authService } from "../services/authService.js";
import { Toast } from "../components/Toast.js";

class AuthStore {
	constructor() {
		this.state = {
			isAuthenticated: false,
			user: null,
			token: null,
			isLoading: false,
			error: null,
		};
		this.listeners = [];
	}

	// Método para suscribirse a cambios del store
	subscribe(listener) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	// Notificar a todos los listeners
	notify() {
		console.log("notify");

		this.listeners.forEach((listener) => listener(this.state));
		console.log("termine");
	}

	// Actualizar estado
	setState(newState) {
		console.log("first");
		this.state = { ...this.state, ...newState };
		console.log("second");

		this.notify();
	}

	// Manejar token de Google OAuth
	async handleGoogleToken() {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");

		if (token) {
			console.log("Token de Google detectado, procesando...");

			try {
				localStorage.setItem("token", token);

				const result = await authService.getMe({
					headers: { Authorization: `Bearer ${token}` },
				});

				if (result.success) {
					this.setState({
						token: token,
						user: result.result.data,
						isAuthenticated: true,
					});

					const cleanUrl = window.location.pathname;
					window.history.replaceState({}, document.title, cleanUrl);

					return { success: true, processed: true };
				} else {
					console.error("Error obteniendo usuario:", result.message);
					Toast.error("Error al obtener información del usuario");
					this.logout();
					return { success: false, error: result.message };
				}
			} catch (error) {
				console.error("Error procesando token de Google:", error);
				Toast.error("Error al procesar el inicio de sesión");
				this.logout();
				return { success: false, error: error.message };
			}
		}

		return { success: true, processed: false };
	}

	// Inicializar el store
	async init() {
		const googleResult = await this.handleGoogleToken();

		if (googleResult.success && googleResult.processed) {
			console.log(
				"✅ Token de Google procesado, saltando verificación de localStorage",
			);
			return;
		}

		const token = localStorage.getItem("token");

		if (token) {
			try {
				const result = await authService.getMe();

				if (result.success) {
					this.setState({
						token: token,
						user: result.result.data,
						isAuthenticated: true,
					});
				} else {
					console.log("❌ Token inválido, limpiando...");
					this.logout();
				}
			} catch (error) {
				console.error("❌ Error verificando token:", error);
				this.logout();
			}
		} else {
			console.log("ℹ️ No hay token en localStorage");
		}
	}

	// Login
	async login(email, password) {
		console.log(email, password);
		this.setState({ isLoading: true, error: null });
		console.log("set state");

		try {
			const result = await authService.login(email, password);
			console.log(result);

			if (result.success) {
				const token = result.result.extra?.token;
				const userData = result.result.data;

				localStorage.setItem("token", token);

				this.setState({
					user: userData,
					token: token,
					isAuthenticated: true,
					isLoading: false,
				});
				return { success: true, user: userData };
			} else {
				this.setState({
					isLoading: false,
					error: result.message || "Error en el login",
				});
				return { success: false, error: result.message };
			}
		} catch (error) {
			this.setState({
				isLoading: false,
				error: "Error de conexión",
			});
			return { success: false, error: error.message };
		}
	}

	// Logout
	logout() {
		localStorage.removeItem("token");
		localStorage.removeItem("user");

		this.setState({
			user: null,
			token: null,
			isAuthenticated: false,
			error: null,
		});
	}

	// Register
	async register(userData) {
		this.setState({ isLoading: true, error: null });

		try {
			const result = await authService.register(userData);

			if (result.success) {
				const token = result.result.extra?.token;
				const user = result.result.data;

				this.state.user = user;
				this.state.token = token;
				this.state.isAuthenticated = true;

				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(user));

				this.setState({ isLoading: false });
				return { success: true, user };
			} else {
				this.setState({
					isLoading: false,
					error: result.message || "Error en el registro",
				});
				return { success: false, error: result.message };
			}
		} catch (error) {
			this.setState({
				isLoading: false,
				error: "Error de conexión",
			});
			return { success: false, error: error.message };
		}
	}

	// Getters
	getState() {
		return this.state;
	}

	isAuthenticated() {
		return this.state.isAuthenticated;
	}

	getUser() {
		return this.state.user;
	}

	getToken() {
		return this.state.token;
	}

	getError() {
		return this.state.error;
	}

	isLoading() {
		return this.state.isLoading;
	}

	clearError() {
		this.setState({ error: null });
	}
}

export const authStore = new AuthStore();
