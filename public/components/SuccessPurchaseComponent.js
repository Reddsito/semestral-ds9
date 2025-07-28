import { stripeService } from "../services/stripeService.js";

class SuccessPurchaseComponent extends HTMLElement {
	constructor() {
		super();
		this.sessionId = new URLSearchParams(window.location.search).get(
			"session_id",
		);
		this.session = null;
	}

	async connectedCallback() {
		const token = localStorage.getItem("token");
		if (!token) {
			this.innerHTML = `
              <div class="calculator-container">
                <div class="auth-required">
                  <h2>🔐 Autenticación Requerida</h2>
                  <p>Debes iniciar sesión para usar la calculadora de impresión 3D.</p>
                  <a href="/login" class="btn btn-primary">Iniciar Sesión</a>
                </div>
              </div>
            `;
			return;
		}
		await this.loadMetadata();
		this.render();
	}

	render() {
		this.innerHTML = `
            <link rel="stylesheet" href="/styles/checkout-response.css" />
            <div >
              <h2>Success</h2>
            </div>
          `;
	}

	async loadMetadata() {
		const session = await stripeService.getCheckoutSession(this.sessionId);
		console.log({ session });
		this.session = session;
	}
}

customElements.define("success-purchase-component", SuccessPurchaseComponent);
