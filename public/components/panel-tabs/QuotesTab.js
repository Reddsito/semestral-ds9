import { Toast } from "../Toast.js";
import { authStore } from "../../stores/authStore.js";

class QuotesTab extends HTMLElement {
	constructor() {
		super();
		this.quotes = [];
		this.currentPage = 1;
		this.totalPages = 1;
		this.filters = {
			status: "",
			email: "",
			dateFrom: "",
			dateTo: "",
		};
		this.selectedQuote = null;
	}

	connectedCallback() {
		this.render();
		this.loadQuotes();
	}

	render() {
		this.innerHTML = `
            <div class="quotes-tab">
                <div class="quotes-header">
                    <h3>📋 Gestión de Cotizaciones</h3>
                    <button id="refreshQuotes" class="btn btn-primary">🔄 Actualizar</button>
                </div>

                <div class="filters-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="statusFilter">Estado:</label>
                            <select id="statusFilter" class="form-select">
                                <option value="">Todos los estados</option>
                                <option value="active">Activa</option>
                                <option value="expired">Expirada</option>
                                <option value="deleted">Eliminada</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="emailFilter">Email del Cliente:</label>
                            <input type="email" id="emailFilter" class="form-input" placeholder="Buscar por email...">
                        </div>
                        <div class="filter-group">
                            <label for="dateFromFilter">Desde:</label>
                            <input type="date" id="dateFromFilter" class="form-input">
                        </div>
                        <div class="filter-group">
                            <label for="dateToFilter">Hasta:</label>
                            <input type="date" id="dateToFilter" class="form-input">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button id="applyFilters" class="btn btn-secondary">🔍 Aplicar Filtros</button>
                        <button id="clearFilters" class="btn btn-outline">❌ Limpiar</button>
                    </div>
                </div>

                <div class="quotes-list">
                    <div class="quotes-table-container">
                        <table class="quotes-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="quotesTableBody">
                                <tr>
                                    <td colspan="6" class="loading">Cargando cotizaciones...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <button id="prevPage" class="btn btn-outline">← Anterior</button>
                        <span id="pageInfo">Página 1 de 1</span>
                        <button id="nextPage" class="btn btn-outline">Siguiente →</button>
                    </div>
                </div>

                <!-- Modal para detalles de la cotización -->
                <div id="quoteModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📋 Detalles de la Cotización</h3>
                            <button class="close-btn" id="closeQuoteModal">&times;</button>
                        </div>
                        <div class="modal-body" id="quoteModalBody">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="closeQuoteModalBtn">Cerrar</button>
                        </div>
                    </div>
                </div>

                <div class="bulk-actions">
                    <button id="cleanupExpiredQuotes" class="btn btn-warning">⏰ Limpiar Cotizaciones Expiradas</button>
                </div>
            </div>
        `;
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Filtros
		this.querySelector("#applyFilters").addEventListener("click", () =>
			this.applyFilters(),
		);
		this.querySelector("#clearFilters").addEventListener("click", () =>
			this.clearFilters(),
		);
		this.querySelector("#refreshQuotes").addEventListener("click", () =>
			this.loadQuotes(),
		);

		// Paginación
		this.querySelector("#prevPage").addEventListener("click", () =>
			this.changePage(-1),
		);
		this.querySelector("#nextPage").addEventListener("click", () =>
			this.changePage(1),
		);

		// Modal
		this.querySelector("#closeQuoteModal").addEventListener("click", () =>
			this.closeModal(),
		);
		this.querySelector("#closeQuoteModalBtn").addEventListener("click", () =>
			this.closeModal(),
		);

		// Limpieza de cotizaciones expiradas
		this.querySelector("#cleanupExpiredQuotes").addEventListener("click", () =>
			this.cleanupExpiredQuotes(),
		);

		// Cerrar modal al hacer clic fuera
		this.querySelector("#quoteModal").addEventListener("click", (e) => {
			if (e.target === e.currentTarget) {
				this.closeModal();
			}
		});
	}

	applyFilters() {
		this.filters = {
			status: this.querySelector("#statusFilter").value,
			email: this.querySelector("#emailFilter").value,
			dateFrom: this.querySelector("#dateFromFilter").value,
			dateTo: this.querySelector("#dateToFilter").value,
		};
		this.currentPage = 1;
		this.loadQuotes();
	}

	clearFilters() {
		this.filters = {
			status: "",
			email: "",
			dateFrom: "",
			dateTo: "",
		};
		this.querySelector("#statusFilter").value = "";
		this.querySelector("#emailFilter").value = "";
		this.querySelector("#dateFromFilter").value = "";
		this.querySelector("#dateToFilter").value = "";
		this.currentPage = 1;
		this.loadQuotes();
	}

	async loadQuotes() {
		try {
			const params = new URLSearchParams({
				page: this.currentPage,
				limit: 20,
				...this.filters,
			});

			const response = await fetch(`/api/v1/quotes/admin/all?${params}`, {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.quotes = data.data.quotes;
				this.totalPages = data.data.pagination.page;
				this.displayQuotes();
				this.updatePagination();
			} else {
				console.error("Error cargando cotizaciones:", response.statusText);
				this.showError("Error cargando cotizaciones");
			}
		} catch (error) {
			console.error("Error cargando cotizaciones:", error);
			this.showError("Error cargando cotizaciones");
		}
	}

	displayQuotes() {
		const tbody = this.querySelector("#quotesTableBody");

		if (this.quotes.length === 0) {
			tbody.innerHTML =
				'<tr><td colspan="6" class="empty-state">No hay cotizaciones que coincidan con los filtros</td></tr>';
			return;
		}

		tbody.innerHTML = this.quotes
			.map(
				(quote) => `
            <tr class="quote-row ${
							quote.status === "expired" ? "expired" : ""
						}">
                <td>${quote._id}</td>
                <td>${quote.userId?.email || "N/A"}</td>
                <td>
                    <span class="status-badge ${quote.status}">
                        ${this.getStatusIcon(
													quote.status,
												)} ${this.getStatusText(quote.status)}
                    </span>
                </td>
                <td>$${(quote.totalPrice || 0).toFixed(2)}</td>
                <td>${new Date(quote.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="this.closest('.quote-row').dispatchEvent(new CustomEvent('viewQuote', {detail: '${
											quote._id
										}'}))">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `,
			)
			.join("");

		// Agregar event listeners para ver detalles
		tbody.querySelectorAll(".quote-row").forEach((row) => {
			row.addEventListener("viewQuote", (e) => {
				this.showQuoteDetails(e.detail);
			});
		});
	}

	updatePagination() {
		const prevBtn = this.querySelector("#prevPage");
		const nextBtn = this.querySelector("#nextPage");
		const pageInfo = this.querySelector("#pageInfo");

		prevBtn.disabled = this.currentPage <= 1;
		nextBtn.disabled = this.currentPage >= this.totalPages;
		pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
	}

	changePage(delta) {
		const newPage = this.currentPage + delta;
		if (newPage >= 1 && newPage <= this.totalPages) {
			this.currentPage = newPage;
			this.loadQuotes();
		}
	}

	async showQuoteDetails(quoteId) {
		try {
			const response = await fetch(`/api/v1/quotes/${quoteId}`, {
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.selectedQuote = data.result.data;
				this.displayQuoteModal();
				this.showModal();
			} else {
				console.error(
					"Error cargando detalles de la cotización:",
					response.statusText,
				);
			}
		} catch (error) {
			console.error("Error cargando detalles de la cotización:", error);
		}
	}

	displayQuoteModal() {
		const quote = this.selectedQuote;
		const modalBody = this.querySelector("#quoteModalBody");

		modalBody.innerHTML = `
            <div class="detail-section">
                <h4>📋 Información General</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ID de la Cotización:</span>
                        <span class="detail-value">${quote._id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cliente:</span>
                        <span class="detail-value">${
													quote.userId?.email || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="status-badge ${quote.status}">
                                ${this.getStatusIcon(
																	quote.status,
																)} ${this.getStatusText(quote.status)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Creación:</span>
                        <span class="detail-value">${new Date(
													quote.createdAt,
												).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>📦 Detalles del Producto</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Archivo:</span>
                        <span class="detail-value">${
													quote.fileId?.originalName || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Material:</span>
                        <span class="detail-value">${
													quote.materialId?.name || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Acabado:</span>
                        <span class="detail-value">${
													quote.finishId?.name || "N/A"
												}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cantidad:</span>
                        <span class="detail-value">${quote.quantity || 1}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>💰 Desglose de Precios</h4>
                <div class="price-breakdown">
                    <div class="price-item">
                        <span class="price-label">Precio Base:</span>
                        <span class="price-value">$${(
													quote.priceBreakdown?.basePrice || 0
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">Material:</span>
                        <span class="price-value">$${(
													quote.priceBreakdown?.materialCost || 0
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">Acabado:</span>
                        <span class="price-value">$${(
													quote.priceBreakdown?.finishCost || 0
												).toFixed(2)}</span>
                    </div>
                    <div class="price-item total">
                        <span class="price-label">Total:</span>
                        <span class="price-value">$${(
													quote.totalPrice || 0
												).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${
							quote.notes
								? `
                <div class="detail-section">
                    <h4>📝 Notas</h4>
                    <p class="quote-notes">${quote.notes}</p>
                </div>
            `
								: ""
						}
        `;
	}

	async cleanupExpiredQuotes() {
		const confirmed = await showConfirmDelete(
			"¿Estás seguro de que quieres limpiar las cotizaciones expiradas? Esta acción no se puede deshacer.",
			"Confirmar limpieza",
		);

		if (!confirmed) {
			return;
		}

		try {
			const response = await fetch("/api/v1/quotes/admin/cleanup", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authStore.getToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				Toast.success(
					`✅ ${data.result.data.modifiedCount} cotizaciones expiradas limpiadas`,
				);
				this.loadQuotes(); // Recargar lista
			} else {
				Toast.error("❌ Error limpiando cotizaciones expiradas");
			}
		} catch (error) {
			console.error("Error limpiando cotizaciones:", error);
			Toast.error("❌ Error limpiando cotizaciones expiradas");
		}
	}

	showModal() {
		this.querySelector("#quoteModal").style.display = "flex";
	}

	closeModal() {
		this.querySelector("#quoteModal").style.display = "none";
		this.selectedQuote = null;
	}

	getStatusIcon(status) {
		const icons = {
			active: "✅",
			expired: "⏰",
			deleted: "🗑️",
		};
		return icons[status] || "❓";
	}

	getStatusText(status) {
		const texts = {
			active: "Activa",
			expired: "Expirada",
			deleted: "Eliminada",
		};
		return texts[status] || status;
	}

	showError(message) {
		const tbody = this.querySelector("#quotesTableBody");
		tbody.innerHTML = `<tr><td colspan="6" class="error">${message}</td></tr>`;
	}
}

customElements.define("quotes-tab", QuotesTab);
