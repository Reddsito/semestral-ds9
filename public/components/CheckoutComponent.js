import { checkoutStore } from "../stores/checkoutStore.js";
import { stripeService } from "../services/stripeService.js";
import { addressesService } from "../services/addressesService.js";

class CheckoutComponent extends HTMLElement {
	constructor() {
		super();
		this.unsubscribe = null;
		this.quote = null;
		this.addresses = [];
		this.selectedAddressId = null;
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
	}

	render() {
		const hasAddresses = this.addresses.length > 0;

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
					hasAddresses
						? this.addresses
								.map(
									(address) => `
										<li class="address-item" data-id="${address.id}">
											<label>
												<input type="radio" name="address" value="${address.id}" ${
										address.id === this.selectedAddressId ? "checked" : ""
									}/>
												${address.name}
											</label>
										</li>
									`,
								)
								.join("")
						: "<li>No hay direcciones disponibles.</li>"
				}
			</ul>
		</section>

		<div class="actions">
			<button id="checkoutButton" class="btn btn-primary" ${
				!hasAddresses || !this.selectedAddressId ? "disabled" : ""
			}>
				💳 Pagar ahora
			</button>
		</div>
	</div>
	`;

		this.setupEventListeners(); // 👈 volver a enlazar eventos después de renderizar
	}

	setupEventListeners() {
		const checkoutButton = this.querySelector("#checkoutButton");
		if (checkoutButton) {
			checkoutButton.addEventListener("click", () => {
				if (!this.selectedAddressId) return;

				stripeService.createCheckoutSession({
					...this.quote,
					sessionId: Math.random().toString(36).substring(2),
					addressId: this.selectedAddressId,
				});
			});
		}
		this.setupAddressSelectionListeners();

		// Asegurar que el botón tenga el estado correcto inicialmente
		this.updateCheckoutButton();
	}

	setupAddressSelectionListeners() {
		const listItems = this.querySelectorAll(".address-item");

		listItems.forEach((li) => {
			li.addEventListener("click", (e) => {
				const radio = li.querySelector('input[type="radio"]');
				if (radio) {
					radio.checked = true;
					this.selectedAddressId = radio.value;

					// En lugar de hacer re-render completo, solo actualizar el botón
					this.updateCheckoutButton();
				}
			});
		});
	}

	updateCheckoutButton() {
		const checkoutButton = this.querySelector("#checkoutButton");
		if (checkoutButton) {
			const hasAddresses = this.addresses.length > 0;
			const hasSelectedAddress = this.selectedAddressId;

			// Habilitar/deshabilitar el botón según el estado
			checkoutButton.disabled = !hasAddresses || !hasSelectedAddress;

			// Actualizar clases visuales si es necesario
			if (checkoutButton.disabled) {
				checkoutButton.classList.add("disabled");
			} else {
				checkoutButton.classList.remove("disabled");
			}
		}
	}

	async loadAddresses() {
		const addresses = await addressesService.getAllAddresses();
		this.addresses = addresses.data.addresses;
		if (this.addresses.length > 0) {
			this.selectedAddressId =
				addresses.data.addresses.find((address) => address.isDefault)?.id ||
				this.addresses[0].id;
		}

		console.log(this.addresses);
		console.log(this.selectedAddressId);
	}
}

customElements.define("checkout-component", CheckoutComponent);
