import { authStore } from "../stores/authStore.js";
import { Toast } from "./Toast.js";
import { addressesService } from "../services/addressesService.js";

class AddressesComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
		this.map = null;
		this.marker = null;
		this.addresses = [];
	}

	connectedCallback() {
		this.updateFromAuthStore();
		authStore.subscribe(this.updateFromAuthStore.bind(this));
	}
	disconnectedCallback() {
		// Limpiar el mapa cuando el componente se desmonta
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
	}

	updateFromAuthStore() {
		const state = authStore.getState();
		const newUser = state.user;

		// Si no hay usuario, hacer render inicial
		if (!newUser) {
			this.user = null;
			this.render();
			return;
		}

		// Si es la primera vez que se carga el usuario
		if (!this.user) {
			this.user = newUser;
			this.render();
			return;
		}

		// Verificar si solo cambió el avatar (no hacer re-render completo)
		const avatarChanged =
			this.user.avatar !== newUser.avatar ||
			this.user.avatarKey !== newUser.avatarKey;
		const nameChanged =
			this.user.firstName !== newUser.firstName ||
			this.user.lastName !== newUser.lastName;
		const emailChanged = this.user.email !== newUser.email;

		// Actualizar el usuario local
		this.user = newUser;

		// Solo hacer re-render si cambiaron datos importantes (no solo avatar)
		if (nameChanged || emailChanged) {
			this.render();
		} else if (avatarChanged) {
			// Si solo cambió el avatar, no hacer nada ya que no afecta las direcciones
			console.log("🖼️ Avatar cambiado en AddressesComponent, ignorando");
		}
	}

	render() {
		if (!this.user) {
			this.innerHTML = `
				<div class="addresses-container">
					<div class="loading">
						<div class="spinner"></div>
						<p>Cargando información del usuario...</p>
					</div>
				</div>
			`;
			return;
		}

		this.innerHTML = `
			<link rel="stylesheet" href="/styles/addresses.css" />
			<div class="addresses-container">
				<div class="addresses-header">
					<h1>📍 Mis Direcciones</h1>
					<p>Gestiona tus direcciones de entrega</p>
				</div>

				<div class="addresses-content">
					<div class="addresses-sidebar">
						<div class="addresses-actions">
							<button class="btn btn-primary" id="addAddressBtn">
								➕ Agregar Dirección
							</button>
						</div>

						<div class="addresses-list" id="addressesList">
							<div class="addresses-empty">
								<p>📍 No tienes direcciones guardadas</p>
								<p>Agrega tu primera dirección para facilitar tus pedidos</p>
							</div>
						</div>
					</div>

					<div class="addresses-map-container">
				
						<div id="map" class="addresses-map"></div>
					</div>
				</div>

				<!-- Modal para agregar/editar dirección -->
				<div class="modal" id="addressModal">
					<div class="modal-content">
						<div class="modal-header">
							<h2 id="modalTitle">📍 Agregar Nueva Dirección</h2>
							<button class="modal-close" id="closeModal">&times;</button>
						</div>
						<form id="addressForm" class="address-form">
							<input type="hidden" id="addressId" name="addressId" value="">
							<div class="form-group">
								<label for="addressName" class="form-label">🏷️ Nombre de la dirección</label>
								<input 
									type="text" 
									id="addressName" 
									name="addressName" 
									class="form-input" 
									placeholder="Ej: Casa, Oficina, Trabajo..."
									required
								>
								<div class="error-message" id="addressName-error">
									El nombre de la dirección es requerido
								</div>
							</div>

							<div class="form-group">
								<label for="phone" class="form-label">📱 Número de teléfono</label>
								<input 
									type="tel" 
									id="phone" 
									name="phone" 
									class="form-input" 
									placeholder="Ej: +507 1234-5678"
									required
								>
								<div class="error-message" id="phone-error">
									El número de teléfono es requerido
								</div>
							</div>

							<div class="form-group">
								<label for="notes" class="form-label">📝 Información adicional</label>
								<textarea 
									id="notes" 
									name="notes" 
									class="form-input" 
									placeholder="Dirección completa, referencias, instrucciones especiales, información adicional..."
									rows="4"
								></textarea>
							</div>

							<div class="coordinates-info" id="coordinatesInfo">
								<p><strong>📍 Ubicación seleccionada en el mapa:</strong></p>
								<p>Latitud: <span id="selectedLat">No seleccionada</span></p>
								<p>Longitud: <span id="selectedLng">No seleccionada</span></p>
							</div>

							<div class="form-actions">
								<button type="button" class="btn btn-secondary" id="cancelBtn">
									❌ Cancelar
								</button>
								<button type="submit" class="btn btn-primary disabled" id="saveAddressBtn" disabled>
									💾 Guardar Dirección
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		`;

		this.initializeMap();
		this.attachEventListeners();
		this.loadAddresses();
	}

	initializeMap() {
		// Esperar a que el elemento del mapa esté en el DOM
		setTimeout(() => {
			const mapElement = this.querySelector("#map");
			if (mapElement && !this.map) {
				// Coordenadas por defecto (Ciudad de Panamá)
				const defaultLat = 8.9824;
				const defaultLng = -79.5199;

				// Límites geográficos de Panamá
				this.panamaLimits = {
					north: 9.8, // Frontera con Costa Rica
					south: 7.0, // Frontera con Colombia
					west: -83.0, // Frontera oeste
					east: -77.0, // Frontera este
				};

				// Crear el mapa
				this.map = L.map("map").setView([defaultLat, defaultLng], 8);

				// Agregar el tile layer (OpenStreetMap)
				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "© OpenStreetMap contributors",
				}).addTo(this.map);

				// Establecer límites del mapa para que no se pueda navegar fuera de Panamá
				const bounds = L.latLngBounds(
					[this.panamaLimits.south, this.panamaLimits.west], // Southwest
					[this.panamaLimits.north, this.panamaLimits.east], // Northeast
				);
				this.map.setMaxBounds(bounds);
				this.map.fitBounds(bounds);

				// Agregar polígono visual para mostrar los límites permitidos
				this.addPanamaOverlay();

				// Agregar evento de clic en el mapa
				this.map.on("click", (e) => {
					this.onMapClick(e);
				});

				// Intentar obtener la ubicación actual del usuario
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(
						(position) => {
							const lat = position.coords.latitude;
							const lng = position.coords.longitude;

							// Verificar si la ubicación está en Panamá
							if (this.isWithinPanama(lat, lng)) {
								this.map.setView([lat, lng], 15);
								Toast.info("📍 Ubicación actual detectada en Panamá");
							} else {
								Toast.warning(
									"📍 Tu ubicación está fuera de Panamá, usando ubicación por defecto",
								);
							}
						},
						(error) => {
							// Error handling for geolocation
						},
					);
				}
			}
		}, 100);
	}

	onMapClick(e) {
		const lat = e.latlng.lat;
		const lng = e.latlng.lng;

		// Verificar si las coordenadas están dentro de Panamá
		if (!this.isWithinPanama(lat, lng)) {
			Toast.error("Solo puedes seleccionar ubicaciones dentro de Panamá");
			return;
		}

		// Remover marcador anterior si existe
		if (this.marker) {
			this.map.removeLayer(this.marker);
		}

		// Agregar nuevo marcador
		this.marker = L.marker([lat, lng]).addTo(this.map);

		// Actualizar las coordenadas en el modal
		const latSpan = this.querySelector("#selectedLat");
		const lngSpan = this.querySelector("#selectedLng");

		if (latSpan && lngSpan) {
			latSpan.textContent = lat.toFixed(6);
			lngSpan.textContent = lng.toFixed(6);
		}

		// Validar completitud del formulario después de seleccionar ubicación
		this.validateFormCompleteness();

		// Realizar geocodificación inversa para obtener la dirección
		this.reverseGeocode(lat, lng);
	}

	// Método para verificar si una coordenada está dentro de Panamá
	isWithinPanama(lat, lng) {
		return (
			lat >= this.panamaLimits.south &&
			lat <= this.panamaLimits.north &&
			lng >= this.panamaLimits.west &&
			lng <= this.panamaLimits.east
		);
	}

	// Método para agregar overlay visual de los límites de Panamá
	addPanamaOverlay() {
		// Crear un rectángulo que muestre visualmente los límites permitidos
		const panamaRect = L.rectangle(
			[
				[this.panamaLimits.south, this.panamaLimits.west],
				[this.panamaLimits.north, this.panamaLimits.east],
			],
			{
				color: "#22c55e",
				weight: 2,
				fillOpacity: 0.1,
				fillColor: "#22c55e",
			},
		).addTo(this.map);

		// Agregar texto informativo en el mapa
		const centerLat = (this.panamaLimits.north + this.panamaLimits.south) / 2;
		const centerLng = (this.panamaLimits.east + this.panamaLimits.west) / 2;

		L.marker([centerLat, centerLng], {
			icon: L.divIcon({
				className: "panama-info-marker",
				html: '<div style="background: rgba(34, 197, 94, 0.9); color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🇵🇦 Zona Válida para Entrega</div>',
				iconSize: [200, 30],
				iconAnchor: [100, 15],
			}),
		}).addTo(this.map);
	}

	async reverseGeocode(lat, lng) {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
			);
			const data = await response.json();

			if (data && data.display_name) {
				// Solo rellenar el campo de información adicional con la dirección completa
				const addressForm = this.querySelector("#addressForm");
				if (addressForm) {
					const notesInput = addressForm.querySelector("#notes");

					if (notesInput && !notesInput.value.trim()) {
						// Si el campo de notas está vacío, rellenarlo con la dirección completa
						notesInput.value = data.display_name;
					}
				}
			}
		} catch (error) {
			console.error("Error en geocodificación inversa:", error);
		}
	}

	attachEventListeners() {
		const addAddressBtn = this.querySelector("#addAddressBtn");
		const modal = this.querySelector("#addressModal");
		const closeModal = this.querySelector("#closeModal");
		const cancelBtn = this.querySelector("#cancelBtn");
		const addressForm = this.querySelector("#addressForm");
		const addressNameInput = this.querySelector("#addressName");
		const phoneInput = this.querySelector("#phone");

		// Validación en tiempo real
		addressNameInput?.addEventListener("blur", () => {
			this.validateAddressName(addressNameInput);
			this.validateFormCompleteness();
		});

		phoneInput?.addEventListener("blur", () => {
			this.validatePhone(phoneInput);
			this.validateFormCompleteness();
		});

		// Limpiar errores al escribir y validar completitud
		addressNameInput?.addEventListener("input", () => {
			this.clearError(addressNameInput);
			this.validateFormCompleteness();
		});

		phoneInput?.addEventListener("input", () => {
			this.clearError(phoneInput);
			this.validateFormCompleteness();
		});

		// Abrir modal para agregar
		addAddressBtn?.addEventListener("click", () => {
			this.openAddModal();
		});

		// Cerrar modal
		const closeModalFn = () => {
			modal.style.display = "none";
			this.resetForm();
		};

		closeModal?.addEventListener("click", closeModalFn);
		cancelBtn?.addEventListener("click", closeModalFn);

		// Cerrar modal al hacer clic fuera
		modal?.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModalFn();
			}
		});

		// Manejar envío del formulario
		addressForm?.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleSaveAddress();
		});

		// Event delegation para botones de acciones de direcciones
		const addressesListElement = this.querySelector("#addressesList");
		addressesListElement?.addEventListener("click", (e) => {
			const button = e.target.closest("button[data-action]");
			if (!button) return;

			const action = button.dataset.action;
			const addressId = button.dataset.id;

			switch (action) {
				case "setDefault":
					this.setDefaultAddress(addressId);
					break;
				case "edit":
					this.openEditModal(addressId);
					break;
				case "delete":
					this.deleteAddress(addressId);
					break;
			}
		});
	}

	/**
	 * Abrir modal para agregar nueva dirección
	 */
	openAddModal() {
		const modal = this.querySelector("#addressModal");
		const modalTitle = this.querySelector("#modalTitle");
		const saveBtn = this.querySelector("#saveAddressBtn");

		// Configurar modal para agregar
		modalTitle.textContent = "📍 Agregar Nueva Dirección";
		saveBtn.textContent = "💾 Guardar Dirección";

		// Limpiar formulario

		// Mostrar modal
		modal.style.display = "flex";
	}

	/**
	 * Abrir modal para editar dirección existente
	 */
	async openEditModal(addressId) {
		try {
			const modal = this.querySelector("#addressModal");
			const modalTitle = this.querySelector("#modalTitle");
			const saveBtn = this.querySelector("#saveAddressBtn");

			// Configurar modal para editar
			modalTitle.textContent = "✏️ Editar Dirección";
			saveBtn.textContent = "💾 Actualizar Dirección";

			// Obtener datos de la dirección
			const response = await addressesService.getAddressById(addressId);

			// La respuesta puede tener diferentes estructuras, vamos a manejar ambas
			const address = response.data?.address || response.data || response;

			// Llenar formulario con datos existentes
			const addressIdInput = this.querySelector("#addressId");
			const addressNameInput = this.querySelector("#addressName");
			const phoneInput = this.querySelector("#phone");
			const notesInput = this.querySelector("#notes");
			const latSpan = this.querySelector("#selectedLat");
			const lngSpan = this.querySelector("#selectedLng");

			// Usar addressId del parámetro si no viene en la respuesta
			addressIdInput.value = address._id || address.id || addressId;
			addressNameInput.value = address.name || "";
			phoneInput.value = address.phone || "";
			notesInput.value = address.notes || "";

			// Establecer coordenadas
			if (address.coordinates) {
				latSpan.textContent = address.coordinates.lat.toFixed(6);
				lngSpan.textContent = address.coordinates.lng.toFixed(6);

				// Colocar marcador en el mapa
				if (this.marker) {
					this.map.removeLayer(this.marker);
				}
				this.marker = L.marker([
					address.coordinates.lat,
					address.coordinates.lng,
				]).addTo(this.map);
				this.map.setView(
					[address.coordinates.lat, address.coordinates.lng],
					15,
				);
			}

			// Validar completitud del formulario
			this.validateFormCompleteness();

			// Mostrar modal
			modal.style.display = "flex";
		} catch (error) {
			console.error("Error cargando dirección para editar:", error);
			Toast.error(`Error al cargar la dirección: ${error.message}`);
		}
	}

	resetForm() {
		const form = this.querySelector("#addressForm");
		if (form) {
			form.reset();
		}

		// Limpiar el ID de dirección (para asegurar que no quede en modo edición)
		const addressIdInput = this.querySelector("#addressId");
		if (addressIdInput) {
			addressIdInput.value = "";
		}

		// Limpiar coordenadas
		const latSpan = this.querySelector("#selectedLat");
		const lngSpan = this.querySelector("#selectedLng");
		if (latSpan && lngSpan) {
			latSpan.textContent = "No seleccionada";
			lngSpan.textContent = "No seleccionada";
		}

		// Remover marcador
		if (this.marker) {
			this.map.removeLayer(this.marker);
			this.marker = null;
		}

		// Limpiar errores
		this.clearAllErrors();

		// Deshabilitar el botón de guardar
		this.validateFormCompleteness();
	}

	// Funciones de validación
	validateAddressName(input) {
		const addressName = input.value.trim();

		if (!addressName) {
			this.showError(input, "El nombre de la dirección es requerido");
			return false;
		}

		if (addressName.length < 2) {
			this.showError(input, "El nombre debe tener al menos 2 caracteres");
			return false;
		}

		this.clearError(input);
		return true;
	}

	validatePhone(input) {
		const phone = input.value.trim();

		if (!phone) {
			this.showError(input, "El número de teléfono es requerido");
			return false;
		}

		// Validación básica de teléfono (al menos 8 dígitos)
		const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
		if (!phoneRegex.test(phone)) {
			this.showError(input, "Por favor ingresa un número de teléfono válido");
			return false;
		}

		this.clearError(input);
		return true;
	}

	showError(input, message) {
		input.classList.add("error");
		const errorElement = this.querySelector(`#${input.id}-error`);
		if (errorElement) {
			errorElement.textContent = message;
			errorElement.classList.add("show");
		}
	}

	clearError(input) {
		input.classList.remove("error");
		const errorElement = this.querySelector(`#${input.id}-error`);
		if (errorElement) {
			errorElement.classList.remove("show");
		}
	}

	clearAllErrors() {
		const inputs = this.querySelectorAll(".form-input");
		inputs.forEach((input) => {
			this.clearError(input);
		});
	}

	// Función para validar si el formulario está completo y habilitar/deshabilitar el botón
	validateFormCompleteness() {
		const addressNameInput = this.querySelector("#addressName");
		const phoneInput = this.querySelector("#phone");
		const latSpan = this.querySelector("#selectedLat");
		const saveBtn = this.querySelector("#saveAddressBtn");

		if (!addressNameInput || !phoneInput || !latSpan || !saveBtn) {
			return;
		}

		const hasName = addressNameInput.value.trim().length >= 2;
		const hasPhone = phoneInput.value.trim().length >= 8;
		const hasLocation = latSpan.textContent !== "No seleccionada";

		const isFormComplete = hasName && hasPhone && hasLocation;

		// Habilitar o deshabilitar el botón
		saveBtn.disabled = !isFormComplete;

		// Agregar clase visual para el estado disabled
		if (isFormComplete) {
			saveBtn.classList.remove("disabled");
		} else {
			saveBtn.classList.add("disabled");
		}
	}

	async handleSaveAddress() {
		const form = this.querySelector("#addressForm");
		const formData = new FormData(form);

		// Obtener inputs para validación
		const addressIdInput = this.querySelector("#addressId");
		const addressNameInput = this.querySelector("#addressName");
		const phoneInput = this.querySelector("#phone");

		const latSpan = this.querySelector("#selectedLat");
		const lngSpan = this.querySelector("#selectedLng");

		// Verificar si es edición o creación
		const isEdit = addressIdInput.value.trim() !== "";
		const addressId = addressIdInput.value;

		// Validar campos obligatorios
		const isAddressNameValid = this.validateAddressName(addressNameInput);
		const isPhoneValid = this.validatePhone(phoneInput);

		// Validar coordenadas
		if (!latSpan || !lngSpan || latSpan.textContent === "No seleccionada") {
			Toast.error("📍 Por favor, selecciona una ubicación en el mapa");
			return;
		}

		// Verificar que las coordenadas estén dentro de Panamá
		const lat = parseFloat(latSpan.textContent);
		const lng = parseFloat(lngSpan.textContent);

		if (!this.isWithinPanama(lat, lng)) {
			Toast.error("La ubicación seleccionada debe estar dentro de Panamá");
			return;
		}

		// Si hay errores de validación, no continuar
		if (!isAddressNameValid || !isPhoneValid) {
			Toast.error("Por favor, corrige los errores en el formulario");
			return;
		}

		// Recopilar toda la información
		const addressData = {
			name: formData.get("addressName"),
			phone: formData.get("phone"),
			notes: formData.get("notes"),
			coordinates: {
				lat: parseFloat(latSpan.textContent),
				lng: parseFloat(lngSpan.textContent),
			},
		};

		try {
			// Deshabilitar el botón mientras se procesa
			const saveBtn = this.querySelector("#saveAddressBtn");
			saveBtn.disabled = true;
			const originalText = saveBtn.textContent;
			saveBtn.textContent = isEdit ? "💾 Actualizando..." : "💾 Guardando...";

			// Llamar al servicio correspondiente
			let response;
			if (isEdit) {
				response = await addressesService.updateAddress(addressId, addressData);
			} else {
				response = await addressesService.createAddress(addressData);
			}

			Toast.success(
				`Dirección ${isEdit ? "actualizada" : "guardada"} exitosamente`,
			);

			// Cerrar modal
			const modal = this.querySelector("#addressModal");
			modal.style.display = "none";
			this.resetForm();

			// Recargar la lista de direcciones
			this.loadAddresses();
		} catch (error) {
			console.error(
				`Error ${isEdit ? "actualizando" : "guardando"} dirección:`,
				error,
			);
			Toast.error(
				`Error al ${isEdit ? "actualizar" : "guardar"} la dirección: ${
					error.message
				}`,
			);

			// Rehabilitar el botón
			const saveBtn = this.querySelector("#saveAddressBtn");
			saveBtn.disabled = false;
			saveBtn.textContent = originalText;
		}
	}
	async loadAddresses() {
		try {
			const addressesList = this.querySelector("#addressesList");
			if (!addressesList) return;

			// Mostrar loading
			addressesList.innerHTML = `
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando direcciones...</p>
				</div>
			`;

			// Obtener direcciones del servidor
			const response = await addressesService.getAllAddresses();
			const addresses = response.data?.addresses || [];

			if (addresses.length === 0) {
				addressesList.innerHTML = `
					<div class="addresses-empty">
						<p>📍 No tienes direcciones guardadas</p>
						<p>Agrega tu primera dirección para facilitar tus pedidos</p>
					</div>
				`;
				return;
			}

			// Renderizar las direcciones
			addressesList.innerHTML = addresses
				.map(
					(address) => `
				<div class="address-item ${address.isDefault ? "default" : ""}" data-id="${
						address._id
					}">
					<div class="address-header">
						<h3>${address.name}</h3>
						${
							address.isDefault
								? '<span class="default-badge">📍 Predeterminada</span>'
								: ""
						}
					</div>
					<div class="address-details">
						<p><strong>📱 Teléfono:</strong> ${address.phone}</p>
						${address.notes ? `<p><strong>📝 Notas:</strong> ${address.notes}</p>` : ""}
						<p><strong>📍 Ubicación:</strong> ${address.coordinates.lat.toFixed(
							6,
						)}, ${address.coordinates.lng.toFixed(6)}</p>
					</div>
					<div class="address-actions">
						<div>
            ${
							!address.isDefault
								? `<button class="btn btn-secondary btn-small" data-action="setDefault" data-id="${address._id}">🏠 Predeterminada</button>`
								: ""
						}
            </div>
            		<button class="btn btn-primary btn-small" data-action="edit" data-id="${
									address._id
								}">✏️ Editar</button>
						<button class="btn btn-danger btn-small" data-action="delete" data-id="${
							address._id
						}">🗑️ Eliminar</button>
            <div>
            </div>
				
					</div>
				</div>
			`,
				)
				.join("");
		} catch (error) {
			console.error("Error cargando direcciones:", error);
			const addressesList = this.querySelector("#addressesList");
			if (addressesList) {
				addressesList.innerHTML = `
					<div class="addresses-error">
						<p>❌ Error al cargar las direcciones</p>
						<p>${error.message}</p>
						<button class="btn btn-primary" onclick="this.closest('addresses-component').loadAddresses()">🔄 Reintentar</button>
					</div>
				`;
			}
			Toast.error(`Error al cargar las direcciones: ${error.message}`);
		}
	}

	/**
	 * Establecer dirección como predeterminada
	 */
	async setDefaultAddress(addressId) {
		try {
			await addressesService.setDefaultAddress(addressId);
			Toast.success("Dirección establecida como predeterminada");
			this.loadAddresses(); // Recargar la lista
		} catch (error) {
			console.error("Error al establecer dirección predeterminada:", error);
			Toast.error(`Error: ${error.message}`);
		}
	}

	/**
	 * Eliminar dirección
	 */
	async deleteAddress(addressId) {
		const confirmed = await showConfirmDelete(
			"¿Estás seguro de que deseas eliminar esta dirección?",
			"Confirmar eliminación",
		);

		if (!confirmed) {
			return;
		}

		try {
			await addressesService.deleteAddress(addressId);
			Toast.success("Dirección eliminada exitosamente");
			this.loadAddresses(); // Recargar la lista
		} catch (error) {
			console.error("Error al eliminar dirección:", error);
			Toast.error(`Error: ${error.message}`);
		}
	}
}

customElements.define("addresses-component", AddressesComponent);
