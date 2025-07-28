import { quotesService } from "../services/quotesService.js";
import { checkoutStore } from "../stores/checkoutStore.js";
import { Toast } from "../components/Toast.js";
import { navigate } from "../services/router.js";

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
			<link rel="stylesheet" href="/styles/quotes.css" />
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
						<button class="modal-close" id="modal-close-btn">×</button>
					</div>
					<div class="modal-body" id="quote-details">
						<!-- Los detalles se cargarán aquí -->
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary" id="modal-close-btn-2">Cerrar</button>
						<button class="btn btn-danger" id="delete-quote-btn">
							🗑️ Eliminar Cotización
						</button>
					</div>
				</div>
			</div>

			<!-- Modal de confirmación para eliminar -->
			<div id="confirm-modal" class="modal hidden">
				<div class="modal-content confirm-modal">
					<div class="modal-header">
						<h2>⚠️ Confirmar Eliminación</h2>
						<button class="modal-close" id="confirm-close-btn">×</button>
					</div>
					<div class="modal-body">
						<div class="confirm-content">
							<div class="confirm-icon">🗑️</div>
							<h3>¿Estás seguro de que quieres eliminar esta cotización?</h3>
							<p>Esta acción no se puede deshacer. La cotización será eliminada permanentemente.</p>
							<div class="confirm-quote-info" id="confirm-quote-info">
								<!-- Información de la cotización a eliminar -->
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn btn-secondary" id="confirm-cancel-btn">Cancelar</button>
						<button class="btn btn-danger" id="confirm-delete-btn">
							🗑️ Sí, Eliminar
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

		// Cerrar modal al hacer clic fuera
		modal?.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeModal();
			}
		});

		// Adjuntar eventos a los botones del modal
		this.attachModalEventListeners();

		// Adjuntar eventos al modal de confirmación
		this.attachConfirmModalEventListeners();
	}

	attachModalEventListeners() {
		const modal = this.querySelector("#quote-modal");
		const modalCloseBtn = this.querySelector("#modal-close-btn");
		const modalCloseBtn2 = this.querySelector("#modal-close-btn-2");
		const deleteBtn = this.querySelector("#delete-quote-btn");

		modalCloseBtn?.addEventListener("click", () => {
			this.closeModal();
		});

		modalCloseBtn2?.addEventListener("click", () => {
			this.closeModal();
		});

		deleteBtn?.addEventListener("click", () => {
			const quoteId = this.querySelector("#quote-modal .modal-body").dataset
				.quoteId;
			this.showConfirmModal(quoteId);
		});
	}

	attachConfirmModalEventListeners() {
		const confirmModal = this.querySelector("#confirm-modal");
		const confirmCloseBtn = this.querySelector("#confirm-close-btn");
		const confirmCancelBtn = this.querySelector("#confirm-cancel-btn");

		confirmCloseBtn?.addEventListener("click", () => {
			this.closeConfirmModal();
		});

		confirmCancelBtn?.addEventListener("click", () => {
			this.closeConfirmModal();
		});

		// Cerrar modal al hacer clic fuera
		confirmModal?.addEventListener("click", (e) => {
			if (e.target === confirmModal) {
				this.closeConfirmModal();
			}
		});
	}

	showConfirmModal(quoteId) {
		const confirmModal = this.querySelector("#confirm-modal");
		const confirmQuoteInfo = this.querySelector("#confirm-quote-info");
		const confirmDeleteBtn = this.querySelector("#confirm-delete-btn");

		// Buscar la cotización en la lista actual
		const quote = this.quotes.find((q) => q._id === quoteId);

		if (quote) {
			confirmQuoteInfo.innerHTML = `
				<div class="quote-summary">
					<p><strong>Archivo:</strong> ${quote.fileId.filename}</p>
					<p><strong>Material:</strong> ${quote.materialId.name} (${
				quote.materialId.color
			})</p>
					<p><strong>Acabado:</strong> ${quote.finishId.name}</p>
					<p><strong>Precio:</strong> $${quote.totalPrice.toFixed(2)}</p>
				</div>
			`;
		}

		// Configurar el botón de eliminar
		confirmDeleteBtn.onclick = () => this.deleteQuote(quoteId);

		// Mostrar modal de confirmación
		confirmModal.classList.remove("hidden");
		confirmModal.classList.add("show");
		document.body.style.overflow = "hidden";
	}

	closeConfirmModal() {
		const confirmModal = this.querySelector("#confirm-modal");
		confirmModal.classList.remove("show");
		confirmModal.classList.add("hidden");
		document.body.style.overflow = "auto";
	}

	async loadQuotes() {
		try {
			this.setLoading(true);

			// Verificar si el usuario está autenticado
			const token = localStorage.getItem("token");
			if (!token) {
				Toast.error("Debes iniciar sesión para ver tus cotizaciones");
				return;
			}

			const response = await quotesService.getUserQuotes(this.currentPage, 10);

			if (response.success) {
				this.quotes = response.data.quotes;
				this.totalPages = response.data.pagination.pages;
				this.currentPage = response.data.pagination.page;

				this.renderQuotes();
				this.updatePagination();
			} else {
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
					<button class="btn btn-primary btn-sm" data-quote-id="${
						quote._id
					}" id="quote-details-btn">
						👁️ Ver Detalles
					</button>
					${
						quote.status === "active"
							? `
						<button class="btn btn-danger btn-sm" data-quote-id="${quote._id}" id="delete-quote-btn">
							🗑️ Eliminar
						</button>
					`
							: ""
					}

							${
								quote.status !== "expired"
									? `
						<button class="btn btn-success btn-sm" data-quote="${encodeURIComponent(
							JSON.stringify(quote),
						)}" id="create-order-quote-btn">
							🗑️ Crear pedido
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
		const detailButtons = this.querySelectorAll("#quote-details-btn");
		const deleteButtons = this.querySelectorAll("#delete-quote-btn");
		const createOrderButtons = this.querySelectorAll("#create-order-quote-btn");

		createOrderButtons.forEach((btn) => {
			btn.onclick = (e) => {
				e.preventDefault();
				const quote = btn.getAttribute("data-quote");
				const quoteData = JSON.parse(decodeURIComponent(quote));
				checkoutStore.setState({
					...this.flattenQuoteData(quoteData),
					quoteId: quoteData._id,
				});
				navigate(`/checkout`);
			};
		});

		detailButtons.forEach((btn) => {
			btn.onclick = (e) => {
				e.preventDefault();
				const quoteId = btn.getAttribute("data-quote-id");
				this.showQuoteDetails(quoteId);
			};
		});

		deleteButtons.forEach((btn) => {
			btn.onclick = (e) => {
				e.preventDefault();
				const quoteId = btn.getAttribute("data-quote-id");
				this.showConfirmModal(quoteId);
			};
		});
	}

	flattenQuoteData = (data) => {
		return {
			...data,
			fileId:
				data.fileId && typeof data.fileId === "object"
					? data.fileId._id
					: data.fileId,
			materialId:
				data.materialId && typeof data.materialId === "object"
					? data.materialId._id
					: data.materialId,
			finishId:
				data.finishId && typeof data.finishId === "object"
					? data.finishId._id
					: data.finishId,
			quoteId: data._id,
			_id: undefined,
			__v: undefined,
			createdAt: undefined,
			updatedAt: undefined,
		};
	};

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

	async showQuoteDetails(quoteId) {
		try {
			const response = await quotesService.getQuoteById(quoteId);

			if (response && response.success) {
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

		// Validar que quote existe y tiene las propiedades necesarias
		if (!quote) {
			console.error("❌ Quote es undefined");
			detailsContainer.innerHTML =
				'<div class="error">Error: No se pudieron cargar los detalles de la cotización</div>';
			return;
		}

		// Configurar visibilidad del botón de eliminar con validación
		if (deleteBtn) {
			deleteBtn.style.display = quote.status === "active" ? "block" : "none";
		}

		// Validar que priceBreakdown existe
		if (!quote.priceBreakdown) {
			console.error("❌ priceBreakdown no existe en la cotización");
			detailsContainer.innerHTML =
				'<div class="error">Error: Estructura de datos incompleta</div>';
			return;
		}

		// Validar que los objetos anidados existen
		const materialCost = quote.priceBreakdown.materialCost || {};
		const finishCost = quote.priceBreakdown.finishCost || {};
		const fixedCosts = quote.priceBreakdown.fixedCosts || {};

		detailsContainer.innerHTML = `
			<div class="quote-details">
				<div class="detail-section">
					<h3>📄 Información del Archivo</h3>
					<p><strong>Nombre:</strong> ${quote.fileId?.filename || "N/A"}</p>
					<p><strong>Volumen:</strong> ${quote.fileId?.volume || "N/A"} cm³</p>
					${
						quote.fileId?.dimensions
							? `<p><strong>Dimensiones:</strong> ${
									quote.fileId.dimensions.width?.toFixed(2) || 0
							  } × ${quote.fileId.dimensions.height?.toFixed(2) || 0} × ${
									quote.fileId.dimensions.depth?.toFixed(2) || 0
							  } mm</p>`
							: ""
					}
				</div>

				<div class="detail-section">
					<h3>🏗️ Configuración</h3>
					<p><strong>Material:</strong> ${quote.materialId?.name || "N/A"} (${
			quote.materialId?.color || "N/A"
		})</p>
					<p><strong>Acabado:</strong> ${quote.finishId?.name || "N/A"}</p>
					<p><strong>Cantidad:</strong> ${quote.quantity || "N/A"}</p>
				</div>

				<div class="detail-section">
					<h3>💰 Desglose de Precios</h3>
					<div class="price-breakdown">
						<div class="breakdown-item">
							<h4>📦 Costo de Material</h4>
							<div class="breakdown-grid">
								<div class="breakdown-row">
									<div class="breakdown-label">Precio por gramo:</div>
									<div class="breakdown-value">$${(materialCost.pricePerGram || 0).toFixed(
										2,
									)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Peso:</div>
									<div class="breakdown-value">${(materialCost.weight || 0).toFixed(2)}g</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Costo por unidad:</div>
									<div class="breakdown-value">$${(materialCost.costPerUnit || 0).toFixed(
										2,
									)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Cantidad:</div>
									<div class="breakdown-value">${materialCost.quantity || 0}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Total material:</div>
									<div class="breakdown-value">$${(materialCost.total || 0).toFixed(2)}</div>
								</div>
							</div>
						</div>

						<div class="breakdown-item">
							<h4>✨ Costo de Acabado</h4>
							<div class="breakdown-grid">
								<div class="breakdown-row">
									<div class="breakdown-label">Precio base:</div>
									<div class="breakdown-value">$${(finishCost.basePrice || 0).toFixed(2)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Multiplicador:</div>
									<div class="breakdown-value">${finishCost.multiplier || 0}x</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Costo por unidad:</div>
									<div class="breakdown-value">$${(finishCost.costPerUnit || 0).toFixed(2)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Cantidad:</div>
									<div class="breakdown-value">${finishCost.quantity || 0}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Total acabado:</div>
									<div class="breakdown-value">$${(finishCost.total || 0).toFixed(2)}</div>
								</div>
							</div>
						</div>

						<div class="breakdown-item">
							<h4>🚚 Costos Fijos</h4>
							<div class="breakdown-grid">
								<div class="breakdown-row">
									<div class="breakdown-label">Costo de envío:</div>
									<div class="breakdown-value">$${(fixedCosts.shippingCost || 0).toFixed(2)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Costo fijo por pedido:</div>
									<div class="breakdown-value">$${(fixedCosts.orderFixedCost || 0).toFixed(
										2,
									)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Total costos fijos:</div>
									<div class="breakdown-value">$${(fixedCosts.total || 0).toFixed(2)}</div>
								</div>
								${fixedCosts.note ? `<div class="breakdown-note">${fixedCosts.note}</div>` : ""}
							</div>
						</div>

						<hr>
						<div class="breakdown-totals">
							<div class="breakdown-grid">
								<div class="breakdown-row">
									<div class="breakdown-label">Subtotal:</div>
									<div class="breakdown-value">$${(quote.priceBreakdown.subtotal || 0).toFixed(
										2,
									)}</div>
								</div>
								<div class="breakdown-row">
									<div class="breakdown-label">Impuestos:</div>
									<div class="breakdown-value">$${(quote.priceBreakdown.tax || 0).toFixed(
										2,
									)}</div>
								</div>
								<div class="breakdown-row total-price">
									<div class="breakdown-label">Precio Total:</div>
									<div class="breakdown-value">$${(quote.totalPrice || 0).toFixed(2)}</div>
								</div>
							</div>
						</div>

						${
							quote.priceBreakdown.calculationNotes
								? `<p class="calculation-notes"><em>${quote.priceBreakdown.calculationNotes}</em></p>`
								: ""
						}
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
						<span class="status-badge ${quote.status || "unknown"}">
							${this.getStatusIcon(quote.status)} ${this.getStatusText(quote.status)}
						</span>
					</p>
				</div>
			</div>
		`;

		// Establecer el ID del quoteId en el modal para el botón de eliminar
		detailsContainer.dataset.quoteId = quote._id;
	}

	openModal() {
		const modal = this.querySelector("#quote-modal");
		modal.classList.remove("hidden");
		modal.classList.add("show");
		document.body.style.overflow = "hidden";
	}

	closeModal() {
		const modal = this.querySelector("#quote-modal");
		modal.classList.remove("show");
		modal.classList.add("hidden");
		document.body.style.overflow = "auto";
	}

	async deleteQuote(quoteId) {
		try {
			const response = await quotesService.deleteQuote(quoteId);

			if (response.success) {
				Toast.success("Cotización eliminada exitosamente");
				this.closeConfirmModal();
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
