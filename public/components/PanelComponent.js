import { Toast } from "./Toast.js";
import { authStore } from "../stores/authStore.js";

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
	}

	render() {
		this.innerHTML = `
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
			Toast.error("Error cargando estadísticas");
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
}

customElements.define("panel-component", PanelComponent);
