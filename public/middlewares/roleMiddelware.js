import { authStore } from "../stores/authStore.js";
import { router } from "../services/router.js";

class RoleMiddleware {
	constructor() {
		this.isRedirecting = false;
	}

	// Middleware principal que se ejecuta en el router
	middleware(path, route) {
		if (this.isRedirecting) {
			return true;
		}

		console.log(authStore.getUser());

		const role = authStore.getUser()?.role;
		const isAdmin = role === "admin";

		// Redirigir admin de / a /panel
		if (isAdmin && path === "/") {
			this.isRedirecting = true;
			router.navigate("/panel", true);
			return false;
		}

		// Verificar acceso al panel de admin
		if (!isAdmin && path.includes("/panel")) {
			this.isRedirecting = true;
			router.navigate("/", true);
			return false;
		}

		return true;
	}

	// Resetear la bandera de redirección después de que se complete
	resetRedirecting() {
		this.isRedirecting = false;
	}

	// Inicializar el guard (ahora solo registra el middleware)
	init() {
		const middlewareFunction = (path, route) => this.middleware(path, route);
		middlewareFunction.resetRedirecting = () => this.resetRedirecting();

		router.addMiddleware(middlewareFunction);
	}

	destroy() {
		if (this.authUnsubscribe) {
			this.authUnsubscribe();
		}
	}
}

export const roleGuard = new RoleMiddleware();
