import { Api } from "./api.js";

(() => {
	const ProfileComponent = () => {
		const htmls = {
			container: document.getElementById("profile-container"),
			profileCard: null,
			loadingDiv: null,
		};

		const state = {
			user: null,
			isLoading: true,
			error: null,
			isAuthenticated: false,
		};

		const methods = {
			ui: {
				createProfileCard: () => {
					const card = document.createElement("div");
					card.className = "profile-card";

					const header = document.createElement("div");
					header.className = "profile-header";

					const title = document.createElement("h2");
					title.textContent = "👤 Mi Perfil";
					title.className = "profile-title";

					const content = document.createElement("div");
					content.className = "profile-content";
					content.id = "profile-content";

					header.appendChild(title);
					card.appendChild(header);
					card.appendChild(content);

					return card;
				},

				createLoadingDiv: () => {
					const loadingDiv = document.createElement("div");
					loadingDiv.className = "profile-loading";
					loadingDiv.innerHTML = `
						<div class="spinner"></div>
						<p>Cargando perfil...</p>
					`;
					return loadingDiv;
				},

				showUserProfile: () => {
					const content = document.getElementById("profile-content");
					if (!content || !state.user) return;

					content.innerHTML = `
						<div class="profile-info">
							<div class="profile-avatar">
								<img src="${state.user.avatar || "/default-avatar.png"}" 
									 alt="Avatar" 
									 onerror="this.src='/default-avatar.png'">
							</div>
							<div class="profile-details">
								<div class="profile-field">
									<label>Nombre completo:</label>
									<span>${state.user.firstName} ${state.user.lastName}</span>
								</div>
								<div class="profile-field">
									<label>Email:</label>
									<span>${state.user.email}</span>
								</div>
								<div class="profile-field">
									<label>Rol:</label>
									<span class="role-badge">${state.user.role}</span>
								</div>
								<div class="profile-field">
									<label>ID de usuario:</label>
									<span class="user-id">${state.user.id}</span>
								</div>
							</div>
						</div>
						<div class="profile-actions">
							${methods.ui.createActionButtons()}
						</div>
					`;
				},

				createActionButtons: () => {
					return `
						<button class="btn-secondary" onclick="methods.handlers.handleEditProfile()">
							✏️ Editar Perfil
						</button>
						<button class="btn-danger" onclick="methods.handlers.handleDeleteAccount()">
							🗑️ Eliminar Cuenta
						</button>
					`;
				},

				showNotAuthenticated: () => {
					const content = document.getElementById("profile-content");
					if (!content) return;

					content.innerHTML = `
						<div class="profile-error">
							<div class="error-icon">🔒</div>
							<h3>Acceso Denegado</h3>
							<p>Debes iniciar sesión para ver tu perfil.</p>
							<div class="error-actions">
								<button class="btn-primary" onclick="methods.handlers.handleNavigate('/login.html')">
									🔑 Iniciar Sesión
								</button>
								<button class="btn-secondary" onclick="methods.handlers.handleNavigate('/register.html')">
									📝 Registrarse
								</button>
							</div>
						</div>
					`;
				},

				showError: (message) => {
					const content = document.getElementById("profile-content");
					if (!content) return;

					content.innerHTML = `
						<div class="profile-error">
							<div class="error-icon">❌</div>
							<h3>Error</h3>
							<p>${message}</p>
							<div class="error-actions">
								<button class="btn-primary" onclick="methods.handlers.handleRetry()">
									🔄 Reintentar
								</button>
								<button class="btn-secondary" onclick="methods.handlers.handleNavigate('/')">
									🏠 Volver al Inicio
								</button>
							</div>
						</div>
					`;
				},

				showLoading: () => {
					const content = document.getElementById("profile-content");
					if (!content) return;

					content.innerHTML = `
						<div class="profile-loading">
							<div class="spinner"></div>
							<p>Cargando perfil...</p>
						</div>
					`;
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

					if (!state.isAuthenticated) {
						methods.ui.showNotAuthenticated();
						return;
					}

					if (state.user) {
						methods.ui.showUserProfile();
					}
				},
			},

			handlers: {
				handleNavigate: (path) => {
					window.location.href = path;
				},

				handleRetry: () => {
					state.error = null;
					state.isLoading = true;
					methods.ui.updateContent();
					methods.init();
				},

				handleEditProfile: () => {
					// TODO: Implementar edición de perfil
					alert("Funcionalidad de edición de perfil próximamente");
				},

				handleDeleteAccount: () => {
					if (
						confirm(
							"¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.",
						)
					) {
						// TODO: Implementar eliminación de cuenta
						alert("Funcionalidad de eliminación de cuenta próximamente");
					}
				},

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

				verifyAndLoadProfile: async () => {
					if (!state.isAuthenticated) return false;

					try {
						const api = new Api();
						const result = await api.getProfile();

						if (result.success) {
							state.user = result.result.data;
							return true;
						} else {
							console.error("Error cargando perfil:", result.message);
							if (
								result.message.includes("token") ||
								result.message.includes("autenticación")
							) {
								methods.auth.clearAuth();
								state.error =
									"Sesión expirada. Por favor, inicia sesión nuevamente.";
							} else {
								state.error = result.message;
							}
							return false;
						}
					} catch (error) {
						console.error("Error verificando perfil:", error);
						state.error = "Error de conexión con el servidor";
						return false;
					}
				},
			},

			init: async () => {
				// Crear elementos UI
				htmls.profileCard = methods.ui.createProfileCard();
				htmls.container.appendChild(htmls.profileCard);

				// Manejar callback de OAuth si existe
				const hasOAuthCallback = methods.handlers.handleOAuthCallback();

				if (!hasOAuthCallback) {
					// Verificar autenticación local
					methods.auth.checkAuthStatus();
				}

				// Verificar y cargar perfil del servidor
				if (state.isAuthenticated) {
					await methods.auth.verifyAndLoadProfile();
				}

				// Finalizar carga
				state.isLoading = false;
				methods.ui.updateContent();

				// Hacer accesibles los handlers globalmente para los botones
				window.methods = methods;
			},
		};

		return {
			init: methods.init,
		};
	};

	ProfileComponent().init();
})();
