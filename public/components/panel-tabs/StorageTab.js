import { Toast } from "../Toast.js";
import { authStore } from "../../stores/authStore.js";

class StorageTab extends HTMLElement {
	constructor() {
		super();
		this.files = {
			quotation: [],
			order: [],
			avatar: [],
		};
		this.selectedFiles = new Set();
		this.currentType = "quotation";
	}

	connectedCallback() {
		this.render();
		this.loadFiles();
	}

	render() {
		this.innerHTML = `
            <div class="storage-tab">
                <div class="storage-header">
                    <h3>💾 Gestión de Almacenamiento</h3>
                    <button id="refreshStorage" class="btn btn-primary">🔄 Actualizar</button>
                </div>
                
                <div class="file-type-selector">
                    <button class="type-btn ${
											this.currentType === "quotation" ? "active" : ""
										}" data-type="quotation">
                        📋 Cotizaciones
                    </button>
                    <button class="type-btn ${
											this.currentType === "order" ? "active" : ""
										}" data-type="order">
                        📦 Pedidos
                    </button>
                    <button class="type-btn ${
											this.currentType === "avatar" ? "active" : ""
										}" data-type="avatar">
                        👤 Avatares
                    </button>
                </div>

                <div class="file-controls">
                    <div class="selection-controls">
                        <button id="selectAll" class="btn btn-secondary">☑️ Seleccionar Todo</button>
                        <button id="deselectAll" class="btn btn-secondary">❌ Deseleccionar Todo</button>
                        <button id="deleteSelected" class="btn btn-danger" disabled>🗑️ Eliminar Seleccionados</button>
                    </div>
                    <div class="selection-info">
                        <span id="selectedCount">0 archivos seleccionados</span>
                    </div>
                </div>

                <div class="files-container">
                    <div id="filesList" class="files-list">
                        <div class="loading">Cargando archivos...</div>
                    </div>
                </div>

                <div class="storage-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Archivos:</span>
                        <span class="stat-value" id="totalFiles">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Espacio Usado:</span>
                        <span class="stat-value" id="totalSize">0 MB</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Archivos Seleccionados:</span>
                        <span class="stat-value" id="selectedFilesCount">0</span>
                    </div>
                </div>
            </div>
        `;
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Cambiar tipo de archivo
		this.querySelectorAll(".type-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const type = e.target.dataset.type;
				this.switchFileType(type);
			});
		});

		// Controles de selección
		this.querySelector("#selectAll").addEventListener("click", () =>
			this.selectAllFiles(),
		);
		this.querySelector("#deselectAll").addEventListener("click", () =>
			this.deselectAllFiles(),
		);
		this.querySelector("#deleteSelected").addEventListener("click", () =>
			this.deleteSelectedFiles(),
		);
		this.querySelector("#refreshStorage").addEventListener("click", () =>
			this.loadFiles(),
		);
	}

	switchFileType(type) {
		this.currentType = type;
		this.selectedFiles.clear();

		// Actualizar botones activos
		this.querySelectorAll(".type-btn").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.type === type);
		});

		this.displayFiles();
		this.updateSelectionInfo();
	}

	async loadFiles() {
		try {
			const loadingElement = this.querySelector("#filesList");
			loadingElement.innerHTML =
				'<div class="loading">Cargando archivos...</div>';

			// Cargar archivos para todos los tipos
			const promises = [
				{ type: "quotation", endpoint: "quotation" },
				{ type: "order", endpoint: "order" },
				{ type: "avatar", endpoint: "image" }, // El endpoint "image" muestra avatares
			].map(async ({ type, endpoint }) => {
				const response = await fetch(`/api/v1/admin/files/${endpoint}`, {
					headers: {
						Authorization: `Bearer ${authStore.getToken()}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					this.files[type] = data.result.data.files || [];
				} else {
					console.error(
						`Error cargando archivos de tipo ${type}:`,
						response.statusText,
					);
					this.files[type] = [];
				}
			});

			await Promise.all(promises);
			this.displayFiles();
			this.updateStorageStats();
		} catch (error) {
			console.error("Error cargando archivos:", error);
			this.querySelector("#filesList").innerHTML =
				'<div class="error">Error cargando archivos</div>';
		}
	}

	displayFiles() {
		const filesList = this.querySelector("#filesList");
		const files = this.files[this.currentType];

		if (files.length === 0) {
			filesList.innerHTML =
				'<div class="empty-state">No hay archivos de este tipo</div>';
			return;
		}

		filesList.innerHTML = files
			.map(
				(file) => `
            <div class="file-item" data-file-id="${file._id}">
                <div class="file-checkbox">
                    <input type="checkbox" id="file-${file._id}" ${
					this.selectedFiles.has(file._id) ? "checked" : ""
				}>
                    <label for="file-${file._id}"></label>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.originalName}</div>
                    <div class="file-details">
                        <span class="file-size">${this.formatFileSize(
													file.fileSize,
												)}</span>
                        <span class="file-date">${new Date(
													file.createdAt,
												).toLocaleDateString()}</span>
                        <span class="file-user">${
													file.userId?.email || "Usuario desconocido"
												}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-danger btn-sm" onclick="this.closest('.file-item').dispatchEvent(new CustomEvent('deleteFile', {detail: '${
											file._id
										}'}))">
                        🗑️
                    </button>
                </div>
            </div>
        `,
			)
			.join("");

		// Agregar event listeners para checkboxes
		filesList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			checkbox.addEventListener("change", (e) => {
				const fileId = e.target.id.replace("file-", "");
				if (e.target.checked) {
					this.selectedFiles.add(fileId);
				} else {
					this.selectedFiles.delete(fileId);
				}
				this.updateSelectionInfo();
			});
		});

		// Agregar event listeners para eliminar archivos individuales
		filesList.querySelectorAll(".file-item").forEach((item) => {
			item.addEventListener("deleteFile", (e) => {
				this.deleteFile(e.detail);
			});
		});
	}

	selectAllFiles() {
		const files = this.files[this.currentType];
		files.forEach((file) => this.selectedFiles.add(file._id));

		this.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			checkbox.checked = true;
		});

		this.updateSelectionInfo();
	}

	deselectAllFiles() {
		this.selectedFiles.clear();

		this.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			checkbox.checked = false;
		});

		this.updateSelectionInfo();
	}

	updateSelectionInfo() {
		const selectedCount = this.selectedFiles.size;
		this.querySelector(
			"#selectedCount",
		).textContent = `${selectedCount} archivos seleccionados`;
		this.querySelector("#selectedFilesCount").textContent = selectedCount;

		const deleteButton = this.querySelector("#deleteSelected");
		deleteButton.disabled = selectedCount === 0;
	}

	async deleteSelectedFiles() {
		if (this.selectedFiles.size === 0) return;

		if (
			!confirm(
				`¿Estás seguro de que quieres eliminar ${this.selectedFiles.size} archivos?`,
			)
		) {
			return;
		}

		try {
			const response = await fetch("/api/v1/admin/files/bulk-delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authStore.getToken()}`,
				},
				body: JSON.stringify({
					fileIds: Array.from(this.selectedFiles),
				}),
			});

			if (response.ok) {
				const data = await response.json();
				showToast(
					`✅ ${data.result.data.deletedCount} archivos eliminados exitosamente`,
					"success",
				);
				this.selectedFiles.clear();
				this.loadFiles();
			} else {
				showToast("❌ Error eliminando archivos", "error");
			}
		} catch (error) {
			console.error("Error eliminando archivos:", error);
			showToast("❌ Error eliminando archivos", "error");
		}
	}

	async deleteFile(fileId) {
		if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) {
			return;
		}

		try {
			const response = await fetch(`/api/v1/admin/files/${fileId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				showToast("✅ Archivo eliminado exitosamente", "success");
				this.loadFiles();
			} else {
				showToast("❌ Error eliminando archivo", "error");
			}
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			showToast("❌ Error eliminando archivo", "error");
		}
	}

	updateStorageStats() {
		let totalFiles = 0;
		let totalSize = 0;

		Object.values(this.files).forEach((fileList) => {
			totalFiles += fileList.length;
			fileList.forEach((file) => {
				totalSize += file.fileSize || 0;
			});
		});

		this.querySelector("#totalFiles").textContent = totalFiles;
		this.querySelector("#totalSize").textContent =
			this.formatFileSize(totalSize);
	}

	formatFileSize(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	getTypeName(type) {
		const names = {
			quotation: "Cotizaciones",
			order: "Pedidos",
			avatar: "Avatares",
		};
		return names[type] || type;
	}
}

customElements.define("storage-tab", StorageTab);
