import { Toast } from "./Toast.js";

class CalculatorComponent extends HTMLElement {
	constructor() {
		super();
		this.materials = [];
		this.finishes = [];
		this.selectedFile = null;
		this.quote = null;
	}

	connectedCallback() {
		// Verificar autenticación
		const token = localStorage.getItem("token");
		if (!token) {
			this.innerHTML = `
				<div class="calculator-container">
					<div class="auth-required">
						<h2>🔐 Autenticación Requerida</h2>
						<p>Debes iniciar sesión para usar la calculadora de impresión 3D.</p>
						<a href="/login" class="btn btn-primary">Iniciar Sesión</a>
					</div>
				</div>
			`;
			return;
		}

		this.render();
		this.loadMaterials();
		this.loadFinishes();
		this.setupEventListeners();
	}

	async loadMaterials() {
		try {
			const response = await fetch("/api/v1/quote/materials");
			const data = await response.json();

			if (data.success) {
				this.materials = data.result.data.materials;
				this.renderMaterialOptions();
			}
		} catch (error) {
			console.error("Error cargando materiales:", error);
		}
	}

	async loadFinishes() {
		try {
			const response = await fetch("/api/v1/quote/finishes");
			const data = await response.json();

			if (data.success) {
				this.finishes = data.result.data.finishes;
				this.renderFinishOptions();
			}
		} catch (error) {
			console.error("Error cargando acabados:", error);
		}
	}

	render() {
		this.innerHTML = `
			<div class="calculator-container">
				<div class="calculator-header">
					<h2>🖨️ Calculadora de Impresión 3D</h2>
					<p>Sube tu archivo STL/OBJ y obtén una cotización instantánea</p>
				</div>

				<div class="calculator-form">
					<!-- Subida de archivo -->
					<div class="form-section">
						<h3>📁 Archivo 3D</h3>
						<div class="file-upload-area" id="fileUpload">
							<div class="upload-placeholder">
								<div class="upload-icon">📁</div>
								<p>Arrastra tu archivo STL/OBJ aquí o haz clic para seleccionar</p>
								<input type="file" id="fileInput" accept=".stl,.obj" style="display: none;">
							</div>
						</div>
											<div id="fileInfo" class="file-info" style="display: none;">
						<div class="file-details">
							<span id="fileName"></span>
							<span id="fileSize"></span>
						</div>
						<button class="btn btn-secondary" id="removeFileBtn">Eliminar</button>
					</div>
					</div>

					<!-- Selección de material -->
					<div class="form-section">
						<h3>🧱 Material</h3>
						<select id="materialSelect" class="form-select">
							<option value="">Selecciona un material</option>
						</select>
						<div id="materialInfo" class="material-info" style="display: none;">
							<p><strong>Precio:</strong> $<span id="materialPrice">0</span> por gramo</p>
							<p><strong>Descripción:</strong> <span id="materialDescription"></span></p>
						</div>
					</div>

					<!-- Selección de acabado -->
					<div class="form-section">
						<h3>✨ Acabado</h3>
						<select id="finishSelect" class="form-select">
							<option value="">Selecciona un acabado</option>
						</select>
						<div id="finishInfo" class="finish-info" style="display: none;">
							<p><strong>Multiplicador:</strong> <span id="finishMultiplier">1.0</span>x</p>
							<p><strong>Descripción:</strong> <span id="finishDescription"></span></p>
						</div>
					</div>

					<!-- Cantidad -->
					<div class="form-section">
						<h3>🔢 Cantidad</h3>
						<input type="number" id="quantityInput" class="form-input" value="1" min="1" max="10">
					</div>

					<!-- Botón calcular -->
					<div class="form-section">
						<button id="calculateBtn" class="btn btn-primary" disabled>
							🧮 Calcular Cotización
						</button>
					</div>
				</div>

				<!-- Resultado de cotización -->
				<div id="quoteResult" class="quote-result" style="display: none;">
					<div class="quote-header">
						<h3>💰 Cotización</h3>
					</div>
					<div class="quote-details">
						<div class="quote-item">
							<span>Material:</span>
							<span id="quoteMaterial"></span>
						</div>
						<div class="quote-item">
							<span>Acabado:</span>
							<span id="quoteFinish"></span>
						</div>
						<div class="quote-item">
							<span>Peso estimado:</span>
							<span id="quoteWeight"></span>
						</div>
						<div class="quote-item">
							<span>Cantidad:</span>
							<span id="quoteQuantity"></span>
						</div>
						<div class="quote-item total">
							<span>Total:</span>
							<span id="quoteTotal"></span>
						</div>
					</div>
					<div class="quote-actions">
						<button class="btn btn-success" id="createOrderBtn">🛒 Crear Pedido</button>
					</div>
				</div>
			</div>
		`;
	}

	renderMaterialOptions() {
		const select = this.querySelector("#materialSelect");
		select.innerHTML = '<option value="">Selecciona un material</option>';

		this.materials.forEach((material) => {
			const option = document.createElement("option");
			option.value = material._id;
			option.textContent = `${material.name} - $${material.pricePerGram}/g`;
			select.appendChild(option);
		});
	}

	renderFinishOptions() {
		const select = this.querySelector("#finishSelect");
		select.innerHTML = '<option value="">Selecciona un acabado</option>';

		this.finishes.forEach((finish) => {
			const option = document.createElement("option");
			option.value = finish._id;
			option.textContent = `${finish.name} (${finish.priceMultiplier}x)`;
			select.appendChild(option);
		});
	}

	setupEventListeners() {
		// File upload
		const fileUpload = this.querySelector("#fileUpload");
		const fileInput = this.querySelector("#fileInput");

		fileUpload.addEventListener("click", () => fileInput.click());
		fileUpload.addEventListener("dragover", (e) => {
			e.preventDefault();
			fileUpload.classList.add("dragover");
		});
		fileUpload.addEventListener("dragleave", () => {
			fileUpload.classList.remove("dragover");
		});
		fileUpload.addEventListener("drop", (e) => {
			e.preventDefault();
			fileUpload.classList.remove("dragover");
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				this.handleFileSelect(files[0]);
			}
		});

		fileInput.addEventListener("change", (e) => {
			if (e.target.files.length > 0) {
				this.handleFileSelect(e.target.files[0]);
			}
		});

		// Material selection
		const materialSelect = this.querySelector("#materialSelect");
		materialSelect.addEventListener("change", () => this.updateMaterialInfo());

		// Finish selection
		const finishSelect = this.querySelector("#finishSelect");
		finishSelect.addEventListener("change", () => this.updateFinishInfo());

		// Quantity input
		const quantityInput = this.querySelector("#quantityInput");
		quantityInput.addEventListener("change", () =>
			this.updateCalculateButton(),
		);

		// Calculate button
		const calculateBtn = this.querySelector("#calculateBtn");
		calculateBtn.addEventListener("click", () => this.calculateQuote());

		// Remove file button
		const removeFileBtn = this.querySelector("#removeFileBtn");
		removeFileBtn.addEventListener("click", () => this.removeFile());

		// Create order button
		const createOrderBtn = this.querySelector("#createOrderBtn");
		createOrderBtn.addEventListener("click", () => this.createOrder());
	}

	handleFileSelect(file) {
		if (
			!file.name.toLowerCase().endsWith(".stl") &&
			!file.name.toLowerCase().endsWith(".obj")
		) {
			Toast.error("Solo se permiten archivos STL y OBJ");
			return;
		}

		this.selectedFile = file;
		this.updateFileInfo();
		this.updateCalculateButton();
	}

	updateFileInfo() {
		const fileInfo = this.querySelector("#fileInfo");
		const fileName = this.querySelector("#fileName");
		const fileSize = this.querySelector("#fileSize");

		fileName.textContent = this.selectedFile.name;
		fileSize.textContent = this.formatFileSize(this.selectedFile.size);
		fileInfo.style.display = "block";
	}

	formatFileSize(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	updateMaterialInfo() {
		const materialSelect = this.querySelector("#materialSelect");
		const materialInfo = this.querySelector("#materialInfo");
		const materialPrice = this.querySelector("#materialPrice");
		const materialDescription = this.querySelector("#materialDescription");

		if (materialSelect.value) {
			const material = this.materials.find(
				(m) => m._id === materialSelect.value,
			);
			if (material) {
				materialPrice.textContent = material.pricePerGram;
				materialDescription.textContent = material.description;
				materialInfo.style.display = "block";
			}
		} else {
			materialInfo.style.display = "none";
		}

		this.updateCalculateButton();
	}

	updateFinishInfo() {
		const finishSelect = this.querySelector("#finishSelect");
		const finishInfo = this.querySelector("#finishInfo");
		const finishMultiplier = this.querySelector("#finishMultiplier");
		const finishDescription = this.querySelector("#finishDescription");

		if (finishSelect.value) {
			const finish = this.finishes.find((f) => f._id === finishSelect.value);
			if (finish) {
				finishMultiplier.textContent = finish.priceMultiplier;
				finishDescription.textContent = finish.description;
				finishInfo.style.display = "block";
			}
		} else {
			finishInfo.style.display = "none";
		}

		this.updateCalculateButton();
	}

	updateCalculateButton() {
		const calculateBtn = this.querySelector("#calculateBtn");
		const materialSelect = this.querySelector("#materialSelect");
		const finishSelect = this.querySelector("#finishSelect");
		const quantityInput = this.querySelector("#quantityInput");

		const canCalculate =
			this.selectedFile &&
			materialSelect.value &&
			finishSelect.value &&
			quantityInput.value > 0;

		calculateBtn.disabled = !canCalculate;
	}

	async calculateQuote() {
		if (!this.selectedFile) {
			Toast.warning("Por favor selecciona un archivo");
			return;
		}

		// Verificar autenticación
		const token = localStorage.getItem("token");
		if (!token) {
			Toast.error(
				"Debes iniciar sesión para subir archivos. Serás redirigido a la página de login.",
			);
			window.location.href = "/login";
			return;
		}

		// Verificar que el token no esté expirado
		try {
			const tokenData = JSON.parse(atob(token.split(".")[1]));
			const now = Date.now() / 1000;
			if (tokenData.exp < now) {
				Toast.error(
					"Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
				);
				localStorage.removeItem("token");
				window.location.href = "/login";
				return;
			}
		} catch (error) {
			console.error("Error verificando token:", error);
			Toast.error(
				"Error verificando tu sesión. Por favor, inicia sesión nuevamente.",
			);
			localStorage.removeItem("token");
			window.location.href = "/login";
			return;
		}

		try {
			// Mostrar Toast de procesamiento
			Toast.info("Subiendo y analizando archivo...");

			// Primero subir el archivo
			const formData = new FormData();
			formData.append("file", this.selectedFile);

			const uploadResponse = await fetch("/api/v1/files/upload", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: formData,
			});

			const uploadData = await uploadResponse.json();
			console.log("Upload response:", uploadData);

			if (!uploadData.success) {
				throw new Error(uploadData.message);
			}

			// Verificar estructura de respuesta
			if (
				!uploadData.result ||
				!uploadData.result.data ||
				!uploadData.result.data.file
			) {
				console.error("Estructura de respuesta inesperada:", uploadData);
				throw new Error("Respuesta del servidor inválida");
			}

			// Validar el archivo
			const validateResponse = await fetch(
				`/api/v1/files/${uploadData.result.data.file.id}/validate`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				},
			);

			const validateData = await validateResponse.json();

			if (!validateData.success) {
				throw new Error(validateData.message);
			}

			// Calcular cotización
			const materialSelect = this.querySelector("#materialSelect");
			const finishSelect = this.querySelector("#finishSelect");
			const quantityInput = this.querySelector("#quantityInput");

			const quantity = parseInt(quantityInput.value);
			console.log("🔢 Cantidad enviada desde frontend:", quantity);

			const quoteResponse = await fetch("/api/v1/quote/calculate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					fileId: uploadData.result.data.file.id,
					materialId: materialSelect.value,
					finishId: finishSelect.value,
					quantity: quantity,
				}),
			});

			const quoteData = await quoteResponse.json();
			console.log("Respuesta de cotización:", quoteData);

			if (!quoteData.success) {
				throw new Error(quoteData.message);
			}

			this.quote = quoteData.result.data;
			console.log("Quote asignado:", this.quote);
			this.displayQuote();
		} catch (error) {
			console.error("Error calculando cotización:", error);

			// Proporcionar contexto más específico según el tipo de error
			let errorMessage = error.message;

			if (error.message.includes("Usuario no autenticado")) {
				errorMessage =
					"Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.";
				localStorage.removeItem("token");
				setTimeout(() => {
					window.location.href = "/login";
				}, 2000);
			} else if (error.message.includes("Archivo no encontrado")) {
				errorMessage =
					"Error: El archivo no se pudo procesar correctamente. Intenta subir el archivo nuevamente.";
			} else if (error.message.includes("Respuesta del servidor inválida")) {
				errorMessage =
					"Error: Respuesta inesperada del servidor. Intenta nuevamente.";
			}

			Toast.error(`Error: ${errorMessage}`);
		}
	}

	displayQuote() {
		const quoteResult = this.querySelector("#quoteResult");
		const quoteMaterial = this.querySelector("#quoteMaterial");
		const quoteFinish = this.querySelector("#quoteFinish");
		const quoteWeight = this.querySelector("#quoteWeight");
		const quoteQuantity = this.querySelector("#quoteQuantity");
		const quoteTotal = this.querySelector("#quoteTotal");

		quoteMaterial.textContent = this.quote.material;
		quoteFinish.textContent = this.quote.finish;
		quoteWeight.textContent = `${this.quote.weight.toFixed(2)}g`;
		quoteQuantity.textContent = this.quote.quantity;
		quoteTotal.textContent = `$${this.quote.total.toFixed(2)}`;

		quoteResult.style.display = "block";

		// Mostrar Toast de éxito
		Toast.success("¡Cotización calculada exitosamente!");
	}

	removeFile() {
		this.selectedFile = null;
		this.querySelector("#fileInfo").style.display = "none";
		this.updateCalculateButton();
	}

	createOrder() {
		// TODO: Implementar creación de pedido
		Toast.info("Función de crear pedido próximamente disponible");
	}
}

customElements.define("calculator-component", CalculatorComponent);
