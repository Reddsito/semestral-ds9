import { Toast } from "./Toast.js";
import { authStore } from "../stores/authStore.js";

class PanelComponent extends HTMLElement {
	constructor() {
		super();
		this.currentTab = "stats";
		this.stats = null;
	}

	connectedCallback() {
		// Verificar que el usuario sea admin
		const user = authStore.getUser();
		if (!user || user.role !== "admin") {
			this.innerHTML = `
				<div class="admin-container">
					<div class="admin-header">
						<h2>🚫 Acceso Denegado</h2>
						<p>No tienes permisos para acceder al panel de administración.</p>
						<a href="/" class="btn btn-primary">Volver al Inicio</a>
					</div>
				</div>
			`;
			return;
		}

		this.render();
		this.setupEventListeners();
		this.loadStats();
	}

	render() {
		this.innerHTML = `
		<link rel="stylesheet" href="/styles/admin.css" />
			<div class="admin-container">
				<div class="admin-header">
					<h2>🔧 Panel de Administración</h2>
					<p>Gestión completa del sistema</p>
				</div>

				<!-- Tabs Navigation -->
				<div class="tabs-container">
					<div class="tabs-nav">
						<button class="tab-btn ${
							this.currentTab === "stats" ? "active" : ""
						}" data-tab="stats">
							📊 Estadísticas
						</button>
						<button class="tab-btn ${
							this.currentTab === "orders" ? "active" : ""
						}" data-tab="orders">
							📦 Pedidos
						</button>
						<button class="tab-btn ${
							this.currentTab === "quotes" ? "active" : ""
						}" data-tab="quotes">
							📋 Cotizaciones
						</button>
						<button class="tab-btn ${
							this.currentTab === "storage" ? "active" : ""
						}" data-tab="storage">
							💾 Almacenamiento
						</button>
						<button class="tab-btn ${
							this.currentTab === "users" ? "active" : ""
						}" data-tab="users">
							👥 Usuarios
						</button>
					</div>

					<!-- Tab Content -->
					<div class="tab-content">
						<div id="stats-tab" class="tab-pane ${
							this.currentTab === "stats" ? "active" : ""
						}">
							<stats-tab></stats-tab>
						</div>
						<div id="orders-tab" class="tab-pane ${
							this.currentTab === "orders" ? "active" : ""
						}">
							<orders-tab></orders-tab>
						</div>
						<div id="quotes-tab" class="tab-pane ${
							this.currentTab === "quotes" ? "active" : ""
						}">
							<quotes-tab></quotes-tab>
						</div>
						<div id="storage-tab" class="tab-pane ${
							this.currentTab === "storage" ? "active" : ""
						}">
							<storage-tab></storage-tab>
						</div>
						<div id="users-tab" class="tab-pane ${
							this.currentTab === "users" ? "active" : ""
						}">
							<users-tab></users-tab>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	setupEventListeners() {
		// Event listeners para tabs
		this.querySelectorAll(".tab-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const tabName = e.target.dataset.tab;
				this.switchTab(tabName);
			});
		});
	}

	switchTab(tabName) {
		// Actualizar botones
		this.querySelectorAll(".tab-btn").forEach((btn) => {
			btn.classList.remove("active");
		});
		this.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

		// Actualizar contenido
		this.querySelectorAll(".tab-pane").forEach((pane) => {
			pane.classList.remove("active");
		});
		this.querySelector(`#${tabName}-tab`).classList.add("active");

		this.currentTab = tabName;
	}

	async loadStats() {
		try {
			const token = authStore.getToken();
			if (!token) {
				Toast.error("No hay token de autenticación");
				return;
			}

			const response = await fetch("/api/v1/admin/stats", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			if (data.success) {
				this.stats = data.result.data;
			} else {
				Toast.error("Error cargando estadísticas: " + data.message);
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
		}
	}
}

customElements.define("panel-component", PanelComponent);
