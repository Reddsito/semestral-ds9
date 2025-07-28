import { api } from "../lib/api.js";
import { orderService } from "../services/orderServices.js";

class OrdersComponent extends HTMLElement {
	constructor() {
		super();
		this.orders = [];
	}

	async connectedCallback() {
		const token = localStorage.getItem("token");
		if (!token) {
			this.innerHTML = `
        <div class="calculator-container">
          <div class="auth-required">
            <h2>🔐 Autenticación Requerida</h2>
            <p>Debes iniciar sesión para ver esta página.</p>
            <a href="/login" class="btn btn-primary">Iniciar Sesión</a>
          </div>
        </div>
      `;
			return;
		}
		await this.loadOrders();
		this.render();
	}

	render() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout-response.css" />
      <div class="checkout-response">
        <h2>Órdenes</h2>
        <div class="orders-list">
          ${
						this.orders.length > 0
							? this.orders
									.map(
										(order) => `
            <div class="order-item">  
              <h3>Orden #${order.orderNumber}</h3>
            
            </div>
          `,
									)
									.join("")
							: "<p>No hay órdenes disponibles.</p>"
					} 
      </div>
    `;
	}

	async loadOrders() {
		const response = await orderService.getAllOrders();

		this.orders = response.result.data;
		this.render();
	}
}

customElements.define("orders-component", OrdersComponent);
