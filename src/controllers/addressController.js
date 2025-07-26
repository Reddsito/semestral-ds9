import { addressService } from "../services/addressService.js";

class AddressController {
	/**
	 * Crear una nueva dirección
	 * POST /api/addresses
	 */
	async createAddress(request, reply) {
		try {
			const userId = request.user.userId;
			const { name, phone, notes, coordinates } = request.body;

			const addressData = {
				name: name.trim(),
				phone: phone.trim(),
				notes: notes ? notes.trim() : "",
				coordinates: coordinates,
			};

			const address = await addressService.createAddress(userId, addressData);

			return reply.status(201).send({
				success: true,
				message: "Dirección creada exitosamente",
				data: { address },
			});
		} catch (error) {
			console.error("Error en createAddress:", error);
			return reply.status(400).send({
				success: false,
				message: error.message,
			});
		}
	}

	/**
	 * Obtener todas las direcciones del usuario
	 * GET /api/addresses
	 */
	async getUserAddresses(request, reply) {
		try {
			const userId = request.user.userId;
			const addresses = await addressService.getUserAddresses(userId);

			return reply.send({
				success: true,
				message: "Direcciones obtenidas exitosamente",
				data: { addresses, count: addresses.length },
			});
		} catch (error) {
			console.error("Error en getUserAddresses:", error);
			return reply.status(500).send({
				success: false,
				message: error.message,
			});
		}
	}

	/**
	 * Obtener una dirección específica
	 * GET /api/addresses/:id
	 */
	async getAddressById(request, reply) {
		try {
			const userId = request.user.userId;
			const { id } = request.params;

			const address = await addressService.getAddressById(id, userId);

			return reply.send({
				success: true,
				message: "Operación exitosa",
				data: { address },
			});
		} catch (error) {
			console.error("Error en getAddressById:", error);
			const statusCode = error.message.includes("no encontrada") ? 404 : 400;
			return reply
				.status(statusCode)
				.send({ success: false, message: error.message });
		}
	}

	/**
	 * Actualizar una dirección
	 * PUT /api/addresses/:id
	 */
	async updateAddress(request, reply) {
		try {
			const userId = request.user.userId;
			const { id } = request.params;
			const { name, phone, notes, coordinates } = request.body;

			const updateData = {};

			// Solo actualizar campos que se proporcionan
			if (name !== undefined) updateData.name = name.trim();
			if (phone !== undefined) updateData.phone = phone.trim();
			if (notes !== undefined) updateData.notes = notes.trim();

			if (coordinates) {
				const lat = parseFloat(coordinates.lat);
				const lng = parseFloat(coordinates.lng);

				if (isNaN(lat) || isNaN(lng)) {
					return reply.status(400).send({
						success: false,
						message: "Las coordenadas deben ser números válidos",
					});
				}

				updateData.coordinates = { lat, lng };
			}

			const address = await addressService.updateAddress(
				id,
				userId,
				updateData,
			);

			return reply.send({
				success: true,
				message: "Dirección actualizada exitosamente",
				data: { address },
			});
		} catch (error) {
			console.error("Error en updateAddress:", error);
			const statusCode = error.message.includes("no encontrada") ? 404 : 400;
			return reply
				.status(statusCode)
				.send({ success: false, message: error.message });
		}
	}

	/**
	 * Eliminar una dirección
	 * DELETE /api/addresses/:id
	 */
	async deleteAddress(request, reply) {
		try {
			const userId = request.user.userId;
			const { id } = request.params;

			const result = await addressService.deleteAddress(id, userId);

			return reply.send({
				success: true,
				message: "Operación exitosa",
				data: result,
			});
		} catch (error) {
			console.error("Error en deleteAddress:", error);
			const statusCode = error.message.includes("no encontrada") ? 404 : 400;
			return reply
				.status(statusCode)
				.send({ success: false, message: error.message });
		}
	}

	/**
	 * Establecer dirección como predeterminada
	 * PUT /api/addresses/:id/default
	 */
	async setDefaultAddress(request, reply) {
		try {
			const userId = request.user.userId;
			const { id } = request.params;

			const address = await addressService.setDefaultAddress(id, userId);

			return reply.send({
				success: true,
				message: "Dirección establecida como predeterminada",
				data: { address },
			});
		} catch (error) {
			console.error("Error en setDefaultAddress:", error);
			const statusCode = error.message.includes("no encontrada") ? 404 : 400;
			return reply
				.status(statusCode)
				.send({ success: false, message: error.message });
		}
	}

	/**
	 * Obtener dirección predeterminada
	 * GET /api/addresses/default
	 */
	async getDefaultAddress(request, reply) {
		try {
			const userId = request.user.userId;
			const address = await addressService.getDefaultAddress(userId);

			if (!address) {
				return reply.send({
					success: true,
					message: "No hay dirección predeterminada establecida",
					data: { address: null },
				});
			}

			return reply.send({
				success: true,
				message: "Operación exitosa",
				data: { address },
			});
		} catch (error) {
			console.error("Error en getDefaultAddress:", error);
			return reply.status(500).send({ success: false, message: error.message });
		}
	}
}

export { AddressController };
