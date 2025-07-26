import { authStore } from "../stores/authStore.js";
import { Toast } from "./Toast.js";

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
		this.user = state.user;
		this.render();
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
			<link
			rel="stylesheet"
			href="/styles/addresses.css" />
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
						<div class="map-header">
							<h3>🗺️ Selecciona la ubicación</h3>
							<p>Haz clic en el mapa para seleccionar la ubicación exacta</p>
						</div>
						<div id="map" class="addresses-map"></div>
					</div>
				</div>

				<!-- Modal para agregar dirección -->
				<div class="modal" id="addAddressModal">
					<div class="modal-content">
						<div class="modal-header">
							<h2>➕ Agregar Nueva Dirección</h2>
							<button class="modal-close" id="closeModal">&times;</button>
						</div>
						<form id="addressForm" class="address-form">
							<div class="form-group">
								<label for="addressName" class="form-label">🏷️ Nombre de la dirección *</label>
								<input 
									type="text" 
									id="addressName" 
									name="addressName" 
									class="form-input" 
									placeholder="Ej: Casa, Oficina, etc."
									required
								>
								<div class="error-message" id="addressName-error">
									El nombre de la dirección es requerido
								</div>
							</div>

							<div class="form-group">
								<label for="street" class="form-label">🏠 Dirección completa</label>
								<input 
									type="text" 
									id="street" 
									name="street" 
									class="form-input" 
									placeholder="Calle, número, colonia"
									required
								>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="city" class="form-label">🏙️ Ciudad</label>
									<input 
										type="text" 
										id="city" 
										name="city" 
										class="form-input" 
										placeholder="Tu ciudad"
										required
									>
								</div>
								<div class="form-group">
									<label for="state" class="form-label">🗺️ Estado</label>
									<input 
										type="text" 
										id="state" 
										name="state" 
										class="form-input" 
										placeholder="Tu estado"
										required
									>
								</div>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="zipCode" class="form-label">📮 Código Postal</label>
									<input 
										type="text" 
										id="zipCode" 
										name="zipCode" 
										class="form-input" 
										placeholder="12345"
										required
									>
								</div>
								<div class="form-group">
									<label for="country" class="form-label">🌍 País</label>
									<input 
										type="text" 
										id="country" 
										name="country" 
										class="form-input" 
										value="Panamá"
										required
									>
								</div>
							</div>

							<div class="form-group">
								<label for="phone" class="form-label">� Número de teléfono *</label>
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
								<label for="notes" class="form-label">📝 Información extra</label>
								<textarea 
									id="notes" 
									name="notes" 
									class="form-input" 
									placeholder="Referencias, instrucciones especiales, información adicional..."
									rows="3"
								></textarea>
							</div>

							<div class="coordinates-info" id="coordinatesInfo">
								<p><strong>📍 Coordenadas seleccionadas:</strong></p>
								<p>Lat: <span id="selectedLat">-</span>, Lng: <span id="selectedLng">-</span></p>
							</div>

							<div class="form-actions">
								<button type="button" class="btn btn-secondary" id="cancelBtn">
									❌ Cancelar
								</button>
								<button type="submit" class="btn btn-primary" id="saveAddressBtn">
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

				// Crear el mapa
				this.map = L.map("map").setView([defaultLat, defaultLng], 13);

				// Agregar el tile layer (OpenStreetMap)
				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "© OpenStreetMap contributors",
				}).addTo(this.map);

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
							this.map.setView([lat, lng], 15);
							Toast.info("📍 Ubicación actual detectada");
						},
						(error) => {
							console.log("No se pudo obtener la ubicación:", error);
							Toast.info("🗺️ Usando ubicación por defecto (Panamá)");
						},
					);
				}
			}
		}, 100);
	}

	onMapClick(e) {
		const lat = e.latlng.lat;
		const lng = e.latlng.lng;

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

		// Realizar geocodificación inversa para obtener la dirección
		this.reverseGeocode(lat, lng);
	}

	async reverseGeocode(lat, lng) {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
			);
			const data = await response.json();

			if (data && data.display_name) {
				// Rellenar automáticamente algunos campos del formulario
				const addressForm = this.querySelector("#addressForm");
				if (addressForm) {
					const streetInput = addressForm.querySelector("#street");
					const cityInput = addressForm.querySelector("#city");
					const stateInput = addressForm.querySelector("#state");

					if (streetInput && data.address) {
						const street = [
							data.address.house_number,
							data.address.road,
							data.address.neighbourhood || data.address.suburb,
						]
							.filter(Boolean)
							.join(" ");

						if (street.trim()) {
							streetInput.value = street;
						}
					}

					if (cityInput && data.address?.city) {
						cityInput.value = data.address.city;
					}

					if (stateInput && data.address?.state) {
						stateInput.value = data.address.state;
					}
				}

				Toast.success("📍 Dirección detectada automáticamente");
			}
		} catch (error) {
			console.error("Error en geocodificación inversa:", error);
		}
	}

	attachEventListeners() {
		const addAddressBtn = this.querySelector("#addAddressBtn");
		const modal = this.querySelector("#addAddressModal");
		const closeModal = this.querySelector("#closeModal");
		const cancelBtn = this.querySelector("#cancelBtn");
		const addressForm = this.querySelector("#addressForm");
		const addressNameInput = this.querySelector("#addressName");
		const phoneInput = this.querySelector("#phone");

		// Validación en tiempo real
		addressNameInput?.addEventListener("blur", () => {
			this.validateAddressName(addressNameInput);
		});

		phoneInput?.addEventListener("blur", () => {
			this.validatePhone(phoneInput);
		});

		// Limpiar errores al escribir
		addressNameInput?.addEventListener("input", () => {
			this.clearError(addressNameInput);
		});

		phoneInput?.addEventListener("input", () => {
			this.clearError(phoneInput);
		});

		// Abrir modal
		addAddressBtn?.addEventListener("click", () => {
			modal.style.display = "flex";
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
	}

	resetForm() {
		const form = this.querySelector("#addressForm");
		if (form) {
			form.reset();
		}

		// Limpiar coordenadas
		const latSpan = this.querySelector("#selectedLat");
		const lngSpan = this.querySelector("#selectedLng");
		if (latSpan && lngSpan) {
			latSpan.textContent = "-";
			lngSpan.textContent = "-";
		}

		// Remover marcador
		if (this.marker) {
			this.map.removeLayer(this.marker);
			this.marker = null;
		}

		// Limpiar errores
		this.clearAllErrors();
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

	async handleSaveAddress() {
		const form = this.querySelector("#addressForm");
		const formData = new FormData(form);

		// Obtener inputs para validación
		const addressNameInput = this.querySelector("#addressName");
		const phoneInput = this.querySelector("#phone");

		const latSpan = this.querySelector("#selectedLat");
		const lngSpan = this.querySelector("#selectedLng");

		// Validar campos obligatorios
		const isAddressNameValid = this.validateAddressName(addressNameInput);
		const isPhoneValid = this.validatePhone(phoneInput);

		// Validar coordenadas
		if (!latSpan || !lngSpan || latSpan.textContent === "-") {
			Toast.error("📍 Por favor, selecciona una ubicación en el mapa");
			return;
		}

		// Si hay errores de validación, no continuar
		if (!isAddressNameValid || !isPhoneValid) {
			Toast.error("❌ Por favor, corrige los errores en el formulario");
			return;
		}

		// Recopilar toda la información
		const addressData = {
			name: formData.get("addressName"),
			phone: formData.get("phone"),
			street: formData.get("street"),
			city: formData.get("city"),
			state: formData.get("state"),
			zipCode: formData.get("zipCode"),
			country: formData.get("country"),
			notes: formData.get("notes"),
			coordinates: {
				lat: parseFloat(latSpan.textContent),
				lng: parseFloat(lngSpan.textContent),
			},
		};

		try {
			// Mostrar toda la información en consola
			console.log("=== 📍 INFORMACIÓN COMPLETA DE LA DIRECCIÓN ===");
			console.log("🏷️ Nombre:", addressData.name);
			console.log("📞 Teléfono:", addressData.phone);
			console.log("🏠 Dirección:", addressData.street);
			console.log("🏙️ Ciudad:", addressData.city);
			console.log("🗺️ Estado:", addressData.state);
			console.log("📮 Código Postal:", addressData.zipCode);
			console.log("🌍 País:", addressData.country);
			console.log("📝 Información Extra:", addressData.notes || "Ninguna");
			console.log("📍 Coordenadas:");
			console.log("   • Latitud:", addressData.coordinates.lat);
			console.log("   • Longitud:", addressData.coordinates.lng);
			console.log("📋 Objeto completo:", addressData);
			console.log("===============================================");

			// Por ahora, simular el guardado
			Toast.success("✅ Dirección guardada exitosamente");

			// Cerrar modal
			const modal = this.querySelector("#addAddressModal");
			modal.style.display = "none";
			this.resetForm();

			// Recargar la lista de direcciones
			this.loadAddresses();
		} catch (error) {
			console.error("Error guardando dirección:", error);
			Toast.error("❌ Error al guardar la dirección");
		}
	}

	async loadAddresses() {
		try {
			// Aquí irá la llamada a la API para cargar las direcciones
			// Por ahora, mostrar mensaje de que no hay direcciones
			const addressesList = this.querySelector("#addressesList");
			if (addressesList) {
				addressesList.innerHTML = `
					<div class="addresses-empty">
						<p>📍 No tienes direcciones guardadas</p>
						<p>Agrega tu primera dirección para facilitar tus pedidos</p>
					</div>
				`;
			}
		} catch (error) {
			console.error("Error cargando direcciones:", error);
			Toast.error("❌ Error al cargar las direcciones");
		}
	}
}

customElements.define("addresses-component", AddressesComponent);
