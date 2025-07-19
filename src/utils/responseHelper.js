/**
 * Helper para estandarizar respuestas de la API
 * Formato: { success, message, result: { data, extra } }
 */

export const successResponse = (message, data = null, extra = null) => ({
	success: true,
	message,
	result: {
		data,
		extra,
	},
});

export const errorResponse = (message, data = null, extra = null) => ({
	success: false,
	message,
	result: {
		data,
		extra,
	},
});

export const standardResponse = (
	success,
	message,
	data = null,
	extra = null,
) => ({
	success,
	message,
	result: {
		data,
		extra,
	},
});
