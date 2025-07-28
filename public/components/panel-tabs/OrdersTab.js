import { authStore } from "../../stores/authStore.js";
import { orderService } from "../../services/orderServices.js";
import { Toast } from "../Toast.js";

class OrdersTab extends HTMLElement {
	constructor() {
		super();
		this.orders = [];
		this.currentPage = 1;
		this.totalPages = 1;
		this.filters = {
			status: "",
			email: "",
			dateFrom: "",
			dateTo: "",
		};
		this.selectedOrder = null;
	}

	connectedCallback() {
		this.loadOrders();
		this.render();
	}

	render() {
		this.innerHTML = `
            <div class="orders-tab">
                <div class="orders-header">
                    <h3>📦 Gestión de Pedidos</h3>
                    <button id="refreshOrders" class="btn btn-primary">🔄 Actualizar</button>
                </div>

                <div class="filters-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="statusFilter">Estado:</label>
                            <select id="statusFilter" class="form-select">
                                <option value="">Todos los estados</option>
                                <option value="RECEIVED">Recibido</option>
                                <option value="TECHNICAL_REVIEW">Revisión Técnica</option>
                                <option value="IN_PRODUCTION">En Producción</option>
                                <option value="QUALITY_CONTROL">Control de Calidad</option>
                                <option value="SHIPPED">Enviado</option>
                                <option value="DELIVERED">Entregado</option>
                                <option value="CANCELED">Cancelado</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="emailFilter">Email del Cliente:</label>
                            <input type="email" id="emailFilter" class="form-input" placeholder="Buscar por email...">
                        </div>
                        <div class="filter-group">
                            <label for="dateFromFilter">Desde:</label>
                            <input type="date" id="dateFromFilter" class="form-input">
                        </div>
                        <div class="filter-group">
                            <label for="dateToFilter">Hasta:</label>
                            <input type="date" id="dateToFilter" class="form-input">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button id="applyFilters" class="btn btn-secondary">🔍 Aplicar Filtros</button>
                        <button id="clearFilters" class="btn btn-outline">❌ Limpiar</button>
                    </div>
                </div>

                <div class="orders-list">
                    <div class="orders-table-container">
                        <table class="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="ordersTableBody">
                                <tr>
                                    <td colspan="6" class="loading">Cargando pedidos...</td>
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

                <!-- Modal para detalles del pedido -->
                <div id="orderModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📦 Detalles del Pedido</h3>
                            <button class="close-btn" id="closeOrderModal">&times;</button>
                        </div>
                        <div class="modal-body" id="orderModalBody">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <div class="status-update">
                                <label for="orderStatus">Cambiar Estado:</label>
                                <select id="orderStatus" class="form-select">
                                    <option value="RECEIVED">Recibido</option>
                                    <option value="TECHNICAL_REVIEW">Revisión Técnica</option>
                                    <option value="IN_PRODUCTION">En Producción</option>
                                    <option value="QUALITY_CONTROL">Control de Calidad</option>
                                    <option value="SHIPPED">Enviado</option>
                                    <option value="DELIVERED">Entregado</option>
                                    <option value="CANCELED">Cancelado</option>
                                </select>
                                <button id="updateOrderStatus" class="btn btn-primary">Actualizar Estado</button>
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
		this.querySelector("#refreshOrders").addEventListener("click", () =>
			this.loadOrders(),
		);

		// Paginación
		this.querySelector("#prevPage").addEventListener("click", () =>
			this.changePage(-1),
		);
		this.querySelector("#nextPage").addEventListener("click", () =>
			this.changePage(1),
		);

		// Modal
		this.querySelector("#closeOrderModal").addEventListener("click", () =>
			this.closeModal(),
		);
		this.querySelector("#updateOrderStatus").addEventListener("click", () =>
			this.updateOrderStatus(),
		);

		// Cerrar modal al hacer clic fuera
		this.querySelector("#orderModal").addEventListener("click", (e) => {
			if (e.target === e.currentTarget) {
				this.closeModal();
			}
		});
	}

	applyFilters() {
		this.filters = {
			status: this.querySelector("#statusFilter").value,
			email: this.querySelector("#emailFilter").value,
			dateFrom: this.querySelector("#dateFromFilter").value,
			dateTo: this.querySelector("#dateToFilter").value,
		};
		this.currentPage = 1;
		this.loadOrders();
	}

	clearFilters() {
		this.filters = {
			status: "",
			email: "",
			dateFrom: "",
			dateTo: "",
		};
		this.querySelector("#statusFilter").value = "";
		this.querySelector("#emailFilter").value = "";
		this.querySelector("#dateFromFilter").value = "";
		this.querySelector("#dateToFilter").value = "";
		this.currentPage = 1;
		this.loadOrders();
	}

	async loadOrders() {
		try {
			const params = new URLSearchParams({
				page: this.currentPage,
				limit: 20,
				...this.filters,
			});

			const response = await fetch(`/api/v1/orders/admin?${params}`, {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.orders = data.result.data.orders;
				this.totalPages = data.result.data.pagination.pages;
				this.displayOrders();
				this.updatePagination();
			} else {
				console.error("Error cargando pedidos:", response.statusText);
				this.showError("Error cargando pedidos");
			}
		} catch (error) {
			console.error("Error cargando pedidos:", error);
			this.showError("Error cargando pedidos");
		}
	}

	displayOrders() {
		const tbody = this.querySelector("#ordersTableBody");

		if (this.orders.length === 0) {
			tbody.innerHTML =
				'<tr><td colspan="6" class="empty-state">No hay pedidos que coincidan con los filtros</td></tr>';
			return;
		}

		tbody.innerHTML = this.orders
			.map(
				(order) => `
            <tr class="order-row">
                <td>${order._id}</td>
                <td>${order.userId?.email || "N/A"}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${this.getStatusIcon(
													order.status,
												)} ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="this.closest('.order-row').dispatchEvent(new CustomEvent('viewOrder', {detail: '${
											order._id
										}'}))">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `,
			)
			.join("");

		// Agregar event listeners para ver detalles
		tbody.querySelectorAll(".order-row").forEach((row) => {
			row.addEventListener("viewOrder", (e) => {
				this.showOrderDetails(e.detail);
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
			this.loadOrders();
		}
	}

	async showOrderDetails(orderId) {
		try {
			const response = await orderService.getOrderById(orderId);
			console.log({ response: response.result.data });

			if (response) {
				this.selectedOrder = response.result.data;
				this.displayOrderModal();
				this.showModal();
			} else {
				console.error("Error cargando detalles del pedido:", response);
			}
		} catch (error) {
			console.error("Error cargando detalles del pedido:", error);
		}
	}

	displayOrderModal() {
		const order = this.selectedOrder;
		const modalBody = this.querySelector("#orderModalBody");
		const statusSelect = this.querySelector("#orderStatus");

		statusSelect.value = order.status;

		modalBody.innerHTML = `
            <div class="detail-section">
                <h4>📋 Información General</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ID del Pedido:</span>
                        <span class="detail-value">${order._id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cliente:</span>
                        <span class="detail-value">${
													order.userId?.email || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="status-badge ${order.status}">
                                ${this.getStatusIcon(
																	order.status,
																)} ${this.getStatusText(order.status)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Creación:</span>
                        <span class="detail-value">${new Date(
													order.createdAt,
												).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>📦 Detalles del Producto</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Archivo:</span>
                        <span class="detail-value">${
													order.fileId?.originalName || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Material:</span>
                        <span class="detail-value">${
													order.materialId?.name || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Acabado:</span>
                        <span class="detail-value">${
													order.finishId?.name || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cantidad:</span>
                        <span class="detail-value">${order.quantity || 1}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>💰 Información de Precio</h4>
                <div class="price-breakdown">
                    <div class="price-item">
                        <span class="price-label">Precio Base:</span>
                        <span class="price-value">$${Number(
													order.priceBreakdown?.subtotal || 0,
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">Acabado:</span>
                        <span class="price-value">$${Number(
													order.priceBreakdown?.finishCost.total || 0,
												).toFixed(5)}</span>
                    </div>
										     <div class="price-item">
                        <span class="price-label">Impuestos:</span>
                        <span class="price-value">$${Number(
													order.priceBreakdown?.tax || 0,
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">Material:</span>
                        <span class="price-value">$${Number(
													order.priceBreakdown?.materialCost.total || 0,
												).toFixed(5)}</span>
                    </div>
										     <div class="price-item">
                        <span class="price-label">Costos Fijos:</span>
                        <span class="price-value">$${Number(
													order.priceBreakdown?.fixedCosts.total || 0,
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item total">
                        <span class="price-label">Total:</span>
                        <span class="price-value">$${Number(
													order.totalPrice || 0,
												).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${
							order.notes
								? `
                <div class="detail-section">
                    <h4>📝 Notas</h4>
                    <p class="order-notes">${order.notes}</p>
                </div>
            `
								: ""
						}
        `;
	}

	async updateOrderStatus() {
		if (!this.selectedOrder) return;

		const newStatus = this.querySelector("#orderStatus").value;
		const orderId = this.selectedOrder._id;

		console.log("🔄 Actualizando estado desde frontend:", {
			orderId,
			newStatus,
		});
		console.log(
			"🔑 Token de autenticación:",
			authStore.getToken() ? "Presente" : "Ausente",
		);

		try {
			const response = await fetch(`/api/v1/orders/${orderId}/status`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authStore.getToken()}`,
				},
				body: JSON.stringify({ status: newStatus }),
			});

			console.log(
				"📡 Respuesta del servidor:",
				response.status,
				response.statusText,
			);

			if (response.ok) {
				const data = await response.json();
				console.log("✅ Respuesta exitosa:", data);
				Toast.success("Estado del pedido actualizado exitosamente");
				this.selectedOrder.status = newStatus;
				this.displayOrderModal();
				this.loadOrders(); // Recargar lista
			} else {
				const errorData = await response.json();
				console.error("❌ Error en respuesta:", errorData);
				const errorMessage = `Error actualizando estado del pedido: ${
					errorData.message || response.statusText
				}`;
				Toast.error(errorMessage);
			}
		} catch (error) {
			console.error("❌ Error actualizando estado:", error);
			Toast.error("Error actualizando estado del pedido");
		}
	}

	showModal() {
		this.querySelector("#orderModal").style.display = "flex";
	}

	closeModal() {
		this.querySelector("#orderModal").style.display = "none";
		this.selectedOrder = null;
	}

	getStatusIcon(status) {
		const icons = {
			RECEIVED: "📥",
			TECHNICAL_REVIEW: "🔍",
			IN_PRODUCTION: "⚙️",
			QUALITY_CONTROL: "🔬",
			SHIPPED: "📦",
			DELIVERED: "✅",
			CANCELED: "❌",
		};
		return icons[status] || "❓";
	}

	getStatusText(status) {
		const texts = {
			RECEIVED: "Recibido",
			TECHNICAL_REVIEW: "Revisión Técnica",
			IN_PRODUCTION: "En Producción",
			QUALITY_CONTROL: "Control de Calidad",
			SHIPPED: "Enviado",
			DELIVERED: "Entregado",
			CANCELED: "Cancelado",
		};
		return texts[status] || status;
	}

	showError(message) {
		const tbody = this.querySelector("#ordersTableBody");
		tbody.innerHTML = `<tr><td colspan="6" class="error">${message}</td></tr>`;
	}
}

customElements.define("orders-tab", OrdersTab);
