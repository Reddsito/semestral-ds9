import { authStore } from "../stores/authStore.js";
import { router } from "../services/router.js";

class GuardMiddleware {
	constructor() {
		this.protectedRoutes = [
			"/dashboard",
			"/profile",
			"/panel",
			"/calculator",
			"/quotes",
			"/checkout",
		];
		this.publicOnlyRoutes = ["/login", "/register"];
		this.isRedirecting = false;
	}

	// Middleware principal que se ejecuta en el router
	middleware(path, route) {
		if (this.isRedirecting) {
			return true;
		}

		const isAuthenticated = authStore.isAuthenticated();

		if (isAuthenticated && this.publicOnlyRoutes.includes(path)) {
			this.isRedirecting = true;
			router.navigate("/", true);
			return false;
		}

		if (!isAuthenticated && this.requiresAuth(path)) {
			this.isRedirecting = true;
			router.navigate("/login", true);
			return false;
		}

		return true;
	}

	// Verificar si una ruta requiere autenticación
	requiresAuth(path) {
		return this.protectedRoutes.includes(path) || path.includes("/profile");
	}

	// Verificar si una ruta es solo para usuarios no autenticados
	isPublicOnly(path) {
		return this.publicOnlyRoutes.includes(path);
	}

	// Verificar si el usuario puede acceder a una ruta
	canAccess(path) {
		const isAuthenticated = authStore.isAuthenticated();

		if (this.requiresAuth(path)) {
			return isAuthenticated;
		}

		if (this.isPublicOnly(path)) {
			return !isAuthenticated;
		}

		return true;
	}

	// Resetear la bandera de redirección después de que se complete
	resetRedirecting() {
		this.isRedirecting = false;
	}

	// Inicializar el guard (ahora solo registra el middleware)
	init() {
		console.log("🔒 GuardMiddleware: Inicializando...");
		const middlewareFunction = (path, route) => {
			console.log(`🔒 GuardMiddleware: Ejecutando para path: ${path}`);
			return this.middleware(path, route);
		};
		middlewareFunction.resetRedirecting = () => this.resetRedirecting();

		router.addMiddleware(middlewareFunction);
		console.log("🔒 GuardMiddleware: Registrado en router");

		// this.authUnsubscribe = authStore.subscribe((state) => {
		// 	if (
		// 		!state.isAuthenticated &&
		// 		this.protectedRoutes.includes(router.getCurrentRoute())
		// 	) {
		// 		this.isRedirecting = true;
		// 		router.navigate("/login", true);
		// 	}
		// });
	}

	destroy() {
		if (this.authUnsubscribe) {
			this.authUnsubscribe();
		}
	}
}

export const routeGuard = new GuardMiddleware();
