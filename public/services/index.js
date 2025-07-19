// Exportar todos los stores desde un solo lugar
export { authStore } from "../stores/authStore.js";
export { productStore } from "./productStore.js";

// También puedes exportar funciones de utilidad para los stores
export const storeUtils = {
	// Función para inicializar todos los stores
	initAllStores() {
		// Importar dinámicamente para evitar dependencias circulares
		import("../stores/authStore.js").then(({ authStore }) => {
			authStore.init();
		});
	},

	// Función para limpiar todos los stores
	clearAllStores() {
		import("../stores/authStore.js").then(({ authStore }) => {
			authStore.logout();
		});

		import("./productStore.js").then(({ productStore }) => {
			productStore.setState({
				products: [],
				selectedProduct: null,
				error: null,
			});
		});
	},

	// Función para obtener el estado de todos los stores
	getAllStoresState() {
		return new Promise(async (resolve) => {
			const { authStore } = await import("../stores/authStore.js");
			const { productStore } = await import("./productStore.js");

			resolve({
				auth: authStore.getState(),
				products: productStore.getState(),
			});
		});
	},
};
