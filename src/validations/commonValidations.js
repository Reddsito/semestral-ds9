import { VALID_ORDER_STATUSES } from "../constants/orderStatus";

// Esquemas de validación comunes reutilizables
export const commonValidations = {
	// Esquema para IDs de MongoDB
	mongoId: {
		type: "string",
		pattern: "^[0-9a-fA-F]{24}$",
	},

	// Esquema para paginación
	pagination: {
		type: "object",
		properties: {
			page: {
				type: "integer",
				minimum: 1,
				default: 1,
			},
			limit: {
				type: "integer",
				minimum: 1,
				maximum: 100,
				default: 10,
			},
			sort: {
				type: "string",
				enum: ["asc", "desc"],
				default: "desc",
			},
		},
	},

	// Esquema para búsqueda
	search: {
		type: "object",
		properties: {
			q: {
				type: "string",
				minLength: 1,
			},
		},
	},

	// Esquema para filtros de fecha
	dateRange: {
		type: "object",
		properties: {
			startDate: {
				type: "string",
				format: "date",
			},
			endDate: {
				type: "string",
				format: "date",
			},
		},
	},

	// Esquema para respuesta de error
	errorResponse: {
		type: "object",
		properties: {
			success: { type: "boolean" },
			message: { type: "string" },
			error: { type: "string" },
			statusCode: { type: "integer" },
		},
	},

	// Esquema para respuesta de éxito
	successResponse: {
		type: "object",
		properties: {
			success: { type: "boolean" },
			message: { type: "string" },
			data: { type: "object" },
		},
	},

	// Esquema para validación status de pedidos
	orderStatus: {
		type: "string",
		enum: VALID_ORDER_STATUSES},
};
