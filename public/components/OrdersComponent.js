import { authStore } from "../stores/authStore.js";
import { Toast } from "../components/Toast.js";
import { orderService } from "../services/orderServices.js";
import { navigate } from "../services/router.js";

class OrdersComponent extends HTMLElement {
	constructor() {
		super();
		this.orders = [];
		this.userRole = null;
		this.unsubscribe = null;
	}

	async connectedCallback() {
		if (!authStore.isAuthenticated()) {
			this.renderAuthRequired();
			return;
		}

		this.userRole = authStore.getUser()?.role || "user";

		this.unsubscribe = authStore.subscribe((state) => {
			if (!state.isAuthenticated) {
				this.renderAuthRequired();
			} else {
				this.userRole = state.user?.role || "user";
				this.loadAndRenderOrders();
			}
		});

		await this.loadAndRenderOrders();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	async loadAndRenderOrders() {
		try {
			const response = await orderService.getOrdersByUserId();
			console.log(response);
			this.orders = response.result?.data || [];
			this.render();
		} catch (error) {
			console.error("Error cargando órdenes:", error);
			Toast.error("Error cargando órdenes");
			this.orders = [];
			this.render();
		}
	}

	renderAuthRequired() {
		this.innerHTML = `
			<div class="orders-container">
				<div class="auth-required">
					<h2>🔐 Autenticación Requerida</h2>
					<p>Debes iniciar sesión para ver tus órdenes.</p>
					<a href="/login" class="btn btn-primary">Iniciar Sesión</a>
				</div>
			</div>
		`;
	}

	getStatusColor(status) {
		const statusColors = {
			RECEIVED: "#6c757d",
			PROCESSING: "#17a2b8",
			SHIPPED: "#ffc107",
			COMPLETED: "#28a745",
			CANCELLED: "#dc3545",
		};
		return statusColors[status] || "#6c757d";
	}

	getStatusText(status) {
		const statusTexts = {
			RECEIVED: "Recibido",
			PROCESSING: "En Producción",
			SHIPPED: "Enviado",
			COMPLETED: "Completado",
			CANCELLED: "Cancelado",
		};
		return statusTexts[status] || status;
	}

	formatDate(dateString) {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-ES", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	render() {
		const hasOrders = this.orders.length > 0;

		this.innerHTML = `
			<link rel="stylesheet" href="/styles/orders.css" />
			<div class="orders-container">
				<div class="orders-header">
					<h2>📦 Mis Órdenes</h2>
					<p>Gestiona y revisa el estado de tus pedidos</p>
				</div>

				${
					hasOrders
						? `
					<div class="orders-grid">
						${this.orders
							.map(
								(order) => `
							<div class="order-card" data-id="${order._id}">
								<div class="order-card-header">
									<div class="order-number">
										<span class="order-number-label">Pedido #${order.orderNumber}</span>
									</div>
									<div class="order-status" style="background-color: ${this.getStatusColor(
										order.status,
									)}">
										${this.getStatusText(order.status)}
									</div>
								</div>
								
								<div class="order-card-content">
									<div class="order-info">
										<div class="info-item">
											<span class="info-label">📅 Fecha:</span>
											<span class="info-value">${this.formatDate(order.createdAt)}</span>
										</div>
										<div class="info-item">
											<span class="info-label">💰 Total:</span>
											<span class="info-value price">$${order.totalPrice?.toFixed(2) || "0.00"}</span>
										</div>
										<div class="info-item">
											<span class="info-label">📦 Cantidad:</span>
											<span class="info-value">${order.quantity || 1}</span>
										</div>
										<div class="info-item">
											<span class="info-label">🏷️ Material:</span>
											<span class="info-value">${order.materialId?.name || "N/A"}</span>
										</div>
											<div class="info-item">
											<span class="info-label">🏷️ Acabado:</span>
											<span class="info-value">${order.finishId?.name || "N/A"}</span>
										</div>
									</div>
								</div>

								<div class="order-card-actions">
									<button class="btn btn-primary view-details" data-id="${order._id}">
										👁️ Ver Detalles
									</button>
									${
										this.userRole === "admin"
											? `<button class="btn btn-warning update-status" data-id="${order._id}">🔄 Cambiar Estado</button>`
											: ""
									}
									<button class="btn btn-danger delete-order" data-id="${order._id}">
										🗑️ Eliminar
									</button>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>
				`
						: `
					<div class="empty-state">
						<div class="empty-icon">📦</div>
						<h3>No tienes órdenes registradas</h3>
						<p>Ve a la calculadora para crear tu primera orden</p>
						<button class="btn btn-primary" onclick="window.location.href='/calculator'">
							🧮 Ir a Calculadora
						</button>
					</div>
				`
				}
			</div>
		`;

		this.setupEventListeners();
	}

	setupEventListeners() {
		this.querySelectorAll(".view-details").forEach((button) => {
			button.addEventListener("click", async (e) => {
				const id = e.target.dataset.id;
				// Navegar a la página de detalles
				navigate(`/orders/${id}`);
			});
		});

		this.querySelectorAll(".delete-order").forEach((button) => {
			button.addEventListener("click", async (e) => {
				const id = e.target.dataset.id;
				if (confirm("¿Seguro que quieres eliminar esta orden?")) {
					await this.deleteOrder(id);
				}
			});
		});

		if (this.userRole === "admin") {
			this.querySelectorAll(".update-status").forEach((button) => {
				button.addEventListener("click", async (e) => {
					const id = e.target.dataset.id;
					const validStatuses = [
						"pending",
						"processing",
						"shipped",
						"delivered",
						"cancelled",
					];
					const newStatus = prompt(
						`Ingresa nuevo estado (${validStatuses.join(", ")}):`,
					);
					if (newStatus && validStatuses.includes(newStatus.toLowerCase())) {
						await this.updateOrderStatus(id, newStatus.toLowerCase());
					} else {
						Toast.warning("Estado inválido o cancelado");
					}
				});
			});
		}
	}

	async deleteOrder(id) {
		try {
			await orderService.removeOrder(id);
			Toast.success("Orden eliminada exitosamente");
			await this.loadAndRenderOrders();
		} catch (error) {
			console.error("Error eliminando orden:", error);
			Toast.error("Error eliminando la orden");
		}
	}

	async updateOrderStatus(id, status) {
		try {
			await orderService.updateOrderStatus(id, status);
			Toast.success("Estado de orden actualizado");
			await this.loadAndRenderOrders();
		} catch (error) {
			console.error("Error actualizando estado:", error);
			Toast.error("Error actualizando el estado de la orden");
		}
	}
}

customElements.define("orders-component", OrdersComponent);
