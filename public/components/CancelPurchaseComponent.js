class CancelPurchaseComponent extends HTMLElement {
	constructor() {
		super();
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
		this.render();
	}

	render() {
		this.innerHTML = `
            <link rel="stylesheet" href="/styles/checkout-response.css" />
            <div >
              <h2>Cancel</h2>
            </div>
          `;
	}
}

customElements.define("cancel-purchase-component", CancelPurchaseComponent);
