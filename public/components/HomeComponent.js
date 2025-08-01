import { router } from "../services/router.js";
import { authStore } from "../stores/authStore.js";

class HomeComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
	}

	connectedCallback() {
		this.render();
		this.attachEventListeners();
		this.subscribeToAuthStore();
		// Actualizar inmediatamente con el estado actual
		this.updateFromAuthStore();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	subscribeToAuthStore() {
		this.unsubscribe = authStore.subscribe((state) => {
			this.updateFromAuthStore();
		});
	}

	updateFromAuthStore() {
		const state = authStore.getState();
		const newUser = state.user;

		// Si no hay usuario, hacer render inicial
		if (!newUser) {
			this.user = null;
			this.render();
			this.attachEventListeners();
			return;
		}

		// Si es la primera vez que se carga el usuario
		if (!this.user) {
			this.user = newUser;
			this.render();
			this.attachEventListeners();
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
			this.attachEventListeners();
		} else if (avatarChanged) {
			// Si solo cambió el avatar, actualizar solo el nombre si es necesario
			const nameElement = this.querySelector(".hero-title");
			if (nameElement) {
				nameElement.textContent = `🚀 ¡Bienvenido de vuelta, ${newUser.firstName}!`;
			}
		}
	}

	render() {
		if (this.user) {
			// Usuario autenticado - mostrar opciones principales
			this.innerHTML = `
				<link rel="stylesheet" href="/styles/home.css" />
				<div class="home-container">
					<div class="hero-section">
						<div class="hero-content">
							<h1 class="hero-title">🚀 ¡Bienvenido de vuelta, ${this.user.firstName}!</h1>
							<p class="hero-subtitle">
								¿Qué te gustaría hacer hoy? Calcula el precio de tu impresión o revisa tus pedidos.
							</p>
							<div class="hero-buttons">
								<a href="/calculator" class="hero-button primary" id="cta-calculator">
									🧮 Calcular Precio
								</a>
								<a href="/orders" class="hero-button secondary" id="cta-orders">
									📋 Mis Pedidos
								</a>
							</div>
						</div>
					</div>

					<div class="quick-actions">
						<div class="action-card">
							<span class="action-icon">🧮</span>
							<h3 class="action-title">Calculadora de Precios</h3>
							<p class="action-description">
								Sube tu modelo 3D y obtén una cotización instantánea con diferentes materiales y acabados.
							</p>
							<a href="/calculator" class="action-button" id="action-calculator">
								🧮 Ir a Calculadora
							</a>
						</div>

						<div class="action-card">
							<span class="action-icon">📋</span>
							<h3 class="action-title">Mis Pedidos</h3>
							<p class="action-description">
								Revisa el estado de tus pedidos, descarga archivos y gestiona tu historial de impresiones.
							</p>
							<a href="/orders" class="action-button" id="action-orders">
								📋 Ver Pedidos
							</a>
						</div>

							<div class="action-card">
							<span class="action-icon">📍</span>
							<h3 class="action-title"> Direcciones</h3>
							<p class="action-description">
								Gestiona tus direcciones de envío y facturación.
							</p>
							<a href="/profile/addresses" class="action-button" id="action-addresses">
								📍 Ir a Direcciones
							</a>
						</div>

						<div class="action-card">
							<span class="action-icon">👤</span>
							<h3 class="action-title">Mi Perfil</h3>
							<p class="action-description">
								Actualiza tu información personal, cambia contraseña y gestiona tu cuenta.
							</p>
							<a href="/profile" class="action-button" id="action-profile">
								👤 Ver Perfil
							</a>
						</div>
					</div>
				</div>
			`;
		} else {
			// Usuario no autenticado - mostrar landing page con CTA para login
			this.innerHTML = `
				<link rel="stylesheet" href="/styles/home.css" />
				<div class="home-container">
					<div class="hero-section">
						<div class="hero-content">
							<h1 class="hero-title">🚀 PrintForge</h1>
							<p class="hero-subtitle">
								La plataforma líder en impresión 3D. Diseña, imprime y crea el futuro con tecnología de vanguardia.
							</p>
							<div class="hero-buttons">
								<a href="/login" class="hero-button primary" id="cta-login">
									🔑 Iniciar Sesión
								</a>
								<a href="/register" class="hero-button secondary" id="cta-register">
									📝 Crear Cuenta
								</a>
							</div>
						</div>
					</div>

					<div class="features-section">
						<div class="feature-card">
							<span class="feature-icon">🎨</span>
							<h3 class="feature-title">Diseño Intuitivo</h3>
							<p class="feature-description">
								Herramientas de diseño fáciles de usar para crear modelos 3D únicos y personalizados.
							</p>
						</div>

						<div class="feature-card">
							<span class="feature-icon">⚡</span>
							<h3 class="feature-title">Impresión Rápida</h3>
							<p class="feature-description">
								Tecnología de impresión de alta velocidad sin comprometer la calidad del resultado.
							</p>
						</div>

						<div class="feature-card">
							<span class="feature-icon">🌱</span>
							<h3 class="feature-title">Materiales Sostenibles</h3>
							<p class="feature-description">
								Utilizamos materiales eco-friendly y reciclables para cuidar el medio ambiente.
							</p>
						</div>
					</div>

					<div class="stats-section">
						<h2 style="color: #2c3e50; margin: 0 0 16px 0; font-size: 2rem;">📊 Nuestros Números</h2>
						<p style="color: #7f8c8d; margin: 0; font-size: 1.1rem;">
							Miles de usuarios confían en PrintForge para sus proyectos de impresión 3D
						</p>
						
						<div class="stats-grid">
							<div class="stat-item">
								<div class="stat-number">50K+</div>
								<div class="stat-label">Proyectos Completados</div>
							</div>
							<div class="stat-item">
								<div class="stat-number">10K+</div>
								<div class="stat-label">Usuarios Activos</div>
							</div>
							<div class="stat-item">
								<div class="stat-number">99.9%</div>
								<div class="stat-label">Tiempo de Actividad</div>
							</div>
							<div class="stat-item">
								<div class="stat-number">24/7</div>
								<div class="stat-label">Soporte Técnico</div>
							</div>
						</div>
					</div>

					<div class="cta-section">
						<div class="cta-content">
							<h2 class="cta-title">🎯 ¿Listo para Crear?</h2>
							<p class="cta-description">
								Únete a nuestra comunidad de creadores y comienza a dar vida a tus ideas con impresión 3D de alta calidad.
							</p>
							<a href="/login" class="cta-button" id="final-cta">
								🚀 Comenzar Ahora
							</a>
						</div>
					</div>
				</div>
			`;
		}
	}

	attachEventListeners() {
		if (this.user) {
			// Event listeners para usuario autenticado
			const ctaCalculator = this.querySelector("#cta-calculator");
			const ctaOrders = this.querySelector("#cta-orders");
			const actionCalculator = this.querySelector("#action-calculator");
			const actionOrders = this.querySelector("#action-orders");
			const actionProfile = this.querySelector("#action-profile");
			const actionAddresses = this.querySelector("#action-addresses");

			if (actionAddresses) {
				actionAddresses.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/profile/addresses");
				});
			}

			if (ctaCalculator) {
				ctaCalculator.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/calculator");
				});
			}

			if (ctaOrders) {
				ctaOrders.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/orders");
				});
			}

			if (actionCalculator) {
				actionCalculator.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/calculator");
				});
			}

			if (actionOrders) {
				actionOrders.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/orders");
				});
			}

			if (actionProfile) {
				actionProfile.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/profile");
				});
			}
		} else {
			// Event listeners para usuario no autenticado
			const ctaRegister = this.querySelector("#cta-register");
			const ctaLogin = this.querySelector("#cta-login");
			const finalCta = this.querySelector("#final-cta");

			if (ctaRegister) {
				ctaRegister.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/register");
				});
			}

			if (ctaLogin) {
				ctaLogin.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/login");
				});
			}

			if (finalCta) {
				finalCta.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/login");
				});
			}
		}
	}
}

customElements.define("home-component", HomeComponent);
