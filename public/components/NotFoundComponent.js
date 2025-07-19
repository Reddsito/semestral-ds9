import { router } from "../services/router.js";

class NotFoundComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.render();
		this.attachEventListeners();
	}

	render() {
		this.innerHTML = `
			<div class="error-page">
				<div class="error-content">
					<h1>404</h1>
					<h2>Página no encontrada</h2>
					<p>La página que buscas no existe o ha sido movida.</p>
					<button class="btn btn-primary" id="go-home">
						🏠 Volver al inicio
					</button>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const goHomeButton = this.querySelector("#go-home");
		goHomeButton.addEventListener("click", () => {
			router.navigate("/");
		});
	}
}

customElements.define("not-found-component", NotFoundComponent);
