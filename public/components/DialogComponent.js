export const Dialog = (() => {
	let container;

	const _createContainer = () => {
		container = document.getElementById("dialog-container");
		if (!container) {
			container = document.createElement("div");
			container.id = "dialog-container";
			container.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
				opacity: 0;
				transition: opacity 0.3s ease;
			`;
			document.body.appendChild(container);
		}
	};

	const _createDialog = ({
		title,
		message,
		type = "confirm",
		confirmText = "Confirmar",
		cancelText = "Cancelar",
	}) => {
		const dialog = document.createElement("div");
		dialog.style.cssText = `
			background: white;
			border-radius: 12px;
			padding: 24px;
			max-width: 400px;
			width: 90%;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
			transform: scale(0.9);
			transition: transform 0.3s ease;
			position: relative;
		`;

		// Icono según tipo
		let icon = "❓";
		let iconColor = "#6c757d";

		switch (type) {
			case "confirm":
				icon = "⚠️";
				iconColor = "#ffc107";
				break;
			case "delete":
				icon = "🗑️";
				iconColor = "#dc3545";
				break;
			case "warning":
				icon = "⚠️";
				iconColor = "#fd7e14";
				break;
			case "info":
				icon = "ℹ️";
				iconColor = "#17a2b8";
				break;
		}

		dialog.innerHTML = `
			<div style="display: flex; align-items: center; margin-bottom: 16px;">
				<span style="font-size: 24px; margin-right: 12px;">${icon}</span>
				<h3 style="margin: 0; color: #333; font-size: 18px;">${title}</h3>
			</div>
			<p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
			<div style="display: flex; gap: 12px; justify-content: flex-end;">
				<button id="dialog-cancel" style="
					padding: 8px 16px;
					border: 1px solid #ddd;
					background: white;
					color: #666;
					border-radius: 6px;
					cursor: pointer;
					font-size: 14px;
					transition: all 0.2s ease;
				">${cancelText}</button>
				<button id="dialog-confirm" style="
					padding: 8px 16px;
					border: none;
					background: ${iconColor};
					color: white;
					border-radius: 6px;
					cursor: pointer;
					font-size: 14px;
					transition: all 0.2s ease;
				">${confirmText}</button>
			</div>
		`;

		return dialog;
	};

	const _showDialog = ({
		title,
		message,
		type,
		confirmText,
		cancelText = "cancelar",
	}) => {
		return new Promise((resolve) => {
			if (!container) _createContainer();

			const dialog = _createDialog({
				title,
				message,
				type,
				confirmText,
				cancelText,
			});
			container.appendChild(dialog);

			// Animar entrada
			setTimeout(() => {
				container.style.opacity = "1";
				dialog.style.transform = "scale(1)";
			}, 10);

			// Event listeners
			const confirmBtn = dialog.querySelector("#dialog-confirm");
			const cancelBtn = dialog.querySelector("#dialog-cancel");

			const cleanup = () => {
				container.style.opacity = "0";
				dialog.style.transform = "scale(0.9)";
				setTimeout(() => {
					if (dialog.parentNode) dialog.remove();
					if (container.children.length === 0) {
						container.remove();
						container = null;
					}
				}, 300);
			};

			confirmBtn.addEventListener("click", () => {
				cleanup();
				resolve(true);
			});

			cancelBtn.addEventListener("click", () => {
				cleanup();
				resolve(false);
			});

			// Cerrar con Escape
			const handleEscape = (e) => {
				if (e.key === "Escape") {
					cleanup();
					resolve(false);
					document.removeEventListener("keydown", handleEscape);
				}
			};
			document.addEventListener("keydown", handleEscape);

			// Cerrar al hacer clic fuera del diálogo
			container.addEventListener("click", (e) => {
				if (e.target === container) {
					cleanup();
					resolve(false);
				}
			});
		});
	};

	// Métodos de conveniencia
	const confirm = (message, title = "Confirmar acción") =>
		_showDialog({ title, message, type: "confirm" });

	const confirmDelete = (message, title = "Confirmar eliminación") =>
		_showDialog({
			title,
			message,
			type: "delete",
			confirmText: "Eliminar",
			cancelText: "Cancelar",
		});

	const warning = (message, title = "Advertencia") =>
		_showDialog({
			title,
			message,
			type: "warning",
			confirmText: "Entendido",
			cancelText: "Cancelar",
		});

	const info = (message, title = "Información") =>
		_showDialog({
			title,
			message,
			type: "info",
			confirmText: "OK",
			cancelText: "Cancelar",
		});

	return { confirm, confirmDelete, warning, info };
})();

// Funciones globales
window.showConfirm = (message, title) => Dialog.confirm(message, title);
window.showConfirmDelete = (message, title) =>
	Dialog.confirmDelete(message, title);
window.showWarning = (message, title) => Dialog.warning(message, title);
window.showInfo = (message, title) => Dialog.info(message, title);
