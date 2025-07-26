import { router } from "../services/router.js";
import { API } from "../services/api.js";
import { Toast } from "./Toast.js";
import { authStore } from "../stores/authStore.js";

class LoginComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.render();
		this.attachEventListeners();
	}

	render() {
		this.innerHTML = `
			<div class="auth-container">
				<div class="auth-form-container">
					<div class="auth-header">
						<h1>🔑 Iniciar Sesión</h1>
						<p>Accede a tu cuenta de PrintForge</p>
					</div>

					<div class="success-message" id="success-message">
						✅ ¡Inicio de sesión exitoso! Redirigiendo...
					</div>

					<button class="google-button" id="google-login">
						<svg class="google-icon" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Continuar con Google
					</button>

					<div class="divider">
						<span>o</span>
					</div>

					<form id="login-form">
						<div class="form-group">
							<label for="email" class="form-label">📧 Correo Electrónico</label>
							<input 
								type="email" 
								id="email" 
								name="email" 
								class="form-input" 
								placeholder="tu@email.com"
								required
							>
							<div class="error-message" id="email-error">
								Por favor ingresa un correo electrónico válido
							</div>
						</div>

						<div class="form-group">
							<label for="password" class="form-label">🔒 Contraseña</label>
							<input 
								type="password" 
								id="password" 
								name="password" 
								class="form-input" 
								placeholder="Tu contraseña"
								required
							>
							<div class="error-message" id="password-error">
								La contraseña es requerida
							</div>
						</div>

						<button type="submit" class="auth-button primary" id="login-button">
							<span class="button-text">🚀 Iniciar Sesión</span>
							<div class="spinner"></div>
						</button>
					</form>

					<div class="auth-footer">
						<p>
							¿No tienes cuenta? 
							<a href="/register" id="register-link">Regístrate aquí</a>
						</p>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const form = this.querySelector("#login-form");
		const emailInput = this.querySelector("#email");
		const passwordInput = this.querySelector("#password");
		const loginButton = this.querySelector("#login-button");
		const registerLink = this.querySelector("#register-link");
		const googleLoginButton = this.querySelector("#google-login");

		// Validación en tiempo real
		emailInput.addEventListener("blur", () => {
			this.validateEmail(emailInput);
		});

		passwordInput.addEventListener("blur", () => {
			this.validatePassword(passwordInput);
		});

		// Limpiar errores al escribir
		emailInput.addEventListener("input", () => {
			this.clearError(emailInput);
		});

		passwordInput.addEventListener("input", () => {
			this.clearError(passwordInput);
		});

		// Manejo del formulario
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			await this.handleLogin();
		});

		// Login con Google
		googleLoginButton.addEventListener("click", async (e) => {
			e.preventDefault();
			await this.handleGoogleLogin();
		});

		// Navegación al registro
		registerLink.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/register");
		});
	}

	validateEmail(input) {
		const email = input.value.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			this.showError(input, "El correo electrónico es requerido");
			return false;
		}

		if (!emailRegex.test(email)) {
			this.showError(input, "Por favor ingresa un correo electrónico válido");
			return false;
		}

		this.clearError(input);
		return true;
	}

	validatePassword(input) {
		const password = input.value.trim();

		if (!password) {
			this.showError(input, "La contraseña es requerida");
			return false;
		}

		if (password.length < 6) {
			this.showError(input, "La contraseña debe tener al menos 6 caracteres");
			return false;
		}

		this.clearError(input);
		return true;
	}

	showError(input, message) {
		input.classList.add("error");
		const errorElement = this.querySelector(`#${input.id}-error`);
		if (errorElement) {
			errorElement.textContent = message;
			errorElement.classList.add("show");
		}
	}

	clearError(input) {
		input.classList.remove("error");
		const errorElement = this.querySelector(`#${input.id}-error`);
		if (errorElement) {
			errorElement.classList.remove("show");
		}
	}

	async handleLogin() {
		const emailInput = this.querySelector("#email");
		const passwordInput = this.querySelector("#password");
		const loginButton = this.querySelector("#login-button");
		const successMessage = this.querySelector("#success-message");

		// Validar campos
		const isEmailValid = this.validateEmail(emailInput);
		const isPasswordValid = this.validatePassword(passwordInput);

		if (!isEmailValid || !isPasswordValid) {
			return;
		}
		console.log(1);

		// Mostrar loading
		loginButton.disabled = true;
		loginButton.classList.add("loading");

		try {
			// Usar authStore para el login
			const result = await authStore.login(
				emailInput.value.trim(),
				passwordInput.value,
			);
			console.log(18);

			if (result.success) {
				// Mostrar mensaje de éxito
				Toast.success("¡Inicio de sesión exitoso!");

				console.log(2);

				// Limpiar formulario
				emailInput.value = "";
				passwordInput.value = "";

				console.log(3);

				// Redirigir según el rol
				const user = authStore.getUser();
				if (user && user.role === "admin") {
					router.navigate("/panel");
				} else {
					router.navigate("/");
				}
				console.log(4);
			} else {
				Toast.error(result.error || "Error en el login");
			}
		} catch (error) {
			console.error(error.message);
			Toast.error(error.message);
		} finally {
			// Restaurar botón
			loginButton.disabled = false;
			loginButton.classList.remove("loading");
		}
	}

	async handleGoogleLogin() {
		const googleButton = this.querySelector("#google-login");
		const successMessage = this.querySelector("#success-message");

		// Mostrar loading en el botón de Google
		googleButton.disabled = true;
		googleButton.innerHTML = `
			<div class="spinner"></div>
			<span>Conectando con Google...</span>
		`;

		try {
			window.location.href = "/api/v1/auth/google";
		} catch (error) {
			console.error("Error en login con Google:", error);
			Toast.error("Error al conectar con Google. Intenta de nuevo.");
		} finally {
			// Restaurar botón de Google
			googleButton.disabled = false;
			googleButton.innerHTML = `
				<svg class="google-icon" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Continuar con Google
			`;
		}
	}
}

customElements.define("login-component", LoginComponent);
