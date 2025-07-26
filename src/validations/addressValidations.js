// Esquemas de validación para rutas de direcciones
export const addressValidations = {
	// Esquema para crear dirección
	createAddress: {
		body: {
			type: "object",
			required: ["name", "phone", "coordinates"],
			properties: {
				name: {
					type: "string",
					minLength: 2,
					maxLength: 100,
				},
				phone: {
					type: "string",
					pattern: "^[\\+]?[\\d\\s\\-\\(\\)]{8,}$",
				},
				notes: {
					type: "string",
					maxLength: 500,
				},
				coordinates: {
					type: "object",
					required: ["lat", "lng"],
					properties: {
						lat: {
							type: "number",
							minimum: 7.0, // Límite sur de Panamá
							maximum: 9.8, // Límite norte de Panamá
						},
						lng: {
							type: "number",
							minimum: -83.0, // Límite oeste de Panamá
							maximum: -77.0, // Límite este de Panamá
						},
					},
				},
			},
		},
	},

	// Esquema para actualizar dirección
	updateAddress: {
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					minLength: 2,
					maxLength: 100,
				},
				phone: {
					type: "string",
					pattern: "^[\\+]?[\\d\\s\\-\\(\\)]{8,}$",
				},
				notes: {
					type: "string",
					maxLength: 500,
				},
				coordinates: {
					type: "object",
					properties: {
						lat: {
							type: "number",
							minimum: 7.0,
							maximum: 9.8,
						},
						lng: {
							type: "number",
							minimum: -83.0,
							maximum: -77.0,
						},
					},
				},
			},
		},
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					pattern: "^[0-9a-fA-F]{24}$", // MongoDB ObjectId pattern
				},
			},
		},
	},

	// Esquema para obtener dirección por ID
	getAddressById: {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					pattern: "^[0-9a-fA-F]{24}$",
				},
			},
		},
	},

	// Esquema para eliminar dirección
	deleteAddress: {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					pattern: "^[0-9a-fA-F]{24}$",
				},
			},
		},
	},

	// Esquema para establecer dirección como predeterminada
	setDefaultAddress: {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					pattern: "^[0-9a-fA-F]{24}$",
				},
			},
		},
	},
};
