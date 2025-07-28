import "./components/HomeComponent.js";
import "./components/LoginComponent.js";
import "./components/RegisterComponent.js";
import "./components/NavbarComponent.js";
import "./components/NotFoundComponent.js";
import "./components/ProfileComponent.js";
import "./components/PanelComponent.js";
import "./components/CalculatorComponent.js";
import "./components/QuotesComponent.js";
import "./components/AddressesComponent.js";
import "./components/CheckoutComponent.js";
import "./components/SuccessPurchaseComponent.js";
import "./components/CancelPurchaseComponent.js";
import "./components/OrdersComponent.js";

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
			"/cancel": "<cancel-purchase-component></cancel-purchase-component>",
			"/orders": "<orders-component></orders-component>", // Órdenes del usuario
		};

		const methods = {
			initRouter() {
				router.setRoot(htmls.app);

				Object.keys(routes).forEach((path) => {
					router.register(path, routes[path]);
				});

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
