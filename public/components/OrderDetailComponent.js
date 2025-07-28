import { authStore } from "../stores/authStore.js";
import { Toast } from "../components/Toast.js";
import { orderService } from "../services/orderServices.js";
import { fileService } from "../services/fileService.js";

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
			console.log("hola", this.order);

			if (!this.order) {
				this.renderError("Orden no encontrada");
				return;
			}

			this.render();

			console.log("hola");

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
			TECHNICAL_REVIEW: "#ffc107",
			IN_PRODUCTION: "#17a2b8",
			QUALITY_CONTROL: "#6f42c1",
			SHIPPED: "#fd7e14",
			DELIVERED: "#28a745",
			CANCELED: "#dc3545",
		};
		return statusColors[status] || "#6c757d";
	}

	getStatusText(status) {
		const statusTexts = {
			RECEIVED: "Recibido",
			TECHNICAL_REVIEW: "Revisión Técnica",
			IN_PRODUCTION: "En Producción",
			QUALITY_CONTROL: "Control de Calidad",
			SHIPPED: "Enviado",
			DELIVERED: "Entregado",
			CANCELED: "Cancelado",
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
								<span>Estado actual: ${this.getStatusText(this.order.status)}</span>
								<span>${this.getProgressPercentage()}%</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill ${this.getProgressClass()}" style="width: ${this.getProgressPercentage()}%"></div>
							</div>
							<div class="progress-details">
								<div class="progress-step">
									<span class="step-label">Paso actual:</span>
									<span class="step-value">${this.getCurrentStepText()}</span>
								</div>
								<div class="progress-step">
									<span class="step-label">Tiempo estimado:</span>
									<span class="step-value">${this.getEstimatedTime()}</span>
								</div>
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
				text: "Tu pedido ha sido recibido y está en cola para revisión técnica.",
				subtext: "Verificando archivos y preparando para producción",
				icon: "📥",
				date: this.order.createdAt,
			},
			{
				key: "TECHNICAL_REVIEW",
				text: "Nuestros técnicos están revisando tu modelo para asegurar la calidad de impresión.",
				subtext: "Validando geometría, soportes y configuración",
				icon: "🔍",
				date: this.getStatusDate("TECHNICAL_REVIEW"),
			},
			{
				key: "IN_PRODUCTION",
				text: "Tu pieza está siendo impresa con los más altos estándares de calidad.",
				subtext: "Impresión en progreso - tiempo estimado: 1 - 3 días",
				icon: "⚙️",
				date: this.getStatusDate("IN_PRODUCTION"),
			},
			{
				key: "QUALITY_CONTROL",
				text: "Tu pieza está siendo revisada para garantizar que cumple con nuestros estándares.",
				subtext: "Verificando acabados, dimensiones y resistencia",
				icon: "🔬",
				date: this.getStatusDate("QUALITY_CONTROL"),
			},
			{
				key: "SHIPPED",
				text: "Tu pieza ha sido empaquetada y está lista para envío.",
				subtext: "Preparando embalaje y documentación de envío",
				icon: "📦",
				date: this.getStatusDate("SHIPPED"),
			},
			{
				key: "DELIVERED",
				text: "¡Tu pedido ha sido entregado exitosamente!",
				subtext: "Pedido completado y entregado al cliente",
				icon: "✅",
				date: this.getStatusDate("DELIVERED"),
			},
		];

		let timelineHTML = statuses
			.map((status, index) => {
				const isCompleted = this.isStatusCompleted(status.key);
				const isCurrent = this.order.status === status.key;
				const isCanceled = this.order.status === "CANCELED";

				return `
				<div class="timeline-item ${isCompleted ? "completed" : ""} ${
					isCurrent ? "current" : ""
				} ${isCanceled ? "canceled" : ""}">
					<div class="timeline-dot ${isCompleted ? "completed" : ""} ${
					isCurrent ? "current" : ""
				} ${isCanceled ? "canceled" : ""}">
						<span class="timeline-icon">${status.icon}</span>
					</div>
					<div class="timeline-content">
						<div class="timeline-text">${status.text}</div>
						<div class="timeline-subtext">${status.subtext}</div>
						<div class="timeline-date">${
							status.date === "COMPLETED"
								? "✅ Completado"
								: status.date
								? this.formatDate(status.date)
								: "Pendiente"
						}</div>
					</div>
				</div>
			`;
			})
			.join("");

		// Agregar mensaje especial para pedidos cancelados
		if (this.order.status === "CANCELED") {
			timelineHTML += `
				<div class="timeline-item canceled">
					<div class="timeline-dot canceled">
						<span class="timeline-icon">❌</span>
					</div>
					<div class="timeline-content">
						<div class="timeline-text">Pedido cancelado</div>
						<div class="timeline-subtext">Este pedido ha sido cancelado. Contacta con soporte si tienes alguna pregunta.</div>
						<div class="timeline-date">${this.formatDate(
							this.order.statusUpdatedAt ||
								this.order.updatedAt ||
								this.order.createdAt,
						)}</div>
					</div>
				</div>
			`;
		}

		return timelineHTML;
	}

	isStatusCompleted(statusKey) {
		const statusOrder = [
			"RECEIVED",
			"TECHNICAL_REVIEW",
			"IN_PRODUCTION",
			"QUALITY_CONTROL",
			"SHIPPED",
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
			"TECHNICAL_REVIEW",
			"IN_PRODUCTION",
			"QUALITY_CONTROL",
			"SHIPPED",
			"DELIVERED",
		];

		// Si el pedido está cancelado, el progreso es 0
		if (this.order.status === "CANCELED") {
			return 0;
		}

		const currentIndex = statusOrder.indexOf(this.order.status);
		// Si el estado no está en la lista, usar el índice más alto
		const maxIndex = statusOrder.length - 1;
		const adjustedIndex = currentIndex >= 0 ? currentIndex : maxIndex;

		return Math.round(((adjustedIndex + 1) / statusOrder.length) * 100);
	}

	getProgressClass() {
		const statusClassMap = {
			RECEIVED: "received",
			TECHNICAL_REVIEW: "technical-review",
			IN_PRODUCTION: "in-production",
			QUALITY_CONTROL: "quality-control",
			SHIPPED: "shipped",
			DELIVERED: "delivered",
			CANCELED: "canceled",
		};
		return statusClassMap[this.order.status] || "received";
	}

	getCurrentStepText() {
		const stepTexts = {
			RECEIVED: "Recepción del pedido",
			TECHNICAL_REVIEW: "Revisión técnica del modelo",
			IN_PRODUCTION: "Impresión 3D en progreso",
			QUALITY_CONTROL: "Control de calidad",
			SHIPPED: "Preparación para envío",
			DELIVERED: "Pedido entregado",
			CANCELED: "Pedido cancelado",
		};
		return stepTexts[this.order.status] || "Procesando";
	}

	getEstimatedTime() {
		const timeEstimates = {
			RECEIVED: "1-2 horas",
			TECHNICAL_REVIEW: "2-4 horas",
			IN_PRODUCTION: "1-3 días",
			QUALITY_CONTROL: "2-4 horas",
			SHIPPED: "1-2 días",
			DELIVERED: "Completado",
			CANCELED: "N/A",
		};
		return timeEstimates[this.order.status] || "Calculando...";
	}

	getStatusDate(statusKey) {
		const statusOrder = [
			"RECEIVED",
			"TECHNICAL_REVIEW",
			"IN_PRODUCTION",
			"QUALITY_CONTROL",
			"SHIPPED",
			"DELIVERED",
		];

		const currentStatusIndex = statusOrder.indexOf(this.order.status);
		const statusIndex = statusOrder.indexOf(statusKey);

		// Si es el estado actual, usar statusUpdatedAt
		if (this.order.status === statusKey) {
			return this.order.statusUpdatedAt;
		}

		// Si ya pasamos por este estado, mostrar como completado
		if (statusIndex < currentStatusIndex) {
			return "COMPLETED"; // Marcador especial para estados completados
		}

		// Si aún no hemos llegado a este estado, retornar null (pendiente)
		return null;
	}

	setupEventListeners() {
		// Event listener para contactar soporte
		this.querySelector(".contact-support")?.addEventListener("click", () => {
			const phoneNumber = "+50768970058";
			const message = encodeURIComponent(
				"Hola, necesito ayuda con mi pedido de impresión 3D.",
			);
			const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
			window.open(whatsappUrl, "_blank");
		});
	}
}

customElements.define("order-detail-component", OrderDetailComponent);
