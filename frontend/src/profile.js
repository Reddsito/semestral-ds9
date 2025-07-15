import authService from "./auth.js";

class ProfileComponent {
	constructor() {
		this.container = null;
		this.user = null;
	}

	// Crear el HTML del componente
	createHTML() {
		return `
            <div class="profile-container">
                <div class="profile-card">
                    <div class="profile-header">
                        <h2>Perfil de Usuario</h2>
                        <p>Información de tu cuenta</p>
                    </div>

                    <div id="profile-content" class="profile-content">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>Cargando perfil...</p>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button id="logout-btn" class="btn-danger">
                            🚪 Cerrar Sesión
                        </button>
                    </div>

                    <div id="profile-message" class="profile-message" style="display: none;"></div>
                </div>
            </div>
        `;
	}

	// Renderizar el componente
	render(container) {
		this.container = container;
		container.innerHTML = this.createHTML();
		this.bindEvents();
		this.loadProfile();
	}

	// Vincular eventos
	bindEvents() {
		const logoutBtn = document.getElementById("logout-btn");
		logoutBtn.addEventListener("click", () => this.handleLogout());
	}

	// Cargar perfil del usuario
	async loadProfile() {
		this.showLoading(true);
		this.hideMessage();

		try {
			// Verificar si está autenticado
			if (!authService.isAuthenticated()) {
				this.showNotAuthenticated();
				return;
			}

			// Obtener perfil del servidor
			const result = await authService.getProfile();

			if (result.success) {
				this.user = result.result.data;
				this.showProfile();
			} else {
				this.showError("Error al cargar perfil: " + result.message);
			}
		} catch (error) {
			this.showError("Error de conexión");
		} finally {
			this.showLoading(false);
		}
	}

	// Manejar logout
	async handleLogout() {
		try {
			await authService.logout();
			this.showMessage("Sesión cerrada exitosamente", "success");
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);
		} catch (error) {
			this.showMessage("Error al cerrar sesión", "error");
		}
	}

	// Mostrar perfil del usuario
	showProfile() {
		const content = document.getElementById("profile-content");
		const isGoogleUser = authService.isGoogleUser();
		const authProvider = authService.getAuthProvider();

		content.innerHTML = `
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="${
											this.user.avatar || "https://via.placeholder.com/100"
										}" 
                         alt="Avatar" 
                         onerror="this.src='https://via.placeholder.com/100'">
                </div>
                
                <div class="profile-details">
                    <h3>${this.user.firstName} ${this.user.lastName}</h3>
                    <p class="profile-email">📧 ${this.user.email}</p>
                    <p class="profile-role">👤 Rol: ${this.user.role}</p>
                    <p class="profile-id">🆔 ID: ${this.user.id}</p>
                    <p class="profile-provider">🔐 Autenticado con: ${authProvider}</p>
                    ${
											this.user.lastLogin
												? `<p class="profile-last-login">🕒 Último login: ${new Date(
														this.user.lastLogin,
												  ).toLocaleString()}</p>`
												: ""
										}
                    ${
											isGoogleUser
												? `<p class="profile-google-info">✅ Cuenta vinculada con Google</p>`
												: ""
										}
                </div>
            </div>
        `;
	}

	// Mostrar estado no autenticado
	showNotAuthenticated() {
		const content = document.getElementById("profile-content");

		content.innerHTML = `
            <div class="not-authenticated">
                <div class="auth-icon">🔒</div>
                <h3>No autenticado</h3>
                <p>Debes iniciar sesión para ver tu perfil</p>
                <a href="/login.html" class="btn-primary">Iniciar Sesión</a>
            </div>
        `;
	}

	// Mostrar error
	showError(message) {
		const content = document.getElementById("profile-content");

		content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-secondary">Reintentar</button>
            </div>
        `;
	}

	// Mostrar loading
	showLoading(show) {
		const content = document.getElementById("profile-content");

		if (show) {
			content.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Cargando perfil...</p>
                </div>
            `;
		}
	}

	// Mostrar mensaje
	showMessage(message, type) {
		const messageEl = document.getElementById("profile-message");
		messageEl.textContent = message;
		messageEl.className = `profile-message profile-message--${type}`;
		messageEl.style.display = "block";
	}

	// Ocultar mensaje
	hideMessage() {
		const messageEl = document.getElementById("profile-message");
		messageEl.style.display = "none";
	}
}

// Inicializar el componente cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("profile-container");
	if (container) {
		const profileComponent = new ProfileComponent();
		profileComponent.render(container);

		// Verificar si hay datos de OAuth en la URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");
		const userParam = urlParams.get("user");

		if (token && userParam) {
			try {
				const userData = JSON.parse(decodeURIComponent(userParam));

				// Procesar el callback de Google
				const result = authService.processGoogleCallback(token, userData);

				if (result.success) {
					// Limpiar la URL
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname,
					);

					// Recargar la página para mostrar el estado autenticado
					window.location.reload();
				} else {
					console.error("Error procesando callback:", result.message);
				}
			} catch (error) {
				console.error("Error procesando datos de OAuth:", error);
			}
		}
	}
});
