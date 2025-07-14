import { errorResponse } from "../utils/responseHelper.js";

// Middleware para manejar errores de validación de manera más amigable
export const validationErrorHandler = (error, request, reply) => {
	if (error.validation) {
		const validationErrors = error.validation;
		const errorMessages = [];

		// Procesar errores de validación
		validationErrors.forEach((validationError) => {
			const { keyword, instancePath, params } = validationError;
			const field = instancePath.replace("/", "");

			switch (keyword) {
				case "required":
					errorMessages.push(
						`El campo '${params.missingProperty}' es requerido`,
					);
					break;
				case "type":
					errorMessages.push(
						`El campo '${field}' debe ser de tipo ${params.type}`,
					);
					break;
				case "format":
					if (params.format === "email") {
						errorMessages.push(`El campo '${field}' debe ser un email válido`);
					} else {
						errorMessages.push(`El campo '${field}' tiene un formato inválido`);
					}
					break;
				case "minLength":
					errorMessages.push(
						`El campo '${field}' debe tener al menos ${params.limit} caracteres`,
					);
					break;
				case "maxLength":
					errorMessages.push(
						`El campo '${field}' debe tener máximo ${params.limit} caracteres`,
					);
					break;
				case "minimum":
					errorMessages.push(
						`El campo '${field}' debe ser mayor o igual a ${params.limit}`,
					);
					break;
				case "maximum":
					errorMessages.push(
						`El campo '${field}' debe ser menor o igual a ${params.limit}`,
					);
					break;
				case "pattern":
					errorMessages.push(`El campo '${field}' tiene un formato inválido`);
					break;
				case "enum":
					errorMessages.push(
						`El campo '${field}' debe ser uno de: ${params.allowedValues.join(
							", ",
						)}`,
					);
					break;
				default:
					errorMessages.push(`Error de validación en el campo '${field}'`);
			}
		});

		return reply.status(400).send(
			errorResponse("Error de validación", {
				errors: errorMessages,
				statusCode: 400,
			}),
		);
	}

	reply.send(error);
};
