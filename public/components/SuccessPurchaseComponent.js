import { orderService } from "../services/orderServices.js";
import { stripeService } from "../services/stripeService.js";
import { navigate } from "../services/router.js";

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
        <div class="success-container">
          <div class="auth-required">
            <div class="auth-card">
              <div class="auth-icon">🔐</div>
              <h2>Autenticación Requerida</h2>
              <p>Debes iniciar sesión para ver esta página.</p>
              <a href="/login" class="btn btn-primary">Iniciar Sesión</a>
            </div>
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
      <link rel="stylesheet" href="/styles/checkout.css" />
      <div class="success-container">
        <div class="success-card loading">
          <div class="loading-animation">
            <div class="spinner"></div>
          </div>
          <h2>⏳ Procesando tu compra...</h2>
          <p class="loading-text">No cierres esta página. Estamos creando tu orden.</p>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
	}

	renderSuccess() {
		const realOrderNumber =
			this.order.orderNumber < 10
				? this.order.orderNumber + 5
				: this.order.orderNumber + 4;

		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout.css" />
      <div class="success-container">
        <div class="success-card">
          <div class="success-icon">
            <div class="checkmark">✓</div>
          </div>
          <h2>¡Compra Exitosa!</h2>
          <p class="success-subtitle">Tu orden ha sido creada correctamente</p>
          
          <div class="order-details">
            <div class="order-number">
              <span class="label">Número de Orden:</span>
              <span class="value">#${realOrderNumber}</span>
            </div>
            <div class="order-amount">
              <span class="label">Total Pagado:</span>
              <span class="value">$${
								this.order.totalPrice?.toFixed(2) || "0.00"
							}</span>
            </div>
          </div>
          
          <div class="success-message">
            <p>🎉 ¡Gracias por tu compra!</p>
            <p>Pronto recibirás más información por correo electrónico.</p>
            <p>Puedes hacer seguimiento de tu orden en la sección de pedidos.</p>
          </div>
          
          <div class="success-actions">
            <button class="btn btn-primary" id="viewOrdersBtn">
              <span class="btn-icon">📋</span>
              Ver Mis Pedidos
            </button>
            <button class="btn btn-secondary" id="homeBtn">
              <span class="btn-icon">🏠</span>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    `;

		this.setupEventListeners();
	}

	renderError() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout.css" />
      <div class="success-container">
        <div class="success-card error">
          <div class="error-icon">
            <div class="error-mark">✗</div>
          </div>
          <h2>❌ Ocurrió un Error</h2>
          <p class="error-subtitle">No pudimos procesar tu compra</p>
          
          <div class="error-message">
            <p>Lo sentimos, hubo un problema al crear tu orden.</p>
            <p>Por favor, intenta de nuevo más tarde o contáctanos si el problema persiste.</p>
          </div>
          
          <div class="error-actions">
            <button class="btn btn-primary" id="retryBtn">
              <span class="btn-icon">🔄</span>
              Intentar de Nuevo
            </button>
            <button class="btn btn-secondary" id="homeBtn">
              <span class="btn-icon">🏠</span>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    `;

		this.setupEventListeners();
	}

	setupEventListeners() {
		const viewOrdersBtn = this.querySelector("#viewOrdersBtn");
		if (viewOrdersBtn) {
			viewOrdersBtn.addEventListener("click", () => {
				navigate("/orders");
			});
		}

		const homeBtn = this.querySelector("#homeBtn");
		if (homeBtn) {
			homeBtn.addEventListener("click", () => {
				navigate("/");
			});
		}

		const retryBtn = this.querySelector("#retryBtn");
		if (retryBtn) {
			retryBtn.addEventListener("click", () => {
				window.location.reload();
			});
		}
	}

	async loadMetadata() {
		const session = await stripeService.getCheckoutSession(this.sessionId);
		this.session = session.result.data;

		const response = await orderService.createOrder({
			...this.session.metadata,
			paymentIntentId: this.session.payment_intent.id,
		});
		this.order = response.result.data;
	}
}

customElements.define("success-purchase-component", SuccessPurchaseComponent);
