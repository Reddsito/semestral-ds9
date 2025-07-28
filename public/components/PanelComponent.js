import { Toast } from "./Toast.js";
import { authStore } from "../stores/authStore.js";
import { navigate } from "../services/router.js";

class PanelComponent extends HTMLElement {
	constructor() {
		super();
		this.stats = null;
		this.tempFiles = [];
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
		this.loadStats();
		this.loadTempFiles();
		this.loadQuotes();
	}

	render() {
		this.innerHTML = `
		<link rel="stylesheet" href="/styles/admin.css" />
			<div class="admin-container">
				<div class="admin-header">
					<h2>🔧 Panel de Administración</h2>
					<p>Gestión de archivos, estadísticas del sistema y limpieza automática</p>
					<div class="admin-info">
						<p><strong>📋 Información del Sistema:</strong></p>
						<ul>
							<li>📁 <strong>Cotizaciones:</strong> Archivos temporales para cotización (se eliminan automáticamente)</li>
							<li>📦 <strong>Pedidos:</strong> Archivos convertidos en órdenes reales</li>
							<li>✅ <strong>Completados:</strong> Pedidos finalizados</li>
							<li>❌ <strong>Cancelados:</strong> Pedidos cancelados</li>
							<li>🧹 <strong>Limpieza:</strong> Se ejecuta automáticamente cada hora</li>
						</ul>
					</div>
					<!-- Botón para ver órdenes -->
					<div class="orders-section" style="margin-top: 20px;">
					<button id="btnViewOrders" class="btn btn-success">📦 Ver Órdenes</button>
					</div>
				</div>

				<!-- Estadísticas -->
				<div class="stats-section">
					<h3>📊 Estadísticas del Sistema</h3>
					<div id="statsGrid" class="stats-grid">
						<div class="stat-card">
							<div class="stat-number" id="totalFiles">-</div>
							<div class="stat-label">Total Archivos</div>
						</div>
						<div class="stat-card">
							<div class="stat-number" id="quotationFiles">-</div>
							<div class="stat-label">Cotizaciones</div>
						</div>
						<div class="stat-card">
							<div class="stat-number" id="orderedFiles">-</div>
							<div class="stat-label">Pedidos</div>
						</div>
						<div class="stat-card">
							<div class="stat-number" id="completedFiles">-</div>
							<div class="stat-label">Completados</div>
						</div>
						<div class="stat-card">
							<div class="stat-number" id="cancelledFiles">-</div>
							<div class="stat-label">Cancelados</div>
						</div>
						<div class="stat-card">
							<div class="stat-number" id="storageUsed">-</div>
							<div class="stat-label">Espacio Usado</div>
						</div>
					</div>
					<button id="refreshStats" class="btn btn-primary">🔄 Actualizar Estadísticas</button>
				</div>

				<!-- Acciones de Limpieza -->
				<div class="cleanup-section">
					<h3>🧹 Limpieza de Archivos</h3>
					<div class="cleanup-actions">
						<button id="cleanupAll" class="btn btn-warning">🗑️ Limpiar Cotizaciones Antiguas</button>
						<button id="refreshFiles" class="btn btn-secondary">🔄 Actualizar Lista</button>
					</div>
				</div>

				<!-- Lista de Archivos de Cotización -->
				<div class="files-section">
					<h3>📁 Archivos de Cotización</h3>
					<div id="tempFilesList" class="files-list">
						<div class="loading">Cargando archivos...</div>
					</div>
				</div>

				<!-- Gestión de Cotizaciones -->
				<div class="quotes-section">
					<h3>📋 Gestión de Cotizaciones</h3>
					<div class="quotes-filters">
						<div class="filter-group">
							<label for="statusFilter">Estado:</label>
							<select id="statusFilter" class="form-select">
								<option value="">Todos</option>
								<option value="active">Activas</option>
								<option value="expired">Expiradas</option>
							</select>
						</div>
						<div class="filter-group">
							<label for="dateFromFilter">Desde:</label>
							<input type="date" id="dateFromFilter" class="form-input">
						</div>
						<div class="filter-group">
							<label for="dateToFilter">Hasta:</label>
							<input type="date" id="dateToFilter" class="form-input">
						</div>
						<button id="applyFilters" class="btn btn-primary">🔍 Aplicar Filtros</button>
						<button id="clearFilters" class="btn btn-secondary">🗑️ Limpiar</button>
					</div>
					<div id="quotesList" class="quotes-list">
						<div class="loading">Cargando cotizaciones...</div>
					</div>
					<div class="quotes-actions">
						<button id="cleanupExpiredQuotes" class="btn btn-warning">⏰ Limpiar Cotizaciones Expiradas</button>
					</div>
				</div>
			</div>
		`;

		this.setupEventListeners();
	}

	setupEventListeners() {
		// Botón actualizar estadísticas
		this.querySelector("#refreshStats").addEventListener("click", () => {
			this.loadStats();
		});

		// Botón limpiar todos
		this.querySelector("#cleanupAll").addEventListener("click", () => {
			this.cleanupAllFiles();
		});

		// Botón actualizar lista
		this.querySelector("#refreshFiles").addEventListener("click", () => {
			this.loadTempFiles();
		});

		// Eventos para gestión de cotizaciones
		this.querySelector("#applyFilters").addEventListener("click", () => {
			this.loadQuotes();
		});

		this.querySelector("#clearFilters").addEventListener("click", () => {
			this.clearFilters();
		});

		this.querySelector("#cleanupExpiredQuotes").addEventListener(
			"click",
			() => {
				this.cleanupExpiredQuotes();
			},
		);
		this.querySelector("#btnViewOrders").addEventListener(
			"click", 
			() => {
				navigate("/orders");
			});
	}

	async loadStats() {
		try {
			const token = authStore.getToken();
			console.log("Token disponible:", !!token);

			if (!token) {
				Toast.error("No hay token de autenticación. Por favor, inicia sesión.");
				return;
			}

			const response = await fetch("/api/v1/admin/stats", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("Response status:", response.status);

			const data = await response.json();
			console.log("Response data:", data);

			if (data.success) {
				this.stats = data.result.data;
				this.displayStats();
			} else {
				Toast.error("Error cargando estadísticas: " + data.message);
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
		}
	}

	displayStats() {
		if (!this.stats) return;

		this.querySelector("#totalFiles").textContent = this.stats.total;
		this.querySelector("#quotationFiles").textContent = this.stats.quotation;
		this.querySelector("#orderedFiles").textContent = this.stats.ordered;
		this.querySelector("#completedFiles").textContent = this.stats.completed;
		this.querySelector("#cancelledFiles").textContent = this.stats.cancelled;
		this.querySelector(
			"#storageUsed",
		).textContent = `${this.stats.storageUsed.mb} MB`;
	}

	async loadTempFiles() {
		try {
			const token = authStore.getToken();

			if (!token) {
				Toast.error("No hay token de autenticación. Por favor, inicia sesión.");
				return;
			}

			const response = await fetch("/api/v1/admin/temp-files", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("Temp files response status:", response.status);

			const data = await response.json();
			console.log("Temp files response data:", data);

			if (data.success) {
				this.tempFiles = data.result.data.files;
				this.displayTempFiles();
			} else {
				Toast.error("Error cargando archivos temporales: " + data.message);
			}
		} catch (error) {
			console.error("Error cargando archivos temporales:", error);
			Toast.error("Error cargando archivos temporales");
		}
	}

	displayTempFiles() {
		const container = this.querySelector("#tempFilesList");

		if (this.tempFiles.length === 0) {
			container.innerHTML =
				'<div class="no-files">No hay archivos temporales</div>';
			return;
		}

		container.innerHTML = this.tempFiles
			.map(
				(file) => `
			<div class="file-item">
				<div class="file-info">
					<div class="file-name">${file.originalName}</div>
					<div class="file-details">
						<span>Usuario: ${file.userId?.email || "N/A"}</span>
						<span>Tamaño: ${this.formatFileSize(file.fileSize)}</span>
						<span>Subido: ${new Date(file.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
				<div class="file-actions">
					<button class="btn btn-danger btn-sm" onclick="this.deleteFile('${file._id}')">
						🗑️ Eliminar
					</button>
				</div>
			</div>
		`,
			)
			.join("");

		// Agregar event listeners para botones de eliminar
		container.querySelectorAll(".btn-danger").forEach((btn, index) => {
			btn.addEventListener("click", () => {
				this.deleteFile(this.tempFiles[index]._id);
			});
		});
	}

	async deleteFile(fileId) {
		if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) {
			return;
		}

		try {
			const response = await fetch(`/api/v1/admin/files/${fileId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				Toast.success("Archivo eliminado exitosamente");
				this.loadTempFiles();
				this.loadStats();
			} else {
				Toast.error("Error eliminando archivo");
			}
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			Toast.error("Error eliminando archivo");
		}
	}

	async cleanupAllFiles() {
		if (
			!confirm(
				"¿Estás seguro de que quieres limpiar todas las cotizaciones antiguas (más de 7 días)? Esta acción no se puede deshacer.",
			)
		) {
			return;
		}

		try {
			const response = await fetch("/api/v1/admin/cleanup", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				Toast.success("Limpieza completada exitosamente");
				this.loadTempFiles();
				this.loadStats();
			} else {
				Toast.error("Error en la limpieza");
			}
		} catch (error) {
			console.error("Error en limpieza:", error);
			Toast.error("Error en la limpieza");
		}
	}

	formatFileSize(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	// Métodos para gestión de cotizaciones
	async loadQuotes() {
		try {
			const token = authStore.getToken();
			if (!token) {
				Toast.error("No hay token de autenticación");
				return;
			}

			const statusFilter = this.querySelector("#statusFilter").value;
			const dateFromFilter = this.querySelector("#dateFromFilter").value;
			const dateToFilter = this.querySelector("#dateToFilter").value;

			let url = "/api/v1/quotes/admin/all?page=1&limit=20";
			if (statusFilter) url += `&status=${statusFilter}`;
			if (dateFromFilter) url += `&dateFrom=${dateFromFilter}`;
			if (dateToFilter) url += `&dateTo=${dateToFilter}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				this.displayQuotes(data.result.data.quotes);
			} else {
				Toast.error("Error cargando cotizaciones: " + data.message);
			}
		} catch (error) {
			console.error("Error cargando cotizaciones:", error);
			Toast.error("Error cargando cotizaciones");
		}
	}

	displayQuotes(quotes) {
		const quotesList = this.querySelector("#quotesList");

		if (quotes.length === 0) {
			quotesList.innerHTML = `
				<div class="empty-state">
					<p>No se encontraron cotizaciones con los filtros aplicados</p>
				</div>
			`;
			return;
		}

		quotesList.innerHTML = quotes
			.map(
				(quote) => `
			<div class="quote-item ${quote.status === "expired" ? "expired" : ""}">
				<div class="quote-header">
					<div class="quote-user">
						<strong>Usuario:</strong> ${quote.userId.firstName}${
					quote.userId.lastName ? ` ${quote.userId.lastName}` : ""
				}
					</div>
					<div class="quote-status ${quote.status}">
						${this.getStatusIcon(quote.status)} ${this.getStatusText(quote.status)}
					</div>
				</div>
				<div class="quote-content">
					<div class="quote-file">
						<strong>Archivo:</strong> ${quote.fileId.filename}
					</div>
					<div class="quote-materials">
						<strong>Material:</strong> ${quote.materialId.name} (${quote.materialId.color})
					</div>
					<div class="quote-finish">
						<strong>Acabado:</strong> ${quote.finishId.name}
					</div>
					<div class="quote-quantity">
						<strong>Cantidad:</strong> ${quote.quantity}
					</div>
					<div class="quote-price">
						<strong>Precio Total:</strong> $${quote.totalPrice.toFixed(2)}
					</div>
					<div class="quote-date">
						<strong>Creada:</strong> ${new Date(quote.createdAt).toLocaleString("es-ES")}
					</div>
					<div class="quote-expires">
						<strong>Expira:</strong> ${new Date(quote.expiresAt).toLocaleString("es-ES")}
					</div>
				</div>
			</div>
		`,
			)
			.join("");
	}

	getStatusIcon(status) {
		switch (status) {
			case "active":
				return "✅";
			case "expired":
				return "⏰";
			case "deleted":
				return "🗑️";
			default:
				return "❓";
		}
	}

	getStatusText(status) {
		switch (status) {
			case "active":
				return "Activa";
			case "expired":
				return "Expirada";
			case "deleted":
				return "Eliminada";
			default:
				return "Desconocido";
		}
	}

	clearFilters() {
		this.querySelector("#statusFilter").value = "";
		this.querySelector("#dateFromFilter").value = "";
		this.querySelector("#dateToFilter").value = "";
		this.loadQuotes();
	}

	async cleanupExpiredQuotes() {
		if (
			!confirm(
				"¿Estás seguro de que quieres limpiar todas las cotizaciones expiradas?",
			)
		) {
			return;
		}

		try {
			const token = authStore.getToken();
			if (!token) {
				Toast.error("No hay token de autenticación");
				return;
			}

			const response = await fetch("/api/v1/quotes/admin/cleanup", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();

			if (data.success) {
				Toast.success(
					`Limpieza completada. ${data.result.data.modifiedCount} cotizaciones marcadas como expiradas`,
				);
				this.loadQuotes(); // Recargar la lista
			} else {
				Toast.error("Error en la limpieza: " + data.message);
			}
		} catch (error) {
			console.error("Error limpiando cotizaciones:", error);
			Toast.error("Error limpiando cotizaciones");
		}
	}
}

customElements.define("panel-component", PanelComponent);
