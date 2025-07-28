import { checkoutStore } from "../stores/checkoutStore.js";
import { stripeService } from "../services/stripeService.js";
import { addressesService } from "../services/addressesService.js";

class CheckoutComponent extends HTMLElement {
	constructor() {
		super();
		this.unsubscribe = null;
		this.quote = null;
		this.addresses = [];
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
		this.quote = checkoutStore.getState();
		await this.loadAddresses();
		this.render();
		this.setupEventListeners();
	}

	render() {
		this.innerHTML = `
		<link rel="stylesheet" href="/styles/checkout.css" />
		<div class="checkout-container">
			<h2>🛒 Proceso de Checkout</h2>

			<section class="quote-info">
				<h3>🧾 Detalles de la Cotización</h3>
				<ul>
					<li><strong>Precio total:</strong> $${
						this.quote.totalPrice?.toFixed(2) ?? "0.00"
					}</li>
					<li><strong>Cantidad:</strong> ${this.quote.quantity ?? 1}</li>
					<li><strong>Estado:</strong> ${this.quote.status ?? "N/A"}</li>
					<li><strong>Notas:</strong> ${this.quote.notes || "Sin notas"}</li>
				</ul>
			</section>

			<section class="addresses-container">
				<h3>🏠 Direcciones de Envío</h3>
				<ul id="addressesList">
					${
						this.addresses.length > 0
							? this.addresses
									.map(
										(address) =>
											`<li class="address-item">${address.name}</li>`,
									)
									.join("")
							: "<li>Cargando direcciones...</li>"
					}
				</ul>
			</section>

			<div class="actions">
				<button id="checkoutButton" class="btn btn-primary">💳 Pagar ahora</button>
			</div>
		</div>
	`;
	}

	setupEventListeners() {
		const checkoutButton = this.querySelector("#checkoutButton");
		checkoutButton.addEventListener("click", () => {
			stripeService.createCheckoutSession({
				...this.quote,
				sessionId: Math.random().toString(36).substring(2),
			});
		});
	}

	async loadAddresses() {
		const addresses = await addressesService.getAllAddresses();
		this.addresses = addresses.data.addresses;
	}
}

customElements.define("checkout-component", CheckoutComponent);
