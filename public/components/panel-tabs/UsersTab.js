import { Toast } from "../Toast.js";
import { authStore } from "../../stores/authStore.js";

class UsersTab extends HTMLElement {
	constructor() {
		super();
		this.users = [];
		this.currentPage = 1;
		this.totalPages = 1;
		this.filters = {
			search: "",
			role: "",
			status: "",
		};
		this.selectedUser = null;
	}

	connectedCallback() {
		this.render();
		this.loadUsers();
	}

	render() {
		this.innerHTML = `
            <div class="users-tab">
                <div class="users-header">
                    <h3>👥 Gestión de Usuarios</h3>
                    <button id="refreshUsers" class="btn btn-primary">🔄 Actualizar</button>
                </div>

                <div class="filters-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="searchFilter">Buscar:</label>
                            <input type="text" id="searchFilter" class="form-input" placeholder="Email o nombre...">
                        </div>
                        <div class="filter-group">
                            <label for="roleFilter">Rol:</label>
                            <select id="roleFilter" class="form-select">
                                <option value="">Todos los roles</option>
                                <option value="admin">Administrador</option>
                                <option value="customer">Cliente</option>
                                <option value="moderator">Moderador</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="statusFilter">Estado:</label>
                            <select id="statusFilter" class="form-select">
                                <option value="">Todos los estados</option>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button id="applyFilters" class="btn btn-secondary">🔍 Aplicar Filtros</button>
                        <button id="clearFilters" class="btn btn-outline">❌ Limpiar</button>
                    </div>
                </div>

                <div class="users-list">
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Nombre</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Último Login</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr>
                                    <td colspan="7" class="loading">Cargando usuarios...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <button id="prevPage" class="btn btn-outline">← Anterior</button>
                        <span id="pageInfo">Página 1 de 1</span>
                        <button id="nextPage" class="btn btn-outline">Siguiente →</button>
                    </div>
                </div>

                <!-- Modal para detalles del usuario -->
                <div id="userModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>👤 Detalles del Usuario</h3>
                            <button class="close-btn" id="closeUserModal">&times;</button>
                        </div>
                        <div class="modal-body" id="userModalBody">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <div class="status-update">
                                <label for="userStatus">Cambiar Estado:</label>
                                <select id="userStatus" class="form-select">
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                                <button id="updateUserStatus" class="btn btn-primary">Actualizar Estado</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Filtros
		this.querySelector("#applyFilters").addEventListener("click", () =>
			this.applyFilters(),
		);
		this.querySelector("#clearFilters").addEventListener("click", () =>
			this.clearFilters(),
		);
		this.querySelector("#refreshUsers").addEventListener("click", () =>
			this.loadUsers(),
		);

		// Paginación
		this.querySelector("#prevPage").addEventListener("click", () =>
			this.changePage(-1),
		);
		this.querySelector("#nextPage").addEventListener("click", () =>
			this.changePage(1),
		);

		// Modal
		this.querySelector("#closeUserModal").addEventListener("click", () =>
			this.closeModal(),
		);
		this.querySelector("#updateUserStatus").addEventListener("click", () =>
			this.toggleUserStatus(),
		);

		// Cerrar modal al hacer clic fuera
		this.querySelector("#userModal").addEventListener("click", (e) => {
			if (e.target === e.currentTarget) {
				this.closeModal();
			}
		});
	}

	applyFilters() {
		this.filters = {
			search: this.querySelector("#searchFilter").value,
			role: this.querySelector("#roleFilter").value,
			status: this.querySelector("#statusFilter").value,
		};
		this.currentPage = 1;
		this.loadUsers();
	}

	clearFilters() {
		this.filters = {
			search: "",
			role: "",
			status: "",
		};
		this.querySelector("#searchFilter").value = "";
		this.querySelector("#roleFilter").value = "";
		this.querySelector("#statusFilter").value = "";
		this.currentPage = 1;
		this.loadUsers();
	}

	async loadUsers() {
		try {
			const params = new URLSearchParams({
				page: this.currentPage,
				limit: 20,
				...this.filters,
			});

			const response = await fetch(`/api/v1/admin/users?${params}`, {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.users = data.result.data.users;
				this.totalPages = data.result.data.pagination.pages;
				this.displayUsers();
				this.updatePagination();
			} else {
				console.error("Error cargando usuarios:", response.statusText);
				this.showError("Error cargando usuarios");
			}
		} catch (error) {
			console.error("Error cargando usuarios:", error);
			this.showError("Error cargando usuarios");
		}
	}

	displayUsers() {
		const tbody = this.querySelector("#usersTableBody");

		if (this.users.length === 0) {
			tbody.innerHTML =
				'<tr><td colspan="7" class="empty-state">No hay usuarios que coincidan con los filtros</td></tr>';
			return;
		}

		tbody.innerHTML = this.users
			.map(
				(user) => `
            <tr class="user-row ${!user.isActive ? "inactive" : ""}">
                <td>${user._id}</td>
                <td>${user.email}</td>
                <td>${user.firstName} ${user.lastName || ""}</td>
                <td>
                    <span class="role-badge ${user.role}">
                        ${this.getRoleIcon(user.role)} ${this.getRoleText(
					user.role,
				)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${
											user.isActive ? "active" : "inactive"
										}">
                        ${user.isActive ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                </td>
                <td>${
									user.lastLogin
										? new Date(user.lastLogin).toLocaleDateString()
										: "Nunca"
								}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="this.closest('.user-row').dispatchEvent(new CustomEvent('viewUser', {detail: '${
											user._id
										}'}))">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `,
			)
			.join("");

		// Agregar event listeners para ver detalles
		tbody.querySelectorAll(".user-row").forEach((row) => {
			row.addEventListener("viewUser", (e) => {
				this.showUserDetails(e.detail);
			});
		});
	}

	updatePagination() {
		const prevBtn = this.querySelector("#prevPage");
		const nextBtn = this.querySelector("#nextPage");
		const pageInfo = this.querySelector("#pageInfo");

		prevBtn.disabled = this.currentPage <= 1;
		nextBtn.disabled = this.currentPage >= this.totalPages;
		pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
	}

	changePage(delta) {
		const newPage = this.currentPage + delta;
		if (newPage >= 1 && newPage <= this.totalPages) {
			this.currentPage = newPage;
			this.loadUsers();
		}
	}

	async showUserDetails(userId) {
		try {
			const response = await fetch(`/api/v1/admin/users/${userId}`, {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.selectedUser = data.result.data;
				this.displayUserModal();
				this.showModal();
			} else {
				console.error(
					"Error cargando detalles del usuario:",
					response.statusText,
				);
			}
		} catch (error) {
			console.error("Error cargando detalles del usuario:", error);
		}
	}

	displayUserModal() {
		const user = this.selectedUser;
		const modalBody = this.querySelector("#userModalBody");
		const statusSelect = this.querySelector("#userStatus");

		statusSelect.value = user.isActive.toString();

		modalBody.innerHTML = `
            <div class="detail-section">
                <h4>👤 Información Personal</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ID del Usuario:</span>
                        <span class="detail-value">${user._id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${user.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Nombre:</span>
                        <span class="detail-value">${user.firstName} ${
			user.lastName || ""
		}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Rol:</span>
                        <span class="detail-value">
                            <span class="role-badge ${user.role}">
                                ${this.getRoleIcon(
																	user.role,
																)} ${this.getRoleText(user.role)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="status-badge ${
															user.isActive ? "active" : "inactive"
														}">
                                ${user.isActive ? "✅ Activo" : "❌ Inactivo"}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Registro:</span>
                        <span class="detail-value">${new Date(
													user.createdAt,
												).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Último Login:</span>
                        <span class="detail-value">${
													user.lastLogin
														? new Date(user.lastLogin).toLocaleString()
														: "Nunca"
												}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>📊 Estadísticas del Usuario</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Total de Pedidos:</span>
                        <span class="detail-value">${
													user.stats?.totalOrders || 0
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total de Cotizaciones:</span>
                        <span class="detail-value">${
													user.stats?.totalQuotes || 0
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total Gastado:</span>
                        <span class="detail-value">$${(
													user.stats?.totalSpent || 0
												).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
	}

	async toggleUserStatus() {
		if (!this.selectedUser) return;

		const newStatus = this.querySelector("#userStatus").value === "true";
		const userId = this.selectedUser._id;

		try {
			const response = await fetch(
				`/api/v1/admin/users/${userId}/toggle-active`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authStore.getToken()}`,
					},
					body: JSON.stringify({ isActive: newStatus }),
				},
			);

			if (response.ok) {
				Toast.success(
					`Usuario ${newStatus ? "activado" : "desactivado"} exitosamente`,
				);
				this.selectedUser.isActive = newStatus;
				this.displayUserModal();
				this.loadUsers(); // Recargar lista
			} else {
				const data = await response.json();
				Toast.error(
					`Error: ${data.message || "Error actualizando estado del usuario"}`,
				);
			}
		} catch (error) {
			console.error("Error actualizando estado del usuario:", error);
			Toast.error("Error actualizando estado del usuario");
		}
	}

	showModal() {
		this.querySelector("#userModal").style.display = "flex";
	}

	closeModal() {
		this.querySelector("#userModal").style.display = "none";
		this.selectedUser = null;
	}

	getRoleIcon(role) {
		const icons = {
			admin: "👑",
			customer: "👤",
			moderator: "🛡️",
		};
		return icons[role] || "❓";
	}

	getRoleText(role) {
		const texts = {
			admin: "Administrador",
			customer: "Cliente",
			moderator: "Moderador",
		};
		return texts[role] || role;
	}

	showError(message) {
		const tbody = this.querySelector("#usersTableBody");
		tbody.innerHTML = `<tr><td colspan="7" class="error">${message}</td></tr>`;
	}
}

customElements.define("users-tab", UsersTab);
