import { Api } from "./api.js";

(() => {
	const RegisterComponent = () => {
		const htmls = {
			container: document.getElementById("register-container"),
			form: null,
			messageDiv: null,
		};

		const state = {
			isLoading: false,
			error: null,
			formData: {
				firstName: "",
				lastName: "",
				email: "",
				password: "",
				confirmPassword: "",
			},
		};

		const methods = {
			ui: {
				createRegisterForm: () => {
					const formContainer = document.createElement("div");
					formContainer.className = "auth-container";

					const formCard = document.createElement("div");
					formCard.className = "auth-card";

					const formHeader = document.createElement("div");
					formHeader.className = "auth-header";

					const title = document.createElement("h2");
					title.textContent = "📝 Crear Cuenta";
					title.className = "auth-title";

					const subtitle = document.createElement("p");
					subtitle.textContent = "Únete a PrintForge";
					subtitle.className = "auth-subtitle";

					const form = document.createElement("form");
					form.className = "auth-form";
					form.id = "register-form";

					// Campos del formulario
					const firstNameGroup = methods.ui.createFormGroup(
						"firstName",
						"Nombre",
						"text",
						"Tu nombre",
					);

					const lastNameGroup = methods.ui.createFormGroup(
						"lastName",
						"Apellido",
						"text",
						"Tu apellido",
					);

					const emailGroup = methods.ui.createFormGroup(
						"email",
						"Email",
						"email",
						"tu@email.com",
					);

					const passwordGroup = methods.ui.createFormGroup(
						"password",
						"Contraseña",
						"password",
						"Tu contraseña",
					);

					const confirmPasswordGroup = methods.ui.createFormGroup(
						"confirmPassword",
						"Confirmar Contraseña",
						"password",
						"Confirma tu contraseña",
					);

					// Botón de envío
					const submitBtn = document.createElement("button");
					submitBtn.type = "submit";
					submitBtn.className = "auth-btn primary";
					submitBtn.textContent = "Crear Cuenta";

					// Separador
					const separator = document.createElement("div");
					separator.className = "auth-separator";
					separator.innerHTML = "<span>o</span>";

					// Botón de Google
					const googleBtn = document.createElement("button");
					googleBtn.type = "button";
					googleBtn.className = "auth-btn google";
					googleBtn.innerHTML = "🔍 Continuar con Google";
					googleBtn.id = "google-btn";

					// Enlace a login
					const switchContainer = document.createElement("div");
					switchContainer.className = "auth-switch";
					switchContainer.innerHTML = `
						<p>¿Ya tienes cuenta? <a href="/login.html" class="auth-link">Iniciar Sesión</a></p>
					`;

					// Mensaje de estado
					const messageDiv = document.createElement("div");
					messageDiv.className = "auth-message";
					messageDiv.id = "auth-message";
					messageDiv.style.display = "none";

					// Ensamblar formulario
					formHeader.appendChild(title);
					formHeader.appendChild(subtitle);

					form.appendChild(firstNameGroup);
					form.appendChild(lastNameGroup);
					form.appendChild(emailGroup);
					form.appendChild(passwordGroup);
					form.appendChild(confirmPasswordGroup);
					form.appendChild(submitBtn);

					formCard.appendChild(formHeader);
					formCard.appendChild(messageDiv);
					formCard.appendChild(form);
					formCard.appendChild(separator);
					formCard.appendChild(googleBtn);
					formCard.appendChild(switchContainer);

					formContainer.appendChild(formCard);

					return { formContainer, form, messageDiv };
				},

				createFormGroup: (name, label, type, placeholder) => {
					const group = document.createElement("div");
					group.className = "form-group";

					const labelElement = document.createElement("label");
					labelElement.htmlFor = name;
					labelElement.textContent = label;

					const input = document.createElement("input");
					input.type = type;
					input.id = name;
					input.name = name;
					input.placeholder = placeholder;
					input.required = true;

					group.appendChild(labelElement);
					group.appendChild(input);

					return group;
				},

				showMessage: (message, type = "info") => {
					if (!htmls.messageDiv) return;

					htmls.messageDiv.textContent = message;
					htmls.messageDiv.className = `auth-message ${type}`;
					htmls.messageDiv.style.display = "block";
				},

				hideMessage: () => {
					if (!htmls.messageDiv) return;
					htmls.messageDiv.style.display = "none";
				},

				showLoading: (isLoading) => {
					const submitBtn = htmls.form.querySelector('button[type="submit"]');
					const googleBtn = document.getElementById("google-btn");

					if (isLoading) {
						submitBtn.textContent = "Creando cuenta...";
						submitBtn.disabled = true;
						googleBtn.disabled = true;
						state.isLoading = true;
					} else {
						submitBtn.textContent = "Crear Cuenta";
						submitBtn.disabled = false;
						googleBtn.disabled = false;
						state.isLoading = false;
					}
				},

				validateForm: (data) => {
					const errors = [];

					if (!data.firstName.trim()) {
						errors.push("El nombre es requerido");
					}

					if (!data.lastName.trim()) {
						errors.push("El apellido es requerido");
					}

					if (!data.email.trim()) {
						errors.push("El email es requerido");
					} else if (!/\S+@\S+\.\S+/.test(data.email)) {
						errors.push("El email no es válido");
					}

					if (!data.password) {
						errors.push("La contraseña es requerida");
					} else if (data.password.length < 6) {
						errors.push("La contraseña debe tener al menos 6 caracteres");
					}

					if (data.password !== data.confirmPassword) {
						errors.push("Las contraseñas no coinciden");
					}

					return errors;
				},
			},

			handlers: {
				handleSubmit: async (e) => {
					e.preventDefault();

					const formData = new FormData(e.target);
					const data = Object.fromEntries(formData);

					// Validar formulario
					const errors = methods.ui.validateForm(data);
					if (errors.length > 0) {
						methods.ui.showMessage(errors.join(", "), "error");
						return;
					}

					methods.ui.showLoading(true);
					methods.ui.hideMessage();

					try {
						const api = new Api();
						const result = await api.register({
							firstName: data.firstName,
							lastName: data.lastName,
							email: data.email,
							password: data.password,
						});

						if (result.success) {
							// Guardar en localStorage
							const token = result.result.extra?.token;
							const userData = result.result.data;

							if (token && userData) {
								localStorage.setItem("auth_token", token);
								localStorage.setItem("auth_user", JSON.stringify(userData));

								methods.ui.showMessage(
									"¡Cuenta creada exitosamente!",
									"success",
								);

								// Actualizar navbar si existe
								if (window.navbar) {
									window.navbar.updateAuth();
								}

								setTimeout(() => {
									window.location.href = "/";
								}, 1000);
							} else {
								methods.ui.showMessage(
									"Error: No se recibió el token de autenticación",
									"error",
								);
							}
						} else {
							methods.ui.showMessage(
								result.message || "Error al crear la cuenta",
								"error",
							);
						}
					} catch (error) {
						console.error("Error en registro:", error);
						methods.ui.showMessage(
							"Error de conexión con el servidor",
							"error",
						);
					} finally {
						methods.ui.showLoading(false);
					}
				},

				handleGoogleAuth: async (e) => {
					e.preventDefault();

					methods.ui.showLoading(true);
					methods.ui.hideMessage();

					try {
						// Redirigir al backend para iniciar OAuth
						window.location.href = "http://localhost:3001/auth/google";
					} catch (error) {
						console.error("Error iniciando OAuth:", error);
						methods.ui.showMessage(
							"Error iniciando autenticación con Google",
							"error",
						);
						methods.ui.showLoading(false);
					}
				},
			},

			init: () => {
				// Crear formulario
				const formElements = methods.ui.createRegisterForm();
				htmls.form = formElements.form;
				htmls.messageDiv = formElements.messageDiv;

				// Insertar en DOM
				htmls.container.appendChild(formElements.formContainer);

				// Vincular eventos
				htmls.form.addEventListener("submit", methods.handlers.handleSubmit);
				document
					.getElementById("google-btn")
					.addEventListener("click", methods.handlers.handleGoogleAuth);
			},
		};

		return {
			init: methods.init,
		};
	};

	RegisterComponent().init();
})();
