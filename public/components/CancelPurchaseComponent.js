import { navigate } from "../services/router.js";

class CancelPurchaseComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
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
		this.render();
	}

	render() {
		this.innerHTML = `
      <link rel="stylesheet" href="/styles/checkout.css" />
      <div class="success-container">
        <div class="success-card cancel">
          <div class="cancel-icon">
            <div class="cancel-mark">✗</div>
          </div>
          <h2>❌ Compra Cancelada</h2>
          <p class="cancel-subtitle">Tu proceso de compra ha sido cancelado</p>
          
          <div class="cancel-message">
            <p>No te preocupes, no se ha realizado ningún cargo a tu cuenta.</p>
            <p>Puedes intentar nuevamente cuando estés listo para completar tu compra.</p>
          </div>
          
          <div class="cancel-actions">
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
		const retryBtn = this.querySelector("#retryBtn");
		if (retryBtn) {
			retryBtn.addEventListener("click", () => {
				navigate("/calculator");
			});
		}

		const homeBtn = this.querySelector("#homeBtn");
		if (homeBtn) {
			homeBtn.addEventListener("click", () => {
				navigate("/");
			});
		}
	}
}

customElements.define("cancel-purchase-component", CancelPurchaseComponent);
