import authService from "./auth.js";

class LoginComponent {
	constructor() {
		this.container = null;
		this.currentMode = "login"; // 'login' o 'register'
	}

	// Crear el HTML del componente
	createHTML() {
		return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2 id="auth-title">Iniciar Sesión</h2>
                        <p id="auth-subtitle">Accede a tu cuenta</p>
                    </div>

                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                placeholder="tu@email.com"
                            >
                        </div>

                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required 
                                placeholder="••••••••"
                            >
                        </div>

                        <div id="register-fields" class="register-fields" style="display: none;">
                            <div class="form-group">
                                <label for="firstName">Nombre</label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    placeholder="Tu nombre"
                                >
                            </div>

                            <div class="form-group">
                                <label for="lastName">Apellido</label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    placeholder="Tu apellido"
                                >
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" id="submit-btn" class="btn-primary">
                                Iniciar Sesión
                            </button>
                        </div>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <button type="button" id="google-btn" class="btn-google">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuar con Google
                        </button>

                        <div class="auth-footer">
                            <p id="auth-switch-text">
                                ¿No tienes cuenta? 
                                <a href="#" id="auth-switch-btn">Regístrate</a>
                            </p>
                        </div>
                    </form>

                    <div id="auth-message" class="auth-message" style="display: none;"></div>
                </div>
            </div>
        `;
	}

	// Renderizar el componente
	render(container) {
		this.container = container;
		container.innerHTML = this.createHTML();
		this.bindEvents();
		this.updateUI();
	}

	// Vincular eventos
	bindEvents() {
		const form = document.getElementById("auth-form");
		const switchBtn = document.getElementById("auth-switch-btn");
		const googleBtn = document.getElementById("google-btn");

		form.addEventListener("submit", (e) => this.handleSubmit(e));
		switchBtn.addEventListener("click", (e) => this.handleSwitchMode(e));
		googleBtn.addEventListener("click", (e) => this.handleGoogleLogin(e));
	}

	// Manejar envío del formulario
	async handleSubmit(e) {
		e.preventDefault();

		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);

		this.showLoading(true);
		this.hideMessage();

		try {
			let result;

			if (this.currentMode === "login") {
				result = await authService.login(data.email, data.password);
			} else {
				result = await authService.register(data);
			}

			if (result.success) {
				this.showMessage("¡Autenticación exitosa!", "success");
				setTimeout(() => {
					window.location.href = "/";
				}, 1000);
			} else {
				this.showMessage(result.message, "error");
			}
		} catch (error) {
			this.showMessage("Error de conexión", "error");
		} finally {
			this.showLoading(false);
		}
	}

	// Manejar cambio de modo (login/register)
	handleSwitchMode(e) {
		e.preventDefault();
		this.currentMode = this.currentMode === "login" ? "register" : "login";
		this.updateUI();
	}

	// Manejar login con Google
	async handleGoogleLogin(e) {
		e.preventDefault();

		this.showLoading(true);
		this.hideMessage();

		try {
			// Redirigir al backend para iniciar OAuth
			window.location.href = "http://localhost:3001/auth/google";
		} catch (error) {
			this.showMessage("Error iniciando OAuth con Google", "error");
			this.showLoading(false);
		}
	}

	// Actualizar UI según el modo
	updateUI() {
		const title = document.getElementById("auth-title");
		const subtitle = document.getElementById("auth-subtitle");
		const submitBtn = document.getElementById("submit-btn");
		const switchText = document.getElementById("auth-switch-text");
		const switchBtn = document.getElementById("auth-switch-btn");
		const registerFields = document.getElementById("register-fields");

		if (this.currentMode === "login") {
			title.textContent = "Iniciar Sesión";
			subtitle.textContent = "Accede a tu cuenta";
			submitBtn.textContent = "Iniciar Sesión";
			switchText.innerHTML =
				'¿No tienes cuenta? <a href="#" id="auth-switch-btn">Regístrate</a>';
			registerFields.style.display = "none";
		} else {
			title.textContent = "Registrarse";
			subtitle.textContent = "Crea tu cuenta";
			submitBtn.textContent = "Registrarse";
			switchText.innerHTML =
				'¿Ya tienes cuenta? <a href="#" id="auth-switch-btn">Inicia sesión</a>';
			registerFields.style.display = "block";
		}

		// Re-vincular el evento del botón de cambio
		const newSwitchBtn = document.getElementById("auth-switch-btn");
		newSwitchBtn.addEventListener("click", (e) => this.handleSwitchMode(e));
	}

	// Mostrar loading
	showLoading(show) {
		const submitBtn = document.getElementById("submit-btn");
		const googleBtn = document.getElementById("google-btn");

		if (show) {
			submitBtn.disabled = true;
			submitBtn.textContent = "Cargando...";
			googleBtn.disabled = true;
		} else {
			submitBtn.disabled = false;
			googleBtn.disabled = false;
			this.updateUI(); // Restaurar texto del botón
		}
	}

	// Mostrar mensaje
	showMessage(message, type) {
		const messageEl = document.getElementById("auth-message");
		messageEl.textContent = message;
		messageEl.className = `auth-message auth-message--${type}`;
		messageEl.style.display = "block";
	}

	// Ocultar mensaje
	hideMessage() {
		const messageEl = document.getElementById("auth-message");
		messageEl.style.display = "none";
	}
}

// Inicializar el componente cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("login-container");
	if (container) {
		const loginComponent = new LoginComponent();
		loginComponent.render(container);
	}
});
