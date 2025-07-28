import { orderService } from "../services/orderServices.js";
import { stripeService } from "../services/stripeService.js";

class SuccessPurchaseComponent extends HTMLElement {
	constructor() {
		super();
		this.sessionId = new URLSearchParams(window.location.search).get(
			"session_id",
		);
		this.session = null;
		this.order = null;
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

		this.renderLoading();

		try {
			await this.loadMetadata();
			this.renderSuccess();
		} catch (err) {
			console.error("Error creando orden:", err);
			this.renderError();
		}
	}

	renderLoading() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout-response.css" />
      <div class="checkout-response">
        <h2>⏳ Procesando tu compra...</h2>
        <p>No cierres esta página. Estamos creando tu orden.</p>
      </div>
    `;
	}

	renderSuccess() {
		const realOrderNumber =
			this.order.orderNumber < 10
				? this.order.orderNumber + 5
				: this.order.orderNumber + 4;

		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout-response.css" />
      <div class="checkout-response">
        <h2>✅ ¡Orden creada exitosamente!</h2>
        <p>Tu número de orden es: <strong>#${realOrderNumber}</strong></p>
        <p>Gracias por tu compra. Pronto recibirás más información por correo electrónico.</p>
        <a href="/" class="btn btn-primary">Volver al inicio</a>
      </div>
    `;
	}

	renderError() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout-response.css" />
      <div class="checkout-response">
        <h2>❌ Ocurrió un error</h2>
        <p>No pudimos crear tu orden. Por favor, intenta de nuevo más tarde o contáctanos.</p>
        <a href="/" class="btn btn-primary">Volver al inicio</a>
      </div>
    `;
	}

	async loadMetadata() {
		const session = await stripeService.getCheckoutSession(this.sessionId);
		this.session = session.result.data;

		const response = await orderService.createOrder(this.session.metadata);
		this.order = response.result.data;
	}
}

customElements.define("success-purchase-component", SuccessPurchaseComponent);
