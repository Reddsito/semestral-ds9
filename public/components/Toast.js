export const Toast = (() => {
	let container;

	const _createContainer = () => {
		container = document.getElementById("toast-container");
		if (!container) {
			container = document.createElement("div");
			container.id = "toast-container";
			document.body.appendChild(container);
		}
	};

	const _createToast = ({
		message = "",
		type = "success",
		duration = 6000,
	}) => {
		const toast = document.createElement("div");
		toast.classList.add("toast", `toast-${type}`);

		// Icono
		const icon = document.createElement("span");
		icon.className = "toast-icon";
		switch (type) {
			case "success":
				icon.textContent = "✅";
				break;
			case "error":
				icon.textContent = "❌";
				break;
			case "warning":
				icon.textContent = "⚠️";
				break;
			case "info":
				icon.textContent = "ℹ️";
				break;
			default:
				icon.textContent = "✅";
		}

		// Botón cerrar
		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "×";
		closeBtn.addEventListener("click", () => _removeToast(toast));

		// Barra de progreso
		const progressBar = document.createElement("div");
		progressBar.className = "toast-progress";
		progressBar.style.transition = `transform ${duration}ms linear`;

		// Estructura
		toast.appendChild(icon);
		toast.appendChild(document.createTextNode(message));
		toast.appendChild(closeBtn);
		toast.appendChild(progressBar);

		return toast;
	};

	const _removeToast = (toast) => {
		toast.style.transform = "translateX(100%)";
		toast.style.opacity = "0";
		setTimeout(() => {
			if (toast.parentNode) toast.remove();
		}, 300);
	};

	const show = ({ message = "", type = "success", duration = 6000 }) => {
		if (!container) _createContainer();
		const toast = _createToast({ message, type, duration });
		container.appendChild(toast);

		// Animar entrada
		setTimeout(() => {
			toast.style.transform = "translateX(0)";
			toast.style.opacity = "1";
		}, 10);

		// Barra de progreso
		setTimeout(() => {
			const progressBar = toast.querySelector(".toast-progress");
			if (progressBar) progressBar.style.transform = "scaleX(0)";
		}, 100);

		// Auto-remover
		setTimeout(() => _removeToast(toast), duration);
		return toast;
	};

	// Métodos de conveniencia
	const success = (message, duration) =>
		show({ message, type: "success", duration });
	const error = (message, duration) =>
		show({ message, type: "error", duration });
	const warning = (message, duration) =>
		show({ message, type: "warning", duration });
	const info = (message, duration) => show({ message, type: "info", duration });

	return { show, success, error, warning, info };
})();

// Función global para mostrar toasts
window.showToast = (message, type = "success", duration = 6000) => {
	return Toast.show({ message, type, duration });
};

// Métodos de conveniencia globales
window.showSuccessToast = (message, duration) =>
	Toast.success(message, duration);
window.showErrorToast = (message, duration) => Toast.error(message, duration);
window.showWarningToast = (message, duration) =>
	Toast.warning(message, duration);
window.showInfoToast = (message, duration) => Toast.info(message, duration);
