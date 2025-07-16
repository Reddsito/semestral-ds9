import { Api } from "./api.js";

(() => {
	const HomeComponent = () => {
		const htmls = {
			mainContent: document.querySelector(".main-content"),
			heroSection: null,
			featuresSection: null,
			footer: null,
		};

		const state = {
			isAuthenticated: false,
			user: null,
			isLoading: true,
			error: null,
		};

		const methods = {
			ui: {
				createHeroSection: () => {
					const section = document.createElement("section");
					section.className = "hero-section";

					const container = document.createElement("div");
					container.className = "hero-container";

					const title = document.createElement("h1");
					title.className = "hero-title";
					title.innerHTML = `
						<span class="hero-title-main">Impresión 3D</span>
						<span class="hero-title-accent">Profesional</span>
					`;

					const subtitle = document.createElement("p");
					subtitle.className = "hero-subtitle";
					subtitle.textContent =
						"Convierte tus ideas en realidad con nuestra plataforma de impresión 3D de alta calidad. Desde prototipos hasta producción final.";

					const ctaButton = document.createElement("button");
					ctaButton.className = "hero-cta";
					ctaButton.innerHTML = "🖨️ Comenzar Ahora";
					ctaButton.addEventListener("click", () => {
						window.location.href = "/register.html";
					});

					container.appendChild(title);
					container.appendChild(subtitle);
					container.appendChild(ctaButton);
					section.appendChild(container);

					return section;
				},

				createFeaturesSection: () => {
					const section = document.createElement("section");
					section.className = "features-section";

					const container = document.createElement("div");
					container.className = "features-container";

					const features = [
						{
							icon: "📤",
							title: "Sube tu Modelo",
							description:
								"Carga archivos STL/OBJ y configura materiales y acabados con vista previa 3D interactiva.",
						},
						{
							icon: "📊",
							title: "Seguimiento en Vivo",
							description:
								"Monitorea el progreso de tu pedido desde la revisión técnica hasta la entrega.",
						},
						{
							icon: "✅",
							title: "Calidad Garantizada",
							description:
								"Revisión técnica profesional y control de calidad en cada etapa del proceso.",
						},
					];

					features.forEach((feature) => {
						const card = document.createElement("div");
						card.className = "feature-card";

						const icon = document.createElement("div");
						icon.className = "feature-icon";
						icon.textContent = feature.icon;

						const title = document.createElement("h3");
						title.className = "feature-title";
						title.textContent = feature.title;

						const description = document.createElement("p");
						description.className = "feature-description";
						description.textContent = feature.description;

						card.appendChild(icon);
						card.appendChild(title);
						card.appendChild(description);
						container.appendChild(card);
					});

					section.appendChild(container);
					return section;
				},

				createFooter: () => {
					const footer = document.createElement("footer");
					footer.className = "site-footer";

					const container = document.createElement("div");
					container.className = "footer-container";

					const logo = document.createElement("div");
					logo.className = "footer-logo";
					logo.innerHTML = `
						<span class="footer-logo-icon">3D</span>
						<span class="footer-logo-text">PrintForge</span>
					`;

					const tagline = document.createElement("p");
					tagline.className = "footer-tagline";
					tagline.textContent =
						"Transformando ideas en realidad a través de la impresión 3D profesional";

					const copyright = document.createElement("p");
					copyright.className = "footer-copyright";
					copyright.textContent =
						"© 2024 PrintForge. Todos los derechos reservados.";

					container.appendChild(logo);
					container.appendChild(tagline);
					container.appendChild(copyright);
					footer.appendChild(container);

					return footer;
				},

				createAuthenticatedContent: () => {
					const container = document.createElement("div");
					container.className = "authenticated-content";

					const welcomeCard = document.createElement("div");
					welcomeCard.className = "welcome-card";

					const title = document.createElement("h1");
					title.className = "welcome-title";
					title.textContent = `¡Bienvenido, ${state.user.firstName}!`;

					const subtitle = document.createElement("p");
					subtitle.className = "welcome-subtitle";
					subtitle.textContent = "Tu plataforma de servicios de impresión 3D";

					const actionsContainer = document.createElement("div");
					actionsContainer.className = "welcome-actions";

					const profileBtn = document.createElement("button");
					profileBtn.className = "btn-primary";
					profileBtn.textContent = "👤 Ver Perfil";
					profileBtn.addEventListener("click", () => {
						window.location.href = "/profile.html";
					});

					const servicesBtn = document.createElement("button");
					servicesBtn.className = "btn-secondary";
					servicesBtn.textContent = "🖨️ Servicios";
					servicesBtn.addEventListener("click", () => {
						// TODO: Implementar página de servicios
						alert("Página de servicios próximamente");
					});

					actionsContainer.appendChild(profileBtn);
					actionsContainer.appendChild(servicesBtn);

					welcomeCard.appendChild(title);
					welcomeCard.appendChild(subtitle);
					welcomeCard.appendChild(actionsContainer);
					container.appendChild(welcomeCard);

					return container;
				},

				showLoading: () => {
					htmls.mainContent.innerHTML = `
						<div class="loading-container">
							<div class="spinner"></div>
							<p>Cargando...</p>
						</div>
					`;
				},

				showError: (message) => {
					htmls.mainContent.innerHTML = `
						<div class="error-container">
							<div class="error-icon">❌</div>
							<h3>Error</h3>
							<p>${message}</p>
						</div>
					`;
				},

				renderUnauthenticatedHome: () => {
					htmls.mainContent.innerHTML = "";

					htmls.heroSection = methods.ui.createHeroSection();
					htmls.featuresSection = methods.ui.createFeaturesSection();
					htmls.footer = methods.ui.createFooter();

					htmls.mainContent.appendChild(htmls.heroSection);
					htmls.mainContent.appendChild(htmls.featuresSection);
					htmls.mainContent.appendChild(htmls.footer);
				},

				renderAuthenticatedHome: () => {
					htmls.mainContent.innerHTML = "";
					const content = methods.ui.createAuthenticatedContent();
					htmls.footer = methods.ui.createFooter();

					htmls.mainContent.appendChild(content);
					htmls.mainContent.appendChild(htmls.footer);
				},

				updateContent: () => {
					if (state.isLoading) {
						methods.ui.showLoading();
						return;
					}

					if (state.error) {
						methods.ui.showError(state.error);
						return;
					}

					if (state.isAuthenticated) {
						methods.ui.renderAuthenticatedHome();
					} else {
						methods.ui.renderUnauthenticatedHome();
					}
				},
			},

			handlers: {
				handleOAuthCallback: () => {
					const urlParams = new URLSearchParams(window.location.search);
					const token = urlParams.get("token");
					const userParam = urlParams.get("user");

					if (token && userParam) {
						try {
							const userData = JSON.parse(decodeURIComponent(userParam));

							// Guardar en localStorage
							localStorage.setItem("auth_token", token);
							localStorage.setItem("auth_user", JSON.stringify(userData));

							// Actualizar estado
							state.user = userData;
							state.isAuthenticated = true;

							// Limpiar URL
							window.history.replaceState(
								{},
								document.title,
								window.location.pathname,
							);

							// Actualizar navbar si existe
							if (window.navbar) {
								window.navbar.updateAuth();
							}

							// Actualizar contenido
							methods.ui.updateContent();

							return true;
						} catch (error) {
							console.error("Error procesando callback de OAuth:", error);
							state.error = "Error procesando autenticación";
							return false;
						}
					}

					return false;
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

				verifyToken: async () => {
					if (!state.isAuthenticated) return false;

					try {
						const api = new Api();
						const result = await api.verifyToken();

						if (!result.success) {
							methods.auth.clearAuth();
							return false;
						}

						return true;
					} catch (error) {
						console.error("Error verificando token:", error);
						methods.auth.clearAuth();
						return false;
					}
				},
			},

			init: async () => {
				// Manejar callback de OAuth si existe
				const hasOAuthCallback = methods.handlers.handleOAuthCallback();

				if (!hasOAuthCallback) {
					// Verificar autenticación local
					methods.auth.checkAuthStatus();

					// Verificar token en servidor si está autenticado
					if (state.isAuthenticated) {
						const isValid = await methods.auth.verifyToken();
						if (!isValid) {
							state.isAuthenticated = false;
							state.user = null;
						}
					}
				}

				// Finalizar carga
				state.isLoading = false;
				methods.ui.updateContent();
			},
		};

		return {
			init: methods.init,
		};
	};

	HomeComponent().init();
})();
