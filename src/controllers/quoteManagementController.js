import { QuoteManagementService } from "../services/quoteManagementService.js";
import { QuoteService } from "../services/quoteService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import { Quote } from "../models/Quote.js";

export class QuoteManagementController {
	constructor() {
		this.quoteManagementService = new QuoteManagementService();
		this.quoteService = new QuoteService();
	}

	// Guardar cotización
	async saveQuote(request, reply) {
		try {
			console.log("🔍 saveQuote llamado con body:", request.body);

			const {
				fileId,
				materialId,
				finishId,
				quantity = 1,
				totalPrice,
				priceBreakdown,
				notes,
			} = request.body;
			const userId = request.user.userId;

			console.log("👤 UserId:", userId);
			console.log("📄 Datos recibidos:", {
				fileId,
				materialId,
				finishId,
				quantity,
				totalPrice,
				notes,
			});

			// Validar datos requeridos
			if (!fileId || !materialId || !finishId) {
				return errorResponse("Datos incompletos para cotización", {
					required: ["fileId", "materialId", "finishId"],
				});
			}

			// Crear datos de la cotización
			const quoteData = {
				userId,
				fileId,
				materialId,
				finishId,
				quantity,
				totalPrice,
				priceBreakdown,
				notes: notes || "",
			};

			console.log("📊 Datos de cotización a guardar:", quoteData);

			// Guardar cotización
			const saveResult = await this.quoteManagementService.createQuote(
				quoteData,
			);

			if (!saveResult.success) {
				console.log("❌ Error guardando cotización:", saveResult.message);
				return errorResponse(saveResult.message);
			}

			console.log("✅ Cotización guardada exitosamente");
			return {
				success: true,
				message: "Cotización guardada exitosamente",
				data: {
					quote: saveResult.data,
				},
			};
		} catch (error) {
			console.error("Error guardando cotización:", error);
			return errorResponse("Error guardando cotización", {
				error: error.message,
			});
		}
	}

	// Obtener cotizaciones del usuario
	async getUserQuotes(request, reply) {
		try {
			console.log("🔍 getUserQuotes llamado");
			const userId = request.user.userId;
			const { page = 1, limit = 10 } = request.query;

			console.log("👤 UserId:", userId);
			console.log("📄 Page:", page);
			console.log("📏 Limit:", limit);

			const result = await this.quoteManagementService.getUserQuotes(
				userId,
				parseInt(page),
				parseInt(limit),
			);

			console.log("📊 Result del servicio:", result);

			if (!result.success) {
				console.log("❌ Error en servicio:", result.message);
				return errorResponse(result.message);
			}

			console.log("✅ Enviando respuesta exitosa");
			return {
				success: true,
				message: "Cotizaciones obtenidas exitosamente",
				data: result.data,
			};
		} catch (error) {
			console.error("Error obteniendo cotizaciones del usuario:", error);
			return errorResponse("Error obteniendo cotizaciones", {
				error: error.message,
			});
		}
	}

	// Obtener todas las cotizaciones (admin) - Método mejorado con filtros y paginación
	async getAllQuotesForAdmin(request, reply) {
		try {
			const {
				page = 1,
				limit = 20,
				status = "",
				email = "",
				dateFrom = "",
				dateTo = "",
			} = request.query;
			const skip = (page - 1) * limit;

			// Construir filtros
			const filters = {};

			if (status) {
				filters.status = status;
			}

			if (dateFrom || dateTo) {
				filters.createdAt = {};
				if (dateFrom) {
					filters.createdAt.$gte = new Date(dateFrom);
				}
				if (dateTo) {
					filters.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
				}
			}

			// Construir pipeline de agregación
			const pipeline = [
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "userId",
					},
				},
				{
					$unwind: "$userId",
				},
				{
					$lookup: {
						from: "files",
						localField: "fileId",
						foreignField: "_id",
						as: "fileId",
					},
				},
				{
					$unwind: "$fileId",
				},
				{
					$lookup: {
						from: "materials",
						localField: "materialId",
						foreignField: "_id",
						as: "materialId",
					},
				},
				{
					$unwind: "$materialId",
				},
				{
					$lookup: {
						from: "finishes",
						localField: "finishId",
						foreignField: "_id",
						as: "finishId",
					},
				},
				{
					$unwind: "$finishId",
				},
			];

			// Agregar filtros al pipeline
			if (Object.keys(filters).length > 0) {
				pipeline.unshift({ $match: filters });
			}

			// Filtrar por email si se proporciona
			if (email) {
				pipeline.splice(2, 0, {
					$match: {
						"userId.email": { $regex: email, $options: "i" },
					},
				});
			}

			// Agregar paginación
			pipeline.push(
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: parseInt(limit) },
			);

			// Pipeline para contar total
			const countPipeline = [...pipeline.slice(0, -3), { $count: "total" }];

			const [quotes, countResult] = await Promise.all([
				Quote.aggregate(pipeline),
				Quote.aggregate(countPipeline),
			]);

			const total = countResult.length > 0 ? countResult[0].total : 0;

			return {
				success: true,
				message: "Cotizaciones obtenidas exitosamente",
				data: {
					quotes,
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total,
						pages: Math.ceil(total / limit),
					},
				},
			};
		} catch (error) {
			console.error("Error obteniendo cotizaciones para admin:", error);
			return errorResponse("Error obteniendo cotizaciones", {
				error: error.message,
			});
		}
	}

	// Obtener todas las cotizaciones (admin) - Método anterior para compatibilidad
	async getAllQuotes(request, reply) {
		try {
			const {
				page = 1,
				limit = 20,
				userId,
				status,
				dateFrom,
				dateTo,
			} = request.query;

			const filters = {};
			if (userId) filters.userId = userId;
			if (status) filters.status = status;
			if (dateFrom) filters.dateFrom = dateFrom;
			if (dateTo) filters.dateTo = dateTo;

			const result = await this.quoteManagementService.getAllQuotes(
				filters,
				parseInt(page),
				parseInt(limit),
			);

			if (!result.success) {
				return errorResponse(result.message);
			}

			return {
				success: true,
				message: "Cotizaciones obtenidas exitosamente",
				data: result.data,
			};
		} catch (error) {
			console.error("Error obteniendo todas las cotizaciones:", error);
			return errorResponse("Error obteniendo cotizaciones", {
				error: error.message,
			});
		}
	}

	// Obtener cotización específica
	async getQuoteById(request, reply) {
		try {
			const { quoteId } = request.params;
			const userId = request.user.role === "admin" ? null : request.user.userId;

			const result = await this.quoteManagementService.getQuoteById(
				quoteId,
				userId,
			);

			if (!result.success) {
				return errorResponse(result.message);
			}

			return {
				success: true,
				message: "Cotización obtenida exitosamente",
				data: result.data,
			};
		} catch (error) {
			console.error("Error obteniendo cotización:", error);
			return errorResponse("Error obteniendo cotización", {
				error: error.message,
			});
		}
	}

	// Eliminar cotización
	async deleteQuote(request, reply) {
		try {
			const { quoteId } = request.params;
			const userId = request.user.userId;

			const result = await this.quoteManagementService.deleteQuote(
				quoteId,
				userId,
			);

			if (!result.success) {
				return errorResponse(result.message);
			}

			return {
				success: true,
				message: result.message,
			};
		} catch (error) {
			console.error("Error eliminando cotización:", error);
			return errorResponse("Error eliminando cotización", {
				error: error.message,
			});
		}
	}

	// Obtener estadísticas de cotizaciones (admin)
	async getQuoteStats(request, reply) {
		try {
			const result = await this.quoteManagementService.getQuoteStats();

			if (!result.success) {
				return errorResponse(result.message);
			}

			return successResponse(
				"Estadísticas obtenidas exitosamente",
				result.data,
			);
		} catch (error) {
			console.error("Error obteniendo estadísticas:", error);
			return errorResponse("Error obteniendo estadísticas", {
				error: error.message,
			});
		}
	}

	// Limpiar cotizaciones expiradas (admin)
	async cleanupExpiredQuotes(request, reply) {
		try {
			const result = await this.quoteManagementService.cleanupExpiredQuotes();

			if (!result.success) {
				return errorResponse(result.message);
			}

			return successResponse("Limpieza completada", {
				modifiedCount: result.modifiedCount,
			});
		} catch (error) {
			console.error("Error limpiando cotizaciones:", error);
			return errorResponse("Error limpiando cotizaciones", {
				error: error.message,
			});
		}
	}
}
