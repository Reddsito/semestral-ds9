import "./components/HomeComponent.js";
import "./components/LoginComponent.js";
import "./components/RegisterComponent.js";
import "./components/NavbarComponent.js";
import "./components/NotFoundComponent.js";
import "./components/DashboardComponent.js";
import "./components/PanelComponent.js";
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
			"/": "<home-component></home-component>",
			"/login": "<login-component></login-component>",
			"/register": "<register-component></register-component>",
			"/dashboard": "<dashboard-component></dashboard-component>",
			"/panel": "<panel-component></panel-component>",
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
