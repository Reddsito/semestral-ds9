import { authStore } from "../stores/authStore.js";
import { Toast } from "./Toast.js";
import { navigate } from "../services/router.js";
import { authService } from "../services/authService.js";

class ProfileComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
		this.isEditing = false;
		this.canChangePassword = false;
	}

	connectedCallback() {
		this.updateFromAuthStore();
		authStore.subscribe(async () => {
			await this.updateFromAuthStore();
		});
	}

	async updateFromAuthStore() {
		const state = authStore.getState();
		const newUser = state.user;

		console.log("🔄 ProfileComponent.updateFromAuthStore() llamado");
		console.log("👤 Usuario actual:", this.user?.firstName);
		console.log("👤 Nuevo usuario:", newUser?.firstName);

		// Si no hay usuario, hacer render inicial
		if (!newUser) {
			console.log("❌ No hay usuario, render inicial");
			this.user = null;
			this.render();
			return;
		}

		// Si es la primera vez que se carga el usuario
		if (!this.user) {
			console.log("🆕 Primera carga del usuario, render inicial");
			this.user = newUser;
			await this.checkPasswordChangeAbility();
			this.render();
			return;
		}

		// Verificar si solo cambió el avatar (no hacer re-render completo)
		const avatarChanged =
			this.user.avatar !== newUser.avatar ||
			this.user.avatarKey !== newUser.avatarKey;
		const nameChanged =
			this.user.firstName !== newUser.firstName ||
			this.user.lastName !== newUser.lastName;
		const emailChanged = this.user.email !== newUser.email;

		console.log("🔍 Cambios detectados:", {
			avatarChanged,
			nameChanged,
			emailChanged,
		});

		// Actualizar el usuario local
		this.user = newUser;

		// Solo hacer re-render si cambiaron datos importantes (no solo avatar)
		if (nameChanged || emailChanged) {
			console.log(
				"🔄 Cambios importantes detectados, haciendo re-render completo",
			);
			await this.checkPasswordChangeAbility();
			this.render();
		} else if (avatarChanged) {
			console.log(
				"🖼️ Solo cambió el avatar, actualizando elementos específicos",
			);
			// Si solo cambió el avatar, actualizar solo los elementos necesarios
			this.updateMainProfileAvatar(newUser.avatar);
		} else {
			console.log("✅ No hay cambios relevantes");
		}
	}

	async checkPasswordChangeAbility() {
		try {
			const result = await authService.canChangePassword();
			if (result.success) {
				this.canChangePassword = result.canChangePassword;
				console.log("🔐 Capacidad de cambiar contraseña:", {
					canChange: this.canChangePassword,
				});
			}
		} catch (error) {
			console.error(
				"Error verificando capacidad de cambiar contraseña:",
				error,
			);
		}
	}

	render() {
		if (!this.user) {
			this.innerHTML = `
				<div class="profile-container">
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<h3>Cargando tu perfil...</h3>
						<p>Estamos preparando toda tu información</p>
					</div>
				</div>
			`;
			return;
		}

		// Usar la URL del avatar que ya viene en el store (ya es firmada)
		let avatarUrl = null;
		let hasAvatar = false;

		console.log("🔍 Render - user data:", {
			avatar: this.user.avatar,
			avatarKey: this.user.avatarKey,
			firstName: this.user.firstName,
		});

		if (this.user.avatar) {
			avatarUrl = this.user.avatar;
			hasAvatar = true;
			console.log("✅ Usando avatar URL:", avatarUrl);
		} else if (this.user.avatarKey) {
			// Si tiene avatarKey pero no avatar, significa que la URL expiró
			// pero el usuario sí tiene avatar
			hasAvatar = true;
			console.log("⚠️ Tiene avatarKey pero no avatar URL");
		} else {
			console.log("❌ No tiene avatar ni avatarKey");
		}

		this.innerHTML = `
			<link rel="stylesheet" href="/styles/dashboard.css" />
			<div class="profile-container">
				<div class="profile-header">
					<div class="profile-header-content">
						<h1>Mi Perfil</h1>
						<p class="profile-subtitle">Gestiona tu información personal y preferencias</p>
					</div>
				</div>
				
				<div class="profile-content">
					<div class="profile-main-card">
						<div class="profile-avatar-section">
							<div class="profile-avatar">
								${
									hasAvatar && avatarUrl
										? `<img src="${avatarUrl}" alt="Avatar de ${this.user.firstName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
										: ""
								}
								<div class="avatar-placeholder-large" style="${
									hasAvatar && avatarUrl ? "display: none;" : "display: flex;"
								}">${this.user.firstName.charAt(0).toUpperCase()}</div>
								<div class="avatar-overlay">
									<span class="avatar-status">Foto de Perfil</span>
								</div>
							</div>
						</div>
						
						<div class="profile-info-section">
							<div class="profile-name">
								<h2>${this.user.firstName}${
			this.user.lastName ? ` ${this.user.lastName}` : ""
		}</h2>
								<div class="profile-badge">
									<span class="badge-icon">👑</span>
									${this.user.role || "Usuario"}
								</div>
							</div>
							
							<div class="profile-details">
								<div class="detail-item">
									<div class="detail-icon">📧</div>
									<div class="detail-content">
										<label>Email</label>
										<span>${this.user.email}</span>
									</div>
								</div>
								
								<div class="detail-item">
									<div class="detail-icon">🔐</div>
									<div class="detail-content">
										<label>Tipo de Autenticación</label>
										<span>${this.canChangePassword ? "Credenciales" : "Google"}</span>
									</div>
								</div>
								
								${
									this.user.lastLogin
										? `<div class="detail-item">
											<div class="detail-icon">🕒</div>
											<div class="detail-content">
												<label>Último acceso</label>
												<span>${new Date(this.user.lastLogin).toLocaleString()}</span>
											</div>
										</div>`
										: ""
								}
							</div>
						</div>
					</div>
					
					<div class="profile-actions">
						<div class="action-grid">
							<button class="action-card primary" id="editProfileBtn">
								<div class="action-icon">✏️</div>
								<div class="action-content">
									<h3>Editar Perfil</h3>
									<p>Modifica tu información personal</p>
								</div>
							</button>
							
							${
								this.user.role === "customer"
									? `
								<button class="action-card secondary" id="addressesBtn">
								<div class="action-icon">📍</div>
								<div class="action-content">
									<h3>Mis Direcciones</h3>
									<p>Gestiona tus direcciones de envío</p>
								</div>
							</button>
							
							<button class="action-card success" id="orderBtn">
								<div class="action-icon">📋</div>
								<div class="action-content">
									<h3>Mis Pedidos</h3>
									<p>Revisa el estado de tus compras</p>
								</div>
							</button>
								`
									: ""
							}
							
							${
								this.canChangePassword
									? `<button class="action-card warning" id="changePasswordBtn">
											<div class="action-icon">🔒</div>
											<div class="action-content">
												<h3>Cambiar Contraseña</h3>
												<p>Actualiza tu contraseña de seguridad</p>
											</div>
										</button>`
									: `<div class="action-card disabled">
											<div class="action-icon">🔒</div>
											<div class="action-content">
												<h3>Seguridad</h3>
												<p>Usuarios de Google gestionan su contraseña desde Google</p>
											</div>
										</div>`
							}
						</div>
					</div>
				</div>
			</div>

			<!-- Modal de edición de perfil -->
			<div id="editProfileModal" class="modal hidden">
				<div class="modal-content large">
					<div class="modal-header">
						<div class="modal-header-content">
							<div class="modal-icon">✏️</div>
							<h2>Editar Perfil</h2>
							<p>Actualiza tu información personal</p>
						</div>
						<button class="modal-close" id="closeEditModal">×</button>
					</div>
					<div class="modal-body">
						<form id="editProfileForm">
							<div class="avatar-edit-section">
								<div class="avatar-edit-preview">
									${
										hasAvatar
											? avatarUrl
												? `<img src="${avatarUrl}" alt="Avatar actual" id="currentAvatarImg" />`
												: `<div class="avatar-placeholder-edit" id="currentAvatarPlaceholder">${this.user.firstName
														.charAt(0)
														.toUpperCase()}</div>`
											: `<div class="avatar-placeholder-edit" id="currentAvatarPlaceholder">${this.user.firstName
													.charAt(0)
													.toUpperCase()}</div>`
									}
								</div>
								<div class="avatar-edit-actions">
									<label for="avatarInput" class="btn btn-secondary btn-large">
										<span class="btn-icon">📷</span>
										Cambiar Foto
									</label>
									<input type="file" id="avatarInput" accept="image/*" style="display: none;">
									${
										hasAvatar
											? `<button type="button" class="btn btn-danger btn-large" id="removeAvatarBtn">
												<span class="btn-icon">🗑️</span>
												Eliminar
											</button>`
											: ""
									}
								</div>
							</div>

							<div class="form-sections">
								<div class="form-section">
									<h3>Información Personal</h3>
									<div class="form-row">
										<div class="form-group">
											<label for="firstName">Nombre</label>
											<input type="text" id="firstName" name="firstName" value="${
												this.user.firstName
											}" required>
										</div>
										<div class="form-group">
											<label for="lastName">Apellido</label>
											<input type="text" id="lastName" name="lastName" value="${
												this.user.lastName
											}" required>
										</div>
									</div>
								</div>
								
								<div class="form-section">
									<h3>Información de Contacto</h3>
									<div class="form-group">
										<label for="email">Email</label>
										<input type="email" id="email" name="email" value="${this.user.email}" disabled>
										<small>El email no se puede cambiar por seguridad</small>
									</div>
								</div>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary btn-large" id="cancelEditBtn">
							<span class="btn-icon">❌</span>
							Cancelar
						</button>
						<button class="btn btn-primary btn-large" id="saveProfileBtn">
							<span class="btn-icon">💾</span>
							Guardar Cambios
						</button>
					</div>
				</div>
			</div>

			<!-- Modal de cambio de contraseña -->
			<div id="changePasswordModal" class="modal hidden">
				<div class="modal-content">
					<div class="modal-header">
						<div class="modal-header-content">
							<div class="modal-icon">🔒</div>
							<h2>Cambiar Contraseña</h2>
							<p>Actualiza tu contraseña de seguridad</p>
						</div>
						<button class="modal-close" id="closePasswordModal">×</button>
					</div>
					<div class="modal-body">
						<form id="changePasswordForm">
							<div class="form-section">
								<h3>Información de Seguridad</h3>
								<div class="form-group">
									<label for="currentPassword">Contraseña Actual</label>
									<input type="password" id="currentPassword" name="currentPassword" required>
									<small>Ingresa tu contraseña actual para verificar tu identidad</small>
								</div>
								<div class="form-group">
									<label for="newPassword">Nueva Contraseña</label>
									<input type="password" id="newPassword" name="newPassword" required>
									<small>La nueva contraseña debe tener al menos 6 caracteres</small>
								</div>
								<div class="form-group">
									<label for="confirmPassword">Confirmar Nueva Contraseña</label>
									<input type="password" id="confirmPassword" name="confirmPassword" required>
									<small>Repite la nueva contraseña para confirmar</small>
								</div>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary btn-large" id="cancelPasswordBtn">
							<span class="btn-icon">❌</span>
							Cancelar
						</button>
						<button class="btn btn-primary btn-large" id="savePasswordBtn">
							<span class="btn-icon">🔒</span>
							Cambiar Contraseña
						</button>
					</div>
				</div>
			</div>
		`;

		this.attachEventListeners();
	}

	attachEventListeners() {
		const editProfileBtn = this.querySelector("#editProfileBtn");
		const closeEditModal = this.querySelector("#closeEditModal");
		const cancelEditBtn = this.querySelector("#cancelEditBtn");
		const saveProfileBtn = this.querySelector("#saveProfileBtn");
		const editProfileModal = this.querySelector("#editProfileModal");
		const avatarInput = this.querySelector("#avatarInput");
		const removeAvatarBtn = this.querySelector("#removeAvatarBtn");
		const addressesBtn = this.querySelector("#addressesBtn");
		const changePasswordBtn = this.querySelector("#changePasswordBtn");
		const closePasswordModal = this.querySelector("#closePasswordModal");
		const cancelPasswordBtn = this.querySelector("#cancelPasswordBtn");
		const savePasswordBtn = this.querySelector("#savePasswordBtn");
		const changePasswordModal = this.querySelector("#changePasswordModal");
		const orderBtn = this.querySelector("#orderBtn");

		if (orderBtn) {
			orderBtn.addEventListener("click", () => this.viewOrders());
		}

		if (addressesBtn) {
			addressesBtn.addEventListener("click", () => {
				navigate("/profile/addresses");
			});
		}

		if (editProfileBtn) {
			editProfileBtn.addEventListener("click", () => this.showEditModal());
		}

		if (closeEditModal) {
			closeEditModal.addEventListener("click", () => this.hideEditModal());
		}

		if (cancelEditBtn) {
			cancelEditBtn.addEventListener("click", () => this.hideEditModal());
		}

		if (saveProfileBtn) {
			saveProfileBtn.addEventListener("click", () => this.saveProfile());
		}

		if (avatarInput) {
			avatarInput.addEventListener("change", (e) => this.handleAvatarUpload(e));
		}

		if (removeAvatarBtn) {
			removeAvatarBtn.addEventListener("click", () =>
				this.handleAvatarDelete(),
			);
		}

		if (changePasswordBtn) {
			changePasswordBtn.addEventListener("click", () =>
				this.showChangePasswordModal(),
			);
		}

		if (closePasswordModal) {
			closePasswordModal.addEventListener("click", () =>
				this.hideChangePasswordModal(),
			);
		}

		if (cancelPasswordBtn) {
			cancelPasswordBtn.addEventListener("click", () =>
				this.hideChangePasswordModal(),
			);
		}

		if (savePasswordBtn) {
			savePasswordBtn.addEventListener("click", () => this.changePassword());
		}

		// Cerrar modal al hacer clic fuera
		if (editProfileModal) {
			editProfileModal.addEventListener("click", (e) => {
				if (e.target === editProfileModal) {
					this.hideEditModal();
				}
			});
		}

		if (changePasswordModal) {
			changePasswordModal.addEventListener("click", (e) => {
				if (e.target === changePasswordModal) {
					this.hideChangePasswordModal();
				}
			});
		}
	}

	showEditModal() {
		const modal = this.querySelector("#editProfileModal");
		modal.classList.remove("hidden");
		modal.classList.add("show");
		document.body.style.overflow = "hidden";
	}

	hideEditModal() {
		const modal = this.querySelector("#editProfileModal");
		modal.classList.remove("show");
		modal.classList.add("hidden");
		document.body.style.overflow = "auto";
	}

	showChangePasswordModal() {
		const modal = this.querySelector("#changePasswordModal");
		modal.classList.remove("hidden");
		modal.classList.add("show");
		document.body.style.overflow = "hidden";
	}

	hideChangePasswordModal() {
		const modal = this.querySelector("#changePasswordModal");
		modal.classList.remove("show");
		modal.classList.add("hidden");
		document.body.style.overflow = "auto";

		// Limpiar formulario
		const form = this.querySelector("#changePasswordForm");
		if (form) {
			form.reset();
		}
	}

	async changePassword() {
		const currentPasswordInput = this.querySelector("#currentPassword");
		const newPasswordInput = this.querySelector("#newPassword");
		const confirmPasswordInput = this.querySelector("#confirmPassword");

		const currentPassword = currentPasswordInput.value.trim();
		const newPassword = newPasswordInput.value.trim();
		const confirmPassword = confirmPasswordInput.value.trim();

		// Validaciones
		if (!currentPassword) {
			Toast.error("Debes ingresar tu contraseña actual");
			currentPasswordInput.focus();
			return;
		}

		if (!newPassword) {
			Toast.error("Debes ingresar una nueva contraseña");
			newPasswordInput.focus();
			return;
		}

		if (newPassword.length < 6) {
			Toast.error("La nueva contraseña debe tener al menos 6 caracteres");
			newPasswordInput.focus();
			return;
		}

		if (newPassword !== confirmPassword) {
			Toast.error("Las contraseñas no coinciden");
			confirmPasswordInput.focus();
			return;
		}

		if (newPassword === currentPassword) {
			Toast.error("La nueva contraseña debe ser diferente a la actual");
			newPasswordInput.focus();
			return;
		}

		try {
			const result = await authService.changePassword(
				currentPassword,
				newPassword,
			);

			if (result.success) {
				Toast.success(result.message);
				this.hideChangePasswordModal();
			} else {
				Toast.error(result.message);
			}
		} catch (error) {
			console.error("Error cambiando contraseña:", error);
			Toast.error("Error cambiando contraseña");
		}
	}

	async saveProfile() {
		const firstNameInput = this.querySelector("#firstName");
		const lastNameInput = this.querySelector("#lastName");

		const firstName = firstNameInput.value.trim();
		const lastName = lastNameInput.value.trim();

		// Validaciones
		if (!firstName) {
			Toast.error("El nombre no puede estar vacío");
			firstNameInput.focus();
			return;
		}

		if (!lastName) {
			Toast.error("El apellido no puede estar vacío");
			lastNameInput.focus();
			return;
		}

		try {
			console.log("🔄 Guardando perfil...");
			const response = await fetch("/api/v1/auth/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					firstName,
					lastName,
				}),
			});

			const data = await response.json();
			console.log("📊 Respuesta del servidor:", data);

			if (data.success) {
				Toast.success("Perfil actualizado exitosamente");

				// Actualizar el usuario local sin disparar updateFromAuthStore
				this.user.firstName = firstName;
				this.user.lastName = lastName;

				// Actualizar solo los elementos necesarios del DOM
				this.updateMainProfileNames(firstName, lastName);

				this.hideEditModal();

				// Forzar actualización del store después de un delay
				setTimeout(async () => {
					console.log("🔄 Forzando actualización del store...");

					// Obtener datos actualizados del servidor
					try {
						const meResponse = await fetch("/api/v1/auth/me", {
							headers: {
								Authorization: `Bearer ${localStorage.getItem("token")}`,
							},
						});

						if (meResponse.ok) {
							const meData = await meResponse.json();
							if (meData.success) {
								console.log(
									"✅ Datos actualizados obtenidos:",
									meData.result.data,
								);
								authStore.updateUser(meData.result.data);
							}
						}
					} catch (error) {
						console.error("Error obteniendo datos actualizados:", error);
					}
				}, 500);
			} else {
				Toast.error(data.message || "Error actualizando perfil");
			}
		} catch (error) {
			console.error("Error actualizando perfil:", error);
			Toast.error("Error actualizando perfil");
		}
	}

	viewOrders() {
		navigate("/orders");
	}

	async handleAvatarUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Validar tipo de archivo
		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		if (!allowedTypes.includes(file.type)) {
			Toast.error("Solo se permiten imágenes (JPEG, PNG, GIF, WebP)");
			return;
		}

		// Validar tamaño (máximo 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			Toast.error("El archivo es demasiado grande. Máximo 5MB");
			return;
		}

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/v1/auth/avatar/upload", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: formData,
			});

			const data = await response.json();

			console.log("📊 Respuesta del servidor:", data);

			if (data.success) {
				Toast.success("Avatar actualizado exitosamente");

				console.log("🔍 data.result:", data.result);
				console.log("🔍 data.result.data:", data.result?.data);

				// 🔥 Pedir la nueva URL firmada después de subir
				const { authService } = await import("../services/authService.js");
				const signedUrlResult = await authService.getAvatarSignedUrl();

				if (signedUrlResult.success) {
					const signedUrl = signedUrlResult.signedUrl;

					// Actualizar la imagen en el modal con URL firmada
					const currentAvatarImg = this.querySelector("#currentAvatarImg");
					const currentAvatarPlaceholder = this.querySelector(
						"#currentAvatarPlaceholder",
					);

					if (currentAvatarImg) {
						currentAvatarImg.src = signedUrl;
					} else if (currentAvatarPlaceholder) {
						currentAvatarPlaceholder.style.display = "none";
						const newImg = document.createElement("img");
						newImg.src = signedUrl;
						newImg.alt = "Avatar actual";
						newImg.id = "currentAvatarImg";
						currentAvatarPlaceholder.parentNode.appendChild(newImg);
					}

					// Mostrar botón de eliminar
					const removeAvatarBtn = this.querySelector("#removeAvatarBtn");
					if (!removeAvatarBtn) {
						const avatarActions = this.querySelector(".avatar-edit-actions");
						const newRemoveBtn = document.createElement("button");
						newRemoveBtn.type = "button";
						newRemoveBtn.className = "btn btn-danger btn-large";
						newRemoveBtn.id = "removeAvatarBtn";
						newRemoveBtn.innerHTML = '<span class="btn-icon">🗑️</span>Eliminar';
						newRemoveBtn.addEventListener("click", () =>
							this.handleAvatarDelete(),
						);
						avatarActions.appendChild(newRemoveBtn);
					}

					// Actualizar el usuario local sin disparar updateFromAuthStore
					this.user.avatar = signedUrl;
					this.user.avatarKey = data.result.data.avatarKey;

					// Actualizar solo los elementos necesarios del DOM
					this.updateMainProfileAvatar(signedUrl);

					// Limpiar el input de archivo
					const avatarInput = this.querySelector("#avatarInput");
					if (avatarInput) {
						avatarInput.value = "";
					}

					// Forzar actualización del store después de un delay
					setTimeout(async () => {
						console.log(
							"🔄 Forzando actualización del store después de avatar...",
						);

						// Obtener datos actualizados del servidor
						try {
							const meResponse = await fetch("/api/v1/auth/me", {
								headers: {
									Authorization: `Bearer ${localStorage.getItem("token")}`,
								},
							});

							if (meResponse.ok) {
								const meData = await meResponse.json();
								if (meData.success) {
									console.log(
										"✅ Datos actualizados obtenidos:",
										meData.result.data,
									);
									authStore.updateUser(meData.result.data);
								}
							}
						} catch (error) {
							console.error("Error obteniendo datos actualizados:", error);
						}
					}, 500);
				} else {
					Toast.error("Error obteniendo URL del avatar");
				}
			} else {
				Toast.error(data.message || "Error actualizando avatar");
			}
		} catch (error) {
			console.error("Error subiendo avatar:", error);
			Toast.error("Error subiendo avatar");
		}
	}

	// Actualizar nombres en la vista principal del perfil
	updateMainProfileNames(firstName, lastName) {
		const nameElement = this.querySelector(".profile-name h2");
		if (nameElement) {
			nameElement.textContent = `${firstName}${lastName ? ` ${lastName}` : ""}`;
		}

		// Actualizar placeholders de avatar si no hay imagen
		const placeholders = this.querySelectorAll(".avatar-placeholder-large");
		placeholders.forEach((placeholder) => {
			placeholder.textContent = firstName.charAt(0).toUpperCase();
		});
	}

	// Actualizar avatar en la vista principal del perfil
	updateMainProfileAvatar(avatarUrl) {
		const mainAvatar = this.querySelector(".profile-avatar img");
		const mainPlaceholder = this.querySelector(
			".profile-avatar .avatar-placeholder-large",
		);

		if (avatarUrl) {
			// Si hay avatar, actualizar o crear la imagen
			if (mainAvatar) {
				mainAvatar.src = avatarUrl;
				mainAvatar.style.display = "block";
				mainAvatar.onerror = function () {
					this.style.display = "none";
					if (
						this.nextElementSibling &&
						this.nextElementSibling.classList.contains(
							"avatar-placeholder-large",
						)
					) {
						this.nextElementSibling.style.display = "flex";
					}
				};
			} else if (mainPlaceholder) {
				mainPlaceholder.style.display = "none";
				const newImg = document.createElement("img");
				newImg.src = avatarUrl;
				newImg.alt = `Avatar de ${this.user.firstName}`;
				newImg.onerror = function () {
					this.style.display = "none";
					if (
						this.nextElementSibling &&
						this.nextElementSibling.classList.contains(
							"avatar-placeholder-large",
						)
					) {
						this.nextElementSibling.style.display = "flex";
					}
				};
				mainPlaceholder.parentNode.appendChild(newImg);
			}
		} else {
			// Si no hay avatar, mostrar placeholder
			if (mainAvatar) {
				mainAvatar.remove();
			}
			if (mainPlaceholder) {
				mainPlaceholder.style.display = "flex";
			} else {
				const avatarContainer = this.querySelector(".profile-avatar");
				const newPlaceholder = document.createElement("div");
				newPlaceholder.className = "avatar-placeholder-large";
				newPlaceholder.textContent = this.user.firstName
					.charAt(0)
					.toUpperCase();
				avatarContainer.appendChild(newPlaceholder);
			}
		}
	}

	async handleAvatarDelete() {
		// Mostrar modal de confirmación personalizado
		this.showConfirmDeleteModal();
	}

	showConfirmDeleteModal() {
		const modal = document.createElement("div");
		modal.className = "modal show";
		modal.style.display = "flex";
		modal.innerHTML = `
			<div class="modal-content" style="max-width: 400px;">
				<div class="modal-header">
					<h2>🗑️ Eliminar Avatar</h2>
				</div>
				<div class="modal-body">
					<p>¿Estás seguro de que quieres eliminar tu foto de perfil?</p>
					<p><small>Esta acción no se puede deshacer.</small></p>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" id="cancelDeleteBtn">Cancelar</button>
					<button class="btn btn-danger" id="confirmDeleteBtn">🗑️ Eliminar</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// Event listeners
		modal.querySelector("#cancelDeleteBtn").addEventListener("click", () => {
			document.body.removeChild(modal);
		});

		modal
			.querySelector("#confirmDeleteBtn")
			.addEventListener("click", async () => {
				document.body.removeChild(modal);
				await this.performAvatarDelete();
			});

		// Cerrar al hacer clic fuera del modal
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
			}
		});
	}

	async performAvatarDelete() {
		try {
			const response = await fetch("/api/v1/auth/avatar", {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				Toast.success("Avatar eliminado exitosamente");

				// Limpiar cualquier referencia a avatar/avatarKey en this.user
				this.user.avatar = null;
				this.user.avatarKey = null;

				// Actualizar solo los elementos necesarios del DOM
				this.updateMainProfileAvatar(null);

				// Actualizar el modal si está abierto
				const currentAvatarImg = this.querySelector("#currentAvatarImg");
				const currentAvatarPlaceholder = this.querySelector(
					"#currentAvatarPlaceholder",
				);
				const removeAvatarBtn = this.querySelector("#removeAvatarBtn");

				if (currentAvatarImg) {
					currentAvatarImg.remove();
				}
				if (currentAvatarPlaceholder) {
					currentAvatarPlaceholder.style.display = "flex";
				}
				if (removeAvatarBtn) {
					removeAvatarBtn.remove();
				}

				// Actualizar el store después de un pequeño delay para evitar conflictos
				setTimeout(() => {
					authStore.updateUser({
						avatar: null,
						avatarKey: null,
					});
				}, 100);
			} else {
				Toast.error(data.message || "Error eliminando avatar");
			}
		} catch (error) {
			console.error("Error eliminando avatar:", error);
			Toast.error("Error eliminando avatar");
		}
	}
}

customElements.define("profile-component", ProfileComponent);
