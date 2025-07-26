import { router } from "../services/router.js";
import { authService } from "../services/authService.js";

class RegisterComponent extends HTMLElement {
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
						<h1>📝 Crear Cuenta</h1>
						<p>Únete a PrintForge y comienza a imprimir</p>
					</div>

					<div class="success-message" id="success-message">
						✅ ¡Cuenta creada exitosamente! Redirigiendo...
					</div>

					<form id="register-form">
						<div class="form-row">
							<div class="form-group">
								<label for="firstName" class="form-label">👤 Nombre</label>
								<input 
									type="text" 
									id="firstName" 
									name="firstName" 
									class="form-input" 
									placeholder="Tu nombre"
									required
								>
								<div class="error-message" id="firstName-error">
									El nombre es requerido
								</div>
							</div>

							<div class="form-group">
								<label for="lastName" class="form-label">👤 Apellido</label>
								<input 
									type="text" 
									id="lastName" 
									name="lastName" 
									class="form-input" 
									placeholder="Tu apellido"
									required
								>
								<div class="error-message" id="lastName-error">
									El apellido es requerido
								</div>
							</div>
						</div>

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
								placeholder="Crea una contraseña segura"
								required
							>
							<div class="error-message" id="password-error">
								La contraseña debe tener al menos 8 caracteres
							</div>
							<div class="password-strength" id="password-strength">
								<div class="strength-bar">
									<div class="strength-fill" id="strength-fill"></div>
								</div>
							</div>
						</div>

						<div class="form-group">
							<label for="confirmPassword" class="form-label">🔐 Confirmar Contraseña</label>
							<input 
								type="password" 
								id="confirmPassword" 
								name="confirmPassword" 
								class="form-input" 
								placeholder="Repite tu contraseña"
								required
							>
							<div class="error-message" id="confirmPassword-error">
								Las contraseñas no coinciden
							</div>
						</div>

						<div class="terms-checkbox">
							<input type="checkbox" id="terms" name="terms" required>
							<label for="terms">
								Acepto los <a href="#" id="terms-link">Términos y Condiciones</a> y la 
								<a href="#" id="privacy-link">Política de Privacidad</a>
							</label>
						</div>

						<button type="submit" class="auth-button success" id="register-button">
							<span class="button-text">🚀 Crear Cuenta</span>
							</div>
						</button>
					</form>

					<div class="auth-footer">
						<p>
							¿Ya tienes cuenta? 
							<a href="/login" id="login-link">Inicia sesión aquí</a>
						</p>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const form = this.querySelector("#register-form");
		const firstNameInput = this.querySelector("#firstName");
		const lastNameInput = this.querySelector("#lastName");
		const emailInput = this.querySelector("#email");
		const passwordInput = this.querySelector("#password");
		const confirmPasswordInput = this.querySelector("#confirmPassword");
		const registerButton = this.querySelector("#register-button");
		const loginLink = this.querySelector("#login-link");

		// Validación en tiempo real
		firstNameInput.addEventListener("blur", () => {
			this.validateFirstName(firstNameInput);
		});

		lastNameInput.addEventListener("blur", () => {
			this.validateLastName(lastNameInput);
		});

		emailInput.addEventListener("blur", () => {
			this.validateEmail(emailInput);
		});

		passwordInput.addEventListener("blur", () => {
			this.validatePassword(passwordInput);
		});

		confirmPasswordInput.addEventListener("blur", () => {
			this.validateConfirmPassword(confirmPasswordInput, passwordInput);
		});

		// Validación de contraseña en tiempo real
		passwordInput.addEventListener("input", () => {
			this.updatePasswordStrength(passwordInput);
			this.clearError(passwordInput);
		});

		// Limpiar errores al escribir
		firstNameInput.addEventListener("input", () => {
			this.clearError(firstNameInput);
		});

		lastNameInput.addEventListener("input", () => {
			this.clearError(lastNameInput);
		});

		emailInput.addEventListener("input", () => {
			this.clearError(emailInput);
		});

		confirmPasswordInput.addEventListener("input", () => {
			this.clearError(confirmPasswordInput);
		});

		// Manejo del formulario
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			await this.handleRegister();
		});

		// Navegación al login
		loginLink.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/login");
		});
	}

	validateFirstName(input) {
		const firstName = input.value.trim();

		if (!firstName) {
			this.showError(input, "El nombre es requerido");
			return false;
		}

		if (firstName.length < 2) {
			this.showError(input, "El nombre debe tener al menos 2 caracteres");
			return false;
		}

		this.clearError(input);
		return true;
	}

	validateLastName(input) {
		const lastName = input.value.trim();

		if (!lastName) {
			this.showError(input, "El apellido es requerido");
			return false;
		}

		if (lastName.length < 2) {
			this.showError(input, "El apellido debe tener al menos 2 caracteres");
			return false;
		}

		this.clearError(input);
		return true;
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

		if (password.length < 8) {
			this.showError(input, "La contraseña debe tener al menos 8 caracteres");
			return false;
		}

		this.clearError(input);
		return true;
	}

	validateConfirmPassword(input, passwordInput) {
		const confirmPassword = input.value.trim();
		const password = passwordInput.value.trim();

		if (!confirmPassword) {
			this.showError(input, "Por favor confirma tu contraseña");
			return false;
		}

		if (confirmPassword !== password) {
			this.showError(input, "Las contraseñas no coinciden");
			return false;
		}

		this.clearError(input);
		return true;
	}

	updatePasswordStrength(input) {
		const password = input.value;
		const strengthFill = this.querySelector("#strength-fill");

		let strength = 0;
		let className = "";

		if (password.length >= 8) strength++;
		if (password.match(/[a-z]/)) strength++;
		if (password.match(/[A-Z]/)) strength++;
		if (password.match(/[0-9]/)) strength++;
		if (password.match(/[^a-zA-Z0-9]/)) strength++;

		switch (strength) {
			case 0:
			case 1:
				className = "strength-weak";
				break;
			case 2:
				className = "strength-fair";
				break;
			case 3:
				className = "strength-good";
				break;
			case 4:
			case 5:
				className = "strength-strong";
				break;
		}

		strengthFill.className = `strength-fill ${className}`;
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

	async handleRegister() {
		const firstNameInput = this.querySelector("#firstName");
		const lastNameInput = this.querySelector("#lastName");
		const emailInput = this.querySelector("#email");
		const passwordInput = this.querySelector("#password");
		const confirmPasswordInput = this.querySelector("#confirmPassword");
		const registerButton = this.querySelector("#register-button");
		const loading = this.querySelector("#loading");
		const buttonText = this.querySelector(".button-text");
		const successMessage = this.querySelector("#success-message");

		// Validar todos los campos
		const isFirstNameValid = this.validateFirstName(firstNameInput);
		const isLastNameValid = this.validateLastName(lastNameInput);
		const isEmailValid = this.validateEmail(emailInput);
		const isPasswordValid = this.validatePassword(passwordInput);
		const isConfirmPasswordValid = this.validateConfirmPassword(
			confirmPasswordInput,
			passwordInput,
		);

		if (
			!isFirstNameValid ||
			!isLastNameValid ||
			!isEmailValid ||
			!isPasswordValid ||
			!isConfirmPasswordValid
		) {
			return;
		}

		// Mostrar loading
		registerButton.disabled = true;
		loading.classList.add("show");
		buttonText.style.display = "none";

		try {
			// Simular llamada a API
			const response = await authService.register({
				firstName: firstNameInput.value.trim(),
				lastName: lastNameInput.value.trim(),
				email: emailInput.value.trim(),
				password: passwordInput.value,
			});
			console.log(response);

			// Mostrar mensaje de éxito
			successMessage.classList.add("show");

			// Simular redirección
			router.navigate("/login");
		} catch (error) {
			console.error("Error en registro:", error);
			this.showError(emailInput, "Error en el registro. Intenta de nuevo.");
		} finally {
			// Restaurar botón
			registerButton.disabled = false;
			loading.classList.remove("show");
			buttonText.style.display = "block";
		}
	}
}

customElements.define("register-component", RegisterComponent);
