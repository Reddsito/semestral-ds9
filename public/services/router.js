import { routeStore } from "../stores/routeStore.js";

class Router {
	constructor() {
		this.routes = new Map();
		this.currentRoute = null;
		this.rootElement = null;
		this.middleware = [];

		window.addEventListener("popstate", (e) => {
			this.navigate(window.location.pathname, false);
		});
	}

	// Configurar el elemento raíz donde se renderizará el contenido
	setRoot(element) {
		this.rootElement = element;
	}

	// Registrar una ruta
	register(path, component, options = {}) {
		this.routes.set(path, {
			component,
			options,
			middleware: options.middleware || [],
		});
	}

	// Agregar middleware global
	addMiddleware(middleware) {
		this.middleware.push(middleware);
	}

	// Navegar a una ruta
	navigate(path, updateHistory = true) {
		const normalizedPath = path === "/inicio" ? "/" : path;

		// Buscar ruta exacta primero
		let route = this.routes.get(normalizedPath);

		// Si no se encuentra, buscar rutas dinámicas
		if (!route) {
			route = this.findDynamicRoute(normalizedPath);
		}

		if (!route) {
			this.show404(updateHistory);
			return;
		}

		for (const middleware of this.middleware) {
			const result = middleware(normalizedPath, route);
			if (result === false) {
				return;
			}
		}

		for (const middleware of route.middleware) {
			const result = middleware(normalizedPath, route);
			if (result === false) {
				return;
			}
		}

		routeStore.setCurrentPath(normalizedPath);

		if (updateHistory) {
			window.history.pushState({ path: normalizedPath }, "", normalizedPath);
		}

		this.renderRoute(normalizedPath, route);
		this.currentRoute = normalizedPath;

		this.resetRedirectingFlags();
	}

	// Buscar rutas dinámicas
	findDynamicRoute(path) {
		for (const [pattern, route] of this.routes) {
			if (this.matchRoute(pattern, path)) {
				// Guardar los parámetros de la ruta para uso posterior
				route.params = this.getRouteParams(pattern, path);
				return route;
			}
		}
		return null;
	}

	// Renderizar la ruta
	async renderRoute(path, route) {
		if (!this.rootElement) {
			console.error("Router: No se ha configurado el elemento raíz");
			return;
		}

		try {
			this.rootElement.innerHTML = '<div class="loading">Cargando...</div>';

			if (typeof route.component === "function") {
				const component = await route.component();
				this.rootElement.innerHTML = component;
			} else {
				this.rootElement.innerHTML = route.component;
			}

			// Disparar evento con parámetros si existen
			window.dispatchEvent(
				new CustomEvent("routeChange", {
					detail: { path, route, params: route.params || {} },
				}),
			);
		} catch (error) {
			console.error("❌ Error renderizando ruta:", error);
			this.rootElement.innerHTML =
				'<div class="error">Error cargando la página</div>';
		}
	}

	// Inicializar el router
	init() {
		const currentPath = window.location.pathname;
		const normalizedPath = currentPath === "/inicio" ? "/" : currentPath;
		routeStore.setCurrentPath(normalizedPath);
		this.navigate(normalizedPath, false);
	}

	// Obtener parámetros de la URL
	getParams() {
		const urlParams = new URLSearchParams(window.location.search);
		const params = {};
		for (const [key, value] of urlParams) {
			params[key] = value;
		}
		return params;
	}

	// Obtener parámetros dinámicos de la ruta
	getRouteParams(pattern, path) {
		const params = {};
		const patternParts = pattern.split("/");
		const pathParts = path.split("/");

		for (let i = 0; i < patternParts.length; i++) {
			if (patternParts[i].startsWith(":")) {
				const paramName = patternParts[i].substring(1);
				params[paramName] = pathParts[i];
			}
		}

		return params;
	}

	// Verificar si una ruta coincide con un patrón
	matchRoute(pattern, path) {
		const patternParts = pattern.split("/");
		const pathParts = path.split("/");

		if (patternParts.length !== pathParts.length) {
			return false;
		}

		for (let i = 0; i < patternParts.length; i++) {
			if (
				!patternParts[i].startsWith(":") &&
				patternParts[i] !== pathParts[i]
			) {
				return false;
			}
		}

		return true;
	}

	// Obtener la ruta actual
	getCurrentRoute() {
		return this.currentRoute;
	}

	// Verificar si estamos en una ruta específica
	isCurrentRoute(path) {
		return this.currentRoute === path;
	}

	// Mostrar página 404
	show404(updateHistory = true) {
		if (!this.rootElement) {
			console.error("Router: No se ha configurado el elemento raíz");
			return;
		}

		if (updateHistory) {
			window.history.pushState({ path: "/404" }, "", "/404");
		}

		this.rootElement.innerHTML = "<not-found-component></not-found-component>";
		this.currentRoute = "/404";
	}

	// Resetear banderas de redirección en todos los middlewares
	resetRedirectingFlags() {
		for (const middleware of this.middleware) {
			if (
				middleware.resetRedirecting &&
				typeof middleware.resetRedirecting === "function"
			) {
				middleware.resetRedirecting();
			}
		}
	}
}

export const router = new Router();

export const navigate = (path) => router.navigate(path);
export const getParams = () => router.getParams();
export const getCurrentRoute = () => router.getCurrentRoute();
export const isCurrentRoute = (path) => router.isCurrentRoute(path);
