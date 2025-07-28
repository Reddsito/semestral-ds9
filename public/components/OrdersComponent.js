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
			TECHNICAL_REVIEW: "#17a2b8",
			IN_PRODUCTION: "#28a745",
			QUALITY_CONTROL: "#ffc107",
			SHIPPED: "#ffc107",
			COMPLETED: "#28a745",
			CANCELLED: "#dc3545",
		};
		return statusColors[status] || "#6c757d";
	}

	getStatusText(status) {
		const statusTexts = {
			RECEIVED: "Recibido",
			TECHNICAL_REVIEW: "Revisión Técnica",
			IN_PRODUCTION: "En Producción",
			QUALITY_CONTROL: "Control de Calidad",
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

					const status = await this.showStatusDialog(validStatuses);
					if (status) {
						await this.updateOrderStatus(id, status.toLowerCase());
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

	async showStatusDialog(validStatuses) {
		return new Promise((resolve) => {
			// Crear contenedor del diálogo
			const container = document.createElement("div");
			container.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
				opacity: 0;
				transition: opacity 0.3s ease;
			`;

			// Crear el diálogo
			const dialog = document.createElement("div");
			dialog.style.cssText = `
				background: white;
				border-radius: 12px;
				padding: 24px;
				max-width: 400px;
				width: 90%;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				transform: scale(0.9);
				transition: transform 0.3s ease;
			`;

			const statusLabels = {
				pending: "Pendiente",
				processing: "En Proceso",
				shipped: "Enviado",
				delivered: "Entregado",
				cancelled: "Cancelado",
			};

			dialog.innerHTML = `
				<div style="display: flex; align-items: center; margin-bottom: 16px;">
					<span style="font-size: 24px; margin-right: 12px;">🔄</span>
					<h3 style="margin: 0; color: #333; font-size: 18px;">Cambiar Estado</h3>
				</div>
				<p style="margin: 0 0 20px 0; color: #666;">Selecciona el nuevo estado de la orden:</p>
				<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
					${validStatuses
						.map(
							(status) => `
						<button class="status-option" data-status="${status}" style="
							padding: 12px 16px;
							border: 1px solid #ddd;
							background: white;
							color: #333;
							border-radius: 6px;
							cursor: pointer;
							font-size: 14px;
							text-align: left;
							transition: all 0.2s ease;
						">${statusLabels[status] || status}</button>
					`,
						)
						.join("")}
				</div>
				<div style="display: flex; gap: 12px; justify-content: flex-end;">
					<button id="dialog-cancel" style="
						padding: 8px 16px;
						border: 1px solid #ddd;
						background: white;
						color: #666;
						border-radius: 6px;
						cursor: pointer;
						font-size: 14px;
						transition: all 0.2s ease;
					">Cancelar</button>
				</div>
			`;

			// Agregar al DOM
			container.appendChild(dialog);
			document.body.appendChild(container);

			// Animar entrada
			setTimeout(() => {
				container.style.opacity = "1";
				dialog.style.transform = "scale(1)";
			}, 10);

			// Event listeners
			const statusOptions = dialog.querySelectorAll(".status-option");
			const cancelBtn = dialog.querySelector("#dialog-cancel");

			const cleanup = () => {
				container.style.opacity = "0";
				dialog.style.transform = "scale(0.9)";
				setTimeout(() => {
					if (container.parentNode) container.remove();
				}, 300);
			};

			statusOptions.forEach((option) => {
				option.addEventListener("click", () => {
					const selectedStatus = option.dataset.status;
					cleanup();
					resolve(selectedStatus);
				});
			});

			cancelBtn.addEventListener("click", () => {
				cleanup();
				resolve(null);
			});

			// Cerrar con Escape
			const handleEscape = (e) => {
				if (e.key === "Escape") {
					cleanup();
					resolve(null);
					document.removeEventListener("keydown", handleEscape);
				}
			};
			document.addEventListener("keydown", handleEscape);

			// Cerrar al hacer clic fuera del diálogo
			container.addEventListener("click", (e) => {
				if (e.target === container) {
					cleanup();
					resolve(null);
				}
			});
		});
	}
}

customElements.define("orders-component", OrdersComponent);
