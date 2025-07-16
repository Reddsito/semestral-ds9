import { Api } from "./api.js";

(() => {
	const NavbarComponent = () => {
		const htmls = {
			header: null,
			navbar: null,
		};

		const state = {
			isAuthenticated: false,
			user: null,
			currentPage: window.location.pathname,
		};

		const methods = {
			ui: {
				createNavbar: () => {
					const header = document.createElement("header");
					header.className = "app-header";

					const headerContent = document.createElement("div");
					headerContent.className = "header-content";

					const title = document.createElement("h1");
					title.textContent = "🔐 PrintForge";

					const nav = document.createElement("nav");
					nav.className = "nav-menu";

					headerContent.appendChild(title);
					headerContent.appendChild(nav);
					header.appendChild(headerContent);

					return { header, nav };
				},

				createNavLink: (href, text, isActive = false) => {
					const link = document.createElement("a");
					link.href = href;
					link.textContent = text;
					link.className = `nav-link ${isActive ? "active" : ""}`;
					return link;
				},

				createNavButton: (text, className, onClick) => {
					const button = document.createElement("button");
					button.textContent = text;
					button.className = `nav-btn ${className}`;
					button.addEventListener("click", onClick);
					return button;
				},

				renderUnauthenticatedNav: () => {
					htmls.navbar.innerHTML = "";

					const homeLink = methods.ui.createNavLink(
						"/",
						"🏠 Home",
						state.currentPage === "/" || state.currentPage === "/index.html",
					);

					const loginLink = methods.ui.createNavLink(
						"/login.html",
						"🔑 Iniciar Sesión",
						state.currentPage === "/login.html",
					);

					const registerLink = methods.ui.createNavLink(
						"/register.html",
						"📝 Registrarse",
						state.currentPage === "/register.html",
					);

					htmls.navbar.appendChild(homeLink);
					htmls.navbar.appendChild(loginLink);
					htmls.navbar.appendChild(registerLink);
				},

				renderAuthenticatedNav: () => {
					htmls.navbar.innerHTML = "";

					const homeLink = methods.ui.createNavLink(
						"/",
						"🏠 Home",
						state.currentPage === "/" || state.currentPage === "/index.html",
					);

					const userGreeting = document.createElement("span");
					userGreeting.textContent = `👋 Hola, ${state.user.firstName}`;
					userGreeting.className = "nav-greeting";

					const profileLink = methods.ui.createNavLink(
						"/profile.html",
						"👤 Perfil",
						state.currentPage === "/profile.html",
					);

					const logoutBtn = methods.ui.createNavButton(
						"🚪 Cerrar Sesión",
						"logout-btn",
						methods.handlers.handleLogout,
					);

					htmls.navbar.appendChild(homeLink);
					htmls.navbar.appendChild(userGreeting);
					htmls.navbar.appendChild(profileLink);
					htmls.navbar.appendChild(logoutBtn);
				},

				updateNavbar: () => {
					if (state.isAuthenticated && state.user) {
						methods.ui.renderAuthenticatedNav();
					} else {
						methods.ui.renderUnauthenticatedNav();
					}
				},
			},

			handlers: {
				handleLogout: async () => {
					try {
						const api = new Api();
						await api.logout();

						// Limpiar localStorage
						localStorage.removeItem("auth_token");
						localStorage.removeItem("auth_user");

						// Actualizar estado
						state.isAuthenticated = false;
						state.user = null;

						// Redirigir a home
						window.location.href = "/";
					} catch (error) {
						console.error("Error en logout:", error);
						// Limpiar localStorage incluso si hay error
						localStorage.removeItem("auth_token");
						localStorage.removeItem("auth_user");
						window.location.href = "/";
					}
				},
			},

			auth: {
				checkAuthStatus: () => {
					const token = localStorage.getItem("auth_token");
					const userData = localStorage.getItem("auth_user");

					if (token && userData) {
						try {
							state.user = JSON.parse(userData);
							state.isAuthenticated = true;
							return true;
						} catch (error) {
							console.error("Error parsing user data:", error);
							methods.auth.clearAuth();
							return false;
						}
					}

					return false;
				},

				clearAuth: () => {
					localStorage.removeItem("auth_token");
					localStorage.removeItem("auth_user");
					state.isAuthenticated = false;
					state.user = null;
				},

				preventAuthRoutes: () => {
					const authRoutes = ["/login.html", "/register.html"];
					const currentPath = window.location.pathname;

					if (state.isAuthenticated && authRoutes.includes(currentPath)) {
						window.location.href = "/";
					}
				},
			},

			init: () => {
				// Verificar autenticación
				methods.auth.checkAuthStatus();

				// Prevenir acceso a rutas de auth si ya está autenticado
				methods.auth.preventAuthRoutes();

				// Crear navbar
				const navbarElements = methods.ui.createNavbar();
				htmls.header = navbarElements.header;
				htmls.navbar = navbarElements.nav;

				// Insertar en el DOM
				const app = document.getElementById("app");
				if (app) {
					app.insertBefore(htmls.header, app.firstChild);
				}

				// Actualizar navbar según estado de auth
				methods.ui.updateNavbar();
			},
		};

		return {
			init: methods.init,
			updateAuth: () => {
				methods.auth.checkAuthStatus();
				methods.ui.updateNavbar();
			},
		};
	};

	// Inicializar cuando el DOM esté listo
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			window.navbar = NavbarComponent();
			window.navbar.init();
		});
	} else {
		window.navbar = NavbarComponent();
		window.navbar.init();
	}
})();
