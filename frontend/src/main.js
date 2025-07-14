import "./style.css";
import authService from "./auth.js";

class App {
	constructor() {
		this.init();
	}

	async init() {
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
					authStatus.innerHTML = `
                        <div class="status-success">
                            <div class="status-icon">✅</div>
                            <div class="status-content">
                                <h4>Autenticado</h4>
                                <p>Token válido - Sesión activa</p>
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
