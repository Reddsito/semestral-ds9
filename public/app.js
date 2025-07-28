import "./components/index.js";

// Importar servicios
import "./lib/api.js";
import "./services/authService.js";
import "./services/quotesService.js";

import { router } from "./services/router.js";
import { authStore } from "./stores/authStore.js";
import { routeGuard } from "./middlewares/guardMiddleware.js";
import { roleGuard } from "./middlewares/roleMiddelware.js";

(() => {
	const App = () => {
		const htmls = {
			app: document.getElementById("app"),
			navLinks: document.querySelectorAll(".nav-link"),
		};

		const routes = {
			"/": "<home-component></home-component>", // Página de inicio
			"/login": "<login-component></login-component>",
			"/register": "<register-component></register-component>",
			"/profile": "<profile-component></profile-component>", // Perfil del usuario
			"/profile/addresses": "<addresses-component></addresses-component>", // Direcciones del usuario
			"/panel": "<panel-component></panel-component>", // Panel de administración
			"/calculator": "<calculator-component></calculator-component>",
			"/quotes": "<quotes-component></quotes-component>", // Cotizaciones del usuario
			"/checkout": "<checkout-component></checkout-component>", // Proceso de checkout
			"/success": "<success-purchase-component></success-purchase-component>",
			"/orders": "<orders-component></orders-component>",
			"/cancel": "<cancel-purchase-component></cancel-purchase-component>",
		};

		const methods = {
			initRouter() {
				router.setRoot(htmls.app);

				// Registrar rutas estáticas
				Object.keys(routes).forEach((path) => {
					router.register(path, routes[path]);
				});

				// Registrar ruta dinámica para detalles de orden
				router.register(
					"/orders/:id",
					"<order-detail-component></order-detail-component>",
				);

				router.init();
			},

			async init() {
				await authStore.init();
				routeGuard.init();
				roleGuard.init();
				methods.initRouter();
			},
		};

		return {
			init: methods.init,
		};
	};

	App().init();
})();
