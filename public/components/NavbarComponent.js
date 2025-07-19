import { router } from "../services/router.js";
import { authStore } from "../stores/authStore.js";
import { routeStore } from "../stores/routeStore.js";

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

		const dynamicItems = navMenu.querySelectorAll("li:not(:first-child)");
		dynamicItems.forEach((item) => item.remove());

		if (state.isAuthenticated && state.user) {
			const dashboardItem = document.createElement("li");
			dashboardItem.innerHTML = `
				<a href="/dashboard" class="nav-link" id="nav-dashboard">
					📊 Dashboard
				</a>
			`;
			navMenu.appendChild(dashboardItem);

			const userItem = document.createElement("li");
			userItem.innerHTML = `
				<span class="nav-user">
					👤 ${state.user.firstName} ${state.user.lastName}
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
			link.addEventListener("click", (e) => {
				e.preventDefault();
				const href = link.getAttribute("href");

				if (href === "#") {
					this.handleLogout();
				} else {
					router.navigate(href);
				}
			});
		});
	}

	handleLogout() {
		authStore.logout();
		router.navigate("/");
	}
}

customElements.define("navbar-component", NavbarComponent);
