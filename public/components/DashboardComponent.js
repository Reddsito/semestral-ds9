import { authStore } from "../stores/authStore.js";

class DashboardComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
	}

	connectedCallback() {
		this.render();
		this.subscribeToAuthStore();
		// Actualizar inmediatamente con el estado actual
		this.updateFromAuthStore();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	subscribeToAuthStore() {
		this.unsubscribe = authStore.subscribe((state) => {
			this.updateFromAuthStore();
		});
	}

	updateFromAuthStore() {
		const state = authStore.getState();
		this.user = state.user;
		this.render();
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

		this.innerHTML = `
			<div class="dashboard-container">
				<div class="dashboard-header">
					<h1>👤 Perfil de Usuario</h1>
					<p class="user-email">${this.user.email}</p>
				</div>
				
				<div class="dashboard-content">
					<div class="user-info-card">
						<div class="user-avatar">
							${
								this.user.avatar
									? `<img src="${this.user.avatar}" alt="Avatar de ${this.user.firstName}" />`
									: `<div class="avatar-placeholder">${this.user.firstName
											.charAt(0)
											.toUpperCase()}</div>`
							}
						</div>
						<div class="user-details">
							<h3>${this.user.firstName} ${this.user.lastName}</h3>
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
						<button class="btn btn-primary" onclick="this.editProfile()">
							✏️ Editar Perfil
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
		`;
	}

	editProfile() {
		// TODO: Implementar edición de perfil
		console.log("Editar perfil");
	}

	changePassword() {
		// TODO: Implementar cambio de contraseña
		console.log("Cambiar contraseña");
	}

	viewOrders() {
		// TODO: Implementar vista de pedidos
		console.log("Ver mis pedidos");
	}
}

customElements.define("dashboard-component", DashboardComponent);
