import { authStore } from "../stores/authStore.js";

class AddressesService {
	constructor() {
		this.baseURL = "/api/v1/addresses";
	}

	/**
	 * Obtener el token de autenticación
	 */
	getAuthToken() {
		const state = authStore.getState();
		return state.token;
	}

	/**
	 * Realizar petición HTTP con autenticación
	 */
	async makeRequest(url, options = {}) {
		const token = this.getAuthToken();

		if (!token) {
			throw new Error("No hay token de autenticación");
		}

		const defaultOptions = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		};

		const mergedOptions = {
			...defaultOptions,
			...options,
			headers: {
				...defaultOptions.headers,
				...options.headers,
			},
		};

		const response = await fetch(url, mergedOptions);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Error HTTP: ${response.status}`);
		}

		return response.json();
	}

	/**
	 * Obtener todas las direcciones del usuario
	 */
	async getAllAddresses() {
		try {
			const response = await this.makeRequest(this.baseURL);
			return response;
		} catch (error) {
			console.error("Error al obtener direcciones:", error);
			throw error;
		}
	}

	/**
	 * Obtener dirección predeterminada
	 */
	async getDefaultAddress() {
		try {
			const response = await this.makeRequest(`${this.baseURL}/default`);
			return response;
		} catch (error) {
			console.error("Error al obtener dirección predeterminada:", error);
			throw error;
		}
	}

	/**
	 * Obtener una dirección específica
	 */
	async getAddressById(id) {
		try {
			const response = await this.makeRequest(`${this.baseURL}/${id}`);
			return response;
		} catch (error) {
			console.error("Error al obtener dirección:", error);
			throw error;
		}
	}

	/**
	 * Crear una nueva dirección
	 */
	async createAddress(addressData) {
		try {
			const response = await this.makeRequest(this.baseURL, {
				method: "POST",
				body: JSON.stringify(addressData),
			});
			return response;
		} catch (error) {
			console.error("Error al crear dirección:", error);
			throw error;
		}
	}

	/**
	 * Actualizar una dirección
	 */
	async updateAddress(id, addressData) {
		try {
			const response = await this.makeRequest(`${this.baseURL}/${id}`, {
				method: "PUT",
				body: JSON.stringify(addressData),
			});
			return response;
		} catch (error) {
			console.error("Error al actualizar dirección:", error);
			throw error;
		}
	}

	/**
	 * Establecer dirección como predeterminada
	 */
	async setDefaultAddress(id) {
		try {
			const response = await this.makeRequest(`${this.baseURL}/${id}/default`, {
				method: "PUT",
			});
			return response;
		} catch (error) {
			console.error("Error al establecer dirección predeterminada:", error);
			throw error;
		}
	}

	/**
	 * Eliminar una dirección
	 */
	async deleteAddress(id) {
		try {
			const response = await this.makeRequest(`${this.baseURL}/${id}`, {
				method: "DELETE",
			});
			return response;
		} catch (error) {
			console.error("Error al eliminar dirección:", error);
			throw error;
		}
	}
}

export const addressesService = new AddressesService();

// Crear instancia del servicio
