import { AddressController } from "../controllers/addressController.js";
import { authenticateToken } from "../middleware/auth.js";
import { addressValidations } from "../validations/addressValidations.js";

export async function addressRoutes(fastify) {
	const addressController = new AddressController();

	/**
	 * @route GET /api/addresses
	 * @desc Obtener todas las direcciones del usuario autenticado
	 * @access Private
	 */
	fastify.get(
		"/",
		{
			preHandler: authenticateToken,
		},
		addressController.getUserAddresses.bind(addressController),
	);

	/**
	 * @route GET /api/addresses/default
	 * @desc Obtener la dirección predeterminada del usuario
	 * @access Private
	 */
	fastify.get(
		"/default",
		{
			preHandler: authenticateToken,
		},
		addressController.getDefaultAddress.bind(addressController),
	);

	/**
	 * @route GET /api/addresses/:id
	 * @desc Obtener una dirección específica
	 * @access Private
	 */
	fastify.get(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: addressValidations.getAddressById,
		},
		addressController.getAddressById.bind(addressController),
	);

	/**
	 * @route POST /api/addresses
	 * @desc Crear una nueva dirección
	 * @access Private
	 */
	fastify.post(
		"/",
		{
			preHandler: authenticateToken,
			schema: addressValidations.createAddress,
		},
		addressController.createAddress.bind(addressController),
	);

	/**
	 * @route PUT /api/addresses/:id
	 * @desc Actualizar una dirección
	 * @access Private
	 */
	fastify.put(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: addressValidations.updateAddress,
		},
		addressController.updateAddress.bind(addressController),
	);

	/**
	 * @route PUT /api/addresses/:id/default
	 * @desc Establecer una dirección como predeterminada
	 * @access Private
	 */
	fastify.put(
		"/:id/default",
		{
			preHandler: authenticateToken,
			schema: addressValidations.setDefaultAddress,
		},
		addressController.setDefaultAddress.bind(addressController),
	);

	/**
	 * @route DELETE /api/addresses/:id
	 * @desc Eliminar una dirección
	 * @access Private
	 */
	fastify.delete(
		"/:id",
		{
			preHandler: authenticateToken,
			schema: addressValidations.deleteAddress,
		},
		addressController.deleteAddress.bind(addressController),
	);
}
