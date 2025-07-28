import { Toast } from "../Toast.js";
import { authStore } from "../../stores/authStore.js";

class StatsTab extends HTMLElement {
	constructor() {
		super();
		this.stats = {};
		this.chartData = {};
	}

	connectedCallback() {
		this.render();
		this.loadStats();
		this.loadChartData();
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

                <div class="charts-section">
                    <div class="chart-container">
                        <h4>📈 Ventas por Semana</h4>
                        <canvas id="salesChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>📊 Estado de Pedidos</h4>
                        <canvas id="ordersChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="additional-stats">
                    <div class="storage-info">
                        <h4>💾 Información de Almacenamiento</h4>
                        <div class="storage-details">
                            <div class="storage-item">
                                <span class="storage-label">Total Archivos:</span>
                                <span class="storage-value" id="totalFiles">-</span>
                            </div>
                            <div class="storage-item">
                                <span class="storage-label">Espacio Usado:</span>
                                <span class="storage-value" id="totalSize">-</span>
                            </div>
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

	async loadChartData() {
		try {
			const response = await fetch("/api/v1/admin/chart-data", {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.chartData = data.result.data;
				this.renderCharts();
			} else {
				console.error("Error cargando datos de gráficas:", response.statusText);
			}
		} catch (error) {
			console.error("Error cargando datos de gráficas:", error);
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

		// Actualizar información de almacenamiento
		this.querySelector("#totalFiles").textContent = this.stats.total || 0;
		this.querySelector("#totalSize").textContent = this.formatFileSize(
			this.stats.totalSize || 0,
		);
	}

	renderCharts() {
		this.renderSalesChart();
		this.renderOrdersChart();
	}

	renderSalesChart() {
		const canvas = this.querySelector("#salesChart");
		const ctx = canvas.getContext("2d");

		// Limpiar canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (!this.chartData.salesData || this.chartData.salesData.length === 0) {
			ctx.fillStyle = "#666";
			ctx.font = "14px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"No hay datos de ventas",
				canvas.width / 2,
				canvas.height / 2,
			);
			return;
		}

		const data = this.chartData.salesData;
		const maxSales = Math.max(...data.map((d) => d.sales));
		const barWidth = canvas.width / data.length - 10;
		const maxBarHeight = canvas.height - 40;

		// Dibujar barras
		data.forEach((item, index) => {
			const barHeight = (item.sales / maxSales) * maxBarHeight;
			const x = index * (barWidth + 10) + 5;
			const y = canvas.height - barHeight - 20;

			// Barra
			ctx.fillStyle = "#4CAF50";
			ctx.fillRect(x, y, barWidth, barHeight);

			// Texto del valor
			ctx.fillStyle = "#333";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`$${item.sales.toFixed(2)}`, x + barWidth / 2, y - 5);

			// Etiqueta de semana
			ctx.fillText(item.week, x + barWidth / 2, canvas.height - 5);
		});
	}

	renderOrdersChart() {
		const canvas = this.querySelector("#ordersChart");
		const ctx = canvas.getContext("2d");

		// Limpiar canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (!this.chartData.ordersData || this.chartData.ordersData.length === 0) {
			ctx.fillStyle = "#666";
			ctx.font = "14px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"No hay datos de pedidos",
				canvas.width / 2,
				canvas.height / 2,
			);
			return;
		}

		const data = this.chartData.ordersData;
		const total = data.reduce((sum, item) => sum + item.count, 0);
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = Math.min(centerX, centerY) - 20;

		const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];
		let currentAngle = 0;

		data.forEach((item, index) => {
			const sliceAngle = (item.count / total) * 2 * Math.PI;
			const color = colors[index % colors.length];

			// Dibujar sector
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(
				centerX,
				centerY,
				radius,
				currentAngle,
				currentAngle + sliceAngle,
			);
			ctx.closePath();
			ctx.fillStyle = color;
			ctx.fill();

			// Etiqueta
			const labelAngle = currentAngle + sliceAngle / 2;
			const labelX = centerX + (radius + 20) * Math.cos(labelAngle);
			const labelY = centerY + (radius + 20) * Math.sin(labelAngle);

			ctx.fillStyle = "#333";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`${item.status}: ${item.count}`, labelX, labelY);

			currentAngle += sliceAngle;
		});
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
