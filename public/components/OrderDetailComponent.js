import { authStore } from "../stores/authStore.js";
import { Toast } from "../components/Toast.js";
import { orderService } from "../services/orderServices.js";
import { fileService } from "../services/fileService.js";
import { navigate } from "../services/router.js";

class OrderDetailComponent extends HTMLElement {
	constructor() {
		super();
		this.order = null;
		this.orderId = null;
		this.userRole = null;
		this.unsubscribe = null;
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.model = null;
		this.controls = null;
	}

	async connectedCallback() {
		if (!authStore.isAuthenticated()) {
			this.renderAuthRequired();
			return;
		}

		this.userRole = authStore.getUser()?.role || "user";
		this.orderId = this.getOrderIdFromUrl();

		this.unsubscribe = authStore.subscribe((state) => {
			if (!state.isAuthenticated) {
				this.renderAuthRequired();
			} else {
				this.userRole = state.user?.role || "user";
				this.loadOrderDetails();
			}
		});

		await this.loadOrderDetails();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		// Limpiar Three.js
		if (this.renderer) {
			this.renderer.dispose();
		}
	}

	getOrderIdFromUrl() {
		// Intentar obtener el ID de los parámetros de la ruta primero
		const pathParts = window.location.pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		// Verificar si es un ObjectId válido (24 caracteres hexadecimales)
		if (lastPart && /^[0-9a-fA-F]{24}$/.test(lastPart)) {
			return lastPart;
		}

		// Si no es válido, intentar obtener de la URL actual
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get("id") || lastPart;
	}

	async loadOrderDetails() {
		if (!this.orderId) {
			this.renderError("ID de orden no válido");
			return;
		}

		try {
			const response = await orderService.getOrderById(this.orderId);
			this.order = response.result?.data;

			if (!this.order) {
				this.renderError("Orden no encontrada");
				return;
			}

			this.render();

			// Cargar el modelo 3D si existe
			if (this.order.fileId) {
				await this.loadModel3D();
			}
		} catch (error) {
			console.error("Error cargando detalles de la orden:", error);
			Toast.error("Error cargando detalles de la orden");
			this.renderError("Error al cargar los detalles de la orden");
		}
	}

	async loadModel3D() {
		try {
			console.log("🔍 Iniciando carga de modelo 3D...");
			console.log("📄 FileId:", this.order.fileId);

			// Obtener información del archivo usando el servicio
			const fileResponse = await fileService.getFileById(this.order.fileId);
			console.log("📄 Respuesta del servicio de archivos:", fileResponse);

			if (
				!fileResponse.success ||
				!fileResponse.result?.data?.file?.downloadUrl
			) {
				console.error(
					"❌ URL de descarga no disponible en la respuesta:",
					fileResponse,
				);
				throw new Error("URL de descarga no disponible");
			}

			const downloadUrl = fileResponse.result.data.file.downloadUrl;
			const fileName = fileResponse.result.data.file.originalName;

			console.log("📄 URL de descarga:", downloadUrl);
			console.log("📄 Nombre del archivo:", fileName);

			// Cargar el modelo desde la URL primero
			console.log("📦 Cargando modelo desde URL...");
			const geometry = await this.loadModelFromUrl(downloadUrl, fileName);

			// Inicializar Three.js después de cargar el modelo
			console.log("🔧 Inicializando Three.js...");
			this.initThreeJS();

			// Procesar la geometría para mostrarla
			console.log("🔧 Procesando geometría para visualización...");
			this.processGeometry(geometry);
		} catch (error) {
			console.error("❌ Error cargando modelo 3D:", error);
			console.error("❌ Stack trace:", error.stack);
			Toast.warning("No se pudo cargar el modelo 3D");

			// Mostrar placeholder de error
			const container = this.querySelector("#modelViewer");
			if (container) {
				container.innerHTML = `
					<div class="model-placeholder">
						<div class="model-icon">❌</div>
						<p>Error cargando modelo</p>
						<small>${error.message}</small>
					</div>
				`;
			}
		}
	}

	initThreeJS() {
		const container = this.querySelector("#modelViewer");

		if (!container) return;

		// Limpiar contenedor y agregar controles
		container.innerHTML = `
			<div id="threejs-container"></div>
			<div class="model-controls">
				<button class="model-control-btn" id="resetViewBtn" title="Resetear vista">🔄</button>
				<button class="model-control-btn" id="wireframeBtn" title="Modo wireframe">🔲</button>
				<button class="model-control-btn" id="fullscreenBtn" title="Pantalla completa">⛶</button>
			</div>
		`;

		const threeContainer = container.querySelector("#threejs-container");

		// Crear escena
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xf0f0f0);

		// Crear cámara
		this.camera = new THREE.PerspectiveCamera(
			75,
			threeContainer.clientWidth / threeContainer.clientHeight,
			0.1,
			1000,
		);
		this.camera.position.set(0, 0, 5);

		// Crear renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(
			threeContainer.clientWidth,
			threeContainer.clientHeight,
		);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		threeContainer.appendChild(this.renderer.domElement);

		// Crear controles
		this.controls = new THREE.OrbitControls(
			this.camera,
			this.renderer.domElement,
		);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.enableZoom = true;
		this.controls.enablePan = true;
		this.controls.enableRotate = true;

		// Agregar luces
		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 5);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);

		// Función de animación
		const animate = () => {
			requestAnimationFrame(animate);
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
		};
		animate();

		// Manejar redimensionamiento
		window.addEventListener("resize", () => {
			if (this.camera && this.renderer && threeContainer) {
				this.camera.aspect =
					threeContainer.clientWidth / threeContainer.clientHeight;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize(
					threeContainer.clientWidth,
					threeContainer.clientHeight,
				);
			}
		});
	}

	setupModelControls() {
		const resetBtn = this.querySelector("#resetViewBtn");
		const wireframeBtn = this.querySelector("#wireframeBtn");
		const fullscreenBtn = this.querySelector("#fullscreenBtn");

		if (resetBtn) {
			resetBtn.addEventListener("click", () => {
				this.resetView();
			});
		}

		if (wireframeBtn) {
			wireframeBtn.addEventListener("click", () => {
				this.toggleWireframe();
			});
		}

		if (fullscreenBtn) {
			fullscreenBtn.addEventListener("click", () => {
				this.toggleFullscreen();
			});
		}
	}

	resetView() {
		if (!this.model || !this.camera) return;

		this.fitCameraToModel();
		Toast.info("Vista reseteada");
	}

	toggleWireframe() {
		if (!this.model) return;

		this.model.material.wireframe = !this.model.material.wireframe;
		const wireframeBtn = this.querySelector("#wireframeBtn");
		if (wireframeBtn) {
			wireframeBtn.textContent = this.model.material.wireframe ? "🔳" : "🔲";
		}
		Toast.info(
			this.model.material.wireframe
				? "Modo wireframe activado"
				: "Modo sólido activado",
		);
	}

	toggleFullscreen() {
		const container = this.querySelector("#modelViewer");
		if (!container) return;

		if (!document.fullscreenElement) {
			container
				.requestFullscreen()
				.then(() => {})
				.catch((err) => {
					console.error("Error entrando en pantalla completa:", err);
					Toast.error("No se pudo activar pantalla completa");
				});
		} else {
			document.exitFullscreen().then(() => {});
		}
	}

	async loadModelFromUrl(url, fileName) {
		try {
			console.log("🔍 Iniciando carga de modelo desde URL:", url);
			console.log("📄 Nombre del archivo:", fileName);

			// Mostrar estado de carga
			const container = this.querySelector("#modelViewer");
			if (container) {
				container.innerHTML = `
					<div class="loading-model">
						<div class="loading-spinner"></div>
						<p>Cargando modelo 3D...</p>
					</div>
				`;
			}

			let geometry;
			const fileExtension = fileName.toLowerCase();
			console.log("📦 Extensión del archivo:", fileExtension);

			if (fileExtension.endsWith(".stl")) {
				console.log("📦 Procesando archivo STL...");
				// Para archivos STL
				const arrayBuffer = await fileService.getFileAsArrayBuffer(url);
				console.log("📦 ArrayBuffer obtenido, tamaño:", arrayBuffer.byteLength);

				const loader = new THREE.STLLoader();
				geometry = loader.parse(arrayBuffer);
				console.log("✅ Geometría STL parseada exitosamente");
			} else if (fileExtension.endsWith(".obj")) {
				console.log("📦 Procesando archivo OBJ...");
				// Para archivos OBJ
				const text = await fileService.getFileAsText(url);
				console.log("📦 Texto OBJ obtenido, longitud:", text.length);

				const loader = new THREE.OBJLoader();
				const object = loader.parse(text);
				console.log("✅ Objeto OBJ parseado exitosamente");

				// Combinar todas las geometrías del objeto
				geometry = new THREE.BufferGeometry();
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
				console.log("✅ Geometría OBJ procesada exitosamente");
			} else {
				throw new Error("Formato de archivo no soportado");
			}

			console.log("✅ Modelo 3D cargado exitosamente");

			return geometry;
		} catch (error) {
			console.error("❌ Error cargando modelo desde URL:", error);
			console.error("❌ Stack trace:", error.stack);
			Toast.error("Error cargando el modelo 3D");

			// Mostrar placeholder de error
			const container = this.querySelector("#modelViewer");
			if (container) {
				container.innerHTML = `
					<div class="model-placeholder">
						<div class="model-icon">❌</div>
						<p>Error cargando modelo</p>
						<small>${error.message}</small>
					</div>
				`;
			}
			return null; // Return null on error
		}
	}

	processGeometry(geometry) {
		// Limpiar modelo anterior
		if (this.model) {
			this.scene.remove(this.model);
		}

		// Centrar y escalar la geometría
		geometry.computeBoundingBox();
		const center = geometry.boundingBox.getCenter(new THREE.Vector3());
		const size = geometry.boundingBox.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 2 / maxDim;

		// Crear material con mejor apariencia
		const material = new THREE.MeshPhongMaterial({
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			flatShading: false,
			shininess: 30,
			transparent: true,
			opacity: 0.9,
		});

		// Crear mesh
		this.model = new THREE.Mesh(geometry, material);
		this.model.scale.set(scale, scale, scale);
		this.model.position.sub(center.multiplyScalar(scale));

		// Agregar a la escena
		this.scene.add(this.model);

		// Ajustar cámara al modelo
		this.fitCameraToModel();

		// Configurar controles después de cargar el modelo
		this.setupModelControls();
	}

	fitCameraToModel() {
		if (!this.model || !this.camera) return;

		const box = new THREE.Box3().setFromObject(this.model);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());

		const maxDim = Math.max(size.x, size.y, size.z);
		const fov = this.camera.fov * (Math.PI / 180);
		let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

		cameraZ *= 1.5; // Ajustar para mejor vista

		this.camera.position.set(center.x, center.y, center.z + cameraZ);
		this.camera.lookAt(center);
		this.camera.updateProjectionMatrix();

		// Actualizar controles
		if (this.controls) {
			this.controls.target.copy(center);
			this.controls.update();
		}
	}

	renderAuthRequired() {
		this.innerHTML = `
			<div class="order-detail-container">
				<div class="auth-required">
					<h2>🔐 Autenticación Requerida</h2>
					<p>Debes iniciar sesión para ver los detalles de la orden.</p>
					<a href="/login" class="btn btn-primary">Iniciar Sesión</a>
				</div>
			</div>
		`;
	}

	renderError(message) {
		this.innerHTML = `
			<div class="order-detail-container">
				<div class="error-state">
					<h2>❌ Error</h2>
					<p>${message}</p>
					<button class="btn btn-primary" onclick="window.history.back()">Volver</button>
				</div>
			</div>
		`;
	}

	getStatusColor(status) {
		const statusColors = {
			RECEIVED: "#6c757d",
			PROCESSING: "#17a2b8",
			SHIPPED: "#ffc107",
			COMPLETED: "#28a745",
			CANCELLED: "#dc3545",
		};
		return statusColors[status] || "#6c757d";
	}

	getStatusText(status) {
		const statusTexts = {
			RECEIVED: "Recibido",
			PROCESSING: "En Producción",
			SHIPPED: "Enviado",
			COMPLETED: "Completado",
			CANCELLED: "Cancelado",
		};
		return statusTexts[status] || status;
	}

	formatDate(dateString) {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	render() {
		if (!this.order) {
			this.renderError("Orden no encontrada");
			return;
		}

		const statusColor = this.getStatusColor(this.order.status);
		const statusText = this.getStatusText(this.order.status);

		this.innerHTML = `
			<link rel="stylesheet" href="/styles/order-detail.css" />
			<div class="order-detail-container">
				<!-- Header -->
				<div class="order-header">
					<button class="btn btn-secondary back-btn" onclick="window.history.back()">
						← Volver a Pedidos
					</button>
					<div class="order-title">
						<h1>${this.order.file?.originalName || "Modelo 3D"}</h1>
						<div class="order-info">
							<span class="order-number">Pedido #${this.order.orderNumber}</span>
							<span class="order-status" style="background-color: ${statusColor}">
								${statusText}
							</span>
						</div>
					</div>
				</div>

				<!-- Main Content -->
				<div class="order-content">
					<!-- Left Column -->
					<div class="order-left-column">
						<!-- Order Status Timeline -->
						<div class="status-card">
							<h3>Estado del Pedido</h3>
							<div class="timeline">
								${this.renderTimeline()}
							</div>
						</div>

						<!-- Order Notes -->
						<div class="notes-card">
							<h3>Notas del Pedido</h3>
							<div class="notes-content">
								${this.order.priceBreakdown?.calculationNotes || "Sin notas adicionales"}
							</div>
						</div>
					</div>

					<!-- Right Column -->
					<div class="order-right-column">
						<!-- 3D Model Viewer -->
						<div class="model-card">
							<h3>Modelo 3D</h3>
							<div class="model-viewer" id="modelViewer">
								<div class="model-placeholder">
									<div class="model-icon">📦</div>
									<p>Cargando modelo...</p>
								</div>
							</div>
							<div class="model-specs">
								<div class="spec-item">
									<span>Dimensiones:</span>
									<span>${this.getModelDimensions()}</span>
								</div>
								<div class="spec-item">
									<span>Volumen:</span>
									<span>${this.getModelVolume()}</span>
								</div>
								<div class="spec-item">
									<span>Tiempo de impresión:</span>
									<span>${this.getPrintTime()}</span>
								</div>
							</div>
						</div>

						<!-- Production Progress -->
						<div class="progress-card">
							<h3>Progreso de Producción</h3>
							<div class="progress-info">
								<span>Completado</span>
								<span>${this.getProgressPercentage()}%</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
							</div>
							<div class="total-price">
								<span class="price-amount">$${
									this.order.totalPrice?.toFixed(2) || "0.00"
								}</span>
								<span class="price-label">Precio total</span>
							</div>
						</div>

						<!-- Order Details -->
						<div class="details-card">
							<h3>Detalles del Pedido</h3>
							<div class="details-grid">
								<div class="detail-item">
									<span>Fecha de pedido:</span>
									<span>${this.formatDate(this.order.createdAt)}</span>
								</div>
								<div class="detail-item">
									<span>Entrega estimada:</span>
									<span>${this.formatDate(this.order.estimatedDelivery)}</span>
								</div>
								<div class="detail-item">
									<span>Material:</span>
									<span>${this.order.materialId?.name || "N/A"}</span>
								</div>
								<div class="detail-item">
									<span>Acabado:</span>
									<span>${this.order.finishId?.name || "N/A"}</span>
								</div>
							</div>
							<div class="order-actions">
								<button class="btn btn-primary repeat-order" data-id="${this.order._id}">
									🔄 Repetir Pedido
								</button>
								<button class="btn btn-secondary contact-support">
									📞 Contactar Soporte
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.setupEventListeners();
	}

	renderTimeline() {
		const statuses = [
			{
				key: "RECEIVED",
				text: "Tu pedido ha sido recibido y está en cola para revisión.",
				date: this.order.createdAt,
			},
			{
				key: "PROCESSING",
				text: "Modelo validado técnicamente. Sin problemas detectados.",
				date: this.order.statusUpdatedAt,
			},
			{
				key: "SHIPPED",
				text: "Tu pieza está siendo impresa actualmente.",
				date: null,
			},
			{ key: "COMPLETED", text: "Revisión final y acabados.", date: null },
			{ key: "DELIVERED", text: "Preparación para envío.", date: null },
		];

		return statuses
			.map((status, index) => {
				const isActive = this.order.status === status.key;
				const isCompleted = this.isStatusCompleted(status.key);
				const isCurrent = this.order.status === status.key;

				return `
				<div class="timeline-item ${isCompleted ? "completed" : ""} ${
					isCurrent ? "current" : ""
				}">
					<div class="timeline-dot ${isCompleted ? "completed" : ""} ${
					isCurrent ? "current" : ""
				}"></div>
					<div class="timeline-content">
						<div class="timeline-text">${status.text}</div>
						<div class="timeline-date">${
							status.date ? this.formatDate(status.date) : "Pendiente"
						}</div>
					</div>
				</div>
			`;
			})
			.join("");
	}

	isStatusCompleted(statusKey) {
		const statusOrder = [
			"RECEIVED",
			"PROCESSING",
			"SHIPPED",
			"COMPLETED",
			"DELIVERED",
		];
		const currentIndex = statusOrder.indexOf(this.order.status);
		const statusIndex = statusOrder.indexOf(statusKey);
		return statusIndex <= currentIndex;
	}

	getModelDimensions() {
		// Simular dimensiones basadas en el peso del material
		const weight = this.order.priceBreakdown?.materialCost?.weight || 0;
		const size = Math.cbrt(weight) * 10;
		return `${Math.round(size)}x${Math.round(size * 0.7)}x${Math.round(
			size * 0.5,
		)} mm`;
	}

	getModelVolume() {
		const weight = this.order.priceBreakdown?.materialCost?.weight || 0;
		return `${weight.toFixed(1)} cm³`;
	}

	getPrintTime() {
		const weight = this.order.priceBreakdown?.materialCost?.weight || 0;
		const hours = Math.round(weight * 0.5);
		const minutes = Math.round((weight * 0.5 - hours) * 60);
		return `${hours}h ${minutes}m`;
	}

	getProgressPercentage() {
		const statusOrder = [
			"RECEIVED",
			"PROCESSING",
			"SHIPPED",
			"COMPLETED",
			"DELIVERED",
		];
		const currentIndex = statusOrder.indexOf(this.order.status);
		return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
	}

	setupEventListeners() {
		// Event listener para repetir pedido
		this.querySelector(".repeat-order")?.addEventListener("click", (e) => {
			const orderId = e.target.dataset.id;
			// Aquí podrías implementar la lógica para repetir el pedido
			Toast.info("Función de repetir pedido en desarrollo");
		});

		// Event listener para contactar soporte
		this.querySelector(".contact-support")?.addEventListener("click", () => {
			Toast.info("Función de contacto con soporte en desarrollo");
		});
	}
}

customElements.define("order-detail-component", OrderDetailComponent);
