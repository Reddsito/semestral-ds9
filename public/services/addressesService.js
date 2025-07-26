import { authStore } from "../stores/authStore.js";
import { api } from "../lib/api.js";

class AddressesService {
	constructor() {}

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

	/**
	 * Obtener todas las direcciones del usuario
	 */
	async getAllAddresses() {
		try {
			const response = await api.get("/addresses");
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
			const response = await api.get("/addresses/default");
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
			const response = await api.get(`/addresses/${id}`);
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
		console.log({ addressData });
		try {
			const response = await api.post("/addresses", addressData);
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
			const response = await api.put(`/addresses/${id}`, addressData);
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
		console.log({ id });
		try {
			const response = await api.put(`/addresses/${id}/default`);
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
			const response = await api.delete(`/addresses/${id}`);
			return response;
		} catch (error) {
			console.error("Error al eliminar dirección:", error);
			throw error;
		}
	}
}

export const addressesService = new AddressesService();
