import { checkoutStore } from "../stores/checkoutStore.js";

class CheckoutComponent extends HTMLElement {
	constructor() {
		super();
		this.unsubscribe = null;
		this.quote = null;
	}

	connectedCallback() {
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
		this.quote = checkoutStore.getState();
		this.render();
		this.setupEventListeners();
	}

	render() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout.css" />
      <div class="checkout-container">
        <h2>🛒 Proceso de Checkout</h2>
      <p id="checkoutObject">${JSON.stringify(this.quote)}</p>
      </div>
    `;
	}

	setupEventListeners() {
		console.log(this.quote);
	}
}

customElements.define("checkout-component", CheckoutComponent);
