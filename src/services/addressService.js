import { Address } from "../models/Address.js";
import { UserModel as User } from "../models/User.js";
import mongoose from "mongoose";

class AddressService {
	/**
	 * Crear una nueva dirección
	 * @param {string} userId - ID del usuario
	 * @param {Object} addressData - Datos de la dirección
	 * @returns {Promise<Object>} - Dirección creada
	 */
	async createAddress(userId, addressData) {
		try {
			// Validar que el usuario existe
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("Usuario no encontrado");
			}

			// Validar coordenadas de Panamá en el servicio también
			const { lat, lng } = addressData.coordinates;
			if (lat < 7.0 || lat > 9.8 || lng < -83.0 || lng > -77.0) {
				throw new Error(
					"La ubicación debe estar dentro del territorio de Panamá",
				);
			}

			// Crear la dirección
			const address = new Address({
				userId,
				name: addressData.name,
				phone: addressData.phone,
				notes: addressData.notes || "",
				coordinates: {
					lat: addressData.coordinates.lat,
					lng: addressData.coordinates.lng,
				},
			});

			// Si es la primera dirección del usuario, marcarla como predeterminada
			const userAddressCount = await Address.countDocuments({
				userId,
				isActive: true,
			});
			if (userAddressCount === 0) {
				address.isDefault = true;
			}

			const savedAddress = await address.save();
			return savedAddress;
		} catch (error) {
			throw new Error(`Error al crear dirección: ${error.message}`);
		}
	}

	/**
	 * Obtener todas las direcciones de un usuario
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Array>} - Lista de direcciones
	 */
	async getUserAddresses(userId) {
		try {
			const addresses = await Address.findByUser(userId);
			return addresses;
		} catch (error) {
			throw new Error(`Error al obtener direcciones: ${error.message}`);
		}
	}

	/**
	 * Obtener una dirección específica
	 * @param {string} addressId - ID de la dirección
	 * @param {string} userId - ID del usuario (para verificar propiedad)
	 * @returns {Promise<Object>} - Dirección encontrada
	 */
	async getAddressById(addressId, userId) {
		try {
			if (!mongoose.Types.ObjectId.isValid(addressId)) {
				throw new Error("ID de dirección inválido");
			}

			const address = await Address.findOne({
				_id: addressId,
				userId,
				isActive: true,
			});

			if (!address) {
				throw new Error("Dirección no encontrada");
			}

			return address;
		} catch (error) {
			throw new Error(`Error al obtener dirección: ${error.message}`);
		}
	}

	/**
	 * Actualizar una dirección
	 * @param {string} addressId - ID de la dirección
	 * @param {string} userId - ID del usuario
	 * @param {Object} updateData - Datos a actualizar
	 * @returns {Promise<Object>} - Dirección actualizada
	 */
	async updateAddress(addressId, userId, updateData) {
		try {
			if (!mongoose.Types.ObjectId.isValid(addressId)) {
				throw new Error("ID de dirección inválido");
			}

			// Validar coordenadas si se están actualizando
			if (updateData.coordinates) {
				const { lat, lng } = updateData.coordinates;
				if (lat < 7.0 || lat > 9.8 || lng < -83.0 || lng > -77.0) {
					throw new Error(
						"La ubicación debe estar dentro del territorio de Panamá",
					);
				}
			}

			const updatedAddress = await Address.findOneAndUpdate(
				{ _id: addressId, userId, isActive: true },
				{ $set: updateData },
				{ new: true, runValidators: true },
			);

			if (!updatedAddress) {
				throw new Error("Dirección no encontrada");
			}

			return updatedAddress;
		} catch (error) {
			throw new Error(`Error al actualizar dirección: ${error.message}`);
		}
	}

	/**
	 * Eliminar una dirección (soft delete)
	 * @param {string} addressId - ID de la dirección
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Object>} - Resultado de la operación
	 */
	async deleteAddress(addressId, userId) {
		try {
			if (!mongoose.Types.ObjectId.isValid(addressId)) {
				throw new Error("ID de dirección inválido");
			}

			const address = await Address.findOne({
				_id: addressId,
				userId,
				isActive: true,
			});

			if (!address) {
				throw new Error("Dirección no encontrada");
			}

			// Si es la dirección predeterminada, asignar otra como predeterminada
			if (address.isDefault) {
				const nextAddress = await Address.findOne({
					userId,
					isActive: true,
					_id: { $ne: addressId },
				}).sort({ createdAt: 1 });

				if (nextAddress) {
					nextAddress.isDefault = true;
					await nextAddress.save();
				}
			}

			// Soft delete
			address.isActive = false;
			await address.save();

			return { message: "Dirección eliminada correctamente" };
		} catch (error) {
			throw new Error(`Error al eliminar dirección: ${error.message}`);
		}
	}

	/**
	 * Establecer una dirección como predeterminada
	 * @param {string} addressId - ID de la dirección
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Object>} - Dirección actualizada
	 */
	async setDefaultAddress(addressId, userId) {
		try {
			if (!mongoose.Types.ObjectId.isValid(addressId)) {
				throw new Error("ID de dirección inválido");
			}

			// Verificar que la dirección existe y pertenece al usuario
			const address = await Address.findOne({
				_id: addressId,
				userId,
				isActive: true,
			});

			if (!address) {
				throw new Error("Dirección no encontrada");
			}

			// Quitar el default de todas las direcciones del usuario
			await Address.updateMany(
				{ userId, isActive: true },
				{ $set: { isDefault: false } },
			);

			// Establecer esta como default
			address.isDefault = true;
			await address.save();

			return address;
		} catch (error) {
			throw new Error(
				`Error al establecer dirección predeterminada: ${error.message}`,
			);
		}
	}

	/**
	 * Obtener la dirección predeterminada del usuario
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Object|null>} - Dirección predeterminada
	 */
	async getDefaultAddress(userId) {
		try {
			const defaultAddress = await Address.findOne({
				userId,
				isDefault: true,
				isActive: true,
			});

			return defaultAddress;
		} catch (error) {
			throw new Error(
				`Error al obtener dirección predeterminada: ${error.message}`,
			);
		}
	}
}

export const addressService = new AddressService();
