import { router } from "../services/router.js";
import { authStore } from "../stores/authStore.js";

class HomeComponent extends HTMLElement {
	constructor() {
		super();
		this.user = null;
	}

	connectedCallback() {
		console.log("🔧 HomeComponent connectedCallback llamado");
		this.render();
		this.attachEventListeners();
		this.subscribeToAuthStore();
		// Actualizar inmediatamente con el estado actual
		this.updateFromAuthStore();
	}

	disconnectedCallback() {
		console.log("🔧 HomeComponent disconnectedCallback llamado");
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	subscribeToAuthStore() {
		console.log("🔧 HomeComponent subscribeToAuthStore llamado");
		this.unsubscribe = authStore.subscribe((state) => {
			console.log("🔧 HomeComponent subscribeToAuthStore callback", state);
			this.updateFromAuthStore();
		});
	}

	updateFromAuthStore() {
		const state = authStore.getState();
		console.log("🔧 HomeComponent updateFromAuthStore", state);
		this.user = state.user;
		this.render();
		this.attachEventListeners();
	}

	render() {
		if (this.user) {
			// Usuario autenticado - mostrar opciones principales
			this.innerHTML = `
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
								<a href="/profile" class="hero-button secondary" id="cta-orders">
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
							<a href="/profile" class="action-button" id="action-orders">
								📋 Ver Pedidos
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

			if (ctaCalculator) {
				ctaCalculator.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/calculator");
				});
			}

			if (ctaOrders) {
				ctaOrders.addEventListener("click", (e) => {
					e.preventDefault();
					router.navigate("/profile");
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
					router.navigate("/profile");
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
