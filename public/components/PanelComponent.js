class PanelComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.innerHTML = `
			<h1>panel component pls</h1>
		`;
	}
}

customElements.define("panel-component", PanelComponent);
