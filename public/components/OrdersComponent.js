import { orderService } from "../services/orderService.js";
import { authStore } from "../stores/authStore.js";
import { Toast } from "../components/Toast.js";

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

		// Escuchar cambios en authStore para reaccionar a logout/login
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
		await this.loadOrders();
		this.render();
	}

	async loadOrders() {
		try {
			const response = await orderService.getAllOrders();
			this.orders = response.result?.data || [];
		} catch (error) {
			console.error("Error cargando órdenes:", error);
			Toast.error("Error cargando órdenes");
			this.orders = [];
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

	render() {
		const hasOrders = this.orders.length > 0;

		this.innerHTML = `
			<link rel="stylesheet" href="/styles/orders.css" />
			<div class="orders-container">
				<h2>📦 Mis Órdenes</h2>

				${hasOrders ? `
					<ul class="orders-list">
						${this.orders.map(order => `
							<li class="order-item" data-id="${order._id}">
								<div>
									<strong>ID:</strong> ${order._id}<br/>
									<strong>Estado:</strong> ${order.status}<br/>
									<strong>Total:</strong> $${order.totalPrice.toFixed(2)}<br/>
									<strong>Cantidad:</strong> ${order.quantity}
								</div>
								<div class="order-actions">
									<button class="btn btn-info view-details" data-id="${order._id}">Detalles</button>
									${this.userRole === "admin" ? `<button class="btn btn-warning update-status" data-id="${order._id}">Cambiar Estado</button>` : ""}
									<button class="btn btn-danger delete-order" data-id="${order._id}">Eliminar</button>
								</div>
							</li>
						`).join('')}
					</ul>
				` : `<p>No tienes órdenes registradas.</p>`}

				<div id="orderDetails" class="order-details"></div>
			</div>
		`;

		this.setupEventListeners();
	}

	setupEventListeners() {
		this.querySelectorAll(".view-details").forEach(button => {
			button.addEventListener("click", async (e) => {
				const id = e.target.dataset.id;
				await this.showOrderDetails(id);
			});
		});

		this.querySelectorAll(".delete-order").forEach(button => {
			button.addEventListener("click", async (e) => {
				const id = e.target.dataset.id;
				if (confirm("¿Seguro que quieres eliminar esta orden?")) {
					await this.deleteOrder(id);
				}
			});
		});

		if (this.userRole === "admin") {
			this.querySelectorAll(".update-status").forEach(button => {
				button.addEventListener("click", async (e) => {
					const id = e.target.dataset.id;
					const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
					const newStatus = prompt(`Ingresa nuevo estado (${validStatuses.join(", ")}):`);
					if (newStatus && validStatuses.includes(newStatus.toLowerCase())) {
						await this.updateOrderStatus(id, newStatus.toLowerCase());
					} else {
						Toast.warning("Estado inválido o cancelado");
					}
				});
			});
		}
	}

	async showOrderDetails(id) {
		try {
			const response = await orderService.getOrderById(id);
			const order = response.result?.data;
			const detailsEl = this.querySelector("#orderDetails");
			if (!order) {
				detailsEl.innerHTML = `<p>Orden no encontrada.</p>`;
				return;
			}

			detailsEl.innerHTML = `
				<h3>Detalles de la Orden ${order._id}</h3>
				<p><strong>Estado:</strong> ${order.status}</p>
				<p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
				<p><strong>Cantidad:</strong> ${order.quantity}</p>
				<p><strong>Notas:</strong> ${order.priceBreakdown?.calculationNotes || "N/A"}</p>
				<p><strong>Dirección:</strong> ${order.address?.name || "No especificada"}</p>
			`;
		} catch (error) {
			console.error(error);
			Toast.error("Error al obtener detalles de la orden");
		}
	}

	async deleteOrder(id) {
		try {
			await orderService.removeOrder(id);
			Toast.success("Orden eliminada exitosamente");
			await this.loadAndRenderOrders();
		} catch (error) {
			console.error(error);
			Toast.error("Error al eliminar la orden");
		}
	}

	async updateOrderStatus(id, status) {
		try {
			await orderService.updateOrderStatus(id, status);
			Toast.success("Estado actualizado exitosamente");
			await this.loadAndRenderOrders();
		} catch (error) {
			console.error(error);
			Toast.error("Error al actualizar estado");
		}
	}
}

customElements.define("orders-component", OrdersComponent);
