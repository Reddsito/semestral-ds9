import { navigate } from "../services/router.js";
import { checkoutStore } from "../stores/checkoutStore.js";
import { Toast } from "./Toast.js";

class CalculatorComponent extends HTMLElement {
	constructor() {
		super();
		this.materials = [];
		this.finishes = [];
		this.selectedFile = null;
		this.quote = null;
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.controls = null;
		this.model = null;
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
		<link rel="stylesheet" href="/styles/calculator.css" />
			<div class="calculator-container">
				<div class="calculator-header">
					<h2>🖨️ Calculadora de Impresión 3D</h2>
					<p>Sube tu archivo STL/OBJ y obtén una cotización instantánea</p>
				</div>

				<div class="calculator-content">
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

						<!-- Visor 3D -->
						<div class="form-section">
							<h3>👁️ Vista Previa 3D</h3>
							<div id="viewer3d" class="viewer-3d" style="display: none;">
								<div class="viewer-controls">
									<button class="btn btn-sm btn-secondary" id="resetViewBtn">🔄 Resetear Vista</button>
									<button class="btn btn-sm btn-secondary" id="wireframeBtn">🔲 Wireframe</button>
								</div>
								<div id="threejs-container"></div>
							</div>
							<div id="noFileMessage" class="no-file-message">
								<p>📁 Sube un archivo para ver la vista previa 3D</p>
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
							<button class="btn btn-secondary quote-back-btn" id="backToCalculatorBtn">
								← Volver a la calculadora
							</button>
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
							<button class="btn btn-primary" id="saveQuoteBtn">💾 Guardar Cotización</button>
							<button class="btn btn-success" id="createOrderBtn">🛒 Crear Pedido</button>
						</div>
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

		// Save quote button
		const saveQuoteBtn = this.querySelector("#saveQuoteBtn");
		saveQuoteBtn.addEventListener("click", () => this.saveQuote());

		// Remove file button
		const removeFileBtn = this.querySelector("#removeFileBtn");
		removeFileBtn.addEventListener("click", () => this.removeFile());

		// Create order button
		const createOrderBtn = this.querySelector("#createOrderBtn");
		createOrderBtn.addEventListener("click", () => this.createOrder());

		// Back to calculator button
		const backToCalculatorBtn = this.querySelector("#backToCalculatorBtn");
		backToCalculatorBtn.addEventListener("click", () =>
			this.backToCalculator(),
		);

		// 3D Viewer controls
		const resetViewBtn = this.querySelector("#resetViewBtn");
		const wireframeBtn = this.querySelector("#wireframeBtn");

		if (resetViewBtn) {
			resetViewBtn.addEventListener("click", () => this.resetView());
		}
		if (wireframeBtn) {
			wireframeBtn.addEventListener("click", () => this.toggleWireframe());
		}
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
		this.loadModel3D(file);
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
			const confirmed = await showConfirm(
				"Debes iniciar sesión para subir archivos. ¿Quieres ir a la página de login?",
				"Autenticación requerida",
			);
			if (confirmed) {
				window.location.href = "/login";
			}
			return;
		}

		// Verificar que el token no esté expirado
		try {
			const tokenData = JSON.parse(atob(token.split(".")[1]));
			const now = Date.now() / 1000;
			if (tokenData.exp < now) {
				const confirmed = await showConfirm(
					"Tu sesión ha expirado. ¿Quieres ir a la página de login?",
					"Sesión expirada",
				);
				if (confirmed) {
					localStorage.removeItem("token");
					window.location.href = "/login";
				}
				return;
			}
		} catch (error) {
			console.error("Error verificando token:", error);
			const confirmed = await showConfirm(
				"Error verificando tu sesión. ¿Quieres ir a la página de login?",
				"Error de sesión",
			);
			if (confirmed) {
				localStorage.removeItem("token");
				window.location.href = "/login";
			}
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

			if (!quoteData.success) {
				throw new Error(quoteData.message);
			}

			this.quote = quoteData.result.data;

			// Asegurar que tenemos los IDs necesarios
			this.quote.fileId = uploadData.result.data.file.id;
			this.quote.materialId = materialSelect.value;
			this.quote.finishId = finishSelect.value;

			// Asegurar que priceBreakdown tenga la estructura correcta
			if (this.quote.breakdown) {
				this.quote.priceBreakdown = {
					materialCost: this.quote.breakdown.materialCost?.total || 0,
					finishCost: this.quote.breakdown.finishCost?.total || 0,
					volumeCost: this.quote.breakdown.volumeCost || 0,
					quantityMultiplier: this.quote.breakdown.quantityMultiplier || 1,
				};
			}

			checkoutStore.setState({ ...this.quote, totalPrice: this.quote.total });
			this.displayQuote();
		} catch (error) {
			console.error("Error calculando cotización:", error);

			// Proporcionar contexto más específico según el tipo de error
			let errorMessage = error.message;

			if (error.message.includes("Usuario no autenticado")) {
				errorMessage =
					"Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.";
				localStorage.removeItem("token");
				const confirmed = await showConfirm(
					"Tu sesión ha expirado. ¿Quieres ir a la página de login?",
					"Sesión expirada",
				);
				if (confirmed) {
					window.location.href = "/login";
				}
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
		const calculatorForm = this.querySelector(".calculator-form");

		quoteMaterial.textContent = this.quote.material;
		quoteFinish.textContent = this.quote.finish;
		quoteWeight.textContent = `${this.quote.weight.toFixed(2)}g`;
		quoteQuantity.textContent = this.quote.quantity;
		quoteTotal.textContent = `$${this.quote.total.toFixed(2)}`;

		// Ocultar toda la calculadora y mostrar solo la cotización
		calculatorForm.style.display = "none";
		quoteResult.style.display = "block";

		// Mostrar Toast de éxito
		Toast.success("¡Cotización calculada exitosamente!");
	}

	async loadModel3D(file) {
		try {
			// Mostrar el visor 3D
			const viewer3d = this.querySelector("#viewer3d");
			const noFileMessage = this.querySelector("#noFileMessage");

			viewer3d.style.display = "block";
			noFileMessage.style.display = "none";

			// Inicializar Three.js si no está inicializado
			if (!this.scene) {
				this.initThreeJS();
			}

			// Limpiar modelo anterior
			if (this.model) {
				this.scene.remove(this.model);
			}

			// Cargar el nuevo modelo
			await this.loadModel(file);
		} catch (error) {
			console.error("Error cargando modelo 3D:", error);
			Toast.error("Error cargando la vista previa 3D");
		}
	}

	initThreeJS() {
		const container = this.querySelector("#threejs-container");

		// Crear escena
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xf0f0f0);

		// Crear cámara
		this.camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000,
		);
		this.camera.position.set(0, 0, 5);

		// Crear renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(this.renderer.domElement);

		// Agregar controles
		this.controls = new THREE.OrbitControls(
			this.camera,
			this.renderer.domElement,
		);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		// Agregar luces
		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 5);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);

		// Agregar grid helper
		const gridHelper = new THREE.GridHelper(10, 10);
		this.scene.add(gridHelper);

		// Función de animación
		const animate = () => {
			requestAnimationFrame(animate);
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
		};
		animate();

		// Manejar redimensionamiento
		window.addEventListener("resize", () => {
			this.camera.aspect = container.clientWidth / container.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(container.clientWidth, container.clientHeight);
		});
	}

	async loadModel(file) {
		return new Promise((resolve, reject) => {
			if (file.name.toLowerCase().endsWith(".stl")) {
				// Para archivos STL - usar ArrayBuffer
				const reader = new FileReader();
				reader.onload = (event) => {
					try {
						const loader = new THREE.STLLoader();
						const geometry = loader.parse(event.target.result);
						this.processGeometry(geometry);
						resolve();
					} catch (error) {
						console.error("Error parsing STL:", error);
						reject(error);
					}
				};
				reader.onerror = reject;
				reader.readAsArrayBuffer(file);
			} else {
				// Para archivos OBJ - usar texto
				const reader = new FileReader();
				reader.onload = (event) => {
					try {
						const loader = new THREE.OBJLoader();
						const object = loader.parse(event.target.result);

						// Combinar todas las geometrías del objeto
						const geometry = new THREE.BufferGeometry();
						const positions = [];
						const normals = [];

						object.traverse((child) => {
							if (child.isMesh) {
								const childGeometry = child.geometry;
								if (childGeometry.attributes.position) {
									const positionArray = childGeometry.attributes.position.array;
									const normalArray = childGeometry.attributes.normal
										? childGeometry.attributes.normal.array
										: [];

									for (let i = 0; i < positionArray.length; i += 3) {
										positions.push(
											positionArray[i],
											positionArray[i + 1],
											positionArray[i + 2],
										);
									}

									for (let i = 0; i < normalArray.length; i += 3) {
										normals.push(
											normalArray[i],
											normalArray[i + 1],
											normalArray[i + 2],
										);
									}
								}
							}
						});

						geometry.setAttribute(
							"position",
							new THREE.Float32BufferAttribute(positions, 3),
						);
						if (normals.length > 0) {
							geometry.setAttribute(
								"normal",
								new THREE.Float32BufferAttribute(normals, 3),
							);
						}

						this.processGeometry(geometry);
						resolve();
					} catch (error) {
						console.error("Error parsing OBJ:", error);
						reject(error);
					}
				};
				reader.onerror = reject;
				reader.readAsText(file);
			}
		});
	}

	processGeometry(geometry) {
		// Centrar y escalar la geometría
		geometry.computeBoundingBox();
		const center = geometry.boundingBox.getCenter(new THREE.Vector3());
		const size = geometry.boundingBox.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 2 / maxDim;

		// Crear material
		const material = new THREE.MeshPhongMaterial({
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			flatShading: true,
		});

		// Crear mesh
		this.model = new THREE.Mesh(geometry, material);
		this.model.scale.setScalar(scale);
		this.model.position.sub(center.multiplyScalar(scale));
		this.model.castShadow = true;
		this.model.receiveShadow = true;

		this.scene.add(this.model);

		// Ajustar cámara al modelo
		this.fitCameraToModel();
	}

	fitCameraToModel() {
		if (!this.model) return;

		const box = new THREE.Box3().setFromObject(this.model);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const fov = this.camera.fov * (Math.PI / 180);
		let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

		cameraZ *= 1.5; // Ajustar para mejor vista
		this.camera.position.set(center.x, center.y, center.z + cameraZ);
		this.camera.lookAt(center);
		this.controls.target.copy(center);
		this.controls.update();
	}

	resetView() {
		if (this.model) {
			this.fitCameraToModel();
		}
	}

	toggleWireframe() {
		if (this.model && this.model.material) {
			this.model.material.wireframe = !this.model.material.wireframe;
		}
	}

	removeFile() {
		this.selectedFile = null;
		this.querySelector("#fileInfo").style.display = "none";

		// Ocultar visor 3D
		const viewer3d = this.querySelector("#viewer3d");
		const noFileMessage = this.querySelector("#noFileMessage");
		viewer3d.style.display = "none";
		noFileMessage.style.display = "block";

		// Limpiar modelo 3D
		if (this.model && this.scene) {
			this.scene.remove(this.model);
			this.model = null;
		}

		this.updateCalculateButton();
	}

	async saveQuote() {
		if (!this.quote) {
			Toast.error("No hay cotización para guardar");
			return;
		}

		try {
			console.log("💾 Iniciando guardado de cotización...");

			// Crear diálogo para notas
			const notes = await this.showNotesDialog();

			const requestBody = {
				fileId: this.quote.fileId,
				materialId: this.quote.materialId,
				finishId: this.quote.finishId,
				quantity: this.quote.quantity,
				totalPrice: this.quote.total,
				priceBreakdown: this.quote.priceBreakdown,
				notes: notes || "",
			};

			console.log("📤 Enviando datos de cotización:", requestBody);

			const response = await fetch("/api/v1/quotes/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();
			console.log("📡 Respuesta del servidor:", data);

			if (data.success) {
				console.log(
					"✅ Cotización guardada exitosamente, reiniciando calculadora...",
				);
				Toast.success("Cotización guardada exitosamente");
				// Reiniciar la calculadora después de guardar con un pequeño delay
				setTimeout(() => {
					this.resetCalculator();
				}, 100);
			} else {
				console.log("❌ Error guardando cotización:", data.message);
				Toast.error(data.message || "Error guardando cotización");
			}
		} catch (error) {
			console.error("Error guardando cotización:", error);
			Toast.error("Error guardando cotización");
		}
	}

	resetCalculator() {
		console.log("🔄 ===== INICIANDO RESET CALCULATOR =====");
		console.log("🔄 Reiniciando calculadora...");

		// Limpiar archivo seleccionado
		this.selectedFile = null;
		this.quote = null;
		console.log("📁 Variables limpiadas");

		// Limpiar campos del formulario
		const fileInput = this.querySelector("#fileInput");
		const fileUpload = this.querySelector("#fileUpload");
		const fileInfo = this.querySelector("#fileInfo");
		const materialSelect = this.querySelector("#materialSelect");
		const finishSelect = this.querySelector("#finishSelect");
		const quantityInput = this.querySelector("#quantityInput");
		const materialInfo = this.querySelector("#materialInfo");
		const finishInfo = this.querySelector("#finishInfo");
		const calculateBtn = this.querySelector("#calculateBtn");
		const quoteSection = this.querySelector("#quoteResult");
		const calculatorForm = this.querySelector(".calculator-form");
		const saveBtn = this.querySelector("#saveQuoteBtn");
		const createOrderBtn = this.querySelector("#createOrderBtn");
		const viewer3d = this.querySelector("#viewer3d");
		const noFileMessage = this.querySelector("#noFileMessage");

		console.log("🔍 Elementos encontrados:", {
			fileInput: !!fileInput,
			fileUpload: !!fileUpload,
			fileInfo: !!fileInfo,
			materialSelect: !!materialSelect,
			finishSelect: !!finishSelect,
			quantityInput: !!quantityInput,
			calculateBtn: !!calculateBtn,
			quoteSection: !!quoteSection,
			calculatorForm: !!calculatorForm,
			saveBtn: !!saveBtn,
			createOrderBtn: !!createOrderBtn,
			viewer3d: !!viewer3d,
			noFileMessage: !!noFileMessage,
		});

		// Mostrar la calculadora y ocultar la cotización
		if (calculatorForm) {
			calculatorForm.style.display = "flex";
			console.log("📋 Calculator form mostrado");
		}
		if (quoteSection) {
			quoteSection.style.display = "none";
			console.log("💰 Quote result ocultado");
		}

		// Resetear archivo
		if (fileInput) {
			fileInput.value = "";
			console.log("📁 File input reseteado");
		}
		if (fileUpload) {
			fileUpload.style.display = "block";
			const placeholder = fileUpload.querySelector(".upload-placeholder");
			if (placeholder) placeholder.style.display = "block";
			console.log("📁 File upload restaurado");
		}
		if (fileInfo) {
			fileInfo.style.display = "none";
			console.log("📁 File info ocultado");
		}

		// Resetear visor 3D
		if (viewer3d) {
			viewer3d.style.display = "none";
			console.log("👁️ Viewer 3D ocultado");
		}
		if (noFileMessage) {
			noFileMessage.style.display = "block";
			console.log("👁️ No file message mostrado");
		}

		// Limpiar modelo 3D
		if (this.model && this.scene) {
			this.scene.remove(this.model);
			this.model = null;
			console.log("🗑️ Modelo 3D limpiado");
		}

		// Resetear material
		if (materialSelect) {
			materialSelect.value = "";
			console.log("🧱 Material select reseteado");
		}
		if (materialInfo) {
			materialInfo.style.display = "none";
			console.log("🧱 Material info ocultado");
		}

		// Resetear acabado
		if (finishSelect) {
			finishSelect.value = "";
			console.log("✨ Finish select reseteado");
		}
		if (finishInfo) {
			finishInfo.style.display = "none";
			console.log("✨ Finish info ocultado");
		}

		// Resetear cantidad
		if (quantityInput) {
			quantityInput.value = "1";
			console.log("🔢 Quantity input reseteado");
		}

		// Resetear botón calcular
		if (calculateBtn) {
			calculateBtn.disabled = true;
			console.log("🧮 Calculate button deshabilitado");
		}

		if (saveBtn) {
			saveBtn.style.display = "none";
			console.log("💾 Save button ocultado");
		}
		if (createOrderBtn) {
			createOrderBtn.style.display = "none";
			console.log("🛒 Create order button ocultado");
		}

		console.log("✅ ===== RESET CALCULATOR COMPLETADO =====");
	}

	showNotesDialog() {
		return new Promise((resolve) => {
			// Crear el modal
			const modal = document.createElement("div");
			modal.className = "notes-modal";
			modal.innerHTML = `
				<div class="notes-modal-content">
					<div class="notes-modal-header">
						<h3>📝 Agregar Notas</h3>
						<button class="notes-modal-close" id="closeNotesModal">&times;</button>
					</div>
					<div class="notes-modal-body">
						<p>¿Deseas agregar alguna nota a esta cotización? (opcional)</p>
						<textarea 
							id="notesTextarea" 
							placeholder="Escribe tus notas aquí..."
							rows="4"
							class="notes-textarea"
						></textarea>
					</div>
					<div class="notes-modal-footer">
						<button class="btn btn-secondary" id="cancelNotes">Cancelar</button>
						<button class="btn btn-primary" id="saveNotes">Guardar Cotización</button>
					</div>
				</div>
			`;

			// Agregar estilos
			const style = document.createElement("style");
			style.textContent = `
				.notes-modal {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 1000;
				}
				.notes-modal-content {
					background: white;
					border-radius: 8px;
					padding: 20px;
					max-width: 500px;
					width: 90%;
					max-height: 80vh;
					overflow-y: auto;
				}
				.notes-modal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20px;
					padding-bottom: 10px;
					border-bottom: 1px solid #eee;
				}
				.notes-modal-close {
					background: none;
					border: none;
					font-size: 24px;
					cursor: pointer;
					color: #666;
				}
				.notes-modal-close:hover {
					color: #333;
				}
				.notes-textarea {
					width: 100%;
					padding: 10px;
					border: 1px solid #ddd;
					border-radius: 4px;
					resize: vertical;
					font-family: inherit;
				}
				.notes-modal-footer {
					display: flex;
					justify-content: flex-end;
					gap: 10px;
					margin-top: 20px;
				}
			`;

			document.head.appendChild(style);
			document.body.appendChild(modal);

			// Event listeners
			const closeBtn = modal.querySelector("#closeNotesModal");
			const cancelBtn = modal.querySelector("#cancelNotes");
			const saveBtn = modal.querySelector("#saveNotes");
			const textarea = modal.querySelector("#notesTextarea");

			const cleanup = () => {
				document.body.removeChild(modal);
				document.head.removeChild(style);
			};

			closeBtn.addEventListener("click", () => {
				resolve(null);
				cleanup();
			});

			cancelBtn.addEventListener("click", () => {
				resolve(null);
				cleanup();
			});

			saveBtn.addEventListener("click", () => {
				resolve(textarea.value);
				cleanup();
			});

			// Cerrar con Escape
			document.addEventListener("keydown", function handleEscape(e) {
				if (e.key === "Escape") {
					resolve(null);
					cleanup();
					document.removeEventListener("keydown", handleEscape);
				}
			});

			// Cerrar al hacer clic fuera del modal
			modal.addEventListener("click", (e) => {
				if (e.target === modal) {
					resolve(null);
					cleanup();
				}
			});

			// Focus en el textarea
			setTimeout(() => textarea.focus(), 100);
		});
	}

	createOrder() {
		navigate(`/checkout`);
	}

	backToCalculator() {
		// Limpiar la cotización
		this.quote = null;

		// Mostrar la calculadora y ocultar la cotización
		const calculatorForm = this.querySelector(".calculator-form");
		const quoteResult = this.querySelector("#quoteResult");

		calculatorForm.style.display = "flex";
		quoteResult.style.display = "none";

		// Limpiar el estado del checkout store
		checkoutStore.setState({});

		Toast.info("Calculadora reiniciada");
	}
}

customElements.define("calculator-component", CalculatorComponent);
