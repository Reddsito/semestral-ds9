class RouteStore {
	constructor() {
		this.state = {
			currentPath: "/",
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
		this.listeners.forEach((listener) => listener(this.state));
	}

	// Actualizar estado
	setState(newState) {
		this.state = { ...this.state, ...newState };
		this.notify();
	}

	// Normalizar ruta (convertir /inicio a /)
	normalizePath(path) {
		if (path === "/inicio") {
			return "/";
		}
		return path;
	}

	// Actualizar ruta actual
	setCurrentPath(path) {
		const normalizedPath = this.normalizePath(path);
		this.setState({ currentPath: normalizedPath });
	}

	// Obtener ruta actual
	getCurrentPath() {
		return this.state.currentPath;
	}

	// Obtener estado completo
	getState() {
		return { ...this.state };
	}
}

export const routeStore = new RouteStore();
