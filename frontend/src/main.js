import "./style.css";
import authService from "./auth.js";

class App {
	constructor() {
		this.init();
	}

	async init() {
		// Verificar si hay datos de OAuth en la URL
		await this.handleOAuthCallback();

		this.updateNavigation();
		this.bindEvents();
		await this.checkAuthStatus();
	}

	updateNavigation() {
		const loginLink = document.getElementById("login-link");
		const profileLink = document.getElementById("profile-link");
		const logoutBtn = document.getElementById("logout-btn");
		const profileAction = document.getElementById("profile-action");

		if (authService.isAuthenticated()) {
			loginLink.style.display = "none";
			profileLink.style.display = "inline-block";
			logoutBtn.style.display = "inline-block";
			profileAction.style.display = "inline-block";
		} else {
			loginLink.style.display = "inline-block";
			profileLink.style.display = "none";
			logoutBtn.style.display = "none";
			profileAction.style.display = "none";
		}
	}

	bindEvents() {
		const logoutBtn = document.getElementById("logout-btn");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", () => this.handleLogout());
		}
	}

	async checkAuthStatus() {
		const authStatus = document.getElementById("auth-status");

		if (!authStatus) return;

		try {
			if (authService.isAuthenticated()) {
				const result = await authService.verifyToken();

				if (result.success) {
					const user = authService.getUser();
					const authProvider = authService.getAuthProvider();

					authStatus.innerHTML = `
                        <div class="status-success">
                            <div class="status-icon">✅</div>
                            <div class="status-content">
                                <h4>¡Hola, ${user.firstName}!</h4>
                                <p>Autenticado con ${authProvider}</p>
                                <p class="user-email">📧 ${user.email}</p>
                                <p class="user-role">👤 Rol: ${user.role}</p>
                            </div>
                        </div>
                    `;
				} else {
					authService.clearAuth();
					this.showNotAuthenticated();
				}
			} else {
				this.showNotAuthenticated();
			}
		} catch (error) {
			console.error("Error verificando autenticación:", error);
			this.showNotAuthenticated();
		}
	}

	showNotAuthenticated() {
		const authStatus = document.getElementById("auth-status");
		if (authStatus) {
			authStatus.innerHTML = `
                <div class="status-info">
                    <div class="status-icon">ℹ️</div>
                    <div class="status-content">
                        <h4>No autenticado</h4>
                        <p>Inicia sesión para acceder a tu perfil</p>
                    </div>
                </div>
            `;
		}
		this.updateNavigation();
	}

	async handleOAuthCallback() {
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

					// Mostrar mensaje de éxito
					this.showOAuthSuccess(userData);
				} else {
					console.error("Error procesando callback:", result.message);
					this.showOAuthError(result.message);
				}
			} catch (error) {
				console.error("Error procesando datos de OAuth:", error);
				this.showOAuthError("Error procesando autenticación");
			}
		}
	}

	showOAuthSuccess(userData) {
		const authStatus = document.getElementById("auth-status");
		if (authStatus) {
			authStatus.innerHTML = `
				<div class="status-success">
					<div class="status-icon">✅</div>
					<div class="status-content">
						<h4>¡Bienvenido, ${userData.firstName}!</h4>
						<p>Autenticación con Google exitosa</p>
						<p class="user-email">📧 ${userData.email}</p>
					</div>
				</div>
			`;
		}
	}

	showOAuthError(message) {
		const authStatus = document.getElementById("auth-status");
		if (authStatus) {
			authStatus.innerHTML = `
				<div class="status-error">
					<div class="status-icon">❌</div>
					<div class="status-content">
						<h4>Error de autenticación</h4>
						<p>${message}</p>
					</div>
				</div>
			`;
		}
	}

	async handleLogout() {
		try {
			await authService.logout();
			this.updateNavigation();
			this.showNotAuthenticated();

			// Redirigir a la página principal
			window.location.href = "/";
		} catch (error) {
			console.error("Error en logout:", error);
		}
	}
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
	new App();
});
