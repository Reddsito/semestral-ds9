import { router } from "../services/router.js";
import { authStore } from "../stores/authStore.js";
import { routeStore } from "../stores/routeStore.js";
import { Toast } from "./Toast.js";

class NavbarComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.render();

		this.unsubscribe = authStore.subscribe((state) => {
			this.updateFromAuthStore();
		});

		this.routeUnsubscribe = routeStore.subscribe((state) => {
			this.updateActiveRoute();
		});

		this.updateFromAuthStore();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		if (this.routeUnsubscribe) {
			this.routeUnsubscribe();
		}
	}

	updateFromAuthStore() {
		const state = authStore.getState();
		this.updateNavbar(state);
		this.updateActiveRoute();
	}

	updateActiveRoute() {
		const currentPath = routeStore.getCurrentPath();
		const navLinks = this.querySelectorAll(".nav-link");

		navLinks.forEach((link) => {
			link.classList.remove("active");
		});

		navLinks.forEach((link) => {
			const href = link.getAttribute("href");

			if (
				href === currentPath ||
				(href === "/" && currentPath === "/inicio") ||
				(href === "/inicio" && currentPath === "/")
			) {
				link.classList.add("active");
			}
		});
	}

	render() {
		this.innerHTML = `
		<link rel="stylesheet" href="/styles/navbar.css" />
			<nav class="nav-container">
				<div>
					<h2 class="nav-brand">PrintForge</h2>
				</div>
				<ul class="nav-menu" id="nav-menu">
					<li>
						<a href="/" class="nav-link" id="nav-home">
							🏠 Inicio
						</a>
					</li>
				</ul>
			</nav>
		`;
	}

	updateNavbar(state) {
		const navMenu = this.querySelector("#nav-menu");
		const currentPath = routeStore.getCurrentPath();

		// Usar la URL del avatar que ya viene en el store (ya es firmada)
		let avatarUrl = null;
		let hasAvatar = false;

		if (state.isAuthenticated && state.user) {
			if (state.user.avatar) {
				avatarUrl = state.user.avatar;
				hasAvatar = true;
			} else if (state.user.avatarKey) {
				// Si tiene avatarKey pero no avatar, significa que la URL expiró
				// pero el usuario sí tiene avatar
				hasAvatar = true;
			}
		}

		// Actualizar el logo según el rol
		const homeLink = navMenu.querySelector("#nav-home");
		if (homeLink) {
			if (state.isAuthenticated && state.user && state.user.role === "admin") {
				homeLink.innerHTML = "📊 Dashboard";
				homeLink.setAttribute("href", "/panel");
			} else {
				homeLink.innerHTML = "🏠 Inicio";
				homeLink.setAttribute("href", "/");
			}
		}

		const dynamicItems = navMenu.querySelectorAll("li:not(:first-child)");
		dynamicItems.forEach((item) => item.remove());

		if (state.isAuthenticated && state.user) {
			// Si es admin, mostrar navbar específico de admin
			if (state.user.role === "admin") {
				// Perfil
				const profileItem = document.createElement("li");
				profileItem.innerHTML = `
					<a href="/profile" class="nav-link" id="nav-profile">
						👤 Perfil
					</a>
				`;
				navMenu.appendChild(profileItem);
			} else {
				// Para usuarios normales, mostrar calculadora si NO estamos en el panel
				if (!currentPath.includes("/panel")) {
					const calculatorItem = document.createElement("li");
					calculatorItem.innerHTML = `
						<a href="/calculator" class="nav-link" id="nav-calculator">
							🧮 Calculadora
						</a>
					`;
					navMenu.appendChild(calculatorItem);
				}

				// Cotizaciones para usuarios normales
				const quotesItem = document.createElement("li");
				quotesItem.innerHTML = `
					<a href="/quotes" class="nav-link" id="nav-quotes">
						📋 Mis Cotizaciones
					</a>
				`;
				navMenu.appendChild(quotesItem);

				const ordersItem = document.createElement("li");
				ordersItem.innerHTML = `
					<a href="/orders" class="nav-link" id="nav-orders">
						📦 Mis Órdenes
					</a>
				`;
				navMenu.appendChild(ordersItem);

				// Perfil para usuarios normales
				const profileItem = document.createElement("li");
				profileItem.innerHTML = `
					<a href="/profile" class="nav-link" id="nav-profile">
						👤 Perfil
					</a>
				`;
				navMenu.appendChild(profileItem);
			}

			const userItem = document.createElement("li");
			userItem.innerHTML = `
				<span class="nav-user">
					<div class="nav-avatar">
						${
							hasAvatar && avatarUrl
								? `<img src="${avatarUrl}" alt="Avatar de ${state.user.firstName}" class="nav-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
								: ""
						}
						<div class="nav-avatar-placeholder" style="${
							hasAvatar && avatarUrl ? "display: none;" : "display: flex;"
						}">${state.user.firstName.charAt(0).toUpperCase()}</div>
					</div>
					<span class="nav-user-name">${state.user.firstName}${
				state.user.lastName ? ` ${state.user.lastName}` : ""
			}</span>
				</span>
			`;
			navMenu.appendChild(userItem);

			const logoutItem = document.createElement("li");
			logoutItem.innerHTML = `
				<a href="#" class="nav-link auth-link" id="nav-logout">
					🚪 Salir
				</a>
			`;
			navMenu.appendChild(logoutItem);
		} else {
			const loginItem = document.createElement("li");
			loginItem.innerHTML = `
				<a href="/login" class="nav-link auth-link" id="nav-login">
					🔑 Login
				</a>
			`;
			navMenu.appendChild(loginItem);

			const registerItem = document.createElement("li");
			registerItem.innerHTML = `
				<a href="/register" class="nav-link auth-link" id="nav-register">
					📝 Registro
				</a>
			`;
			navMenu.appendChild(registerItem);
		}

		this.attachNavLinks();
	}

	attachNavLinks() {
		const navLinks = this.querySelectorAll(".nav-link");

		navLinks.forEach((link) => {
			// Aseguramos que sea un elemento válido
			if (!(link instanceof HTMLElement)) {
				return;
			}

			link.onclick = (e) => {
				e.preventDefault();
				const href = link.getAttribute("href");

				if (href === "#") {
					this.handleLogout();
				} else {
					router.navigate(href);
				}
			};
		});
	}

	async handleLogout() {
		const confirmed = await showConfirm(
			"¿Estás seguro de que quieres cerrar sesión?",
			"Confirmar cierre de sesión",
		);

		if (confirmed) {
			authStore.logout();
			router.navigate("/");
		}
	}
}

customElements.define("navbar-component", NavbarComponent);
