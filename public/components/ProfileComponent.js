import { authStore } from "../stores/authStore.js";
import { Toast } from "./Toast.js";
import { navigate } from "../services/router.js";

class ProfileComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
		this.isEditing = false;
	}

	connectedCallback() {
		this.updateFromAuthStore();
		authStore.subscribe(this.updateFromAuthStore.bind(this));
	}

	updateFromAuthStore() {
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

	render() {
		if (!this.user) {
			this.innerHTML = `
				<div class="dashboard-container">
					<div class="loading">
						<div class="spinner"></div>
						<p>Cargando información del usuario...</p>
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
			<div class="dashboard-container">
				<div class="dashboard-header">
					<h1>👤 Perfil de Usuario</h1>
					<p class="user-email">${this.user.email}</p>
				</div>
				
				<div class="dashboard-content">
					<div class="user-info-card">
						<div class="user-avatar">
							${
								hasAvatar
									? avatarUrl
										? `<img src="${avatarUrl}" alt="Avatar de ${this.user.firstName}" />`
										: `<div class="avatar-placeholder">${this.user.firstName
												.charAt(0)
												.toUpperCase()}</div>`
									: `<div class="avatar-placeholder">${this.user.firstName
											.charAt(0)
											.toUpperCase()}</div>`
							}
						</div>
						<div class="user-details">
							<h3>${this.user.firstName}${
			this.user.lastName ? ` ${this.user.lastName}` : ""
		}</h3>
							<p><strong>Email:</strong> ${this.user.email}</p>
							<p><strong>Rol:</strong> ${this.user.role || "Usuario"}</p>
							${
								this.user.lastLogin
									? `<p><strong>Último acceso:</strong> ${new Date(
											this.user.lastLogin,
									  ).toLocaleString()}</p>`
									: ""
							}
						</div>
					</div>
					
					<div class="dashboard-actions">
						<button class="btn btn-primary" id="editProfileBtn">
							✏️ Editar Perfil
						</button>
						<button class="btn btn-primary" id="addressesBtn">
							📍 Mis Direcciones
						</button>
						<button class="btn btn-secondary" onclick="this.changePassword()">
							🔒 Cambiar Contraseña
						</button>
						<button class="btn btn-success" onclick="this.viewOrders()">
							📋 Mis Pedidos
						</button>
					</div>
				</div>
			</div>

			<!-- Modal de edición de perfil -->
			<div id="editProfileModal" class="modal hidden">
				<div class="modal-content">
					<div class="modal-header">
						<h2>✏️ Editar Perfil</h2>
						<button class="modal-close" id="closeEditModal">×</button>
					</div>
					<div class="modal-body">
						<form id="editProfileForm">
							<div class="avatar-section">
								<div class="current-avatar">
									${
										hasAvatar
											? avatarUrl
												? `<img src="${avatarUrl}" alt="Avatar actual" id="currentAvatarImg" />`
												: `<div class="avatar-placeholder" id="currentAvatarPlaceholder">${this.user.firstName
														.charAt(0)
														.toUpperCase()}</div>`
											: `<div class="avatar-placeholder" id="currentAvatarPlaceholder">${this.user.firstName
													.charAt(0)
													.toUpperCase()}</div>`
									}
								</div>
								<div class="avatar-actions">
									<label for="avatarInput" class="btn btn-secondary btn-sm">
										📷 Cambiar Foto
									</label>
									<input type="file" id="avatarInput" accept="image/*" style="display: none;">
									${
										hasAvatar
											? `<button type="button" class="btn btn-danger btn-sm" id="removeAvatarBtn">🗑️ Eliminar</button>`
											: ""
									}
								</div>
							</div>

							<div class="form-group">
								<label for="firstName">Nombre:</label>
								<input type="text" id="firstName" name="firstName" value="${
									this.user.firstName
								}" required>
							</div>
							<div class="form-group">
								<label for="lastName">Apellido:</label>
								<input type="text" id="lastName" name="lastName" value="${
									this.user.lastName
								}" required>
							</div>
							<div class="form-group">
								<label for="email">Email:</label>
								<input type="email" id="email" name="email" value="${this.user.email}" disabled>
								<small>El email no se puede cambiar</small>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary" id="cancelEditBtn">Cancelar</button>
						<button class="btn btn-primary" id="saveProfileBtn">💾 Guardar Cambios</button>
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

		// Cerrar modal al hacer clic fuera
		if (editProfileModal) {
			editProfileModal.addEventListener("click", (e) => {
				if (e.target === editProfileModal) {
					this.hideEditModal();
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

			if (data.success) {
				Toast.success("Perfil actualizado exitosamente");

				// Actualizar el usuario local sin disparar updateFromAuthStore
				this.user.firstName = firstName;
				this.user.lastName = lastName;

				// Actualizar solo los elementos necesarios del DOM
				this.updateMainProfileNames(firstName, lastName);

				this.hideEditModal();

				// Actualizar el store después de un pequeño delay para evitar conflictos
				setTimeout(() => {
					authStore.updateUser({
						firstName,
						lastName,
					});
				}, 100);
			} else {
				Toast.error(data.message || "Error actualizando perfil");
			}
		} catch (error) {
			console.error("Error actualizando perfil:", error);
			Toast.error("Error actualizando perfil");
		}
	}

	changePassword() {
		// TODO: Implementar cambio de contraseña
		console.log("Cambiar contraseña");
		Toast.info("Funcionalidad de cambio de contraseña próximamente");
	}

	viewOrders() {
		// TODO: Implementar vista de pedidos
		console.log("Ver pedidos");
		Toast.info("Funcionalidad de pedidos próximamente");
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
						const avatarActions = this.querySelector(".avatar-actions");
						const newRemoveBtn = document.createElement("button");
						newRemoveBtn.type = "button";
						newRemoveBtn.className = "btn btn-danger btn-sm";
						newRemoveBtn.id = "removeAvatarBtn";
						newRemoveBtn.textContent = "🗑️ Eliminar";
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

					// Actualizar el store después de un pequeño delay para evitar conflictos
					setTimeout(() => {
						authStore.updateUser({
							avatar: signedUrl,
							avatarKey: data.result.data.avatarKey,
						});
					}, 100);
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
		const nameElement = this.querySelector(".user-details h3");
		if (nameElement) {
			nameElement.textContent = `${firstName}${lastName ? ` ${lastName}` : ""}`;
		}

		// Actualizar placeholders de avatar si no hay imagen
		const placeholders = this.querySelectorAll(".avatar-placeholder");
		placeholders.forEach((placeholder) => {
			placeholder.textContent = firstName.charAt(0).toUpperCase();
		});
	}

	// Actualizar avatar en la vista principal del perfil
	updateMainProfileAvatar(avatarUrl) {
		const mainAvatar = this.querySelector(".user-avatar img");
		const mainPlaceholder = this.querySelector(
			".user-avatar .avatar-placeholder",
		);

		if (avatarUrl) {
			// Si hay avatar, actualizar o crear la imagen
			if (mainAvatar) {
				mainAvatar.src = avatarUrl;
			} else if (mainPlaceholder) {
				mainPlaceholder.style.display = "none";
				const newImg = document.createElement("img");
				newImg.src = avatarUrl;
				newImg.alt = `Avatar de ${this.user.firstName}`;
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
				const avatarContainer = this.querySelector(".user-avatar");
				const newPlaceholder = document.createElement("div");
				newPlaceholder.className = "avatar-placeholder";
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
