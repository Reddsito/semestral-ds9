import { Toast } from "../Toast.js";
import { authStore } from "../../stores/authStore.js";

class StatsTab extends HTMLElement {
	constructor() {
		super();
		this.stats = {};
	}

	connectedCallback() {
		this.render();
		this.loadStats();
	}

	render() {
		this.innerHTML = `
            <div class="stats-tab">
                <div class="stats-header">
                    <h3>📊 Estadísticas del Sistema</h3>
                    <button id="refreshStats" class="btn btn-primary">🔄 Actualizar</button>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">📦</div>
                        <div class="metric-content">
                            <h4>Total Pedidos</h4>
                            <p id="totalOrders">-</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">💰</div>
                        <div class="metric-content">
                            <h4>Ventas Totales</h4>
                            <p id="totalSales">-</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">👥</div>
                        <div class="metric-content">
                            <h4>Usuarios Activos</h4>
                            <p id="activeUsers">-</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📋</div>
                        <div class="metric-content">
                            <h4>Total Cotizaciones</h4>
                            <p id="totalQuotes">-</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">✅</div>
                        <div class="metric-content">
                            <h4>Cotizaciones Aceptadas</h4>
                            <p id="acceptedQuotes">-</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">❌</div>
                        <div class="metric-content">
                            <h4>Cotizaciones Rechazadas</h4>
                            <p id="rejectedQuotes">-</p>
                        </div>
                    </div>
                </div>

     
            </div>
        `;
		this.setupEventListeners();
	}

	setupEventListeners() {
		this.querySelector("#refreshStats").addEventListener("click", () => {
			this.loadStats();
			this.loadChartData();
		});
	}

	async loadStats() {
		try {
			const response = await fetch("/api/v1/admin/stats", {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.stats = data.result.data;
				this.displayStats();
			} else {
				console.error("Error cargando estadísticas:", response.statusText);
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
		}
	}

	displayStats() {
		// Actualizar métricas principales
		this.querySelector("#totalOrders").textContent =
			this.stats.totalOrders || 0;
		this.querySelector("#totalSales").textContent = `$${(
			this.stats.totalSales || 0
		).toFixed(2)}`;
		this.querySelector("#activeUsers").textContent =
			this.stats.activeUsers || 0;
		this.querySelector("#totalQuotes").textContent =
			this.stats.totalQuotes || 0;
		this.querySelector("#acceptedQuotes").textContent =
			this.stats.acceptedQuotes || 0;
		this.querySelector("#rejectedQuotes").textContent =
			this.stats.rejectedQuotes || 0;
	}

	formatFileSize(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
}

customElements.define("stats-tab", StatsTab);
