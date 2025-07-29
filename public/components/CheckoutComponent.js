import { checkoutStore } from "../stores/checkoutStore.js";
import { stripeService } from "../services/stripeService.js";
import { addressesService } from "../services/addressesService.js";
import { navigate } from "../services/router.js";

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
        <div class="checkout-container">
          <div class="auth-required">
            <div class="auth-card">
              <div class="auth-icon">🔐</div>
              <h2>Autenticación Requerida</h2>
              <p>Debes iniciar sesión para completar tu compra.</p>
              <a href="/login" class="btn btn-primary">Iniciar Sesión</a>
            </div>
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
		const hasSelected = !!this.selectedAddressId;

		this.innerHTML = `
		<link rel="stylesheet" href="/styles/checkout.css" />
		<div class="checkout-container">
			<div class="checkout-header">
				<div class="checkout-icon">🛒</div>
				<h2>Finalizar Compra</h2>
				<p class="checkout-subtitle">Revisa los detalles y selecciona tu dirección de envío</p>
			</div>
	
			<div class="checkout-content">
				<section class="quote-summary">
					<div class="summary-header">
						<h3>📋 Resumen de tu Cotización</h3>
					</div>
					<div class="summary-content">
						<div class="summary-item">
							<span class="label">Precio Total:</span>
							<span class="value price">$${this.quote.totalPrice?.toFixed(2) ?? "0.00"}</span>
						</div>
						<div class="summary-item">
							<span class="label">Cantidad:</span>
							<span class="value">${this.quote.quantity ?? 1} unidad(es)</span>
						</div>
				
						${
							this.quote.notes
								? `
						<div class="summary-item notes">
							<span class="label">Notas:</span>
							<span class="value">${this.quote.notes}</span>
						</div>
						`
								: ""
						}
					</div>
				</section>
	
				<section class="addresses-section">
					<div class="section-header">
						<h3>🏠 Dirección de Envío</h3>
						<p class="section-subtitle">Selecciona dónde quieres recibir tu pedido</p>
					</div>
					
					<div class="addresses-grid">
						${
							hasAddresses
								? this.addresses
										.map(
											(address) => `
												<div class="address-card ${
													address.id === this.selectedAddressId
														? "selected"
														: ""
												}" data-id="${address.id}">
													<div class="address-radio">
														<input type="radio" name="address" value="${address.id}" ${
												address.id === this.selectedAddressId ? "checked" : ""
											}/>
														<div class="radio-custom"></div>
													</div>
													<div class="address-content">
														<div class="address-name">${address.name}</div>
														<div class="address-details">
															${address.notes}
													
														</div>
														${address.isDefault ? '<span class="default-badge">Predeterminada</span>' : ""}
													</div>
												</div>
											`,
										)
										.join("")
								: `
									<div class="no-addresses">
										<div class="no-addresses-icon">📍</div>
										<h4>No tienes direcciones guardadas</h4>
										<p>Necesitas agregar una dirección para continuar con tu compra</p>
										<button class="btn btn-secondary" id="createAddressBtn">
											<span class="btn-icon">➕</span>
											Crear Nueva Dirección
										</button>
									</div>
								`
						}
					</div>
					
					${
						hasAddresses && !hasSelected
							? `<div class="address-warning">
									<div class="warning-icon">⚠️</div>
									<p>Por favor, selecciona una dirección para continuar</p>
								</div>`
							: ""
					}
				</section>
			</div>
	
			<div class="checkout-footer">
				<div class="total-section">
					<div class="total-label">Total a Pagar:</div>
					<div class="total-amount">$${this.quote.totalPrice?.toFixed(2) ?? "0.00"}</div>
				</div>
				<button id="checkoutButton" class="btn btn-primary checkout-btn" ${
					!hasAddresses || !hasSelected ? "disabled" : ""
				}>
					<span class="btn-icon">💳</span>
					${!hasSelected ? "Selecciona una dirección" : "Pagar Ahora"}
				</button>
			</div>
		</div>
		`;

		this.setupEventListeners();
	}

	setupEventListeners() {
		const checkoutButton = this.querySelector("#checkoutButton");
		if (checkoutButton) {
			checkoutButton.addEventListener("click", () => {
				if (!this.selectedAddressId) return;

				// Add loading state
				checkoutButton.disabled = true;
				checkoutButton.innerHTML =
					'<span class="btn-icon">⏳</span>Procesando...';

				stripeService.createCheckoutSession({
					...this.quote,
					sessionId: Math.random().toString(36).substring(2),
					addressId: this.selectedAddressId,
				});
			});
		}

		this.setupAddressSelectionListeners();
		this.updateCheckoutButton();

		const createAddressBtn = this.querySelector("#createAddressBtn");
		if (createAddressBtn) {
			createAddressBtn.addEventListener("click", () => {
				navigate("/profile/addresses");
			});
		}
	}

	setupAddressSelectionListeners() {
		const addressCards = this.querySelectorAll(".address-card");

		addressCards.forEach((card) => {
			card.addEventListener("click", (e) => {
				const radio = card.querySelector('input[type="radio"]');
				if (radio) {
					// Remove selected class from all cards
					addressCards.forEach((c) => c.classList.remove("selected"));

					// Add selected class to clicked card
					card.classList.add("selected");

					radio.checked = true;
					this.selectedAddressId = radio.value;

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

			checkoutButton.disabled = !hasAddresses || !hasSelectedAddress;

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
			console.log(this.addresses);
			this.selectedAddressId =
				addresses.data.addresses.find((address) => address.isDefault)?.id ||
				this.addresses[0].id;
		}

		console.log(this.addresses);
		console.log(this.selectedAddressId);
	}
}

customElements.define("checkout-component", CheckoutComponent);
