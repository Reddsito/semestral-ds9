import { quotesService } from "../services/quotesService.js";
import { Toast } from "../components/Toast.js";

class QuotesComponent extends HTMLElement {
	constructor() {
		super();
		this.quotes = [];
		this.currentPage = 1;
		this.totalPages = 1;
		this.loading = false;
	}

	connectedCallback() {
		this.render();
		this.loadQuotes();
	}

	render() {
		this.innerHTML = `
			<div class="quotes-container">
				<div class="quotes-header">
					<h1>📋 Mis Cotizaciones</h1>
					<div class="quotes-info">
						<p class="info-message">
							💡 <strong>Información importante:</strong> Las cotizaciones son válidas por 30 días desde su creación. 
							Después de este período, se marcarán automáticamente como expiradas.
						</p>
					</div>
				</div>

				<div class="quotes-content">
					<div id="quotes-loading" class="loading hidden">
						<div class="spinner"></div>
						<p>Cargando cotizaciones...</p>
					</div>

					<div id="quotes-empty" class="empty-state hidden">
						<div class="empty-icon">📋</div>
						<h3>No tienes cotizaciones aún</h3>
						<p>Ve a la calculadora para crear tu primera cotización</p>
						<button class="btn btn-primary" onclick="window.location.href='/calculator'">
							🧮 Ir a Calculadora
						</button>
					</div>

					<div id="quotes-list" class="quotes-list hidden">
						<div id="quotes-grid"></div>
						
						<div class="pagination">
							<button id="prev-page" class="btn btn-secondary" disabled>
								⬅️ Anterior
							</button>
							<span id="page-info" class="page-info">
								Página 1 de 1
							</span>
							<button id="next-page" class="btn btn-secondary" disabled>
								Siguiente ➡️
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Modal para detalles de cotización -->
			<div id="quote-modal" class="modal hidden">
				<div class="modal-content">
					<div class="modal-header">
						<h2>📋 Detalles de Cotización</h2>
						<button class="modal-close" onclick="this.closeModal()">×</button>
					</div>
					<div class="modal-body" id="quote-details">
						<!-- Los detalles se cargarán aquí -->
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary" onclick="this.closeModal()">Cerrar</button>
						<button class="btn btn-danger" id="delete-quote-btn" onclick="this.deleteQuote()">
							🗑️ Eliminar Cotización
						</button>
					</div>
				</div>
			</div>
		`;

		this.attachEventListeners();
	}

	attachEventListeners() {
		// Paginación
		const prevBtn = this.querySelector("#prev-page");
		const nextBtn = this.querySelector("#next-page");

		prevBtn?.addEventListener("click", () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.loadQuotes();
			}
		});

		nextBtn?.addEventListener("click", () => {
			if (this.currentPage < this.totalPages) {
				this.currentPage++;
				this.loadQuotes();
			}
		});

		// Modal
		const modal = this.querySelector("#quote-modal");
		const closeBtn = this.querySelector(".modal-close");

		closeBtn?.addEventListener("click", () => {
			this.closeModal();
		});

		// Cerrar modal al hacer clic fuera
		modal?.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeModal();
			}
		});
	}

	async loadQuotes() {
		try {
			this.setLoading(true);

			// Verificar si el usuario está autenticado
			const token = localStorage.getItem("token");
			if (!token) {
				console.log("❌ No hay token de autenticación");
				Toast.error("Debes iniciar sesión para ver tus cotizaciones");
				return;
			}

			console.log("🔐 Token encontrado:", token ? "Sí" : "No");

			const response = await quotesService.getUserQuotes(this.currentPage, 10);

			console.log("📡 Response completa:", response);

			if (response.success) {
				console.log("📊 Response data:", response.data);
				this.quotes = response.data.quotes;
				this.totalPages = response.data.pagination.pages;
				this.currentPage = response.data.pagination.page;

				this.renderQuotes();
				this.updatePagination();
			} else {
				console.log("❌ Response error:", response);
				Toast.error("Error cargando cotizaciones");
			}
		} catch (error) {
			console.error("Error cargando cotizaciones:", error);
			Toast.error("Error cargando cotizaciones");
		} finally {
			this.setLoading(false);
		}
	}

	renderQuotes() {
		const quotesGrid = this.querySelector("#quotes-grid");
		const quotesList = this.querySelector("#quotes-list");
		const quotesEmpty = this.querySelector("#quotes-empty");

		if (this.quotes.length === 0) {
			quotesList.classList.add("hidden");
			quotesEmpty.classList.remove("hidden");
			return;
		}

		quotesEmpty.classList.add("hidden");
		quotesList.classList.remove("hidden");

		quotesGrid.innerHTML = this.quotes
			.map(
				(quote) => `
			<div class="quote-card ${
				quote.status === "expired" ? "expired" : ""
			}" data-quote-id="${quote._id}">
				<div class="quote-header">
					<div class="quote-status ${quote.status}">
						${this.getStatusIcon(quote.status)} ${this.getStatusText(quote.status)}
					</div>
					<div class="quote-date">
						${new Date(quote.createdAt).toLocaleDateString("es-ES")}
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
					${
						quote.notes
							? `<div class="quote-notes"><strong>Notas:</strong> ${quote.notes}</div>`
							: ""
					}
				</div>

				<div class="quote-footer">
					<button class="btn btn-primary btn-sm" onclick="this.ToastQuoteDetails('${
						quote._id
					}')">
						👁️ Ver Detalles
					</button>
					${
						quote.status === "active"
							? `
						<button class="btn btn-danger btn-sm" onclick="this.deleteQuote('${quote._id}')">
							🗑️ Eliminar
						</button>
					`
							: ""
					}
				</div>

				${
					quote.status === "expired"
						? `
					<div class="quote-expired-banner">
						⚠️ Esta cotización ha expirado
					</div>
				`
						: ""
				}
			</div>
		`,
			)
			.join("");

		// Adjuntar eventos a los botones
		this.attachQuoteEventListeners();
	}

	attachQuoteEventListeners() {
		const detailButtons = this.querySelectorAll(
			'[onclick*="ToastQuoteDetails"]',
		);
		const deleteButtons = this.querySelectorAll('[onclick*="deleteQuote"]');

		detailButtons.forEach((btn) => {
			btn.onclick = (e) => {
				e.preventDefault();
				const quoteId = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
				this.ToastQuoteDetails(quoteId);
			};
		});

		deleteButtons.forEach((btn) => {
			btn.onclick = (e) => {
				e.preventDefault();
				const quoteId = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
				this.deleteQuote(quoteId);
			};
		});
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

	updatePagination() {
		const prevBtn = this.querySelector("#prev-page");
		const nextBtn = this.querySelector("#next-page");
		const pageInfo = this.querySelector("#page-info");

		prevBtn.disabled = this.currentPage <= 1;
		nextBtn.disabled = this.currentPage >= this.totalPages;
		pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
	}

	setLoading(loading) {
		this.loading = loading;
		const loadingEl = this.querySelector("#quotes-loading");
		const contentEl = this.querySelector("#quotes-content");

		if (loading) {
			loadingEl.classList.remove("hidden");
		} else {
			loadingEl.classList.add("hidden");
		}
	}

	async ToastQuoteDetails(quoteId) {
		try {
			const response = await quotesService.getQuoteById(quoteId);

			if (response.success) {
				const quote = response.data;
				this.renderQuoteDetails(quote);
				this.openModal();
			} else {
				Toast.error("Error cargando detalles de la cotización");
			}
		} catch (error) {
			console.error("Error cargando detalles:", error);
			Toast.error("Error cargando detalles de la cotización");
		}
	}

	renderQuoteDetails(quote) {
		const detailsContainer = this.querySelector("#quote-details");
		const deleteBtn = this.querySelector("#delete-quote-btn");

		// Configurar botón de eliminar
		deleteBtn.onclick = () => this.deleteQuote(quote._id);
		deleteBtn.style.display = quote.status === "active" ? "block" : "none";

		detailsContainer.innerHTML = `
			<div class="quote-details">
				<div class="detail-section">
					<h3>📄 Información del Archivo</h3>
					<p><strong>Nombre:</strong> ${quote.fileId.filename}</p>
					<p><strong>Volumen:</strong> ${quote.fileId.volume} cm³</p>
					${
						quote.fileId.dimensions
							? `<p><strong>Dimensiones:</strong> ${quote.fileId.dimensions}</p>`
							: ""
					}
				</div>

				<div class="detail-section">
					<h3>🏗️ Configuración</h3>
					<p><strong>Material:</strong> ${quote.materialId.name} (${
			quote.materialId.color
		})</p>
					<p><strong>Acabado:</strong> ${quote.finishId.name}</p>
					<p><strong>Cantidad:</strong> ${quote.quantity}</p>
				</div>

				<div class="detail-section">
					<h3>💰 Desglose de Precios</h3>
					<div class="price-breakdown">
						<p><strong>Costo de Material:</strong> $${quote.priceBreakdown.materialCost.toFixed(
							2,
						)}</p>
						<p><strong>Costo de Acabado:</strong> $${quote.priceBreakdown.finishCost.toFixed(
							2,
						)}</p>
						<p><strong>Costo por Volumen:</strong> $${quote.priceBreakdown.volumeCost.toFixed(
							2,
						)}</p>
						<p><strong>Multiplicador por Cantidad:</strong> ${
							quote.priceBreakdown.quantityMultiplier
						}x</p>
						<hr>
						<p class="total-price"><strong>Precio Total:</strong> $${quote.totalPrice.toFixed(
							2,
						)}</p>
					</div>
				</div>

				${
					quote.notes
						? `
					<div class="detail-section">
						<h3>📝 Notas</h3>
						<p>${quote.notes}</p>
					</div>
				`
						: ""
				}

				<div class="detail-section">
					<h3>📅 Información Temporal</h3>
					<p><strong>Creada:</strong> ${new Date(quote.createdAt).toLocaleString(
						"es-ES",
					)}</p>
					<p><strong>Expira:</strong> ${new Date(quote.expiresAt).toLocaleString(
						"es-ES",
					)}</p>
					<p><strong>Estado:</strong> 
						<span class="status-badge ${quote.status}">
							${this.getStatusIcon(quote.status)} ${this.getStatusText(quote.status)}
						</span>
					</p>
				</div>
			</div>
		`;
	}

	openModal() {
		const modal = this.querySelector("#quote-modal");
		modal.classList.remove("hidden");
		document.body.style.overflow = "hidden";
	}

	closeModal() {
		const modal = this.querySelector("#quote-modal");
		modal.classList.add("hidden");
		document.body.style.overflow = "auto";
	}

	async deleteQuote(quoteId) {
		if (!confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
			return;
		}

		try {
			const response = await quotesService.deleteQuote(quoteId);

			if (response.success) {
				Toast.success("Cotización eliminada exitosamente");
				this.closeModal();
				this.loadQuotes(); // Recargar la lista
			} else {
				Toast.error(response.message || "Error eliminando cotización");
			}
		} catch (error) {
			console.error("Error eliminando cotización:", error);
			Toast.error("Error eliminando cotización");
		}
	}
}

customElements.define("quotes-component", QuotesComponent);
